import { db } from './db'
import { User } from '@prisma/client'

export interface CreateUserData {
  clerkId: string
  email: string
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string | null
}

export class UserService {
  /**
   * Create a new user in the database
   */
  static async createUser(userData: CreateUserData): Promise<User> {
    try {
      const user = await db.user.create({
        data: {
          clerkId: userData.clerkId,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          imageUrl: userData.imageUrl,
        },
      })
      
      console.log('User created successfully:', user.id)
      return user
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  /**
   * Get user by Clerk ID
   */
  static async getUserByClerkId(clerkId: string): Promise<User | null> {
    try {
      return await db.user.findUnique({
        where: { clerkId },
        include: {
          interviews: true,
          sessions: true,
          subscriptions: true,
        },
      })
    } catch (error) {
      console.error('Error fetching user by Clerk ID:', error)
      return null
    }
  }

  /**
   * Update user information
   */
  static async updateUser(clerkId: string, updateData: Partial<CreateUserData>): Promise<User | null> {
    try {
      return await db.user.update({
        where: { clerkId },
        data: {
          email: updateData.email,
          firstName: updateData.firstName,
          lastName: updateData.lastName,
          imageUrl: updateData.imageUrl,
        },
      })
    } catch (error) {
      console.error('Error updating user:', error)
      return null
    }
  }

  /**
   * Delete user from database
   */
  static async deleteUser(clerkId: string): Promise<boolean> {
    try {
      await db.user.delete({
        where: { clerkId },
      })
      console.log('User deleted successfully:', clerkId)
      return true
    } catch (error) {
      console.error('Error deleting user:', error)
      return false
    }
  }

  /**
   * Get or create user (useful for authentication flows)
   */
  static async getOrCreateUser(userData: CreateUserData): Promise<User> {
    try {
      // Try to find existing user
      let user = await this.getUserByClerkId(userData.clerkId)
      
      // If user doesn't exist, create them
      if (!user) {
        user = await this.createUser(userData)
      }
      
      return user
    } catch (error) {
      console.error('Error in getOrCreateUser:', error)
      throw error
    }
  }

  /**
   * Get user stats (interviews, sessions, etc.)
   */
  static async getUserStats(clerkId: string) {
    try {
      const user = await db.user.findUnique({
        where: { clerkId },
        include: {
          interviews: true,
          sessions: {
            where: { status: 'COMPLETED' }
          },
          _count: {
            select: {
              interviews: true,
              sessions: true,
            }
          }
        },
      })

      if (!user) return null

      const completedInterviews = user.interviews.filter(i => i.status === 'COMPLETED').length
      const averageScore = user.sessions.length > 0 
        ? user.sessions.reduce((sum, session) => sum + (session.score || 0), 0) / user.sessions.length
        : 0

      return {
        totalInterviews: user._count.interviews,
        completedInterviews,
        totalSessions: user._count.sessions,
        averageScore: Math.round(averageScore),
        subscription: user.subscription,
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      return null
    }
  }
}