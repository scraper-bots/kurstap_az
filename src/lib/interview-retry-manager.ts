/**
 * Interview Retry Manager with Exponential Backoff
 * Handles automatic retries for failed operations during interviews
 */

import { interviewErrorHandler } from './interview-error-handler'

export interface RetryOptions {
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs: number
  backoffFactor: number
  jitterMs?: number
  retryCondition?: (error: any) => boolean
  onRetry?: (attempt: number, error: any) => void
  onMaxRetriesExceeded?: (error: any) => void
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: any
  attempts: number
  totalTime: number
}

export interface CircuitBreakerOptions {
  failureThreshold: number
  recoveryTimeMs: number
  monitoringWindowMs: number
}

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, rejecting calls
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

/**
 * Circuit Breaker for external service protection
 */
class CircuitBreaker {
  private state = CircuitState.CLOSED
  private failureCount = 0
  private lastFailureTime = 0
  private successCount = 0
  
  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(operation: () => Promise<T>, serviceName: string): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.options.recoveryTimeMs) {
        this.state = CircuitState.HALF_OPEN
        this.successCount = 0
        console.log(`🔄 Circuit breaker for ${serviceName} switching to HALF_OPEN`)
      } else {
        throw new Error(`Circuit breaker is OPEN for ${serviceName}. Service unavailable.`)
      }
    }

    try {
      const result = await operation()
      this.onSuccess(serviceName)
      return result
    } catch (error) {
      this.onFailure(error, serviceName)
      throw error
    }
  }

  private onSuccess(serviceName: string) {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++
      if (this.successCount >= 3) { // Require 3 successes to close
        this.state = CircuitState.CLOSED
        this.failureCount = 0
        console.log(`✅ Circuit breaker for ${serviceName} closed - service recovered`)
      }
    } else {
      this.failureCount = Math.max(0, this.failureCount - 1) // Gradually reduce failure count
    }
  }

  private onFailure(error: any, serviceName: string) {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN
      console.error(`🚨 Circuit breaker for ${serviceName} opened - ${this.failureCount} failures`)
    }
  }

  getState(): { state: CircuitState; failureCount: number; lastFailureTime: number } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    }
  }

  reset() {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = 0
  }
}

/**
 * Advanced retry manager with multiple strategies
 */
class InterviewRetryManager {
  private static instance: InterviewRetryManager
  private circuitBreakers = new Map<string, CircuitBreaker>()
  
  // Default retry configurations for different operation types
  private defaultConfigs: Record<string, RetryOptions> = {
    api_call: {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      backoffFactor: 2,
      jitterMs: 100,
      retryCondition: (error) => this.isRetryableError(error)
    },
    audio_operation: {
      maxAttempts: 5,
      baseDelayMs: 500,
      maxDelayMs: 5000,
      backoffFactor: 1.5,
      jitterMs: 200,
      retryCondition: (error) => !error.message?.includes('permission')
    },
    database_operation: {
      maxAttempts: 4,
      baseDelayMs: 2000,
      maxDelayMs: 20000,
      backoffFactor: 2.5,
      jitterMs: 300,
      retryCondition: (error) => error.code !== 'ECONNREFUSED'
    },
    transcription: {
      maxAttempts: 3,
      baseDelayMs: 2000,
      maxDelayMs: 15000,
      backoffFactor: 2,
      jitterMs: 500,
      retryCondition: (error) => error.status !== 403 // Don't retry permission errors
    },
    tts_generation: {
      maxAttempts: 2,
      baseDelayMs: 3000,
      maxDelayMs: 10000,
      backoffFactor: 2,
      jitterMs: 1000
    }
  }

  static getInstance(): InterviewRetryManager {
    if (!InterviewRetryManager.instance) {
      InterviewRetryManager.instance = new InterviewRetryManager()
    }
    return InterviewRetryManager.instance
  }

  /**
   * Execute operation with retry logic and circuit breaker protection
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationType: string = 'api_call',
    customOptions?: Partial<RetryOptions>,
    serviceName?: string
  ): Promise<RetryResult<T>> {
    const options = { ...this.defaultConfigs[operationType], ...customOptions }
    const startTime = Date.now()
    // Remove unused variables that were causing lint errors

    // Use circuit breaker if service name provided
    if (serviceName) {
      const circuitBreaker = this.getOrCreateCircuitBreaker(serviceName)
      
      try {
        const result = await circuitBreaker.execute(
          () => this.retryLoop(operation, options),
          serviceName
        )
        return {
          success: true,
          data: result.data,
          attempts: result.attempts,
          totalTime: Date.now() - startTime
        }
      } catch (error) {
        return {
          success: false,
          error,
          attempts: options.maxAttempts,
          totalTime: Date.now() - startTime
        }
      }
    }

    // Direct retry without circuit breaker
    const result = await this.retryLoop(operation, options)
    return {
      ...result,
      totalTime: Date.now() - startTime
    }
  }

  /**
   * Main retry loop with exponential backoff
   */
  private async retryLoop<T>(
    operation: () => Promise<T>,
    options: RetryOptions
  ): Promise<{ success: boolean; data?: T; error?: any; attempts: number }> {
    let attempts = 0
    let lastError: any

    while (attempts < options.maxAttempts) {
      attempts++

      try {
        const result = await operation()
        console.log(`✅ Operation succeeded on attempt ${attempts}`)
        return { success: true, data: result, attempts }
      } catch (error) {
        lastError = error
        console.log(`❌ Operation failed on attempt ${attempts}:`, (error as any)?.message || error)

        // Check if error should be retried
        if (options.retryCondition && !options.retryCondition(error)) {
          console.log('🚫 Error not retryable, stopping attempts')
          break
        }

        // Don't wait after the last attempt
        if (attempts < options.maxAttempts) {
          const delay = this.calculateDelay(attempts, options)
          console.log(`⏳ Waiting ${delay}ms before retry ${attempts + 1}`)
          
          // Call retry callback if provided
          options.onRetry?.(attempts, error)
          
          await this.sleep(delay)
        }
      }
    }

    // All attempts exhausted
    console.error(`🔴 Operation failed after ${attempts} attempts`)
    options.onMaxRetriesExceeded?.(lastError)
    
    return { success: false, error: lastError, attempts }
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number, options: RetryOptions): number {
    const exponentialDelay = options.baseDelayMs * Math.pow(options.backoffFactor, attempt - 1)
    const delayWithJitter = exponentialDelay + (options.jitterMs ? Math.random() * options.jitterMs : 0)
    return Math.min(delayWithJitter, options.maxDelayMs)
  }

  /**
   * Determine if error should be retried
   */
  private isRetryableError(error: any): boolean {
    // Network timeouts and connection errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) return true
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true
    
    // HTTP status codes that should be retried
    const retryableStatuses = [408, 429, 502, 503, 504]
    if (error.status && retryableStatuses.includes(error.status)) return true
    
    // Rate limiting
    if (error.message?.includes('rate_limit_exceeded')) return true
    
    // Temporary service errors
    if (error.message?.includes('temporarily unavailable')) return true
    
    // Don't retry authentication, permission, or validation errors
    const nonRetryableStatuses = [400, 401, 403, 404, 422]
    if (error.status && nonRetryableStatuses.includes(error.status)) return false
    
    return false
  }

  /**
   * Get or create circuit breaker for service
   */
  private getOrCreateCircuitBreaker(serviceName: string): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      const options: CircuitBreakerOptions = {
        failureThreshold: 5,
        recoveryTimeMs: 60000, // 1 minute
        monitoringWindowMs: 300000 // 5 minutes
      }
      
      this.circuitBreakers.set(serviceName, new CircuitBreaker(options))
    }
    
    return this.circuitBreakers.get(serviceName)!
  }

  /**
   * Specialized retry methods for common interview operations
   */

  async retryApiCall<T>(apiCall: () => Promise<T>, context: string): Promise<T> {
    const result = await this.executeWithRetry(
      apiCall,
      'api_call',
      {
        onRetry: (attempt, error) => {
          console.log(`🔄 Retrying ${context} (attempt ${attempt}):`, error.message)
        },
        onMaxRetriesExceeded: (error) => {
          interviewErrorHandler.handleError(error, {
            stage: 'interview',
            userId: 'unknown'
          })
        }
      },
      context
    )

    if (!result.success) {
      throw result.error
    }

    return result.data!
  }

  async retryAudioOperation<T>(audioOp: () => Promise<T>, context: string): Promise<T> {
    const result = await this.executeWithRetry(
      audioOp,
      'audio_operation',
      {
        onRetry: (attempt) => {
          console.log(`🎤 Retrying audio operation ${context} (attempt ${attempt})`)
        }
      }
    )

    if (!result.success) {
      throw result.error
    }

    return result.data!
  }

  async retryTranscription(transcribeOp: () => Promise<any>): Promise<any> {
    return this.retryApiCall(transcribeOp, 'speech-transcription')
  }

  async retryTTSGeneration(ttsOp: () => Promise<any>): Promise<any> {
    return this.executeWithRetry(
      ttsOp,
      'tts_generation',
      {},
      'elevenlabs-tts'
    )
  }

  async retryDatabaseOperation<T>(dbOp: () => Promise<T>): Promise<T> {
    return this.retryApiCall(dbOp, 'database')
  }

  /**
   * Helper method to add delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get circuit breaker status for monitoring
   */
  getCircuitBreakerStatus(): Record<string, any> {
    const status: Record<string, any> = {}
    
    this.circuitBreakers.forEach((breaker, serviceName) => {
      status[serviceName] = breaker.getState()
    })
    
    return status
  }

  /**
   * Reset all circuit breakers (useful for testing)
   */
  resetAllCircuitBreakers(): void {
    this.circuitBreakers.forEach(breaker => breaker.reset())
  }

  /**
   * Create custom retry configuration
   */
  createCustomRetryConfig(
    maxAttempts: number,
    baseDelayMs: number,
    options?: {
      maxDelayMs?: number
      backoffFactor?: number
      jitterMs?: number
      retryCondition?: (error: any) => boolean
    }
  ): RetryOptions {
    return {
      maxAttempts,
      baseDelayMs,
      maxDelayMs: options?.maxDelayMs || baseDelayMs * 10,
      backoffFactor: options?.backoffFactor || 2,
      jitterMs: options?.jitterMs,
      retryCondition: options?.retryCondition || this.isRetryableError.bind(this)
    }
  }

  /**
   * Batch retry for multiple operations
   */
  async retryBatch<T>(
    operations: (() => Promise<T>)[],
    operationType: string = 'api_call',
    concurrency: number = 3
  ): Promise<Array<{ success: boolean; data?: T; error?: any; index: number }>> {
    const results: Array<{ success: boolean; data?: T; error?: any; index: number }> = []
    
    // Process operations in batches
    for (let i = 0; i < operations.length; i += concurrency) {
      const batch = operations.slice(i, i + concurrency)
      const batchPromises = batch.map(async (op, batchIndex) => {
        const globalIndex = i + batchIndex
        try {
          const result = await this.executeWithRetry(op, operationType)
          return { ...result, index: globalIndex }
        } catch (error) {
          return { success: false, error, index: globalIndex, attempts: 0, totalTime: 0 }
        }
      })
      
      const batchResults = await Promise.allSettled(batchPromises)
      results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason, index: -1, attempts: 0, totalTime: 0 }))
    }
    
    return results
  }
}

export const interviewRetryManager = InterviewRetryManager.getInstance()