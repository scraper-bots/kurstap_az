import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('bir-guru-session')?.value

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      )
    }

    const user = await authService.getUserFromSession(sessionId)

    if (!user) {
      // Clear invalid session cookie
      const response = NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
      
      response.cookies.set('bir-guru-session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
      })

      return response
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        interviewCredits: user.interviewCredits,
        imageUrl: user.imageUrl,
        emailVerified: user.emailVerified
      }
    })
  } catch (error) {
    logger.error('Get user API error', { error: error instanceof Error ? error.message : 'Unknown error' })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}