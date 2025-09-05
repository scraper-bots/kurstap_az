import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
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
    if (payment.user.clerkId !== user.id) {
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

    // Process the successful payment
    if (payment.planType) {
      try {
        // Check if this is a credit purchase by looking at description
        let isCreditPurchase = false
        let creditsToAdd = 0
        
        if (payment.description && payment.description.includes('credit purchase')) {
          isCreditPurchase = true
          // Extract credits from description like "5 Interviews credit purchase - 5 credits"
          const match = payment.description.match(/- (\d+) credits/)
          if (match) {
            creditsToAdd = parseInt(match[1])
          }
        }

        if (isCreditPurchase) {
          // This is a credit purchase - just add credits to user
          await db.user.update({
            where: { id: payment.userId },
            data: {
              interviewCredits: {
                increment: creditsToAdd
              }
            }
          })

          console.log(`User ${payment.userId} purchased ${creditsToAdd} interview credits`)

          return NextResponse.json({
            success: true,
            creditsAdded: creditsToAdd,
            message: 'Credits added successfully'
          })
        } else {
          // Legacy plan-based logic (keeping for backward compatibility)
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

          // Update user's plan and add interview credits
          const planCredits = {
            'BASIC': 1,
            'STANDARD': 5,
            'PREMIUM': 0 // Premium gets unlimited (no credits system)
          }
          
          const legacyCreditsToAdd = planCredits[payment.planType as keyof typeof planCredits] || 0
          
          if (payment.planType === 'PREMIUM') {
            // Premium subscription - update plan type only
            await db.user.update({
              where: { id: payment.userId },
              data: { planType: payment.planType as any }
            })
          } else {
            // BASIC/STANDARD - add credits
            await db.user.update({
              where: { id: payment.userId },
              data: { 
                planType: payment.planType as any,
                interviewCredits: {
                  increment: legacyCreditsToAdd
                }
              }
            })
          }

          console.log(`User ${payment.userId} manually upgraded to ${payment.planType} plan`)

          return NextResponse.json({
            success: true,
            planType: payment.planType,
            creditsAdded: legacyCreditsToAdd,
            message: 'Payment processed successfully'
          })
        }
      } catch (error) {
        console.error('Error processing payment:', error)
        return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'No plan type found for payment' }, { status: 400 })
  } catch (error) {
    console.error('Error processing manual payment:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}