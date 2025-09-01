import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserService } from '@/lib/user-service'
import { Users, Target, TrendingUp, Award } from 'lucide-react'

export default async function DashboardPage() {
  const clerkUser = await currentUser()
  
  if (!clerkUser) {
    redirect('/sign-in')
  }

  // Get or create user in database (gracefully handle errors)
  let dbUser = null
  let userStats = null
  
  try {
    dbUser = await UserService.getOrCreateUser({
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    })
    
    userStats = await UserService.getUserStats(clerkUser.id)
  } catch (error) {
    console.error('Database error:', error)
    // Continue without database data
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">BG</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {clerkUser.firstName}! 👋
                </h1>
                <p className="text-gray-600 mt-1">Ready to ace your next interview?</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm text-gray-500">Subscription Status</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  (dbUser?.subscription || 'FREE') === 'FREE' 
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {dbUser?.subscription || 'FREE'}
                </span>
              </div>
              <UserButton />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Stats Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { 
                title: 'Total Interviews', 
                value: userStats?.totalInterviews || 0, 
                icon: Target,
                color: 'bg-blue-500'
              },
              { 
                title: 'Completed', 
                value: userStats?.completedInterviews || 0, 
                icon: TrendingUp,
                color: 'bg-green-500'
              },
              { 
                title: 'Practice Sessions', 
                value: userStats?.totalSessions || 0, 
                icon: Users,
                color: 'bg-purple-500'
              },
              { 
                title: 'Average Score', 
                value: `${userStats?.averageScore || 0}%`, 
                icon: Award,
                color: 'bg-orange-500'
              }
            ].map((stat) => (
              <div key={stat.title} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-sm text-gray-900">{clerkUser.emailAddresses[0]?.emailAddress}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-sm text-gray-900">
                  {clerkUser.firstName} {clerkUser.lastName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Subscription</label>
                <p className="text-sm text-gray-900">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    (dbUser?.subscription || 'FREE') === 'FREE' 
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {dbUser?.subscription || 'FREE'}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Member Since</label>
                <p className="text-sm text-gray-900">
                  {dbUser?.createdAt ? new Date(dbUser.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Main Interview Button */}
            <a href="/interview" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all block group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2h4a1 1 0 110 2h-1v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 010-2h4zM9 6v8a1 1 0 002 0V6H9z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">🎤 Start Interview</h3>
              <p className="text-blue-100 text-sm">AI-powered voice interview with custom difficulty</p>
            </a>

            {/* Practice Questions */}
            <a href="/test-questions" className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all block group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">📝 Practice Bank</h3>
              <p className="text-purple-100 text-sm">Browse and practice individual questions</p>
            </a>

            {/* Quick Assessment */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all block group cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Soon</span>
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">⚡ Quick Assessment</h3>
              <p className="text-orange-100 text-sm">5-minute skill evaluation and feedback</p>
            </div>

            {/* View History */}
            <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all block group cursor-pointer opacity-75">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Soon</span>
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">📊 History</h3>
              <p className="text-gray-200 text-sm">Review past interviews and progress</p>
            </div>
          </div>
        </div>

        {/* Interview Modes Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Interview Modes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Easy Mode */}
            <a href="/interview?mode=quick&difficulty=easy" className="bg-white border border-green-200 hover:border-green-300 p-6 rounded-xl shadow-sm hover:shadow-md transition-all block group">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">Easy Level</h3>
                  <p className="text-sm text-gray-600">5 questions • Entry level</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm mb-3">Perfect for beginners and those new to interviews. Basic behavioral and technical questions.</p>
              <div className="text-green-600 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center">
                Start Easy Mode
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </a>

            {/* Medium Mode */}
            <a href="/interview?mode=quick&difficulty=medium" className="bg-white border border-yellow-200 hover:border-yellow-300 p-6 rounded-xl shadow-sm hover:shadow-md transition-all block group">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">Medium Level</h3>
                  <p className="text-sm text-gray-600">8 questions • Experienced</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm mb-3">For professionals with experience. Mix of behavioral, technical, and problem-solving questions.</p>
              <div className="text-yellow-600 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center">
                Start Medium Mode
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </a>

            {/* Hard Mode */}
            <a href="/interview?mode=quick&difficulty=hard" className="bg-white border border-red-200 hover:border-red-300 p-6 rounded-xl shadow-sm hover:shadow-md transition-all block group">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">Hard Level</h3>
                  <p className="text-sm text-gray-600">12 questions • Senior level</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm mb-3">Advanced questions for senior roles. Complex scenarios, leadership, and strategic thinking.</p>
              <div className="text-red-600 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center">
                Start Hard Mode
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </a>
          </div>
        </div>

        {/* Database Status */}
        {!dbUser && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              <strong>Note:</strong> Database connection issue. Some features may not work properly.
              Your user data will sync once the database is connected.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}