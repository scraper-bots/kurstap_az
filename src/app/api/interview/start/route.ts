import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { InterviewService } from '@/lib/interview-service'

export interface StartInterviewRequest {
  position: string
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed'
  totalQuestions?: number
}

export interface StartInterviewResponse {
  success: boolean
  data?: {
    sessionId: string
    interviewId: string
    position: string
    currentQuestion: {
      id: string
      question: string
      category: string
      difficulty: string
      expectedDuration: number
    }
    totalQuestions: number
    progress: {
      current: number
      total: number
    }
  }
  error?: string
}

export async function POST(req: NextRequest): Promise<NextResponse<StartInterviewResponse>> {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Parse request body
    const body: StartInterviewRequest = await req.json()
    const { position, difficulty = 'mixed', totalQuestions = 5 } = body

    // Validate input
    if (!position || position.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Position is required'
      }, { status: 400 })
    }

    // Start interview session
    const sessionData = await InterviewService.startInterview(
      userId,
      position.trim(),
      difficulty,
      totalQuestions
    )

    const currentQuestion = sessionData.questions[0]
    if (!currentQuestion) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate questions for interview'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId: sessionData.id,
        interviewId: sessionData.interviewId,
        position: sessionData.position,
        currentQuestion: {
          id: currentQuestion.id || '',
          question: currentQuestion.question,
          category: currentQuestion.category,
          difficulty: currentQuestion.difficulty,
          expectedDuration: currentQuestion.expectedDuration
        },
        totalQuestions: sessionData.questions.length,
        progress: {
          current: 1,
          total: sessionData.questions.length
        }
      }
    })
  } catch (error) {
    console.error('Error starting interview:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start interview'
    }, { status: 500 })
  }
}