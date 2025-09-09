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
        }
      })

      return {
        id: interview.id,
        interviewId: interview.id,
        userId,
        position,
        currentQuestionIndex: 0,
        currentStage: 'question',
        questions: selectedQuestions,
        answers: [],
        status: 'IN_PROGRESS',
        startedAt: interview.createdAt.toISOString()
      }
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

      const sessionData = interview.feedback as unknown as InterviewSessionData
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

      // Update database
      await db.interview.update({
        where: { id: sessionId },
        data: {
          feedback: updatedSessionData as any,
          status: updatedSessionData.status,
          score: updatedSessionData.overallScore,
          completedAt: nextAction === 'completed' ? new Date() : null
        }
      })

      // Additional completion updates if needed
      if (nextAction === 'completed') {
        // Interview status already updated above
        // Additional completion logic can be added here if needed

        // Create detailed interview analysis
        try {
          // Check if detailed interview already exists for this session
          const existingDetailedInterview = await db.interview.findFirst({
            where: {
              userId: user.id,
              title: `${interview.position || 'General'} Interview`,
              company: 'Practice Session',
              createdAt: {
                // Look for interviews created in the last hour to avoid duplicates
                gte: new Date(Date.now() - 60 * 60 * 1000)
              }
            }
          })

          if (existingDetailedInterview) {
            // Detailed interview already exists, skipping creation
            updatedSessionData.detailedInterviewId = existingDetailedInterview.id
          } else {
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
          
          // Create detailed interview data
          const detailedInterviewData: DetailedInterviewData = {
            title: `${interview.position || 'General'} Interview`,
            company: 'Practice Session',
            position: interview.position || 'General',
            difficulty: interview.difficulty || 'MEDIUM',
            duration: Math.round(((new Date()).getTime() - interview.createdAt.getTime()) / 1000 / 60),
            score: updatedSessionData.overallScore || 75,
            ...analysis
          }

          // Create the detailed interview (this will create a separate interview record with full analysis)
          const detailedInterview = await DetailedInterviewService.createDetailedInterview(
            user.id, // Use Clerk ID for consistency with frontend
            detailedInterviewData,
            detailedAnswers
          )
          
          // Store the detailed interview ID in the session for reference
          updatedSessionData.detailedInterviewId = detailedInterview.id
          }
          
        } catch (detailedError) {
          console.error('❌ Failed to create detailed interview analysis:', detailedError)
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

        return interview.feedback as unknown as InterviewSessionData
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