import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(): Promise<NextResponse> {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check environment variables
    if (!process.env.DAILY_API_KEY || !process.env.DAILY_DOMAIN) {
      console.error('Missing Daily.co environment variables:', {
        hasApiKey: !!process.env.DAILY_API_KEY,
        hasDomain: !!process.env.DAILY_DOMAIN
      })
      return NextResponse.json(
        { success: false, error: 'Daily.co configuration missing. Check environment variables.' },
        { status: 500 }
      )
    }

    // Create room using Daily.co API
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DAILY_API_KEY}`
      },
      body: JSON.stringify({
        name: `interview-${userId}-${Date.now()}`,
        privacy: 'private',
        properties: {
          max_participants: 2, // User + Pipecat AI bot
          enable_recording: 'cloud',
          enable_transcription: false, // Using Whisper instead
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
          // Pipecat-specific configurations for audio-only interviews
          enable_screenshare: false,
          enable_chat: false,
          enable_knocking: false,
          enable_prejoin_ui: false,
          start_audio_off: false,
          start_video_off: true,
          // Enhanced audio settings for better voice quality
          enable_network_ui: false,
          enable_noise_cancellation_ui: false
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Daily.co API error:', response.status, errorText)
      return NextResponse.json(
        { success: false, error: `Failed to create room: ${response.status} ${response.statusText}` },
        { status: 500 }
      )
    }

    const room = await response.json()
    console.log('Created Daily.co room:', room.name)
    
    // Create meeting token for secure access to private room
    const tokenResponse = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DAILY_API_KEY}`
      },
      body: JSON.stringify({
        properties: {
          room_name: room.name,
          user_name: `User-${userId.substring(0, 8)}`, // Short user identifier
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
          is_owner: true, // Give user owner permissions
          enable_screenshare: false,
          start_audio_off: false,
          start_video_off: true
        }
      })
    })

    if (!tokenResponse.ok) {
      const tokenErrorText = await tokenResponse.text()
      console.error('Daily.co token creation error:', tokenResponse.status, tokenErrorText)
      return NextResponse.json(
        { success: false, error: `Failed to create meeting token: ${tokenResponse.status}` },
        { status: 500 }
      )
    }

    const tokenData = await tokenResponse.json()
    console.log('Created meeting token for room:', room.name)
    
    // Return the room URL using the new domain format
    const roomUrl = `https://${process.env.DAILY_DOMAIN}.daily.co/${room.name}`
    
    return NextResponse.json({
      success: true,
      data: {
        roomUrl,
        roomName: room.name,
        domain: process.env.DAILY_DOMAIN,
        token: tokenData.token
      }
    })

  } catch (error) {
    console.error('Error creating Daily.co room:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create interview room'
      },
      { status: 500 }
    )
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Daily.co Room Creation API',
    description: 'POST to this endpoint to create a new Daily.co room for audio interviews',
    usage: {
      method: 'POST',
      authentication: 'Required (Clerk)',
      response: {
        success: 'boolean',
        data: {
          roomUrl: 'string',
          roomName: 'string',
          domain: 'string'
        }
      }
    }
  })
}