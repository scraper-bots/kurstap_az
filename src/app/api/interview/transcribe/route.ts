import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
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
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST to transcribe audio.',
    allowedMethods: ['POST', 'OPTIONS']
  }, { 
    status: 405,
    headers: {
      'Allow': 'POST, OPTIONS'
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