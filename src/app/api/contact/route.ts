import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json()
    const { name, email, subject, message } = body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Get subject display name
    const subjectMap: { [key: string]: string } = {
      'general': 'General Inquiry',
      'technical': 'Technical Support',
      'billing': 'Billing & Subscriptions',
      'feature': 'Feature Request',
      'partnership': 'Partnership',
      'press': 'Press & Media'
    }

    const subjectDisplay = subjectMap[subject] || subject

    // Send email notification to you
    const emailContent = `
      <h2>New Contact Form Submission - Bir Guru</h2>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Contact Details</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subjectDisplay}</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
        <h3>Message</h3>
        <p style="white-space: pre-line; line-height: 1.6;">${message}</p>
      </div>
      
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
        <p><small>This email was sent from the Bir Guru contact form.</small></p>
      </div>
    `

    const emailResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: [process.env.CONTACT_NOTIFICATION_EMAIL!],
      subject: `Contact Form: ${subjectDisplay} - ${name}`,
      html: emailContent,
      replyTo: email
    })

    if (emailResult.error) {
      console.error('Error sending email:', emailResult.error)
      return NextResponse.json(
        { error: 'Failed to send message. Please try again.' },
        { status: 500 }
      )
    }

    // Send confirmation email to the user
    const confirmationContent = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Thank you for contacting us!</h1>
        </div>
        
        <div style="padding: 40px 20px; background-color: #ffffff;">
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">Hi ${name},</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            We've received your message about <strong>${subjectDisplay}</strong> and will get back to you as soon as possible.
          </p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Your Message:</h3>
            <p style="color: #4b5563; white-space: pre-line; line-height: 1.6;">${message}</p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Our typical response time is within 24 hours during business days.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Best regards,<br>
            <strong>The Bir Guru Team</strong>
          </p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; text-align: center;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            This is an automated confirmation email. Please do not reply to this message.
          </p>
        </div>
      </div>
    `

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: [email],
      subject: 'Thank you for contacting Bir Guru - We\'ve received your message',
      html: confirmationContent
    })

    return NextResponse.json(
      { success: true, message: 'Message sent successfully!' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    )
  }
}