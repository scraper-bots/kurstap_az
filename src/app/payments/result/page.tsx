'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2, ArrowRight, CreditCard, RefreshCw } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface PaymentResult {
  status: 'success' | 'failed' | 'pending' | 'cancelled'
  sessionId?: string
  amount?: number
  currency?: string
  planName?: string
  error?: string
  subscription?: any
}

export default function PaymentResultPage() {
  const searchParams = useSearchParams()
  const [result, setResult] = useState<PaymentResult | null>(null)
  const [loading, setLoading] = useState(true)

  const sessionId = searchParams.get('session_id')
  const paymentIntent = searchParams.get('payment_intent')
  const status = searchParams.get('status')
  const error = searchParams.get('error')

  useEffect(() => {
    const fetchPaymentResult = async () => {
      try {
        if (sessionId) {
          // Fetch payment details from backend
          const response = await fetch(`/api/payments/status/${sessionId}`)
          if (response.ok) {
            const paymentData = await response.json()
            setResult({
              status: paymentData.status === 'completed' || paymentData.status === 'success' ? 'success' : 
                     paymentData.status === 'pending' ? 'pending' : 'failed',
              sessionId,
              amount: paymentData.amount,
              currency: paymentData.currency || 'AZN',
              planName: paymentData.planName
            })
          } else {
            // Fallback based on URL params
            setResult({
              status: (status as any) || 'failed',
              error: error || 'Unknown error'
            })
          }
        } else {
          // Determine status from URL parameters
          setResult({
            status: (status as any) || 'failed',
            error: error || 'No payment information found'
          })
        }

        // Fetch current subscription info if payment was successful
        if (status === 'success') {
          try {
            const subResponse = await fetch('/api/subscription')
            if (subResponse.ok) {
              const subscriptionData = await subResponse.json()
              setResult(prev => prev ? { ...prev, subscription: subscriptionData } : prev)
            }
          } catch (err) {
            console.error('Error fetching subscription:', err)
          }
        }
      } catch (err) {
        console.error('Error fetching payment result:', err)
        setResult({
          status: 'failed',
          error: 'Failed to fetch payment information'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentResult()
  }, [sessionId, paymentIntent, status, error])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-500',
          bgColor: 'from-green-50 via-white to-blue-50',
          iconBg: 'bg-green-100',
          title: 'Payment Successful! 🎉',
          subtitle: 'Your payment has been processed successfully.'
        }
      case 'failed':
        return {
          icon: XCircle,
          iconColor: 'text-red-500',
          bgColor: 'from-red-50 via-white to-orange-50',
          iconBg: 'bg-red-100',
          title: 'Payment Failed',
          subtitle: 'There was an issue processing your payment.'
        }
      case 'pending':
        return {
          icon: Clock,
          iconColor: 'text-yellow-500',
          bgColor: 'from-yellow-50 via-white to-orange-50',
          iconBg: 'bg-yellow-100',
          title: 'Payment Pending',
          subtitle: 'Your payment is being processed.'
        }
      case 'cancelled':
        return {
          icon: AlertCircle,
          iconColor: 'text-gray-500',
          bgColor: 'from-gray-50 via-white to-slate-50',
          iconBg: 'bg-gray-100',
          title: 'Payment Cancelled',
          subtitle: 'You cancelled the payment process.'
        }
      default:
        return {
          icon: AlertCircle,
          iconColor: 'text-gray-500',
          bgColor: 'from-gray-50 via-white to-slate-50',
          iconBg: 'bg-gray-100',
          title: 'Payment Status Unknown',
          subtitle: 'Unable to determine payment status.'
        }
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-32 w-32 rounded-full bg-blue-100 mb-8">
                <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Processing Payment Result...
              </h1>
              <p className="text-gray-600">
                Please wait while we verify your payment status.
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!result) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-32 w-32 rounded-full bg-red-100 mb-8">
                <AlertCircle className="h-16 w-16 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                No Payment Information Found
              </h1>
              <p className="text-gray-600 mb-8">
                We couldn't find any payment information to display.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const config = getStatusConfig(result.status)
  const StatusIcon = config.icon

  return (
    <>
      <Navbar />
      <div className={`min-h-screen bg-gradient-to-br ${config.bgColor}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            {/* Status Icon */}
            <div className={`mx-auto flex items-center justify-center h-32 w-32 rounded-full ${config.iconBg} mb-8`}>
              <StatusIcon className={`h-20 w-20 ${config.iconColor}`} />
            </div>

            {/* Status Message */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {config.title}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {config.subtitle}
            </p>

            {/* Payment Details */}
            {result.sessionId && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Session ID:</span>
                    <p className="text-sm text-gray-900 font-mono break-all">{result.sessionId}</p>
                  </div>
                  {result.amount && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Amount:</span>
                      <p className="text-sm text-gray-900">
                        {new Intl.NumberFormat('az-AZ', {
                          style: 'currency',
                          currency: result.currency?.toUpperCase() || 'AZN'
                        }).format(result.amount || 0)}
                      </p>
                    </div>
                  )}
                  {result.planName && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Plan:</span>
                      <p className="text-sm text-gray-900">{result.planName}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <p className={`text-sm font-semibold capitalize ${
                      result.status === 'success' ? 'text-green-600' :
                      result.status === 'failed' ? 'text-red-600' :
                      result.status === 'pending' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {result.status}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {result.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
                <p className="text-red-800">
                  <strong>Error:</strong> {result.error}
                </p>
              </div>
            )}

            {/* Subscription Info */}
            {result.subscription && result.status === 'success' && (
              <div className="bg-blue-50 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  Your Subscription
                </h3>
                <div className="text-left text-blue-800">
                  <p className="mb-2">
                    <strong>Plan:</strong> {result.subscription.plan?.name}
                  </p>
                  <p className="mb-2">
                    <strong>Status:</strong> {result.subscription.status}
                  </p>
                  {result.subscription.plan?.features && (
                    <div className="mt-4">
                      <p className="font-medium mb-2">Features included:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {result.subscription.plan.features.map((feature: string, index: number) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              {result.status === 'success' ? (
                <>
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
                    Start Interview
                  </Link>
                </>
              ) : result.status === 'failed' ? (
                <>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Try Again
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Contact Support
                  </Link>
                </>
              ) : result.status === 'pending' ? (
                <>
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Check Status
                  </button>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                </>
              ) : (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}