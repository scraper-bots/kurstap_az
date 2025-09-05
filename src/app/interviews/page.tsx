import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, TrendingUp, AlertCircle, CheckCircle, Target } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { DetailedInterviewService } from '@/lib/detailed-interview-service'

async function getInterviewsData(userId: string) {
  try {
    // Use direct database calls instead of API calls for server-side rendering
    const interviews = await DetailedInterviewService.getUserInterviews(userId)
    const stats = await DetailedInterviewService.getUserInterviewStats(userId)
    
    return {
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
    }
  } catch (error) {
    console.error('Error fetching interviews:', error)
    // Return empty state if API fails
    return {
      interviews: [],
      stats: {
        totalInterviews: 0,
        averageScore: 0,
        totalTime: 0,
        improvement: 0
      }
    }
  }
}

export default async function InterviewsPage() {
  const clerkUser = await currentUser()
  
  if (!clerkUser) {
    redirect('/sign-in')
  }

  const { interviews, stats } = await getInterviewsData(clerkUser.id)

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === 'Hard') return 'bg-red-100 text-red-700'
    if (difficulty === 'Medium') return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-700'
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col space-y-4">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 inline-flex items-center text-sm font-medium">
                ← Back to Dashboard
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Interview History</h1>
                <p className="text-gray-600 mt-1">Review your past interviews and track your progress</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Interviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalInterviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageScore}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalTime}h
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Improvement</p>
                <p className={`text-2xl font-bold ${stats.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.improvement > 0 ? '+' : ''}{stats.improvement}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interview Cards */}
        <div className="space-y-6">
          {interviews.map((interview: any) => (
            <div key={interview.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{interview.title}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(interview.difficulty)}`}>
                          {interview.difficulty}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(interview.overallScore)}`}>
                          {interview.overallScore}%
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{interview.company}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(interview.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{interview.duration} min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="w-4 h-4" />
                        <span>{interview.questionsCount} questions</span>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {interview.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row lg:flex-col lg:items-end gap-2 w-full lg:w-auto">
                    <Link
                      href={`/interviews/${interview.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium text-center lg:min-w-[120px]"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/interviews/${interview.id}/report`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium text-center lg:min-w-[120px]"
                    >
                      Full Report
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {interviews.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews yet</h3>
            <p className="text-gray-600 mb-6">Start your first interview to see detailed analytics here</p>
            <Link
              href="/interview"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Start First Interview
            </Link>
          </div>
        )}
      </div>
      </div>
      <Footer />
    </>
  )
}