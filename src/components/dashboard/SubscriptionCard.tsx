'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Calendar, Star, Settings, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface SubscriptionInfo {
  planType: string
  interviewCredits: number
  hasCredits: boolean
  canStartInterview: boolean
  status: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  isExpired: boolean
  recentPayments: Array<{
    id: string
    amount: number
    status: string
    createdAt: string
  }>
}

export function SubscriptionCard() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/status')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.')) {
      return
    }

    setCancelling(true)
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST'
      })

      if (response.ok) {
        alert('Subscription cancelled successfully. You will retain access until your current period ends.')
        fetchSubscription() // Refresh data
      } else {
        const data = await response.json()
        alert(`Failed to cancel subscription: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to cancel subscription. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  const getPlanInfo = (planType: string, interviewCredits: number) => {
    if (planType === 'PREMIUM') {
      return {
        name: 'Premium Plan',
        displayName: '10 Interviews',
        color: 'bg-blue-100 text-blue-800',
        price: '₼29.99',
        features: ['10 AI interviews', 'Advanced analytics', 'Priority support'],
        remaining: '10 per month'
      }
    } else if (interviewCredits > 0) {
      return {
        name: `${interviewCredits} Interview${interviewCredits === 1 ? '' : 's'} Remaining`,
        displayName: `${interviewCredits} Interview${interviewCredits === 1 ? '' : 's'} Available`,
        color: 'bg-green-100 text-green-800',
        price: planType === 'BASIC' ? '₼5' : planType === 'STANDARD' ? '₼20' : '₼0',
        features: ['AI interview sessions', 'Basic feedback', 'Email support'],
        remaining: `${interviewCredits} remaining`
      }
    } else {
      return {
        name: 'No Interviews Remaining',
        displayName: '0 Interviews Available',
        color: 'bg-red-100 text-red-800',
        price: '₼0',
        features: ['Purchase interviews to continue'],
        remaining: '0 remaining'
      }
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Plan Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Plan Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Unable to load plan information.</p>
        </CardContent>
      </Card>
    )
  }

  const planInfo = getPlanInfo(subscription.planType, subscription.interviewCredits || 0)
  const isActive = subscription.canStartInterview
  const isPremium = subscription.planType === 'PREMIUM'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Interview Status
          </div>
          <Badge className={planInfo.color}>
            {planInfo.displayName}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Interview Details */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Interviews Remaining</span>
            <span className="font-semibold text-lg">
              {subscription.interviewCredits}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Plan Type</span>
            <span className="font-semibold">
              {subscription.planType === 'PREMIUM' ? 'Premium' : 
               subscription.planType === 'STANDARD' ? 'Standard' : 
               subscription.planType === 'BASIC' ? 'Basic' : 'Free'}
            </span>
          </div>
          
          {isPremium && subscription.currentPeriodEnd && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Next Billing</span>
              <span className="font-semibold">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Can Start Interview</span>
            <Badge variant={isActive ? 'default' : 'destructive'}>
              {isActive ? 'Yes' : 'No - Purchase Needed'}
            </Badge>
          </div>
        </div>

        {/* Features */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-2">Plan Features</h4>
          <ul className="space-y-1">
            {planInfo.features.map((feature, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-center">
                <Star className="w-3 h-3 text-yellow-500 mr-2" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4 border-t">
          {!subscription.canStartInterview ? (
            <Link href="/pricing">
              <Button className="w-full">
                <TrendingUp className="w-4 h-4 mr-2" />
                Buy More Interviews
              </Button>
            </Link>
          ) : subscription.planType === 'PREMIUM' ? (
            <div className="space-y-2">
              <Link href="/interview">
                <Button className="w-full">
                  Start Interview
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  View Plans
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <Link href="/interview">
                <Button className="w-full">
                  Start Interview ({subscription.interviewCredits} left)
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" className="w-full">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Buy More Interviews
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Payment */}
        {subscription.recentPayments.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Recent Payment</h4>
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <span>₼{subscription.recentPayments[0].amount}</span>
                <span>{new Date(subscription.recentPayments[0].createdAt).toLocaleDateString()}</span>
              </div>
              <Badge 
                variant={subscription.recentPayments[0].status === 'COMPLETED' ? 'default' : 'secondary'}
                className="mt-1"
              >
                {subscription.recentPayments[0].status}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}