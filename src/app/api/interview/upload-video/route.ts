import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile } from 'fs/promises'
import { mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const interviewId = formData.get('interviewId') as string

    if (!videoFile) {
      return NextResponse.json({
        success: false,
        error: 'No video file provided'
      }, { status: 400 })
    }

    if (!interviewId) {
      return NextResponse.json({
        success: false,
        error: 'Interview ID is required'
      }, { status: 400 })
    }

    // Validate file size (max 100MB for video)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (videoFile.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'Video file too large (max 100MB)'
      }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['video/webm', 'video/mp4', 'video/quicktime']
    if (!allowedTypes.includes(videoFile.type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid video format. Supported: WebM, MP4, QuickTime'
      }, { status: 400 })
    }

    console.log(`📹 Uploading video: ${videoFile.name}, size: ${videoFile.size} bytes`)

    // Verify interview exists and belongs to user
    const interview = await db.interview.findFirst({
      where: {
        id: interviewId,
        userId: userId
      }
    })

    if (!interview) {
      return NextResponse.json({
        success: false,
        error: 'Interview not found or unauthorized'
      }, { status: 404 })
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', 'videos')
    
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch {
      // Directory might already exist, that's okay
      console.log('Upload directory already exists or created')
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = videoFile.name.split('.').pop() || 'webm'
    const fileName = `interview_${interviewId}_${timestamp}.${fileExtension}`
    const filePath = path.join(uploadDir, fileName)

    // Save file to disk
    const videoBuffer = await videoFile.arrayBuffer()
    await writeFile(filePath, Buffer.from(videoBuffer))

    // Generate URL for accessing the video
    // In production, you would upload to S3/CloudStorage and get a URL
    const videoUrl = `/uploads/videos/${fileName}`

    // Update interview record with video URL
    await db.interview.update({
      where: {
        id: interviewId
      },
      data: {
        videoUrl: videoUrl,
        updatedAt: new Date()
      }
    })

    console.log(`✅ Video uploaded successfully: ${fileName}`)

    return NextResponse.json({
      success: true,
      videoUrl,
      uploadId: `upload_${timestamp}`,
      message: 'Video uploaded successfully'
    })

  } catch (error) {
    console.error('❌ Error uploading video:', error)
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('ENOSPC')) {
        return NextResponse.json({
          success: false,
          error: 'Server storage full. Please try again later.'
        }, { status: 507 })
      }
      
      if (error.message.includes('EACCES')) {
        return NextResponse.json({
          success: false,
          error: 'Server permission error. Please contact support.'
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to upload video. Please try again.'
    }, { status: 500 })
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}