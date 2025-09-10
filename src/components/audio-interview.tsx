'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Video, Square } from 'lucide-react'

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
  onAnswer: (answer: string) => Promise<unknown>
  onComplete: () => void
}

export function AudioInterview({
  sessionId,
  initialQuestion,
  totalQuestions,
  onComplete
}: AudioInterviewProps) {
  const [isAnswering, setIsAnswering] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion)
  const [progress, setProgress] = useState(1)
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunks = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Handle Answer button click - Start video recording
  const handleAnswerClick = async () => {
    try {
      setIsAnswering(true)
      
      // Get user media (camera + microphone) with optimized settings
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 480 }, 
          height: { ideal: 360 },
          frameRate: { ideal: 15, max: 24 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      // Setup MediaRecorder with compression options
      recordedChunks.current = []
      const options = {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 500000, // 500kbps for smaller files
        audioBitsPerSecond: 128000  // 128kbps audio
      }
      
      // Fallback options if VP9 not supported
      let mimeType = 'video/webm;codecs=vp9,opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus'
        options.mimeType = mimeType
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm'
        options.mimeType = mimeType
      }
      
      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data)
        }
      }
      
      // Start recording
      mediaRecorder.start()
      setIsRecording(true)
      
    } catch (error) {
      console.error('Error starting video recording:', error)
      alert('Failed to access camera/microphone. Please ensure permissions are granted.')
      setIsAnswering(false)
    }
  }

  // Handle Finish button click - Stop recording and analyze video
  const handleFinishClick = async () => {
    if (!isRecording || !mediaRecorderRef.current) {
      alert('Please record your answer first.')
      return
    }

    setIsProcessingAnswer(true)
    setIsRecording(false)
    
    try {
      // Stop recording
      mediaRecorderRef.current.stop()
      
      // Stop video stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      // Wait for recording to complete and get video blob
      await new Promise<void>((resolve) => {
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.onstop = async () => {
            const videoBlob = new Blob(recordedChunks.current, { type: 'video/webm' })
            
            // Check file size (limit to 25MB)
            const maxSize = 25 * 1024 * 1024 // 25MB
            if (videoBlob.size > maxSize) {
              alert(`Video file is too large (${Math.round(videoBlob.size / 1024 / 1024)}MB). Please record a shorter response.`)
              resolve()
              return
            }
            
            console.log(`Video size: ${Math.round(videoBlob.size / 1024 / 1024)}MB`)
            
            // Send video for analysis (cost-effective: analyze then discard)
            const formData = new FormData()
            formData.append('video', videoBlob)
            formData.append('sessionId', sessionId)
            
            try {
              const response = await fetch('/api/interview/analyze-video', {
                method: 'POST',
                body: formData
              })

              if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Video analysis failed: ${response.status} ${response.statusText} - ${errorText}`)
              }

              const result = await response.json()

              if (result.success) {
                // Submit analyzed results (text + emotions) to answer API
                const answerResponse = await fetch('/api/interview/answer', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sessionId: sessionId,
                    answer: result.transcript, // Extracted text from video
                    emotions: result.emotions, // Extracted emotions from video
                    videoAnalysis: result.analysis, // Additional analysis
                    skipQuestion: false
                  })
                })

                const answerResult = await answerResponse.json()

                if (answerResult.success) {
                  if (answerResult.data?.nextAction === 'completed') {
                    setTimeout(() => {
                      onComplete()
                    }, 1000)
                  } else if (answerResult.data?.currentQuestion) {
                    // Move to next question
                    setCurrentQuestion(answerResult.data.currentQuestion)
                    setProgress(answerResult.data.progress?.current || progress + 1)
                    setIsAnswering(false)
                    
                    // Clear video element
                    if (videoRef.current) {
                      videoRef.current.srcObject = null
                    }
                  }
                } else {
                  alert(answerResult.error || 'Failed to submit answer')
                }
              } else {
                alert(result.error || 'Failed to analyze video')
              }
            } catch (analysisError) {
              console.error('Error analyzing video:', analysisError)
              alert('Failed to analyze video. Please try again.')
            }
            
            resolve()
          }
        }
      })
      
    } catch (error) {
      console.error('Error finishing video answer:', error)
      alert('Failed to process video answer. Please try again.')
    } finally {
      setIsProcessingAnswer(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Progress */}
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Interview Progress</h2>
          <Progress value={(progress / totalQuestions) * 100} className="w-full" />
          <p className="text-sm text-gray-600 mt-2">
            Question {progress} of {totalQuestions}
          </p>
        </div>
      </Card>

      {/* Current Question */}
      {currentQuestion && (
        <Card className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800">Question {progress}:</h3>
            <p className="text-blue-700 mt-2 text-lg">{currentQuestion.question}</p>
            <span className="inline-block bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded mt-2">
              {currentQuestion.category} • {currentQuestion.difficulty}
            </span>
          </div>

          {/* Video Recording Interface */}
          {isAnswering && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Record Your Answer:
              </label>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-64 object-cover bg-black"
                  style={{ transform: 'scaleX(-1)' }} // Mirror effect
                />
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-white font-medium bg-black/50 px-2 py-1 rounded">
                      Recording...
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {isRecording 
                  ? 'Click "Finish" when you\'re done answering'
                  : 'Camera is ready. Speak your answer clearly.'
                }
              </p>
            </div>
          )}

          {/* Processing State */}
          {isProcessingAnswer && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800">Analyzing your video response...</p>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-4 justify-center mt-6">
            {!isAnswering ? (
              <Button
                onClick={handleAnswerClick}
                disabled={isProcessingAnswer}
                className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3"
              >
                <Video size={20} className="mr-2" />
                Answer
              </Button>
            ) : (
              <Button
                onClick={handleFinishClick}
                disabled={isProcessingAnswer || !isRecording}
                className="bg-green-600 text-white hover:bg-green-700 px-8 py-3"
              >
                <Square size={20} className="mr-2" />
                Finish
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-6">
        <h3 className="font-semibold mb-3">How it works:</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• Click <strong>&quot;Answer&quot;</strong> to start answering the current question</li>
          <li>• Type your response in the text area</li>
          <li>• Click <strong>&quot;Finish&quot;</strong> to submit your answer and move to the next question</li>
          <li>• Answer all questions to complete the interview</li>
        </ul>
      </Card>
    </div>
  )
}