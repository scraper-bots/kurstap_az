import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced database configuration with connection pooling and performance optimizations
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn'] : ['error'],
    // Query performance optimizations  
    transactionOptions: {
      maxWait: 10000, // 10 seconds max wait time
      timeout: 30000, // 30 seconds timeout
    }
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Enhanced database utilities for performance monitoring
export class DatabaseMetrics {
  private static queryCount = 0
  private static slowQueryCount = 0
  private static averageQueryTime = 0

  static incrementQueryCount() {
    this.queryCount++
  }

  static recordQueryTime(time: number) {
    // Track slow queries (> 1 second)
    if (time > 1000) {
      this.slowQueryCount++
      console.warn(`⚠️ Slow database query detected: ${time}ms`)
    }
    
    // Update rolling average
    this.averageQueryTime = (this.averageQueryTime + time) / 2
  }

  static getMetrics() {
    return {
      totalQueries: this.queryCount,
      slowQueries: this.slowQueryCount,
      averageQueryTime: Math.round(this.averageQueryTime)
    }
  }

  static resetMetrics() {
    this.queryCount = 0
    this.slowQueryCount = 0
    this.averageQueryTime = 0
  }
}

// Database connection health check
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  error?: string
}> {
  const start = Date.now()
  
  try {
    await db.$queryRaw`SELECT 1`
    const responseTime = Date.now() - start
    
    DatabaseMetrics.recordQueryTime(responseTime)
    
    if (responseTime > 5000) {
      return { status: 'unhealthy', responseTime }
    } else if (responseTime > 1000) {
      return { status: 'degraded', responseTime }
    } else {
      return { status: 'healthy', responseTime }
    }
  } catch (error) {
    const responseTime = Date.now() - start
    return {
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown database error'
    }
  }
}