import { db } from './db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { User } from '@prisma/client'

// JWT Secret - in production, use a proper secret
const JWT_SECRET = process.env.JWT_SECRET || 'bir-guru-jwt-secret-2025-secure'
const SESSION_COOKIE_NAME = 'bir-guru-session'

export interface AuthUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
  role: 'USER' | 'ADMIN'
  interviewCredits: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export class AuthService {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }

  /**
   * Compare a password with its hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }

  /**
   * Generate a JWT token for a user
   */
  static generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '30d' } // 30 days
    )
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string): { userId: string; email: string; role: string } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string }
    } catch (error) {
      console.error('Token verification failed:', error)
      return null
    }
  }

  /**
   * Register a new user
   */
  static async register(userData: RegisterData): Promise<{ user: AuthUser; token: string }> {
    try {
      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { email: userData.email }
      })

      if (existingUser) {
        throw new Error('User already exists with this email')
      }

      // Validate password strength
      if (userData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long')
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password)

      // Create user
      const user = await db.user.create({
        data: {
          email: userData.email.toLowerCase(),
          password: hashedPassword,
          firstName: userData.firstName || null,
          lastName: userData.lastName || null,
          interviewCredits: 3, // Give new users 3 free credits
          role: 'USER'
        }
      })

      // Generate token
      const token = this.generateToken(user)

      // Create session
      await this.createSession(user.id, token)

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        role: user.role as 'USER' | 'ADMIN',
        interviewCredits: user.interviewCredits
      }

      return { user: authUser, token }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> {
    try {
      // Find user by email
      const user = await db.user.findUnique({
        where: { email: credentials.email.toLowerCase() }
      })

      if (!user) {
        throw new Error('Invalid email or password')
      }

      // Check password
      const isValidPassword = await this.comparePassword(credentials.password, user.password)
      if (!isValidPassword) {
        throw new Error('Invalid email or password')
      }

      // Generate token
      const token = this.generateToken(user)

      // Create session
      await this.createSession(user.id, token)

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        role: user.role as 'USER' | 'ADMIN',
        interviewCredits: user.interviewCredits
      }

      return { user: authUser, token }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  /**
   * Create a session record
   */
  static async createSession(userId: string, sessionId: string): Promise<void> {
    try {
      // Delete old sessions for this user
      await db.userSession.deleteMany({
        where: { userId }
      })

      // Create new session
      await db.userSession.create({
        data: {
          sessionId,
          userId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      })
    } catch (error) {
      console.error('Session creation error:', error)
      throw error
    }
  }

  /**
   * Get current user from token
   */
  static async getCurrentUser(token?: string): Promise<AuthUser | null> {
    try {
      if (!token) {
        const cookieStore = await cookies()
        token = cookieStore.get(SESSION_COOKIE_NAME)?.value
      }

      if (!token) {
        return null
      }

      // Verify token
      const payload = this.verifyToken(token)
      if (!payload) {
        return null
      }

      // Check session exists
      const session = await db.userSession.findUnique({
        where: { sessionId: token },
        include: { user: true }
      })

      if (!session || session.expiresAt < new Date()) {
        return null
      }

      const user = session.user

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        role: user.role as 'USER' | 'ADMIN',
        interviewCredits: user.interviewCredits
      }
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  /**
   * Logout user
   */
  static async logout(token?: string): Promise<void> {
    try {
      if (!token) {
        const cookieStore = await cookies()
        token = cookieStore.get(SESSION_COOKIE_NAME)?.value
      }

      if (token) {
        // Delete session from database
        await db.userSession.deleteMany({
          where: { sessionId: token }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  /**
   * Generate password reset token
   */
  static async generatePasswordResetToken(email: string): Promise<string> {
    try {
      const user = await db.user.findUnique({
        where: { email: email.toLowerCase() }
      })

      if (!user) {
        throw new Error('User not found')
      }

      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await db.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordTokenExpires: resetTokenExpires
        }
      })

      return resetToken
    } catch (error) {
      console.error('Generate reset token error:', error)
      throw error
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long')
      }

      const user = await db.user.findFirst({
        where: {
          resetPasswordToken: token,
          resetPasswordTokenExpires: {
            gt: new Date()
          }
        }
      })

      if (!user) {
        throw new Error('Invalid or expired reset token')
      }

      const hashedPassword = await this.hashPassword(newPassword)

      await db.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordTokenExpires: null
        }
      })
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }

  /**
   * Set authentication cookie
   */
  static async setAuthCookie(token: string): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    })
  }

  /**
   * Clear authentication cookie
   */
  static async clearAuthCookie(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)
  }
}

// Export instance for middleware and API routes
export const authService = {
  async register(data: RegisterData) {
    try {
      const result = await AuthService.register(data)
      return { success: true, user: result.user, sessionId: result.token }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Registration failed' }
    }
  },

  async login(credentials: LoginCredentials) {
    try {
      const result = await AuthService.login(credentials)
      return { success: true, user: result.user, sessionId: result.token }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' }
    }
  },

  async getUserFromSession(sessionId: string): Promise<AuthUser | null> {
    try {
      return await AuthService.getCurrentUser(sessionId)
    } catch (error) {
      return null
    }
  },

  async logout(sessionId: string) {
    try {
      await AuthService.logout(sessionId)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Logout failed' }
    }
  }
}