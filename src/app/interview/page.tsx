'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, Play, Send, CheckCircle, Clock, User, Target } from 'lucide-react'

interface InterviewState {
  sessionId?: string
  interviewId?: string
  position?: string
  stage: 'setup' | 'interview' | 'completed' | 'loading'
  currentQuestion?: {
    id: string
    question: string
    category: string
    difficulty: string
    expectedDuration: number
  }
  followUpQuestion?: string
  progress?: {
    current: number
    total: number
  }
  overallScore?: number
  answers: any[]
  lastScore?: {
    technicalAccuracy: number
    communicationClarity: number
    problemSolvingApproach: number
    overallScore: number
    feedback: string
  }
}

export default function InterviewPage() {
  const { user } = useUser()
  const [state, setState] = useState<InterviewState>({
    stage: 'setup',
    answers: []
  })
  const [position, setPosition] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed')
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const startInterview = async () => {
    if (!position.trim()) return

    setState(prev => ({ ...prev, stage: 'loading' }))

    try {
      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: position.trim(), difficulty })
      })

      const data = await response.json()

      if (data.success) {
        setState(prev => ({
          ...prev,
          stage: 'interview',
          sessionId: data.data.sessionId,
          interviewId: data.data.interviewId,
          position: data.data.position,
          currentQuestion: data.data.currentQuestion,
          progress: data.data.progress
        }))
      } else {
        throw new Error(data.error || 'Failed to start interview')
      }
    } catch (error) {
      console.error('Error starting interview:', error)
      alert('Failed to start interview. Please try again.')
      setState(prev => ({ ...prev, stage: 'setup' }))
    }
  }

  const submitAnswer = async () => {
    if (!currentAnswer.trim() || !state.sessionId || isSubmitting) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          answer: currentAnswer.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        const { nextAction, currentQuestion, followUpQuestion, score, progress, overallScore } = data.data

        setState(prev => ({
          ...prev,
          currentQuestion,
          followUpQuestion,
          progress,
          lastScore: score,
          overallScore,
          stage: nextAction === 'completed' ? 'completed' : 'interview'
        }))

        setCurrentAnswer('')
      } else {
        throw new Error(data.error || 'Failed to submit answer')
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
      alert('Failed to submit answer. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetInterview = () => {
    setState({
      stage: 'setup',
      answers: []
    })
    setPosition('')
    setCurrentAnswer('')
  }

  if (!user) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p>Please sign in to access the interview practice.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Interview Practice</h1>
        <p className="text-gray-600">Practice realistic interviews with AI-powered feedback</p>
      </div>

      {/* Setup Stage */}
      {state.stage === 'setup' && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Start Your Interview
            </CardTitle>
            <CardDescription>
              Configure your interview session below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Position</label>
              <Input
                type="text"
                placeholder="e.g., Software Engineer, Product Manager, Data Scientist"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty Level</label>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard', 'mixed'] as const).map((level) => (
                  <Button
                    key={level}
                    variant={difficulty === level ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDifficulty(level)}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={startInterview}
              disabled={!position.trim()}
              className="w-full"
              size="lg"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Interview
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading Stage */}
      {state.stage === 'loading' && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-8">
            <div className="flex items-center justify-center space-x-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Setting up your interview...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interview Stage */}
      {state.stage === 'interview' && (
        <div className="space-y-6">
          {/* Progress Header */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{state.position}</span>
                  </div>
                  <Badge variant="secondary">
                    Question {state.progress?.current} of {state.progress?.total}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  Session ID: {state.sessionId?.slice(-8)}
                </div>
              </div>
              <Progress 
                value={((state.progress?.current || 1) / (state.progress?.total || 1)) * 100} 
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Current Question */}
          {state.currentQuestion && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {state.followUpQuestion ? 'Follow-up Question' : 'Interview Question'}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {state.currentQuestion.category}
                    </Badge>
                    <Badge variant={
                      state.currentQuestion.difficulty === 'hard' ? 'destructive' :
                      state.currentQuestion.difficulty === 'medium' ? 'default' : 'secondary'
                    }>
                      {state.currentQuestion.difficulty}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {state.currentQuestion.expectedDuration} min
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-lg mb-6">
                  {state.followUpQuestion || state.currentQuestion.question}
                </p>
                
                <div className="space-y-4">
                  <Textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="min-h-32"
                    disabled={isSubmitting}
                  />
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {currentAnswer.length} characters
                    </div>
                    <Button
                      onClick={submitAnswer}
                      disabled={!currentAnswer.trim() || isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Submit Answer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Last Score Feedback */}
          {state.lastScore && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Answer Scored
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {state.lastScore.technicalAccuracy}
                    </div>
                    <div className="text-xs text-gray-600">Technical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {state.lastScore.communicationClarity}
                    </div>
                    <div className="text-xs text-gray-600">Communication</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {state.lastScore.problemSolvingApproach}
                    </div>
                    <div className="text-xs text-gray-600">Problem Solving</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {state.lastScore.overallScore}
                    </div>
                    <div className="text-xs text-gray-600">Overall</div>
                  </div>
                </div>
                <p className="text-sm text-green-700 bg-green-100 p-3 rounded">
                  {state.lastScore.feedback}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Completion Stage */}
      {state.stage === 'completed' && (
        <div className="space-y-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-blue-800 flex items-center justify-center gap-2">
                <CheckCircle className="h-6 w-6" />
                Interview Completed!
              </CardTitle>
              <CardDescription className="text-lg">
                Great job completing your {state.position} interview practice
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="text-6xl font-bold text-blue-600">
                {state.overallScore || 0}
              </div>
              <div className="text-sm text-gray-600">Overall Score</div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-lg font-semibold">{state.progress?.total || 0}</div>
                  <div className="text-sm text-gray-600">Questions Answered</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{state.position}</div>
                  <div className="text-sm text-gray-600">Position</div>
                </div>
              </div>

              <div className="flex gap-4 justify-center mt-6">
                <Button onClick={resetInterview} variant="outline">
                  Practice Again
                </Button>
                <Button onClick={() => window.location.href = '/dashboard'}>
                  View Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}