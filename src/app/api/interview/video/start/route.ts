import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { InterviewModesService } from '@/lib/interview-modes-service'
import { InterviewMode } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Get request data
    const body = await request.json()
    const { 
      position, 
      company, 
      mode = 'STANDARD' as InterviewMode,
      customQuestions = [] 
    } = body

    if (!position) {
      return NextResponse.json({
        success: false,
        error: 'Position is required'
      }, { status: 400 })
    }

    // Validate interview mode
    const modeConfig = InterviewModesService.getModeConfig(mode)
    if (!modeConfig) {
      return NextResponse.json({
        success: false,
        error: 'Invalid interview mode'
      }, { status: 400 })
    }

    // Check if user has sufficient credits
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    const interviewCost = InterviewModesService.getInterviewCost(mode)
    if (user.interviewCredits < interviewCost) {
      return NextResponse.json({
        success: false,
        error: `Insufficient credits. This interview requires ${interviewCost} credits, but you have ${user.interviewCredits}.`,
        requiredCredits: interviewCost,
        userCredits: user.interviewCredits
      }, { status: 402 }) // Payment Required
    }

    console.log(`🎬 Starting ${mode} video interview for ${position}`)

    // Generate questions for the interview mode
    const questions = customQuestions.length > 0 
      ? customQuestions 
      : await InterviewModesService.generateQuestionsForMode(mode, position, company)

    // Create interview record
    const interview = await db.interview.create({
      data: {
        userId: user.id,
        title: `${modeConfig.name} - ${position}`,
        description: `Video interview for ${position} position${company ? ` at ${company}` : ''}`,
        position,
        company,
        mode,
        difficulty: modeConfig.difficulty[0], // Primary difficulty
        status: 'IN_PROGRESS',
        questions: questions as any, // Store as JSON
        totalQuestions: questions.length,
        duration: modeConfig.estimatedDuration,
        scheduledAt: new Date()
      }
    })

    // Deduct credits from user account
    await db.user.update({
      where: { id: user.id },
      data: {
        interviewCredits: user.interviewCredits - interviewCost
      }
    })

    console.log(`✅ Video interview created with ID: ${interview.id}`)
    console.log(`💰 Deducted ${interviewCost} credits. Remaining: ${user.interviewCredits - interviewCost}`)

    return NextResponse.json({
      success: true,
      interview: {
        id: interview.id,
        mode: interview.mode,
        position: interview.position,
        company: interview.company,
        questions: questions,
        totalQuestions: interview.totalQuestions,
        estimatedDuration: interview.duration,
        creditsUsed: interviewCost,
        remainingCredits: user.interviewCredits - interviewCost
      },
      message: 'Video interview started successfully'
    })

  } catch (error) {
    console.error('❌ Error starting video interview:', error)
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('Failed to generate interview questions')) {
        return NextResponse.json({
          success: false,
          error: 'Failed to generate questions. Please try again.'
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to start interview. Please try again.'
    }, { status: 500 })
  }
}

// Get available interview modes
export async function GET() {
  try {
    const modes = InterviewModesService.getAllModes()
    
    return NextResponse.json({
      success: true,
      modes: modes.map(mode => ({
        mode: mode.mode,
        name: mode.name,
        description: mode.description,
        questionCount: mode.questionCount,
        estimatedDuration: mode.estimatedDuration,
        difficulty: mode.difficulty,
        categories: mode.categories,
        price: mode.price
      }))
    })
  } catch (error) {
    console.error('❌ Error fetching interview modes:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch interview modes'
    }, { status: 500 })
  }
}