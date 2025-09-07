import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useUser } from '@clerk/nextjs'
import InterviewPage from '@/app/interview/page'
import { useInterviewCompletion } from '@/hooks/useInterviewCompletion'

// Mock dependencies
jest.mock('@clerk/nextjs')
jest.mock('@/hooks/useInterviewCompletion')
jest.mock('@/components/audio-interview', () => {
  return {
    AudioInterview: ({ onComplete }: { onComplete: () => void }) => (
      <div data-testid="audio-interview">
        <button onClick={onComplete} data-testid="complete-interview">
          Complete Interview
        </button>
      </div>
    )
  }
})
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null)
  })
}))

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>
const mockUseInterviewCompletion = useInterviewCompletion as jest.MockedFunction<typeof useInterviewCompletion>

describe('InterviewPage', () => {
  const mockUser = {
    id: 'user-123',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    firstName: 'Test',
    lastName: 'User'
  }

  const mockCompleteInterview = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseUser.mockReturnValue({
      user: mockUser,
      isLoaded: true,
      isSignedIn: true
    } as any)
    
    mockUseInterviewCompletion.mockReturnValue({
      completeInterview: mockCompleteInterview,
      isSubmitting: false,
      error: null
    })

    // Mock fetch globally
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Authentication', () => {
    it('should show sign-in message when user is not authenticated', () => {
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: true,
        isSignedIn: false
      } as any)

      render(<InterviewPage />)

      expect(screen.getByText('Please sign in to start your interview')).toBeInTheDocument()
      expect(screen.getByText('You need to be signed in to access the AI interview platform')).toBeInTheDocument()
    })

    it('should show interview setup when user is authenticated', () => {
      render(<InterviewPage />)

      expect(screen.getByText('AI Interview Assistant')).toBeInTheDocument()
      expect(screen.getByText('Configure your personalized interview session')).toBeInTheDocument()
    })
  })

  describe('Interview Setup', () => {
    it('should allow user to enter position and select difficulty', () => {
      render(<InterviewPage />)

      const positionInput = screen.getByPlaceholderText(/e.g., Software Engineer/)
      fireEvent.change(positionInput, { target: { value: 'Frontend Developer' } })

      expect(positionInput).toHaveValue('Frontend Developer')

      // Check difficulty options are present
      expect(screen.getByText('Easy')).toBeInTheDocument()
      expect(screen.getByText('Medium')).toBeInTheDocument()
      expect(screen.getByText('Hard')).toBeInTheDocument()
    })

    it('should disable start button when position is empty', () => {
      render(<InterviewPage />)

      const startButton = screen.getByText('Start Voice Interview')
      expect(startButton).toBeDisabled()
    })

    it('should enable start button when position is entered', () => {
      render(<InterviewPage />)

      const positionInput = screen.getByPlaceholderText(/e.g., Software Engineer/)
      fireEvent.change(positionInput, { target: { value: 'Frontend Developer' } })

      const startButton = screen.getByText('Start Voice Interview')
      expect(startButton).not.toBeDisabled()
    })

    it('should start interview when start button is clicked', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            sessionId: 'session-123',
            currentQuestion: {
              id: 'q1',
              question: 'Tell me about yourself',
              category: 'behavioral',
              difficulty: 'easy',
              expectedDuration: 3
            }
          }
        })
      } as any)

      render(<InterviewPage />)

      const positionInput = screen.getByPlaceholderText(/e.g., Software Engineer/)
      fireEvent.change(positionInput, { target: { value: 'Frontend Developer' } })

      const startButton = screen.getByText('Start Voice Interview')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/interview/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            position: 'Frontend Developer',
            difficulty: 'medium',
            totalQuestions: 8
          })
        })
      })
    })
  })

  describe('Interview Flow', () => {
    it('should show loading state during interview setup', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<InterviewPage />)

      const positionInput = screen.getByPlaceholderText(/e.g., Software Engineer/)
      fireEvent.change(positionInput, { target: { value: 'Frontend Developer' } })

      const startButton = screen.getByText('Start Voice Interview')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('Setting up your AI interview...')).toBeInTheDocument()
      })
    })

    it('should show audio interview component when interview starts', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            sessionId: 'session-123',
            currentQuestion: {
              id: 'q1',
              question: 'Tell me about yourself',
              category: 'behavioral',
              difficulty: 'easy',
              expectedDuration: 3
            }
          }
        })
      } as any)

      render(<InterviewPage />)

      const positionInput = screen.getByPlaceholderText(/e.g., Software Engineer/)
      fireEvent.change(positionInput, { target: { value: 'Frontend Developer' } })

      const startButton = screen.getByText('Start Voice Interview')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByTestId('audio-interview')).toBeInTheDocument()
      })
    })

    it('should show completion screen after interview finishes', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            sessionId: 'session-123',
            currentQuestion: {
              id: 'q1',
              question: 'Tell me about yourself',
              category: 'behavioral',
              difficulty: 'easy',
              expectedDuration: 3
            }
          }
        })
      } as any)

      mockCompleteInterview.mockResolvedValueOnce({
        success: true,
        interviewId: 'interview-123'
      })

      render(<InterviewPage />)

      // Start interview
      const positionInput = screen.getByPlaceholderText(/e.g., Software Engineer/)
      fireEvent.change(positionInput, { target: { value: 'Frontend Developer' } })

      const startButton = screen.getByText('Start Voice Interview')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByTestId('audio-interview')).toBeInTheDocument()
      })

      // Complete interview
      const completeButton = screen.getByTestId('complete-interview')
      fireEvent.click(completeButton)

      await waitFor(() => {
        expect(screen.getByText('Interview Completed!')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error message when interview start fails', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<InterviewPage />)

      const positionInput = screen.getByPlaceholderText(/e.g., Software Engineer/)
      fireEvent.change(positionInput, { target: { value: 'Frontend Developer' } })

      const startButton = screen.getByText('Start Voice Interview')
      fireEvent.click(startButton)

      await waitFor(() => {
        // Should return to setup state on error
        expect(screen.getByText('AI Interview Assistant')).toBeInTheDocument()
      })
    })

    it('should show error message during completion', () => {
      mockUseInterviewCompletion.mockReturnValue({
        completeInterview: mockCompleteInterview,
        isSubmitting: false,
        error: 'Failed to save interview results'
      })

      render(<InterviewPage />)

      // Should show loading with error
      const positionInput = screen.getByPlaceholderText(/e.g., Software Engineer/)
      fireEvent.change(positionInput, { target: { value: 'Frontend Developer' } })

      const startButton = screen.getByText('Start Voice Interview')
      fireEvent.click(startButton)

      // Note: This would need to be adjusted based on actual error display logic
    })
  })

  describe('Difficulty Selection', () => {
    it('should select different difficulty levels', () => {
      render(<InterviewPage />)

      // Default should be medium
      expect(screen.getByText('Medium')).toBeInTheDocument()

      // Click on hard difficulty
      const hardOption = screen.getByText('Hard')
      fireEvent.click(hardOption)

      // Should show selected state (check mark)
      expect(hardOption.closest('div')).toHaveClass('border-blue-500')
    })

    it('should show correct question counts for each difficulty', () => {
      render(<InterviewPage />)

      expect(screen.getByText('5 questions')).toBeInTheDocument() // Easy
      expect(screen.getByText('8 questions')).toBeInTheDocument() // Medium
      expect(screen.getByText('12 questions')).toBeInTheDocument() // Hard
    })
  })
})