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
      select: { id: true, interviewCredits: true }
    })

    console.log(`Credits API: Looking up user with Clerk ID: ${user.id}`)

    if (!dbUser) {
      // Return 0 credits if user doesn't exist yet
      console.log(`Credits API: User not found in database`)
      return NextResponse.json({ credits: 0 })
    }

    console.log(`Credits API: Found user ${dbUser.id} with ${dbUser.interviewCredits} credits`)

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