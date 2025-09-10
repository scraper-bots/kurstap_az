'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Mic, MicOff, Phone, PhoneOff, Pause, Play } from 'lucide-react'
import { dailyAudioService } from '@/lib/daily'

interface AudioInterviewProps {
  sessionId: string
  initialQuestion: {
    id: string
    question: string
    category: string
    difficulty: string
    expectedDuration: number
  }
  totalQuestions: number
  onAnswer: (answer: string) => Promise<any>
  onComplete: () => void
}

interface AudioState {
  isCallActive: false | 'connecting' | 'connected' | 'error'
  isRecording: boolean
  isSpeaking: boolean
  currentTranscript: string
  pendingTranscript: string
  roomUrl: string | null
  error: string | null
  isPaused: boolean
}

export function AudioInterview({
  sessionId,
  initialQuestion,
  totalQuestions,
  onAnswer,
  onComplete
}: AudioInterviewProps) {
  const [audioState, setAudioState] = useState<AudioState>({
    isCallActive: false,
    isRecording: false,
    isSpeaking: false,
    currentTranscript: '',
    pendingTranscript: '',
    roomUrl: null,
    error: null,
    isPaused: false
  })

  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion)
  const [progress, setProgress] = useState(1)
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const skipTimestampRef = useRef(0) // Track when skip happened to ignore subsequent transcripts
  const [operationState, setOperationState] = useState<'idle' | 'submitting' | 'skipping' | 'completing'>('idle')
  const completionSoundPlayed = useRef(false) // Prevent duplicate completion sounds

  // Helper function to ensure completion sound is only played once
  const playCompletionSound = async (message: string) => {
    if (!completionSoundPlayed.current) {
      completionSoundPlayed.current = true
      await speakAIResponse(message)
    } else {
      console.log('⚠️ Completion sound already played, skipping duplicate')
    }
  }

  const handleTranscriptReceived = useCallback((transcript: string) => {
    console.log('Transcript received:', transcript)
    
    setAudioState(prev => {
      const newPendingTranscript = prev.pendingTranscript ? prev.pendingTranscript + ' ' + transcript : transcript
      pendingTranscriptRef.current = newPendingTranscript
      return {
        ...prev,
        pendingTranscript: newPendingTranscript,
        currentTranscript: transcript
      }
    })

    // Update voice detection
    setIsVoiceDetected(true)
    setLastSpeechTime(Date.now())

    // Clear existing silence timer
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current)
      silenceTimer.current = null
    }

    // Set new silence timer
    silenceTimer.current = setTimeout(() => {
      setIsVoiceDetected(false)
      handleSilenceDetected()
    }, SILENCE_THRESHOLD)
  }, [])

  // Voice Activity Detection
  const [isVoiceDetected, setIsVoiceDetected] = useState(false)
  const [, setLastSpeechTime] = useState(0)
  const silenceTimer = useRef<NodeJS.Timeout | null>(null)
  const recordingTimeout = useRef<NodeJS.Timeout | null>(null)
  const aiSpeechEndTime = useRef<number>(0)
  const pendingTranscriptRef = useRef<string>('')

  // Auto-answer when user stops speaking
  const SILENCE_THRESHOLD = 4000 // 4 seconds of silence (increased from 2 to give more thinking time)
  const MAX_RECORDING_TIME = 45000 // 45 seconds max per answer (increased from 30)
  const AI_SPEECH_BUFFER = 3000 // 3 seconds buffer after AI finishes speaking

  useEffect(() => {
    // Initialize Daily.co service
    dailyAudioService.initialize().catch((error) => {
      console.error('Failed to initialize Daily.co:', error)
      setAudioState(prev => ({ ...prev, error: error.message }))
    })

    // Set up event handlers
    dailyAudioService.onCallJoined = () => {
      console.log('Daily.co call joined event received')
      setAudioState(prev => ({ ...prev, isCallActive: 'connected' }))
    }

    dailyAudioService.onCallLeft = () => {
      console.log('Daily.co call left event received')
      setAudioState(prev => ({ 
        ...prev, 
        isCallActive: false,
        isRecording: false 
      }))
    }

    dailyAudioService.onCallError = (error) => {
      console.error('Daily.co call error:', error)
      setAudioState(prev => ({ 
        ...prev, 
        error: `Call error: ${error.message || 'Unknown error'}`,
        isCallActive: 'error'
      }))
    }

    dailyAudioService.onTranscriptReceived = handleTranscriptReceived

    // Cleanup function to prevent memory leaks
    return () => {
      // Clear all timers
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current)
        silenceTimer.current = null
      }
      if (recordingTimeout.current) {
        clearTimeout(recordingTimeout.current)
        recordingTimeout.current = null
      }
      
      // Leave room if still connected
      if (audioState.isCallActive === 'connected') {
        dailyAudioService.leaveRoom().catch(console.error)
      }
    }
  }, [handleTranscriptReceived]) // Add handleTranscriptReceived to dependencies


  const handleSilenceDetected = useCallback(async () => {
    const transcript = pendingTranscriptRef.current.trim()
    const timeSinceAiSpoke = Date.now() - aiSpeechEndTime.current
    // Only calculate timeSinceSkip if skip actually occurred (timestamp > 0)
    const timeSinceSkip = skipTimestampRef.current > 0 ? Date.now() - skipTimestampRef.current : Infinity
    
    console.log('🔍 [DEBUG] handleSilenceDetected called!', {
      transcript: transcript.substring(0, 100) + '...',
      transcriptLength: transcript.length,
      timeSinceAiSpoke,
      timeSinceSkip: skipTimestampRef.current > 0 ? timeSinceSkip : 'N/A (no skip occurred)',
      AI_SPEECH_BUFFER,
      isRecording: audioState.isRecording,
      isProcessingAnswer,
      pendingTranscriptRef: pendingTranscriptRef.current.substring(0, 50) + '...',
      pendingTranscript: audioState.pendingTranscript.substring(0, 50) + '...'
    })
    
    // Don't process transcripts during any operation or too soon after a skip
    if (operationState !== 'idle') {
      console.log('🚫 Ignoring transcript - operation in progress:', operationState)
      return
    }
    
    if (timeSinceSkip < 3000) { // Increased to 3 second buffer after skip
      console.log('🚫 Ignoring transcript - too soon after skip', timeSinceSkip + 'ms')
      return
    }
    
    // Don't process silence too soon after AI finishes speaking
    if (timeSinceAiSpoke < AI_SPEECH_BUFFER) {
      console.log('Ignoring silence detection - too soon after AI speech', timeSinceAiSpoke)
      return
    }
    
    // Handle empty or very short responses only if we're actively recording
    if (transcript.length === 0) {
      // Only prompt if user was actively recording (not just after AI speech)
      if (audioState.isRecording) {
        console.log('No speech detected during active recording period')
        await speakAIResponse("I didn't hear any response. Could you please provide your answer to the question?")
      }
      return
    }
    
    // Filter out music notes, repeated words, stale transcripts, and audio artifacts
    const isRepeatedWord = /(\b\w+\b)(\s+\1){3,}/.test(transcript) // Detects repeated words like "difficult difficult difficult"
    
    // Only filter out EXACT matches of problematic phrases, not partial matches
    const staleTranscriptPatterns = [
      /^Thank you for watching!?$/i,
      /^Thanks for watching!?$/i, 
      /^Thank you for listening!?$/i,
      /^Thanks for listening!?$/i,
      /^Thank you\.?$/i,
      /^Thanks\.?$/i,
      /^Bye!?$/i,
      /^Goodbye!?$/i,
      /^See you later!?$/i,
      /^(um|uh|er|ah)\.?$/i,
      /^(the|a|an|and|or|but)\.?$/i, // Only single words, not in context
      /^I'm going to go to the bathroom\.?( I'm going to go to the bathroom\.?)+$/i // Specific bathroom repetition
    ]
    
    const isStaleTranscript = staleTranscriptPatterns.some(pattern => 
      pattern.test(transcript.trim())
    )
    const isAudioArtifact = transcript === '🎶' || transcript.includes('What? What? What?') || transcript.length < 3
    
    if (isAudioArtifact || isRepeatedWord || isStaleTranscript) {
      console.log('🚫 Filtered out unwanted transcript:', {
        transcript: transcript.substring(0, 50) + '...',
        reason: isAudioArtifact ? 'audio artifact' : isRepeatedWord ? 'repeated words' : 'stale transcript'
      })
      // Don't provide feedback for obvious audio artifacts to avoid more TTS
      return
    }
    
    // Only process meaningful responses (increased threshold to reduce phantom responses)
    if (transcript.length > 10 && !isProcessingAnswer) {
      // Additional check: must contain at least one word longer than 2 characters
      const hasValidWords = /\b\w{3,}\b/.test(transcript)
      if (hasValidWords) {
        console.log('Silence detected, processing answer:', transcript)
        await handleAnswerSubmit(transcript)
      } else {
        console.log('🚫 Transcript too short/no meaningful words:', transcript)
      }
    } else if (transcript.length > 2 && transcript.length <= 10) {
      // Be more selective about providing feedback for short responses
      const hasValidWords = /\b\w{3,}\b/.test(transcript)
      if (hasValidWords) {
        console.log('Short response detected:', transcript)
        await speakAIResponse("Your response seems quite brief. Would you like to elaborate further?")
      } else {
        console.log('🚫 Very short transcript ignored:', transcript)
      }
    }
  }, [audioState.isRecording, isProcessingAnswer])

  const startAudioInterview = async () => {
    try {
      setAudioState(prev => ({ ...prev, isCallActive: 'connecting', error: null }))

      // Create Daily.co room
      const roomUrl = await dailyAudioService.createRoom()
      setAudioState(prev => ({ ...prev, roomUrl }))

      // Join the room
      await dailyAudioService.joinRoom(roomUrl, 'Interviewee')

      // Start with AI greeting
      await speakAIResponse(`Hello! Welcome to your interview. I'll be asking you ${totalQuestions} questions. Let's begin with the first question: ${currentQuestion.question}`)

    } catch (error) {
      console.error('Error starting audio interview:', error)
      setAudioState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to start audio interview',
        isCallActive: 'error'
      }))
    }
  }

  const startRecording = async () => {
    try {
      await dailyAudioService.startRecording()
      setAudioState(prev => ({ 
        ...prev, 
        isRecording: true,
        pendingTranscript: '',
        currentTranscript: ''
      }))

      // Reset transcript ref and AI speech timer when user starts recording
      pendingTranscriptRef.current = ''
      aiSpeechEndTime.current = 0

      // Set maximum recording time limit
      recordingTimeout.current = setTimeout(() => {
        const currentTranscript = pendingTranscriptRef.current || 'No response recorded'
        console.log('⏰ Recording timeout reached, submitting:', currentTranscript)
        handleAnswerSubmit(currentTranscript)
      }, MAX_RECORDING_TIME)

    } catch (error) {
      console.error('Error starting recording:', error)
      setAudioState(prev => ({ ...prev, error: 'Failed to start recording' }))
    }
  }

  const stopRecording = () => {
    dailyAudioService.stopRecording()
    setAudioState(prev => ({ ...prev, isRecording: false }))
    
    if (recordingTimeout.current) {
      clearTimeout(recordingTimeout.current)
      recordingTimeout.current = null
    }
  }

  const handleAnswerSubmit = async (answer: string) => {
    console.log('🎯 [DEBUG] handleAnswerSubmit called!', {
      answer: answer.substring(0, 100) + '...',
      answerLength: answer.length,
      operationState,
      isProcessingAnswer,
      isCompleting,
      stack: new Error().stack
    })
    
    // Check if any operation is already in progress
    if (!answer.trim() || operationState !== 'idle' || isProcessingAnswer || isCompleting) {
      console.log('🚫 Answer submission blocked - operation in progress:', operationState)
      return
    }

    setOperationState('submitting')
    setIsProcessingAnswer(true)
    stopRecording()

    try {
      console.log('Submitting answer:', answer)
      
      const result = await onAnswer(answer.trim())
      
      if (result.success) {
        if (result.data?.nextAction === 'completed') {
          if (!isCompleting) {
            setIsCompleting(true)
            console.log('🏁 Interview completed, calling onComplete()')
            await playCompletionSound("Thank you for completing the interview. Your responses have been recorded and evaluated. Good luck!")
            // Add small delay to prevent multiple calls
            setTimeout(() => {
              onComplete()
            }, 1000)
          }
          return
        }

        if (result.data?.nextAction === 'next-question' && result.data?.currentQuestion) {
          // Move to next question
          console.log('➡️ Moving to next question:', result.data.currentQuestion.id)
          setCurrentQuestion(result.data.currentQuestion)
          setProgress(result.data.progress?.current || progress + 1)
          
          // Clear any queued messages and errors before speaking next question
          speechQueue.current = []
          pendingTranscriptRef.current = ''
          setAudioState(prev => ({ ...prev, error: null, pendingTranscript: '', currentTranscript: '' }))
          
          // Don't prefix with "Next question:" to avoid confusion
          await speakAIResponse(result.data.currentQuestion.question)
        }
      } else {
        console.error('Answer submission failed:', result)
        const errorMsg = result.error || "I'm sorry, there was an issue processing your answer."
        
        // Handle specific errors
        if (result.error && result.error.includes('Interview not found')) {
          console.error('🚨 Interview session lost, restarting completion flow')
          if (!isCompleting) {
            setIsCompleting(true)
            await playCompletionSound("Your interview session has been completed. Redirecting you to results...")
            setTimeout(() => {
              onComplete()
            }, 2000)
          }
          return
        }
        
        await speakAIResponse(`${errorMsg} Could you please try again?`)
      }

    } catch (error) {
      console.error('Error submitting answer:', error)
      // Check if it's a network or session error
      if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('Failed to'))) {
        await playCompletionSound("There seems to be a connection issue. Let me try to complete your interview.")
        if (!isCompleting) {
          setIsCompleting(true)
          setTimeout(() => {
            onComplete()
          }, 2000)
        }
        return
      }
      
      await speakAIResponse("I apologize, there was a technical issue. Please check your connection and try again.")
    } finally {
      setOperationState('idle')
      setIsProcessingAnswer(false)
      pendingTranscriptRef.current = ''
      setAudioState(prev => ({ ...prev, pendingTranscript: '', currentTranscript: '' }))
    }
  }

  const [isCurrentlySpeaking, setIsCurrentlySpeaking] = useState(false)
  const speechQueue = useRef<string[]>([])

  const speakAIResponse = async (text: string) => {
    // Prevent overlapping speech by queueing messages
    if (isCurrentlySpeaking) {
      console.log('⏳ Speech in progress, queuing message:', text.substring(0, 50) + '...')
      speechQueue.current.push(text)
      return
    }

    setIsCurrentlySpeaking(true)
    setAudioState(prev => ({ ...prev, isSpeaking: true }))
    
    try {
      console.log('🗣️ Speaking:', text.substring(0, 100) + '...')
      await dailyAudioService.playAIResponse(text)
      console.log('✅ Speech completed')
      
      // Mark when AI finishes speaking to prevent immediate silence detection
      aiSpeechEndTime.current = Date.now()
      
    } catch (error) {
      console.error('Error playing AI response:', error)
      // Fallback: display text if TTS fails, but clear it after a few seconds
      console.log('📝 TTS failed, displaying text fallback:', text.substring(0, 100) + '...')
      setAudioState(prev => ({ ...prev, error: text }))
      
      // Mark speech end time even on TTS failure
      aiSpeechEndTime.current = Date.now()
      
      // Clear the error after 5 seconds to keep interface clean
      setTimeout(() => {
        setAudioState(prev => ({ ...prev, error: null }))
      }, 5000)
      
      // Add delay to prevent rapid failures
      await new Promise(resolve => setTimeout(resolve, 2000))
    } finally {
      setIsCurrentlySpeaking(false)
      setAudioState(prev => ({ ...prev, isSpeaking: false }))
      
      // Process next message in queue
      if (speechQueue.current.length > 0) {
        const nextMessage = speechQueue.current.shift()
        if (nextMessage) {
          // Small delay before next message
          setTimeout(() => speakAIResponse(nextMessage), 500)
        }
      }
    }
  }

  const endCall = async () => {
    if (isCompleting) return // Prevent duplicate calls
    
    setIsCompleting(true)
    await dailyAudioService.leaveRoom()
    
    setTimeout(() => {
      onComplete()
    }, 500)
  }

  const pauseInterview = () => {
    if (audioState.isRecording) {
      stopRecording()
    }
    setAudioState(prev => ({ ...prev, isPaused: true }))
  }

  const resumeInterview = () => {
    setAudioState(prev => ({ ...prev, isPaused: false }))
  }



  // Add rate limiting for button clicks
  const [lastActionTime, setLastActionTime] = useState(0)
  const ACTION_COOLDOWN = 2000 // 2 seconds cooldown between actions

  const canPerformAction = () => {
    const now = Date.now()
    if (now - lastActionTime < ACTION_COOLDOWN) {
      console.log('⚠️ Action blocked due to rate limiting')
      return false
    }
    setLastActionTime(now)
    return true
  }

  const renderCallControls = () => {
    if (audioState.isCallActive === 'connected') {
      return (
        <div className="space-y-6">
          {/* Primary Controls */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (audioState.isRecording) {
                  stopRecording()
                } else {
                  startRecording()
                }
              }}
              disabled={audioState.isSpeaking || isProcessingAnswer || audioState.isPaused}
              className={`w-16 h-16 rounded-full ${
                audioState.isRecording 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              title={audioState.isRecording ? "Stop Recording" : "Start Recording"}
            >
              {audioState.isRecording ? <MicOff size={24} /> : <Mic size={24} />}
            </Button>
            
            <Button
              onClick={audioState.isPaused ? resumeInterview : pauseInterview}
              disabled={audioState.isSpeaking || isProcessingAnswer}
              variant="outline"
              className="w-16 h-16 rounded-full border-yellow-500 text-yellow-600 hover:bg-yellow-50"
              title={audioState.isPaused ? "Resume Interview" : "Pause Interview"}
            >
              {audioState.isPaused ? <Play size={24} /> : <Pause size={24} />}
            </Button>
            
            <Button
              onClick={() => {
                if (canPerformAction() && !isProcessingAnswer && !isCompleting) {
                  endCall()
                }
              }}
              variant="outline"
              className="w-16 h-16 rounded-full border-red-500 text-red-500 hover:bg-red-50"
              title="End Call"
            >
              <PhoneOff size={24} />
            </Button>
          </div>


          {/* Pause Status */}
          {audioState.isPaused && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
              <p className="text-yellow-800 font-medium">Interview Paused</p>
              <p className="text-yellow-600 text-sm mt-1">Click resume to continue</p>
            </div>
          )}
        </div>
      )
    }

    return (
      <Button
        onClick={startAudioInterview}
        disabled={audioState.isCallActive === 'connecting'}
        className="w-32 h-16 rounded-full bg-green-500 hover:bg-green-600"
      >
        {audioState.isCallActive === 'connecting' ? (
          'Connecting...'
        ) : (
          <>
            <Phone size={24} className="mr-2" />
            Start Call
          </>
        )}
      </Button>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Progress */}
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Audio Interview Progress</h2>
          <Progress value={(progress / totalQuestions) * 100} className="w-full" />
          <p className="text-sm text-gray-600 mt-2">
            Question {progress} of {totalQuestions}
          </p>
        </div>
      </Card>

      {/* Call Status */}
      <Card className="p-6 text-center">
        <div className="space-y-4">
          {audioState.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{audioState.error}</p>
            </div>
          )}

          {/* Current Question */}
          {currentQuestion && audioState.isCallActive === 'connected' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-800">Current Question:</h3>
              <p className="text-blue-700 mt-2">{currentQuestion.question}</p>
              <span className="inline-block bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded mt-2">
                {currentQuestion.category} • {currentQuestion.difficulty}
              </span>
            </div>
          )}

          {/* Call Controls */}
          <div className="py-8">
            {renderCallControls()}
          </div>

          {/* Voice Activity Indicator */}
          {audioState.isCallActive === 'connected' && (
            <div className="space-y-2">
              <div className={`w-4 h-4 rounded-full mx-auto ${
                isVoiceDetected ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <p className="text-sm text-gray-600">
                {audioState.isSpeaking 
                  ? 'AI is speaking...' 
                  : audioState.isRecording 
                    ? isVoiceDetected ? 'Listening...' : 'Ready to listen'
                    : 'Click microphone to answer'
                }
              </p>

              {/* Current Transcript */}
              {audioState.currentTranscript && (
                <div className="bg-gray-50 border rounded-lg p-3 mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>You said:</strong> {audioState.currentTranscript}
                  </p>
                </div>
              )}

              {/* Processing State */}
              {isProcessingAnswer && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800">Processing your answer...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-6">
        <h3 className="font-semibold mb-3">How it works:</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• Click &quot;Start Call&quot; to begin your audio interview</li>
          <li>• Listen to the AI interviewer&apos;s questions</li>
          <li>• Click the microphone to start recording your answer</li>
          <li>• Speak naturally - the system will automatically detect when you&apos;re done</li>
          <li>• <strong>Wait for the system to process your answer</strong> - don&apos;t click buttons immediately</li>
          <li>• Use &quot;Pause&quot; to take a break and &quot;Resume&quot; to continue</li>
          <li>• Your responses are transcribed and evaluated in real-time</li>
        </ul>
      </Card>
    </div>
  )
}