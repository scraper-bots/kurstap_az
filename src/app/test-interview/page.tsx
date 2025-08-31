'use client'

import { useState } from 'react'

interface TestResult {
  endpoint: string
  status: number
  success: boolean
  data?: any
  error?: string
  duration?: number
}

export default function TestInterviewPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [testing, setTesting] = useState(false)
  const [sessionId, setSessionId] = useState('')

  const runTest = async (
    endpoint: string,
    method: 'GET' | 'POST',
    body?: any
  ): Promise<TestResult> => {
    const start = Date.now()
    
    try {
      const response = await fetch(endpoint, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        ...(body && { body: JSON.stringify(body) })
      })
      
      const data = await response.json()
      const duration = Date.now() - start
      
      return {
        endpoint,
        status: response.status,
        success: data.success || false,
        data: data.data,
        error: data.error,
        duration
      }
    } catch (error) {
      return {
        endpoint,
        status: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - start
      }
    }
  }

  const runFullInterviewTest = async () => {
    setTesting(true)
    setResults([])
    const testResults: TestResult[] = []

    // Test 1: Start Interview
    console.log('🚀 Starting interview...')
    const startResult = await runTest('/api/interview/start', 'POST', {
      position: 'Software Engineer',
      difficulty: 'mixed'
    })
    testResults.push(startResult)
    setResults([...testResults])

    if (startResult.success && startResult.data?.sessionId) {
      const testSessionId = startResult.data.sessionId
      setSessionId(testSessionId)

      // Test 2: Submit First Answer
      console.log('📝 Submitting first answer...')
      const firstAnswer = await runTest('/api/interview/answer', 'POST', {
        sessionId: testSessionId,
        answer: 'I have 5 years of experience in software development, primarily working with React, Node.js, and Python. I have led a team of 3 developers and successfully delivered multiple web applications with high performance and scalability.'
      })
      testResults.push(firstAnswer)
      setResults([...testResults])

      // Test 3: Submit Follow-up Answer
      if (firstAnswer.success) {
        console.log('🔄 Submitting follow-up answer...')
        const followUpAnswer = await runTest('/api/interview/answer', 'POST', {
          sessionId: testSessionId,
          answer: 'If I were to face a similar challenge again, I would invest more time in initial architecture planning and establish better communication channels between team members. I would also implement more frequent code reviews to catch potential issues early.'
        })
        testResults.push(followUpAnswer)
        setResults([...testResults])

        // Test 4: Get Session Status
        console.log('📊 Getting session status...')
        const sessionStatus = await runTest(
          `/api/interview/session?sessionId=${testSessionId}`, 
          'GET'
        )
        testResults.push(sessionStatus)
        setResults([...testResults])

        // Test 5: Continue with more answers until completion
        let questionCount = 2
        let completed = false
        
        while (questionCount < 6 && !completed) {
          console.log(`📝 Submitting answer ${questionCount + 1}...`)
          const nextAnswer = await runTest('/api/interview/answer', 'POST', {
            sessionId: testSessionId,
            answer: `This is my answer to question ${questionCount + 1}. I believe this demonstrates my ability to handle complex technical challenges and work effectively in a team environment. I always strive for continuous learning and improvement.`
          })
          testResults.push(nextAnswer)
          setResults([...testResults])

          if (nextAnswer.data?.nextAction === 'completed') {
            completed = true
            console.log('🎉 Interview completed!')
          } else if (nextAnswer.data?.nextAction === 'follow-up') {
            // Submit follow-up answer
            console.log('🔄 Submitting follow-up...')
            const followUp = await runTest('/api/interview/answer', 'POST', {
              sessionId: testSessionId,
              answer: `This is my follow-up response. I would approach this differently by leveraging better planning and team collaboration.`
            })
            testResults.push(followUp)
            setResults([...testResults])
            
            if (followUp.data?.nextAction === 'completed') {
              completed = true
              console.log('🎉 Interview completed!')
            }
          }
          
          questionCount++
        }

        // Test 6: Get Interview History
        console.log('📜 Getting interview history...')
        const history = await runTest('/api/interview/history?limit=5', 'GET')
        testResults.push(history)
        setResults([...testResults])
      }
    }

    setTesting(false)
    console.log('✅ All tests completed!')
  }

  const getStatusColor = (result: TestResult) => {
    if (result.status === 0) return 'bg-gray-100 border-gray-300'
    if (result.success) return 'bg-green-50 border-green-200'
    return 'bg-red-50 border-red-200'
  }

  const getStatusText = (result: TestResult) => {
    if (result.status === 0) return 'NETWORK ERROR'
    if (result.success) return 'SUCCESS'
    return 'FAILED'
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Interview System Test Suite</h1>
      
      <div className="mb-6">
        <button
          onClick={runFullInterviewTest}
          disabled={testing}
          className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testing ? (
            <span className="flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Running Tests...
            </span>
          ) : (
            'Run Full Interview Test'
          )}
        </button>
        
        {sessionId && (
          <div className="mt-2 text-sm text-gray-600">
            Session ID: <code className="bg-gray-100 px-2 py-1 rounded">{sessionId}</code>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${getStatusColor(result)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{result.endpoint}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {getStatusText(result)}
                </span>
                <span className="text-xs text-gray-500">
                  HTTP {result.status} • {result.duration}ms
                </span>
              </div>
            </div>
            
            {result.error && (
              <div className="text-red-600 text-sm mb-2">
                ❌ Error: {result.error}
              </div>
            )}
            
            {result.data && (
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                  View Response Data
                </summary>
                <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Test Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Tests:</span>
              <span className="font-medium ml-2">{results.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Successful:</span>
              <span className="font-medium ml-2 text-green-600">
                {results.filter(r => r.success).length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Failed:</span>
              <span className="font-medium ml-2 text-red-600">
                {results.filter(r => !r.success).length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}