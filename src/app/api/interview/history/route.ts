import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { InterviewService } from '@/lib/interview-service'

export interface GetHistoryResponse {
  success: boolean
  data?: {
    interviews: Array<{
      id: string
      title: string
      position: string
      status: string
      score?: number
      duration?: number
      completedAt?: string
      createdAt: string
    }>
    total: number
  }
  error?: string
}

export async function GET(req: NextRequest): Promise<NextResponse<GetHistoryResponse>> {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Get query params
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get user's interview history
    const interviews = await InterviewService.getUserInterviews(userId, limit)

    return NextResponse.json({
      success: true,
      data: {
        interviews: interviews.map(interview => ({
          id: interview.id,
          title: interview.title,
          position: interview.position,
          status: interview.status,
          score: interview.score || undefined,
          duration: interview.duration || undefined,
          completedAt: interview.completedAt?.toISOString(),
          createdAt: interview.createdAt.toISOString()
        })),
        total: interviews.length
      }
    })
  } catch (error) {
    console.error('Error getting interview history:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get interview history'
    }, { status: 500 })
  }
}