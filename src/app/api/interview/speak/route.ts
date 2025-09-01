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
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const { text } = await req.json()
    
    if (!text || text.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No text provided for speech synthesis'
      }, { status: 400 })
    }

    // Validate text length (ElevenLabs has limits)
    if (text.length > 5000) {
      return NextResponse.json({
        success: false,
        error: 'Text too long (max 5000 characters)'
      }, { status: 400 })
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      console.warn('ElevenLabs API key not configured, returning text-only response')
      return NextResponse.json({
        success: false,
        error: 'Speech synthesis not configured'
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
      console.error('ElevenLabs API error:', elevenlabsResponse.status, errorText)
      
      if (elevenlabsResponse.status === 429) {
        return NextResponse.json({
          success: false,
          error: 'Speech service temporarily unavailable. Please try again.'
        }, { status: 429 })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Failed to generate speech'
      }, { status: 500 })
    }

    // Get the audio data
    const audioBuffer = await elevenlabsResponse.arrayBuffer()
    
    console.log(`Generated speech audio: ${audioBuffer.byteLength} bytes`)

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
    console.error('Error generating speech:', error)
    
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
      error: 'Failed to generate speech'
    }, { status: 500 })
  }
}