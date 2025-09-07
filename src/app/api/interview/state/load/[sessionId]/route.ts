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
    const session = await db.session.findFirst({
      where: {
        id: sessionId,
        userId: userId,
        status: { in: ['IN_PROGRESS', 'COMPLETED'] }
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(session.feedback)
  } catch (error) {
    console.error('Error loading interview state:', error)
    return NextResponse.json({ 
      error: 'Failed to load state' 
    }, { status: 500 })
  }
}