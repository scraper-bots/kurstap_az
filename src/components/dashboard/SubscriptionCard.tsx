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
  const [interviewCredits, setInterviewCredits] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCredits()
  }, [])

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/users/credits')
      if (response.ok) {
        const data = await response.json()
        setInterviewCredits(data.credits || 0)
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-full w-16 mx-auto mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-24 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-blue-600">{interviewCredits}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Interview{interviewCredits === 1 ? '' : 's'} Remaining
          </h3>
        </div>

        <div className="space-y-3">
          {interviewCredits > 0 ? (
            <Link href="/interview">
              <Button className="w-full">
                Start Interview
              </Button>
            </Link>
          ) : (
            <Link href="/pricing">
              <Button className="w-full">
                Buy Interview Credits
              </Button>
            </Link>
          )}
          
          <Link href="/pricing">
            <Button variant="outline" className="w-full">
              Buy More Credits
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}