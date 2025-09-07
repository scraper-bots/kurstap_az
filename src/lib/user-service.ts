import { db } from './db'
import { User } from '@prisma/client'

export interface CreateUserData {
  id: string
  email: string
  password: string
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
          id: userData.id,
          email: userData.email,
          password: userData.password,
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
        where: { id: clerkId },
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
        where: { id: clerkId },
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
        where: { id: clerkId },
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
      let user = await this.getUserByClerkId(userData.id)
      
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
        where: { id: clerkId },
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
        interviewCredits: user.interviewCredits,
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      return null
    }
  }
}