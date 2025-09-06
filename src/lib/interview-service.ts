import { db } from './db'
import { OpenAIService } from './openai'
import { SessionStatus, Difficulty } from '@prisma/client'
import { DetailedInterviewService, DetailedInterviewData, InterviewAnswerData } from './detailed-interview-service'
import { InterviewQuestion, InterviewAnswer } from '@/types/common'

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
  currentStage: 'question' | 'follow-up' | 'completed'
  questions: InterviewQuestion[]
  answers: InterviewAnswerWithScore[]
  overallScore?: number
  status: SessionStatus
  startedAt: string
  completedAt?: string
  detailedInterviewId?: string
}

export class InterviewService {
  /**
   * Start a new interview session
   */
  static async startInterview(
    userId: string,
    position: string,
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed' = 'mixed'
  ): Promise<InterviewSessionData> {
    try {
      // Ensure user exists in database first - create if doesn't exist
      let existingUser = await db.user.findUnique({
        where: { clerkId: userId }
      })
      
      if (!existingUser) {
        // Try to create the user automatically
        try {
          existingUser = await db.user.create({
            data: {
              clerkId: userId,
              email: '', // Will be updated via webhook later
              firstName: '',
              lastName: '',
              interviewCredits: 0,
              createdAt: new Date(),
            }
          })
          console.log('Auto-created user for interview:', userId)
        } catch (createError) {
          console.error('Failed to auto-create user:', createError)
          throw new Error('User not found. Please sign in again.')
        }
      }

      // Generate questions for the position using OpenAI
      const questionSet = await OpenAIService.generateQuestions(position)

      // Flatten and shuffle questions
      const allQuestions: InterviewQuestion[] = [
        ...questionSet.behavioral.map((q, i) => ({ id: `behavioral-${i}`, ...q })),
        ...questionSet.technical.map((q, i) => ({ id: `technical-${i}`, ...q })),
        ...questionSet.situational.map((q, i) => ({ id: `situational-${i}`, ...q }))
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

      // Use all available questions
      const selectedQuestions = this.shuffleArray(filteredQuestions)
      
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
          scheduledAt: new Date(),
        }
      })

      // Create session record
      const session = await db.session.create({
        data: {
          userId: existingUser.id, // Use the actual user ID from database
          interviewId: interview.id,
          type: 'PRACTICE',
          status: 'IN_PROGRESS',
          feedback: {
            questions: selectedQuestions,
            answers: [],
            currentQuestionIndex: 0,
            currentStage: 'question'
          } as any
        }
      })

      return {
        id: session.id,
        interviewId: interview.id,
        userId,
        position,
        currentQuestionIndex: 0,
        currentStage: 'question',
        questions: selectedQuestions,
        answers: [],
        status: 'IN_PROGRESS',
        startedAt: session.startedAt.toISOString()
      }
    } catch (error) {
      console.error('Error starting interview:', error)
      throw new Error('Failed to start interview session')
    }
  }

  /**
   * Submit an answer and get the next question or follow-up
   */
  static async submitAnswer(
    sessionId: string,
    clerkUserId: string,
    answer: string,
    skipQuestion: boolean = false
  ): Promise<{
    success: boolean
    sessionData: InterviewSessionData
    nextAction: 'next-question' | 'follow-up' | 'completed'
    score?: unknown
    finalEvaluation?: unknown
  }> {
    try {
      // Get the user from database - create if doesn't exist
      let user = await db.user.findUnique({
        where: { clerkId: clerkUserId }
      })
      
      if (!user) {
        try {
          user = await db.user.create({
            data: {
              clerkId: clerkUserId,
              email: '',
              firstName: '',
              lastName: '',
              interviewCredits: 0,
              createdAt: new Date(),
            }
          })
          console.log('Auto-created user for submit answer:', clerkUserId)
        } catch (createError) {
          console.error('Failed to auto-create user:', createError)
          throw new Error('User not found')
        }
      }

      const session = await db.session.findUnique({
        where: { id: sessionId, userId: user.id },
        include: { interview: true }
      })

      if (!session) {
        throw new Error('Session not found')
      }

      const sessionData = session.feedback as unknown as InterviewSessionData
      const currentQuestion = sessionData.questions[sessionData.currentQuestionIndex]
      
      if (!currentQuestion) {
        throw new Error('No current question found')
      }

      // Skip individual scoring - will be done at the end

      // Determine next action based on current stage and skip status
      let nextAction: 'next-question' | 'follow-up' | 'completed' = 'completed'
      const updatedAnswers = [...sessionData.answers]

      if (skipQuestion) {
        // Skipping question - record it as skipped and move to next question
        const answerRecord: InterviewAnswerWithScore = {
          questionId: currentQuestion.id || sessionData.currentQuestionIndex,
          question: currentQuestion.question,
          userAnswer: 'SKIPPED',
          category: currentQuestion.category || 'general',
          timestamp: new Date().toISOString(),
          followUpQuestion: currentQuestion.followUp,
          followUpAnswer: 'SKIPPED'
        }
        updatedAnswers.push(answerRecord)

        if (sessionData.currentQuestionIndex + 1 < sessionData.questions.length) {
          nextAction = 'next-question'
        } else {
          nextAction = 'completed'
        }
      } else if (sessionData.currentStage === 'question') {
        // First answer to main question - ask follow-up
        const answerRecord: InterviewAnswerWithScore = {
          questionId: currentQuestion.id || sessionData.currentQuestionIndex,
          question: currentQuestion.question,
          userAnswer: answer,
          category: currentQuestion.category || 'general',
          timestamp: new Date().toISOString()
        }
        updatedAnswers.push(answerRecord)
        nextAction = 'follow-up'
      } else if (sessionData.currentStage === 'follow-up') {
        // Follow-up answer - move to next question
        const lastAnswerIndex = updatedAnswers.findIndex(a => a.questionId === currentQuestion.id)
        if (lastAnswerIndex >= 0) {
          updatedAnswers[lastAnswerIndex] = {
            ...updatedAnswers[lastAnswerIndex],
            followUpQuestion: currentQuestion.followUp,
            followUpAnswer: answer
          }
        }

        if (sessionData.currentQuestionIndex + 1 < sessionData.questions.length) {
          nextAction = 'next-question'
        } else {
          nextAction = 'completed'
        }
      }

      // Update session data
      const newQuestionIndex = nextAction === 'next-question' 
        ? sessionData.currentQuestionIndex + 1 
        : sessionData.currentQuestionIndex

      const newStage = nextAction === 'follow-up' 
        ? 'follow-up' 
        : nextAction === 'next-question' 
          ? 'question' 
          : 'completed'

      const updatedSessionData: InterviewSessionData = {
        id: sessionId,
        interviewId: session.interviewId!,
        userId: clerkUserId,
        position: session.interview?.position || 'General',
        currentQuestionIndex: newQuestionIndex,
        currentStage: newStage,
        questions: sessionData.questions,
        answers: updatedAnswers,
        status: nextAction === 'completed' ? 'COMPLETED' : 'IN_PROGRESS',
        startedAt: session.startedAt.toISOString(),
        completedAt: nextAction === 'completed' ? new Date().toISOString() : undefined
      }

      // Perform comprehensive evaluation if completed
      let finalEvaluation = undefined
      if (nextAction === 'completed') {
        try {
          
          // Prepare questions and answers for evaluation
          const questionsAndAnswers = updatedAnswers.map((answer) => {
            const question = sessionData.questions.find((q: InterviewQuestion) => q.id === answer.questionId)
            return {
              question: answer.question,
              answer: answer.userAnswer,
              followUpQuestion: answer.followUpQuestion,
              followUpAnswer: answer.followUpAnswer,
              category: question?.category || 'general',
              difficulty: question?.difficulty || 'medium'
            }
          })

          finalEvaluation = await OpenAIService.evaluateCompleteInterview(
            session.interview?.position || 'General',
            questionsAndAnswers
          )
          
          updatedSessionData.overallScore = finalEvaluation.overallScore
          
          // Store detailed evaluation in answers
          finalEvaluation.detailedFeedback.forEach((feedback, index) => {
            if (updatedAnswers[index]) {
              updatedAnswers[index].score = {
                technicalAccuracy: feedback.scores.technicalAccuracy,
                communicationClarity: feedback.scores.communicationClarity,
                problemSolvingApproach: feedback.scores.problemSolvingApproach,
                overallScore: feedback.scores.overallScore,
                feedback: feedback.feedback
              }
            }
          })
        } catch (error) {
          console.error('Failed to evaluate interview:', error)
          // Use fallback score
          updatedSessionData.overallScore = 75
        }
      }

      // Update database
      await db.session.update({
        where: { id: sessionId },
        data: {
          feedback: updatedSessionData as any,
          status: updatedSessionData.status,
          score: updatedSessionData.overallScore,
          completedAt: nextAction === 'completed' ? new Date() : null
        }
      })

      // Update interview if completed
      if (nextAction === 'completed') {
        await db.interview.update({
          where: { id: session.interviewId! },
          data: {
            status: 'COMPLETED',
            score: updatedSessionData.overallScore,
            completedAt: new Date(),
            feedback: `Interview completed with ${updatedAnswers.length} questions answered.`
          }
        })

        // Create detailed interview analysis
        try {
          
          // Transform answers to DetailedInterviewService format
          const detailedAnswers: InterviewAnswerData[] = updatedAnswers.map((answer, index) => {
            const matchingQuestion = sessionData.questions.find((q: InterviewQuestion) => q.id === answer.questionId)
            
            return {
              questionId: index + 1,
              question: answer.question,
              userAnswer: answer.userAnswer + (answer.followUpAnswer ? `\n\nFollow-up: ${answer.followUpAnswer}` : ''),
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
            title: `${session.interview?.position || 'General'} Interview`,
            company: 'Practice Session',
            position: session.interview?.position || 'General',
            difficulty: session.interview?.difficulty || 'MEDIUM',
            duration: Math.round(((new Date()).getTime() - session.startedAt.getTime()) / 1000 / 60),
            score: updatedSessionData.overallScore || 75,
            ...analysis
          }

          // Create the detailed interview (this will create a separate interview record with full analysis)
          const detailedInterview = await DetailedInterviewService.createDetailedInterview(
            user.clerkId, // Use Clerk ID for consistency with frontend
            detailedInterviewData,
            detailedAnswers
          )
          
          // Store the detailed interview ID in the session for reference
          updatedSessionData.detailedInterviewId = detailedInterview.id
          
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
   * Get current session state
   */
  static async getSession(sessionId: string, clerkUserId: string): Promise<InterviewSessionData | null> {
    try {
      // Get the user from database - create if doesn't exist  
      let user = await db.user.findUnique({
        where: { clerkId: clerkUserId }
      })
      
      if (!user) {
        try {
          user = await db.user.create({
            data: {
              clerkId: clerkUserId,
              email: '',
              firstName: '',
              lastName: '',
              interviewCredits: 0,
              createdAt: new Date(),
            }
          })
          console.log('Auto-created user for get session:', clerkUserId)
        } catch (createError) {
          console.error('Failed to auto-create user:', createError)
          return null
        }
      }

      const session = await db.session.findUnique({
        where: { id: sessionId, userId: user.id },
        include: { interview: true }
      })

      if (!session || !session.feedback) {
        return null
      }

      return session.feedback as unknown as InterviewSessionData
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
  }

  /**
   * Get user's interview history
   */
  static async getUserInterviews(clerkUserId: string, limit: number = 10) {
    try {
      // Get the user from database - create if doesn't exist
      let user = await db.user.findUnique({
        where: { clerkId: clerkUserId }
      })
      
      if (!user) {
        try {
          user = await db.user.create({
            data: {
              clerkId: clerkUserId,
              email: '',
              firstName: '',
              lastName: '',
              interviewCredits: 0,
              createdAt: new Date(),
            }
          })
          console.log('Auto-created user for get interviews:', clerkUserId)
        } catch (createError) {
          console.error('Failed to auto-create user:', createError)
          return []
        }
      }

      const interviews = await db.interview.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          sessions: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      return interviews.map(interview => ({
        id: interview.id,
        title: interview.title,
        position: interview.position,
        status: interview.status,
        score: interview.score,
        duration: interview.sessions[0]?.duration,
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