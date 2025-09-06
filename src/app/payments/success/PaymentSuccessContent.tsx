'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react'

interface CreditPurchase {
  credits: number
  amount: number
  packageName: string
}

export default function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [purchase, setPurchase] = useState<CreditPurchase | null>(null)
  const [totalCredits, setTotalCredits] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionId) {
      // Fetch purchase info
      fetchPurchaseInfo()
    } else {
      setLoading(false)
    }
  }, [sessionId, fetchPurchaseInfo])

  const fetchPurchaseInfo = async () => {
    try {
      // First, try to manually process the payment if it hasn't been processed yet
      if (sessionId) {
        try {
          const processResponse = await fetch('/api/payments/process-manual', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId })
          })
          
          if (processResponse.ok) {
            const processData = await processResponse.json()
            console.log('Payment processed:', processData)
            
            // If this was a credit purchase, get the credits added
            if (processData.creditsAdded) {
              // Map credits to package details for display
              const packageDetails = {
                1: { name: '1 Interview', price: 5 },
                5: { name: '5 Interviews', price: 20 },
                10: { name: '10 Interviews', price: 35 }
              }
              
              const packageInfo = packageDetails[processData.creditsAdded as keyof typeof packageDetails]
              
              if (packageInfo) {
                setPurchase({
                  credits: processData.creditsAdded,
                  amount: packageInfo.price,
                  packageName: packageInfo.name
                })
              }
            }
          }
        } catch (processError) {
          console.log('Payment already processed or processing failed:', processError)
        }
      }

      // Get user's total credits after purchase
      const creditsResponse = await fetch('/api/users/credits')
      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json()
        setTotalCredits(creditsData.credits || 0)
      }
    } catch (error) {
      console.error('Error fetching purchase info:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
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
              Thank you for purchasing interview credits. You can now start practicing!
            </p>

            {/* Loading or Purchase Info */}
            {loading ? (
              <div className="flex items-center justify-center mb-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Processing your purchase...</span>
              </div>
            ) : purchase ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Purchase Complete!
                </h2>
                <div className="text-left space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-700">Package:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {purchase.packageName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-700">Credits Added:</span>
                    <span className="text-lg font-bold text-green-600">
                      +{purchase.credits} Interview{purchase.credits === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-700">Amount Paid:</span>
                    <span className="text-lg font-bold text-gray-900">
                      ₼{purchase.amount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="text-lg font-semibold text-gray-700">Total Credits:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {totalCredits} Interview{totalCredits === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Credits Added Successfully!
                </h2>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-4">
                    {totalCredits} Interview{totalCredits === 1 ? '' : 's'} Available
                  </div>
                  <p className="text-gray-600">You can now start your interview practice sessions.</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/interview"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border border-blue-300 text-base font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-colors"
              >
                <span className="text-center">Start Interview Practice</span>
              </Link>
            </div>

            {/* Additional Info */}
            <div className="mt-12 max-w-2xl mx-auto">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  What happens next?
                </h3>
                <ul className="text-left space-y-2 text-blue-800">
                  <li>• Your interview credits have been added to your account</li>
                  <li>• Each interview session will use 1 credit</li>
                  <li>• Detailed feedback and analytics are available for all sessions</li>
                  <li>• You can view your interview history and track progress</li>
                  <li>• Purchase more credits anytime when you need them</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}