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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {clerkUser.firstName}!
              </h1>
              <p className="text-gray-600">Ready to practice your interview skills?</p>
            </div>
            <UserButton afterSignOutUrl="/" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg mb-2">Start Practice</h3>
              <p className="text-blue-100">Begin a new interview practice session</p>
            </button>
            <button className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg mb-2">Mock Interview</h3>
              <p className="text-green-100">Take a full mock interview</p>
            </button>
            <button className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg mb-2">View History</h3>
              <p className="text-purple-100">Review past interviews and feedback</p>
            </button>
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