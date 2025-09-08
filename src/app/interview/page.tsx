'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { AudioInterview } from '@/components/audio-interview'
import { useInterviewCompletion } from '@/hooks/useInterviewCompletion'
import { LoadingState } from '@/components/ui/loading-spinner'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { useConfirmation, confirmations } from '@/components/ui/confirmation-dialog'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface InterviewState {
  stage: 'setup' | 'interview' | 'completed' | 'loading'
  position?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  currentQuestion?: {
    id: string
    question: string
    category: string
    difficulty: string
    expectedDuration: number
  }
  sessionId?: string
  totalQuestions?: number
  answers?: Array<{
    questionId: number
    question: string
    userAnswer: string
    category: string
    responseTime?: number
  }>
  startTime?: number
}

function InterviewContent() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { completeInterview, isSubmitting, error: completionError } = useInterviewCompletion()
  const { show: showConfirmation, ConfirmationComponent } = useConfirmation()
  const [state, setState] = useState<InterviewState>({
    stage: 'setup'
  })
  const [position, setPosition] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')

  const searchParams = useSearchParams()
  
  const difficultyOptions = [
    {
      value: 'easy',
      label: 'Easy',
      description: 'Basic questions suitable for entry-level positions',
      color: 'bg-green-500',
      questions: '5 questions',
      count: 5
    },
    {
      value: 'medium',
      label: 'Medium', 
      description: 'Intermediate questions for experienced professionals',
      color: 'bg-yellow-500',
      questions: '8 questions',
      count: 8
    },
    {
      value: 'hard',
      label: 'Hard',
      description: 'Advanced questions for senior-level positions',
      color: 'bg-red-500',
      questions: '12 questions',
      count: 12
    }
  ]

  // Handle URL parameters for quick start
  useEffect(() => {
    const mode = searchParams.get('mode')
    const urlDifficulty = searchParams.get('difficulty')
    
    if (mode === 'quick' && urlDifficulty) {
      setDifficulty(urlDifficulty as any)
      setPosition('Software Engineer') // Default position for quick start
      // Auto-start interview in 1 second
      setTimeout(() => {
        if (position) {
          startInterview()
        }
      }, 1000)
    }
  }, [searchParams, position])

  const startInterview = async () => {
    if (!position.trim()) return
    
    setState(prev => ({ ...prev, stage: 'loading' }))
    
    const selectedDifficultyOption = difficultyOptions.find(opt => opt.value === difficulty)
    const expectedQuestions = selectedDifficultyOption?.count || 8
    
    try {
      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          position: position.trim(),
          difficulty: difficulty,
          totalQuestions: expectedQuestions
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          stage: 'interview',
          currentQuestion: data.data.currentQuestion,
          sessionId: data.data.sessionId,
          totalQuestions: expectedQuestions, // Use our expected count
          position: position.trim(),
          difficulty: difficulty,
          answers: [],
          startTime: Date.now()
        }))
      } else {
        console.error('Failed to start interview:', data.error)
        
        // Handle specific error types
        if (response.status === 402 || data.errorType === 'INSUFFICIENT_CREDITS') {
          // Show credit purchase dialog
          await showConfirmation({
            variant: 'destructive',
            title: 'No Interview Credits',
            message: data.error || 'You need credits to start an interview. Would you like to purchase credits?',
            confirmText: 'Purchase Credits',
            cancelText: 'Maybe Later',
            onConfirm: () => {
              // Redirect to pricing/purchase page
              window.location.href = '/pricing'
            }
          })
        } else {
          // Show generic error
          await showConfirmation({
            variant: 'destructive',
            title: 'Interview Start Failed',
            message: data.error || 'Failed to start interview session. Please try again.',
            confirmText: 'Try Again',
            cancelText: 'Cancel',
            onConfirm: () => {
              // User can try again
            }
          })
        }
        
        setState(prev => ({ ...prev, stage: 'setup' }))
      }
    } catch (error) {
      console.error('Error starting interview:', error)
      
      // Show network error
      await showConfirmation({
        variant: 'destructive',
        title: 'Connection Error',
        message: 'Unable to connect to the interview service. Please check your internet connection and try again.',
        confirmText: 'Try Again',
        cancelText: 'Cancel',
        onConfirm: () => {
          // User can try again
        }
      })
      
      setState(prev => ({ ...prev, stage: 'setup' }))
    }
  }

  const handleAnswer = async (answer: string) => {

    try {
      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          answer: answer.trim()
        })
      })
      
      const result = await response.json()
      
      // Store the answer locally
      if (state.currentQuestion) {
        const newAnswer = {
          questionId: state.answers?.length ? state.answers.length + 1 : 1,
          question: state.currentQuestion.question,
          userAnswer: answer.trim(),
          category: state.currentQuestion.category,
          responseTime: 30 // Could track actual response time
        }
        
        setState(prev => {
          const updatedAnswers = [...(prev.answers || []), newAnswer]
          return {
            ...prev,
            answers: updatedAnswers
          }
        })
      }
      
      return result
    } catch (error) {
      console.error('Error submitting answer:', error)
      return { success: false, error: 'Failed to submit answer' }
    }
  }

  const [completionState, setCompletionState] = useState<'idle' | 'fetching' | 'processing' | 'redirecting' | 'completed'>('idle')

  const handleComplete = async () => {
    // Prevent multiple completion calls using atomic state
    if (completionState !== 'idle') {
      console.log('⚠️ Completion already in progress:', completionState)
      return
    }

    setCompletionState('fetching')
    console.log('🏁 Interview completion started', {
      sessionId: state.sessionId,
      position: state.position,
      localAnswers: state.answers?.length || 0
    })

    try {
      // Always try to fetch answers from backend session first
      if (state.sessionId) {
          try {
            const sessionResponse = await fetch(`/api/interview/session?sessionId=${state.sessionId}`)
            const sessionData = await sessionResponse.json()
            
            console.log('📡 Session data received:', {
              success: sessionData.success,
              hasAnswers: !!sessionData.data?.answers,
              answersCount: sessionData.data?.answers?.length || 0,
              hasDetailedId: !!sessionData.data?.detailedInterviewId
            })

            if (sessionData.success && sessionData.data?.answers?.length > 0) {
              // Check if this session was already processed by the unified system
              if (sessionData.data.detailedInterviewId) {
                console.log('✅ Interview already processed, redirecting to:', sessionData.data.detailedInterviewId)
                window.location.href = `/interviews/${sessionData.data.detailedInterviewId}`
                return
              }
            
            // Transform session answers to completion API format
            const transformedAnswers = sessionData.data.answers.map((answer: any, index: number) => {
              // Find matching question to get category
              const matchingQuestion = sessionData.data.questions?.find((q: any) => q.id === answer.questionId)
              
              console.log(`🔍 Transforming answer ${index + 1}:`, {
                originalAnswer: answer,
                questionId: answer.questionId,
                userAnswer: answer.userAnswer || answer.answer,
                question: answer.question,
                matchingQuestion: !!matchingQuestion
              })
              
              return {
                questionId: index + 1,
                question: answer.question,
                userAnswer: answer.userAnswer || answer.answer, // Handle both possible field names
                category: matchingQuestion?.category || 'General',
                responseTime: 30 // Default response time
              }
            })
            
            const duration = Math.round((Date.now() - (state.startTime || Date.now())) / 1000 / 60)
            
            console.log('🚀 Completing interview with backend data:', {
              answers: transformedAnswers.length,
              position: state.position,
              duration
            })
            
            setCompletionState('processing')
            try {
              await completeInterview({
                title: `${state.position || 'Interview'}`,
                company: 'Practice Session', 
                position: state.position || 'General Position',
                difficulty: (state.difficulty?.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD') || 'MEDIUM',
                duration,
                answers: transformedAnswers
              })
              console.log('✅ Interview completion successful')
              setCompletionState('completed')
              return
            } catch (completionError) {
              console.error('❌ Interview completion failed:', completionError)
              setCompletionState('idle') // Reset state on failure to allow fallback
              // Fall through to next completion attempt
            }
          } else {
            console.warn('⚠️ No answers found in session data')
          }
        } catch (error) {
          console.error('❌ Error fetching session data:', error)
        }
    }

    // Final fallback: try with local state if available (only if not already completed)
    if (completionState === 'idle' && state.answers && state.answers.length > 0 && state.position && state.startTime) {
      console.log('🔄 Fallback: using local state data')
      const duration = Math.round((Date.now() - state.startTime) / 1000 / 60)
      
      setCompletionState('processing')
      try {
        await completeInterview({
          title: `${state.position} Interview`,
          company: 'Practice Session',
          position: state.position,
          difficulty: (state.difficulty?.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD') || 'MEDIUM',
          duration,
          answers: state.answers
        })
        console.log('✅ Fallback completion successful')
        setCompletionState('completed')
        return
      } catch (error) {
        console.error('❌ Fallback completion failed:', error)
        setCompletionState('idle') // Reset state to allow retry
        // Show user-friendly message
        alert('Interview completed! There was a technical issue saving the detailed results, but your responses have been recorded. Please check your interview history.')
      }
    }

      // Last resort: show completed state without saving
      console.warn('⚠️ Interview completed but could not save results')
      setCompletionState('completed')
      setState(prev => ({ ...prev, stage: 'completed' }))
    } catch (globalError) {
      console.error('❌ Global completion error:', globalError)
      setCompletionState('idle') // Reset to allow retry
      setState(prev => ({ ...prev, stage: 'completed' }))
    }
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center bg-white rounded-xl shadow-sm border p-8">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">Please sign in to start your interview</h1>
            <p className="text-gray-600 mb-4">You need to be signed in to access the AI interview platform</p>
            <a href="/auth/login" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Sign In
            </a>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto p-4">
          {ConfirmationComponent}
        {state.stage === 'setup' && (
          <div className="bg-white rounded-xl shadow-sm border p-8 max-w-2xl mx-auto mt-8">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Interview Assistant</h1>
              <p className="text-gray-600">Configure your personalized interview session</p>
            </div>
            
            <div className="space-y-6">
              {/* Position Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Position / Role
                </label>
                <input
                  type="text"
                  placeholder="e.g., Software Engineer, Product Manager, Data Scientist"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Difficulty Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Interview Difficulty Level
                </label>
                <div className="grid gap-4">
                  {difficultyOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => setDifficulty(option.value as any)}
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        difficulty === option.value
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${option.color}`}></div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{option.label}</h3>
                            <p className="text-sm text-gray-600">{option.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-700">{option.questions}</div>
                          {difficulty === option.value && (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-1">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interview Type Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2h4a1 1 0 110 2h-1v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 010-2h4zM9 6v8a1 1 0 002 0V6H9z"/>
                  </svg>
                  <h4 className="font-semibold text-blue-800">Voice-Powered Interview</h4>
                </div>
                <p className="text-blue-700 text-sm">
                  Experience real-time voice conversations with our AI interviewer. Speak naturally and receive instant feedback on your responses.
                </p>
              </div>
              
              <button
                onClick={startInterview}
                disabled={!position.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-lg"
              >
                Start Voice Interview
              </button>
            </div>
          </div>
        )}

        {state.stage === 'loading' && (
          <div className="bg-white rounded-xl shadow-sm border p-8 max-w-2xl mx-auto mt-8">
            <LoadingState
              message={isSubmitting ? 'Saving Interview Data...' : 'Setting up your AI interview...'}
              submessage={isSubmitting 
                ? 'Analyzing your responses and generating detailed feedback...'
                : `Preparing ${state.difficulty || difficulty} level questions for ${state.position || position}`
              }
            />
            {completionError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="text-red-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-red-800 font-medium">Processing Error</h4>
                    <p className="text-red-600 text-sm mt-1">{completionError}</p>
                    <p className="text-red-500 text-xs mt-2">Please try again or contact support if the issue persists.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {state.stage === 'interview' && state.currentQuestion && state.sessionId && (
          <AudioInterview
            sessionId={state.sessionId}
            initialQuestion={state.currentQuestion}
            totalQuestions={state.totalQuestions || 8}
            onAnswer={handleAnswer}
            onComplete={handleComplete}
          />
        )}

        {state.stage === 'completed' && (
          <div className="bg-white rounded-xl shadow-sm border p-8 max-w-2xl mx-auto mt-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-green-600 mb-2">Interview Completed!</h1>
              <p className="text-gray-600">
                Excellent work! Your AI interview session has been completed and your responses have been evaluated.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Interview Summary</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Position:</strong> {state.position}</p>
                <p><strong>Difficulty:</strong> {state.difficulty?.toUpperCase()}</p>
                <p><strong>Questions Completed:</strong> {state.totalQuestions}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  showConfirmation(confirmations.startOver(() => {
                    setState({ stage: 'setup' })
                    setPosition('')
                    setDifficulty('medium')
                  }))
                }}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Start New Interview
              </button>
              
              <a
                href="/dashboard"
                className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-center"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        )}
      </div>
      </div>
      <Footer />
    </>
  )
}

export default function InterviewPage() {
  return (
    <ErrorBoundary onError={(error, errorInfo) => {
      console.error('Interview page error:', error, errorInfo)
    }}>
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Navbar />
          <LoadingState 
            message="Loading interview..."
            submessage="Preparing your interview experience"
            className="min-h-screen"
          />
          <Footer />
        </div>
      }>
        <InterviewContent />
      </Suspense>
    </ErrorBoundary>
  )
}