// High-performance caching service with multiple strategies
export class CacheService {
  private static memoryCache = new Map<string, { data: any; expiry: number; hits: number }>()
  private static cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0
  }

  // Default cache TTL (Time To Live) in milliseconds
  private static DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private static MAX_CACHE_SIZE = 1000 // Maximum number of entries

  /**
   * Set a value in cache with optional TTL
   */
  static set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.MAX_CACHE_SIZE) {
      this.evictLRU()
    }

    const expiry = Date.now() + ttl
    this.memoryCache.set(key, { data, expiry, hits: 0 })
    
    console.log(`📦 Cached data for key: ${key} (TTL: ${ttl}ms)`)
  }

  /**
   * Get a value from cache
   */
  static get<T = any>(key: string): T | null {
    const entry = this.memoryCache.get(key)
    
    if (!entry) {
      this.cacheStats.misses++
      console.log(`❌ Cache miss for key: ${key}`)
      return null
    }

    // Check if entry has expired
    if (Date.now() > entry.expiry) {
      this.memoryCache.delete(key)
      this.cacheStats.misses++
      console.log(`⏰ Cache expired for key: ${key}`)
      return null
    }

    // Update hit count and stats
    entry.hits++
    this.cacheStats.hits++
    console.log(`✅ Cache hit for key: ${key} (hits: ${entry.hits})`)
    
    return entry.data as T
  }

  /**
   * Delete a specific key from cache
   */
  static delete(key: string): boolean {
    const deleted = this.memoryCache.delete(key)
    if (deleted) {
      console.log(`🗑️ Deleted cache key: ${key}`)
    }
    return deleted
  }

  /**
   * Clear entire cache
   */
  static clear(): void {
    const size = this.memoryCache.size
    this.memoryCache.clear()
    this.resetStats()
    console.log(`🧹 Cleared entire cache (${size} entries)`)
  }

  /**
   * Get or set pattern - fetch data if not cached
   */
  static async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Fetch data and cache it
    try {
      console.log(`🔄 Fetching data for cache key: ${key}`)
      const data = await fetchFunction()
      this.set(key, data, ttl)
      return data
    } catch (error) {
      console.error(`❌ Failed to fetch data for cache key: ${key}`, error)
      throw error
    }
  }

  /**
   * Evict least recently used entries
   */
  private static evictLRU(): void {
    let lruKey = ''
    let lruHits = Infinity
    let oldestTime = Date.now()

    for (const [key, entry] of Array.from(this.memoryCache.entries())) {
      // Prioritize entries with fewer hits and older expiry
      if (entry.hits < lruHits || (entry.hits === lruHits && entry.expiry < oldestTime)) {
        lruKey = key
        lruHits = entry.hits
        oldestTime = entry.expiry
      }
    }

    if (lruKey) {
      this.memoryCache.delete(lruKey)
      this.cacheStats.evictions++
      console.log(`🔄 Evicted LRU cache entry: ${lruKey}`)
    }
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0 
      ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(2)
      : '0.00'

    return {
      ...this.cacheStats,
      hitRate: `${hitRate}%`,
      cacheSize: this.memoryCache.size,
      maxSize: this.MAX_CACHE_SIZE
    }
  }

  /**
   * Reset cache statistics
   */
  private static resetStats(): void {
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0
    }
  }

  /**
   * Generate cache keys for common patterns
   */
  static generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`
  }

  /**
   * Cache invalidation patterns
   */
  static invalidatePattern(pattern: string): number {
    let deleted = 0
    const regex = new RegExp(pattern.replace('*', '.*'))
    
    for (const key of Array.from(this.memoryCache.keys())) {
      if (regex.test(key)) {
        this.memoryCache.delete(key)
        deleted++
      }
    }
    
    console.log(`🔄 Invalidated ${deleted} cache entries matching pattern: ${pattern}`)
    return deleted
  }
}

// Specific cache utilities for interview system
export class InterviewCacheService {
  // Cache session data for quick access
  static async getSessionData(sessionId: string, fetchFunction: () => Promise<any>) {
    const key = CacheService.generateKey('session', sessionId)
    return CacheService.getOrSet(key, fetchFunction, 2 * 60 * 1000) // 2 minutes TTL
  }

  // Cache user interview history
  static async getUserInterviews(userId: string, fetchFunction: () => Promise<any>) {
    const key = CacheService.generateKey('user_interviews', userId)
    return CacheService.getOrSet(key, fetchFunction, 5 * 60 * 1000) // 5 minutes TTL
  }

  // Cache OpenAI generated questions
  static async getGeneratedQuestions(position: string, difficulty: string, fetchFunction: () => Promise<any>) {
    const key = CacheService.generateKey('questions', position, difficulty)
    return CacheService.getOrSet(key, fetchFunction, 30 * 60 * 1000) // 30 minutes TTL
  }

  // Invalidate user-related caches when data changes
  static invalidateUserCache(userId: string) {
    CacheService.invalidatePattern(`user_*:${userId}`)
    CacheService.invalidatePattern(`session:*:${userId}`)
  }

  // Invalidate session cache when interview data changes
  static invalidateSessionCache(sessionId: string) {
    CacheService.delete(CacheService.generateKey('session', sessionId))
  }
}