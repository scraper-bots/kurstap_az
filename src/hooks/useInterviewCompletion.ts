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
      // Validate input data
      if (!data.answers || !Array.isArray(data.answers)) {
        console.error('❌ Invalid answers data:', data.answers)
        throw new Error('No interview answers to process')
      }

      if (data.answers.length === 0) {
        console.error('❌ Empty answers array')
        throw new Error('No interview answers found to process')
      }

      console.log('📊 Processing interview completion with', data.answers.length, 'answers')

      // Calculate scores and analysis for each answer
      const processedAnswers = data.answers.map((answer, index) => {
        // Validate answer object
        if (!answer) {
          console.warn(`⚠️ Skipping null answer at index ${index}`)
          return null
        }

        // Provide defaults for missing properties
        const userAnswer = answer.userAnswer || ''
        const question = answer.question || `Question ${index + 1}`
        const category = answer.category || 'General'

        if (!userAnswer.trim()) {
          console.warn(`⚠️ Empty answer for question ${index + 1}:`, question)
          console.warn(`⚠️ Full answer object:`, answer)
        }

        // Simple scoring algorithm - in production, this would be more sophisticated
        const score = calculateAnswerScore(userAnswer, category)
        const { strengths, weaknesses } = analyzeAnswer(userAnswer, category)

        return {
          questionId: index + 1,
          question,
          userAnswer,
          idealAnswer: getIdealAnswer(category),
          score,
          strengths,
          weaknesses,
          category,
          responseTime: answer.responseTime || 30,
          confidence: Math.min(100, score + Math.random() * 20)
        }
      }).filter(Boolean) // Remove null entries

      // Calculate overall score, handling empty arrays
      const validAnswers = processedAnswers.filter(a => a !== null) as Array<{score: number}>
      const overallScore = validAnswers.length > 0 
        ? validAnswers.reduce((sum, a) => sum + a.score, 0) / validAnswers.length
        : 0

      // Final validation before API call
      if (validAnswers.length === 0) {
        console.error('❌ No valid answers to process')
        throw new Error('No valid interview answers found. Please try the interview again.')
      }

      const interviewData = {
        title: data.title || 'Interview Session',
        company: data.company || 'Practice Session',
        position: data.position || 'General Position',
        difficulty: data.difficulty || 'MEDIUM',
        duration: Math.max(1, data.duration || 1), // Minimum 1 minute
        score: Math.round(overallScore)
      }

      console.log('💾 Calling completion API with data:', {
        answers: validAnswers.length,
        position: interviewData.position,
        duration: interviewData.duration,
        score: interviewData.score
      })

      const response = await fetch('/api/interviews/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewData,
          answers: validAnswers
        })
      })

      console.log('📡 Completion API response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Completion API error:', errorText)
        throw new Error(`Failed to save interview data: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Completion API result:', result)
      
      if (!result.success || !result.interviewId) {
        console.error('❌ Invalid completion response:', result)
        throw new Error('Invalid response from completion API')
      }
      
      // Redirect to the interview detail page
      console.log('🔄 Redirecting to:', `/interviews/${result.interviewId}`)
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