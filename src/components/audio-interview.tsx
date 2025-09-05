'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Mic, MicOff, Phone, PhoneOff, Pause, Play, SkipForward, Square } from 'lucide-react'
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

  // Voice Activity Detection
  const [isVoiceDetected, setIsVoiceDetected] = useState(false)
  const [, setLastSpeechTime] = useState(0)
  const silenceTimer = useRef<NodeJS.Timeout | null>(null)
  const recordingTimeout = useRef<NodeJS.Timeout | null>(null)

  // Auto-answer when user stops speaking
  const SILENCE_THRESHOLD = 2000 // 2 seconds of silence
  const MAX_RECORDING_TIME = 30000 // 30 seconds max per answer

  useEffect(() => {
    // Initialize Daily.co service
    dailyAudioService.initialize().catch((error) => {
      console.error('Failed to initialize Daily.co:', error)
      setAudioState(prev => ({ ...prev, error: error.message }))
    })

    // Set up event handlers
    dailyAudioService.onCallJoined = () => {
      setAudioState(prev => ({ ...prev, isCallActive: 'connected' }))
    }

    dailyAudioService.onCallLeft = () => {
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
        error: `Call error: ${error.errorMsg || error.message || 'Unknown error'}`,
        isCallActive: 'error'
      }))
    }

    dailyAudioService.onTranscriptReceived = handleTranscriptReceived

    return () => {
      // Cleanup
      dailyAudioService.leaveRoom().catch(console.error)
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current)
        silenceTimer.current = null
      }
      if (recordingTimeout.current) {
        clearTimeout(recordingTimeout.current)
        recordingTimeout.current = null
      }
    }
  }, [])

  const handleTranscriptReceived = useCallback((transcript: string) => {
    console.log('Transcript received:', transcript)
    
    setAudioState(prev => ({
      ...prev,
      pendingTranscript: prev.pendingTranscript + ' ' + transcript,
      currentTranscript: transcript
    }))

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

  const handleSilenceDetected = useCallback(async () => {
    const transcript = audioState.pendingTranscript.trim()
    
    if (transcript.length > 10 && !isProcessingAnswer) { // Minimum meaningful response
      console.log('Silence detected, processing answer:', transcript)
      await handleAnswerSubmit(transcript)
    }
  }, [audioState.pendingTranscript, isProcessingAnswer])

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

      // Set maximum recording time limit
      recordingTimeout.current = setTimeout(() => {
        handleAnswerSubmit(audioState.pendingTranscript || 'No response recorded')
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
    if (!answer.trim() || isProcessingAnswer) return

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
            await speakAIResponse("Thank you for completing the interview. Your responses have been recorded and evaluated. Good luck!")
            onComplete()
          }
          return
        }

        if (result.data?.nextAction === 'follow-up' && result.data?.followUpQuestion) {
          // Ask follow-up question
          await speakAIResponse(result.data.followUpQuestion)
        } else if (result.data?.nextAction === 'next-question' && result.data?.currentQuestion) {
          // Move to next question
          setCurrentQuestion(result.data.currentQuestion)
          setProgress(result.data.progress?.current || progress + 1)
          await speakAIResponse(`Next question: ${result.data.currentQuestion.question}`)
        }
      } else {
        console.error('Answer submission failed:', result)
        const errorMsg = result.error || "I'm sorry, there was an issue processing your answer."
        await speakAIResponse(`${errorMsg} Could you please try again?`)
      }

    } catch (error) {
      console.error('Error submitting answer:', error)
      await speakAIResponse("I apologize, there was a technical issue. Please check your connection and try again.")
    } finally {
      setIsProcessingAnswer(false)
      setAudioState(prev => ({ ...prev, pendingTranscript: '', currentTranscript: '' }))
    }
  }

  const speakAIResponse = async (text: string) => {
    setAudioState(prev => ({ ...prev, isSpeaking: true }))
    
    try {
      await dailyAudioService.playAIResponse(text)
    } catch (error) {
      console.error('Error playing AI response:', error)
      // Fallback: display text if TTS fails
      setAudioState(prev => ({ ...prev, error: `AI: ${text}` }))
    } finally {
      setAudioState(prev => ({ ...prev, isSpeaking: false }))
    }
  }

  const endCall = async () => {
    await dailyAudioService.leaveRoom()
    onComplete()
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

  const skipToNextQuestion = async () => {
    if (audioState.isRecording) {
      stopRecording()
    }
    
    // Clear any pending transcripts
    setAudioState(prev => ({ ...prev, pendingTranscript: '', currentTranscript: '' }))
    
    try {
      // Call the API to get the next question
      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          answer: 'SKIPPED', // Special marker to indicate question was skipped
          skipQuestion: true
        })
      })
      
      console.log('🔄 [SKIP] Response status:', response.status, response.statusText)
      
      // Enhanced JSON parsing with error handling
      let result
      try {
        const responseText = await response.text()
        console.log('🔄 [SKIP] Raw response:', responseText.substring(0, 500))
        
        if (!responseText.trim()) {
          throw new Error('Empty response from server')
        }
        
        result = JSON.parse(responseText)
        console.log('✅ [SKIP] Successfully parsed JSON:', result)
      } catch (parseError) {
        console.error('❌ [SKIP] Failed to parse JSON response:', parseError)
        console.error('❌ [SKIP] Response status:', response.status, response.statusText)
        await speakAIResponse("There was a technical issue skipping the question. Please try again or continue with your answer.")
        return
      }
      
      if (result.success) {
        if (result.data?.nextAction === 'completed') {
          if (!isCompleting) {
            setIsCompleting(true)
            console.log('🏁 Interview completed via skip, calling onComplete()')
            await speakAIResponse("Thank you for completing the interview. Your responses have been recorded and evaluated. Good luck!")
            onComplete()
          }
          return
        }

        if (result.data?.currentQuestion) {
          setCurrentQuestion(result.data.currentQuestion)
          setProgress(result.data.progress?.current || progress + 1)
          await speakAIResponse(`Moving to the next question: ${result.data.currentQuestion.question}`)
        }
      }
    } catch (error) {
      console.error('Error skipping question:', error)
      await speakAIResponse("I apologize, there was an issue skipping the question. Please try again.")
    }
  }

  const finishInterviewEarly = async () => {
    if (audioState.isRecording) {
      stopRecording()
    }
    
    await speakAIResponse("Thank you for your time. Your interview responses have been recorded and you'll receive detailed feedback shortly.")
    onComplete()
  }

  const renderCallControls = () => {
    if (audioState.isCallActive === 'connected') {
      return (
        <div className="space-y-6">
          {/* Primary Controls */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={audioState.isRecording ? stopRecording : startRecording}
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
              onClick={endCall}
              variant="outline"
              className="w-16 h-16 rounded-full border-red-500 text-red-500 hover:bg-red-50"
              title="End Call"
            >
              <PhoneOff size={24} />
            </Button>
          </div>

          {/* Secondary Controls */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={skipToNextQuestion}
              disabled={audioState.isSpeaking || isProcessingAnswer || audioState.isPaused}
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
              title="Skip to Next Question"
            >
              <SkipForward size={16} className="mr-1" />
              Next Question
            </Button>
            
            <Button
              onClick={finishInterviewEarly}
              disabled={audioState.isSpeaking || isProcessingAnswer}
              variant="outline"
              size="sm"
              className="border-gray-400 text-gray-600 hover:bg-gray-50"
              title="Finish Interview Early"
            >
              <Square size={16} className="mr-1" />
              Finish Early
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
          <li>• Speak naturally - the system will detect when you&apos;re done</li>
          <li>• Use &quot;Pause&quot; to take a break and &quot;Resume&quot; to continue</li>
          <li>• Click &quot;Next Question&quot; to skip the current question if needed</li>
          <li>• Use &quot;Finish Early&quot; to end the interview before completing all questions</li>
          <li>• Your responses are transcribed and evaluated in real-time</li>
        </ul>
      </Card>
    </div>
  )
}