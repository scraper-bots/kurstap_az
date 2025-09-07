'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { CheckCircle, Users, Star, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const { isAuthenticated } = useAuth()
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-20 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Master Every Interview with{' '}
              <span className="text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text">
                AI Practice
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Practice with our AI interviewer that adapts to your industry, provides real-time feedback, 
              and helps you land your dream job with confidence.
            </p>
            
            {/* CTA Button */}
            <div className="flex justify-center mb-12">
              {isAuthenticated ? (
                <Link href="/interview">
                  <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg">
                    Start Practice
                    <ArrowRight className="inline-block w-5 h-5 ml-2" />
                  </button>
                </Link>
              ) : (
                <Link href="/auth/signup">
                  <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg">
                    Start Practice
                    <ArrowRight className="inline-block w-5 h-5 ml-2" />
                  </button>
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">15K+</div>
                <div className="text-gray-600">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">89%</div>
                <div className="text-gray-600">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">4.9</div>
                <div className="text-gray-600 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                  Rating
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
                <div className="text-gray-600">Available</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                Why Choose Bir Guru?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our AI-powered platform provides everything you need to ace your next interview
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Interviewer</h3>
                <p className="text-gray-600">
                  Practice with our advanced AI that adapts to your responses and provides personalized feedback
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Real-time Feedback</h3>
                <p className="text-gray-600">
                  Get instant analysis of your responses, body language, and speaking patterns
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Industry Specific</h3>
                <p className="text-gray-600">
                  Tailored questions and scenarios for your specific industry and role level
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-20 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Get interview-ready in just 3 simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 mx-auto">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Level</h3>
                <p className="text-gray-600">
                  Select your experience level and industry to get personalized questions
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 mx-auto">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Practice Interview</h3>
                <p className="text-gray-600">
                  Engage in a realistic interview simulation with our AI interviewer
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 mx-auto">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Get Feedback</h3>
                <p className="text-gray-600">
                  Receive detailed analysis and actionable tips to improve your performance
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}