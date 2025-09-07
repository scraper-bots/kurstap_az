import { InterviewMode, Difficulty } from '@prisma/client'
import { OpenAIService } from './openai'

export interface InterviewModeConfig {
  mode: InterviewMode
  name: string
  description: string
  questionCount: number
  estimatedDuration: number // in minutes
  difficulty: Difficulty[]
  categories: string[]
  price: number // in credits
}

export interface QuestionWithMetadata {
  id: string
  question: string
  category: string
  difficulty: Difficulty
  expectedDuration: number // in seconds
  keywords: string[]
  evaluationCriteria: string[]
}

export class InterviewModesService {
  // Predefined interview modes with their configurations
  static readonly MODES: Record<InterviewMode, InterviewModeConfig> = {
    QUICK_ASSESSMENT: {
      mode: 'QUICK_ASSESSMENT',
      name: 'Quick Assessment',
      description: 'Fast evaluation with 3 core questions in 5 minutes',
      questionCount: 3,
      estimatedDuration: 5,
      difficulty: ['EASY', 'MEDIUM'],
      categories: ['General', 'Behavioral'],
      price: 1
    },
    STANDARD: {
      mode: 'STANDARD',
      name: 'Standard Interview',
      description: 'Balanced interview with 5 questions covering key areas',
      questionCount: 5,
      estimatedDuration: 15,
      difficulty: ['EASY', 'MEDIUM'],
      categories: ['Behavioral', 'Technical', 'Problem Solving'],
      price: 2
    },
    COMPREHENSIVE: {
      mode: 'COMPREHENSIVE',
      name: 'Comprehensive Review',
      description: 'In-depth assessment with 8 questions across multiple domains',
      questionCount: 8,
      estimatedDuration: 25,
      difficulty: ['MEDIUM', 'HARD'],
      categories: ['Behavioral', 'Technical', 'Problem Solving', 'Leadership'],
      price: 3
    },
    TECHNICAL_DEEP: {
      mode: 'TECHNICAL_DEEP',
      name: 'Technical Deep Dive',
      description: 'Advanced technical assessment with 10 challenging questions',
      questionCount: 10,
      estimatedDuration: 35,
      difficulty: ['HARD'],
      categories: ['Technical', 'System Design', 'Problem Solving', 'Algorithms'],
      price: 4
    },
    BEHAVIORAL_FOCUS: {
      mode: 'BEHAVIORAL_FOCUS',
      name: 'Behavioral Focus',
      description: 'Leadership and behavioral assessment with 6 targeted questions',
      questionCount: 6,
      estimatedDuration: 20,
      difficulty: ['MEDIUM'],
      categories: ['Behavioral', 'Leadership', 'Communication', 'Teamwork'],
      price: 2
    },
    MIXED_CHALLENGE: {
      mode: 'MIXED_CHALLENGE',
      name: 'Mixed Challenge',
      description: 'Ultimate test with 12 questions across all difficulties and categories',
      questionCount: 12,
      estimatedDuration: 45,
      difficulty: ['EASY', 'MEDIUM', 'HARD'],
      categories: ['Behavioral', 'Technical', 'Problem Solving', 'Leadership', 'System Design'],
      price: 5
    }
  }

  /**
   * Get configuration for a specific interview mode
   */
  static getModeConfig(mode: InterviewMode): InterviewModeConfig {
    return this.MODES[mode]
  }

  /**
   * Get all available interview modes
   */
  static getAllModes(): InterviewModeConfig[] {
    return Object.values(this.MODES)
  }

  /**
   * Generate questions for a specific interview mode
   */
  static async generateQuestionsForMode(
    mode: InterviewMode, 
    position: string, 
    company?: string
  ): Promise<QuestionWithMetadata[]> {
    const config = this.getModeConfig(mode)
    
    const prompt = `Generate exactly ${config.questionCount} interview questions for a ${position} position${company ? ` at ${company}` : ''}.

Interview Mode: ${config.name}
Categories to cover: ${config.categories.join(', ')}
Difficulty levels: ${config.difficulty?.join(', ') || 'Mixed'}
Total estimated time: ${config.estimatedDuration} minutes

Requirements:
1. Each question should be relevant to the position and categories
2. Include a mix of question types: behavioral (STAR method), technical, problem-solving
3. Questions should be progressively challenging based on the difficulty levels
4. Provide detailed metadata for each question

For each question, provide:
- The actual question text
- Category (one of: ${config.categories.join(', ')})
- Difficulty level (EASY, MEDIUM, or HARD)
- Expected response duration in seconds (60-180 seconds per question)
- 3-5 relevant keywords/topics
- 3-4 evaluation criteria for scoring

Return as a JSON array with this exact structure:
[
  {
    "question": "Tell me about a time when you had to overcome a significant challenge at work.",
    "category": "Behavioral", 
    "difficulty": "MEDIUM",
    "expectedDuration": 120,
    "keywords": ["challenge", "problem-solving", "resilience", "teamwork"],
    "evaluationCriteria": [
      "Clear problem identification",
      "Structured approach to solution", 
      "Result measurement",
      "Learning and growth"
    ]
  }
]`

    try {
      const response = await OpenAIService.generateQuestions(prompt)
      // Response is already a parsed QuestionSet object, not a string
      const questions = Array.isArray(response) ? response : response.behavioral || response.technical || []
      
      // Add unique IDs to each question
      return questions.map((q: any, index: number) => ({
        ...q,
        id: `${mode}_${position}_${index + 1}`,
        // Ensure difficulty is valid
        difficulty: this.validateDifficulty(q.difficulty, config.difficulty)
      }))
    } catch (error) {
      console.error('Error generating questions for mode:', error)
      throw new Error('Failed to generate interview questions')
    }
  }

  /**
   * Validate and normalize difficulty level
   */
  private static validateDifficulty(
    requestedDifficulty: string, 
    allowedDifficulties: Difficulty[]
  ): Difficulty {
    const normalized = requestedDifficulty.toUpperCase() as Difficulty
    if (allowedDifficulties.includes(normalized)) {
      return normalized
    }
    // Default to first allowed difficulty if invalid
    return allowedDifficulties[0]
  }

  /**
   * Calculate interview cost based on mode
   */
  static getInterviewCost(mode: InterviewMode): number {
    return this.getModeConfig(mode).price
  }

  /**
   * Get recommended mode based on user preferences
   */
  static getRecommendedMode(
    availableTime: number, // in minutes
    experience: 'junior' | 'mid' | 'senior',
    focus: 'technical' | 'behavioral' | 'mixed'
  ): InterviewMode {
    // Quick assessment for very limited time
    if (availableTime <= 10) {
      return 'QUICK_ASSESSMENT'
    }
    
    // Technical focus recommendations
    if (focus === 'technical') {
      return experience === 'senior' ? 'TECHNICAL_DEEP' : 'COMPREHENSIVE'
    }
    
    // Behavioral focus
    if (focus === 'behavioral') {
      return 'BEHAVIORAL_FOCUS'
    }
    
    // Mixed recommendations based on time and experience
    if (availableTime >= 40 && experience === 'senior') {
      return 'MIXED_CHALLENGE'
    }
    
    if (availableTime >= 25) {
      return 'COMPREHENSIVE'
    }
    
    return 'STANDARD'
  }

  /**
   * Validate if user has sufficient credits for interview mode
   */
  static validateUserCredits(userCredits: number, mode: InterviewMode): boolean {
    const cost = this.getInterviewCost(mode)
    return userCredits >= cost
  }
}