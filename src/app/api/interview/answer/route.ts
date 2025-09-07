import { NextRequest, NextResponse } from 'next/server'
import { InterviewService } from '@/lib/interview-service'
import { RetryService, CircuitBreaker } from '@/lib/retry-service'
import { CompressionService } from '@/lib/compression-middleware'

export interface SubmitAnswerRequest {
  sessionId: string
  answer: string
  skipQuestion?: boolean
}

export interface SubmitAnswerResponse {
  success: boolean
  data?: {
    nextAction: 'next-question' | 'completed'
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

// Circuit breaker for database operations
const dbCircuitBreaker = new CircuitBreaker(5, 30000) // 5 failures, 30 second timeout

export async function POST(req: NextRequest): Promise<NextResponse<SubmitAnswerResponse>> {
  const startTime = Date.now()
  const logContext = {
    userId: 'unknown',
    sessionId: 'unknown',
    answerLength: 0,
    skipQuestion: false,
    userAgent: req.headers.get('user-agent'),
    timestamp: new Date().toISOString()
  }

  try {
    console.log('🎯 [INTERVIEW API] Starting answer submission', logContext)

    // Check authentication
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      console.error('❌ [INTERVIEW API] Authentication failed - no userId', logContext)
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    logContext.userId = userId
    console.log('✅ [INTERVIEW API] Authentication successful', logContext)

    // Parse request body with error handling
    let body: SubmitAnswerRequest
    try {
      body = await req.json()
      logContext.sessionId = body.sessionId || 'missing'
      logContext.answerLength = body.answer?.length || 0
      logContext.skipQuestion = body.skipQuestion || false
      console.log('✅ [INTERVIEW API] Request body parsed successfully', logContext)
    } catch (parseError) {
      console.error('❌ [INTERVIEW API] Failed to parse request body', {
        ...logContext,
        error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        stack: parseError instanceof Error ? parseError.stack : undefined
      })
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body'
      }, { status: 400 })
    }

    const { sessionId, answer, skipQuestion } = body

    // Enhanced validation with detailed logging
    if (!sessionId) {
      console.error('❌ [INTERVIEW API] Validation failed - missing sessionId', logContext)
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }

    if (!skipQuestion && (!answer || answer.trim().length === 0)) {
      console.error('❌ [INTERVIEW API] Validation failed - missing answer', logContext)
      return NextResponse.json({
        success: false,
        error: 'Answer is required when not skipping question'
      }, { status: 400 })
    }

    console.log('✅ [INTERVIEW API] Input validation passed', logContext)

    // Submit answer and get next action with retry logic and circuit breaker
    let result
    try {
      console.log('🔄 [INTERVIEW API] Calling InterviewService.submitAnswer with retry logic', logContext)
      
      result = await RetryService.withRetry(
        () => dbCircuitBreaker.execute(() => 
          InterviewService.submitAnswer(
            sessionId,
            userId,
            skipQuestion ? 'SKIPPED' : answer.trim(),
            skipQuestion
          )
        ),
        {
          maxAttempts: 3,
          baseDelay: 1000,
          onRetry: (attempt, error) => {
            console.warn(`⚠️ [INTERVIEW API] Retry attempt ${attempt} for session ${sessionId}:`, error?.message)
          }
        }
      )
      
      console.log('✅ [INTERVIEW API] InterviewService.submitAnswer completed', {
        ...logContext,
        resultSuccess: result.success,
        nextAction: result.nextAction,
        duration: Date.now() - startTime
      })
    } catch (serviceError) {
      console.error('❌ [INTERVIEW API] InterviewService.submitAnswer failed after retries', {
        ...logContext,
        error: serviceError instanceof Error ? serviceError.message : 'Unknown service error',
        stack: serviceError instanceof Error ? serviceError.stack : undefined,
        duration: Date.now() - startTime,
        circuitBreakerState: dbCircuitBreaker.getState()
      })
      throw serviceError // Re-throw to be caught by outer try-catch
    }

    if (!result.success) {
      console.error('❌ [INTERVIEW API] InterviewService returned unsuccessful result', {
        ...logContext,
        duration: Date.now() - startTime
      })
      return NextResponse.json({
        success: false,
        error: 'Failed to submit answer'
      }, { status: 500 })
    }

    const { sessionData, nextAction } = result
    console.log('✅ [INTERVIEW API] Result processing started', {
      ...logContext,
      nextAction,
      hasSessionData: !!sessionData,
      currentQuestionIndex: sessionData?.currentQuestionIndex,
      questionsLength: sessionData?.questions?.length,
      overallScore: sessionData?.overallScore
    })

    // Prepare response based on next action with error handling
    let currentQuestion = undefined
    const progress = {
      current: (sessionData?.currentQuestionIndex || 0) + 1,
      total: sessionData?.questions?.length || 0
    }

    try {
      if (nextAction === 'next-question') {
        const questionIndex = sessionData.currentQuestionIndex
        if (sessionData.questions && sessionData.questions[questionIndex]) {
          currentQuestion = {
            id: sessionData.questions[questionIndex].id || '',
            question: sessionData.questions[questionIndex].question,
            category: sessionData.questions[questionIndex].category,
            difficulty: sessionData.questions[questionIndex].difficulty,
            expectedDuration: sessionData.questions[questionIndex].expectedDuration
          }
          console.log('✅ [INTERVIEW API] Next question prepared', {
            ...logContext,
            questionId: currentQuestion.id,
            questionIndex
          })
        } else {
          console.error('❌ [INTERVIEW API] Question not found for next-question', {
            ...logContext,
            questionIndex,
            availableQuestions: sessionData.questions?.length || 0
          })
        }
      } else if (nextAction === 'completed') {
        console.log('✅ [INTERVIEW API] Interview completed', {
          ...logContext,
          overallScore: sessionData.overallScore,
          hasFinalEvaluation: !!result.finalEvaluation
        })
      }
    } catch (responseError) {
      console.error('❌ [INTERVIEW API] Error preparing response data', {
        ...logContext,
        error: responseError instanceof Error ? responseError.message : 'Unknown response error',
        stack: responseError instanceof Error ? responseError.stack : undefined,
        nextAction
      })
      // Continue with partial data rather than failing completely
    }

    const responseData = {
      success: true,
      data: {
        nextAction,
        currentQuestion,
        score: undefined, // No individual scoring during interview
        progress,
        overallScore: sessionData?.overallScore,
        sessionId: sessionData?.id || sessionId,
        // Include evaluation data when completed
        ...(nextAction === 'completed' && result.finalEvaluation ? {
          finalEvaluation: result.finalEvaluation
        } : {})
      }
    }

    console.log('✅ [INTERVIEW API] Response prepared successfully', {
      ...logContext,
      responseHasData: !!responseData.data,
      responseNextAction: responseData.data.nextAction,
      duration: Date.now() - startTime
    })

    // Return compressed response for better performance
    return await CompressionService.createCompressedResponse(req, responseData) as NextResponse<SubmitAnswerResponse>
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ [INTERVIEW API] Unhandled error in answer submission', {
      ...logContext,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name
    })

    // Return a user-friendly error message with diagnostic info
    return NextResponse.json({
      success: false,
      error: 'Interview system encountered an error. Please try again.',
      diagnostic: {
        timestamp: new Date().toISOString(),
        duration,
        userId: logContext.userId,
        sessionId: logContext.sessionId,
        errorType: error instanceof Error ? error.constructor.name : typeof error
      }
    }, { status: 500 })
  }
}

// Add GET handler to prevent 405 errors
export async function GET(req: NextRequest) {
  console.log('⚠️ [INTERVIEW API] GET request received on answer endpoint - should be POST', {
    url: req.url,
    userAgent: req.headers.get('user-agent'),
    timestamp: new Date().toISOString()
  })
  
  return NextResponse.json({
    error: 'Method not allowed. Use POST to submit answers.',
    allowedMethods: ['POST'],
    usage: 'POST /api/interview/answer with JSON body containing { sessionId, answer, skipQuestion? }'
  }, { status: 405 })
}