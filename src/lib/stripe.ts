import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
})

// Subscription plans configuration
export const PLANS = {
  FREE: {
    name: 'Free',
    description: 'Basic interview practice',
    price: 0,
    interval: null,
    stripePriceId: null,
    features: [
      '2 AI interviews per month',
      'Basic feedback and scoring',
      'Limited question categories'
    ],
    limits: {
      interviewsPerMonth: 2,
      questionsPerInterview: 5
    }
  },
  PREMIUM: {
    name: 'Premium',
    description: 'Unlimited practice with detailed analytics',
    price: 19,
    interval: 'month' as const,
    stripePriceId: 'price_premium_monthly', // Replace with actual Stripe price ID
    features: [
      'Unlimited AI interviews',
      'Detailed feedback and analytics',
      'All question categories',
      'Performance tracking',
      'Interview history',
      'Priority support'
    ],
    limits: {
      interviewsPerMonth: -1, // Unlimited
      questionsPerInterview: 20
    }
  },
  ENTERPRISE: {
    name: 'Enterprise',
    description: 'Advanced features for teams',
    price: 49,
    interval: 'month' as const,
    stripePriceId: 'price_enterprise_monthly', // Replace with actual Stripe price ID
    features: [
      'Everything in Premium',
      'Team management',
      'Custom interview templates',
      'Advanced analytics dashboard',
      'API access',
      'Dedicated support'
    ],
    limits: {
      interviewsPerMonth: -1, // Unlimited
      questionsPerInterview: 30,
      teamMembers: 10
    }
  }
} as const

export type PlanType = keyof typeof PLANS