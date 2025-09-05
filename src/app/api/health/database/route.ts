import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function HEAD() {
  return NextResponse.json({ status: 'ok' }, { status: 200 })
}

export async function GET() {
  try {
    // Simple database connectivity test
    await db.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'database'
    })
  } catch (error) {
    console.error('Database health check failed:', error)
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Database connection failed'
    }, { status: 500 })
  }
}