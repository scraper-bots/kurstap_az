'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { XCircle, RefreshCw, ArrowLeft, CreditCard } from 'lucide-react'

export default function PaymentErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'unknown'
  const sessionId = searchParams.get('session_id')

  const getErrorMessage = (errorType: string) => {
    switch (errorType.toLowerCase()) {
      case 'card_declined':
        return {
          title: 'Payment Declined',
          description: 'Your card was declined. Please try a different payment method or contact your bank.',
          suggestion: 'Check with your bank or try a different card'
        }
      case 'insufficient_funds':
        return {
          title: 'Insufficient Funds',
          description: 'There are insufficient funds on your card to complete this payment.',
          suggestion: 'Please check your account balance or use a different payment method'
        }
      case 'expired_card':
        return {
          title: 'Card Expired',
          description: 'The card you used has expired.',
          suggestion: 'Please update your card information with a valid card'
        }
      case 'processing_error':
        return {
          title: 'Processing Error',
          description: 'There was an error processing your payment.',
          suggestion: 'Please try again or contact support if the issue persists'
        }
      case 'canceled':
        return {
          title: 'Payment Canceled',
          description: 'You canceled the payment process.',
          suggestion: 'You can try again anytime when you\'re ready'
        }
      default:
        return {
          title: 'Payment Failed',
          description: 'Something went wrong with your payment.',
          suggestion: 'Please try again or contact our support team'
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-32 w-32 rounded-full bg-red-100 mb-8">
            <XCircle className="h-20 w-20 text-red-500" />
          </div>

          {/* Error Message */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {errorInfo.title}
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            {errorInfo.description}
          </p>
          <p className="text-lg text-gray-500 mb-8">
            {errorInfo.suggestion}
          </p>

          {/* Error Details */}
          {sessionId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-8 max-w-md mx-auto">
              <p className="text-sm text-gray-600">
                <strong>Session ID:</strong> {sessionId}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Error Code:</strong> {error}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center mb-12">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Try Again
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Dashboard
            </Link>
          </div>

          {/* Help Section */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                Need Help?
              </h3>
              <div className="text-left space-y-3 text-blue-800">
                <p>If you continue to experience issues, here are some things you can try:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Check that your card details are entered correctly</li>
                  <li>Ensure your card has sufficient funds</li>
                  <li>Try using a different payment method</li>
                  <li>Contact your bank to ensure the payment isn't being blocked</li>
                </ul>
                <div className="pt-4">
                  <Link
                    href="/contact"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Alternative Options */}
          <div className="mt-12 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Continue with Free Plan
            </h3>
            <p className="text-gray-600 mb-6">
              You can still use Bir Guru with our free plan while you resolve payment issues.
            </p>
            <Link
              href="/interview"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Start Free Interview
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}