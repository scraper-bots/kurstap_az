import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// For App Router, use runtime config
export const runtime = 'nodejs'
export const maxDuration = 120 // 120 seconds for real AI video processing

export async function POST(request: NextRequest) {
  try {
    console.log('🎥 Video analysis request received')
    
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const sessionId = formData.get('sessionId') as string

    console.log('📁 Form data parsed:', {
      hasVideoFile: !!videoFile,
      videoSize: videoFile?.size ? `${Math.round(videoFile.size / 1024 / 1024)}MB` : 'unknown',
      sessionId: sessionId || 'missing'
    })

    if (!videoFile || !sessionId) {
      console.error('❌ Missing required fields')
      return NextResponse.json(
        { success: false, error: 'Video file and session ID are required' },
        { status: 400 }
      )
    }

    // Check file size limit (25MB)
    const maxSize = 25 * 1024 * 1024
    if (videoFile.size > maxSize) {
      console.error('❌ File too large:', `${Math.round(videoFile.size / 1024 / 1024)}MB`)
      return NextResponse.json(
        { success: false, error: `Video file too large. Maximum size is 25MB.` },
        { status: 413 }
      )
    }

    console.log('🎵 Extracting audio from video for transcription')
    
    // Convert video to buffer for audio extraction
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer())
    
    // Create audio file from video for Whisper processing
    const audioFile = new File([videoBuffer], 'recording.webm', { type: 'audio/webm' })
    
    console.log('🎤 Sending to OpenAI Whisper for transcription')
    const transcriptionResponse = await Promise.race([
      openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en',
        response_format: 'text'
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transcription timeout')), 90000)
      )
    ]) as string

    const transcript = transcriptionResponse || 'No speech detected in the recording.'
    console.log('✅ Transcription completed:', transcript.length + ' characters')
    
    if (transcript.length < 10) {
      throw new Error('No meaningful speech detected in the recording. Please speak clearly and try again.')
    }

    console.log('🧠 Analyzing emotions and communication patterns with AI')
    
    // Analyze emotions and communication style from actual transcript
    const emotionAnalysisPrompt = `Analyze this interview response for emotions and communication patterns. 
Return ONLY a valid JSON object with these exact fields:
{
  "emotions": ["array of detected emotions like confident, nervous, enthusiastic, etc."],
  "confidence_level": "number from 1-100",
  "communication_clarity": "number from 1-100", 
  "key_points": ["array of main points mentioned"],
  "overall_sentiment": "positive/neutral/negative"
}

Interview transcript: "${transcript}"`

    const emotionResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: emotionAnalysisPrompt }],
      temperature: 0.3,
      max_tokens: 500
    })

    let emotionAnalysis
    try {
      const content = emotionResponse.choices[0].message.content || '{}'
      emotionAnalysis = JSON.parse(content)
      console.log('✅ Emotion analysis completed')
    } catch (parseError) {
      console.error('❌ Error parsing emotion analysis:', parseError)
      throw new Error('Failed to analyze emotions from transcript')
    }

    console.log('📝 Generating detailed interview feedback with AI')
    
    // Generate comprehensive video analysis based on actual transcript
    const videoAnalysisPrompt = `Based on this interview response transcript, provide detailed constructive feedback focusing on:

1. Content quality and relevance to the question
2. Communication effectiveness and clarity  
3. Specific strengths demonstrated
4. Areas for improvement with actionable suggestions
5. Overall assessment of the response

Keep feedback professional, specific, and actionable. Format as structured text.

Interview transcript: "${transcript}"`

    const analysisResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: videoAnalysisPrompt }],
      temperature: 0.5,
      max_tokens: 800
    })

    const videoAnalysis = analysisResponse.choices[0].message.content || 'Analysis could not be completed.'
    console.log('✅ Video analysis feedback generated')

    return NextResponse.json({
      success: true,
      transcript,
      emotions: emotionAnalysis,
      analysis: videoAnalysis,
      sessionId
    })

  } catch (error) {
    console.error('Error analyzing video:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to analyze video' 
      },
      { status: 500 }
    )
  }
}