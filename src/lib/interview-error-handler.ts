/**
 * Comprehensive Interview Error Handling & Logging System
 * Handles all types of interruptions during interviews with recovery mechanisms
 */

export enum InterviewErrorType {
  // Network & Connectivity
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  CONNECTION_LOST = 'CONNECTION_LOST', 
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  RATE_LIMITED = 'RATE_LIMITED',
  
  // Audio System
  MICROPHONE_ACCESS_DENIED = 'MICROPHONE_ACCESS_DENIED',
  AUDIO_DEVICE_ERROR = 'AUDIO_DEVICE_ERROR',
  WEBRTC_CONNECTION_FAILED = 'WEBRTC_CONNECTION_FAILED',
  SPEECH_RECOGNITION_FAILED = 'SPEECH_RECOGNITION_FAILED',
  TTS_SERVICE_ERROR = 'TTS_SERVICE_ERROR',
  
  // Session & State
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  STATE_CORRUPTION = 'STATE_CORRUPTION',
  BROWSER_REFRESH = 'BROWSER_REFRESH',
  TAB_VISIBILITY_CHANGE = 'TAB_VISIBILITY_CHANGE',
  DEVICE_SLEEP = 'DEVICE_SLEEP',
  
  // External Services
  OPENAI_SERVICE_ERROR = 'OPENAI_SERVICE_ERROR',
  ELEVENLABS_SERVICE_ERROR = 'ELEVENLABS_SERVICE_ERROR',
  DAILY_CO_SERVICE_ERROR = 'DAILY_CO_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // User Actions
  USER_NAVIGATION = 'USER_NAVIGATION',
  USER_CANCELLATION = 'USER_CANCELLATION',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',
  
  // System
  MEMORY_PRESSURE = 'MEMORY_PRESSURE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum InterviewRecoveryAction {
  RETRY_IMMEDIATE = 'RETRY_IMMEDIATE',
  RETRY_WITH_BACKOFF = 'RETRY_WITH_BACKOFF',
  FALLBACK_TO_TEXT = 'FALLBACK_TO_TEXT',
  SAVE_AND_RESUME = 'SAVE_AND_RESUME',
  GRACEFUL_DEGRADATION = 'GRACEFUL_DEGRADATION',
  SHOW_MANUAL_INPUT = 'SHOW_MANUAL_INPUT',
  REQUEST_PERMISSION = 'REQUEST_PERMISSION',
  NO_RECOVERY = 'NO_RECOVERY'
}

export interface InterviewError {
  id: string
  type: InterviewErrorType
  message: string
  context: InterviewErrorContext
  timestamp: Date
  recoveryAction: InterviewRecoveryAction
  retryCount: number
  userImpact: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Record<string, any>
}

export interface InterviewErrorContext {
  sessionId?: string
  userId?: string
  questionIndex?: number
  stage: 'setup' | 'interview' | 'completion'
  audioState?: string
  networkInfo?: {
    online: boolean
    effectiveType?: string
    downlink?: number
  }
  deviceInfo?: {
    userAgent: string
    platform: string
    memory?: number
  }
  interviewMetadata?: {
    position: string
    difficulty: string
    totalQuestions: number
    elapsedTime: number
  }
}

export interface RecoveryStrategy {
  action: InterviewRecoveryAction
  maxRetries: number
  backoffMs: number
  fallbackAction?: InterviewRecoveryAction
  userMessage: string
  technicalDetails?: string
}

class InterviewErrorHandler {
  private static instance: InterviewErrorHandler
  private errorLog: InterviewError[] = []
  private retryAttempts: Map<string, number> = new Map()
  
  private constructor() {
    this.setupGlobalErrorHandlers()
  }
  
  static getInstance(): InterviewErrorHandler {
    if (!InterviewErrorHandler.instance) {
      InterviewErrorHandler.instance = new InterviewErrorHandler()
    }
    return InterviewErrorHandler.instance
  }

  /**
   * Main error handling method - categorizes and handles all interview errors
   */
  async handleError(
    error: Error | any,
    context: InterviewErrorContext
  ): Promise<{ error: InterviewError; strategy: RecoveryStrategy }> {
    const interviewError = this.categorizeError(error, context)
    const strategy = this.determineRecoveryStrategy(interviewError)
    
    // Log error
    this.logError(interviewError)
    
    // Send to monitoring service if available
    await this.reportError(interviewError)
    
    // Update retry counter
    this.updateRetryCount(interviewError)
    
    return { error: interviewError, strategy }
  }

  /**
   * Categorizes errors into specific interview error types
   */
  private categorizeError(error: Error | any, context: InterviewErrorContext): InterviewError {
    const errorId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    
    // Network-related errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return this.createError(errorId, InterviewErrorType.NETWORK_TIMEOUT, error, context, 'high')
    }
    
    if (error.message?.includes('rate_limit_exceeded') || error.status === 429) {
      return this.createError(errorId, InterviewErrorType.RATE_LIMITED, error, context, 'medium')
    }
    
    // Audio-related errors
    if (error.name === 'NotAllowedError' || error.message?.includes('microphone')) {
      return this.createError(errorId, InterviewErrorType.MICROPHONE_ACCESS_DENIED, error, context, 'critical')
    }
    
    if (error.message?.includes('WebRTC') || error.message?.includes('daily')) {
      return this.createError(errorId, InterviewErrorType.WEBRTC_CONNECTION_FAILED, error, context, 'high')
    }
    
    if (error.message?.includes('speech') || error.message?.includes('transcription')) {
      return this.createError(errorId, InterviewErrorType.SPEECH_RECOGNITION_FAILED, error, context, 'medium')
    }
    
    // Service-specific errors
    if (error.message?.includes('OpenAI') || error.message?.includes('openai')) {
      return this.createError(errorId, InterviewErrorType.OPENAI_SERVICE_ERROR, error, context, 'medium')
    }
    
    if (error.message?.includes('ElevenLabs') || error.message?.includes('elevenlabs')) {
      return this.createError(errorId, InterviewErrorType.ELEVENLABS_SERVICE_ERROR, error, context, 'low')
    }
    
    // Database errors
    if (error.message?.includes('Prisma') || error.message?.includes('database')) {
      return this.createError(errorId, InterviewErrorType.DATABASE_ERROR, error, context, 'high')
    }
    
    // Default to unknown error
    return this.createError(errorId, InterviewErrorType.UNKNOWN_ERROR, error, context, 'medium')
  }

  /**
   * Determines the best recovery strategy for each error type
   */
  private determineRecoveryStrategy(error: InterviewError): RecoveryStrategy {
    const strategies: Partial<Record<InterviewErrorType, RecoveryStrategy>> = {
      [InterviewErrorType.NETWORK_TIMEOUT]: {
        action: InterviewRecoveryAction.RETRY_WITH_BACKOFF,
        maxRetries: 3,
        backoffMs: 2000,
        fallbackAction: InterviewRecoveryAction.SAVE_AND_RESUME,
        userMessage: "Network connection issue. Retrying...",
        technicalDetails: "Request timed out, implementing exponential backoff"
      },
      
      [InterviewErrorType.CONNECTION_LOST]: {
        action: InterviewRecoveryAction.SAVE_AND_RESUME,
        maxRetries: 5,
        backoffMs: 1000,
        fallbackAction: InterviewRecoveryAction.FALLBACK_TO_TEXT,
        userMessage: "Connection lost. Your progress has been saved. Attempting to reconnect...",
        technicalDetails: "WebSocket/HTTP connection dropped"
      },
      
      [InterviewErrorType.MICROPHONE_ACCESS_DENIED]: {
        action: InterviewRecoveryAction.REQUEST_PERMISSION,
        maxRetries: 1,
        backoffMs: 0,
        fallbackAction: InterviewRecoveryAction.FALLBACK_TO_TEXT,
        userMessage: "Microphone access is needed for voice interviews. You can continue with text input.",
        technicalDetails: "MediaDevices.getUserMedia() permission denied"
      },
      
      [InterviewErrorType.WEBRTC_CONNECTION_FAILED]: {
        action: InterviewRecoveryAction.RETRY_WITH_BACKOFF,
        maxRetries: 3,
        backoffMs: 3000,
        fallbackAction: InterviewRecoveryAction.FALLBACK_TO_TEXT,
        userMessage: "Audio connection failed. Switching to text mode...",
        technicalDetails: "WebRTC peer connection establishment failed"
      },
      
      [InterviewErrorType.SPEECH_RECOGNITION_FAILED]: {
        action: InterviewRecoveryAction.SHOW_MANUAL_INPUT,
        maxRetries: 2,
        backoffMs: 1000,
        fallbackAction: InterviewRecoveryAction.FALLBACK_TO_TEXT,
        userMessage: "Could not process your voice. Please try speaking again or use text input.",
        technicalDetails: "Speech-to-text service error"
      },
      
      [InterviewErrorType.RATE_LIMITED]: {
        action: InterviewRecoveryAction.RETRY_WITH_BACKOFF,
        maxRetries: 5,
        backoffMs: 5000,
        fallbackAction: InterviewRecoveryAction.GRACEFUL_DEGRADATION,
        userMessage: "Service temporarily busy. Please wait a moment...",
        technicalDetails: "API rate limit exceeded, implementing backoff"
      },
      
      [InterviewErrorType.SESSION_EXPIRED]: {
        action: InterviewRecoveryAction.SAVE_AND_RESUME,
        maxRetries: 1,
        backoffMs: 0,
        userMessage: "Your session has expired. Saving progress and creating new session...",
        technicalDetails: "Authentication token expired"
      },
      
      [InterviewErrorType.TTS_SERVICE_ERROR]: {
        action: InterviewRecoveryAction.GRACEFUL_DEGRADATION,
        maxRetries: 2,
        backoffMs: 2000,
        userMessage: "Voice playback unavailable. Questions will be shown as text.",
        technicalDetails: "Text-to-speech service failure"
      },
      
      [InterviewErrorType.DATABASE_ERROR]: {
        action: InterviewRecoveryAction.RETRY_WITH_BACKOFF,
        maxRetries: 3,
        backoffMs: 2000,
        fallbackAction: InterviewRecoveryAction.SAVE_AND_RESUME,
        userMessage: "Data save error. Retrying...",
        technicalDetails: "Database connection or query failure"
      },
      
      [InterviewErrorType.USER_NAVIGATION]: {
        action: InterviewRecoveryAction.SAVE_AND_RESUME,
        maxRetries: 0,
        backoffMs: 0,
        userMessage: "Interview paused. You can resume from where you left off.",
        technicalDetails: "User navigated away from interview"
      },
      
      [InterviewErrorType.DEVICE_SLEEP]: {
        action: InterviewRecoveryAction.SAVE_AND_RESUME,
        maxRetries: 1,
        backoffMs: 0,
        userMessage: "Interview paused due to device sleep. Tap to continue.",
        technicalDetails: "Device entered sleep/lock state"
      },
      
      // Default strategy for unhandled errors
      [InterviewErrorType.UNKNOWN_ERROR]: {
        action: InterviewRecoveryAction.RETRY_IMMEDIATE,
        maxRetries: 1,
        backoffMs: 1000,
        fallbackAction: InterviewRecoveryAction.SAVE_AND_RESUME,
        userMessage: "An unexpected error occurred. Attempting to recover...",
        technicalDetails: "Unhandled exception"
      }
    }

    // Add default strategies for remaining error types
    Object.values(InterviewErrorType).forEach(errorType => {
      if (!strategies[errorType]) {
        strategies[errorType] = strategies[InterviewErrorType.UNKNOWN_ERROR]
      }
    })

    return strategies[error.type] || strategies[InterviewErrorType.UNKNOWN_ERROR]!
  }

  /**
   * Creates a standardized error object
   */
  private createError(
    id: string,
    type: InterviewErrorType,
    originalError: Error | any,
    context: InterviewErrorContext,
    userImpact: 'low' | 'medium' | 'high' | 'critical'
  ): InterviewError {
    const retryKey = `${context.sessionId}-${type}`
    const retryCount = this.retryAttempts.get(retryKey) || 0

    return {
      id,
      type,
      message: originalError.message || originalError.toString(),
      context: {
        ...context,
        networkInfo: this.getNetworkInfo(),
        deviceInfo: this.getDeviceInfo()
      },
      timestamp: new Date(),
      recoveryAction: InterviewRecoveryAction.RETRY_IMMEDIATE, // Will be overridden by strategy
      retryCount,
      userImpact,
      metadata: {
        stack: originalError.stack,
        name: originalError.name,
        code: originalError.code,
        status: originalError.status,
        url: originalError.url || window.location.href
      }
    }
  }

  /**
   * Enhanced logging with structured data
   */
  private logError(error: InterviewError): void {
    this.errorLog.push(error)
    
    // Console logging with color coding based on impact
    const colorMap = {
      low: '#28a745',      // Green
      medium: '#ffc107',   // Yellow  
      high: '#fd7e14',     // Orange
      critical: '#dc3545'  // Red
    }
    
    console.group(`🚨 Interview Error [${error.type}] - ${error.userImpact.toUpperCase()}`)
    console.log('%c' + error.message, `color: ${colorMap[error.userImpact]}; font-weight: bold`)
    console.log('Context:', error.context)
    console.log('Retry Count:', error.retryCount)
    console.log('Metadata:', error.metadata)
    console.groupEnd()
    
    // Store in localStorage for persistence across page reloads
    try {
      const existingLogs = JSON.parse(localStorage.getItem('interview_error_logs') || '[]')
      existingLogs.push(error)
      // Keep only last 50 errors
      const recentLogs = existingLogs.slice(-50)
      localStorage.setItem('interview_error_logs', JSON.stringify(recentLogs))
    } catch (e) {
      console.warn('Could not persist error log:', e)
    }
  }

  /**
   * Send error reports to external monitoring service
   */
  private async reportError(error: InterviewError): Promise<void> {
    // In production, integrate with Sentry, LogRocket, or custom monitoring
    if (process.env.NODE_ENV === 'production') {
      try {
        // Example integration point
        await fetch('/api/errors/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(error)
        })
      } catch (e) {
        console.warn('Error reporting failed:', e)
      }
    }
  }

  /**
   * Update retry counters
   */
  private updateRetryCount(error: InterviewError): void {
    const retryKey = `${error.context.sessionId}-${error.type}`
    const currentCount = this.retryAttempts.get(retryKey) || 0
    this.retryAttempts.set(retryKey, currentCount + 1)
  }

  /**
   * Get network information
   */
  private getNetworkInfo() {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection
      return {
        online: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink
      }
    }
    return { online: navigator?.onLine || true }
  }

  /**
   * Get device information
   */
  private getDeviceInfo() {
    if (typeof navigator === 'undefined') return undefined
    
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      memory: (navigator as any).deviceMemory
    }
  }

  /**
   * Setup global error handlers for unhandled errors
   */
  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        stage: 'interview', // Default stage
        userId: 'unknown'
      })
    })

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error, {
        stage: 'interview',
        userId: 'unknown'
      })
    })

    // Handle visibility changes (tab switching, device sleep)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleError(new Error('Page visibility changed to hidden'), {
          stage: 'interview',
          userId: 'unknown'
        })
      }
    })

    // Handle online/offline events
    window.addEventListener('offline', () => {
      this.handleError(new Error('Device went offline'), {
        stage: 'interview',
        userId: 'unknown'
      })
    })
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): {
    totalErrors: number
    errorsByType: Record<InterviewErrorType, number>
    criticalErrors: number
    recentErrors: InterviewError[]
  } {
    const errorsByType = {} as Record<InterviewErrorType, number>
    let criticalErrors = 0

    this.errorLog.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1
      if (error.userImpact === 'critical') {
        criticalErrors++
      }
    })

    return {
      totalErrors: this.errorLog.length,
      errorsByType,
      criticalErrors,
      recentErrors: this.errorLog.slice(-10)
    }
  }

  /**
   * Clear error logs (useful for testing)
   */
  clearErrorLogs(): void {
    this.errorLog = []
    this.retryAttempts.clear()
    localStorage.removeItem('interview_error_logs')
  }
}

export const interviewErrorHandler = InterviewErrorHandler.getInstance()