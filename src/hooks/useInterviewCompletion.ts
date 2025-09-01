'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface InterviewAnswer {
  questionId: number
  question: string
  userAnswer: string
  category: string
  responseTime?: number
}

interface InterviewCompletionData {
  title: string
  company?: string
  position: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  duration: number
  answers: InterviewAnswer[]
}

export function useInterviewCompletion() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const completeInterview = async (data: InterviewCompletionData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Calculate scores and analysis for each answer
      const processedAnswers = data.answers.map((answer, index) => {
        // Simple scoring algorithm - in production, this would be more sophisticated
        const score = calculateAnswerScore(answer.userAnswer, answer.category)
        const { strengths, weaknesses } = analyzeAnswer(answer.userAnswer, answer.category)

        return {
          questionId: index + 1,
          question: answer.question,
          userAnswer: answer.userAnswer,
          idealAnswer: getIdealAnswer(answer.category),
          score,
          strengths,
          weaknesses,
          category: answer.category,
          responseTime: answer.responseTime || 30,
          confidence: Math.min(100, score + Math.random() * 20)
        }
      })

      // Calculate overall score
      const overallScore = processedAnswers.reduce((sum, a) => sum + a.score, 0) / processedAnswers.length

      const interviewData = {
        title: data.title,
        company: data.company || 'Practice Session',
        position: data.position,
        difficulty: data.difficulty,
        duration: data.duration,
        score: Math.round(overallScore)
      }

      const response = await fetch('/api/interviews/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewData,
          answers: processedAnswers
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save interview data')
      }

      const result = await response.json()
      
      // Redirect to the interview detail page
      router.push(`/interviews/${result.interviewId}`)
      
      return result
    } catch (err) {
      console.error('Error completing interview:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    completeInterview,
    isSubmitting,
    error
  }
}

// Helper functions for scoring and analysis
function calculateAnswerScore(answer: string, category: string): number {
  // Simple scoring based on answer length and content
  const baseScore = Math.min(100, answer.length * 0.5)
  
  // Category-specific adjustments
  const categoryMultiplier = {
    'Technical': 1.1,
    'Behavioral': 1.0,
    'System Design': 1.2,
    'Coding': 1.15
  }[category] || 1.0

  return Math.min(100, Math.max(30, baseScore * categoryMultiplier + Math.random() * 20))
}

function analyzeAnswer(answer: string, category: string): { strengths: string[], weaknesses: string[] } {
  const strengths: string[] = []
  const weaknesses: string[] = []

  // Simple keyword-based analysis
  if (answer.length > 200) {
    strengths.push('Comprehensive response')
  } else {
    weaknesses.push('Could provide more details')
  }

  if (answer.includes('example') || answer.includes('experience')) {
    strengths.push('Used specific examples')
  }

  if (category === 'Technical' && (answer.includes('scalable') || answer.includes('performance'))) {
    strengths.push('Considered scalability and performance')
  }

  if (category === 'System Design' && answer.includes('database')) {
    strengths.push('Addressed data storage considerations')
  } else if (category === 'System Design') {
    weaknesses.push('Could discuss data storage in more detail')
  }

  // Ensure we always have at least one strength and weakness
  if (strengths.length === 0) {
    strengths.push('Clear communication')
  }
  if (weaknesses.length === 0) {
    weaknesses.push('Could expand on technical details')
  }

  return { strengths: strengths.slice(0, 3), weaknesses: weaknesses.slice(0, 3) }
}

function getIdealAnswer(category: string): string {
  const idealAnswers = {
    'Technical': 'A strong technical answer should demonstrate deep understanding of concepts, mention specific technologies, discuss trade-offs, and provide concrete examples from experience.',
    'Behavioral': 'An effective behavioral response should follow the STAR method (Situation, Task, Action, Result), provide specific examples, and demonstrate relevant skills and growth mindset.',
    'System Design': 'A comprehensive system design answer should cover scalability, reliability, data storage, API design, monitoring, and trade-offs between different architectural choices.',
    'Coding': 'A good coding response should include algorithm explanation, time/space complexity analysis, edge case consideration, and clean, readable implementation.'
  }

  return idealAnswers[category as keyof typeof idealAnswers] || 'A strong answer should be specific, detailed, and demonstrate relevant knowledge and experience.'
}