import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await params
    // Since Session model was removed, try to find interview by sessionId or interview ID
    const interview = await db.interview.findFirst({
      where: {
        OR: [
          { id: sessionId }, // sessionId might be interview ID
          { userId: userId, status: { in: ['IN_PROGRESS', 'COMPLETED'] } }
        ]
      }
    })

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    // Return interview data in expected format
    return NextResponse.json({
      id: interview.id,
      interviewId: interview.id,
      userId: interview.userId,
      position: interview.position,
      questions: interview.questions,
      status: interview.status,
      feedback: interview.feedback,
      score: interview.score
    })
  } catch (error) {
    console.error('Error loading interview state:', error)
    return NextResponse.json({ 
      error: 'Failed to load state' 
    }, { status: 500 })
  }
}