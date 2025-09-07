import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionService } from '@/lib/subscription-service'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await SubscriptionService.cancelSubscription(userId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}