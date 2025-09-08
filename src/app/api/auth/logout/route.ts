import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('bir-guru-session')?.value

    if (sessionId) {
      await authService.logout(sessionId)
    }

    const response = NextResponse.json({ success: true })
    
    // Clear the session cookie
    response.cookies.set('bir-guru-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    })

    logger.info('User logged out successfully')

    return response
  } catch (error) {
    logger.error('Logout API error', { error: error instanceof Error ? error.message : 'Unknown error' })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}