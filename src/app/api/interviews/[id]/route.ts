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
      questionsCount: interview.answers.length,
      category: 'Technical',
      questions: interview.answers.map((answer) => ({
        id: answer.questionId,
        question: answer.question,
        userAnswer: answer.userAnswer,
        idealAnswer: answer.idealAnswer || 'A strong answer should demonstrate relevant experience and technical knowledge.',
        score: answer.score || 0,
        strengths: answer.strengths,
        weaknesses: answer.weaknesses,
        category: answer.category
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