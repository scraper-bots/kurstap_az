'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home, MessageSquare } from 'lucide-react'

export default function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'unknown'
  const message = searchParams.get('message') || ''
  const code = searchParams.get('code') || ''

  const getErrorInfo = (errorType: string) => {
    switch (errorType.toLowerCase()) {
      case 'unauthorized':
        return {
          title: 'Access Denied',
          description: 'You don\'t have permission to access this resource.',
          suggestion: 'Please log in or contact support if you believe this is an error.'
        }
      case 'not_found':
        return {
          title: 'Page Not Found',
          description: 'The page you\'re looking for doesn\'t exist.',
          suggestion: 'Check the URL or navigate back to the homepage.'
        }
      case 'server_error':
        return {
          title: 'Server Error',
          description: 'Something went wrong on our end.',
          suggestion: 'Please try again later or contact support if the issue persists.'
        }
      case 'rate_limit':
        return {
          title: 'Too Many Requests',
          description: 'You\'ve made too many requests in a short period.',
          suggestion: 'Please wait a moment before trying again.'
        }
      case 'validation_error':
        return {
          title: 'Invalid Data',
          description: 'The data provided is invalid or incomplete.',
          suggestion: 'Please check your input and try again.'
        }
      case 'payment_required':
        return {
          title: 'Upgrade Required',
          description: 'This feature requires a premium subscription.',
          suggestion: 'Upgrade your plan to access this feature.'
        }
      case 'maintenance':
        return {
          title: 'Under Maintenance',
          description: 'This service is temporarily unavailable for maintenance.',
          suggestion: 'Please try again later. We\'ll be back soon!'
        }
      default:
        return {
          title: 'Something Went Wrong',
          description: message || 'An unexpected error occurred.',
          suggestion: 'Please try again or contact our support team if the problem persists.'
        }
    }
  }

  const errorInfo = getErrorInfo(error)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-32 w-32 rounded-full bg-orange-100 mb-8">
            <AlertTriangle className="h-20 w-20 text-orange-500" />
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
          {(code || message) && (
            <div className="bg-gray-50 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
              {code && (
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Error Code:</strong> {code}
                </p>
              )}
              {message && (
                <p className="text-sm text-gray-600">
                  <strong>Details:</strong> {message}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                <strong>Error Type:</strong> {error}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center mb-12">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Home className="mr-2 h-5 w-5" />
              Go Home
            </Link>
          </div>

          {/* Navigation Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
            <Link
              href="/dashboard"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="text-blue-600 font-semibold mb-2">Dashboard</div>
              <div className="text-sm text-gray-600">Go to your dashboard</div>
            </Link>
            <Link
              href="/interview"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="text-blue-600 font-semibold mb-2">Start Interview</div>
              <div className="text-sm text-gray-600">Begin a new interview</div>
            </Link>
            <Link
              href="/contact"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="text-blue-600 font-semibold mb-2">Get Help</div>
              <div className="text-sm text-gray-600">Contact our support</div>
            </Link>
          </div>

          {/* Help Section */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                Need Additional Help?
              </h3>
              <div className="text-left space-y-3 text-blue-800">
                <p>If you continue to experience issues, here are some things you can try:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Refresh the page or clear your browser cache</li>
                  <li>Check your internet connection</li>
                  <li>Try using a different browser</li>
                  <li>Disable browser extensions temporarily</li>
                  <li>Make sure JavaScript is enabled</li>
                </ul>
                <div className="pt-4">
                  <Link
                    href="/contact"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contact Support Team
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}