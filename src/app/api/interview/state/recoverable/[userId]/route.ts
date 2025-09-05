import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await currentUser()
    if (!user || user.id !== params.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find interrupted sessions from the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const sessions = await db.session.findMany({
      where: {
        userId: user.id,
        status: 'IN_PROGRESS',
        startedAt: { gte: yesterday }
      },
      orderBy: { startedAt: 'desc' }
    })

    const recoverableSessions = sessions
      .filter(session => session.feedback && typeof session.feedback === 'object')
      .map(session => {
        const state = session.feedback as any
        return {
          sessionId: session.id,
          position: state.position || 'Unknown Position',
          questionsAnswered: state.answers?.length || 0,
          totalQuestions: state.totalQuestions || 0,
          timeElapsed: Date.now() - (state.startTime || session.startedAt.getTime()),
          lastActive: new Date(state.lastActivityTime || session.startedAt)
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