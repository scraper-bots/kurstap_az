import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { SubscriptionService } from '@/lib/subscription-service'

export async function POST() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await SubscriptionService.cancelSubscription(user.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}