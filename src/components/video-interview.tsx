'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { VideoRecordingService } from '@/lib/video-recording-service'
import { QuestionWithMetadata } from '@/lib/interview-modes-service'
import { 
  Play, 
  Pause, 
  Square, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface VideoInterviewProps {
  interviewId: string
  questions: QuestionWithMetadata[]
  estimatedDuration: number // in minutes
  onComplete: (data: {
    videoUrl: string
    duration: number
    answers: Array<{
      questionId: string
      answer: string
      timestamp: number
    }>
  }) => void
  onError: (error: string) => void
}

interface RecordingState {
  status: 'idle' | 'initializing' | 'ready' | 'recording' | 'paused' | 'stopped' | 'uploading'
  duration: number
  error?: string
}

export const VideoInterview: React.FC<VideoInterviewProps> = ({
  interviewId,
  questions,
  estimatedDuration,
  onComplete,
  onError
}) => {
  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>({
    status: 'idle',
    duration: 0
  })

  // User answers for each question
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentAnswerId, setCurrentAnswerId] = useState<string>('')

  // Video preview and recording
  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const recordingServiceRef = useRef<VideoRecordingService | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  // Initialize video recording
  useEffect(() => {
    recordingServiceRef.current = new VideoRecordingService()
    return () => {
      cleanup()
    }
  }, [])

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    if (recordingServiceRef.current) {
      recordingServiceRef.current.cleanup()
    }
  }

  const initializeCamera = async () => {
    try {
      setRecordingState({ status: 'initializing', duration: 0 })
      
      if (!recordingServiceRef.current) {
        throw new Error('Recording service not available')
      }

      await recordingServiceRef.current.initialize()
      
      // Show video preview
      const stream = recordingServiceRef.current.getVideoStream()
      if (videoPreviewRef.current && stream) {
        videoPreviewRef.current.srcObject = stream
      }

      setRecordingState({ status: 'ready', duration: 0 })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize camera'
      setRecordingState({ status: 'idle', duration: 0, error: errorMessage })
      onError(errorMessage)
    }
  }

  const startRecording = async () => {
    try {
      if (!recordingServiceRef.current) {
        throw new Error('Recording service not available')
      }

      await recordingServiceRef.current.startRecording()
      startTimeRef.current = Date.now()
      
      // Start timer
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setRecordingState(prev => ({ ...prev, duration: elapsed }))
      }, 1000)

      setRecordingState(prev => ({ ...prev, status: 'recording' }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording'
      setRecordingState(prev => ({ ...prev, error: errorMessage }))
      onError(errorMessage)
    }
  }

  const pauseRecording = () => {
    if (recordingServiceRef.current) {
      recordingServiceRef.current.pauseRecording()
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setRecordingState(prev => ({ ...prev, status: 'paused' }))
    }
  }

  const resumeRecording = () => {
    if (recordingServiceRef.current) {
      recordingServiceRef.current.resumeRecording()
      
      // Resume timer
      const pausedDuration = recordingState.duration
      startTimeRef.current = Date.now() - (pausedDuration * 1000)
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setRecordingState(prev => ({ ...prev, duration: elapsed }))
      }, 1000)

      setRecordingState(prev => ({ ...prev, status: 'recording' }))
    }
  }

  const stopRecording = async () => {
    try {
      if (!recordingServiceRef.current) {
        throw new Error('Recording service not available')
      }

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      setRecordingState(prev => ({ ...prev, status: 'stopped' }))

      const { blob, metrics } = await recordingServiceRef.current.stopRecording()
      
      console.log('🎬 Recording completed:', metrics)

      // Upload video
      setRecordingState(prev => ({ ...prev, status: 'uploading' }))
      
      const uploadResult = await recordingServiceRef.current.uploadVideo(blob, interviewId)
      
      // Prepare answers data
      const answersArray = questions.map(question => ({
        questionId: question.id,
        answer: answers[question.id] || '',
        timestamp: Math.floor(Math.random() * recordingState.duration) // Mock timestamp
      }))

      onComplete({
        videoUrl: uploadResult.videoUrl,
        duration: recordingState.duration,
        answers: answersArray
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop recording'
      setRecordingState(prev => ({ ...prev, status: 'recording', error: errorMessage }))
      onError(errorMessage)
    }
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusIcon = () => {
    switch (recordingState.status) {
      case 'ready':
        return <Video className="h-5 w-5" />
      case 'recording':
        return <Mic className="h-5 w-5 text-red-500 animate-pulse" />
      case 'paused':
        return <Pause className="h-5 w-5 text-yellow-500" />
      case 'uploading':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <VideoOff className="h-5 w-5" />
    }
  }

  const getStatusText = () => {
    switch (recordingState.status) {
      case 'idle':
        return 'Click "Setup Camera" to begin'
      case 'initializing':
        return 'Initializing camera...'
      case 'ready':
        return 'Ready to record'
      case 'recording':
        return 'Recording in progress'
      case 'paused':
        return 'Recording paused'
      case 'stopped':
        return 'Recording completed'
      case 'uploading':
        return 'Uploading video...'
      default:
        return 'Unknown status'
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Interview</h1>
        <p className="text-gray-600">
          Complete all {questions.length} questions in approximately {estimatedDuration} minutes
        </p>
      </div>

      {/* Video Preview and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Video Recording
          </CardTitle>
          <CardDescription>{getStatusText()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Video Preview */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <video
              ref={videoPreviewRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Recording Overlay */}
            {recordingState.status === 'recording' && (
              <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                REC
              </div>
            )}

            {/* Duration Overlay */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatTime(recordingState.duration)}
            </div>

            {/* Error Overlay */}
            {recordingState.error && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className="text-center text-white">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 text-red-400" />
                  <p className="text-lg font-semibold mb-2">Error</p>
                  <p className="text-sm">{recordingState.error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-3">
            {recordingState.status === 'idle' && (
              <Button onClick={initializeCamera} className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Setup Camera
              </Button>
            )}

            {recordingState.status === 'ready' && (
              <Button onClick={startRecording} className="flex items-center gap-2 bg-red-600 hover:bg-red-700">
                <Play className="h-4 w-4" />
                Start Recording
              </Button>
            )}

            {recordingState.status === 'recording' && (
              <>
                <Button onClick={pauseRecording} variant="outline" className="flex items-center gap-2">
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
                <Button onClick={stopRecording} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900">
                  <Square className="h-4 w-4" />
                  Stop & Submit
                </Button>
              </>
            )}

            {recordingState.status === 'paused' && (
              <>
                <Button onClick={resumeRecording} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                  <Play className="h-4 w-4" />
                  Resume
                </Button>
                <Button onClick={stopRecording} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900">
                  <Square className="h-4 w-4" />
                  Stop & Submit
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Questions</CardTitle>
          <CardDescription>
            Review all questions below. You can answer them in any order during your recording.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{question.question}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="bg-gray-100 px-2 py-1 rounded">{question.category}</span>
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        Difficulty: {question.difficulty}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.round(question.expectedDuration / 60)}min expected
                      </span>
                    </div>

                    {/* Keywords */}
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Key topics to consider:</p>
                      <div className="flex flex-wrap gap-1">
                        {question.keywords.map(keyword => (
                          <span key={keyword} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Evaluation Criteria */}
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Evaluation criteria:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {question.evaluationCriteria.map((criteria, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {criteria}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Notes Field */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Your notes (optional):
                      </label>
                      <textarea
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder="Jot down key points you want to mention..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-vertical"
                        rows={2}
                        onFocus={() => setCurrentAnswerId(question.id)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Recording Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Before Recording:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Ensure good lighting on your face</li>
                <li>• Check your microphone and camera</li>
                <li>• Find a quiet, professional background</li>
                <li>• Review all questions thoroughly</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">During Recording:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Maintain eye contact with camera</li>
                <li>• Speak clearly and at moderate pace</li>
                <li>• Take brief pauses between questions</li>
                <li>• Use structured answers (STAR method)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}