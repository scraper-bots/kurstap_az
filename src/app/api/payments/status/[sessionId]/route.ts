import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { EpointService } from '@/lib/epoint-service'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = params

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Check payment status with Epoint
    const paymentResult = await EpointService.checkPaymentStatus(sessionId)
    
    if (!paymentResult) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Update local payment record if it exists
    try {
      const existingPayment = await db.payment.findFirst({
        where: {
          transactionId: sessionId,
          userId: user.id
        }
      })

      if (existingPayment) {
        await db.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: paymentResult.status === 'success' ? 'COMPLETED' : 'FAILED',
            bankTransactionId: paymentResult.bank_transaction,
            bankResponse: paymentResult.bank_response,
            responseCode: paymentResult.code,
            rrn: paymentResult.rrn,
            cardMask: paymentResult.card_mask,
            updatedAt: new Date()
          }
        })
      }
    } catch (dbError) {
      console.error('Error updating payment record:', dbError)
      // Continue with response even if DB update fails
    }

    return NextResponse.json({
      status: paymentResult.status,
      amount: paymentResult.amount,
      currency: 'AZN',
      planName: paymentResult.other_attr?.planName,
      transaction: paymentResult.transaction,
      code: paymentResult.code,
      message: EpointService.getStatusMessage(paymentResult.code),
      card_mask: paymentResult.card_mask,
      rrn: paymentResult.rrn
    })
  } catch (error) {
    console.error('Error checking payment status:', error)
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    )
  }
}