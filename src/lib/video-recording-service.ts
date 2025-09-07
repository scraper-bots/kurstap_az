export interface VideoRecordingConfig {
  width: number
  height: number
  frameRate: number
  videoBitsPerSecond: number
  audioBitsPerSecond: number
  mimeType: string
}

export interface RecordingMetrics {
  duration: number // in seconds
  fileSize: number // in bytes
  resolution: string
  frameRate: number
  recordingQuality: 'low' | 'medium' | 'high'
}

export class VideoRecordingService {
  private mediaRecorder: MediaRecorder | null = null
  private recordedChunks: Blob[] = []
  private stream: MediaStream | null = null
  private startTime: number = 0
  private isRecording: boolean = false

  // Default recording configuration
  private static readonly DEFAULT_CONFIG: VideoRecordingConfig = {
    width: 1280,
    height: 720,
    frameRate: 30,
    videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
    audioBitsPerSecond: 128000,  // 128 kbps for clear audio
    mimeType: 'video/webm;codecs=vp9,opus'
  }

  // Fallback configurations for different browser support
  private static readonly FALLBACK_CONFIGS: VideoRecordingConfig[] = [
    {
      ...VideoRecordingService.DEFAULT_CONFIG,
      mimeType: 'video/webm;codecs=vp8,opus'
    },
    {
      ...VideoRecordingService.DEFAULT_CONFIG,
      mimeType: 'video/webm'
    },
    {
      ...VideoRecordingService.DEFAULT_CONFIG,
      mimeType: 'video/mp4'
    }
  ]

  /**
   * Check if video recording is supported in the current browser
   */
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder &&
      MediaRecorder.isTypeSupported('video/webm')
    )
  }

  /**
   * Get optimal recording configuration based on browser support
   */
  private getOptimalConfig(): VideoRecordingConfig {
    // Try default configuration first
    if (MediaRecorder.isTypeSupported(VideoRecordingService.DEFAULT_CONFIG.mimeType)) {
      return VideoRecordingService.DEFAULT_CONFIG
    }

    // Try fallback configurations
    for (const config of VideoRecordingService.FALLBACK_CONFIGS) {
      if (MediaRecorder.isTypeSupported(config.mimeType)) {
        return config
      }
    }

    // If none work, return default and let browser handle it
    return VideoRecordingService.DEFAULT_CONFIG
  }

  /**
   * Initialize video recording with camera and microphone access
   */
  async initialize(): Promise<void> {
    try {
      if (!VideoRecordingService.isSupported()) {
        throw new Error('Video recording is not supported in this browser')
      }

      const config = this.getOptimalConfig()

      // Request user media with video and audio
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: config.width },
          height: { ideal: config.height },
          frameRate: { ideal: config.frameRate },
          facingMode: 'user' // Front-facing camera for interviews
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      })

      console.log('✅ Video recording initialized successfully')
      console.log('Video tracks:', this.stream.getVideoTracks().map(t => t.label))
      console.log('Audio tracks:', this.stream.getAudioTracks().map(t => t.label))

    } catch (error) {
      console.error('❌ Failed to initialize video recording:', error)
      throw new Error(`Failed to access camera/microphone: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Start video recording
   */
  async startRecording(): Promise<void> {
    if (!this.stream) {
      throw new Error('Video recording not initialized. Call initialize() first.')
    }

    if (this.isRecording) {
      console.warn('⚠️ Recording is already in progress')
      return
    }

    try {
      const config = this.getOptimalConfig()
      
      // Create MediaRecorder with optimal settings
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: config.mimeType,
        videoBitsPerSecond: config.videoBitsPerSecond,
        audioBitsPerSecond: config.audioBitsPerSecond
      })

      // Clear previous recording data
      this.recordedChunks = []
      this.startTime = Date.now()

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data)
        }
      }

      this.mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event)
      }

      // Start recording
      this.mediaRecorder.start(1000) // Collect data every second
      this.isRecording = true

      console.log('🎥 Video recording started')
    } catch (error) {
      console.error('❌ Failed to start video recording:', error)
      throw new Error(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Stop video recording and return the recorded blob
   */
  async stopRecording(): Promise<{ blob: Blob; metrics: RecordingMetrics }> {
    if (!this.mediaRecorder || !this.isRecording) {
      throw new Error('No active recording to stop')
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder is null'))
        return
      }

      // Set up timeout to prevent hanging promises
      const timeout = setTimeout(() => {
        reject(new Error('Recording stop timeout - operation took too long'))
      }, 10000) // 10 second timeout

      this.mediaRecorder.onstop = () => {
        try {
          clearTimeout(timeout)
          
          const config = this.getOptimalConfig()
          const blob = new Blob(this.recordedChunks, { type: config.mimeType })
          const duration = Math.round((Date.now() - this.startTime) / 1000)
          
          const metrics: RecordingMetrics = {
            duration,
            fileSize: blob.size,
            resolution: `${config.width}x${config.height}`,
            frameRate: config.frameRate,
            recordingQuality: this.getQualityRating(blob.size, duration)
          }

          console.log('🎥 Video recording stopped:', metrics)
          
          // Clear chunks to prevent memory leaks
          this.recordedChunks = []
          
          resolve({ blob, metrics })
        } catch (error) {
          clearTimeout(timeout)
          reject(error)
        }
      }

      this.mediaRecorder.onerror = (event) => {
        clearTimeout(timeout)
        reject(new Error(`MediaRecorder error during stop: ${event}`))
      }

      try {
        this.mediaRecorder.stop()
        this.isRecording = false
      } catch (error) {
        clearTimeout(timeout)
        reject(error)
      }
    })
  }

  /**
   * Pause video recording
   */
  pauseRecording(): void {
    if (this.mediaRecorder && this.isRecording && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause()
      console.log('⏸️ Video recording paused')
    }
  }

  /**
   * Resume video recording
   */
  resumeRecording(): void {
    if (this.mediaRecorder && this.isRecording && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume()
      console.log('▶️ Video recording resumed')
    }
  }

  /**
   * Get the video stream for preview
   */
  getVideoStream(): MediaStream | null {
    return this.stream
  }

  /**
   * Get current recording state
   */
  getRecordingState(): {
    isRecording: boolean
    isPaused: boolean
    duration: number
    state: string
  } {
    const duration = this.isRecording ? Math.round((Date.now() - this.startTime) / 1000) : 0
    
    return {
      isRecording: this.isRecording,
      isPaused: this.mediaRecorder?.state === 'paused',
      duration,
      state: this.mediaRecorder?.state || 'inactive'
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    try {
      // Stop recording if active
      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop()
      }

      // Stop all tracks
      if (this.stream) {
        this.stream.getTracks().forEach(track => {
          track.stop()
        })
      }

      // Reset state
      this.mediaRecorder = null
      this.stream = null
      this.recordedChunks = []
      this.isRecording = false
      this.startTime = 0

      console.log('🧹 Video recording resources cleaned up')
    } catch (error) {
      console.error('❌ Error during cleanup:', error)
    }
  }

  /**
   * Determine recording quality based on file size and duration
   */
  private getQualityRating(fileSize: number, duration: number): 'low' | 'medium' | 'high' {
    if (duration === 0) return 'low'
    
    // Calculate bits per second
    const bitsPerSecond = (fileSize * 8) / duration
    
    // Quality thresholds (approximate)
    if (bitsPerSecond > 2000000) return 'high'    // > 2 Mbps
    if (bitsPerSecond > 1000000) return 'medium'  // > 1 Mbps
    return 'low'
  }

  /**
   * Upload recorded video to server
   */
  async uploadVideo(blob: Blob, interviewId: string): Promise<{ videoUrl: string; uploadId: string }> {
    try {
      const formData = new FormData()
      formData.append('video', blob, `interview_${interviewId}_${Date.now()}.webm`)
      formData.append('interviewId', interviewId)

      const response = await fetch('/api/interview/upload-video', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Video uploaded successfully:', result)
      return result

    } catch (error) {
      console.error('❌ Video upload failed:', error)
      throw new Error(`Failed to upload video: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}