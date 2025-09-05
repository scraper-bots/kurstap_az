import { NextResponse } from 'next/server'

export async function HEAD() {
  return NextResponse.json({ status: 'ok' }, { status: 200 })
}

export async function GET() {
  try {
    // Basic network health check
    const timestamp = new Date().toISOString()
    
    return NextResponse.json({
      status: 'healthy',
      timestamp,
      service: 'network'
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Network check failed'
    }, { status: 500 })
  }
}