import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { InterviewService } from '@/lib/interview-service'

export interface SubmitAnswerRequest {
  sessionId: string
  answer: string
}

export interface SubmitAnswerResponse {
  success: boolean
  data?: {
    nextAction: 'next-question' | 'follow-up' | 'completed'
    currentQuestion?: {
      id: string
      question: string
      category: string
      difficulty: string
      expectedDuration: number
    }
    followUpQuestion?: string
    score?: {
      technicalAccuracy: number
      communicationClarity: number
      problemSolvingApproach: number
      overallScore: number
      feedback: string
    }
    progress: {
      current: number
      total: number
    }
    overallScore?: number
    sessionId: string
  }
  error?: string
}

export async function POST(req: NextRequest): Promise<NextResponse<SubmitAnswerResponse>> {
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
    const body: SubmitAnswerRequest = await req.json()
    const { sessionId, answer } = body

    // Validate input
    if (!sessionId || !answer || answer.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Session ID and answer are required'
      }, { status: 400 })
    }

    // Submit answer and get next action
    const result = await InterviewService.submitAnswer(
      sessionId,
      userId,
      answer.trim()
    )

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to submit answer'
      }, { status: 500 })
    }

    const { sessionData, nextAction, score } = result

    // Prepare response based on next action
    let currentQuestion = undefined
    let followUpQuestion = undefined
    let progress = {
      current: sessionData.currentQuestionIndex + 1,
      total: sessionData.questions.length
    }

    if (nextAction === 'next-question') {
      currentQuestion = {
        id: sessionData.questions[sessionData.currentQuestionIndex].id,
        question: sessionData.questions[sessionData.currentQuestionIndex].question,
        category: sessionData.questions[sessionData.currentQuestionIndex].category,
        difficulty: sessionData.questions[sessionData.currentQuestionIndex].difficulty,
        expectedDuration: sessionData.questions[sessionData.currentQuestionIndex].expectedDuration
      }
    } else if (nextAction === 'follow-up') {
      const currentQ = sessionData.questions[sessionData.currentQuestionIndex]
      followUpQuestion = currentQ.followUp
      // Progress doesn't change for follow-up
      progress.current = sessionData.currentQuestionIndex + 1
    }

    return NextResponse.json({
      success: true,
      data: {
        nextAction,
        currentQuestion,
        followUpQuestion,
        score,
        progress,
        overallScore: sessionData.overallScore,
        sessionId: sessionData.id
      }
    })
  } catch (error) {
    console.error('Error submitting answer:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit answer'
    }, { status: 500 })
  }
}