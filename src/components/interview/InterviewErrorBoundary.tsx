'use client'

/**
 * Interview Error Boundary & Recovery UI Components
 * Provides user-friendly interfaces for handling interview interruptions
 */

import React, { useState, useEffect } from 'react'
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Mic, MicOff, MessageSquare, Play, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

import { 
  InterviewError, 
  InterviewErrorType
} from '@/lib/interview-error-handler'
import { 
  InterviewMode, 
  ConnectionStatus, 
  interviewConnectionManager 
} from '@/lib/interview-connection-manager'

export interface ErrorRecoveryProps {
  error: InterviewError
  onRetry: () => Promise<void>
  onFallback: (mode: InterviewMode) => Promise<void>
  onCancel: () => void
  isRetrying?: boolean
}

/**
 * Main error recovery component that handles different error types
 */
export function InterviewErrorRecovery({ 
  error, 
  onRetry, 
  onFallback, 
  onCancel, 
  isRetrying = false 
}: ErrorRecoveryProps) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const [, setRetryAttempt] = useState(0)

  const getErrorIcon = () => {
    switch (error.type) {
      case InterviewErrorType.NETWORK_TIMEOUT:
      case InterviewErrorType.CONNECTION_LOST:
        return <WifiOff className="w-8 h-8 text-red-500" />
      case InterviewErrorType.MICROPHONE_ACCESS_DENIED:
      case InterviewErrorType.AUDIO_DEVICE_ERROR:
        return <MicOff className="w-8 h-8 text-red-500" />
      case InterviewErrorType.SPEECH_RECOGNITION_FAILED:
        return <MessageSquare className="w-8 h-8 text-orange-500" />
      default:
        return <AlertTriangle className="w-8 h-8 text-red-500" />
    }
  }

  const getErrorSeverityColor = () => {
    switch (error.userImpact) {
      case 'critical': return 'text-red-700 bg-red-50 border-red-200'
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-700 bg-blue-50 border-blue-200'
    }
  }

  const handleRetryWithCountdown = async () => {
    setRetryAttempt(prev => prev + 1)
    setCountdown(3)
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev && prev <= 1) {
          clearInterval(countdownInterval)
          onRetry()
          return null
        }
        return prev ? prev - 1 : null
      })
    }, 1000)
  }

  return (
    <Card className={`border-2 ${getErrorSeverityColor()}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          {getErrorIcon()}
          <div className="flex-1">
            <CardTitle className="text-lg">
              Interview Interrupted
            </CardTitle>
            <CardDescription>
              {error.message}
            </CardDescription>
          </div>
          <Badge variant={error.userImpact === 'critical' ? 'destructive' : 'secondary'}>
            {error.userImpact.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Details */}
        <div className="text-sm text-gray-600">
          <p><strong>Error Type:</strong> {error.type.replace(/_/g, ' ')}</p>
          <p><strong>Time:</strong> {error.timestamp.toLocaleTimeString()}</p>
          {error.retryCount > 0 && (
            <p><strong>Retry Attempt:</strong> {error.retryCount}</p>
          )}
        </div>

        {/* Retry Progress */}
        {isRetrying && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Attempting recovery...</span>
            </div>
            <Progress value={66} className="w-full" />
          </div>
        )}

        {/* Countdown */}
        {countdown !== null && (
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{countdown}</div>
            <div className="text-sm text-gray-600">Retrying in {countdown} seconds...</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={handleRetryWithCountdown}
            disabled={isRetrying || countdown !== null}
            className="flex-1"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </>
            )}
          </Button>

          {/* Fallback options based on error type */}
          {error.type === InterviewErrorType.MICROPHONE_ACCESS_DENIED && (
            <Button 
              variant="outline" 
              onClick={() => onFallback(InterviewMode.TEXT_ONLY)}
              className="flex-1"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Continue with Text
            </Button>
          )}

          {(error.type === InterviewErrorType.WEBRTC_CONNECTION_FAILED || 
            error.type === InterviewErrorType.AUDIO_DEVICE_ERROR) && (
            <Button 
              variant="outline" 
              onClick={() => onFallback(InterviewMode.TEXT_ONLY)}
              className="flex-1"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Switch to Text Mode
            </Button>
          )}

          {error.type === InterviewErrorType.TTS_SERVICE_ERROR && (
            <Button 
              variant="outline" 
              onClick={() => onFallback(InterviewMode.AUDIO_INPUT_ONLY)}
              className="flex-1"
            >
              <Mic className="w-4 h-4 mr-2" />
              Audio Input Only
            </Button>
          )}

          <Button 
            variant="ghost" 
            onClick={onCancel}
            className="flex-1"
          >
            End Interview
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Connection status indicator component
 */
export function InterviewConnectionStatus() {
  const [status, setStatus] = useState(interviewConnectionManager.getStatus())
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const updateStatus = () => setStatus(interviewConnectionManager.getStatus())
    
    interviewConnectionManager.on('connect', updateStatus)
    interviewConnectionManager.on('disconnect', updateStatus)
    interviewConnectionManager.on('reconnect', updateStatus)
    interviewConnectionManager.on('degrade', updateStatus)

    return () => {
      interviewConnectionManager.off('connect', updateStatus)
      interviewConnectionManager.off('disconnect', updateStatus) 
      interviewConnectionManager.off('reconnect', updateStatus)
      interviewConnectionManager.off('degrade', updateStatus)
    }
  }, [])

  const getStatusIcon = () => {
    switch (status.connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return <Wifi className="w-4 h-4 text-green-600" />
      case ConnectionStatus.DEGRADED:
        return <Wifi className="w-4 h-4 text-yellow-600" />
      case ConnectionStatus.CONNECTING:
      case ConnectionStatus.RECONNECTING:
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
      default:
        return <WifiOff className="w-4 h-4 text-red-600" />
    }
  }

  const getStatusColor = () => {
    switch (status.connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return 'border-green-200 bg-green-50'
      case ConnectionStatus.DEGRADED:
        return 'border-yellow-200 bg-yellow-50'
      case ConnectionStatus.CONNECTING:
      case ConnectionStatus.RECONNECTING:
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-red-200 bg-red-50'
    }
  }

  const getModeIcon = () => {
    switch (status.mode) {
      case InterviewMode.FULL_AUDIO:
        return <Mic className="w-4 h-4 text-green-600" />
      case InterviewMode.AUDIO_INPUT_ONLY:
        return <Mic className="w-4 h-4 text-blue-600" />
      case InterviewMode.TEXT_ONLY:
        return <MessageSquare className="w-4 h-4 text-gray-600" />
      case InterviewMode.OFFLINE_MODE:
        return <WifiOff className="w-4 h-4 text-red-600" />
    }
  }

  return (
    <Card className={`border ${getStatusColor()} cursor-pointer`} onClick={() => setIsExpanded(!isExpanded)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">
              {status.connectionStatus.replace(/_/g, ' ')}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {getModeIcon()}
            <span className="text-xs text-gray-600">
              {status.mode.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="font-medium">Service Health</div>
                {Object.entries(status.serviceHealth).map(([service, healthy]) => (
                  <div key={service} className="flex justify-between">
                    <span>{service}:</span>
                    <span className={healthy ? 'text-green-600' : 'text-red-600'}>
                      {healthy ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
              
              <div>
                <div className="font-medium">Connection Info</div>
                <div>Reconnection attempts: {status.reconnectionAttempts}</div>
                <div>Recent events: {status.recentEvents.length}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Interview recovery suggestions component
 */
export function InterviewRecoverySuggestions({ 
  errorType, 
  onAction 
}: { 
  errorType: InterviewErrorType
  onAction: (action: string) => void 
}) {
  const getSuggestions = () => {
    switch (errorType) {
      case InterviewErrorType.MICROPHONE_ACCESS_DENIED:
        return [
          { 
            title: "Grant Microphone Access",
            description: "Click the microphone icon in your browser's address bar and allow access",
            action: "request_permission",
            icon: <Mic className="w-5 h-5 text-blue-600" />
          },
          {
            title: "Continue with Text",
            description: "Type your answers instead of speaking",
            action: "switch_to_text",
            icon: <MessageSquare className="w-5 h-5 text-gray-600" />
          }
        ]

      case InterviewErrorType.NETWORK_TIMEOUT:
        return [
          {
            title: "Check Internet Connection",
            description: "Ensure you have a stable internet connection",
            action: "check_network",
            icon: <Wifi className="w-5 h-5 text-blue-600" />
          },
          {
            title: "Reload Interview",
            description: "Refresh the page to restore connection",
            action: "reload_interview", 
            icon: <RefreshCw className="w-5 h-5 text-green-600" />
          }
        ]

      case InterviewErrorType.SPEECH_RECOGNITION_FAILED:
        return [
          {
            title: "Speak More Clearly",
            description: "Ensure you're in a quiet environment and speak directly into the microphone",
            action: "retry_audio",
            icon: <Mic className="w-5 h-5 text-blue-600" />
          },
          {
            title: "Type Your Answer",
            description: "Manually enter your response using the keyboard",
            action: "manual_input",
            icon: <MessageSquare className="w-5 h-5 text-gray-600" />
          }
        ]

      default:
        return [
          {
            title: "Try Again",
            description: "Attempt the operation again",
            action: "retry",
            icon: <RefreshCw className="w-5 h-5 text-blue-600" />
          }
        ]
    }
  }

  const suggestions = getSuggestions()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recovery Suggestions</CardTitle>
        <CardDescription>Try these steps to continue your interview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onAction(suggestion.action)}
            >
              {suggestion.icon}
              <div className="flex-1">
                <div className="font-medium text-sm">{suggestion.title}</div>
                <div className="text-xs text-gray-600 mt-1">{suggestion.description}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Interview resume prompt for when user returns to interrupted interview
 */
export function InterviewResumePrompt({
  sessionData,
  onResume,
  onRestart,
  onCancel
}: {
  sessionData: {
    position: string
    questionsAnswered: number
    totalQuestions: number
    timeElapsed: number
    lastActive: Date
  }
  onResume: () => void
  onRestart: () => void
  onCancel: () => void
}) {
  const progressPercent = (sessionData.questionsAnswered / sessionData.totalQuestions) * 100
  const timeElapsedMinutes = Math.floor(sessionData.timeElapsed / 60000)

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Clock className="w-8 h-8 text-blue-600" />
          <div>
            <CardTitle>Resume Interview?</CardTitle>
            <CardDescription>
              You have an interview in progress for {sessionData.position}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{sessionData.questionsAnswered}/{sessionData.totalQuestions} questions</span>
          </div>
          <Progress value={progressPercent} className="w-full" />
          <div className="text-xs text-gray-600">
            {progressPercent.toFixed(0)}% complete • {timeElapsedMinutes} minutes elapsed
          </div>
        </div>

        {/* Last Active */}
        <div className="text-sm text-gray-600">
          Last active: {new Date(sessionData.lastActive).toLocaleString()}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button onClick={onResume} className="flex-1">
            <Play className="w-4 h-4 mr-2" />
            Resume Interview
          </Button>
          
          <Button variant="outline" onClick={onRestart} className="flex-1">
            <RefreshCw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
          
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}