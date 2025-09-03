import { db } from '@/lib/db'

export class UsageService {
  static async checkInterviewLimit(userId: string): Promise<{ canCreateInterview: boolean; remainingInterviews: number; totalLimit: number }> {
    // Get user's current subscription
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { subscription: true }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Define limits based on plan
    const planLimits = {
      FREE: 1, // Only 1 free interview
      PREMIUM: -1, // Unlimited
      ENTERPRISE: -1 // Unlimited
    }

    const userPlan = user.subscription || 'FREE'
    const monthlyLimit = planLimits[userPlan]

    // If unlimited plan, allow creation
    if (monthlyLimit === -1) {
      return {
        canCreateInterview: true,
        remainingInterviews: -1, // Unlimited
        totalLimit: -1
      }
    }

    // For FREE plan, check monthly usage
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const monthlyUsage = await db.interview.count({
      where: {
        userId: userId,
        createdAt: {
          gte: startOfMonth
        }
      }
    })

    const remainingInterviews = Math.max(0, monthlyLimit - monthlyUsage)
    const canCreateInterview = monthlyUsage < monthlyLimit

    return {
      canCreateInterview,
      remainingInterviews,
      totalLimit: monthlyLimit
    }
  }

  static async getUserUsageStats(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { subscription: true }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const endOfMonth = new Date(startOfMonth)
    endOfMonth.setMonth(endOfMonth.getMonth() + 1)

    // Get monthly statistics
    const [monthlyInterviews, totalInterviews, completedInterviews] = await Promise.all([
      db.interview.count({
        where: {
          userId: userId,
          createdAt: {
            gte: startOfMonth,
            lt: endOfMonth
          }
        }
      }),
      db.interview.count({
        where: { userId: userId }
      }),
      db.interview.count({
        where: {
          userId: userId,
          status: 'COMPLETED'
        }
      })
    ])

    // Get plan limits
    const planLimits = {
      FREE: { interviews: 1, features: ['1 AI interview per month', 'Basic feedback', 'Email support'] },
      PREMIUM: { interviews: -1, features: ['Unlimited interviews', 'Advanced analytics', 'Priority support'] },
      ENTERPRISE: { interviews: -1, features: ['Team management', 'API access', 'Dedicated support'] }
    }

    const userPlan = user.subscription || 'FREE'
    const planInfo = planLimits[userPlan]

    return {
      plan: {
        type: userPlan,
        name: userPlan === 'FREE' ? 'Free Plan' : userPlan === 'PREMIUM' ? 'Premium Plan' : 'Enterprise Plan',
        features: planInfo.features
      },
      usage: {
        monthlyInterviews,
        monthlyLimit: planInfo.interviews,
        remainingInterviews: planInfo.interviews === -1 ? -1 : Math.max(0, planInfo.interviews - monthlyInterviews),
        totalInterviews,
        completedInterviews,
        completionRate: totalInterviews > 0 ? Math.round((completedInterviews / totalInterviews) * 100) : 0
      },
      period: {
        start: startOfMonth,
        end: new Date(endOfMonth.getTime() - 1) // End of current month
      }
    }
  }

  static async canUserAccessFeature(userId: string, feature: 'UNLIMITED_INTERVIEWS' | 'ADVANCED_ANALYTICS' | 'TEAM_MANAGEMENT' | 'API_ACCESS'): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { subscription: true }
    })

    if (!user) {
      return false
    }

    const userPlan = user.subscription || 'FREE'

    const featureAccess = {
      FREE: {
        UNLIMITED_INTERVIEWS: false,
        ADVANCED_ANALYTICS: false,
        TEAM_MANAGEMENT: false,
        API_ACCESS: false
      },
      PREMIUM: {
        UNLIMITED_INTERVIEWS: true,
        ADVANCED_ANALYTICS: true,
        TEAM_MANAGEMENT: false,
        API_ACCESS: false
      },
      ENTERPRISE: {
        UNLIMITED_INTERVIEWS: true,
        ADVANCED_ANALYTICS: true,
        TEAM_MANAGEMENT: true,
        API_ACCESS: true
      }
    }

    return featureAccess[userPlan][feature] || false
  }

  static async getUpgradePrompts(userId: string) {
    const usageStats = await this.getUserUsageStats(userId)
    const prompts = []

    if (usageStats.plan.type === 'FREE') {
      // Check if used their free interview
      if (usageStats.usage.monthlyInterviews >= 1) {
        prompts.push({
          type: 'LIMIT_REACHED',
          title: 'Free Interview Used',
          message: `You've used your free interview this month. Upgrade to continue practicing!`,
          action: 'Upgrade to Premium for unlimited interviews',
          urgency: 'high'
        })
      } else if (usageStats.usage.monthlyInterviews === 0) {
        prompts.push({
          type: 'WELCOME_PROMPT',
          title: 'Try Your Free Interview!',
          message: `You have 1 free AI interview available. Experience our advanced coaching system.`,
          action: 'Start Free Interview',
          urgency: 'low'
        })
      }
    }

    return prompts
  }
}