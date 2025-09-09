import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authUserId = request.headers.get('x-user-id')
    const { userId } = await params
    if (!authUserId || authUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find interrupted sessions from the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Since Session model was removed, use Interview model
    const interviews = await db.interview.findMany({
      where: {
        userId: userId,
        status: 'IN_PROGRESS',
        createdAt: { gte: yesterday }
      },
      orderBy: { createdAt: 'desc' }
    })

    const recoverableSessions = interviews
      .filter(interview => interview.feedback && typeof interview.feedback === 'string')
      .map(interview => {
        let state: any = {}
        try {
          state = JSON.parse(interview.feedback as string)
        } catch {
          // If feedback is not valid JSON, use interview data
          state = {
            position: interview.position,
            totalQuestions: interview.totalQuestions,
            answers: [],
            startTime: interview.createdAt.getTime()
          }
        }
        return {
          sessionId: interview.id,
          position: interview.position || 'Unknown Position',
          questionsAnswered: state.answers?.length || 0,
          totalQuestions: interview.totalQuestions || 0,
          timeElapsed: Date.now() - (state.startTime || interview.createdAt.getTime()),
          lastActive: new Date(state.lastActivityTime || interview.createdAt)
        }
      })

    return NextResponse.json(recoverableSessions)
  } catch (error) {
    console.error('Error finding recoverable sessions:', error)
    return NextResponse.json({ 
      error: 'Failed to find sessions' 
    }, { status: 500 })
  }
}