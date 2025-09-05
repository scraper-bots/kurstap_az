import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { interviewCredits: true }
    })

    if (!dbUser) {
      // Return 0 credits if user doesn't exist yet
      return NextResponse.json({ credits: 0 })
    }

    return NextResponse.json({
      credits: dbUser.interviewCredits || 0
    })
  } catch (error) {
    console.error('Error fetching user credits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    )
  }
}