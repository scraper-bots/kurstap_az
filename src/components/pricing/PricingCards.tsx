'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckIcon } from '@heroicons/react/24/solid'


const CREDIT_PACKAGES = {
  SINGLE: {
    name: '1 Interview',
    price: 5,
    credits: 1,
    popular: false,
    savings: 0,
    features: [
      '1 AI Interview',
      'Detailed feedback',
      'Email support',
      'Interview history'
    ],
    buttonText: 'Buy 1 Interview',
    pricePerInterview: 5
  },
  BUNDLE_5: {
    name: '5 Interviews', 
    price: 20,
    credits: 5,
    popular: true,
    savings: 5, // ₼25 - ₼20 = ₼5 saved
    features: [
      '5 AI Interviews',
      'Detailed feedback',
      'Interview history',
      'Priority support',
      'Better value (₼4 per interview)',
      'Save ₼5'
    ],
    buttonText: 'Buy 5 Interviews',
    pricePerInterview: 4
  },
  BUNDLE_10: {
    name: '10 Interviews',
    price: 35,
    credits: 10,
    popular: false,
    savings: 15, // ₼50 - ₼35 = ₼15 saved
    features: [
      '10 AI Interviews',
      'Detailed feedback',
      'Interview history',
      'Priority support',
      'Best value (₼3.50 per interview)',
      'Save ₼15'
    ],
    buttonText: 'Buy 10 Interviews',
    pricePerInterview: 3.5
  }
}

export function PricingCards() {
  const [remainingInterviews, setRemainingInterviews] = useState<number>(0)
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchUserCredits()
  }, [])

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/users/credits')
      if (response.ok) {
        const data = await response.json()
        setRemainingInterviews(data.credits || 0)
      }
    } catch (error) {
      console.error('Error fetching user credits:', error)
    }
  }

  const handlePurchase = async (packageType: keyof typeof CREDIT_PACKAGES) => {
    if (loading) return

    setLoading(packageType)
    
    try {
      const creditPackage = CREDIT_PACKAGES[packageType]
      const response = await fetch('/api/payments/initiate-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageType,
          credits: creditPackage.credits,
          amount: creditPackage.price,
          description: `${creditPackage.name} credit purchase`,
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

  const getButtonText = (creditPackage: any, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Processing...
        </div>
      )
    }
    
    return creditPackage.buttonText
  }

  return (
    <div className="max-w-6xl mx-auto">
      {remainingInterviews === 0 && (
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <h3 className="text-xl font-semibold text-blue-900 mb-2">
            Purchase Interview Credits
          </h3>
          <p className="text-blue-700">
            Buy interview credits to start practicing AI interviews and get detailed feedback on your performance.
          </p>
        </div>
      )}

      {remainingInterviews > 0 && (
        <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
          <h3 className="text-xl font-semibold text-green-900 mb-2">
            You have {remainingInterviews} interview{remainingInterviews === 1 ? '' : 's'} remaining
          </h3>
          <p className="text-green-700">
            You can purchase more credits anytime to add to your balance.
          </p>
        </div>
      )}
      
      <div className="grid md:grid-cols-3 gap-8">
        {Object.entries(CREDIT_PACKAGES).map(([key, creditPackage]) => {
        const packageKey = key as keyof typeof CREDIT_PACKAGES
        const isLoading = loading === key
        
        return (
          <Card key={key} className={`relative ${creditPackage.popular ? 'border-2 border-blue-500 md:scale-105' : ''}`}>
            {creditPackage.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                Best Value
              </Badge>
            )}

            {creditPackage.savings > 0 && (
              <Badge className="absolute -top-3 right-4 bg-green-500">
                Save ₼{creditPackage.savings}
              </Badge>
            )}
            
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold">{creditPackage.name}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">₼{creditPackage.price}</span>
                <div className="text-sm text-gray-600 mt-2">
                  ₼{creditPackage.pricePerInterview} per interview
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3 mb-8">
                {creditPackage.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full" 
                variant={creditPackage.popular ? 'default' : 'outline'}
                disabled={isLoading}
                onClick={() => handlePurchase(packageKey)}
              >
                {getButtonText(creditPackage, isLoading)}
              </Button>
            </CardContent>
          </Card>
        )
        })}
      </div>
    </div>
  )
}