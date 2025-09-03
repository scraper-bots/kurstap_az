import { db } from '@/lib/db'

export class UsageService {
  static async checkInterviewLimit(userId: string): Promise<{ canCreateInterview: boolean; remainingInterviews: number; totalLimit: number }> {
    // Get user's current credits and plan
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { planType: true, interviewCredits: true }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const userPlan = user.planType || 'BASIC'
    const credits = user.interviewCredits || 0

    // PREMIUM = unlimited interviews (subscription)
    if (userPlan === 'PREMIUM') {
      // Check if subscription is active
      const activeSubscription = await db.subscription.findFirst({
        where: { 
          userId: userId,
          status: 'ACTIVE',
          currentPeriodEnd: {
            gte: new Date()
          }
        }
      })

      if (activeSubscription) {
        return {
          canCreateInterview: true,
          remainingInterviews: -1, // Unlimited
          totalLimit: -1
        }
      }
    }

    // For BASIC/STANDARD (credit-based) or expired PREMIUM
    const canCreateInterview = credits > 0
    
    return {
      canCreateInterview,
      remainingInterviews: credits,
      totalLimit: credits
    }
  }

  static async getUserUsageStats(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { planType: true, interviewCredits: true }
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
      BASIC: { interviews: 'credits', features: ['Pay per interview', 'Basic feedback', 'Email support'] },
      STANDARD: { interviews: 'credits', features: ['5 interviews per purchase', 'Detailed feedback', 'Priority support'] },
      PREMIUM: { interviews: -1, features: ['Unlimited interviews', 'Advanced analytics', 'Priority support'] }
    }

    const userPlan = user.planType || 'BASIC'
    const planInfo = planLimits[userPlan]

    return {
      plan: {
        type: userPlan,
        name: userPlan === 'BASIC' ? 'Basic Package' : userPlan === 'STANDARD' ? 'Standard Package' : 'Premium Subscription',
        features: planInfo.features
      },
      usage: {
        monthlyInterviews,
        monthlyLimit: planInfo.interviews === -1 ? -1 : user.interviewCredits || 0,
        remainingInterviews: planInfo.interviews === -1 ? -1 : user.interviewCredits || 0,
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
      select: { planType: true }
    })

    if (!user) {
      return false
    }

    const userPlan = user.planType || 'BASIC'

    const featureAccess = {
      BASIC: {
        UNLIMITED_INTERVIEWS: false,
        ADVANCED_ANALYTICS: false,
        TEAM_MANAGEMENT: false,
        API_ACCESS: false
      },
      STANDARD: {
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
      }
    }

    return featureAccess[userPlan][feature] || false
  }

  static async getUpgradePrompts(userId: string) {
    // Get user's current credits
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { planType: true, interviewCredits: true }
    })

    if (!user) return []

    const prompts = []

    if (user.planType !== 'PREMIUM') {
      // Check credits for BASIC/STANDARD users
      if (user.interviewCredits <= 0) {
        prompts.push({
          type: 'NO_CREDITS',
          title: 'No Interview Credits',
          message: `You have no interview credits remaining. Purchase more interviews to continue practicing!`,
          action: 'Buy Interview Credits',
          urgency: 'high'
        })
      } else if (user.interviewCredits <= 2) {
        prompts.push({
          type: 'LOW_CREDITS',
          title: 'Running Low on Credits',
          message: `You have ${user.interviewCredits} interview${user.interviewCredits === 1 ? '' : 's'} remaining. Consider purchasing more or upgrading to unlimited.`,
          action: 'Get More Interviews',
          urgency: 'medium'
        })
      }
    }

    return prompts
  }
}