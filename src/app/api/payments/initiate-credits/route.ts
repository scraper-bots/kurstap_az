import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { EpointService, EpointPaymentRequest } from '@/lib/epoint-service'
import { db } from '@/lib/db'
import { generateId } from '@/lib/utils'

interface CreditPurchaseRequest {
  packageType: 'SINGLE' | 'BUNDLE_5' | 'BUNDLE_10'
  credits: number
  amount: number
  description?: string
  successUrl: string
  errorUrl: string
}

const CREDIT_PACKAGES = {
  SINGLE: {
    name: '1 Interview',
    credits: 1,
    price: 5
  },
  BUNDLE_5: {
    name: '5 Interviews',
    credits: 5,
    price: 20
  },
  BUNDLE_10: {
    name: '10 Interviews',
    credits: 10,
    price: 35
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreditPurchaseRequest = await request.json()
    const { packageType, credits, amount, description, successUrl, errorUrl } = body

    // Validate required fields
    if (!packageType || !credits || !amount || !successUrl || !errorUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: packageType, credits, amount, successUrl, errorUrl' },
        { status: 400 }
      )
    }

    // Validate package type
    if (!CREDIT_PACKAGES[packageType]) {
      return NextResponse.json(
        { error: 'Invalid package type' },
        { status: 400 }
      )
    }

    // Validate amount matches package price
    const expectedAmount = CREDIT_PACKAGES[packageType].price
    if (Math.abs(amount - expectedAmount) > 0.01) {
      return NextResponse.json(
        { error: 'Amount does not match package price' },
        { status: 400 }
      )
    }

    // Validate credits match package
    const expectedCredits = CREDIT_PACKAGES[packageType].credits
    if (credits !== expectedCredits) {
      return NextResponse.json(
        { error: 'Credits do not match package' },
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
          email: user.emailAddresses[0]?.emailAddress || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          planType: 'FREE' as any,
          imageUrl: user.imageUrl || undefined,
          interviewCredits: 0
        }
      })
      console.log('Auto-created user for credit purchase:', user.id)
    }

    // Generate unique order ID
    const orderId = generateId()

    // Create payment record in database
    const payment = await db.payment.create({
      data: {
        id: generateId(),
        userId: dbUser.id,
        orderId: orderId,
        planType: packageType, // Store package type instead of plan type
        amount: EpointService.formatAmount(amount),
        currency: 'AZN',
        status: 'PENDING',
        description: description || `${CREDIT_PACKAGES[packageType].name} credit purchase`,
        successUrl: successUrl,
        errorUrl: errorUrl,
        createdAt: new Date(),
        // Store credits in a custom field or description
        metadata: JSON.stringify({ credits: credits, packageType: packageType })
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
      error_redirect_url: `${errorUrl}?error=payment_failed&session_id=${orderId}`
    }

    // Initiate payment with Epoint
    const epointResponse = await EpointService.initiatePayment(epointRequest)
    
    console.log('Epoint response received for credit purchase:', {
      status: epointResponse.status,
      hasTransaction: !!epointResponse.transaction,
      credits: credits,
      packageType: packageType
    })

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
      packageName: CREDIT_PACKAGES[packageType].name,
      credits: credits,
      amount: amount,
      currency: 'AZN'
    })
  } catch (error) {
    console.error('Error initiating credit purchase:', error)
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}