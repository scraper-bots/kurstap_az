import { NextRequest, NextResponse } from 'next/server'
import { DetailedInterviewService } from '@/lib/detailed-interview-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const interview = await DetailedInterviewService.getDetailedInterview(id, userId)
    
    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    // Parse answers from the feedback JSON or use fallback data
    let answers: any[] = []
    let questionsCount = 0
    
    if (interview.feedback) {
      try {
        const sessionData = typeof interview.feedback === 'string' 
          ? JSON.parse(interview.feedback) 
          : interview.feedback
        answers = sessionData.answers || []
        questionsCount = sessionData.questions?.length || answers.length
      } catch (error) {
        console.error('Error parsing interview feedback:', error)
        answers = []
        questionsCount = 0
      }
    }

    // Format the response to match the frontend expectations
    const formattedInterview = {
      id: interview.id,
      title: interview.title,
      company: interview.company,
      position: interview.position,
      date: interview.completedAt,
      duration: interview.duration,
      difficulty: interview.difficulty,
      status: interview.status,
      overallScore: interview.score,
      questionsCount: questionsCount,
      category: 'Technical',
      questions: answers.map((answer, index) => ({
        id: answer.questionId || index,
        question: answer.question || `Question ${index + 1}`,
        userAnswer: answer.userAnswer || answer.answer || 'No answer provided',
        idealAnswer: answer.idealAnswer || 'A strong answer should demonstrate relevant experience and technical knowledge.',
        score: answer.score?.overallScore || answer.score || 75,
        strengths: answer.score?.strengths || answer.strengths || ['Clear communication'],
        weaknesses: answer.score?.weaknesses || answer.weaknesses || ['Could provide more detail'],
        category: answer.category || 'General'
      })),
      overallAnalysis: interview.overallAnalysis || {
        strengths: ['Technical knowledge', 'Problem-solving approach'],
        weaknesses: ['Need more implementation details', 'Could improve system design depth'],
        recommendations: ['Practice coding problems', 'Study system design patterns']
      },
      categoryScores: (interview.categoryScores as any) || {
        'Behavioral': 80,
        'Technical': 75,
        'System Design': 70,
        'Coding': 72
      }
    }

    return NextResponse.json(formattedInterview)
  } catch (error) {
    console.error('Error fetching interview details:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch interview details' 
    }, { status: 500 })
  }
}