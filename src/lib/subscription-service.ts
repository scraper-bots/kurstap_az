import { stripe, PLANS, PlanType } from './stripe'
import { db } from './db'
import { SubscriptionType, SubscriptionStatus } from '@prisma/client'

export class SubscriptionService {
  /**
   * Create a Stripe customer and store in database
   */
  static async createCustomer(userId: string, email: string, name?: string) {
    try {
      // Check if customer already exists
      const existingSubscription = await db.subscription.findFirst({
        where: { userId, stripeCustomerId: { not: null } }
      })

      if (existingSubscription?.stripeCustomerId) {
        return existingSubscription.stripeCustomerId
      }

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId
        }
      })

      // Store customer ID in database
      await db.subscription.upsert({
        where: { userId },
        create: {
          userId,
          type: 'FREE',
          status: 'ACTIVE',
          stripeCustomerId: customer.id
        },
        update: {
          stripeCustomerId: customer.id
        }
      })

      return customer.id
    } catch (error) {
      console.error('Error creating Stripe customer:', error)
      throw new Error('Failed to create customer')
    }
  }

  /**
   * Create a checkout session for subscription
   */
  static async createCheckoutSession(
    userId: string,
    planType: PlanType,
    successUrl: string,
    cancelUrl: string
  ) {
    try {
      if (planType === 'FREE') {
        throw new Error('Cannot create checkout session for free plan')
      }

      const plan = PLANS[planType]
      if (!plan.stripePriceId) {
        throw new Error(`No Stripe price ID configured for ${planType} plan`)
      }

      // Get user info
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { subscriptions: true }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Get or create Stripe customer
      let customerId = user.subscriptions[0]?.stripeCustomerId
      if (!customerId) {
        customerId = await this.createCustomer(userId, user.email, `${user.firstName} ${user.lastName}`)
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        billing_address_collection: 'required',
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        allow_promotion_codes: true,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          planType
        }
      })

      return session
    } catch (error) {
      console.error('Error creating checkout session:', error)
      throw new Error('Failed to create checkout session')
    }
  }

  /**
   * Create a portal session for managing subscription
   */
  static async createPortalSession(userId: string, returnUrl: string) {
    try {
      const subscription = await db.subscription.findFirst({
        where: { userId, stripeCustomerId: { not: null } }
      })

      if (!subscription?.stripeCustomerId) {
        throw new Error('No Stripe customer found')
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: returnUrl
      })

      return session
    } catch (error) {
      console.error('Error creating portal session:', error)
      throw new Error('Failed to create portal session')
    }
  }

  /**
   * Get user's current subscription
   */
  static async getUserSubscription(userId: string) {
    try {
      const subscription = await db.subscription.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      if (!subscription) {
        // Create default free subscription
        return await db.subscription.create({
          data: {
            userId,
            type: 'FREE',
            status: 'ACTIVE'
          }
        })
      }

      return subscription
    } catch (error) {
      console.error('Error getting user subscription:', error)
      throw new Error('Failed to get subscription')
    }
  }

  /**
   * Update subscription from Stripe webhook
   */
  static async updateSubscriptionFromStripe(subscriptionId: string) {
    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
      const customerId = stripeSubscription.customer as string
      
      // Find user by customer ID
      const existingSubscription = await db.subscription.findFirst({
        where: { stripeCustomerId: customerId }
      })

      if (!existingSubscription) {
        console.error('No subscription found for customer:', customerId)
        return
      }

      // Map Stripe status to our status
      let status: SubscriptionStatus = 'ACTIVE'
      switch (stripeSubscription.status) {
        case 'active':
          status = 'ACTIVE'
          break
        case 'canceled':
          status = 'CANCELLED'
          break
        case 'past_due':
          status = 'PAST_DUE'
          break
        case 'incomplete':
          status = 'INCOMPLETE'
          break
        case 'incomplete_expired':
          status = 'INCOMPLETE_EXPIRED'
          break
        case 'trialing':
          status = 'TRIALING'
          break
        case 'unpaid':
          status = 'UNPAID'
          break
      }

      // Update subscription
      await db.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          stripeSubscriptionId: stripeSubscription.id,
          stripePriceId: stripeSubscription.items.data[0]?.price.id,
          status,
          stripeCurrentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
        }
      })

    } catch (error) {
      console.error('Error updating subscription from Stripe:', error)
      throw error
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(userId: string) {
    try {
      const subscription = await db.subscription.findFirst({
        where: { userId, stripeSubscriptionId: { not: null } }
      })

      if (!subscription?.stripeSubscriptionId) {
        throw new Error('No active subscription found')
      }

      // Cancel in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      })

      // Update in database
      await db.subscription.update({
        where: { id: subscription.id },
        data: { status: 'CANCELLED' }
      })

    } catch (error) {
      console.error('Error canceling subscription:', error)
      throw new Error('Failed to cancel subscription')
    }
  }

  /**
   * Check if user has access to a feature based on their subscription
   */
  static async hasAccess(userId: string, feature: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId)
      const plan = PLANS[subscription.type as PlanType]

      // Add feature-based access logic here
      switch (feature) {
        case 'unlimited_interviews':
          return subscription.type !== 'FREE'
        case 'detailed_analytics':
          return subscription.type !== 'FREE'
        case 'team_management':
          return subscription.type === 'ENTERPRISE'
        case 'api_access':
          return subscription.type === 'ENTERPRISE'
        default:
          return true
      }
    } catch (error) {
      console.error('Error checking access:', error)
      return false
    }
  }

  /**
   * Get usage limits for user's subscription
   */
  static async getUsageLimits(userId: string) {
    try {
      const subscription = await this.getUserSubscription(userId)
      const plan = PLANS[subscription.type as PlanType]
      return plan.limits
    } catch (error) {
      console.error('Error getting usage limits:', error)
      return PLANS.FREE.limits
    }
  }
}