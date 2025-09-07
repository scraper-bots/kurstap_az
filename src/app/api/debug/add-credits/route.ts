import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    // const userEmail = request.headers.get('x-user-email')
    // const userRole = request.headers.get('x-user-role')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { credits } = await request.json()
    const creditsToAdd = credits || 5

    // Get user from database using user ID
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Add credits
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { 
        interviewCredits: {
          increment: creditsToAdd
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Added ${creditsToAdd} credits`,
      newBalance: updatedUser.interviewCredits,
      creditsSystem: 'ACTIVE'
    })
  } catch (error) {
    console.error('Error adding credits:', error)
    return NextResponse.json(
      { error: 'Failed to add credits' },
      { status: 500 }
    )
  }
}