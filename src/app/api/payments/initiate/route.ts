import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { EpointService, EpointPaymentRequest } from '@/lib/epoint-service'
import { db } from '@/lib/db'
import { generateId } from '@/lib/utils'

interface PaymentRequest {
  planType: 'FREE' | 'PREMIUM' | 'ENTERPRISE'
  amount: number
  description?: string
  successUrl: string
  errorUrl: string
}

const PLAN_CONFIGS = {
  FREE: {
    name: 'Free Trial',
    price: 0,
    features: ['1 AI Interview (one-time)', 'Basic feedback', 'Email support']
  },
  PREMIUM: {
    name: 'Premium Plan', 
    price: 29.99,
    features: ['Unlimited AI Interviews', 'Detailed feedback & analytics', 'Interview history tracking', 'Priority support']
  },
  ENTERPRISE: {
    name: 'Enterprise Plan',
    price: 99.99,
    features: ['Everything in Premium', 'Team management', 'Custom interview templates', 'API access', 'Dedicated support']
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: PaymentRequest = await request.json()
    const { planType, amount, description, successUrl, errorUrl } = body

    // Validate required fields
    if (!planType || !amount || !successUrl || !errorUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: planType, amount, successUrl, errorUrl' },
        { status: 400 }
      )
    }

    // Validate plan type
    if (!PLAN_CONFIGS[planType]) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      )
    }

    // Validate amount matches plan price
    const expectedAmount = PLAN_CONFIGS[planType].price
    if (Math.abs(amount - expectedAmount) > 0.01) {
      return NextResponse.json(
        { error: 'Amount does not match plan price' },
        { status: 400 }
      )
    }

    // Get or create the database user
    let dbUser = await db.user.findUnique({
      where: { clerkId: user.id }
    })
    
    if (!dbUser) {
      // Create user if doesn't exist
      dbUser = await db.user.create({
        data: {
          clerkId: user.id,
          email: '',
          firstName: '',
          lastName: '',
          planType: 'FREE' as any,
          createdAt: new Date(),
        }
      })
      console.log('Auto-created user for payment:', user.id)
    }

    // Generate unique order ID
    const orderId = generateId()

    // Create payment record in database
    const payment = await db.payment.create({
      data: {
        id: generateId(),
        userId: dbUser.id, // Use database user ID, not Clerk ID
        orderId: orderId,
        planType: planType,
        amount: EpointService.formatAmount(amount),
        currency: 'AZN',
        status: 'PENDING',
        description: description || `${PLAN_CONFIGS[planType].name} subscription`,
        successUrl: successUrl,
        errorUrl: errorUrl,
        createdAt: new Date()
      }
    })

    // Prepare Epoint payment request
    const epointRequest: EpointPaymentRequest = {
      public_key: process.env.EPOINT_OPEN_KEY!,
      amount: EpointService.formatAmount(amount),
      currency: 'AZN',
      language: 'en',
      order_id: orderId,
      description: payment.description || undefined,
      success_redirect_url: `${successUrl}?session_id=${orderId}`,
      error_redirect_url: `${errorUrl}?error=payment_failed&session_id=${orderId}`,
      other_attr: [
        {
          planName: PLAN_CONFIGS[planType].name,
          planType: planType,
          userId: user.id
        }
      ]
    }

    // Initiate payment with Epoint
    const epointResponse = await EpointService.initiatePayment(epointRequest)

    if (epointResponse.status === 'error') {
      // Update payment record with error
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          errorMessage: epointResponse.error,
          updatedAt: new Date()
        }
      })

      return NextResponse.json(
        { error: epointResponse.error || 'Failed to initiate payment' },
        { status: 500 }
      )
    }

    // Update payment record with transaction ID
    await db.payment.update({
      where: { id: payment.id },
      data: {
        transactionId: epointResponse.transaction,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      sessionId: orderId,
      transactionId: epointResponse.transaction,
      redirectUrl: epointResponse.redirect_url,
      planName: PLAN_CONFIGS[planType].name,
      amount: amount,
      currency: 'AZN'
    })
  } catch (error) {
    console.error('Error initiating payment:', error)
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}