/**
 * Interview Connection Recovery & Graceful Degradation Manager
 * Handles connection recovery, fallback modes, and service degradation
 */

import { InterviewErrorType } from './interview-error-handler'
import { interviewRetryManager } from './interview-retry-manager'
import { interviewStateManager } from './interview-state-manager'

export enum InterviewMode {
  FULL_AUDIO = 'FULL_AUDIO',           // Voice + Audio playback
  AUDIO_INPUT_ONLY = 'AUDIO_INPUT_ONLY', // Voice input, text output
  TEXT_ONLY = 'TEXT_ONLY',             // Text input/output only
  OFFLINE_MODE = 'OFFLINE_MODE'         // Local operation only
}

export enum ConnectionStatus {
  CONNECTED = 'CONNECTED',
  CONNECTING = 'CONNECTING', 
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING',
  DEGRADED = 'DEGRADED',
  FAILED = 'FAILED'
}

export interface ServiceHealth {
  audio: boolean
  transcription: boolean
  textToSpeech: boolean
  database: boolean
  ai: boolean
  network: boolean
}

export interface DegradationConfig {
  maxAudioRetries: number
  maxTranscriptionRetries: number
  maxTTSRetries: number
  fallbackToTextDelay: number
  reconnectionTimeout: number
  healthCheckInterval: number
}

export interface ConnectionEvent {
  type: 'connect' | 'disconnect' | 'reconnect' | 'degrade' | 'recover'
  timestamp: Date
  metadata?: Record<string, unknown>
}

/**
 * Main connection and degradation manager
 */
class InterviewConnectionManager {
  private static instance: InterviewConnectionManager
  
  private currentMode = InterviewMode.FULL_AUDIO
  private connectionStatus = ConnectionStatus.DISCONNECTED
  private serviceHealth: ServiceHealth = {
    audio: false,
    transcription: false,
    textToSpeech: false,
    database: false,
    ai: false,
    network: false
  }
  
  private degradationConfig: DegradationConfig = {
    maxAudioRetries: 3,
    maxTranscriptionRetries: 2,
    maxTTSRetries: 2,
    fallbackToTextDelay: 5000,
    reconnectionTimeout: 30000,
    healthCheckInterval: 15000
  }

  private reconnectionAttempts = 0
  private maxReconnectionAttempts = 5
  private healthCheckInterval: NodeJS.Timeout | null = null
  private connectionEvents: ConnectionEvent[] = []
  private eventListeners: Map<string, ((event: ConnectionEvent) => void)[]> = new Map()

  static getInstance(): InterviewConnectionManager {
    if (!InterviewConnectionManager.instance) {
      InterviewConnectionManager.instance = new InterviewConnectionManager()
    }
    return InterviewConnectionManager.instance
  }

  /**
   * Initialize connection manager and start monitoring
   */
  async initialize(): Promise<void> {
    console.log('🔌 Initializing Interview Connection Manager')
    
    // Check initial service health
    await this.performHealthCheck()
    
    // Start continuous monitoring
    this.startHealthMonitoring()
    
    // Setup network event listeners
    this.setupNetworkListeners()
    
    // Determine initial mode based on service health
    await this.determineOptimalMode()
    
    this.emitEvent('connect', { initialMode: this.currentMode })
  }

  /**
   * Perform comprehensive health check of all services
   */
  private async performHealthCheck(): Promise<void> {
    console.log('🔍 Performing service health check')
    
    const checks = await Promise.allSettled([
      this.checkNetworkHealth(),
      this.checkAudioHealth(),
      this.checkTranscriptionHealth(),
      this.checkTTSHealth(),
      this.checkDatabaseHealth(),
      this.checkAIHealth()
    ])

    this.serviceHealth = {
      network: checks[0].status === 'fulfilled' ? checks[0].value : false,
      audio: checks[1].status === 'fulfilled' ? checks[1].value : false,
      transcription: checks[2].status === 'fulfilled' ? checks[2].value : false,
      textToSpeech: checks[3].status === 'fulfilled' ? checks[3].value : false,
      database: checks[4].status === 'fulfilled' ? checks[4].value : false,
      ai: checks[5].status === 'fulfilled' ? checks[5].value : false
    }

    console.log('📊 Service health status:', this.serviceHealth)
    this.updateConnectionStatus()
  }

  /**
   * Individual health check methods
   */
  private async checkNetworkHealth(): Promise<boolean> {
    try {
      if (!navigator.onLine) return false
      
      const response = await fetch('/api/health/network', {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      })
      return response.ok
    } catch {
      return false
    }
  }

  private async checkAudioHealth(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return false
      
      // Check if microphone permission is available
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      return permission.state !== 'denied'
    } catch {
      return false
    }
  }

  private async checkTranscriptionHealth(): Promise<boolean> {
    try {
      const response = await interviewRetryManager.executeWithRetry(
        () => fetch('/api/health/transcription', { method: 'HEAD', signal: AbortSignal.timeout(5000) }),
        'api_call',
        { maxAttempts: 1 }
      )
      return response.success
    } catch {
      return false
    }
  }

  private async checkTTSHealth(): Promise<boolean> {
    try {
      const response = await interviewRetryManager.executeWithRetry(
        () => fetch('/api/health/tts', { method: 'HEAD', signal: AbortSignal.timeout(5000) }),
        'api_call', 
        { maxAttempts: 1 }
      )
      return response.success
    } catch {
      return false
    }
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      const response = await fetch('/api/health/database', {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      })
      return response.ok
    } catch {
      return false
    }
  }

  private async checkAIHealth(): Promise<boolean> {
    try {
      const response = await fetch('/api/health/ai', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Determine optimal interview mode based on service health
   */
  private async determineOptimalMode(): Promise<void> {
    const health = this.serviceHealth
    
    if (health.network && health.audio && health.transcription && health.textToSpeech) {
      await this.switchMode(InterviewMode.FULL_AUDIO, 'All services healthy')
    } else if (health.network && health.audio && health.transcription) {
      await this.switchMode(InterviewMode.AUDIO_INPUT_ONLY, 'TTS unavailable, using text output')
    } else if (health.network) {
      await this.switchMode(InterviewMode.TEXT_ONLY, 'Audio services unavailable')
    } else {
      await this.switchMode(InterviewMode.OFFLINE_MODE, 'Network unavailable')
    }
  }

  /**
   * Switch interview mode with user notification
   */
  async switchMode(newMode: InterviewMode, reason: string): Promise<void> {
    if (newMode === this.currentMode) return

    const previousMode = this.currentMode
    this.currentMode = newMode

    console.log(`🔄 Switching interview mode: ${previousMode} → ${newMode}`)
    console.log(`📄 Reason: ${reason}`)

    // Save the mode change to interview state
    await interviewStateManager.updateState({
      metadata: {
        ...interviewStateManager.getCurrentState()?.metadata,
        lastModeChange: {
          from: previousMode,
          to: newMode,
          reason,
          timestamp: new Date()
        }
      } as any
    })

    this.emitEvent('degrade', { previousMode, newMode, reason })
  }

  /**
   * Handle specific connection failures with recovery strategies
   */
  async handleConnectionFailure(
    failureType: InterviewErrorType, 
    context: Record<string, unknown>
  ): Promise<{ recovered: boolean; newMode?: InterviewMode }> {
    console.log(`🚨 Handling connection failure: ${failureType}`)

    await interviewStateManager.recordInterruption(failureType, false)

    switch (failureType) {
      case InterviewErrorType.WEBRTC_CONNECTION_FAILED:
        return await this.handleAudioConnectionFailure(context)
      
      case InterviewErrorType.NETWORK_TIMEOUT:
        return await this.handleNetworkFailure()
      
      case InterviewErrorType.SPEECH_RECOGNITION_FAILED:
        return await this.handleTranscriptionFailure()
      
      case InterviewErrorType.TTS_SERVICE_ERROR:
        return await this.handleTTSFailure()
      
      case InterviewErrorType.MICROPHONE_ACCESS_DENIED:
        return await this.handleMicrophoneFailure()
      
      default:
        return await this.handleGenericFailure(failureType)
    }
  }

  /**
   * Specific failure handlers
   */
  private async handleAudioConnectionFailure(context: Record<string, unknown>): Promise<{ recovered: boolean; newMode?: InterviewMode }> {
    console.log('🎤 Attempting to recover audio connection')
    
    // Try to reconnect audio
    const recovered = await this.attemptAudioReconnection(context)
    
    if (!recovered) {
      await this.switchMode(InterviewMode.TEXT_ONLY, 'Audio connection failed, switching to text mode')
      return { recovered: false, newMode: InterviewMode.TEXT_ONLY }
    }
    
    return { recovered: true }
  }

  private async handleNetworkFailure(): Promise<{ recovered: boolean; newMode?: InterviewMode }> {
    console.log('🌐 Network failure detected, attempting recovery')
    
    const recovered = await this.attemptNetworkRecovery()
    
    if (!recovered) {
      await this.switchMode(InterviewMode.OFFLINE_MODE, 'Network unavailable')
      return { recovered: false, newMode: InterviewMode.OFFLINE_MODE }
    }
    
    return { recovered: true }
  }

  private async handleTranscriptionFailure(): Promise<{ recovered: boolean; newMode?: InterviewMode }> {
    if (this.currentMode === InterviewMode.FULL_AUDIO || this.currentMode === InterviewMode.AUDIO_INPUT_ONLY) {
      await this.switchMode(InterviewMode.TEXT_ONLY, 'Speech recognition failed')
      return { recovered: false, newMode: InterviewMode.TEXT_ONLY }
    }
    return { recovered: false }
  }

  private async handleTTSFailure(): Promise<{ recovered: boolean; newMode?: InterviewMode }> {
    if (this.currentMode === InterviewMode.FULL_AUDIO) {
      await this.switchMode(InterviewMode.AUDIO_INPUT_ONLY, 'Text-to-speech unavailable')
      return { recovered: false, newMode: InterviewMode.AUDIO_INPUT_ONLY }
    }
    return { recovered: false }
  }

  private async handleMicrophoneFailure(): Promise<{ recovered: boolean; newMode?: InterviewMode }> {
    await this.switchMode(InterviewMode.TEXT_ONLY, 'Microphone access denied')
    return { recovered: false, newMode: InterviewMode.TEXT_ONLY }
  }

  private async handleGenericFailure(failureType: InterviewErrorType): Promise<{ recovered: boolean; newMode?: InterviewMode }> {
    console.log(`🔄 Attempting generic recovery for ${failureType}`)
    
    // Perform health check and adjust mode accordingly
    await this.performHealthCheck()
    await this.determineOptimalMode()
    
    return { recovered: false }
  }

  /**
   * Recovery attempt methods
   */
  private async attemptAudioReconnection(context: Record<string, unknown>): Promise<boolean> {
    try {
      return await interviewRetryManager.retryAudioOperation(async () => {
        // Attempt to re-establish audio connection
        const audioService = context?.audioService as { reconnect?: () => Promise<void> } | undefined
        if (audioService?.reconnect) {
          await audioService.reconnect()
          return true
        }
        throw new Error('No reconnection method available')
      }, 'audio-reconnection')
    } catch (error) {
      console.error('Audio reconnection failed:', error)
      return false
    }
  }

  private async attemptNetworkRecovery(): Promise<boolean> {
    for (let attempt = 1; attempt <= this.maxReconnectionAttempts; attempt++) {
      console.log(`🔌 Network recovery attempt ${attempt}/${this.maxReconnectionAttempts}`)
      
      try {
        const response = await fetch('/api/health/network', {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        })
        
        if (response.ok) {
          console.log('✅ Network recovery successful')
          this.reconnectionAttempts = 0
          return true
        }
      } catch {
        console.log(`❌ Network recovery attempt ${attempt} failed`)
      }
      
      if (attempt < this.maxReconnectionAttempts) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000) // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    return false
  }

  /**
   * Update connection status based on service health
   */
  private updateConnectionStatus(): void {
    const health = this.serviceHealth
    const healthyServices = Object.values(health).filter(Boolean).length
    const totalServices = Object.keys(health).length
    
    if (healthyServices === totalServices) {
      this.connectionStatus = ConnectionStatus.CONNECTED
    } else if (healthyServices >= totalServices * 0.7) {
      this.connectionStatus = ConnectionStatus.DEGRADED
    } else if (health.network) {
      this.connectionStatus = ConnectionStatus.CONNECTING
    } else {
      this.connectionStatus = ConnectionStatus.DISCONNECTED
    }
  }

  /**
   * Start continuous health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) return

    this.healthCheckInterval = setInterval(async () => {
      const previousHealth = { ...this.serviceHealth }
      await this.performHealthCheck()
      
      // Check if service health changed
      const healthChanged = Object.keys(this.serviceHealth).some(
        key => previousHealth[key as keyof ServiceHealth] !== this.serviceHealth[key as keyof ServiceHealth]
      )
      
      if (healthChanged) {
        console.log('📊 Service health changed, reassessing mode')
        await this.determineOptimalMode()
      }
    }, this.degradationConfig.healthCheckInterval)
  }

  /**
   * Setup network connectivity listeners
   */
  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('online', async () => {
      console.log('🌐 Network connection restored')
      this.serviceHealth.network = true
      await this.determineOptimalMode()
      this.emitEvent('reconnect', { trigger: 'network_restored' })
    })

    window.addEventListener('offline', async () => {
      console.log('🌐 Network connection lost')
      this.serviceHealth.network = false
      await this.switchMode(InterviewMode.OFFLINE_MODE, 'Network connection lost')
      this.emitEvent('disconnect', { trigger: 'network_lost' })
    })
  }

  /**
   * Event system for notifying components about connection changes
   */
  on(event: string, callback: (event: ConnectionEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: (event: ConnectionEvent) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emitEvent(event: string, data?: unknown): void {
    const connectionEvent: ConnectionEvent = {
      type: event as any,
      timestamp: new Date(),
      metadata: data as Record<string, unknown> | undefined
    }
    
    this.connectionEvents.push(connectionEvent)
    
    // Keep only last 50 events
    if (this.connectionEvents.length > 50) {
      this.connectionEvents = this.connectionEvents.slice(-50)
    }

    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(connectionEvent)
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  }

  /**
   * Get current system status
   */
  getStatus(): {
    mode: InterviewMode
    connectionStatus: ConnectionStatus
    serviceHealth: ServiceHealth
    reconnectionAttempts: number
    recentEvents: ConnectionEvent[]
  } {
    return {
      mode: this.currentMode,
      connectionStatus: this.connectionStatus,
      serviceHealth: { ...this.serviceHealth },
      reconnectionAttempts: this.reconnectionAttempts,
      recentEvents: this.connectionEvents.slice(-10)
    }
  }

  /**
   * Force mode switch (for testing or user preference)
   */
  async forceModeSwitch(mode: InterviewMode, reason: string = 'User requested'): Promise<void> {
    await this.switchMode(mode, reason)
  }

  /**
   * Reset connection manager state
   */
  reset(): void {
    this.currentMode = InterviewMode.FULL_AUDIO
    this.connectionStatus = ConnectionStatus.DISCONNECTED
    this.reconnectionAttempts = 0
    this.connectionEvents = []
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.reset()
    this.eventListeners.clear()
  }
}

export const interviewConnectionManager = InterviewConnectionManager.getInstance()