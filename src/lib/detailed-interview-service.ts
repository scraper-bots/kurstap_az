import { db } from './db'
import { Interview, Difficulty, InterviewStatus } from '@prisma/client'

export interface DetailedInterviewData {
  title: string
  company?: string
  position: string
  difficulty: Difficulty
  duration: number
  score: number
  categoryScores: {
    [category: string]: number
  }
  overallAnalysis: {
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
  }
  responseMetrics: {
    averageResponseTime: number
    confidence: number
    communicationSkills: {
      [skill: string]: number
    }
  }
  benchmarkData: {
    industryAverage: { [category: string]: number }
    yourScores: { [category: string]: number }
    percentileRanking: number
  }
  improvementPlan: {
    immediate: Array<{
      skill: string
      timeline: string
      resources: string[]
      measurableGoal: string
    }>
    longTerm: Array<{
      skill: string
      timeline: string
      resources: string[]
      measurableGoal: string
    }>
  }
}

export interface InterviewAnswerData {
  questionId: number
  question: string
  userAnswer: string
  idealAnswer?: string
  score: number
  strengths: string[]
  weaknesses: string[]
  category: string
  responseTime?: number
  confidence?: number
}

export class DetailedInterviewService {
  /**
   * Create a new detailed interview with all analysis data
   */
  static async createDetailedInterview(
    userId: string,
    interviewData: DetailedInterviewData,
    answers: InterviewAnswerData[]
  ): Promise<Interview> {
    try {
      // Verify the user exists
      const dbUser = await db.user.findUnique({
        where: { id: userId }
      })

      if (!dbUser) {
        throw new Error(`Database user not found for user ID: ${userId}`)
      }

      const interview = await db.interview.create({
        data: {
          userId: dbUser.id,
          title: interviewData.title,
          company: interviewData.company,
          position: interviewData.position,
          difficulty: interviewData.difficulty,
          status: 'COMPLETED' as InterviewStatus,
          duration: interviewData.duration,
          score: interviewData.score,
          categoryScores: interviewData.categoryScores,
          overallAnalysis: interviewData.overallAnalysis,
          responseMetrics: interviewData.responseMetrics,
          benchmarkData: interviewData.benchmarkData,
          improvementPlan: interviewData.improvementPlan,
          completedAt: new Date(),
          questions: answers.map(a => a.question),
          totalQuestions: answers.length,
          answers: {
            create: answers.map(answer => ({
              questionId: answer.questionId,
              question: answer.question,
              userAnswer: answer.userAnswer,
              idealAnswer: answer.idealAnswer,
              score: answer.score,
              strengths: answer.strengths,
              weaknesses: answer.weaknesses,
              category: answer.category,
              responseTime: answer.responseTime,
              confidence: answer.confidence
            }))
          }
        },
        include: {
          answers: true
        }
      })

      console.log('Detailed interview created successfully:', interview.id)
      return interview
    } catch (error) {
      console.error('Error creating detailed interview:', error)
      throw error
    }
  }

  /**
   * Get all interviews for a user with basic info
   */
  static async getUserInterviews(userId: string): Promise<Interview[]> {
    try {
      return await db.interview.findMany({
        where: { 
          userId,
          status: 'COMPLETED'
        },
        orderBy: { completedAt: 'desc' },
        include: {
          _count: {
            select: { answers: true }
          }
        }
      })
    } catch (error) {
      console.error('Error fetching user interviews:', error)
      return []
    }
  }

  /**
   * Get detailed interview data by ID
   */
  static async getDetailedInterview(interviewId: string, userId: string) {
    try {
      const interview = await db.interview.findFirst({
        where: { 
          id: interviewId,
          userId // Ensure user owns this interview
        },
        include: {
          answers: {
            orderBy: { questionId: 'asc' }
          }
        }
      })

      return interview
    } catch (error) {
      console.error('Error fetching detailed interview:', error)
      return null
    }
  }

  /**
   * Get user interview statistics
   */
  static async getUserInterviewStats(userId: string) {
    try {
      const interviews = await db.interview.findMany({
        where: { 
          userId,
          status: 'COMPLETED'
        },
        select: {
          score: true,
          duration: true,
          completedAt: true,
          categoryScores: true
        }
      })

      if (interviews.length === 0) {
        return {
          totalInterviews: 0,
          averageScore: 0,
          totalTime: 0,
          improvement: 0,
          completedInterviews: 0
        }
      }

      const totalInterviews = interviews.length
      const averageScore = interviews.reduce((sum, i) => sum + (i.score || 0), 0) / totalInterviews
      const totalTime = interviews.reduce((sum, i) => sum + (i.duration || 0), 0)
      
      // Calculate improvement trend (last 3 vs first 3 interviews)
      const sortedInterviews = interviews.sort((a, b) => 
        new Date(a.completedAt || 0).getTime() - new Date(b.completedAt || 0).getTime()
      )
      
      let improvement = 0
      if (sortedInterviews.length >= 6) {
        const firstThree = sortedInterviews.slice(0, 3).reduce((sum, i) => sum + (i.score || 0), 0) / 3
        const lastThree = sortedInterviews.slice(-3).reduce((sum, i) => sum + (i.score || 0), 0) / 3
        improvement = Math.round(((lastThree - firstThree) / firstThree) * 100)
      }

      return {
        totalInterviews,
        averageScore: Math.round(averageScore),
        totalTime: Math.round(totalTime / 60), // Convert to hours
        improvement,
        completedInterviews: totalInterviews
      }
    } catch (error) {
      console.error('Error fetching user interview stats:', error)
      return {
        totalInterviews: 0,
        averageScore: 0,
        totalTime: 0,
        improvement: 0,
        completedInterviews: 0
      }
    }
  }

  /**
   * Generate detailed analysis from interview answers (AI processing)
   */
  static async generateDetailedAnalysis(answers: InterviewAnswerData[]): Promise<{
    categoryScores: { [category: string]: number }
    overallAnalysis: DetailedInterviewData['overallAnalysis']
    responseMetrics: DetailedInterviewData['responseMetrics']
    benchmarkData: DetailedInterviewData['benchmarkData']
    improvementPlan: DetailedInterviewData['improvementPlan']
  }> {
    // This would typically call OpenAI or another AI service for analysis
    // For now, I'll provide a structured analysis based on the answers
    
    const categories = Array.from(new Set(answers.map(a => a.category)))
    const categoryScores: { [category: string]: number } = {}
    
    // Calculate category scores
    categories.forEach(category => {
      const categoryAnswers = answers.filter(a => a.category === category)
      const avgScore = categoryAnswers.reduce((sum, a) => sum + a.score, 0) / categoryAnswers.length
      categoryScores[category] = Math.round(avgScore)
    })

    // Calculate overall metrics
    const overallScore = answers.reduce((sum, a) => sum + a.score, 0) / answers.length
    const avgResponseTime = answers.filter(a => a.responseTime).reduce((sum, a) => sum + (a.responseTime || 0), 0) / answers.filter(a => a.responseTime).length
    const avgConfidence = answers.filter(a => a.confidence).reduce((sum, a) => sum + (a.confidence || 0), 0) / answers.filter(a => a.confidence).length

    // Collect all strengths and weaknesses
    const allStrengths = answers.flatMap(a => a.strengths)
    const allWeaknesses = answers.flatMap(a => a.weaknesses)
    
    // Remove duplicates and get top items
    const uniqueStrengths = Array.from(new Set(allStrengths)).slice(0, 4)
    const uniqueWeaknesses = Array.from(new Set(allWeaknesses)).slice(0, 4)

    return {
      categoryScores,
      overallAnalysis: {
        strengths: uniqueStrengths,
        weaknesses: uniqueWeaknesses,
        recommendations: [
          'Practice more system design problems focusing on complete architecture',
          'Work on coding implementation details and complexity analysis', 
          'Study common design patterns and when to apply them',
          'Practice explaining technical concepts with more depth'
        ]
      },
      responseMetrics: {
        averageResponseTime: Math.round(avgResponseTime || 30),
        confidence: Math.round(avgConfidence || 75),
        communicationSkills: {
          clarity: Math.round(overallScore * 1.1),
          structure: Math.round(overallScore * 0.95),
          engagement: Math.round(overallScore * 1.05),
          technicalLanguage: Math.round(overallScore * 1.15)
        }
      },
      benchmarkData: {
        industryAverage: {
          overall: 72,
          ...Object.keys(categoryScores).reduce((acc, cat) => ({
            ...acc,
            [cat.toLowerCase()]: Math.round(72 + (Math.random() - 0.5) * 10)
          }), {})
        },
        yourScores: {
          overall: Math.round(overallScore),
          ...Object.keys(categoryScores).reduce((acc, cat) => ({
            ...acc,
            [cat.toLowerCase()]: categoryScores[cat]
          }), {})
        },
        percentileRanking: Math.round(Math.min(95, Math.max(5, overallScore * 0.85 + 10)))
      },
      improvementPlan: {
        immediate: [
          {
            skill: 'System Design Fundamentals',
            timeline: '2-3 weeks',
            resources: ['Designing Data-Intensive Applications book', 'System Design Interview courses'],
            measurableGoal: 'Complete 10 system design problems with detailed solutions'
          }
        ],
        longTerm: [
          {
            skill: 'Leadership & Communication',
            timeline: '2-3 months', 
            resources: ['Technical leadership courses', 'Practice technical presentations'],
            measurableGoal: 'Lead a technical architecture discussion at work'
          }
        ]
      }
    }
  }
}