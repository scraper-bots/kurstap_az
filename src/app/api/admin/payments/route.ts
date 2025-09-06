import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { PaymentStatus } from '@prisma/client'

// Admin endpoint to view all payments (requires admin role)
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (you'll need to implement admin role checking)
    // This is a placeholder - implement your admin authorization logic
    const isAdmin = user.emailAddresses?.[0]?.emailAddress?.endsWith('@bir.guru') || false
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const planType = searchParams.get('planType')

    const skip = (page - 1) * limit

    const where: { status?: PaymentStatus; planType?: string } = {}
    if (status) where.status = status as PaymentStatus
    if (planType) where.planType = planType

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.payment.count({ where })
    ])

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}