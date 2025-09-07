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

    // Format detailed report data
    const detailedReport = {
      basicInfo: {
        title: interview.title,
        company: interview.company,
        date: interview.completedAt,
        duration: interview.duration,
        overallScore: interview.score,
        difficulty: interview.difficulty
      },
      detailedMetrics: interview.responseMetrics || {
        responseTime: {
          average: 28,
          fastest: 12,
          slowest: 45,
          trend: 'improving'
        },
        confidence: {
          overall: 75,
          byCategory: (interview.categoryScores as any) || {}
        },
        communicationSkills: {
          clarity: 85,
          structure: 78,
          engagement: 82,
          technicalLanguage: 88
        }
      },
      strengthsAnalysis: [
        {
          area: 'Technical Knowledge',
          score: (interview.categoryScores as any)?.['Technical'] || 80,
          description: 'Demonstrates strong understanding of technical concepts',
          evidence: (interview.overallAnalysis as any)?.strengths || ['Strong technical knowledge', 'Good problem-solving approach']
        }
      ],
      weaknessesAnalysis: [
        {
          area: 'System Design Depth',
          score: (interview.categoryScores as any)?.['System Design'] || 65,
          description: 'Needs to provide more comprehensive solutions',
          impact: 'May struggle with senior-level discussions',
          improvementActions: (interview.overallAnalysis as any)?.recommendations || [
            'Study system design patterns',
            'Practice drawing diagrams',
            'Review case studies'
          ]
        }
      ],
      benchmarkComparison: interview.benchmarkData || {
        industryAverage: { overall: 72 },
        yourScores: { overall: interview.score || 0 },
        percentileRanking: 68
      },
      improvementRoadmap: interview.improvementPlan || {
        immediate: [
          {
            skill: 'System Design',
            timeline: '2-3 weeks',
            resources: ['Design courses', 'Practice problems'],
            measurableGoal: 'Complete 10 design problems'
          }
        ],
        longTerm: [
          {
            skill: 'Leadership',
            timeline: '2-3 months',
            resources: ['Leadership courses', 'Mentoring'],
            measurableGoal: 'Lead technical discussions'
          }
        ]
      },
      nextSteps: {
        recommendedPractice: [
          'Focus on system design interviews',
          'Practice implementation details',
          'Work on communication skills'
        ],
        suggestedResources: [
          {
            type: 'Course',
            name: 'System Design Interview Course',
            provider: 'Educative',
            duration: '4-6 weeks'
          }
        ],
        targetImprovement: {
          nextScore: Math.min(100, (interview.score || 0) + 7),
          timeline: '6-8 weeks',
          keyFocusAreas: ['System Design', 'Implementation', 'Communication']
        }
      }
    }

    return NextResponse.json(detailedReport)
  } catch (error) {
    console.error('Error fetching interview report:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch interview report' 
    }, { status: 500 })
  }
}