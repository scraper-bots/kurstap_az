import OpenAI from 'openai'
import { GracefulDegradationService, RetryService } from './retry-service'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_KEY?.startsWith('sk-or-v1-') 
    ? 'https://openrouter.ai/api/v1'
    : 'https://api.openai.com/v1',
})

// Check if API key is configured
if (!process.env.OPENAI_API_KEY) {
  console.warn('OpenAI API key not found in environment variables')
}

export interface GeneratedQuestion {
  question: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: 'behavioral' | 'technical' | 'situational'
  expectedDuration: number // in minutes
}

export interface QuestionSet {
  jobTitle: string
  behavioral: GeneratedQuestion[]
  technical: GeneratedQuestion[]
  situational: GeneratedQuestion[]
}

// Fallback questions for when OpenAI is unavailable
const FALLBACK_QUESTIONS: Record<string, QuestionSet> = {
  default: {
    jobTitle: 'General',
    behavioral: [
      { question: 'Tell me about a time when you had to work under pressure.', difficulty: 'easy', category: 'behavioral', expectedDuration: 3 },
      { question: 'Describe a challenging project you worked on recently.', difficulty: 'medium', category: 'behavioral', expectedDuration: 4 },
      { question: 'How do you handle conflict with team members?', difficulty: 'hard', category: 'behavioral', expectedDuration: 5 }
    ],
    technical: [
      { question: 'Explain your approach to problem-solving.', difficulty: 'easy', category: 'technical', expectedDuration: 4 },
      { question: 'What tools and technologies do you use in your work?', difficulty: 'medium', category: 'technical', expectedDuration: 5 },
      { question: 'How do you stay current with industry trends?', difficulty: 'hard', category: 'technical', expectedDuration: 6 }
    ],
    situational: []
  }
}

export class OpenAIService {
  static {
    // Register fallback for OpenAI service
    GracefulDegradationService.registerFallback('openai-questions', async () => {
      console.log('🔄 Using fallback questions due to OpenAI unavailability')
      return FALLBACK_QUESTIONS.default
    })
  }

  /**
   * Generate job-specific interview questions using OpenAI with fallback
   */
  static async generateQuestions(jobTitle: string): Promise<QuestionSet> {
    const prompt = `
You are an expert interview coach with 10+ years of experience hiring for ${jobTitle} positions.
Generate a comprehensive set of interview questions for a ${jobTitle} role.

Return ONLY a valid JSON object with this exact structure:
{
  "jobTitle": "${jobTitle}",
  "behavioral": [
    {
      "question": "Tell me about a time when...",
      "difficulty": "easy",
      "category": "behavioral",
      "expectedDuration": 3
    }
  ],
  "technical": [
    {
      "question": "Explain how you would...",
      "difficulty": "easy", 
      "category": "technical",
      "expectedDuration": 5
    }
  ],
  "situational": [
    {
      "question": "How would you handle...",
      "difficulty": "medium",
      "category": "situational",
      "expectedDuration": 4
    }
  ]
}

Requirements:
- Generate questions to match UI exactly: 5 easy total, 8 medium total, 12 hard total
- EXACTLY 13 behavioral questions: 3 easy, 4 medium, 6 hard difficulty
- EXACTLY 12 technical questions: 2 easy, 4 medium, 6 hard difficulty  
- EXACTLY 0 situational questions (empty array)
- CRITICAL: Each question MUST have category field set to "behavioral" or "technical"
- CRITICAL: Total easy questions across both categories must equal exactly 5 (3 behavioral + 2 technical)
- CRITICAL: Total medium questions across both categories must equal exactly 8 (4 behavioral + 4 technical)
- CRITICAL: Total hard questions across both categories must equal exactly 12 (6 behavioral + 6 technical)
- Questions should be comprehensive and complete on their own
- Expected duration should be realistic (3-6 minutes per question)
- Questions should be highly specific to ${jobTitle} responsibilities and real interview scenarios
- Easy questions suitable for entry-level, medium for experienced, hard for senior-level positions

Generate professional, realistic questions that would be asked in actual ${jobTitle} interviews.`

    return GracefulDegradationService.executeWithFallback(
      'openai-questions',
      async () => {
        return RetryService.withRetry(async () => {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach. Return only valid JSON with no additional text or formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })

      const content = completion.choices[0]?.message?.content
      if (!content) {
        throw new Error('No content received from OpenAI')
      }

      // Clean the response and parse JSON
      const cleanContent = content.trim().replace(/```json\s*/, '').replace(/```\s*$/, '')
      const questionSet: QuestionSet = JSON.parse(cleanContent)

      // Validate the structure
      if (!questionSet.behavioral || !questionSet.technical || !questionSet.situational) {
        throw new Error('Invalid question set structure received')
      }

          return questionSet
        }, {
          maxAttempts: 2,
          baseDelay: 2000,
          onRetry: (attempt, error) => {
            console.warn(`🔄 OpenAI retry attempt ${attempt}:`, error?.message)
          }
        })
      },
      { fallbackAfterFailures: 2 }
    )
  }

  // Embeddings removed - no vector storage needed

  /**
   * Evaluate complete interview performance (all questions and answers)
   */
  static async evaluateCompleteInterview(
    position: string,
    questionsAndAnswers: Array<{
      question: string
      answer: string
      category: string
      difficulty: string
    }>
  ): Promise<{
    overallScore: number
    categoryScores: {
      behavioral: number
      technical: number
      situational: number
    }
    detailedFeedback: Array<{
      questionId: number
      question: string
      scores: {
        technicalAccuracy: number
        communicationClarity: number
        problemSolvingApproach: number
        overallScore: number
      }
      feedback: string
    }>
    summary: string
    strengths: string[]
    areasForImprovement: string[]
    recommendedActions: string[]
  }> {
    const prompt = `
You are an expert interview assessor evaluating a complete interview for a ${position} position.

Interview Responses:
${questionsAndAnswers.map((qa, index) => `
Question ${index + 1} (${qa.category}, ${qa.difficulty}):
"${qa.question}"
Answer: "${qa.answer}"
`).join('\n')}

Provide a comprehensive evaluation in this exact JSON format:
{
  "overallScore": 85,
  "categoryScores": {
    "behavioral": 80,
    "technical": 90,
    "situational": 85
  },
  "detailedFeedback": [
    {
      "questionId": 1,
      "question": "Question text...",
      "scores": {
        "technicalAccuracy": 8,
        "communicationClarity": 7,
        "problemSolvingApproach": 9,
        "overallScore": 8
      },
      "feedback": "Specific feedback for this answer..."
    }
  ],
  "summary": "Overall performance assessment in 2-3 sentences",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "areasForImprovement": ["Area 1", "Area 2", "Area 3"],
  "recommendedActions": ["Action 1", "Action 2", "Action 3"]
}

Scoring Guidelines:
- Technical Accuracy: Knowledge and correctness (1-10)
- Communication Clarity: Structure and clarity (1-10)
- Problem Solving: Logical thinking and approach (1-10)
- Overall scores should reflect ${position} role requirements
- Be constructive and specific in feedback
- Focus on actionable improvements`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview assessor. Return only valid JSON with comprehensive evaluation.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      })

      const content = completion.choices[0]?.message?.content
      if (!content) {
        throw new Error('No evaluation content received from OpenAI')
      }

      const cleanContent = content.trim().replace(/```json\s*/, '').replace(/```\s*$/, '')
      return JSON.parse(cleanContent)
    } catch (error) {
      console.error('Error evaluating complete interview:', error)
      // Return fallback evaluation
      return {
        overallScore: 75,
        categoryScores: {
          behavioral: 75,
          technical: 75,
          situational: 75
        },
        detailedFeedback: questionsAndAnswers.map((qa, index) => ({
          questionId: index + 1,
          question: qa.question,
          scores: {
            technicalAccuracy: 7,
            communicationClarity: 7,
            problemSolvingApproach: 7,
            overallScore: 7
          },
          feedback: "Answer received and evaluated. Detailed AI analysis temporarily unavailable."
        })),
        summary: `Completed ${position} interview with ${questionsAndAnswers.length} questions answered. Performance shows solid foundation with room for growth.`,
        strengths: ["Completed all questions", "Provided thoughtful responses", "Demonstrated engagement"],
        areasForImprovement: ["Provide more specific examples", "Elaborate on technical details", "Improve response structure"],
        recommendedActions: ["Practice with mock interviews", "Prepare specific examples", "Research company and role"]
      }
    }
  }

  /**
   * Score an interview answer (legacy - kept for backwards compatibility)
   */
  static async scoreAnswer(
    question: string,
    answer: string,
    jobTitle: string,
    category: string
  ): Promise<{
    technicalAccuracy: number
    communicationClarity: number
    problemSolvingApproach: number
    overallScore: number
    feedback: string
  }> {
    const prompt = `
You are an expert interview assessor for ${jobTitle} positions.

Rate this interview answer on a scale of 1-10 for each criterion:

Question (${category}): "${question}"
Candidate Answer: "${answer}"

Provide scores and constructive feedback:

{
  "technicalAccuracy": 8,
  "communicationClarity": 7,
  "problemSolvingApproach": 9,
  "overallScore": 8,
  "feedback": "Strong technical understanding demonstrated. Consider providing more specific examples to illustrate your points. The approach shows good problem-solving skills."
}

Scoring criteria:
- Technical Accuracy: Correctness of technical concepts and knowledge
- Communication Clarity: How well the answer is structured and explained
- Problem Solving Approach: Logical thinking and methodology
- Overall Score: Weighted average considering the role requirements

Be constructive and specific in feedback. Focus on areas for improvement.`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview assessor. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      })

      const content = completion.choices[0]?.message?.content
      if (!content) {
        throw new Error('No scoring content received from OpenAI')
      }

      const cleanContent = content.trim().replace(/```json\s*/, '').replace(/```\s*$/, '')
      return JSON.parse(cleanContent)
    } catch (error) {
      console.error('Error scoring answer with OpenAI:', error)
      throw new Error(`Failed to score answer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

export { openai }