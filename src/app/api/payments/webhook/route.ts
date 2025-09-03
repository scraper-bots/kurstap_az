import { NextRequest, NextResponse } from 'next/server'
import { EpointService } from '@/lib/epoint-service'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, signature } = body

    if (!data || !signature) {
      return NextResponse.json(
        { error: 'Missing data or signature' },
        { status: 400 }
      )
    }

    // Verify the callback authenticity
    const verification = EpointService.verifyCallback(data, signature)
    
    if (!verification.isValid || !verification.result) {
      console.error('Invalid Epoint callback signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const paymentResult = verification.result

    // Find the payment record
    const payment = await db.payment.findFirst({
      where: {
        orderId: paymentResult.order_id
      },
      include: {
        user: true
      }
    })

    if (!payment) {
      console.error('Payment not found for order ID:', paymentResult.order_id)
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Update payment status
    const paymentStatus = paymentResult.status === 'success' ? 'COMPLETED' : 'FAILED'
    
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        transactionId: paymentResult.transaction,
        bankTransactionId: paymentResult.bank_transaction,
        bankResponse: paymentResult.bank_response,
        responseCode: paymentResult.code,
        responseMessage: paymentResult.message,
        rrn: paymentResult.rrn,
        cardName: paymentResult.card_name,
        cardMask: paymentResult.card_mask,
        updatedAt: new Date()
      }
    })

    // If payment is successful, update user subscription
    if (paymentResult.status === 'success' && payment.planType) {
      try {
        // Find existing subscription for user
        const existingSubscription = await db.subscription.findFirst({
          where: { userId: payment.userId }
        })

        if (existingSubscription) {
          // Update existing subscription
          await db.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              type: payment.planType as any,
              status: 'ACTIVE',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              paymentId: payment.id,
              updatedAt: new Date()
            }
          })
        } else {
          // Create new subscription
          await db.subscription.create({
            data: {
              userId: payment.userId,
              type: payment.planType as any,
              status: 'ACTIVE',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              paymentId: payment.id
            }
          })
        }

        // Update user's subscription type
        await db.user.update({
          where: { id: payment.userId },
          data: { planType: payment.planType as any }
        })

        console.log(`User ${payment.userId} upgraded to ${payment.planType} plan`)
      } catch (error) {
        console.error('Error updating subscription:', error)
      }
    }

    console.log(`Payment ${paymentResult.order_id} status updated to: ${paymentStatus}`)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing Epoint webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}