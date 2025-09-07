import { CacheService, InterviewCacheService } from '@/lib/cache-service'

describe('CacheService', () => {
  beforeEach(() => {
    CacheService.clear()
  })

  describe('Basic caching operations', () => {
    it('should set and get values correctly', () => {
      const key = 'test-key'
      const value = { data: 'test-data' }
      
      CacheService.set(key, value)
      const retrieved = CacheService.get(key)
      
      expect(retrieved).toEqual(value)
    })

    it('should return null for non-existent keys', () => {
      const result = CacheService.get('non-existent-key')
      expect(result).toBeNull()
    })

    it('should handle TTL expiration', async () => {
      const key = 'expiring-key'
      const value = 'test-value'
      const shortTTL = 10 // 10ms
      
      CacheService.set(key, value, shortTTL)
      
      // Should exist immediately
      expect(CacheService.get(key)).toBe(value)
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 15))
      
      // Should be expired
      expect(CacheService.get(key)).toBeNull()
    })

    it('should delete keys correctly', () => {
      const key = 'delete-key'
      const value = 'delete-value'
      
      CacheService.set(key, value)
      expect(CacheService.get(key)).toBe(value)
      
      const deleted = CacheService.delete(key)
      expect(deleted).toBe(true)
      expect(CacheService.get(key)).toBeNull()
    })
  })

  describe('getOrSet pattern', () => {
    it('should fetch and cache data when not present', async () => {
      const key = 'fetch-key'
      const expectedValue = 'fetched-data'
      const fetchFunction = jest.fn().mockResolvedValue(expectedValue)
      
      const result = await CacheService.getOrSet(key, fetchFunction)
      
      expect(result).toBe(expectedValue)
      expect(fetchFunction).toHaveBeenCalledTimes(1)
      
      // Should not fetch again when getting from cache
      const cachedResult = CacheService.get(key)
      expect(cachedResult).toBe(expectedValue)
    })

    it('should return cached data without fetching', async () => {
      const key = 'cached-key'
      const cachedValue = 'cached-data'
      const fetchFunction = jest.fn().mockResolvedValue('fresh-data')
      
      CacheService.set(key, cachedValue)
      
      const result = await CacheService.getOrSet(key, fetchFunction)
      
      expect(result).toBe(cachedValue)
      expect(fetchFunction).not.toHaveBeenCalled()
    })

    it('should handle fetch errors correctly', async () => {
      const key = 'error-key'
      const error = new Error('Fetch failed')
      const fetchFunction = jest.fn().mockRejectedValue(error)
      
      await expect(CacheService.getOrSet(key, fetchFunction)).rejects.toThrow('Fetch failed')
      expect(fetchFunction).toHaveBeenCalledTimes(1)
    })
  })

  describe('Cache statistics', () => {
    it('should track hits and misses correctly', () => {
      const key = 'stats-key'
      const value = 'stats-value'
      
      // Miss
      CacheService.get('non-existent')
      
      // Set and hit
      CacheService.set(key, value)
      CacheService.get(key)
      CacheService.get(key)
      
      const stats = CacheService.getStats()
      expect(stats.hits).toBeGreaterThan(0)
      expect(stats.misses).toBeGreaterThan(0)
    })
  })

  describe('Pattern invalidation', () => {
    it('should invalidate keys matching pattern', () => {
      CacheService.set('user:123:profile', 'profile-data')
      CacheService.set('user:123:settings', 'settings-data')
      CacheService.set('user:456:profile', 'other-profile')
      
      const deleted = CacheService.invalidatePattern('user:123:*')
      
      expect(deleted).toBe(2)
      expect(CacheService.get('user:123:profile')).toBeNull()
      expect(CacheService.get('user:123:settings')).toBeNull()
      expect(CacheService.get('user:456:profile')).toBe('other-profile')
    })
  })
})

describe('InterviewCacheService', () => {
  beforeEach(() => {
    CacheService.clear()
  })

  it('should cache session data correctly', async () => {
    const sessionId = 'test-session-id'
    const sessionData = { id: sessionId, answers: [] }
    const fetchFunction = jest.fn().mockResolvedValue(sessionData)
    
    const result1 = await InterviewCacheService.getSessionData(sessionId, fetchFunction)
    const result2 = await InterviewCacheService.getSessionData(sessionId, fetchFunction)
    
    expect(result1).toEqual(sessionData)
    expect(result2).toEqual(sessionData)
    expect(fetchFunction).toHaveBeenCalledTimes(1) // Should only fetch once
  })

  it('should cache generated questions correctly', async () => {
    const position = 'Software Engineer'
    const difficulty = 'medium'
    const questions = { behavioral: [], technical: [], situational: [] }
    const fetchFunction = jest.fn().mockResolvedValue(questions)
    
    const result = await InterviewCacheService.getGeneratedQuestions(position, difficulty, fetchFunction)
    
    expect(result).toEqual(questions)
    expect(fetchFunction).toHaveBeenCalledTimes(1)
    
    // Should use cached version
    const cachedResult = await InterviewCacheService.getGeneratedQuestions(position, difficulty, fetchFunction)
    expect(cachedResult).toEqual(questions)
    expect(fetchFunction).toHaveBeenCalledTimes(1) // Still only called once
  })

  it('should invalidate user cache correctly', () => {
    const userId = 'user-123'
    
    CacheService.set(`user_interviews:${userId}`, ['interview1'])
    CacheService.set(`user_profile:${userId}`, { name: 'Test User' })
    CacheService.set(`session:session1:${userId}`, { data: 'test' })
    CacheService.set(`other_user:${userId}`, 'should not be deleted')
    
    InterviewCacheService.invalidateUserCache(userId)
    
    expect(CacheService.get(`user_interviews:${userId}`)).toBeNull()
    expect(CacheService.get(`user_profile:${userId}`)).toBeNull()
    expect(CacheService.get(`session:session1:${userId}`)).toBeNull()
    expect(CacheService.get(`other_user:${userId}`)).toBe('should not be deleted')
  })
})