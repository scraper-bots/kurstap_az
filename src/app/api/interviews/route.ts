import { NextRequest, NextResponse } from 'next/server'
import { DetailedInterviewService } from '@/lib/detailed-interview-service'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's interviews
    const interviews = await DetailedInterviewService.getUserInterviews(userId)
    
    // Get user statistics
    const stats = await DetailedInterviewService.getUserInterviewStats(userId)

    return NextResponse.json({
      interviews: interviews.map(interview => ({
        id: interview.id,
        title: interview.title,
        company: interview.company,
        position: interview.position,
        date: interview.completedAt,
        duration: interview.duration,
        difficulty: interview.difficulty,
        status: interview.status,
        overallScore: interview.score,
        questionsCount: (interview as any)._count?.answers || interview.questions.length,
        category: 'Technical' // Could be derived from answers
      })),
      stats
    })
  } catch (error) {
    console.error('Error fetching interviews:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch interviews' 
    }, { status: 500 })
  }
}