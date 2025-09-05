import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database using Clerk ID
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 2
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        clerkId: user.clerkId,
        email: user.email,
        interviewCredits: user.interviewCredits,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      payments: user.payments.map(p => ({
        id: p.id,
        orderId: p.orderId,
        amount: p.amount,
        status: p.status,
        description: p.description,
        createdAt: p.createdAt
      })),
      subscriptions: user.subscriptions.map(s => ({
        id: s.id,
        type: s.type,
        status: s.status,
        createdAt: s.createdAt
      }))
    })
  } catch (error) {
    console.error('Error fetching user status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user status' },
      { status: 500 }
    )
  }
}