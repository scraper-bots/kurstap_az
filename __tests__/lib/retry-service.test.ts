import { RetryService, CircuitBreaker, GracefulDegradationService } from '@/lib/retry-service'

describe('RetryService', () => {
  describe('withRetry', () => {
    it('should succeed on first attempt when operation succeeds', async () => {
      const successfulOperation = jest.fn().mockResolvedValue('success')
      
      const result = await RetryService.withRetry(successfulOperation)
      
      expect(result).toBe('success')
      expect(successfulOperation).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success')
      
      const result = await RetryService.withRetry(operation, { maxAttempts: 3 })
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should fail after max attempts', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Always fails'))
      
      await expect(RetryService.withRetry(failingOperation, { maxAttempts: 2 }))
        .rejects.toThrow('Always fails')
      
      expect(failingOperation).toHaveBeenCalledTimes(2)
    })

    it('should respect retry condition', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Non-retryable error'))
      const retryCondition = jest.fn().mockReturnValue(false)
      
      await expect(RetryService.withRetry(operation, { retryCondition }))
        .rejects.toThrow('Non-retryable error')
      
      expect(operation).toHaveBeenCalledTimes(1)
      expect(retryCondition).toHaveBeenCalledTimes(1)
    })

    it('should call onRetry callback', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('success')
      
      const onRetry = jest.fn()
      
      await RetryService.withRetry(operation, { onRetry })
      
      expect(onRetry).toHaveBeenCalledTimes(1)
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error))
    })

    it('should implement exponential backoff', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success')
      
      const startTime = Date.now()
      
      await RetryService.withRetry(operation, {
        baseDelay: 100,
        backoffMultiplier: 2
      })
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should wait at least 100ms + 200ms = 300ms for two retries
      expect(duration).toBeGreaterThan(250)
    })
  })
})

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(3, 1000) // 3 failures, 1 second timeout
  })

  it('should execute operation when circuit is closed', async () => {
    const operation = jest.fn().mockResolvedValue('success')
    
    const result = await circuitBreaker.execute(operation)
    
    expect(result).toBe('success')
    expect(operation).toHaveBeenCalledTimes(1)
    expect(circuitBreaker.getState().state).toBe('CLOSED')
  })

  it('should open circuit after threshold failures', async () => {
    const failingOperation = jest.fn().mockRejectedValue(new Error('Operation failed'))
    
    // Fail 3 times to reach threshold
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow()
    }
    
    expect(circuitBreaker.getState().state).toBe('OPEN')
    
    // Should reject immediately without calling operation
    await expect(circuitBreaker.execute(failingOperation))
      .rejects.toThrow('Circuit breaker is OPEN')
    
    expect(failingOperation).toHaveBeenCalledTimes(3) // Not called on the 4th attempt
  })

  it('should transition to half-open after timeout', async () => {
    const failingOperation = jest.fn().mockRejectedValue(new Error('Operation failed'))
    
    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow()
    }
    
    expect(circuitBreaker.getState().state).toBe('OPEN')
    
    // Mock time passing
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 1500) // 1.5 seconds later
    
    const successfulOperation = jest.fn().mockResolvedValue('success')
    const result = await circuitBreaker.execute(successfulOperation)
    
    expect(result).toBe('success')
    expect(circuitBreaker.getState().state).toBe('CLOSED')
  })
})

describe('GracefulDegradationService', () => {
  beforeEach(() => {
    // Clear all registered services
    GracefulDegradationService['serviceStatus'].clear()
    GracefulDegradationService['fallbacks'].clear()
  })

  it('should register and execute fallback when service fails', async () => {
    const serviceName = 'test-service'
    const fallbackValue = 'fallback-result'
    const fallbackFunction = jest.fn().mockResolvedValue(fallbackValue)
    
    GracefulDegradationService.registerFallback(serviceName, fallbackFunction)
    
    const failingOperation = jest.fn().mockRejectedValue(new Error('Service unavailable'))
    
    // First few failures should still try the primary operation
    await expect(GracefulDegradationService.executeWithFallback(serviceName, failingOperation))
      .rejects.toThrow('Service unavailable')
    
    await expect(GracefulDegradationService.executeWithFallback(serviceName, failingOperation))
      .rejects.toThrow('Service unavailable')
    
    // Third failure should trigger fallback
    const result = await GracefulDegradationService.executeWithFallback(serviceName, failingOperation, {
      fallbackAfterFailures: 2
    })
    
    expect(result).toBe(fallbackValue)
    expect(fallbackFunction).toHaveBeenCalledTimes(1)
  })

  it('should execute primary operation when service is healthy', async () => {
    const serviceName = 'healthy-service'
    const fallbackFunction = jest.fn()
    const primaryResult = 'primary-result'
    const primaryOperation = jest.fn().mockResolvedValue(primaryResult)
    
    GracefulDegradationService.registerFallback(serviceName, fallbackFunction)
    
    const result = await GracefulDegradationService.executeWithFallback(serviceName, primaryOperation)
    
    expect(result).toBe(primaryResult)
    expect(primaryOperation).toHaveBeenCalledTimes(1)
    expect(fallbackFunction).not.toHaveBeenCalled()
  })

  it('should recover service after successful operation', async () => {
    const serviceName = 'recovering-service'
    const fallbackFunction = jest.fn().mockResolvedValue('fallback')
    
    GracefulDegradationService.registerFallback(serviceName, fallbackFunction)
    
    // Cause failures to mark service as unavailable
    const failingOperation = jest.fn().mockRejectedValue(new Error('Service down'))
    
    try {
      await GracefulDegradationService.executeWithFallback(serviceName, failingOperation, { fallbackAfterFailures: 1 })
    } catch (e) {
      // First failure
    }
    
    // Second call should use fallback
    const fallbackResult = await GracefulDegradationService.executeWithFallback(serviceName, failingOperation, { fallbackAfterFailures: 1 })
    expect(fallbackResult).toBe('fallback')
    
    // Service recovers
    const successfulOperation = jest.fn().mockResolvedValue('recovered')
    
    // Should try primary operation again after health check interval
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 31000) // 31 seconds later
    
    const result = await GracefulDegradationService.executeWithFallback(serviceName, successfulOperation)
    expect(result).toBe('recovered')
    
    // Service should be marked as available again
    const status = GracefulDegradationService.getServicesStatus()
    expect(status[serviceName].available).toBe(true)
  })

  it('should throw error when no fallback is registered', async () => {
    const serviceName = 'unregistered-service'
    const failingOperation = jest.fn().mockRejectedValue(new Error('Service failed'))
    
    await expect(GracefulDegradationService.executeWithFallback(serviceName, failingOperation))
      .rejects.toThrow('Service unregistered-service not registered')
  })
})