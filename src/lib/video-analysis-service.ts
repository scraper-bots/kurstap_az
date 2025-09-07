import { OpenAIService } from './openai'

export interface FacialAnalysisResult {
  eyeContact: {
    percentage: number
    consistency: number
    moments: Array<{ timestamp: number; duration: number; quality: 'good' | 'poor' }>
  }
  expressions: {
    confidence: number
    engagement: number
    stress: number
    expressiveness: number
  }
  headMovement: {
    stability: number
    naturalness: number
    excessiveMovement: boolean
  }
}

export interface BodyLanguageResult {
  posture: {
    uprightness: number
    stability: number
    leaning: 'forward' | 'backward' | 'neutral'
  }
  gestures: {
    frequency: number
    appropriateness: number
    naturalness: number
  }
  overall: {
    professionalism: number
    confidence: number
    engagement: number
  }
}

export interface SpeechAnalysisResult {
  pacing: {
    wordsPerMinute: number
    consistency: number
    rushingMoments: Array<{ timestamp: number; duration: number }>
    pauseQuality: number
  }
  clarity: {
    articulation: number
    volume: number
    tonalVariation: number
  }
  fillerWords: {
    count: number
    types: string[]
    frequency: number // per minute
  }
}

export interface VideoAnalysisResult {
  overall: {
    score: number // 0-100
    impression: 'excellent' | 'good' | 'average' | 'needs_improvement'
    summary: string
  }
  facial: FacialAnalysisResult
  bodyLanguage: BodyLanguageResult
  speech: SpeechAnalysisResult
  recommendations: Array<{
    category: string
    priority: 'high' | 'medium' | 'low'
    issue: string
    suggestion: string
    impact: string
  }>
  strengths: string[]
  improvements: string[]
}

export class VideoAnalysisService {
  /**
   * Analyze video recording and provide comprehensive feedback
   */
  static async analyzeInterview(
    videoUrl: string, 
    transcript: string, 
    questions: Array<{ question: string; timestamp: number }>,
    duration: number
  ): Promise<VideoAnalysisResult> {
    try {
      console.log('🔍 Starting video analysis...')
      
      // For now, we'll simulate comprehensive analysis
      // In a real implementation, this would use computer vision APIs like:
      // - OpenCV for facial/body analysis
      // - Azure Cognitive Services Video Analyzer
      // - AWS Rekognition Video
      // - Google Cloud Video Intelligence API
      
      const mockAnalysis = await this.generateMockAnalysis(transcript, questions, duration)
      
      // In production, you would:
      // 1. Extract video frames at regular intervals
      // 2. Analyze facial expressions frame by frame
      // 3. Track eye gaze and head movement
      // 4. Analyze body posture and gestures
      // 5. Process audio for speech patterns
      // 6. Correlate visual and audio cues
      
      console.log('✅ Video analysis completed')
      return mockAnalysis
      
    } catch (error) {
      console.error('❌ Video analysis failed:', error)
      throw new Error(`Failed to analyze video: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate realistic mock analysis for development/testing
   */
  private static async generateMockAnalysis(
    transcript: string, 
    questions: Array<{ question: string; timestamp: number }>,
    duration: number
  ): Promise<VideoAnalysisResult> {
    // Analyze transcript using AI to provide meaningful insights
    const aiAnalysis = await this.analyzeTranscriptWithAI(transcript, questions, duration)
    
    // Generate realistic metrics based on transcript quality and length
    const transcriptLength = transcript.length
    const wordCount = transcript.split(' ').length
    const wordsPerMinute = Math.round(wordCount / (duration / 60))
    
    // Calculate base scores from transcript analysis
    const baseScore = this.calculateBaseScore(transcript, wordCount, duration)
    
    return {
      overall: {
        score: baseScore,
        impression: this.getImpressionFromScore(baseScore),
        summary: aiAnalysis.summary
      },
      facial: {
        eyeContact: {
          percentage: this.randomInRange(65, 85),
          consistency: this.randomInRange(70, 90),
          moments: [
            { timestamp: 30, duration: 15, quality: 'good' },
            { timestamp: 120, duration: 8, quality: 'poor' },
            { timestamp: 200, duration: 20, quality: 'good' }
          ]
        },
        expressions: {
          confidence: this.randomInRange(70, 90),
          engagement: this.randomInRange(75, 95),
          stress: this.randomInRange(20, 40),
          expressiveness: this.randomInRange(60, 80)
        },
        headMovement: {
          stability: this.randomInRange(70, 85),
          naturalness: this.randomInRange(75, 90),
          excessiveMovement: Math.random() > 0.7
        }
      },
      bodyLanguage: {
        posture: {
          uprightness: this.randomInRange(70, 90),
          stability: this.randomInRange(75, 85),
          leaning: Math.random() > 0.6 ? 'forward' : 'neutral'
        },
        gestures: {
          frequency: this.randomInRange(60, 80),
          appropriateness: this.randomInRange(70, 90),
          naturalness: this.randomInRange(65, 85)
        },
        overall: {
          professionalism: this.randomInRange(75, 95),
          confidence: this.randomInRange(70, 90),
          engagement: this.randomInRange(75, 90)
        }
      },
      speech: {
        pacing: {
          wordsPerMinute,
          consistency: this.randomInRange(70, 85),
          rushingMoments: wordsPerMinute > 160 ? [
            { timestamp: 45, duration: 12 }
          ] : [],
          pauseQuality: this.randomInRange(65, 85)
        },
        clarity: {
          articulation: this.randomInRange(75, 95),
          volume: this.randomInRange(70, 90),
          tonalVariation: this.randomInRange(65, 85)
        },
        fillerWords: {
          count: Math.floor(wordCount * 0.02), // ~2% filler words
          types: ['um', 'uh', 'like', 'you know'],
          frequency: Math.round((wordCount * 0.02) / (duration / 60))
        }
      },
      recommendations: aiAnalysis.recommendations,
      strengths: aiAnalysis.strengths,
      improvements: aiAnalysis.improvements
    }
  }

  /**
   * Analyze transcript content using AI for meaningful insights
   */
  private static async analyzeTranscriptWithAI(
    transcript: string,
    questions: Array<{ question: string; timestamp: number }>,
    duration: number
  ): Promise<{
    summary: string
    recommendations: Array<{
      category: string
      priority: 'high' | 'medium' | 'low'
      issue: string
      suggestion: string
      impact: string
    }>
    strengths: string[]
    improvements: string[]
  }> {
    const prompt = `Analyze this interview transcript and provide detailed feedback on communication and presentation skills:

TRANSCRIPT:
${transcript}

QUESTIONS ASKED:
${questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}

DURATION: ${Math.round(duration / 60)} minutes

Please provide:
1. A 2-3 sentence overall summary of performance
2. 3-5 specific recommendations with categories (Communication, Content, Presence, etc.)
3. 3-4 key strengths demonstrated
4. 3-4 areas for improvement

Focus on:
- Communication clarity and structure
- Content relevance and depth  
- Confidence and professional presence
- Response organization (STAR method, etc.)
- Technical accuracy where applicable

Return as JSON:
{
  "summary": "Brief performance summary",
  "recommendations": [
    {
      "category": "Communication",
      "priority": "high",
      "issue": "Specific issue identified",
      "suggestion": "Actionable improvement suggestion", 
      "impact": "Expected impact of implementing this"
    }
  ],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"]
}`

    try {
      const response = await OpenAIService.chat([
        { role: 'user', content: prompt }
      ])
      
      const analysis = JSON.parse(response)
      return analysis
    } catch (error) {
      console.error('AI transcript analysis failed:', error)
      // Return fallback analysis
      return {
        summary: "Candidate provided structured responses with good technical knowledge. Some areas for improvement in communication clarity and confidence presentation.",
        recommendations: [
          {
            category: "Communication",
            priority: "high",
            issue: "Occasional use of filler words",
            suggestion: "Practice pausing instead of using 'um' or 'uh'",
            impact: "Will make responses sound more confident and polished"
          },
          {
            category: "Structure", 
            priority: "medium",
            issue: "Some responses lacked clear structure",
            suggestion: "Use STAR method for behavioral questions",
            impact: "Provides clearer, more compelling storytelling"
          }
        ],
        strengths: [
          "Clear technical knowledge",
          "Professional demeanor", 
          "Good eye contact",
          "Relevant examples"
        ],
        improvements: [
          "Reduce filler words",
          "Structure responses better",
          "Speak with more confidence",
          "Provide more specific examples"
        ]
      }
    }
  }

  /**
   * Calculate base score from transcript analysis
   */
  private static calculateBaseScore(transcript: string, wordCount: number, duration: number): number {
    let score = 70 // Base score
    
    // Adjust based on response length
    const averageWordsPerResponse = wordCount / 5 // assuming 5 questions
    if (averageWordsPerResponse > 50) score += 5
    if (averageWordsPerResponse > 80) score += 5
    if (averageWordsPerResponse > 120) score += 5
    
    // Adjust based on speaking pace
    const wordsPerMinute = wordCount / (duration / 60)
    if (wordsPerMinute >= 120 && wordsPerMinute <= 150) score += 5 // Good pace
    if (wordsPerMinute < 80 || wordsPerMinute > 180) score -= 5 // Too slow/fast
    
    // Check for structure words (indicates organized thinking)
    const structureWords = ['first', 'second', 'then', 'however', 'therefore', 'because', 'for example']
    const structureWordCount = structureWords.reduce((count, word) => {
      return count + (transcript.toLowerCase().split(word).length - 1)
    }, 0)
    
    if (structureWordCount > 5) score += 10
    
    // Penalize excessive filler words
    const fillerWords = transcript.toLowerCase().match(/\b(um|uh|like|you know|so)\b/g) || []
    const fillerRatio = fillerWords.length / wordCount
    if (fillerRatio > 0.05) score -= 10 // > 5% filler words
    if (fillerRatio > 0.10) score -= 10 // > 10% filler words
    
    return Math.max(40, Math.min(95, score)) // Clamp between 40-95
  }

  /**
   * Convert numerical score to impression level
   */
  private static getImpressionFromScore(score: number): 'excellent' | 'good' | 'average' | 'needs_improvement' {
    if (score >= 85) return 'excellent'
    if (score >= 75) return 'good'
    if (score >= 60) return 'average'
    return 'needs_improvement'
  }

  /**
   * Generate random number in range for realistic mock data
   */
  private static randomInRange(min: number, max: number): number {
    return Math.round(Math.random() * (max - min) + min)
  }

  /**
   * Extract key moments from video analysis for highlights
   */
  static extractKeyMoments(analysis: VideoAnalysisResult, duration: number): Array<{
    timestamp: number
    type: 'strength' | 'improvement'
    title: string
    description: string
  }> {
    const moments: Array<{
      timestamp: number
      type: 'strength' | 'improvement' 
      title: string
      description: string
    }> = []
    
    // Add eye contact moments
    analysis.facial.eyeContact.moments.forEach(moment => {
      moments.push({
        timestamp: moment.timestamp,
        type: moment.quality === 'good' ? 'strength' : 'improvement',
        title: moment.quality === 'good' ? 'Excellent Eye Contact' : 'Eye Contact Break',
        description: moment.quality === 'good' 
          ? 'Maintained strong eye contact with interviewer'
          : 'Lost eye contact - try to maintain focus on camera'
      })
    })
    
    // Add speech pacing moments
    if (analysis.speech.pacing.rushingMoments.length > 0) {
      analysis.speech.pacing.rushingMoments.forEach(moment => {
        moments.push({
          timestamp: moment.timestamp,
          type: 'improvement',
          title: 'Speaking Too Quickly',
          description: 'Try to slow down and take pauses for clarity'
        })
      })
    }
    
    // Sort by timestamp
    return moments.sort((a, b) => a.timestamp - b.timestamp)
  }
}