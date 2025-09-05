import { db } from '@/lib/db'

export class UsageService {
  static async checkInterviewLimit(userId: string): Promise<{ canCreateInterview: boolean; remainingInterviews: number; totalLimit: number }> {
    // Get user's current credits
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { interviewCredits: true }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const credits = user.interviewCredits || 0
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
      select: { interviewCredits: true }
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

    return {
      plan: {
        type: 'CREDIT_BASED',
        name: 'Credit-Based System',
        features: ['Pay per interview', 'Detailed feedback', 'Email support']
      },
      usage: {
        monthlyInterviews,
        monthlyLimit: user.interviewCredits || 0,
        remainingInterviews: user.interviewCredits || 0,
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
    // In credit-based system, basic features are available to all users
    const featureAccess = {
      UNLIMITED_INTERVIEWS: false, // Pay per interview model
      ADVANCED_ANALYTICS: true,    // Available to all users
      TEAM_MANAGEMENT: false,      // Not implemented
      API_ACCESS: false           // Not implemented
    }

    return featureAccess[feature] || false
  }

  static async getUpgradePrompts(userId: string) {
    // Get user's current credits
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { interviewCredits: true }
    })

    if (!user) return []

    const prompts = []

    // Check credits for all users (credit-based system)
    if (user.interviewCredits <= 0) {
      prompts.push({
        type: 'NO_CREDITS',
        title: 'No Interview Credits',
        message: 'You have no interview credits remaining. Purchase more interviews to continue practicing!',
        action: 'Buy Interview Credits',
        urgency: 'high'
      })
    } else if (user.interviewCredits <= 2) {
      prompts.push({
        type: 'LOW_CREDITS',
        title: 'Running Low on Credits',
        message: `You have ${user.interviewCredits} interview${user.interviewCredits === 1 ? '' : 's'} remaining. Consider purchasing more.`,
        action: 'Get More Interviews',
        urgency: 'medium'
      })
    }

    return prompts
  }
}