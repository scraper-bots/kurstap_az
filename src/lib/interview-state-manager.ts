/**
 * Interview State Persistence & Recovery Manager
 * Handles state saving/loading across interruptions with multiple storage layers
 */

import { interviewErrorHandler } from './interview-error-handler'

export interface InterviewState {
  sessionId: string
  userId: string
  stage: 'setup' | 'interview' | 'completed' | 'loading' | 'paused' | 'error'
  
  // Interview configuration
  position: string
  difficulty: 'easy' | 'medium' | 'hard'
  totalQuestions: number
  
  // Progress tracking
  currentQuestionIndex: number
  currentQuestion?: {
    id: string
    question: string
    category: string
    difficulty: string
    expectedDuration: number
  }
  
  // Answers and responses
  answers: Array<{
    questionId: number
    question: string
    userAnswer: string
    category: string
    responseTime?: number
    confidence?: number
    timestamp: Date
  }>
  
  // Timing information
  startTime: number
  lastActivityTime: number
  totalPausedTime: number
  questionStartTime?: number
  
  // Audio/Connection state
  audioState: {
    isActive: boolean
    hasPermission: boolean
    deviceId?: string
    connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error'
    lastError?: string
  }
  
  // Metadata
  metadata: {
    browserInfo: string
    deviceInfo: string
    networkQuality?: string
    interruptions: Array<{
      type: string
      timestamp: Date
      recovered: boolean
    }>
  }
}

export interface StateStorage {
  save(state: InterviewState): Promise<boolean>
  load(sessionId: string): Promise<InterviewState | null>
  clear(sessionId: string): Promise<void>
  exists(sessionId: string): Promise<boolean>
}

/**
 * Browser LocalStorage implementation
 */
class LocalStorageProvider implements StateStorage {
  private getKey(sessionId: string): string {
    return `interview_state_${sessionId}`
  }

  async save(state: InterviewState): Promise<boolean> {
    try {
      const stateWithTimestamp = {
        ...state,
        lastSaved: new Date().toISOString(),
        version: '1.0'
      }
      
      localStorage.setItem(this.getKey(state.sessionId), JSON.stringify(stateWithTimestamp))
      return true
    } catch (error) {
      console.error('LocalStorage save failed:', error)
      return false
    }
  }

  async load(sessionId: string): Promise<InterviewState | null> {
    try {
      const stored = localStorage.getItem(this.getKey(sessionId))
      if (!stored) return null
      
      const parsed = JSON.parse(stored)
      
      // Convert date strings back to Date objects
      if (parsed.answers) {
        parsed.answers = parsed.answers.map((answer: any) => ({
          ...answer,
          timestamp: new Date(answer.timestamp)
        }))
      }
      
      if (parsed.metadata?.interruptions) {
        parsed.metadata.interruptions = parsed.metadata.interruptions.map((interruption: any) => ({
          ...interruption,
          timestamp: new Date(interruption.timestamp)
        }))
      }
      
      return parsed
    } catch (error) {
      console.error('LocalStorage load failed:', error)
      return null
    }
  }

  async clear(sessionId: string): Promise<void> {
    localStorage.removeItem(this.getKey(sessionId))
  }

  async exists(sessionId: string): Promise<boolean> {
    return localStorage.getItem(this.getKey(sessionId)) !== null
  }
}

/**
 * Server-side database storage implementation
 */
class DatabaseStorageProvider implements StateStorage {
  async save(state: InterviewState): Promise<boolean> {
    try {
      const response = await fetch('/api/interview/state/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      })
      
      return response.ok
    } catch (error) {
      console.error('Database save failed:', error)
      return false
    }
  }

  async load(sessionId: string): Promise<InterviewState | null> {
    try {
      const response = await fetch(`/api/interview/state/load/${sessionId}`)
      if (!response.ok) return null
      
      return await response.json()
    } catch (error) {
      console.error('Database load failed:', error)
      return null
    }
  }

  async clear(sessionId: string): Promise<void> {
    try {
      await fetch(`/api/interview/state/clear/${sessionId}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Database clear failed:', error)
    }
  }

  async exists(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/interview/state/exists/${sessionId}`)
      return response.ok
    } catch (error) {
      console.error('Database exists check failed:', error)
      return false
    }
  }
}

/**
 * Main Interview State Manager with multi-layer persistence
 */
class InterviewStateManager {
  private static instance: InterviewStateManager
  private localProvider = new LocalStorageProvider()
  private databaseProvider = new DatabaseStorageProvider()
  
  private currentState: InterviewState | null = null
  private autoSaveInterval: NodeJS.Timeout | null = null
  private saveInProgress = false
  
  static getInstance(): InterviewStateManager {
    if (!InterviewStateManager.instance) {
      InterviewStateManager.instance = new InterviewStateManager()
    }
    return InterviewStateManager.instance
  }

  /**
   * Initialize state for new interview session
   */
  async initializeState(params: {
    sessionId: string
    userId: string
    position: string
    difficulty: 'easy' | 'medium' | 'hard'
    totalQuestions: number
  }): Promise<InterviewState> {
    const state: InterviewState = {
      sessionId: params.sessionId,
      userId: params.userId,
      stage: 'setup',
      position: params.position,
      difficulty: params.difficulty,
      totalQuestions: params.totalQuestions,
      currentQuestionIndex: 0,
      answers: [],
      startTime: Date.now(),
      lastActivityTime: Date.now(),
      totalPausedTime: 0,
      audioState: {
        isActive: false,
        hasPermission: false,
        connectionStatus: 'disconnected'
      },
      metadata: {
        browserInfo: navigator.userAgent,
        deviceInfo: navigator.platform,
        interruptions: []
      }
    }

    this.currentState = state
    await this.saveState()
    this.startAutoSave()
    
    return state
  }

  /**
   * Load existing state from storage (tries local first, then database)
   */
  async loadState(sessionId: string): Promise<InterviewState | null> {
    try {
      // Try local storage first (faster)
      let state = await this.localProvider.load(sessionId)
      
      if (!state) {
        // Fallback to database
        state = await this.databaseProvider.load(sessionId)
        
        if (state) {
          // Sync back to local storage
          await this.localProvider.save(state)
        }
      }
      
      if (state) {
        this.currentState = state
        this.startAutoSave()
        
        // Record recovery
        await this.recordInterruption('STATE_RECOVERY', true)
        
        return state
      }
      
      return null
    } catch (error) {
      await interviewErrorHandler.handleError(error, {
        stage: 'setup',
        sessionId,
        userId: 'unknown'
      })
      return null
    }
  }

  /**
   * Update current state
   */
  async updateState(updates: Partial<InterviewState>): Promise<void> {
    if (!this.currentState) {
      throw new Error('No active interview state to update')
    }

    this.currentState = {
      ...this.currentState,
      ...updates,
      lastActivityTime: Date.now()
    }

    // Immediate save for critical updates
    const criticalUpdates = ['stage', 'answers', 'currentQuestionIndex']
    const hasCriticalUpdate = Object.keys(updates).some(key => 
      criticalUpdates.includes(key)
    )

    if (hasCriticalUpdate) {
      await this.saveState()
    }
  }

  /**
   * Add new answer to state
   */
  async addAnswer(answer: {
    questionId: number
    question: string
    userAnswer: string
    category: string
    responseTime?: number
    confidence?: number
  }): Promise<void> {
    if (!this.currentState) return

    const answerWithTimestamp = {
      ...answer,
      timestamp: new Date()
    }

    await this.updateState({
      answers: [...this.currentState.answers, answerWithTimestamp],
      currentQuestionIndex: this.currentState.currentQuestionIndex + 1
    })
  }

  /**
   * Record interruption event
   */
  async recordInterruption(type: string, recovered: boolean = false): Promise<void> {
    if (!this.currentState) return

    const interruption = {
      type,
      timestamp: new Date(),
      recovered
    }

    await this.updateState({
      metadata: {
        ...this.currentState.metadata,
        interruptions: [...this.currentState.metadata.interruptions, interruption]
      }
    })
  }

  /**
   * Pause interview and save state
   */
  async pauseInterview(): Promise<void> {
    if (!this.currentState) return

    const now = Date.now()
    await this.updateState({
      stage: 'paused',
      lastActivityTime: now
    })

    this.stopAutoSave()
  }

  /**
   * Resume interview from paused state
   */
  async resumeInterview(): Promise<void> {
    if (!this.currentState) return

    const now = Date.now()
    const pausedDuration = now - this.currentState.lastActivityTime

    await this.updateState({
      stage: 'interview',
      totalPausedTime: this.currentState.totalPausedTime + pausedDuration,
      lastActivityTime: now
    })

    this.startAutoSave()
    await this.recordInterruption('INTERVIEW_RESUMED', true)
  }

  /**
   * Complete interview and clean up
   */
  async completeInterview(): Promise<void> {
    if (!this.currentState) return

    await this.updateState({
      stage: 'completed'
    })

    // Final save
    await this.saveState()
    this.stopAutoSave()

    // Clean up local storage after successful completion
    setTimeout(async () => {
      if (this.currentState) {
        await this.localProvider.clear(this.currentState.sessionId)
      }
    }, 5000) // Wait 5 seconds before cleanup
  }

  /**
   * Save state to both storage providers
   */
  private async saveState(): Promise<void> {
    if (!this.currentState || this.saveInProgress) return

    this.saveInProgress = true

    try {
      // Save to both providers simultaneously
      const [localSuccess, databaseSuccess] = await Promise.allSettled([
        this.localProvider.save(this.currentState),
        this.databaseProvider.save(this.currentState)
      ])

      // Log save results
      console.log('State save results:', {
        local: localSuccess.status === 'fulfilled' ? localSuccess.value : false,
        database: databaseSuccess.status === 'fulfilled' ? databaseSuccess.value : false
      })

    } catch (error) {
      await interviewErrorHandler.handleError(error, {
        stage: this.currentState.stage === 'completed' ? 'completion' : 
               this.currentState.stage === 'setup' ? 'setup' : 'interview',
        sessionId: this.currentState.sessionId,
        userId: this.currentState.userId
      })
    } finally {
      this.saveInProgress = false
    }
  }

  /**
   * Start automatic state saving
   */
  private startAutoSave(): void {
    if (this.autoSaveInterval) return

    this.autoSaveInterval = setInterval(async () => {
      await this.saveState()
    }, 10000) // Save every 10 seconds
  }

  /**
   * Stop automatic state saving
   */
  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
    }
  }

  /**
   * Get current state
   */
  getCurrentState(): InterviewState | null {
    return this.currentState
  }

  /**
   * Check for recoverable sessions
   */
  async getRecoverableSessions(userId: string): Promise<InterviewState[]> {
    try {
      const response = await fetch(`/api/interview/state/recoverable/${userId}`)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Failed to get recoverable sessions:', error)
    }
    return []
  }

  /**
   * Calculate interview progress
   */
  getProgress(): {
    questionsAnswered: number
    totalQuestions: number
    percentComplete: number
    elapsedTime: number
    estimatedRemainingTime: number
  } {
    if (!this.currentState) {
      return {
        questionsAnswered: 0,
        totalQuestions: 0,
        percentComplete: 0,
        elapsedTime: 0,
        estimatedRemainingTime: 0
      }
    }

    const questionsAnswered = this.currentState.answers.length
    const totalQuestions = this.currentState.totalQuestions
    const percentComplete = totalQuestions > 0 ? (questionsAnswered / totalQuestions) * 100 : 0
    const elapsedTime = Date.now() - this.currentState.startTime - this.currentState.totalPausedTime
    
    // Estimate remaining time based on average time per question
    const avgTimePerQuestion = questionsAnswered > 0 ? elapsedTime / questionsAnswered : 120000 // 2 minutes default
    const remainingQuestions = totalQuestions - questionsAnswered
    const estimatedRemainingTime = remainingQuestions * avgTimePerQuestion

    return {
      questionsAnswered,
      totalQuestions,
      percentComplete,
      elapsedTime,
      estimatedRemainingTime
    }
  }

  /**
   * Handle browser beforeunload event
   */
  setupBeforeUnloadHandler(): void {
    if (typeof window === 'undefined') return

    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      if (this.currentState && this.currentState.stage === 'interview') {
        await this.recordInterruption('BROWSER_NAVIGATION', false)
        await this.saveState()
        
        // Show warning to user
        event.preventDefault()
        event.returnValue = 'You have an interview in progress. Your progress will be saved, but leaving may interrupt your session.'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', async () => {
      if (document.hidden && this.currentState?.stage === 'interview') {
        await this.recordInterruption('TAB_HIDDEN', false)
        await this.pauseInterview()
      } else if (!document.hidden && this.currentState?.stage === 'paused') {
        await this.resumeInterview()
      }
    })
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopAutoSave()
    this.currentState = null
  }
}

export const interviewStateManager = InterviewStateManager.getInstance()