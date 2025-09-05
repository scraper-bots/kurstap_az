import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { DetailedInterviewService } from '@/lib/detailed-interview-service'

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's interviews
    const interviews = await DetailedInterviewService.getUserInterviews(user.id)
    
    // Get user statistics
    const stats = await DetailedInterviewService.getUserInterviewStats(user.id)

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