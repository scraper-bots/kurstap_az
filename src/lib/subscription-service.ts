import { db } from '@/lib/db'
import { EpointService } from '@/lib/epoint-service'
import { generateId } from '@/lib/utils'

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

  private static async handleExpiredSubscription(subscription: any) {
    try {
      // Update subscription status to expired
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'PAST_DUE',
          updatedAt: new Date()
        }
      })

      // Downgrade user to FREE plan
      await db.user.update({
        where: { id: subscription.userId },
        data: { planType: 'FREE' }
      })

      console.log(`Subscription ${subscription.id} expired for user ${subscription.userId}`)
    } catch (error) {
      console.error('Error handling expired subscription:', error)
    }
  }

  static async renewSubscription(userId: string, planType: 'PREMIUM' | 'ENTERPRISE') {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { subscriptions: true }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const currentSubscription = user.subscriptions.find(sub => sub.status === 'ACTIVE')
    
    if (!currentSubscription) {
      throw new Error('No active subscription found')
    }

    // Calculate renewal period
    const currentPeriodStart = new Date()
    const currentPeriodEnd = new Date()
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1) // 1 month renewal

    // Update subscription
    await db.subscription.update({
      where: { id: currentSubscription.id },
      data: {
        type: planType,
        currentPeriodStart,
        currentPeriodEnd,
        updatedAt: new Date()
      }
    })

    // Update user subscription
    await db.user.update({
      where: { id: userId },
      data: { planType: planType }
    })

    return { success: true, currentPeriodEnd }
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

    const activeSubscription = user.subscriptions[0]
    const isExpired = activeSubscription?.currentPeriodEnd ? 
      new Date(activeSubscription.currentPeriodEnd) < new Date() : false

    return {
      planType: user.planType,
      status: activeSubscription?.status || 'INACTIVE',
      currentPeriodStart: activeSubscription?.currentPeriodStart,
      currentPeriodEnd: activeSubscription?.currentPeriodEnd,
      isExpired,
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