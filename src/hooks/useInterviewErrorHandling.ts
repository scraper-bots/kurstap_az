'use client'

/**
 * Custom Hook for Interview Error Handling Integration
 * Provides a unified interface for handling all interview errors and recovery
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  InterviewError, 
  InterviewErrorType,
  interviewErrorHandler 
} from '@/lib/interview-error-handler'
import { 
  InterviewMode, 
  ConnectionStatus, 
  interviewConnectionManager 
} from '@/lib/interview-connection-manager'
// Import removed to fix lint error - interviewRetryManager not used in this file
import { 
  interviewStateManager
} from '@/lib/interview-state-manager'

export interface InterviewErrorState {
  currentError: InterviewError | null
  isRecovering: boolean
  recoveryAttempts: number
  connectionStatus: ConnectionStatus
  currentMode: InterviewMode
  canRetry: boolean
  suggestedActions: string[]
}

export interface InterviewErrorHandling {
  errorState: InterviewErrorState
  handleError: (error: Error, context?: any) => Promise<void>
  retryLastOperation: () => Promise<void>
  switchMode: (mode: InterviewMode) => Promise<void>
  clearError: () => void
  performHealthCheck: () => Promise<void>
  getRecoverableSessions: () => Promise<any[]>
}

export function useInterviewErrorHandling(
  sessionId?: string,
  userId?: string
): InterviewErrorHandling {
  const [errorState, setErrorState] = useState<InterviewErrorState>({
    currentError: null,
    isRecovering: false,
    recoveryAttempts: 0,
    connectionStatus: ConnectionStatus.DISCONNECTED,
    currentMode: InterviewMode.FULL_AUDIO,
    canRetry: false,
    suggestedActions: []
  })

  const lastOperationRef = useRef<(() => Promise<any>) | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize error handling systems
  useEffect(() => {
    const initializeErrorHandling = async () => {
      try {
        // Initialize connection manager
        await interviewConnectionManager.initialize()
        
        // Setup event listeners
        const handleConnectionChange = () => {
          const status = interviewConnectionManager.getStatus()
          setErrorState(prev => ({
            ...prev,
            connectionStatus: status.connectionStatus,
            currentMode: status.mode
          }))
        }

        interviewConnectionManager.on('connect', handleConnectionChange)
        interviewConnectionManager.on('disconnect', handleConnectionChange)
        interviewConnectionManager.on('reconnect', handleConnectionChange)
        interviewConnectionManager.on('degrade', handleConnectionChange)

        // Set up state persistence
        if (sessionId && userId) {
          interviewStateManager.setupBeforeUnloadHandler()
        }

        // Initial status update
        handleConnectionChange()

        return () => {
          interviewConnectionManager.off('connect', handleConnectionChange)
          interviewConnectionManager.off('disconnect', handleConnectionChange)
          interviewConnectionManager.off('reconnect', handleConnectionChange)
          interviewConnectionManager.off('degrade', handleConnectionChange)
        }
      } catch (error) {
        console.error('Failed to initialize error handling:', error)
      }
    }

    initializeErrorHandling()
  }, [sessionId, userId])

  // Main error handler
  const handleError = useCallback(async (error: Error, context?: any) => {
    try {
      console.log('🚨 Handling interview error:', error.message)

      // Clear any existing retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }

      const errorContext = {
        sessionId,
        userId,
        stage: interviewStateManager.getCurrentState()?.stage || 'interview',
        ...context
      }

      // Process error through error handler
      const { error: processedError, strategy } = await interviewErrorHandler.handleError(
        error, 
        errorContext
      )

      // Update error state
      setErrorState(prev => ({
        ...prev,
        currentError: processedError,
        isRecovering: false,
        canRetry: strategy.maxRetries > processedError.retryCount,
        suggestedActions: getSuggestedActions(processedError)
      }))

      // Save current operation for potential retry
      if (context?.operation) {
        lastOperationRef.current = context.operation
      }

      // Handle connection-specific errors
      if (isConnectionError(processedError.type)) {
        const recoveryResult = await interviewConnectionManager.handleConnectionFailure(
          processedError.type,
          context
        )

        if (recoveryResult.recovered) {
          setErrorState(prev => ({
            ...prev,
            currentError: null,
            isRecovering: false
          }))
          return
        }

        if (recoveryResult.newMode) {
          setErrorState(prev => ({
            ...prev,
            currentMode: recoveryResult.newMode!
          }))
        }
      }

      // Auto-retry for certain error types
      if (shouldAutoRetry(processedError, strategy)) {
        await scheduleAutoRetry(processedError, strategy)
      }

      // Record interruption in state
      await interviewStateManager.recordInterruption(
        processedError.type,
        false
      )

    } catch (handlingError) {
      console.error('Error in error handler:', handlingError)
    }
  }, [sessionId, userId])

  // Retry last operation
  const retryLastOperation = useCallback(async () => {
    if (!lastOperationRef.current || !errorState.canRetry) {
      return
    }

    setErrorState(prev => ({
      ...prev,
      isRecovering: true,
      recoveryAttempts: prev.recoveryAttempts + 1
    }))

    try {
      await lastOperationRef.current()
      
      // Success - clear error
      setErrorState(prev => ({
        ...prev,
        currentError: null,
        isRecovering: false
      }))

      console.log('✅ Operation retry successful')
      
    } catch (error) {
      console.log('❌ Operation retry failed')
      await handleError(error as Error)
    }
  }, [errorState.canRetry, handleError])

  // Switch interview mode
  const switchMode = useCallback(async (mode: InterviewMode) => {
    try {
      await interviewConnectionManager.forceModeSwitch(mode, 'User requested')
      
      setErrorState(prev => ({
        ...prev,
        currentMode: mode,
        currentError: null // Clear error when switching modes
      }))

      console.log(`✅ Successfully switched to ${mode}`)
      
    } catch (error) {
      console.error('Failed to switch mode:', error)
      await handleError(error as Error, { context: 'mode_switch' })
    }
  }, [handleError])

  // Clear current error
  const clearError = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      currentError: null,
      isRecovering: false
    }))

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
  }, [])

  // Perform system health check
  const performHealthCheck = useCallback(async () => {
    try {
      // This will trigger a health check and potentially update modes
      const status = interviewConnectionManager.getStatus()
      
      setErrorState(prev => ({
        ...prev,
        connectionStatus: status.connectionStatus,
        currentMode: status.mode
      }))

      console.log('📊 Health check completed:', status)
      
    } catch (error) {
      console.error('Health check failed:', error)
      await handleError(error as Error, { context: 'health_check' })
    }
  }, [handleError])

  // Get recoverable sessions
  const getRecoverableSessions = useCallback(async () => {
    if (!userId) return []

    try {
      return await interviewStateManager.getRecoverableSessions(userId)
    } catch (error) {
      console.error('Failed to get recoverable sessions:', error)
      return []
    }
  }, [userId])

  // Helper functions
  const isConnectionError = (errorType: InterviewErrorType): boolean => {
    return [
      InterviewErrorType.NETWORK_TIMEOUT,
      InterviewErrorType.CONNECTION_LOST,
      InterviewErrorType.WEBRTC_CONNECTION_FAILED,
      InterviewErrorType.MICROPHONE_ACCESS_DENIED,
      InterviewErrorType.AUDIO_DEVICE_ERROR
    ].includes(errorType)
  }

  const shouldAutoRetry = (error: InterviewError, strategy: any): boolean => {
    return strategy.action === 'RETRY_WITH_BACKOFF' && 
           error.retryCount < strategy.maxRetries &&
           error.userImpact !== 'critical'
  }

  const scheduleAutoRetry = async (error: InterviewError, strategy: any): Promise<void> => {
    const delay = Math.min(strategy.backoffMs * Math.pow(2, error.retryCount), 30000)
    
    console.log(`⏳ Scheduling auto-retry in ${delay}ms`)
    
    retryTimeoutRef.current = setTimeout(async () => {
      if (lastOperationRef.current) {
        await retryLastOperation()
      }
    }, delay)
  }

  const getSuggestedActions = (error: InterviewError): string[] => {
    const actions: string[] = []

    switch (error.type) {
      case InterviewErrorType.MICROPHONE_ACCESS_DENIED:
        actions.push('grant_microphone_access', 'switch_to_text_mode')
        break
      case InterviewErrorType.NETWORK_TIMEOUT:
        actions.push('check_connection', 'retry_request')
        break
      case InterviewErrorType.SPEECH_RECOGNITION_FAILED:
        actions.push('retry_speaking', 'manual_input')
        break
      case InterviewErrorType.WEBRTC_CONNECTION_FAILED:
        actions.push('refresh_page', 'text_mode')
        break
      default:
        actions.push('retry_operation')
        break
    }

    return actions
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  return {
    errorState,
    handleError,
    retryLastOperation,
    switchMode,
    clearError,
    performHealthCheck,
    getRecoverableSessions
  }
}

/**
 * Higher-order component for wrapping interview components with error handling
 */
export function withInterviewErrorHandling<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  options: {
    sessionId?: string
    userId?: string
    autoRecover?: boolean
  } = {}
) {
  return function InterviewErrorBoundary(props: T) {
    const errorHandling = useInterviewErrorHandling(options.sessionId, options.userId)

    // Global error boundary effect
    useEffect(() => {
      const handleUnhandledError = (event: ErrorEvent) => {
        errorHandling.handleError(event.error, { context: 'unhandled_error' })
      }

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        errorHandling.handleError(
          new Error(event.reason), 
          { context: 'unhandled_promise_rejection' }
        )
      }

      window.addEventListener('error', handleUnhandledError)
      window.addEventListener('unhandledrejection', handleUnhandledRejection)

      return () => {
        window.removeEventListener('error', handleUnhandledError)
        window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      }
    }, [errorHandling])

    return React.createElement(WrappedComponent, {
      ...props,
      errorHandling
    } as any)
  }
}