import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionService } from '@/lib/subscription-service'

// This endpoint should be called by a cron service (like Vercel Cron or external service)
// to check for expired subscriptions daily
export async function GET(request: NextRequest) {
  try {
    // Verify the request is coming from authorized source
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET_TOKEN

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting subscription expiry check...')
    
    await SubscriptionService.checkExpiredSubscriptions()
    
    console.log('Subscription expiry check completed')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Subscription check completed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in subscription cron job:', error)
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Allow POST requests as well for flexibility
  return GET(request)
}