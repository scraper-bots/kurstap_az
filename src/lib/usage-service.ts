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

    const userPlan = user.planType || 'FREE'
    const credits = user.interviewCredits || 0

    // PREMIUM = 10 interviews (subscription)
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
          canCreateInterview: credits > 0,
          remainingInterviews: credits,
          totalLimit: 10
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
      FREE: { interviews: 'credits', features: ['No interviews available', 'Must purchase to practice'] },
      BASIC: { interviews: 'credits', features: ['Pay per interview', 'Basic feedback', 'Email support'] },
      STANDARD: { interviews: 'credits', features: ['5 interviews per purchase', 'Detailed feedback', 'Priority support'] },
      PREMIUM: { interviews: 10, features: ['10 interviews per month', 'Advanced analytics', 'Priority support'] }
    }

    const userPlan = user.planType || 'FREE'
    const planInfo = planLimits[userPlan]

    return {
      plan: {
        type: userPlan,
        name: userPlan === 'FREE' ? 'Free Plan' : userPlan === 'BASIC' ? '1 Interview' : userPlan === 'STANDARD' ? '5 Interviews' : '10 Interviews',
        features: planInfo.features
      },
      usage: {
        monthlyInterviews,
        monthlyLimit: planInfo.interviews === 10 ? 10 : user.interviewCredits || 0,
        remainingInterviews: planInfo.interviews === 10 ? 10 : user.interviewCredits || 0,
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

    const userPlan = user.planType || 'FREE'

    const featureAccess = {
      FREE: {
        UNLIMITED_INTERVIEWS: false,
        ADVANCED_ANALYTICS: false,
        TEAM_MANAGEMENT: false,
        API_ACCESS: false
      },
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
        UNLIMITED_INTERVIEWS: false,
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
      // Check credits for FREE/BASIC/STANDARD users
      if (user.interviewCredits <= 0) {
        const message = user.planType === 'FREE' 
          ? 'You need to purchase a plan to start practicing interviews!'
          : 'You have no interview credits remaining. Purchase more interviews to continue practicing!'
        
        prompts.push({
          type: 'NO_CREDITS',
          title: user.planType === 'FREE' ? 'Purchase Required' : 'No Interview Credits',
          message,
          action: user.planType === 'FREE' ? 'Choose a Plan' : 'Buy Interview Credits',
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