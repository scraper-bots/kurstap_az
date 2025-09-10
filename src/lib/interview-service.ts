import { db, DatabaseMetrics } from './db'
import { OpenAIService } from './openai'
import { InterviewStatus, Difficulty } from '@prisma/client'
import { DetailedInterviewService, DetailedInterviewData, InterviewAnswerData } from './detailed-interview-service'
import { InterviewQuestion, InterviewAnswer } from '@/types/common'
import { InterviewCacheService } from './cache-service'
import crypto from 'crypto'

export type { InterviewQuestion } from '@/types/common'

export interface InterviewAnswerWithScore extends Omit<InterviewAnswer, 'score'> {
  score?: {
    technicalAccuracy: number
    communicationClarity: number
    problemSolvingApproach: number
    overallScore: number
    feedback: string
  }
}

export interface InterviewSessionData {
  id: string
  interviewId: string
  userId: string
  position: string
  currentQuestionIndex: number
  currentStage: 'question' | 'completed'
  questions: InterviewQuestion[]
  answers: InterviewAnswerWithScore[]
  overallScore?: number
  status: InterviewStatus
  startedAt: string
  completedAt?: string
  detailedInterviewId?: string
}

// Helper function to generate secure temporary password
const generateSecurePassword = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

export class InterviewService {
  /**
   * Start a new interview session
   */
  static async startInterview(
    userId: string,
    position: string,
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed' = 'mixed',
    totalQuestions: number = 5
  ): Promise<InterviewSessionData> {
    try {
      // Ensure user exists in database first - create if doesn't exist
      let existingUser = await db.user.findUnique({
        where: { id: userId }
      })
      
      if (!existingUser) {
        // Try to create the user automatically
        try {
          existingUser = await db.user.create({
            data: {
              id: userId,
              email: '', // Will be updated later
              password: generateSecurePassword(), // Secure temporary password for auto-created users
              firstName: '',
              lastName: '',
              interviewCredits: 0,
              createdAt: new Date(),
            }
          })
          // User auto-created for interview
        } catch (createError) {
          console.error('Failed to auto-create user:', createError)
          throw new Error('User not found. Please sign in again.')
        }
      }

      // Generate questions for the position using OpenAI with caching
      const questionSet = await InterviewCacheService.getGeneratedQuestions(
        position,
        difficulty,
        () => OpenAIService.generateQuestions(position)
      )

      // Flatten and shuffle questions
      const allQuestions: InterviewQuestion[] = [
        ...questionSet.behavioral.map((q: any, i: number) => ({ id: `behavioral-${i}`, ...q })),
        ...questionSet.technical.map((q: any, i: number) => ({ id: `technical-${i}`, ...q })),
        ...questionSet.situational.map((q: any, i: number) => ({ id: `situational-${i}`, ...q }))
      ]

      // Filter by difficulty if specified, but fall back to all questions if none match
      let filteredQuestions = allQuestions
      if (difficulty !== 'mixed') {
        const difficultyFiltered = allQuestions.filter(q => q.difficulty === difficulty)
        // Use filtered questions if available, otherwise use all questions as fallback
        filteredQuestions = difficultyFiltered.length > 0 ? difficultyFiltered : allQuestions
        
        if (difficultyFiltered.length === 0) {
          console.warn(`No questions found with difficulty '${difficulty}' for ${position}, using all available questions as fallback`)
        }
      }

      // Shuffle and limit to requested number of questions
      const shuffledQuestions = this.shuffleArray(filteredQuestions)
      const selectedQuestions = shuffledQuestions.slice(0, Math.min(totalQuestions, shuffledQuestions.length))
      
      if (selectedQuestions.length === 0) {
        throw new Error(`No questions available for ${position}`)
      }

      // Check and consume credits before creating interview
      if (existingUser.interviewCredits <= 0) {
        throw new Error('No interview credits available. Please purchase interview credits to continue.')
      }
      
      // Consume one credit
      await db.user.update({
        where: { id: existingUser.id },
        data: {
          interviewCredits: {
            decrement: 1
          }
        }
      })

      // Create the session data that will be stored in feedback field
      const sessionData: InterviewSessionData = {
        id: '', // Will be set to interview.id after creation
        interviewId: '', // Will be set to interview.id after creation
        userId,
        position,
        currentQuestionIndex: 0,
        currentStage: 'question',
        questions: selectedQuestions,
        answers: [],
        status: 'IN_PROGRESS',
        startedAt: new Date().toISOString()
      }

      // Create interview record
      const interview = await db.interview.create({
        data: {
          userId: existingUser.id, // Use the actual user ID from database
          title: `${position} Interview`,
          position,
          difficulty: difficulty === 'mixed' ? 'MEDIUM' : difficulty.toUpperCase() as Difficulty,
          status: 'IN_PROGRESS',
          questions: selectedQuestions.map(q => q.question),
          totalQuestions: selectedQuestions.length,
          scheduledAt: new Date(),
          feedback: null // Will be updated with session data below
        }
      })

      // Update session data with the actual interview ID
      sessionData.id = interview.id
      sessionData.interviewId = interview.id

      // Update the interview with the session data in feedback field
      // Store as JSON string since feedback field is String? in schema
      await db.interview.update({
        where: { id: interview.id },
        data: {
          feedback: JSON.stringify(sessionData)
        }
      })

      return sessionData
    } catch (error) {
      console.error('Error starting interview:', error)
      // Re-throw the original error to preserve specific error messages (like credit errors)
      throw error
    }
  }

  /**
   * Submit an answer and get the next question
   */
  static async submitAnswer(
    sessionId: string,
    clerkUserId: string,
    answer: string,
    skipQuestion: boolean = false
  ): Promise<{
    success: boolean
    sessionData: InterviewSessionData
    nextAction: 'next-question' | 'completed'
    score?: unknown
    finalEvaluation?: unknown
  }> {
    try {
      // Get the user from database - create if doesn't exist
      let user = await db.user.findUnique({
        where: { id: clerkUserId }
      })
      
      if (!user) {
        try {
          user = await db.user.create({
            data: {
              id: clerkUserId,
              email: '',
              password: generateSecurePassword(),
              firstName: '',
              lastName: '',
              interviewCredits: 0,
              createdAt: new Date(),
            }
          })
          // User auto-created for submit answer
        } catch (createError) {
          console.error('Failed to auto-create user:', createError)
          throw new Error('User not found')
        }
      }

      const interview = await db.interview.findUnique({
        where: { id: sessionId }
      })

      if (!interview || interview.userId !== user.id) {
        throw new Error('Interview not found')
      }

      let sessionData: InterviewSessionData
      try {
        sessionData = JSON.parse(interview.feedback || '{}') as InterviewSessionData
      } catch (parseError) {
        throw new Error('Interview session data is corrupted. Please start a new interview.')
      }
      
      if (!sessionData || !sessionData.questions) {
        throw new Error('Interview session data is corrupted or missing. Please start a new interview.')
      }
      
      const currentQuestion = sessionData.questions[sessionData.currentQuestionIndex]
      
      if (!currentQuestion) {
        throw new Error('No current question found')
      }

      // Skip individual scoring - will be done at the end

      // Determine next action based on skip status
      let nextAction: 'next-question' | 'completed' = 'completed'
      const updatedAnswers = [...sessionData.answers]

      if (skipQuestion) {
        // Skipping question - record it as skipped and move to next question
        const answerRecord: InterviewAnswerWithScore = {
          questionId: currentQuestion.id || sessionData.currentQuestionIndex,
          question: currentQuestion.question,
          userAnswer: 'SKIPPED',
          category: currentQuestion.category || 'general',
          timestamp: new Date().toISOString()
        }
        updatedAnswers.push(answerRecord)
      } else {
        // Answer provided - record it and move to next question
        const answerRecord: InterviewAnswerWithScore = {
          questionId: currentQuestion.id || sessionData.currentQuestionIndex,
          question: currentQuestion.question,
          userAnswer: answer,
          category: currentQuestion.category || 'general',
          timestamp: new Date().toISOString()
        }
        
        // Recording answer
        updatedAnswers.push(answerRecord)
      }

      // Determine if we have more questions
      if (sessionData.currentQuestionIndex + 1 < sessionData.questions.length) {
        nextAction = 'next-question'
      } else {
        nextAction = 'completed'
      }

      // Update session data
      const newQuestionIndex = nextAction === 'next-question' 
        ? sessionData.currentQuestionIndex + 1 
        : sessionData.currentQuestionIndex

      const newStage = nextAction === 'next-question' 
          ? 'question' 
          : 'completed'

      const updatedSessionData: InterviewSessionData = {
        id: sessionId,
        interviewId: interview.id,
        userId: clerkUserId,
        position: interview.position || 'General',
        currentQuestionIndex: newQuestionIndex,
        currentStage: newStage,
        questions: sessionData.questions,
        answers: updatedAnswers,
        status: nextAction === 'completed' ? 'COMPLETED' : 'IN_PROGRESS',
        startedAt: interview.createdAt.toISOString(),
        completedAt: nextAction === 'completed' ? new Date().toISOString() : undefined
      }

      // Skip expensive evaluation during answer submission to prevent timeouts
      // This will be done later during completion
      const finalEvaluation = undefined
      if (nextAction === 'completed') {
        // Skipping expensive evaluation during answer submission to prevent timeout
        // Set a default overall score instead of calling OpenAI
        updatedSessionData.overallScore = 75 // Default score, will be updated later
      }

      // Update database for non-completed interviews
      if (nextAction !== 'completed') {
        await db.interview.update({
          where: { id: sessionId },
          data: {
            feedback: JSON.stringify(updatedSessionData),
            status: updatedSessionData.status,
            score: updatedSessionData.overallScore,
            completedAt: null
          }
        })
      }

      // Additional completion updates if needed
      if (nextAction === 'completed') {
        // Interview status already updated above
        // Additional completion logic can be added here if needed

        // Update the existing interview with detailed analysis
        try {
          // Transform answers to DetailedInterviewService format
          const detailedAnswers: InterviewAnswerData[] = updatedAnswers.map((answer, index) => {
            const matchingQuestion = sessionData.questions.find((q: InterviewQuestion) => q.id === answer.questionId)
            
            return {
              questionId: index + 1,
              question: answer.question,
              userAnswer: answer.userAnswer,
              idealAnswer: `A comprehensive answer should demonstrate relevant experience, specific examples, and clear communication.`,
              score: answer.score?.overallScore || 75, // Use existing score or default
              strengths: answer.score?.feedback ? [answer.score.feedback] : ['Clear communication'],
              weaknesses: ['Could provide more specific examples'],
              category: matchingQuestion?.category || 'General',
              responseTime: 30,
              confidence: answer.score?.overallScore || 75
            }
          })

          // Generate detailed analysis
          const analysis = await DetailedInterviewService.generateDetailedAnalysis(detailedAnswers)
          
          // Update the existing interview with detailed analysis data
          await db.interview.update({
            where: { id: sessionId },
            data: {
              company: 'Practice Session',
              status: updatedSessionData.status,
              score: updatedSessionData.overallScore,
              completedAt: new Date(),
              categoryScores: analysis.categoryScores,
              overallAnalysis: analysis.overallAnalysis,
              responseMetrics: analysis.responseMetrics,
              benchmarkData: analysis.benchmarkData,
              improvementPlan: analysis.improvementPlan,
              // Update feedback to include detailed answers analysis
              feedback: JSON.stringify({
                ...updatedSessionData,
                detailedAnswers: detailedAnswers
              })
            }
          })
          
        } catch (detailedError) {
          console.error('❌ Failed to update interview with detailed analysis:', detailedError)
          // Continue without failing the whole process
        }
      }

      return {
        success: true,
        sessionData: updatedSessionData,
        nextAction,
        score: undefined, // No individual scoring
        finalEvaluation // Include final evaluation when completed
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
      throw new Error('Failed to submit answer')
    }
  }

  /**
   * Get current session state with caching
   */
  static async getSession(sessionId: string, clerkUserId: string): Promise<InterviewSessionData | null> {
    return InterviewCacheService.getSessionData(sessionId, async () => {
      const start = Date.now()
      DatabaseMetrics.incrementQueryCount()
      
      try {
        // Get the user from database - create if doesn't exist  
        let user = await db.user.findUnique({
          where: { id: clerkUserId }
        })
        
        if (!user) {
          try {
            user = await db.user.create({
              data: {
                id: clerkUserId,
                email: '',
                password: generateSecurePassword(),
                firstName: '',
                lastName: '',
                interviewCredits: 0,
                createdAt: new Date(),
              }
            })
            // User auto-created for get session
          } catch (createError) {
            console.error('Failed to auto-create user:', createError)
            return null
          }
        }

        const interview = await db.interview.findUnique({
          where: { id: sessionId }
        })

        const queryTime = Date.now() - start
        DatabaseMetrics.recordQueryTime(queryTime)

        if (!interview || interview.userId !== user.id || !interview.feedback) {
          return null
        }

        try {
          return JSON.parse(interview.feedback) as InterviewSessionData
        } catch (parseError) {
          console.error('Error parsing session data:', parseError)
          return null
        }
      } catch (error) {
        console.error('Error getting session:', error)
        const queryTime = Date.now() - start
        DatabaseMetrics.recordQueryTime(queryTime)
        return null
      }
    })
  }

  /**
   * Get user's interview history
   */
  static async getUserInterviews(clerkUserId: string, limit: number = 10) {
    try {
      // Get the user from database - create if doesn't exist
      let user = await db.user.findUnique({
        where: { id: clerkUserId }
      })
      
      if (!user) {
        try {
          user = await db.user.create({
            data: {
              id: clerkUserId,
              email: '',
              password: generateSecurePassword(),
              firstName: '',
              lastName: '',
              interviewCredits: 0,
              createdAt: new Date(),
            }
          })
          // User auto-created for get interviews
        } catch (createError) {
          console.error('Failed to auto-create user:', createError)
          return []
        }
      }

      const interviews = await db.interview.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return interviews.map(interview => ({
        id: interview.id,
        title: interview.title,
        position: interview.position,
        status: interview.status,
        score: interview.score,
        duration: interview.duration,
        completedAt: interview.completedAt,
        createdAt: interview.createdAt
      }))
    } catch (error) {
      console.error('Error getting user interviews:', error)
      return []
    }
  }

  /**
   * Utility function to shuffle array
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}