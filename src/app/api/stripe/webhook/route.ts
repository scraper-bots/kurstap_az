import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { SubscriptionService } from '@/lib/subscription-service'
import { db } from '@/lib/db'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break
        
      case 'customer.subscription.updated':
        await SubscriptionService.updateSubscriptionFromStripe(event.data.object.id)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object)
        break
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  console.log('Checkout session completed:', session.id)
  
  const customerId = session.customer
  const subscriptionId = session.subscription
  const userId = session.metadata?.userId
  const planType = session.metadata?.planType

  if (!userId || !planType) {
    console.error('Missing userId or planType in session metadata')
    return
  }

  try {
    // Update user subscription
    await db.subscription.upsert({
      where: { userId },
      create: {
        userId,
        type: planType as any,
        status: 'ACTIVE',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId
      },
      update: {
        type: planType as any,
        status: 'ACTIVE',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId
      }
    })

    // Update user's subscription type
    await db.user.update({
      where: { id: userId },
      data: { subscription: planType as any }
    })

    console.log(`User ${userId} subscribed to ${planType} plan`)
  } catch (error) {
    console.error('Error updating subscription after checkout:', error)
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log('Subscription deleted:', subscription.id)
  
  try {
    const dbSubscription = await db.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
      include: { user: true }
    })

    if (dbSubscription) {
      // Update subscription status
      await db.subscription.update({
        where: { id: dbSubscription.id },
        data: { status: 'CANCELLED' }
      })

      // Downgrade user to free plan
      await db.user.update({
        where: { id: dbSubscription.userId },
        data: { subscription: 'FREE' }
      })

      console.log(`User ${dbSubscription.userId} downgraded to FREE plan`)
    }
  } catch (error) {
    console.error('Error handling subscription deletion:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log('Invoice payment succeeded:', invoice.id)
  
  if (invoice.subscription) {
    await SubscriptionService.updateSubscriptionFromStripe(invoice.subscription)
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  console.log('Invoice payment failed:', invoice.id)
  
  try {
    const subscription = await db.subscription.findFirst({
      where: { stripeSubscriptionId: invoice.subscription }
    })

    if (subscription) {
      await db.subscription.update({
        where: { id: subscription.id },
        data: { status: 'PAST_DUE' }
      })
    }
  } catch (error) {
    console.error('Error handling failed payment:', error)
  }
}