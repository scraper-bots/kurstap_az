import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const interviewState = await request.json()

    // Validate required fields
    if (!interviewState.sessionId || !interviewState.userId) {
      return NextResponse.json({ error: 'Invalid state data' }, { status: 400 })
    }

    // Save state to database
    await db.session.upsert({
      where: { id: interviewState.sessionId },
      update: {
        status: interviewState.stage === 'completed' ? 'COMPLETED' : 
               interviewState.stage === 'paused' ? 'IN_PROGRESS' : 'IN_PROGRESS',
        feedback: interviewState,
        completedAt: interviewState.stage === 'completed' ? new Date() : null
      },
      create: {
        id: interviewState.sessionId,
        userId: userId,
        type: 'PRACTICE',
        status: 'IN_PROGRESS',
        feedback: interviewState,
        startedAt: new Date(interviewState.startTime)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving interview state:', error)
    return NextResponse.json({ 
      error: 'Failed to save state' 
    }, { status: 500 })
  }
}