import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { SubscriptionService } from '@/lib/subscription-service'
import { PLANS } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription
    const subscription = await SubscriptionService.getUserSubscription(user.id)
    const plan = PLANS[subscription.type as keyof typeof PLANS]

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        type: subscription.type,
        status: subscription.status,
        stripeCurrentPeriodEnd: subscription.stripeCurrentPeriodEnd,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt
      },
      plan: {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        interval: plan.interval,
        features: plan.features,
        limits: plan.limits
      }
    })
  } catch (error) {
    console.error('Error getting subscription:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Cancel subscription
    await SubscriptionService.cancelSubscription(user.id)

    return NextResponse.json({
      message: 'Subscription canceled successfully'
    })
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}