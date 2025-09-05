'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Target } from 'lucide-react'

interface InterviewSummary {
  id: string
  title: string
  company?: string
  date: Date
  score?: number
  difficulty: string
}

interface InterviewStats {
  totalInterviews: number
  averageScore: number
  totalTime: number
  improvement: number
}

export function InterviewHistoryCard() {
  const [recentInterviews, setRecentInterviews] = useState<InterviewSummary[]>([])
  const [stats, setStats] = useState<InterviewStats>({
    totalInterviews: 0,
    averageScore: 0,
    totalTime: 0,
    improvement: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInterviewHistory()
  }, [])

  const fetchInterviewHistory = async () => {
    try {
      const response = await fetch('/api/interviews')
      if (response.ok) {
        const data = await response.json()
        // Get the 3 most recent interviews
        const recent = data.interviews.slice(0, 3).map((interview: any) => ({
          id: interview.id,
          title: interview.title,
          company: interview.company,
          date: new Date(interview.date || interview.completedAt),
          score: interview.overallScore,
          difficulty: interview.difficulty
        }))
        
        setRecentInterviews(recent)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching interview history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === 'HARD') return 'bg-red-100 text-red-700'
    if (difficulty === 'MEDIUM') return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-700'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Interview History</h3>
          <Link href="/interviews">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>

        {stats.totalInterviews === 0 ? (
          // Empty state
          <div className="text-center py-6">
            <Target className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-sm mb-4">No interviews completed yet</p>
            <Link href="/interview">
              <Button size="sm">
                Start Your First Interview
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.totalInterviews}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${stats.averageScore >= 70 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {stats.averageScore}%
                </div>
                <div className="text-xs text-gray-600">Avg Score</div>
              </div>
            </div>

            {/* Recent Interviews */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Recent Interviews</h4>
              {recentInterviews.map((interview) => (
                <div key={interview.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {interview.title}
                    </p>
                    {interview.company && (
                      <p className="text-xs text-gray-600 truncate">{interview.company}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(interview.difficulty)}`}>
                        {interview.difficulty.toLowerCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {interview.date.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {interview.score && (
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(interview.score)}`}>
                      {interview.score}%
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link href="/interviews">
                <Button variant="outline" className="w-full" size="sm">
                  View Detailed History
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}