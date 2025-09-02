import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { SubscriptionService } from '@/lib/subscription-service'

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { returnUrl } = body

    if (!returnUrl) {
      return NextResponse.json(
        { error: 'Missing returnUrl' },
        { status: 400 }
      )
    }

    // Create portal session
    const session = await SubscriptionService.createPortalSession(
      user.id,
      returnUrl
    )

    return NextResponse.json({ 
      url: session.url 
    })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}