// Advanced retry service with exponential backoff and circuit breaker
export interface RetryOptions {
  maxAttempts?: number
  baseDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryCondition?: (error: any) => boolean
  onRetry?: (attempt: number, error: any) => void
}

export class RetryService {
  private static readonly DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryCondition: (error: any) => {
      // Retry on network errors, timeouts, and 5xx server errors
      return (
        error?.code === 'ENOTFOUND' ||
        error?.code === 'ECONNREFUSED' ||
        error?.code === 'ETIMEDOUT' ||
        error?.status >= 500 ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('fetch')
      )
    },
    onRetry: () => {}
  }

  /**
   * Execute a function with retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const config = { ...this.DEFAULT_OPTIONS, ...options }
    let lastError: any
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${config.maxAttempts}`)
        return await operation()
      } catch (error) {
        lastError = error
        
        // Don't retry if it's the last attempt or retry condition is not met
        if (attempt === config.maxAttempts || !config.retryCondition(error)) {
          console.error(`❌ Operation failed after ${attempt} attempts:`, error)
          throw error
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        )
        
        console.warn(`⚠️ Attempt ${attempt} failed, retrying in ${delay}ms:`, (error as Error)?.message || error)
        config.onRetry(attempt, error)
        
        await this.delay(delay)
      }
    }
    
    throw lastError
  }

  /**
   * Delay execution for a given number of milliseconds
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Circuit breaker implementation for preventing cascading failures
export class CircuitBreaker {
  private failures = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  private nextAttempt = 0

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN - service unavailable')
      }
      this.state = 'HALF_OPEN'
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failures = 0
    this.state = 'CLOSED'
    console.log('✅ Circuit breaker: Operation successful')
  }

  private onFailure() {
    this.failures++
    console.warn(`⚠️ Circuit breaker: Failure ${this.failures}/${this.threshold}`)
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN'
      this.nextAttempt = Date.now() + this.timeout
      console.error('🔴 Circuit breaker: OPEN - service temporarily unavailable')
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      threshold: this.threshold,
      nextAttempt: this.nextAttempt
    }
  }
}

// Graceful degradation service
export class GracefulDegradationService {
  private static fallbacks = new Map<string, () => Promise<any>>()
  private static serviceStatus = new Map<string, {
    available: boolean
    lastCheck: number
    consecutiveFailures: number
  }>()

  /**
   * Register a fallback function for a service
   */
  static registerFallback(serviceName: string, fallbackFunction: () => Promise<any>) {
    this.fallbacks.set(serviceName, fallbackFunction)
    this.serviceStatus.set(serviceName, {
      available: true,
      lastCheck: Date.now(),
      consecutiveFailures: 0
    })
  }

  /**
   * Execute service with fallback on failure
   */
  static async executeWithFallback<T>(
    serviceName: string,
    primaryOperation: () => Promise<T>,
    options: {
      fallbackAfterFailures?: number
      healthCheckInterval?: number
    } = {}
  ): Promise<T> {
    const { fallbackAfterFailures = 3, healthCheckInterval = 30000 } = options
    const status = this.serviceStatus.get(serviceName)
    
    if (!status) {
      throw new Error(`Service ${serviceName} not registered`)
    }

    // Use fallback if service is known to be unavailable
    if (!status.available && Date.now() - status.lastCheck < healthCheckInterval) {
      console.warn(`⚠️ Using fallback for ${serviceName} (service unavailable)`)
      return this.executeFallback(serviceName)
    }

    try {
      const result = await primaryOperation()
      
      // Mark service as available on success
      if (!status.available) {
        console.log(`✅ Service ${serviceName} is back online`)
        status.available = true
        status.consecutiveFailures = 0
      }
      status.lastCheck = Date.now()
      
      return result
    } catch (error) {
      status.consecutiveFailures++
      status.lastCheck = Date.now()
      
      console.error(`❌ Service ${serviceName} failed (${status.consecutiveFailures} consecutive failures):`, error)
      
      // Mark service as unavailable after threshold failures
      if (status.consecutiveFailures >= fallbackAfterFailures) {
        status.available = false
        console.warn(`🔄 Switching to fallback for ${serviceName}`)
      }
      
      // Use fallback if service is marked unavailable
      if (!status.available) {
        return this.executeFallback(serviceName)
      }
      
      throw error
    }
  }

  private static async executeFallback<T>(serviceName: string): Promise<T> {
    const fallback = this.fallbacks.get(serviceName)
    if (!fallback) {
      throw new Error(`No fallback registered for service ${serviceName}`)
    }
    
    try {
      return await fallback()
    } catch (error) {
      console.error(`❌ Fallback failed for ${serviceName}:`, error)
      throw new Error(`Both primary service and fallback failed for ${serviceName}`)
    }
  }

  /**
   * Get status of all registered services
   */
  static getServicesStatus() {
    const status: Record<string, any> = {}
    for (const [serviceName, serviceStatus] of Array.from(this.serviceStatus.entries())) {
      status[serviceName] = {
        ...serviceStatus,
        lastCheckAgo: Date.now() - serviceStatus.lastCheck
      }
    }
    return status
  }
}

// Offline mode support
export class OfflineModeService {
  private static offlineQueue: Array<{
    id: string
    operation: () => Promise<any>
    data: any
    timestamp: number
    retryCount: number
  }> = []

  private static isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
  private static maxQueueSize = 100
  private static maxRetries = 3

  static {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this))
      window.addEventListener('offline', this.handleOffline.bind(this))
    }
  }

  /**
   * Queue operation for execution when online
   */
  static queueOperation(
    id: string,
    operation: () => Promise<any>,
    data: any
  ): void {
    if (this.offlineQueue.length >= this.maxQueueSize) {
      // Remove oldest operation
      this.offlineQueue.shift()
      console.warn('⚠️ Offline queue full, removed oldest operation')
    }

    this.offlineQueue.push({
      id,
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0
    })

    console.log(`📦 Queued operation for offline mode: ${id}`)
    this.saveQueueToStorage()
  }

  /**
   * Execute operation with offline fallback
   */
  static async executeWithOfflineSupport<T>(
    operationId: string,
    operation: () => Promise<T>,
    data: any,
    fallbackData?: T
  ): Promise<T> {
    if (!this.isOnline) {
      this.queueOperation(operationId, operation, data)
      if (fallbackData !== undefined) {
        console.log(`📱 Using fallback data for offline operation: ${operationId}`)
        return fallbackData
      }
      throw new Error('Operation queued for execution when online')
    }

    try {
      return await operation()
    } catch (error) {
      // If operation fails and we have fallback data, use it
      if (fallbackData !== undefined) {
        this.queueOperation(operationId, operation, data)
        console.log(`📱 Using fallback data after operation failure: ${operationId}`)
        return fallbackData
      }
      throw error
    }
  }

  private static async handleOnline() {
    console.log('🌐 Connection restored, processing offline queue')
    this.isOnline = true
    
    const operations = [...this.offlineQueue]
    this.offlineQueue = []
    
    for (const op of operations) {
      try {
        await op.operation()
        console.log(`✅ Offline operation completed: ${op.id}`)
      } catch (error) {
        op.retryCount++
        if (op.retryCount < this.maxRetries) {
          this.offlineQueue.push(op)
          console.warn(`⚠️ Offline operation failed, requeued: ${op.id} (retry ${op.retryCount})`)
        } else {
          console.error(`❌ Offline operation failed permanently: ${op.id}`, error)
        }
      }
    }
    
    this.saveQueueToStorage()
  }

  private static handleOffline() {
    console.log('📱 Connection lost, entering offline mode')
    this.isOnline = false
  }

  private static saveQueueToStorage() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('offline-queue', JSON.stringify(this.offlineQueue.map(op => ({
        id: op.id,
        data: op.data,
        timestamp: op.timestamp,
        retryCount: op.retryCount
      }))))
    }
  }

  private static loadQueueFromStorage() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('offline-queue')
      if (stored) {
        try {
          const data = JSON.parse(stored)
          // Note: Operations cannot be serialized, so they need to be re-registered
          console.log(`📦 Found ${data.length} operations in offline queue`)
        } catch (error) {
          console.error('❌ Failed to load offline queue:', error)
        }
      }
    }
  }

  static getQueueStatus() {
    return {
      isOnline: this.isOnline,
      queuedOperations: this.offlineQueue.length,
      operations: this.offlineQueue.map(op => ({
        id: op.id,
        timestamp: op.timestamp,
        retryCount: op.retryCount,
        age: Date.now() - op.timestamp
      }))
    }
  }
}