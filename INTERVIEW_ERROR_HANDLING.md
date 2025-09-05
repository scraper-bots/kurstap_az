# Interview Exception Handling & Logging System

## Overview

This comprehensive error handling and logging system provides robust interruption recovery mechanisms for the interview platform, handling various types of failures including network issues, audio problems, service outages, and user interruptions.

## 🚀 Key Features

### 1. **Comprehensive Error Categorization**
- **Network Errors**: Timeouts, connection drops, API unavailability
- **Audio System Errors**: Microphone access, WebRTC failures, device issues
- **Service Integration Errors**: OpenAI, ElevenLabs, Daily.co service failures
- **State Management Errors**: Session corruption, browser navigation
- **User Action Errors**: Permission revocation, cancellation

### 2. **Multi-Layer State Persistence**
- **Browser LocalStorage**: Fast, immediate persistence
- **Database Storage**: Reliable server-side backup
- **Automatic Sync**: Seamless state recovery across sessions

### 3. **Intelligent Recovery Strategies**
- **Exponential Backoff**: Smart retry mechanisms with increasing delays
- **Circuit Breaker Pattern**: Service protection during outages
- **Graceful Degradation**: Automatic fallback to alternative modes
- **Connection Recovery**: Automatic reconnection with health monitoring

### 4. **User-Friendly Recovery UI**
- **Error Boundary Components**: Handles React component errors
- **Recovery Suggestions**: Context-aware user guidance  
- **Connection Status**: Real-time service health indicators
- **Resume Functionality**: Continue interrupted interviews

## 📁 System Architecture

```
src/lib/
├── interview-error-handler.ts      # Core error categorization & logging
├── interview-state-manager.ts      # Multi-layer state persistence
├── interview-retry-manager.ts      # Exponential backoff & circuit breakers
└── interview-connection-manager.ts # Connection recovery & degradation

src/components/interview/
└── InterviewErrorBoundary.tsx     # User-friendly error UI components

src/hooks/
└── useInterviewErrorHandling.ts   # React integration hook

src/app/api/
├── interview/state/               # State persistence endpoints
└── health/                       # Service health check endpoints
```

## 🔧 Usage Examples

### Basic Error Handling Integration

```typescript
import { useInterviewErrorHandling } from '@/hooks/useInterviewErrorHandling'
import { InterviewErrorRecovery } from '@/components/interview/InterviewErrorBoundary'

function InterviewPage() {
  const { errorState, handleError, retryLastOperation, switchMode } = useInterviewErrorHandling(
    sessionId,
    userId
  )

  // Handle API calls with automatic retry
  const submitAnswer = async (answer: string) => {
    try {
      const result = await interviewRetryManager.retryApiCall(
        () => fetch('/api/interview/answer', {
          method: 'POST',
          body: JSON.stringify({ answer })
        }),
        'submit-answer'
      )
      return result
    } catch (error) {
      await handleError(error, { context: 'answer_submission', operation: submitAnswer })
    }
  }

  return (
    <div>
      {errorState.currentError && (
        <InterviewErrorRecovery
          error={errorState.currentError}
          onRetry={retryLastOperation}
          onFallback={switchMode}
          onCancel={() => router.push('/dashboard')}
          isRetrying={errorState.isRecovering}
        />
      )}
      
      <InterviewConnectionStatus />
      {/* Interview content */}
    </div>
  )
}
```

### State Management with Auto-Recovery

```typescript
import { interviewStateManager } from '@/lib/interview-state-manager'

// Initialize interview with state persistence
const initializeInterview = async () => {
  const state = await interviewStateManager.initializeState({
    sessionId: 'interview-123',
    userId: 'user-456', 
    position: 'Software Engineer',
    difficulty: 'medium',
    totalQuestions: 10
  })
  
  // State automatically saves every 10 seconds
  // Handles browser refresh, tab switching, device sleep
}

// Resume interrupted interview
const resumeInterview = async (sessionId: string) => {
  const state = await interviewStateManager.loadState(sessionId)
  if (state) {
    await interviewStateManager.resumeInterview()
    return state
  }
}

// Add answers with automatic persistence
const addAnswer = async (answer: InterviewAnswer) => {
  await interviewStateManager.addAnswer(answer)
  // State immediately saved to both localStorage and database
}
```

### Connection Recovery & Degradation

```typescript
import { interviewConnectionManager, InterviewMode } from '@/lib/interview-connection-manager'

// Initialize connection monitoring
await interviewConnectionManager.initialize()

// Listen for connection changes
interviewConnectionManager.on('degrade', (event) => {
  console.log(`Mode changed: ${event.metadata.previousMode} → ${event.metadata.newMode}`)
  showUserNotification(event.metadata.reason)
})

// Handle specific failures
const handleAudioFailure = async (error: Error) => {
  const result = await interviewConnectionManager.handleConnectionFailure(
    InterviewErrorType.WEBRTC_CONNECTION_FAILED,
    { audioService, sessionId }
  )
  
  if (!result.recovered && result.newMode) {
    // Switched to text mode, update UI accordingly
    updateInterviewUI(result.newMode)
  }
}
```

### Advanced Retry with Circuit Breaker

```typescript
import { interviewRetryManager } from '@/lib/interview-retry-manager'

// API call with automatic retry and circuit breaker
const transcribeAudio = async (audioData: Blob) => {
  return await interviewRetryManager.executeWithRetry(
    async () => {
      const formData = new FormData()
      formData.append('audio', audioData)
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) throw new Error(`Transcription failed: ${response.status}`)
      return response.json()
    },
    'transcription', // Operation type with predefined retry strategy
    {
      maxAttempts: 3,
      onRetry: (attempt, error) => {
        showRetryNotification(`Attempting transcription... (${attempt}/3)`)
      }
    },
    'openai-whisper' // Service name for circuit breaker
  )
}
```

## 🔍 Error Types & Recovery Actions

### Network & Connectivity
| Error Type | Recovery Action | User Experience |
|------------|----------------|-----------------|
| `NETWORK_TIMEOUT` | Exponential backoff retry | "Connection issue. Retrying..." |
| `CONNECTION_LOST` | Save state + reconnection | "Connection lost. Reconnecting..." |
| `RATE_LIMITED` | Backoff with longer delays | "Service busy. Please wait..." |

### Audio System
| Error Type | Recovery Action | User Experience |
|------------|----------------|-----------------|
| `MICROPHONE_ACCESS_DENIED` | Request permission + text fallback | "Enable microphone or continue with text" |
| `WEBRTC_CONNECTION_FAILED` | Retry + text mode fallback | "Audio failed. Switching to text mode..." |
| `SPEECH_RECOGNITION_FAILED` | Manual input option | "Speech unclear. Try again or type answer" |

### Service Integration
| Error Type | Recovery Action | User Experience |
|------------|----------------|-----------------|
| `OPENAI_SERVICE_ERROR` | Retry with backoff | "AI service temporarily unavailable" |
| `TTS_SERVICE_ERROR` | Text display mode | "Voice playback unavailable" |
| `DATABASE_ERROR` | Retry + local storage backup | "Saving locally. Will sync when restored" |

## 🎛️ Configuration Options

### Retry Configuration
```typescript
const customRetryConfig = interviewRetryManager.createCustomRetryConfig(
  5,      // maxAttempts
  2000,   // baseDelayMs
  {
    maxDelayMs: 30000,        // Maximum delay cap
    backoffFactor: 2,         // Exponential multiplier
    jitterMs: 1000,          // Random delay variation
    retryCondition: (error) => error.status !== 403  // Custom retry logic
  }
)
```

### Circuit Breaker Settings
```typescript
// Automatic circuit breaker for each service
// - Opens after 5 consecutive failures
// - Stays open for 60 seconds
// - Requires 3 successes to close
```

### State Persistence Settings
```typescript
// Auto-save interval: 10 seconds
// Browser storage: Immediate on critical changes
// Database backup: Every state change
// Cleanup: 5 seconds after interview completion
```

## 📊 Monitoring & Analytics

### Error Statistics
```typescript
const stats = interviewErrorHandler.getErrorStats()
console.log({
  totalErrors: stats.totalErrors,
  criticalErrors: stats.criticalErrors,
  errorsByType: stats.errorsByType,
  recentErrors: stats.recentErrors
})
```

### Connection Health
```typescript  
const status = interviewConnectionManager.getStatus()
console.log({
  mode: status.mode,                    // Current interview mode
  connectionStatus: status.connectionStatus,  // Connection health
  serviceHealth: status.serviceHealth,  // Individual service status
  recentEvents: status.recentEvents     // Connection change history
})
```

### Circuit Breaker Status
```typescript
const circuitStatus = interviewRetryManager.getCircuitBreakerStatus()
console.log(circuitStatus)
// {
//   'openai-whisper': { state: 'CLOSED', failureCount: 0 },
//   'elevenlabs-tts': { state: 'OPEN', failureCount: 7, lastFailureTime: 1625097600000 }
// }
```

## 🧪 Testing Error Scenarios

### Simulate Network Issues
```typescript
// Simulate network timeout
throw new Error('fetch timeout')

// Simulate rate limiting  
throw new Error('rate_limit_exceeded')

// Simulate API unavailability
fetch.mockRejectedValueOnce(new Error('Service unavailable'))
```

### Simulate Audio Issues
```typescript
// Simulate microphone access denied
navigator.mediaDevices.getUserMedia.mockRejectedValueOnce(
  new Error('NotAllowedError: Permission denied')
)

// Simulate WebRTC failure
throw new Error('WebRTC connection failed')
```

### Test State Recovery
```typescript
// Simulate browser refresh
window.location.reload()

// Simulate tab visibility change
Object.defineProperty(document, 'hidden', { value: true })
document.dispatchEvent(new Event('visibilitychange'))
```

## 📱 Production Considerations

### Performance Impact
- **Error Handler**: < 1ms per error (async processing)
- **State Manager**: 10ms auto-save interval (throttled)
- **Connection Monitor**: 15s health check interval
- **Memory Usage**: < 5MB for error logs (auto-cleanup)

### Browser Support
- **LocalStorage**: All modern browsers
- **MediaDevices API**: Chrome 53+, Firefox 36+, Safari 11+
- **WebRTC**: Chrome 56+, Firefox 44+, Safari 11+

### Security Considerations
- No sensitive data in client-side logs
- Authentication required for all API endpoints
- State encryption in production (recommended)
- CORS properly configured for health checks

## 🔄 Migration Guide

### From Basic Error Handling
1. Install new error handling system
2. Wrap interview components with error boundary
3. Replace try-catch blocks with managed handlers
4. Add state persistence to critical operations

### Integration Checklist
- [ ] Import error handling utilities
- [ ] Add error boundary components  
- [ ] Configure retry strategies
- [ ] Set up state persistence
- [ ] Test recovery scenarios
- [ ] Monitor error rates in production

## 🆘 Troubleshooting

### Common Issues

**State not persisting across page reloads:**
- Verify localStorage is enabled
- Check database connectivity
- Ensure sessionId consistency

**Circuit breaker always open:**
- Check service health endpoints
- Verify retry thresholds
- Reset circuit breaker if needed

**Audio recovery not working:**
- Verify microphone permissions
- Check WebRTC compatibility
- Test fallback modes

**High retry counts:**
- Review retry conditions
- Adjust backoff parameters
- Check service stability

For additional support, check the error logs in browser dev tools and server logs for detailed error context and recovery attempts.

---

*This error handling system provides enterprise-grade resilience for production interview platforms with real-time audio and AI integrations.*