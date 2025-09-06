import { db } from '@/lib/db'
// import { EpointService } from '@/lib/epoint-service'
// import { generateId } from '@/lib/utils'

export class SubscriptionService {
  static async checkExpiredSubscriptions() {
    const expiredSubscriptions = await db.subscription.findMany({
      where: {
        currentPeriodEnd: {
          lte: new Date()
        },
        status: 'ACTIVE'
      },
      include: {
        user: true
      }
    })

    for (const subscription of expiredSubscriptions) {
      await this.handleExpiredSubscription(subscription)
    }
  }

  private static async handleExpiredSubscription(subscription: { id: string; user: { id: string } }) {
    try {
      // Update subscription status to expired
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'PAST_DUE',
          updatedAt: new Date()
        }
      })

      // User stays on credit system - no plan changes needed
      console.log(`User ${subscription.user.id} subscription expired - now on credit-only system`)

      console.log(`Subscription ${subscription.id} expired for user ${subscription.user.id}`)
    } catch (error) {
      console.error('Error handling expired subscription:', error)
    }
  }

  // DEPRECATED: No longer needed in credit-based system
  static async renewSubscription() {
    throw new Error('Subscription renewals are deprecated. Use credit purchases instead.')
  }

  static async getSubscriptionStatus(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    if (!user) return null

    // const activeSubscription = user.subscriptions[0]
    // const isExpired = activeSubscription?.currentPeriodEnd ? 
    //   new Date(activeSubscription.currentPeriodEnd) < new Date() : false

    return {
      interviewCredits: user.interviewCredits,
      status: 'CREDIT_BASED',
      recentPayments: user.payments
    }
  }

  static async cancelSubscription(userId: string) {
    const activeSubscription = await db.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE'
      }
    })

    if (!activeSubscription) {
      throw new Error('No active subscription found')
    }

    await db.subscription.update({
      where: { id: activeSubscription.id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    })

    // Note: Don't immediately downgrade - let them use until period end
    return { success: true, message: 'Subscription will end at the current period end' }
  }
}