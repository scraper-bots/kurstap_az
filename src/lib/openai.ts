import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Check if API key is configured
if (!process.env.OPENAI_API_KEY) {
  console.warn('OpenAI API key not found in environment variables')
}

export interface GeneratedQuestion {
  question: string
  followUp: string
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

export class OpenAIService {
  /**
   * Generate mock questions for testing
   */
  static generateMockQuestions(jobTitle: string): QuestionSet {
    return {
      jobTitle,
      behavioral: [
        {
          question: `Tell me about a time when you overcame a significant challenge in your role as a ${jobTitle}.`,
          followUp: "What would you do differently if you faced a similar situation again?",
          difficulty: "medium" as const,
          category: "behavioral" as const,
          expectedDuration: 4
        },
        {
          question: `Describe a situation where you had to work with a difficult team member on a ${jobTitle} project.`,
          followUp: "How did you ensure the project's success despite the interpersonal challenges?",
          difficulty: "medium" as const,
          category: "behavioral" as const,
          expectedDuration: 3
        },
        {
          question: `Give me an example of when you had to learn something new quickly for your ${jobTitle} position.`,
          followUp: "What resources did you use to accelerate your learning process?",
          difficulty: "easy" as const,
          category: "behavioral" as const,
          expectedDuration: 3
        },
        {
          question: `Tell me about a time when you took initiative beyond your regular ${jobTitle} responsibilities.`,
          followUp: "What was the impact of your initiative on the team or project?",
          difficulty: "hard" as const,
          category: "behavioral" as const,
          expectedDuration: 4
        }
      ],
      technical: [
        {
          question: `What are the key technical skills required for a ${jobTitle} and how do you stay current with them?`,
          followUp: "Can you give me an example of how you've recently applied one of these skills?",
          difficulty: "medium" as const,
          category: "technical" as const,
          expectedDuration: 5
        },
        {
          question: `Walk me through your approach to problem-solving as a ${jobTitle}.`,
          followUp: "What tools or methodologies do you typically use in this process?",
          difficulty: "medium" as const,
          category: "technical" as const,
          expectedDuration: 6
        },
        {
          question: `Describe a complex project you worked on as a ${jobTitle}. What made it challenging?`,
          followUp: "How did you break down the complexity to make it manageable?",
          difficulty: "hard" as const,
          category: "technical" as const,
          expectedDuration: 7
        },
        {
          question: `What development/work practices do you follow as a ${jobTitle}?`,
          followUp: "How do these practices improve your productivity and code/work quality?",
          difficulty: "easy" as const,
          category: "technical" as const,
          expectedDuration: 4
        },
        {
          question: `How do you ensure quality in your work as a ${jobTitle}?`,
          followUp: "What metrics or indicators do you use to measure quality?",
          difficulty: "hard" as const,
          category: "technical" as const,
          expectedDuration: 5
        }
      ],
      situational: [
        {
          question: `If you were assigned a ${jobTitle} project with an unrealistic deadline, how would you handle it?`,
          followUp: "How would you communicate the timeline concerns to stakeholders?",
          difficulty: "medium" as const,
          category: "situational" as const,
          expectedDuration: 4
        },
        {
          question: `How would you handle a situation where a client/stakeholder keeps changing requirements for your ${jobTitle} work?`,
          followUp: "What processes would you put in place to manage scope creep?",
          difficulty: "hard" as const,
          category: "situational" as const,
          expectedDuration: 5
        },
        {
          question: `If you discovered a critical bug/issue in production as a ${jobTitle}, what would be your immediate steps?`,
          followUp: "How would you prevent similar issues from occurring in the future?",
          difficulty: "medium" as const,
          category: "situational" as const,
          expectedDuration: 4
        }
      ]
    }
  }

  /**
   * Generate job-specific interview questions
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
      "followUp": "What would you do differently?",
      "difficulty": "medium",
      "category": "behavioral",
      "expectedDuration": 3
    }
  ],
  "technical": [
    {
      "question": "Explain how you would...",
      "followUp": "What are the trade-offs?",
      "difficulty": "hard",
      "category": "technical",
      "expectedDuration": 5
    }
  ],
  "situational": [
    {
      "question": "How would you handle...",
      "followUp": "What if constraints changed?",
      "difficulty": "medium",
      "category": "situational",
      "expectedDuration": 4
    }
  ]
}

Requirements:
- 4 behavioral questions (focus on leadership, teamwork, problem-solving, communication)
- 5 technical questions (relevant to ${jobTitle} - tools, processes, best practices)
- 3 situational questions (realistic workplace scenarios for ${jobTitle})
- Mix difficulty levels: 30% easy, 50% medium, 20% hard
- Each question should have a meaningful follow-up
- Expected duration should be realistic (2-8 minutes per question)
- Questions should be specific to ${jobTitle} responsibilities

Make questions realistic and commonly asked in ${jobTitle} interviews.`

    try {
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
    } catch (error) {
      console.error('Error generating questions with OpenAI:', error)
      // Re-throw the error to be handled by the caller
      throw error
    }
  }

  /**
   * Generate embeddings for questions (for vector storage)
   */
  static async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texts,
      })

      return response.data.map(item => item.embedding)
    } catch (error) {
      console.error('Error generating embeddings:', error)
      throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Score an interview answer
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