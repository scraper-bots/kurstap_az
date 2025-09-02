import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { SubscriptionService } from '@/lib/subscription-service'
import { PlanType } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planType, successUrl, cancelUrl } = body

    if (!planType || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: planType, successUrl, cancelUrl' },
        { status: 400 }
      )
    }

    if (planType === 'FREE') {
      return NextResponse.json(
        { error: 'Cannot create checkout session for free plan' },
        { status: 400 }
      )
    }

    // Find user in database
    const dbUser = await SubscriptionService.getUserSubscription(user.id)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create checkout session
    const session = await SubscriptionService.createCheckoutSession(
      user.id,
      planType as PlanType,
      successUrl,
      cancelUrl
    )

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}