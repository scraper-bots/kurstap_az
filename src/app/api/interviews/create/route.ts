import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { UsageService } from '@/lib/usage-service'
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

    // Check usage limits for FREE users
    const usageCheck = await UsageService.checkInterviewLimit(user.id)
    
    if (!usageCheck.canCreateInterview) {
      return NextResponse.json(
        { 
          error: 'Interview limit reached',
          message: `You have reached your monthly limit of ${usageCheck.totalLimit} interviews. Upgrade to Premium for unlimited interviews.`,
          remainingInterviews: 0,
          upgradeRequired: true
        },
        { status: 403 }
      )
    }

    // Create interview
    const interview = await db.interview.create({
      data: {
        id: generateId(),
        userId: user.id,
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

    // Return success with remaining usage info
    return NextResponse.json({
      success: true,
      interview: {
        id: interview.id,
        title: interview.title,
        position: interview.position,
        difficulty: interview.difficulty,
        scheduledAt: interview.scheduledAt,
        status: interview.status
      },
      usage: {
        remainingInterviews: usageCheck.remainingInterviews - 1,
        totalLimit: usageCheck.totalLimit
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