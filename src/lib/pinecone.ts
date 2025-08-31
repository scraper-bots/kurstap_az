import { Pinecone } from '@pinecone-database/pinecone'
import { OpenAIService, GeneratedQuestion, QuestionSet } from './openai'

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
})

const indexName = process.env.PINECONE_INDEX_NAME || 'interview-questions'

export interface StoredQuestion extends GeneratedQuestion {
  id: string
  jobTitle: string
  embedding?: number[]
  createdAt: string
}

export interface QuestionSearchResult {
  id: string
  question: string
  jobTitle: string
  category: string
  difficulty: string
  score: number
}

export class PineconeService {
  private static index = pinecone.index(indexName)

  /**
   * Initialize Pinecone index (run once during setup)
   */
  static async createIndex(): Promise<void> {
    try {
      const existingIndexes = await pinecone.listIndexes()
      const indexExists = existingIndexes.indexes?.some(index => index.name === indexName)

      if (!indexExists) {
        console.log(`Creating Pinecone index: ${indexName}`)
        await pinecone.createIndex({
          name: indexName,
          dimension: 1536, // OpenAI embedding dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-west-2'
            }
          }
        })
        console.log('Index created successfully')
        
        // Wait for index to be ready
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    } catch (error) {
      console.error('Error creating Pinecone index:', error)
      throw error
    }
  }

  /**
   * Store generated questions in Pinecone with embeddings
   */
  static async storeQuestionSet(questionSet: QuestionSet): Promise<void> {
    try {
      const allQuestions: GeneratedQuestion[] = [
        ...questionSet.behavioral,
        ...questionSet.technical,
        ...questionSet.situational
      ]

      // Generate embeddings for all questions
      const questionTexts = allQuestions.map(q => 
        `${q.category} question for ${questionSet.jobTitle}: ${q.question} Follow-up: ${q.followUp}`
      )
      
      const embeddings = await OpenAIService.generateEmbeddings(questionTexts)

      // Prepare vectors for Pinecone
      const vectors = allQuestions.map((question, index) => {
        const id = `${questionSet.jobTitle.toLowerCase().replace(/\s+/g, '-')}-${question.category}-${Date.now()}-${index}`
        
        return {
          id,
          values: embeddings[index],
          metadata: {
            jobTitle: questionSet.jobTitle,
            question: question.question,
            followUp: question.followUp,
            difficulty: question.difficulty,
            category: question.category,
            expectedDuration: question.expectedDuration,
            createdAt: new Date().toISOString(),
          }
        }
      })

      // Upsert to Pinecone in batches
      const batchSize = 10
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize)
        await this.index.upsert(batch)
      }

      console.log(`Stored ${vectors.length} questions for ${questionSet.jobTitle}`)
    } catch (error) {
      console.error('Error storing questions in Pinecone:', error)
      throw error
    }
  }

  /**
   * Search for similar questions by job title or content
   */
  static async searchQuestions(
    query: string,
    jobTitle?: string,
    category?: string,
    limit: number = 10
  ): Promise<QuestionSearchResult[]> {
    try {
      // Generate embedding for the search query
      const queryEmbedding = await OpenAIService.generateEmbeddings([query])
      
      // Build filter for metadata
      const filter: any = {}
      if (jobTitle) {
        filter.jobTitle = jobTitle
      }
      if (category) {
        filter.category = category
      }

      const queryRequest = {
        vector: queryEmbedding[0],
        topK: limit,
        includeMetadata: true,
        ...(Object.keys(filter).length > 0 && { filter })
      }

      const results = await this.index.query(queryRequest)

      return results.matches?.map(match => ({
        id: match.id,
        question: match.metadata?.question as string,
        jobTitle: match.metadata?.jobTitle as string,
        category: match.metadata?.category as string,
        difficulty: match.metadata?.difficulty as string,
        score: match.score || 0
      })) || []
    } catch (error) {
      console.error('Error searching questions in Pinecone:', error)
      throw error
    }
  }

  /**
   * Get questions by job title
   */
  static async getQuestionsByJobTitle(
    jobTitle: string,
    category?: string,
    limit: number = 20
  ): Promise<StoredQuestion[]> {
    try {
      const filter: any = { jobTitle }
      if (category) {
        filter.category = category
      }

      // Use a dummy vector for metadata-only filtering
      const dummyVector = new Array(1536).fill(0)
      
      const results = await this.index.query({
        vector: dummyVector,
        topK: limit,
        includeMetadata: true,
        filter
      })

      return results.matches?.map(match => ({
        id: match.id,
        question: match.metadata?.question as string,
        followUp: match.metadata?.followUp as string,
        difficulty: match.metadata?.difficulty as 'easy' | 'medium' | 'hard',
        category: match.metadata?.category as 'behavioral' | 'technical' | 'situational',
        expectedDuration: match.metadata?.expectedDuration as number,
        jobTitle: match.metadata?.jobTitle as string,
        createdAt: match.metadata?.createdAt as string,
      })) || []
    } catch (error) {
      console.error('Error getting questions by job title:', error)
      throw error
    }
  }

  /**
   * Delete questions by job title (useful for regenerating)
   */
  static async deleteQuestionsByJobTitle(jobTitle: string): Promise<void> {
    try {
      // First, get all question IDs for this job title
      const questions = await this.getQuestionsByJobTitle(jobTitle, undefined, 1000)
      
      if (questions.length > 0) {
        const ids = questions.map(q => q.id)
        
        // Delete in batches
        const batchSize = 100
        for (let i = 0; i < ids.length; i += batchSize) {
          const batch = ids.slice(i, i + batchSize)
          await this.index.deleteMany(batch)
        }
        
        console.log(`Deleted ${ids.length} questions for ${jobTitle}`)
      }
    } catch (error) {
      console.error('Error deleting questions:', error)
      throw error
    }
  }

  /**
   * Get index stats
   */
  static async getIndexStats() {
    try {
      const stats = await this.index.describeIndexStats()
      return stats
    } catch (error) {
      console.error('Error getting index stats:', error)
      throw error
    }
  }
}

export { pinecone }