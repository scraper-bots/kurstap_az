import { db } from './db'
import { OpenAIService } from './openai'
import { PineconeService } from './pinecone'
import { Interview, Session, SessionStatus, InterviewStatus } from '@prisma/client'

export interface InterviewQuestion {
  id: string
  question: string
  followUp: string
  category: 'behavioral' | 'technical' | 'situational'
  difficulty: 'easy' | 'medium' | 'hard'
  expectedDuration: number
}

export interface InterviewAnswer {
  questionId: string
  question: string
  answer: string
  followUpQuestion?: string
  followUpAnswer?: string
  score?: {
    technicalAccuracy: number
    communicationClarity: number
    problemSolvingApproach: number
    overallScore: number
    feedback: string
  }
  timestamp: string
}

export interface InterviewSessionData {
  id: string
  interviewId: string
  userId: string
  position: string
  currentQuestionIndex: number
  currentStage: 'question' | 'follow-up' | 'completed'
  questions: InterviewQuestion[]
  answers: InterviewAnswer[]
  overallScore?: number
  status: SessionStatus
  startedAt: string
  completedAt?: string
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
      // Ensure user exists in database first
      const existingUser = await db.user.findUnique({
        where: { clerkId: userId }
      })
      
      if (!existingUser) {
        throw new Error('User not found. Please sign in again.')
      }

      // Generate questions for the position
      let questionSet
      try {
        questionSet = await OpenAIService.generateQuestions(position)
      } catch (error) {
        console.warn('Using mock questions due to OpenAI error:', error)
        questionSet = OpenAIService.generateMockQuestions(position)
      }

      // Flatten and shuffle questions
      const allQuestions: InterviewQuestion[] = [
        ...questionSet.behavioral.map((q, i) => ({ id: `behavioral-${i}`, ...q })),
        ...questionSet.technical.map((q, i) => ({ id: `technical-${i}`, ...q })),
        ...questionSet.situational.map((q, i) => ({ id: `situational-${i}`, ...q }))
      ]

      // Filter by difficulty if specified
      let filteredQuestions = allQuestions
      if (difficulty !== 'mixed') {
        filteredQuestions = allQuestions.filter(q => q.difficulty === difficulty)
      }

      // Shuffle and take first 8 questions for a reasonable interview length
      const selectedQuestions = this.shuffleArray(filteredQuestions).slice(0, 8)

      // Create interview record
      const interview = await db.interview.create({
        data: {
          userId: existingUser.id, // Use the actual user ID from database
          title: `${position} Interview`,
          position,
          difficulty: difficulty === 'mixed' ? 'MEDIUM' : difficulty.toUpperCase() as any,
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
            questions: selectedQuestions as any,
            answers: [] as any,
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
    answer: string
  ): Promise<{
    success: boolean
    sessionData: InterviewSessionData
    nextAction: 'next-question' | 'follow-up' | 'completed'
    score?: any
  }> {
    try {
      // Get the user from database
      const user = await db.user.findUnique({
        where: { clerkId: clerkUserId }
      })
      
      if (!user) {
        throw new Error('User not found')
      }

      const session = await db.session.findUnique({
        where: { id: sessionId, userId: user.id },
        include: { interview: true }
      })

      if (!session) {
        throw new Error('Session not found')
      }

      const sessionData = session.feedback as any
      const currentQuestion = sessionData.questions[sessionData.currentQuestionIndex]
      
      if (!currentQuestion) {
        throw new Error('No current question found')
      }

      // Score the answer using GPT-4
      let score
      try {
        score = await OpenAIService.scoreAnswer(
          currentQuestion.question,
          answer,
          session.interview?.position || 'General',
          currentQuestion.category
        )
      } catch (error) {
        console.warn('Failed to score answer, using default:', error)
        score = {
          technicalAccuracy: 7,
          communicationClarity: 7,
          problemSolvingApproach: 7,
          overallScore: 7,
          feedback: "Answer received. Due to technical limitations, detailed scoring is not available at this time."
        }
      }

      // Determine next action based on current stage
      let nextAction: 'next-question' | 'follow-up' | 'completed' = 'completed'
      let updatedAnswers = [...sessionData.answers]

      if (sessionData.currentStage === 'question') {
        // First answer to main question - ask follow-up
        const answerRecord: InterviewAnswer = {
          questionId: currentQuestion.id,
          question: currentQuestion.question,
          answer,
          score,
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

      // Calculate overall score if completed
      if (nextAction === 'completed') {
        const scores = updatedAnswers.map(a => a.score?.overallScore || 0)
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
        updatedSessionData.overallScore = Math.round(averageScore)
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
      }

      return {
        success: true,
        sessionData: updatedSessionData,
        nextAction,
        score
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
      // Get the user from database
      const user = await db.user.findUnique({
        where: { clerkId: clerkUserId }
      })
      
      if (!user) {
        return null
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
      // Get the user from database
      const user = await db.user.findUnique({
        where: { clerkId: clerkUserId }
      })
      
      if (!user) {
        return []
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