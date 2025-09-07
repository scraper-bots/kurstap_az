import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    const result = await authService.register({
      email,
      password,
      firstName,
      lastName
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user!.id,
        email: result.user!.email,
        firstName: result.user!.firstName,
        lastName: result.user!.lastName,
        role: result.user!.role,
        interviewCredits: result.user!.interviewCredits
      }
    })

    // Set secure HTTP-only cookie
    response.cookies.set('session', result.sessionId!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    logger.info('User registered successfully', { userId: result.user!.id, email })

    return response
  } catch (error) {
    logger.error('Register API error', { error: error instanceof Error ? error.message : 'Unknown error' })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}