import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
    service: 'Bir Guru Speech-to-Text API',
    description: 'Transcribes audio to text using OpenAI Whisper for audio interviews',
    usage: {
      method: 'POST',
      endpoint: '/api/interview/transcribe',
      contentType: 'multipart/form-data',
      body: {
        audio: 'Audio file (webm, mp3, wav, etc.) - max 25MB'
      }
    },
    features: [
      'High-accuracy speech recognition',
      'Real-time transcription for interviews',
      'Supports multiple audio formats',
      'Optimized for conversational speech'
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
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Get the audio file from the request
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json({
        success: false,
        error: 'No audio file provided'
      }, { status: 400 })
    }

    // Validate file size (max 25MB for Whisper)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: 'Audio file too large (max 25MB)'
      }, { status: 400 })
    }

    console.log(`Transcribing audio: ${audioFile.name}, size: ${audioFile.size} bytes`)

    // Convert File to compatible format for OpenAI
    const audioBuffer = await audioFile.arrayBuffer()
    const audioBlob = new Blob([audioBuffer], { type: audioFile.type })
    
    // Create a File object for OpenAI
    const openaiFile = new File([audioBlob], audioFile.name || 'audio.webm', {
      type: audioFile.type || 'audio/webm'
    })

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: openaiFile,
      model: 'whisper-1',
      language: 'en', // Set to English for interview context
      temperature: 0.2, // Lower temperature for more accurate transcription
      response_format: 'json'
    })

    const transcript = transcription.text?.trim() || ''
    
    console.log(`Transcription result: "${transcript}"`)

    return NextResponse.json({
      success: true,
      transcript,
      duration: audioFile.size > 0 ? 'detected' : 'unknown'
    })

  } catch (error) {
    console.error('Error transcribing audio:', error)
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('rate_limit_exceeded')) {
        return NextResponse.json({
          success: false,
          error: 'Transcription service temporarily unavailable. Please try again.'
        }, { status: 429 })
      }
      
      if (error.message.includes('invalid_request_error')) {
        return NextResponse.json({
          success: false,
          error: 'Invalid audio format. Please try again.'
        }, { status: 400 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to transcribe audio'
    }, { status: 500 })
  }
}