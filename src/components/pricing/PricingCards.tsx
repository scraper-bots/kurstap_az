'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckIcon } from '@heroicons/react/24/solid'
import { useRouter } from 'next/navigation'

interface PricingCardsProps {
  currentUserId: string
}

const PLANS = {
  BASIC: {
    name: '1 Interview',
    price: 5,
    monthly: false,
    popular: false,
    interviews: 1,
    features: [
      '1 AI Interview',
      'Basic feedback',
      'Email support',
      'Standard question bank'
    ],
    buttonText: 'Buy 1 Interview',
    disabled: false
  },
  STANDARD: {
    name: '5 Interviews', 
    price: 20,
    monthly: false,
    popular: true,
    interviews: 5,
    features: [
      '5 AI Interviews',
      'Detailed feedback',
      'Interview history',
      'Priority support',
      'Advanced question bank',
      'Better value (₼4 per interview)'
    ],
    buttonText: 'Buy 5 Interviews',
    disabled: false
  },
  PREMIUM: {
    name: '10 Interviews',
    price: 29.99,
    monthly: true,
    popular: false,
    interviews: 10,
    features: [
      '10 AI Interviews',
      'Advanced analytics',
      'Performance benchmarking',
      'Priority support',
      'Interview history tracking',
      'Best for regular practice'
    ],
    buttonText: 'Subscribe Monthly',
    disabled: false
  }
}

export function PricingCards({ currentUserId }: PricingCardsProps) {
  const [currentPlan, setCurrentPlan] = useState<string>('FREE')
  const [remainingInterviews, setRemainingInterviews] = useState<number>(0)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchCurrentSubscription()
  }, [])

  const fetchCurrentSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/status')
      if (response.ok) {
        const data = await response.json()
        setCurrentPlan(data.planType || 'FREE')
        setRemainingInterviews(data.remainingInterviews || 0)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }

  const handlePurchase = async (planType: keyof typeof PLANS) => {
    if (loading) return

    setLoading(planType)
    
    try {
      const plan = PLANS[planType]
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType,
          amount: plan.price,
          description: `${plan.name} subscription`,
          successUrl: `${window.location.origin}/payments/success`,
          errorUrl: `${window.location.origin}/payments/error`
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Redirect to Epoint payment page
        window.location.href = data.redirectUrl
      } else {
        alert(`Payment initiation failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Error initiating payment:', error)
      alert('Failed to initiate payment. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const isCurrentPlan = (planType: string) => {
    // FREE users don't have a current plan since no plan card exists for FREE
    if (currentPlan === 'FREE') return false
    return currentPlan === planType
  }

  const getButtonText = (planKey: string, plan: any, isCurrent: boolean, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Processing...
        </div>
      )
    }
    
    if (isCurrent) {
      if (remainingInterviews === 0) {
        return 'Buy More Interviews'
      }
      return `${remainingInterviews} Interview${remainingInterviews === 1 ? '' : 's'} Left`
    }
    
    return plan.buttonText
  }

  return (
    <div className="max-w-6xl mx-auto">
      {currentPlan === 'FREE' && (
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <h3 className="text-xl font-semibold text-blue-900 mb-2">
            Choose Your Interview Training Plan
          </h3>
          <p className="text-blue-700">
            Select a plan below to start practicing AI interviews and get detailed feedback on your performance.
          </p>
        </div>
      )}
      
      <div className="grid md:grid-cols-3 gap-8">
        {Object.entries(PLANS).map(([key, plan]) => {
        const planKey = key as keyof typeof PLANS
        const isCurrent = isCurrentPlan(key)
        const isLoading = loading === key
        
        return (
          <Card key={key} className={`relative ${plan.popular ? 'border-2 border-blue-500 md:scale-105' : ''}`}>
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  {plan.price === 0 ? 'Free' : `₼${plan.price}`}
                </span>
                {plan.monthly && plan.price > 0 && <span className="text-gray-600">/month</span>}
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full" 
                variant={plan.popular ? 'default' : 'outline'}
                disabled={(isCurrent && remainingInterviews > 0) || isLoading || plan.disabled}
                onClick={() => handlePurchase(planKey)}
              >
                {getButtonText(key, plan, isCurrent, isLoading)}
              </Button>
              
              {isCurrent && remainingInterviews > 0 && (
                <p className="text-sm text-green-600 text-center mt-2 font-medium">
                  ✓ You have {remainingInterviews} interview{remainingInterviews === 1 ? '' : 's'} remaining
                </p>
              )}
              
              {isCurrent && remainingInterviews === 0 && (
                <p className="text-sm text-red-600 text-center mt-2 font-medium">
                  ⚠ No interviews remaining - Purchase more to continue
                </p>
              )}
            </CardContent>
          </Card>
        )
        })}
      </div>
    </div>
  )
}