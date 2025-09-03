'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Calendar, Target, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface UsageStats {
  plan: {
    type: string
    name: string
    features: string[]
  }
  usage: {
    monthlyInterviews: number
    monthlyLimit: number
    remainingInterviews: number
    totalInterviews: number
    completedInterviews: number
    completionRate: number
  }
  period: {
    start: string
    end: string
  }
  upgradePrompts: Array<{
    type: string
    title: string
    message: string
    action: string
    urgency: 'low' | 'medium' | 'high'
  }>
}

export function UsageCard() {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsageStats()
  }, [])

  const fetchUsageStats = async () => {
    try {
      const response = await fetch('/api/usage/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Usage Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Usage Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Unable to load usage statistics.</p>
        </CardContent>
      </Card>
    )
  }

  const isUnlimited = stats.usage.monthlyLimit === -1
  const usagePercentage = isUnlimited ? 0 : (stats.usage.monthlyInterviews / stats.usage.monthlyLimit) * 100
  const isNearLimit = usagePercentage > 80
  const isAtLimit = usagePercentage >= 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Usage This Month
          </div>
          <Badge variant={stats.plan.type === 'FREE' ? 'secondary' : 'default'}>
            {stats.plan.name}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Monthly Interview Usage */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">AI Interviews</span>
            <span className="text-sm text-gray-600">
              {stats.usage.monthlyInterviews}
              {isUnlimited ? ' (Unlimited)' : ` / ${stats.usage.monthlyLimit}`}
            </span>
          </div>
          
          {!isUnlimited && (
            <div className="space-y-1">
              <Progress 
                value={Math.min(usagePercentage, 100)} 
                className={`h-2 ${isAtLimit ? 'bg-red-100' : isNearLimit ? 'bg-yellow-100' : 'bg-green-100'}`}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0</span>
                <span>{stats.usage.monthlyLimit}</span>
              </div>
            </div>
          )}
          
          {!isUnlimited && stats.usage.remainingInterviews >= 0 && (
            <p className="text-sm text-gray-600">
              {stats.usage.remainingInterviews === 0 
                ? 'Free interview used - Upgrade to continue!' 
                : `${stats.usage.remainingInterviews} interview${stats.usage.remainingInterviews === 1 ? '' : 's'} remaining`
              }
            </p>
          )}
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.usage.totalInterviews}</div>
            <div className="text-xs text-gray-500">Total Interviews</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.usage.completionRate}%</div>
            <div className="text-xs text-gray-500">Completion Rate</div>
          </div>
        </div>

        {/* Upgrade Prompts */}
        {stats.upgradePrompts.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            {stats.upgradePrompts.map((prompt, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  prompt.urgency === 'high' 
                    ? 'bg-red-50 border-red-200' 
                    : prompt.urgency === 'medium'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start">
                  {prompt.urgency === 'high' && <AlertTriangle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />}
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{prompt.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{prompt.message}</p>
                    <Link href="/pricing">
                      <Button size="sm" className="mt-2" variant={prompt.urgency === 'high' ? 'default' : 'outline'}>
                        {prompt.action}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Billing Period */}
        <div className="pt-4 border-t">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>
              Billing period: {new Date(stats.period.start).toLocaleDateString()} - {new Date(stats.period.end).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}