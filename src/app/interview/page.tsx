'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

interface InterviewState {
  stage: 'setup' | 'interview' | 'completed' | 'loading'
  position?: string
  currentQuestion?: {
    id: string
    question: string
    category: string
    difficulty: string
  }
  answers: string[]
}

export default function InterviewPage() {
  const { user } = useUser()
  const [state, setState] = useState<InterviewState>({
    stage: 'setup',
    answers: []
  })
  const [position, setPosition] = useState('')
  const [currentAnswer, setCurrentAnswer] = useState('')

  const startInterview = async () => {
    if (!position.trim()) return
    
    setState(prev => ({ ...prev, stage: 'loading' }))
    
    try {
      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: position.trim() })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          stage: 'interview',
          currentQuestion: data.data.currentQuestion,
          position: position.trim()
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

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) return
    
    try {
      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'temp-session',
          answer: currentAnswer.trim()
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          answers: [...prev.answers, currentAnswer],
          currentQuestion: data.data.currentQuestion,
          stage: data.data.nextAction === 'completed' ? 'completed' : 'interview'
        }))
        setCurrentAnswer('')
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to start your interview</h1>
          <p className="text-gray-600">You need to be signed in to access the interview platform</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {state.stage === 'setup' && (
          <div className="bg-white rounded-lg shadow-sm border p-6 max-w-2xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Start Your Interview</h1>
              <p className="text-gray-600">Configure your interview session below</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                <input
                  type="text"
                  placeholder="e.g., Software Engineer, Product Manager, Data Scientist"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button
                onClick={startInterview}
                disabled={!position.trim()}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Start Interview
              </button>
            </div>
          </div>
        )}

        {state.stage === 'loading' && (
          <div className="bg-white rounded-lg shadow-sm border p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Setting up your interview...</span>
            </div>
          </div>
        )}

        {state.stage === 'interview' && state.currentQuestion && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {state.currentQuestion.category} • {state.currentQuestion.difficulty}
                </span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {state.currentQuestion.question}
              </h2>
              
              <div className="space-y-4">
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                
                <button
                  onClick={submitAnswer}
                  disabled={!currentAnswer.trim()}
                  className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Submit Answer
                </button>
              </div>
            </div>
          </div>
        )}

        {state.stage === 'completed' && (
          <div className="bg-white rounded-lg shadow-sm border p-6 max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-green-600 mb-4">Interview Completed!</h1>
            <p className="text-gray-600 mb-6">Thank you for completing the interview. Your responses have been recorded.</p>
            <button
              onClick={() => {
                setState({ stage: 'setup', answers: [] })
                setPosition('')
                setCurrentAnswer('')
              }}
              className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
            >
              Start New Interview
            </button>
          </div>
        )}
      </div>
    </div>
  )
}