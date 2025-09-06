// Common type definitions for the application

export interface InterviewQuestion {
  id?: string
  question: string
  followUp: string
  category: 'behavioral' | 'technical' | 'situational'
  difficulty: 'easy' | 'medium' | 'hard'
  expectedDuration: number
}

export interface InterviewAnswer {
  questionId: string | number
  question: string
  userAnswer: string
  idealAnswer?: string
  score?: number
  strengths?: string[]
  weaknesses?: string[]
  category: string
  responseTime?: number
  confidence?: number
  followUpQuestion?: string
  followUpAnswer?: string
  timestamp?: string
}

export interface PaymentData {
  id?: string
  userId: string
  amount: number
  currency: string
  status: string
  planType?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface UserData {
  id: string
  clerkId?: string
  email: string
  firstName?: string
  lastName?: string
  interviewCredits?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = unknown> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

export interface DatabaseWhereCondition {
  [key: string]: string | number | boolean | Date | undefined | null
}

export interface SessionData {
  id: string
  userId: string
  sessionId?: string
  interviewId?: string
  position?: string
  currentQuestionIndex?: number
  currentStage?: string
  questions?: InterviewQuestion[]
  answers?: InterviewAnswer[]
  status?: string
  startedAt?: string
  completedAt?: string
  overallScore?: number
  detailedInterviewId?: string
}