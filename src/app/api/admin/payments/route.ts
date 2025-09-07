import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PaymentStatus } from '@prisma/client'

// Admin endpoint to view all payments (requires admin role)
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const userEmail = request.headers.get('x-user-email')
    const userRole = request.headers.get('x-user-role')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = userEmail?.endsWith('@bir.guru') || userRole === 'admin' || false
    
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