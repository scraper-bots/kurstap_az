'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface SubscriptionInfo {
  type: string
  plan: {
    name: string
    price: number
    features: string[]
  }
}

export default function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionId) {
      // Fetch subscription info
      fetchSubscriptionInfo()
    } else {
      setLoading(false)
    }
  }, [sessionId])

  const fetchSubscriptionInfo = async () => {
    try {
      const response = await fetch('/api/subscriptions/status')
      if (response.ok) {
        const data = await response.json()
        
        // Map plan type to plan details
        const planDetails = {
          'FREE': { name: 'Free Trial', price: 0, features: ['1 AI Interview (one-time)', 'Basic feedback', 'Email support'] },
          'PREMIUM': { name: 'Premium Plan', price: 29.99, features: ['Unlimited AI Interviews', 'Detailed feedback & analytics', 'Interview history tracking', 'Priority support'] },
          'ENTERPRISE': { name: 'Enterprise Plan', price: 99.99, features: ['Everything in Premium', 'Team management', 'Custom interview templates', 'API access', 'Dedicated support'] }
        }
        
        setSubscription({
          type: data.planType,
          plan: planDetails[data.planType as keyof typeof planDetails] || planDetails.FREE
        })
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-32 w-32 rounded-full bg-green-100 mb-8">
              <CheckCircle className="h-20 w-20 text-green-500" />
            </div>

            {/* Success Message */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Payment Successful! 🎉
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Thank you for upgrading to Bir Guru Premium. Your subscription is now active!
            </p>

            {/* Loading or Subscription Info */}
            {loading ? (
              <div className="flex items-center justify-center mb-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Loading your subscription details...</span>
              </div>
            ) : subscription ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome to {subscription.plan.name}!
                </h2>
                <div className="text-left">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-lg font-semibold text-gray-700">Plan:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {subscription.plan.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-lg font-semibold text-gray-700">Price:</span>
                    <span className="text-lg font-bold text-gray-900">
                      ₼{subscription.plan.price}/month
                    </span>
                  </div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">
                      Your new features:
                    </h3>
                    <ul className="space-y-2">
                      {subscription.plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/interview"
                className="inline-flex items-center justify-center px-8 py-4 border border-blue-300 text-base font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-colors"
              >
                Start Your First Premium Interview
              </Link>
            </div>

            {/* Additional Info */}
            <div className="mt-12 max-w-2xl mx-auto">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  What happens next?
                </h3>
                <ul className="text-left space-y-2 text-blue-800">
                  <li>• You now have access to unlimited AI interviews</li>
                  <li>• Detailed feedback and analytics are available for all your sessions</li>
                  <li>• You can view your interview history and track progress</li>
                  <li>• Your billing cycle starts today</li>
                  <li>• You can manage your subscription anytime in your dashboard</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}