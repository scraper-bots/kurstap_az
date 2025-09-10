'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'

interface AudioInterviewProps {
  sessionId: string
  initialQuestion: {
    id: string
    question: string
    category: string
    difficulty: string
    expectedDuration: number
  }
  totalQuestions: number
  onAnswer: (answer: string) => Promise<unknown>
  onComplete: () => void
}

export function AudioInterview({
  sessionId,
  initialQuestion,
  totalQuestions,
  onComplete
}: AudioInterviewProps) {
  const [isAnswering, setIsAnswering] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion)
  const [progress, setProgress] = useState(1)
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false)

  // Handle Answer button click
  const handleAnswerClick = () => {
    setIsAnswering(true)
  }

  // Handle Finish button click  
  const handleFinishClick = async () => {
    if (!currentAnswer.trim()) {
      alert('Please enter an answer before finishing.')
      return
    }

    setIsProcessingAnswer(true)
    
    try {
      // Submit answer to API
      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          answer: currentAnswer.trim(),
          skipQuestion: false
        })
      })

      const result = await response.json()

      if (result.success) {
        if (result.data?.nextAction === 'completed') {
          setTimeout(() => {
            onComplete()
          }, 1000)
        } else if (result.data?.currentQuestion) {
          // Move to next question
          setCurrentQuestion(result.data.currentQuestion)
          setProgress(result.data.progress?.current || progress + 1)
          setCurrentAnswer('')
          setIsAnswering(false)
        }
      } else {
        alert(result.error || 'Failed to submit answer')
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
      alert('Failed to submit answer. Please try again.')
    } finally {
      setIsProcessingAnswer(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Progress */}
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Interview Progress</h2>
          <Progress value={(progress / totalQuestions) * 100} className="w-full" />
          <p className="text-sm text-gray-600 mt-2">
            Question {progress} of {totalQuestions}
          </p>
        </div>
      </Card>

      {/* Current Question */}
      {currentQuestion && (
        <Card className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800">Question {progress}:</h3>
            <p className="text-blue-700 mt-2 text-lg">{currentQuestion.question}</p>
            <span className="inline-block bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded mt-2">
              {currentQuestion.category} • {currentQuestion.difficulty}
            </span>
          </div>

          {/* Answer Input */}
          {isAnswering && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Your Answer:
              </label>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isProcessingAnswer}
              />
            </div>
          )}

          {/* Processing State */}
          {isProcessingAnswer && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800">Processing your answer...</p>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-4 justify-center mt-6">
            {!isAnswering ? (
              <Button
                onClick={handleAnswerClick}
                disabled={isProcessingAnswer}
                className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3"
              >
                Answer
              </Button>
            ) : (
              <Button
                onClick={handleFinishClick}
                disabled={isProcessingAnswer || !currentAnswer.trim()}
                className="bg-green-600 text-white hover:bg-green-700 px-8 py-3"
              >
                Finish
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-6">
        <h3 className="font-semibold mb-3">How it works:</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• Click <strong>&quot;Answer&quot;</strong> to start answering the current question</li>
          <li>• Type your response in the text area</li>
          <li>• Click <strong>&quot;Finish&quot;</strong> to submit your answer and move to the next question</li>
          <li>• Answer all questions to complete the interview</li>
        </ul>
      </Card>
    </div>
  )
}