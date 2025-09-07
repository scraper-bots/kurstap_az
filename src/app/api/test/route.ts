import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({ 
      message: 'Test endpoint working',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}