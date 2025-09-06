import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { InterviewService } from '@/lib/interview-service'

export interface GetSessionResponse {
  success: boolean
  data?: {
    sessionId: string
    interviewId: string
    position: string
    status: string
    currentStage: 'question' | 'follow-up' | 'completed'
    currentQuestion?: {
      id: string
      question: string
      category: string
      difficulty: string
      expectedDuration: number
    }
    followUpQuestion?: string
    answers: Array<Record<string, unknown>>
    progress: {
      current: number
      total: number
    }
    overallScore?: number
    startedAt: string
    completedAt?: string
  }
  error?: string
}

export async function GET(req: NextRequest): Promise<NextResponse<GetSessionResponse>> {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Get session ID from query params
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }

    // Get session data
    const sessionData = await InterviewService.getSession(sessionId, userId)

    if (!sessionData) {
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 })
    }

    // Prepare current question if in progress
    let currentQuestion = undefined
    let followUpQuestion = undefined

    if (sessionData.status === 'IN_PROGRESS') {
      const currentQ = sessionData.questions[sessionData.currentQuestionIndex]
      
      if (sessionData.currentStage === 'question') {
        currentQuestion = {
          id: currentQ.id,
          question: currentQ.question,
          category: currentQ.category,
          difficulty: currentQ.difficulty,
          expectedDuration: currentQ.expectedDuration
        }
      } else if (sessionData.currentStage === 'follow-up') {
        followUpQuestion = currentQ.followUp
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId: sessionData.id,
        interviewId: sessionData.interviewId,
        position: sessionData.position,
        status: sessionData.status,
        currentStage: sessionData.currentStage,
        currentQuestion,
        followUpQuestion,
        answers: sessionData.answers,
        questions: sessionData.questions, // Include full questions array for category mapping
        progress: {
          current: sessionData.currentQuestionIndex + 1,
          total: sessionData.questions.length
        },
        overallScore: sessionData.overallScore,
        startedAt: sessionData.startedAt,
        completedAt: sessionData.completedAt,
        detailedInterviewId: sessionData.detailedInterviewId // Include reference to detailed interview if exists
      }
    })
  } catch (error) {
    console.error('Error getting session:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get session'
    }, { status: 500 })
  }
}