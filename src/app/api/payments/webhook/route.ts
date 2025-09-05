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

    // If payment is successful, process credit purchase
    if (paymentResult.status === 'success') {
      try {
        // All payments are now credit purchases - extract credits from description
        let creditsToAdd = 0
        
        if (payment.description) {
          // Try to extract from description like "5 Interviews credit purchase - 5 credits"
          let match = payment.description.match(/- (\d+) credits/)
          if (match) {
            creditsToAdd = parseInt(match[1])
          } else {
            // Fallback: try to extract from package name like "1 Interview" or "5 Interviews"
            const packageMatch = payment.description.match(/(\d+) Interview/)
            if (packageMatch) {
              creditsToAdd = parseInt(packageMatch[1])
              console.log(`Webhook fallback credit extraction: ${creditsToAdd} credits from "${payment.description}"`)
            }
          }
        }

        if (creditsToAdd > 0) {
          // Add credits to user
          console.log(`Webhook: Processing credit purchase for user ${payment.userId}: adding ${creditsToAdd} credits`)
          console.log(`Webhook: Payment description: "${payment.description}"`)
          
          const updatedUser = await db.user.update({
            where: { id: payment.userId },
            data: {
              interviewCredits: {
                increment: creditsToAdd
              }
            },
            select: { interviewCredits: true, clerkId: true }
          })

          console.log(`Webhook: Successfully added ${creditsToAdd} credits to user ${payment.userId} (Clerk ID: ${updatedUser.clerkId}). New balance: ${updatedUser.interviewCredits}`)
        } else {
          console.warn(`Webhook: Could not determine credits from payment description: "${payment.description}"`)
        }
      } catch (error) {
        console.error('Error processing payment:', error)
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