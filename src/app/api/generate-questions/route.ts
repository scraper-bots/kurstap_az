import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { OpenAIService } from '@/lib/openai'
import { db } from '@/lib/db'

export interface GenerateQuestionsRequest {
  jobTitle: string
  regenerate?: boolean // Force regenerate even if questions exist
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed'
  categories?: ('behavioral' | 'technical' | 'situational')[]
}

export interface GenerateQuestionsResponse {
  success: boolean
  data?: {
    jobTitle: string
    questions: {
      behavioral: Array<{
        question: string
        followUp: string
        category: string
        difficulty: string
        expectedDuration: number
      }>
      technical: Array<{
        question: string
        followUp: string
        category: string
        difficulty: string
        expectedDuration: number
      }>
      situational: Array<{
        question: string
        followUp: string
        category: string
        difficulty: string
        expectedDuration: number
      }>
    }
    totalQuestions: number
    stored: boolean
  }
  error?: string
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: GenerateQuestionsRequest = await req.json()
    const { jobTitle, difficulty = 'mixed', categories } = body

    // Validate input
    if (!jobTitle || jobTitle.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Job title is required' },
        { status: 400 }
      )
    }

    const cleanJobTitle = jobTitle.trim()

    // Generate questions fresh for each request

    console.log(`Generating questions for: ${cleanJobTitle}`)

    // Generate new questions with OpenAI
    const questionSet = await OpenAIService.generateQuestions(cleanJobTitle)
    console.log('✅ Questions generated with OpenAI')

    // Filter by categories if specified
    let filteredQuestionSet = questionSet
    if (categories && categories.length > 0) {
      filteredQuestionSet = {
        ...questionSet,
        behavioral: categories.includes('behavioral') ? questionSet.behavioral : [],
        technical: categories.includes('technical') ? questionSet.technical : [],
        situational: categories.includes('situational') ? questionSet.situational : [],
      }
    }

    // Filter by difficulty if not mixed
    if (difficulty !== 'mixed') {
      const filterByDifficulty = <T extends { difficulty: string }>(questions: T[]): T[] => 
        questions.filter(q => q.difficulty === difficulty)

      filteredQuestionSet = {
        ...filteredQuestionSet,
        behavioral: filterByDifficulty(filteredQuestionSet.behavioral),
        technical: filterByDifficulty(filteredQuestionSet.technical),
        situational: filterByDifficulty(filteredQuestionSet.situational),
      }
    }

    let stored = false
    
    // Questions generated on-demand, no storage needed
    stored = false

    // Log generation activity
    try {
      await db.user.update({
        where: { clerkId: userId },
        data: { updatedAt: new Date() }
      })
    } catch (dbError) {
      console.warn('Could not update user activity:', dbError)
    }

    const totalQuestions = 
      filteredQuestionSet.behavioral.length + 
      filteredQuestionSet.technical.length + 
      filteredQuestionSet.situational.length

    return NextResponse.json({
      success: true,
      data: {
        jobTitle: cleanJobTitle,
        questions: {
          behavioral: filteredQuestionSet.behavioral,
          technical: filteredQuestionSet.technical,
          situational: filteredQuestionSet.situational,
        },
        totalQuestions,
        stored,
      }
    })

  } catch (error) {
    console.error('Error in generate-questions API:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate questions'
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const jobTitle = searchParams.get('jobTitle')
    const category = searchParams.get('category') as 'behavioral' | 'technical' | 'situational' | null
    // const limit = parseInt(searchParams.get('limit') || '20') // Currently unused

    if (!jobTitle) {
      return NextResponse.json(
        { success: false, error: 'Job title is required' },
        { status: 400 }
      )
    }

    // No persistent storage - generate fresh questions
    console.log(`Generating fresh questions for ${jobTitle} (no storage)`)
    
    // Generate new questions using OpenAI
    const questionSet = await OpenAIService.generateQuestions(jobTitle)

    // Filter by category if specified
    let questions = {
      behavioral: questionSet.behavioral,
      technical: questionSet.technical,
      situational: questionSet.situational,
    }

    if (category) {
      questions = {
        behavioral: category === 'behavioral' ? questionSet.behavioral : [],
        technical: category === 'technical' ? questionSet.technical : [],
        situational: category === 'situational' ? questionSet.situational : [],
      }
    }

    const totalQuestions = questions.behavioral.length + questions.technical.length + questions.situational.length

    return NextResponse.json({
      success: true,
      data: {
        jobTitle,
        questions,
        totalQuestions,
        stored: false, // No persistent storage
      }
    })

  } catch (error) {
    console.error('Error getting questions:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get questions'
      },
      { status: 500 }
    )
  }
}