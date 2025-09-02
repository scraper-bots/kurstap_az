import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { DetailedInterviewService, DetailedInterviewData, InterviewAnswerData } from '@/lib/detailed-interview-service'

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('📝 Completion API - Request body:', JSON.stringify(body, null, 2))
    
    const { interviewData, answers }: { 
      interviewData: Omit<DetailedInterviewData, 'categoryScores' | 'overallAnalysis' | 'responseMetrics' | 'benchmarkData' | 'improvementPlan'>
      answers: InterviewAnswerData[] 
    } = body

    console.log('📝 Completion API - Parsed data:', {
      hasInterviewData: !!interviewData,
      interviewDataKeys: interviewData ? Object.keys(interviewData) : [],
      answersCount: answers ? answers.length : 0,
      answersPreview: answers ? answers.slice(0, 2) : []
    })

    if (!answers || answers.length === 0) {
      console.log('❌ Completion API - No answers provided')
      return NextResponse.json({ error: 'No answers provided' }, { status: 400 })
    }

    if (!interviewData) {
      console.log('❌ Completion API - No interview data provided')
      return NextResponse.json({ error: 'No interview data provided' }, { status: 400 })
    }

    // Validate required fields in interviewData
    const requiredFields = ['title', 'position', 'difficulty', 'duration', 'score']
    const missingFields = requiredFields.filter(field => !(field in interviewData) || interviewData[field as keyof typeof interviewData] === undefined)
    
    if (missingFields.length > 0) {
      console.log('❌ Completion API - Missing required fields:', missingFields)
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 })
    }

    // Generate detailed analysis from answers
    const analysis = await DetailedInterviewService.generateDetailedAnalysis(answers)

    // Create complete interview data
    const completeInterviewData: DetailedInterviewData = {
      ...interviewData,
      ...analysis
    }

    // Save to database
    const interview = await DetailedInterviewService.createDetailedInterview(
      user.id,
      completeInterviewData,
      answers
    )

    return NextResponse.json({ 
      success: true, 
      interviewId: interview.id,
      message: 'Interview completed and analysis saved successfully'
    })
  } catch (error) {
    console.error('Error completing interview:', error)
    return NextResponse.json({ 
      error: 'Failed to save interview data' 
    }, { status: 500 })
  }
}