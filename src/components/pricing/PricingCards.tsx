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
  FREE: {
    name: 'Free Plan',
    price: 0,
    monthly: false,
    popular: false,
    interviews: 0,
    features: [
      'No interviews available',
      'Must purchase to practice',
      'View features only'
    ],
    buttonText: 'Current Plan',
    disabled: true
  },
  BASIC: {
    name: 'Basic Package',
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
    name: 'Standard Package', 
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
    name: 'Premium Subscription',
    price: 29.99,
    monthly: true,
    popular: false,
    interviews: -1,
    features: [
      'Unlimited AI Interviews',
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

  const isCurrentPlan = (planType: string) => currentPlan === planType

  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
                disabled={isCurrent || isLoading || plan.disabled}
                onClick={() => handlePurchase(planKey)}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : isCurrent ? (
                  'Current Plan'
                ) : (
                  plan.buttonText
                )}
              </Button>
              
              {isCurrent && (
                <p className="text-sm text-green-600 text-center mt-2 font-medium">
                  ✓ This is your current plan
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}