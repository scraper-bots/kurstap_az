import { NextResponse } from 'next/server'

export async function HEAD() {
  return NextResponse.json({ status: 'ok' }, { status: 200 })
}

export async function GET() {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    // Basic health check - could ping OpenAI service
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'transcription'
    })
  } catch {
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Transcription service unavailable'
    }, { status: 500 })
  }
}