import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Find the payment record
    const payment = await db.payment.findFirst({
      where: {
        orderId: sessionId,
        status: 'PENDING' // Only process pending payments
      },
      include: {
        user: true
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found or already processed' }, { status: 404 })
    }

    // Check if this payment belongs to the current user
    if (payment.user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update payment status to completed (manual processing)
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date()
      }
    })

    // Process the successful payment - all payments are now credit-based
    if (payment.description) {
      try {
        // Extract credits from description
        let creditsToAdd = 0
        
        // Try to extract from description like "5 Interviews credit purchase - 5 credits"
        const match = payment.description.match(/- (\d+) credits/)
        if (match) {
          creditsToAdd = parseInt(match[1])
        } else {
          // Fallback: try to extract from package name like "1 Interview" or "5 Interviews"
          const packageMatch = payment.description.match(/(\d+) Interview/)
          if (packageMatch) {
            creditsToAdd = parseInt(packageMatch[1])
            console.log(`Manual payment credit extraction: ${creditsToAdd} credits from "${payment.description}"`)
          }
        }

        if (creditsToAdd > 0) {
          // This is a credit purchase - just add credits to user
          console.log(`Processing credit purchase for user ${payment.userId}: adding ${creditsToAdd} credits`)
          console.log(`Payment description: "${payment.description}"`)
          
          const updatedUser = await db.user.update({
            where: { id: payment.userId },
            data: {
              interviewCredits: {
                increment: creditsToAdd
              }
            },
            select: { interviewCredits: true }
          })

          console.log(`Successfully added ${creditsToAdd} credits to user ${payment.userId}. New balance: ${updatedUser.interviewCredits}`)

          return NextResponse.json({
            success: true,
            creditsAdded: creditsToAdd,
            newBalance: updatedUser.interviewCredits,
            message: 'Credits added successfully'
          })
        } else {
          return NextResponse.json({
            success: true,
            message: 'Payment processed but no credits could be determined from description'
          })
        }
      } catch (error) {
        console.error('Error processing payment:', error)
        return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'No payment description found' }, { status: 400 })
  } catch (error) {
    console.error('Error processing manual payment:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}