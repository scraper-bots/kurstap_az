import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(): Promise<NextResponse> {
  // This is likely a browser navigation, provide helpful info
  return NextResponse.json({
    service: 'Bir Guru Text-to-Speech API',
    description: 'Converts text to natural speech using ElevenLabs for audio interviews',
    usage: {
      method: 'POST',
      endpoint: '/api/interview/speak',
      contentType: 'application/json',
      body: {
        text: 'The text you want to convert to speech'
      }
    },
    features: [
      'Natural voice synthesis',
      'Optimized for interview conversations',
      'Real-time audio generation'
    ],
    authentication: 'Requires valid user session',
    note: 'This API is used by the audio interview feature. Visit /interview to try it out!'
  }, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const logContext = {
    timestamp: new Date().toISOString(),
    userId: 'unknown',
    textLength: 0,
    hasElevenLabsKey: !!process.env.ELEVENLABS_API_KEY,
    keyLength: process.env.ELEVENLABS_API_KEY?.length || 0,
    environment: process.env.NODE_ENV || 'unknown',
    requestMethod: req.method,
    requestUrl: req.url,
    userAgent: req.headers.get('user-agent')?.substring(0, 50) || 'unknown'
  }

  try {
    console.log('🗣️ [TTS API] Starting speech synthesis request', logContext)

    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      console.error('❌ [TTS API] Authentication failed - no userId', logContext)
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    logContext.userId = userId
    console.log('✅ [TTS API] Authentication successful', logContext)

    const { text } = await req.json()
    
    if (!text || text.trim().length === 0) {
      console.error('❌ [TTS API] No text provided', logContext)
      return NextResponse.json({
        success: false,
        error: 'No text provided for speech synthesis'
      }, { status: 400 })
    }

    logContext.textLength = text.length
    console.log('✅ [TTS API] Text received', logContext)

    // Validate text length (ElevenLabs has limits)
    if (text.length > 5000) {
      console.error('❌ [TTS API] Text too long', logContext)
      return NextResponse.json({
        success: false,
        error: 'Text too long (max 5000 characters)'
      }, { status: 400 })
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('❌ [TTS API] ElevenLabs API key not configured', {
        ...logContext,
        availableEnvVars: Object.keys(process.env).filter(k => k.includes('ELEVEN')),
        nodeEnv: process.env.NODE_ENV,
        isProduction: process.env.NODE_ENV === 'production'
      })
      return NextResponse.json({
        success: false,
        error: 'Speech synthesis not configured',
        diagnostic: {
          environment: process.env.NODE_ENV,
          hasKey: false,
          timestamp: new Date().toISOString()
        }
      }, { status: 503 })
    }

    console.log(`Generating speech for text: "${text.slice(0, 100)}${text.length > 100 ? '...' : ''}"`)

    // Generate speech with ElevenLabs
    const elevenlabsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.2, // Slight style for more natural speech
          use_speaker_boost: true
        }
      })
    })

    if (!elevenlabsResponse.ok) {
      const errorText = await elevenlabsResponse.text()
      console.error('❌ [TTS API] ElevenLabs API error', {
        ...logContext,
        status: elevenlabsResponse.status,
        statusText: elevenlabsResponse.statusText,
        errorText: errorText.substring(0, 200)
      })
      
      if (elevenlabsResponse.status === 429) {
        return NextResponse.json({
          success: false,
          error: 'Speech service rate limited. Please wait a moment before trying again.'
        }, { status: 429 })
      }
      
      if (elevenlabsResponse.status === 401) {
        return NextResponse.json({
          success: false,
          error: 'Speech service authentication failed'
        }, { status: 503 })
      }
      
      if (elevenlabsResponse.status >= 500) {
        return NextResponse.json({
          success: false,
          error: 'Speech service temporarily unavailable'
        }, { status: 503 })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Failed to generate speech'
      }, { status: 500 })
    }

    // Get the audio data
    const audioBuffer = await elevenlabsResponse.arrayBuffer()
    
    console.log('✅ [TTS API] Generated speech audio successfully', {
      ...logContext,
      audioSize: audioBuffer.byteLength
    })

    // Return audio data directly
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('❌ [TTS API] Error generating speech', {
      ...logContext,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name
    })
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('rate_limit_exceeded') || error.message.includes('429')) {
        return NextResponse.json({
          success: false,
          error: 'Speech service rate limit exceeded. Please try again later.'
        }, { status: 429 })
      }
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return NextResponse.json({
          success: false,
          error: 'Network error. Please check your connection.'
        }, { status: 503 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to generate speech',
      diagnostic: {
        timestamp: new Date().toISOString(),
        userId: logContext.userId,
        textLength: logContext.textLength,
        hasElevenLabsKey: logContext.hasElevenLabsKey,
        errorType: error instanceof Error ? error.constructor.name : typeof error
      }
    }, { status: 500 })
  }
}