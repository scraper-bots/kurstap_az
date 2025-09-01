'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { AudioInterview } from '@/components/audio-interview'

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
}

export default function InterviewPage() {
  const { user } = useUser()
  const [state, setState] = useState<InterviewState>({
    stage: 'setup'
  })
  const [position, setPosition] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')

  const difficultyOptions = [
    {
      value: 'easy',
      label: 'Easy',
      description: 'Basic questions suitable for entry-level positions',
      color: 'bg-green-500',
      questions: '5-7 questions'
    },
    {
      value: 'medium',
      label: 'Medium', 
      description: 'Intermediate questions for experienced professionals',
      color: 'bg-yellow-500',
      questions: '7-10 questions'
    },
    {
      value: 'hard',
      label: 'Hard',
      description: 'Advanced questions for senior-level positions',
      color: 'bg-red-500',
      questions: '10-12 questions'
    }
  ]

  const startInterview = async () => {
    if (!position.trim()) return
    
    setState(prev => ({ ...prev, stage: 'loading' }))
    
    try {
      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          position: position.trim(),
          difficulty: difficulty
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          stage: 'interview',
          currentQuestion: data.data.currentQuestion,
          sessionId: data.data.sessionId,
          totalQuestions: data.data.totalQuestions,
          position: position.trim(),
          difficulty: difficulty
        }))
      } else {
        console.error('Failed to start interview:', data.error)
        setState(prev => ({ ...prev, stage: 'setup' }))
      }
    } catch (error) {
      console.error('Error starting interview:', error)
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
      
      return await response.json()
    } catch (error) {
      console.error('Error submitting answer:', error)
      return { success: false, error: 'Failed to submit answer' }
    }
  }

  const handleComplete = () => {
    setState(prev => ({ ...prev, stage: 'completed' }))
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white rounded-xl shadow-sm border p-8">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Please sign in to start your interview</h1>
          <p className="text-gray-600">You need to be signed in to access the AI interview platform</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto p-4">
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
          <div className="bg-white rounded-xl shadow-sm border p-8 max-w-2xl mx-auto mt-8 text-center">
            <div className="flex items-center justify-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-lg">Setting up your AI interview...</span>
            </div>
            <p className="text-gray-600 mt-4">
              Preparing {state.difficulty} level questions for {position}
            </p>
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
                  setState({ stage: 'setup' })
                  setPosition('')
                  setDifficulty('medium')
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
  )
}