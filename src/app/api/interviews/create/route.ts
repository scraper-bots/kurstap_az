import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { generateId } from '@/lib/utils'

interface CreateInterviewRequest {
  title: string
  description?: string
  position: string
  company?: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  scheduledAt?: string
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateInterviewRequest = await request.json()
    const { title, description, position, company, difficulty, scheduledAt } = body

    // Validate required fields
    if (!title || !position || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields: title, position, difficulty' },
        { status: 400 }
      )
    }

    // Get or create user and check credits
    let dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true, interviewCredits: true }
    })
    
    if (!dbUser) {
      // Create user if doesn't exist with 0 credits
      dbUser = await db.user.create({
        data: {
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          planType: 'FREE' as any,
          imageUrl: user.imageUrl || undefined,
          interviewCredits: 0
        },
        select: { id: true, interviewCredits: true }
      })
    }
    
    // Check if user has credits
    if (dbUser.interviewCredits <= 0) {
      return NextResponse.json(
        { 
          error: 'No interview credits',
          message: 'You need to purchase interview credits to start practicing.',
          remainingInterviews: 0,
          upgradeRequired: true
        },
        { status: 403 }
      )
    }

    // Use database transaction to create interview and deduct credit atomically
    const result = await db.$transaction(async (tx) => {
      // Create interview
      const interview = await tx.interview.create({
        data: {
          id: generateId(),
          userId: dbUser.id, // Use database user ID, not Clerk ID
          title,
          description,
          position,
          company,
          difficulty,
          status: 'SCHEDULED',
          scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
          questions: [], // Will be populated later
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Deduct one credit from user
      const updatedUser = await tx.user.update({
        where: { id: dbUser.id },
        data: {
          interviewCredits: {
            decrement: 1
          }
        },
        select: { interviewCredits: true }
      })

      return { interview, remainingCredits: updatedUser.interviewCredits }
    })

    // Return success with remaining credits info
    return NextResponse.json({
      success: true,
      interview: {
        id: result.interview.id,
        title: result.interview.title,
        position: result.interview.position,
        difficulty: result.interview.difficulty,
        scheduledAt: result.interview.scheduledAt,
        status: result.interview.status
      },
      usage: {
        remainingInterviews: result.remainingCredits,
        totalLimit: 'unlimited'
      }
    })
  } catch (error) {
    console.error('Error creating interview:', error)
    return NextResponse.json(
      { error: 'Failed to create interview' },
      { status: 500 }
    )
  }
}