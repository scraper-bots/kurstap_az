import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { UserService } from '@/lib/user-service'

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

// Handle build-time or missing webhook secret gracefully
if (!webhookSecret && process.env.NODE_ENV !== 'production') {
  console.warn('CLERK_WEBHOOK_SECRET not set - webhooks will not work')
}

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error('Missing CLERK_WEBHOOK_SECRET environment variable')
    return new NextResponse('Missing webhook secret', { status: 500 })
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret
  const wh = new Webhook(webhookSecret)

  let evt: { type: string; data: Record<string, unknown> }

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as unknown as { type: string; data: Record<string, unknown> }
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new NextResponse('Error occured', {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type
  console.log('Clerk webhook event:', eventType)

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data as { id: string; email_addresses: Array<{ email_address: string }>; first_name?: string; last_name?: string; image_url?: string })
        break
      case 'user.updated':
        await handleUserUpdated(evt.data as { id: string; email_addresses: Array<{ email_address: string }>; first_name?: string; last_name?: string; image_url?: string })
        break
      case 'user.deleted':
        await handleUserDeleted(evt.data as { id: string })
        break
      default:
        console.log('Unhandled webhook event:', eventType)
    }
  } catch (error) {
    console.error('Error handling webhook event:', error)
    return new NextResponse('Error processing webhook', { status: 500 })
  }

  return new NextResponse('Webhook processed successfully', { status: 200 })
}

async function handleUserCreated(userData: { id: string; email_addresses: Array<{ email_address: string }>; first_name?: string; last_name?: string; image_url?: string }) {
  console.log('Creating user:', userData.id)
  
  await UserService.createUser({
    clerkId: userData.id,
    email: userData.email_addresses[0]?.email_address || '',
    firstName: userData.first_name,
    lastName: userData.last_name,
    imageUrl: userData.image_url,
  })
}

async function handleUserUpdated(userData: { id: string; email_addresses: Array<{ email_address: string }>; first_name?: string; last_name?: string; image_url?: string }) {
  console.log('Updating user:', userData.id)
  
  await UserService.updateUser(userData.id, {
    clerkId: userData.id,
    email: userData.email_addresses[0]?.email_address || '',
    firstName: userData.first_name,
    lastName: userData.last_name,
    imageUrl: userData.image_url,
  })
}

async function handleUserDeleted(userData: { id: string }) {
  console.log('Deleting user:', userData.id)
  
  await UserService.deleteUser(userData.id)
}