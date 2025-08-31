import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { OpenAIService } from '@/lib/openai'
import { PineconeService } from '@/lib/pinecone'
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
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: GenerateQuestionsRequest = await req.json()
    const { jobTitle, regenerate = false, difficulty = 'mixed', categories } = body

    // Validate input
    if (!jobTitle || jobTitle.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Job title is required' },
        { status: 400 }
      )
    }

    const cleanJobTitle = jobTitle.trim()

    // Check if questions already exist (unless regenerating)
    if (!regenerate) {
      try {
        const existingQuestions = await PineconeService.getQuestionsByJobTitle(cleanJobTitle)
        
        if (existingQuestions.length > 0) {
          // Group existing questions by category
          const grouped = {
            behavioral: existingQuestions.filter(q => q.category === 'behavioral'),
            technical: existingQuestions.filter(q => q.category === 'technical'),
            situational: existingQuestions.filter(q => q.category === 'situational'),
          }

          return NextResponse.json({
            success: true,
            data: {
              jobTitle: cleanJobTitle,
              questions: grouped,
              totalQuestions: existingQuestions.length,
              stored: true,
            }
          })
        }
      } catch (pineconeError) {
        console.warn('Could not check existing questions, proceeding with generation:', pineconeError)
      }
    }

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
    
    // Store in Pinecone (disabled for testing)
    try {
      // TODO: Re-enable Pinecone storage after setting up index
      console.log('Pinecone storage disabled for testing')
      stored = false
      
      // if (regenerate) {
      //   // Delete existing questions first
      //   await PineconeService.deleteQuestionsByJobTitle(cleanJobTitle)
      // }
      
      // await PineconeService.storeQuestionSet(filteredQuestionSet)
      // stored = true
      
      // console.log(`Successfully stored questions for ${cleanJobTitle}`)
    } catch (pineconeError) {
      console.error('Failed to store questions in Pinecone:', pineconeError)
      // Continue without storing - return generated questions anyway
    }

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
    const { userId } = auth()
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

    // Get existing questions from Pinecone
    const questions = await PineconeService.getQuestionsByJobTitle(
      jobTitle,
      category || undefined,
      limit
    )

    // Group by category
    const grouped = {
      behavioral: questions.filter(q => q.category === 'behavioral'),
      technical: questions.filter(q => q.category === 'technical'),
      situational: questions.filter(q => q.category === 'situational'),
    }

    return NextResponse.json({
      success: true,
      data: {
        jobTitle,
        questions: grouped,
        totalQuestions: questions.length,
        stored: true,
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