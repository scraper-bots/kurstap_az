import { NextRequest } from 'next/server'
import { POST } from '@/app/api/interview/answer/route'
import { InterviewService } from '@/lib/interview-service'
import { auth } from '@clerk/nextjs/server'

// Mock dependencies
jest.mock('@clerk/nextjs/server')
jest.mock('@/lib/interview-service')
jest.mock('@/lib/retry-service')
jest.mock('@/lib/compression-middleware')

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockInterviewService = InterviewService as jest.Mocked<typeof InterviewService>

describe('/api/interview/answer', () => {
  const mockUserId = 'user-123'
  const mockSessionId = 'session-456'
  const mockAnswer = 'This is my answer'

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: mockUserId })
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const request = new NextRequest('http://localhost:3000/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: mockSessionId, answer: mockAnswer })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized')
    })

    it('should proceed when user is authenticated', async () => {
      mockInterviewService.submitAnswer.mockResolvedValue({
        success: true,
        sessionData: {
          id: mockSessionId,
          currentQuestionIndex: 1,
          questions: [{ id: '1', question: 'Test?', category: 'technical', difficulty: 'easy', expectedDuration: 5 }]
        } as any,
        nextAction: 'next-question'
      })

      const request = new NextRequest('http://localhost:3000/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: mockSessionId, answer: mockAnswer })
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockInterviewService.submitAnswer).toHaveBeenCalledWith(
        mockSessionId,
        mockUserId,
        mockAnswer,
        false
      )
    })
  })

  describe('Request validation', () => {
    it('should return 400 when sessionId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: mockAnswer })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Session ID is required')
    })

    it('should return 400 when answer is missing and not skipping', async () => {
      const request = new NextRequest('http://localhost:3000/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: mockSessionId })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Answer is required when not skipping question')
    })

    it('should allow empty answer when skipping question', async () => {
      mockInterviewService.submitAnswer.mockResolvedValue({
        success: true,
        sessionData: {
          id: mockSessionId,
          currentQuestionIndex: 1,
          questions: [{ id: '1', question: 'Test?', category: 'technical', difficulty: 'easy', expectedDuration: 5 }]
        } as any,
        nextAction: 'next-question'
      })

      const request = new NextRequest('http://localhost:3000/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: mockSessionId, 
          answer: '', 
          skipQuestion: true 
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockInterviewService.submitAnswer).toHaveBeenCalledWith(
        mockSessionId,
        mockUserId,
        'SKIPPED',
        true
      )
    })

    it('should return 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid JSON in request body')
    })
  })

  describe('Response formatting', () => {
    it('should return next question when available', async () => {
      const mockNextQuestion = {
        id: 'question-2',
        question: 'What is your experience?',
        category: 'behavioral',
        difficulty: 'medium',
        expectedDuration: 4
      }

      mockInterviewService.submitAnswer.mockResolvedValue({
        success: true,
        sessionData: {
          id: mockSessionId,
          currentQuestionIndex: 1,
          questions: [
            { id: '1', question: 'First question', category: 'technical', difficulty: 'easy', expectedDuration: 5 },
            mockNextQuestion
          ]
        } as any,
        nextAction: 'next-question'
      })

      const request = new NextRequest('http://localhost:3000/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: mockSessionId, answer: mockAnswer })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.nextAction).toBe('next-question')
      expect(data.data.currentQuestion).toEqual({
        id: mockNextQuestion.id,
        question: mockNextQuestion.question,
        category: mockNextQuestion.category,
        difficulty: mockNextQuestion.difficulty,
        expectedDuration: mockNextQuestion.expectedDuration
      })
      expect(data.data.progress).toEqual({
        current: 2,
        total: 2
      })
    })

    it('should return completion status when interview is finished', async () => {
      mockInterviewService.submitAnswer.mockResolvedValue({
        success: true,
        sessionData: {
          id: mockSessionId,
          currentQuestionIndex: 1,
          questions: [
            { id: '1', question: 'Only question', category: 'technical', difficulty: 'easy', expectedDuration: 5 }
          ],
          overallScore: 85
        } as any,
        nextAction: 'completed',
        finalEvaluation: {
          overallScore: 85,
          categoryScores: { behavioral: 80, technical: 90, situational: 75 }
        }
      })

      const request = new NextRequest('http://localhost:3000/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: mockSessionId, answer: mockAnswer })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.nextAction).toBe('completed')
      expect(data.data.overallScore).toBe(85)
      expect(data.data.finalEvaluation).toBeDefined()
    })
  })

  describe('Error handling', () => {
    it('should handle InterviewService errors', async () => {
      mockInterviewService.submitAnswer.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: mockSessionId, answer: mockAnswer })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Interview system encountered an error. Please try again.')
      expect(data.diagnostic).toBeDefined()
    })

    it('should handle InterviewService returning unsuccessful result', async () => {
      mockInterviewService.submitAnswer.mockResolvedValue({
        success: false,
        sessionData: null as any,
        nextAction: 'next-question' as any
      })

      const request = new NextRequest('http://localhost:3000/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: mockSessionId, answer: mockAnswer })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to submit answer')
    })
  })

  describe('Performance and reliability', () => {
    it('should log request processing time', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      mockInterviewService.submitAnswer.mockResolvedValue({
        success: true,
        sessionData: {
          id: mockSessionId,
          currentQuestionIndex: 0,
          questions: []
        } as any,
        nextAction: 'completed'
      })

      const request = new NextRequest('http://localhost:3000/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: mockSessionId, answer: mockAnswer })
      })

      await POST(request)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INTERVIEW API]'),
        expect.any(Object)
      )

      consoleSpy.mockRestore()
    })
  })
})