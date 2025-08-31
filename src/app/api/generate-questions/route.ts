import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { OpenAIService } from '@/lib/openai'
// Pinecone removed - using in-memory question generation only
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
      behavioral: any[]
      technical: any[]
      situational: any[]
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

    // Skip Pinecone check for now (index not set up)
    console.log('Skipping Pinecone check - generating fresh questions')

    console.log(`Generating questions for: ${cleanJobTitle}`)

    // Generate new questions with OpenAI (with fallback to mock data)
    let questionSet: any
    try {
      questionSet = await OpenAIService.generateQuestions(cleanJobTitle)
      console.log('✅ Questions generated with OpenAI')
    } catch (openaiError: any) {
      console.warn('OpenAI failed, using mock questions:', openaiError.message)
      questionSet = OpenAIService.generateMockQuestions(cleanJobTitle)
      console.log('✅ Questions generated with mock data')
    }

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
      const filterByDifficulty = (questions: any[]) => 
        questions.filter(q => q.difficulty === difficulty)

      filteredQuestionSet = {
        ...filteredQuestionSet,
        behavioral: filterByDifficulty(filteredQuestionSet.behavioral),
        technical: filterByDifficulty(filteredQuestionSet.technical),
        situational: filterByDifficulty(filteredQuestionSet.situational),
      }
    }

    let stored = false
    
    // Skip Pinecone storage (not set up yet)
    console.log('Pinecone storage disabled - questions generated in-memory only')
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
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!jobTitle) {
      return NextResponse.json(
        { success: false, error: 'Job title is required' },
        { status: 400 }
      )
    }

    // No persistent storage - generate fresh questions
    console.log(`Generating fresh questions for ${jobTitle} (no storage)`)
    
    // Generate new questions
    let questionSet
    try {
      questionSet = await OpenAIService.generateQuestions(jobTitle)
    } catch (error) {
      console.warn('Using mock questions due to OpenAI error:', error)
      questionSet = OpenAIService.generateMockQuestions(jobTitle)
    }

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