'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard'
import { InterviewHistoryCard } from '@/components/dashboard/InterviewHistoryCard'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!isAuthenticated || !user) {
    return null // Redirecting
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Welcome Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Welcome back, {user.firstName || 'User'}! 👋
          </h1>
          <p className="text-gray-600 mt-1">Ready to ace your next interview?</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-sm text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-sm text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Interview Credits</label>
                <p className="text-sm text-gray-900">
                  {user.interviewCredits}
                </p>
              </div>
            </div>
          </div>

          {/* Interview Balance Card */}
          <SubscriptionCard />

          {/* Interview History Card */}
          <InterviewHistoryCard />
        </div>

        {/* Start Interview Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Start Interview</h2>
          <div className="max-w-md">
            <a href="/interview" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all block group w-full">
              <div className="flex items-center justify-between mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2h4a1 1 0 110 2h-1v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 010-2h4zM9 6v8a1 1 0 002 0V6H9z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-2xl mb-3">🎤 Start Interview</h3>
              <p className="text-blue-100 text-base">AI-powered voice interview with custom difficulty levels</p>
            </a>
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

      </div>
      </div>
      <Footer />
    </>
  )
}