'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Calendar, Star, Settings, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface SubscriptionInfo {
  planType: string
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

  const getPlanInfo = (planType: string) => {
    const plans = {
      FREE: { 
        name: 'Free Trial', 
        color: 'bg-gray-100 text-gray-800', 
        price: '₼0', 
        features: ['1 AI interview (one-time)', 'Basic feedback'] 
      },
      PREMIUM: { 
        name: 'Premium Plan', 
        color: 'bg-blue-100 text-blue-800', 
        price: '₼29.99', 
        features: ['Unlimited interviews', 'Advanced analytics'] 
      },
      ENTERPRISE: { 
        name: 'Enterprise Plan', 
        color: 'bg-purple-100 text-purple-800', 
        price: '₼99.99', 
        features: ['Team management', 'API access'] 
      }
    }
    return plans[planType as keyof typeof plans] || plans.FREE
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Subscription
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
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Unable to load subscription information.</p>
        </CardContent>
      </Card>
    )
  }

  const planInfo = getPlanInfo(subscription.planType)
  const isActive = subscription.status === 'ACTIVE'
  const isPremium = subscription.planType !== 'FREE'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Current Plan
          </div>
          <Badge className={planInfo.color}>
            {planInfo.name}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Plan Details */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Monthly Price</span>
            <span className="font-semibold">{planInfo.price}/month</span>
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
            <span className="text-sm text-gray-600">Status</span>
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {subscription.isExpired ? 'Expired' : subscription.status}
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
          {subscription.planType === 'FREE' ? (
            <Link href="/pricing">
              <Button className="w-full">
                <TrendingUp className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            </Link>
          ) : (
            <div className="space-y-2">
              <Link href="/pricing">
                <Button variant="outline" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Change Plan
                </Button>
              </Link>
              
              {subscription.status === 'ACTIVE' && (
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                </Button>
              )}
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