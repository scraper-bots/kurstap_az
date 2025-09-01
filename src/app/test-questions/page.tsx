'use client'

import { useState } from 'react'

interface QuestionData {
  success: boolean
  data?: {
    jobTitle: string
    questions: {
      behavioral: any[]
      technical: any[]
      situational: any[]
    }
    totalQuestions: number
    stored: boolean
  }
  error?: string
}

export default function TestQuestionsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QuestionData | null>(null)
  const [jobTitle, setJobTitle] = useState('Software Engineer')

  const generateQuestions = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log('Sending request to /api/generate-questions...')
      
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle: jobTitle,
          regenerate: false,
          difficulty: 'mixed'
        })
      })
      
      console.log('Response status:', response.status)
      
      const data = await response.json()
      console.log('Response data:', data)
      
      setResult(data)
    } catch (error) {
      console.error('Error:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const getQuestions = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch(`/api/generate-questions?jobTitle=${encodeURIComponent(jobTitle)}&limit=20`)
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Question Generation System Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Job Title:</label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Enter job title..."
          />
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={generateQuestions}
            disabled={loading || !jobTitle.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate New Questions'}
          </button>
          
          <button
            onClick={getQuestions}
            disabled={loading || !jobTitle.trim()}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Get Existing Questions'}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          
          {result.success ? (
            <div>
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 font-medium">✅ Success!</p>
                <p className="text-sm text-green-600 mt-1">
                  Generated {result.data?.totalQuestions} questions for "{result.data?.jobTitle}"
                </p>
                <p className="text-sm text-green-600">
                  Questions generated on-demand
                </p>
              </div>

              {result.data?.questions && (
                <div className="space-y-6">
                  {/* Behavioral Questions */}
                  {result.data.questions.behavioral.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-blue-600">
                        Behavioral Questions ({result.data.questions.behavioral.length})
                      </h3>
                      <div className="space-y-3">
                        {result.data.questions.behavioral.map((q: any, idx: number) => (
                          <div key={idx} className="border-l-4 border-blue-400 pl-4 py-2 bg-blue-50">
                            <p className="font-medium">{q.question}</p>
                            <p className="text-sm text-gray-600 mt-1">Follow-up: {q.followUp}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              Difficulty: {q.difficulty} | Duration: {q.expectedDuration} min
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Technical Questions */}
                  {result.data.questions.technical.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-purple-600">
                        Technical Questions ({result.data.questions.technical.length})
                      </h3>
                      <div className="space-y-3">
                        {result.data.questions.technical.map((q: any, idx: number) => (
                          <div key={idx} className="border-l-4 border-purple-400 pl-4 py-2 bg-purple-50">
                            <p className="font-medium">{q.question}</p>
                            <p className="text-sm text-gray-600 mt-1">Follow-up: {q.followUp}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              Difficulty: {q.difficulty} | Duration: {q.expectedDuration} min
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Situational Questions */}
                  {result.data.questions.situational.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-orange-600">
                        Situational Questions ({result.data.questions.situational.length})
                      </h3>
                      <div className="space-y-3">
                        {result.data.questions.situational.map((q: any, idx: number) => (
                          <div key={idx} className="border-l-4 border-orange-400 pl-4 py-2 bg-orange-50">
                            <p className="font-medium">{q.question}</p>
                            <p className="text-sm text-gray-600 mt-1">Follow-up: {q.followUp}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              Difficulty: {q.difficulty} | Duration: {q.expectedDuration} min
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 font-medium">❌ Error</p>
              <p className="text-sm text-red-600 mt-1">{result.error}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 text-sm text-gray-500">
        <p>This page tests the question generation API endpoint.</p>
        <p>Make sure you're signed in with Clerk authentication.</p>
      </div>
    </div>
  )
}