import Daily, { DailyCall, DailyEvent, DailyEventObjectTrack } from '@daily-co/daily-js'

export interface AudioCallConfig {
  roomUrl?: string
  token?: string
  userName?: string
}

export class DailyAudioService {
  private callObject: DailyCall | null = null
  private isRecording: boolean = false
  private audioChunks: Blob[] = []
  private mediaRecorder: MediaRecorder | null = null
  
  /**
   * Initialize Daily.co call object for audio-only interview
   */
  async initialize(config: AudioCallConfig = {}): Promise<void> {
    try {
      // Create call object with audio-only configuration
      this.callObject = Daily.createCallObject({
        audioSource: true,
        videoSource: false,
        subscribeToTracksAutomatically: false,
      })

      // Set up event listeners
      this.setupEventListeners()
      
      console.log('Daily.co call object initialized')
    } catch (error) {
      console.error('Error initializing Daily.co:', error)
      throw new Error('Failed to initialize audio service')
    }
  }

  /**
   * Create or join a Daily.co room for the interview
   */
  async createRoom(): Promise<string> {
    if (!process.env.DAILY_API_KEY || !process.env.DAILY_DOMAIN) {
      throw new Error('Daily.co configuration missing. Check environment variables.')
    }

    try {
      const response = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DAILY_API_KEY}`
        },
        body: JSON.stringify({
          name: `interview-${Date.now()}`,
          privacy: 'private',
          properties: {
            max_participants: 1, // Only the interviewer (AI)
            audio_only: true,
            enable_recording: true,
            enable_transcription: false, // We'll use Whisper
            exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create room: ${response.statusText}`)
      }

      const room = await response.json()
      return room.url
    } catch (error) {
      console.error('Error creating Daily.co room:', error)
      throw new Error('Failed to create interview room')
    }
  }

  /**
   * Join the Daily.co room
   */
  async joinRoom(roomUrl: string, userName: string = 'Interviewee'): Promise<void> {
    if (!this.callObject) {
      throw new Error('Call object not initialized')
    }

    try {
      await this.callObject.join({
        url: roomUrl,
        userName,
        startAudioOff: false,
        startVideoOff: true,
      })
      
      console.log('Joined Daily.co room:', roomUrl)
    } catch (error) {
      console.error('Error joining room:', error)
      throw new Error('Failed to join interview room')
    }
  }

  /**
   * Start recording audio for speech processing
   */
  async startRecording(): Promise<void> {
    if (!this.callObject) {
      throw new Error('Call object not initialized')
    }

    try {
      // Get user media for recording
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Optimal for Whisper
        },
        video: false
      })

      // Create MediaRecorder for chunked recording
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      this.audioChunks = []
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
        this.processAudioChunk()
      }

      // Start recording in chunks for real-time processing
      this.mediaRecorder.start(3000) // 3-second chunks
      this.isRecording = true
      
      console.log('Started audio recording')
    } catch (error) {
      console.error('Error starting recording:', error)
      throw new Error('Failed to start audio recording')
    }
  }

  /**
   * Stop recording audio
   */
  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop()
      this.isRecording = false
      console.log('Stopped audio recording')
    }
  }

  /**
   * Process audio chunk and send to Whisper
   */
  private async processAudioChunk(): Promise<void> {
    if (this.audioChunks.length === 0) return

    try {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
      
      // Send to Whisper STT API
      const transcript = await this.transcribeAudio(audioBlob)
      
      if (transcript && transcript.trim().length > 0) {
        // Emit transcript event
        this.onTranscriptReceived?.(transcript)
      }

      // Clear chunks for next recording cycle
      this.audioChunks = []
      
      // Continue recording if still active
      if (this.isRecording && this.mediaRecorder) {
        this.mediaRecorder.start(3000)
      }
    } catch (error) {
      console.error('Error processing audio chunk:', error)
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper
   */
  private async transcribeAudio(audioBlob: Blob): Promise<string | null> {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'audio.webm')

      const response = await fetch('/api/interview/transcribe', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.transcript || null
    } catch (error) {
      console.error('Error transcribing audio:', error)
      return null
    }
  }

  /**
   * Play AI response using text-to-speech
   */
  async playAIResponse(text: string): Promise<void> {
    try {
      const response = await fetch('/api/interview/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        throw new Error(`TTS failed: ${response.statusText}`)
      }

      const audioBuffer = await response.arrayBuffer()
      const audioContext = new AudioContext()
      const audioBufferSource = audioContext.createBufferSource()
      
      const decodedBuffer = await audioContext.decodeAudioData(audioBuffer)
      audioBufferSource.buffer = decodedBuffer
      audioBufferSource.connect(audioContext.destination)
      audioBufferSource.start()
      
      console.log('Playing AI response')
    } catch (error) {
      console.error('Error playing AI response:', error)
      throw new Error('Failed to play AI response')
    }
  }

  /**
   * Leave the Daily.co room
   */
  async leaveRoom(): Promise<void> {
    if (this.callObject) {
      this.stopRecording()
      await this.callObject.leave()
      this.callObject.destroy()
      this.callObject = null
      console.log('Left Daily.co room')
    }
  }

  /**
   * Set up event listeners for call events
   */
  private setupEventListeners(): void {
    if (!this.callObject) return

    this.callObject.on('joined-meeting', () => {
      console.log('Successfully joined meeting')
      this.onCallJoined?.()
    })

    this.callObject.on('left-meeting', () => {
      console.log('Left meeting')
      this.onCallLeft?.()
    })

    this.callObject.on('error', (error) => {
      console.error('Daily.co error:', error)
      this.onCallError?.(error)
    })

    this.callObject.on('track-started', (event: DailyEventObjectTrack) => {
      console.log('Track started:', event)
    })

    this.callObject.on('track-stopped', (event: DailyEventObjectTrack) => {
      console.log('Track stopped:', event)
    })
  }

  // Event callbacks (to be set by the component)
  onCallJoined?: () => void
  onCallLeft?: () => void
  onCallError?: (error: any) => void
  onTranscriptReceived?: (transcript: string) => void

  /**
   * Get current call state
   */
  getCallState(): string {
    return this.callObject?.meetingState() || 'not-connected'
  }

  /**
   * Check if currently recording
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording
  }
}

// Export singleton instance
export const dailyAudioService = new DailyAudioService()