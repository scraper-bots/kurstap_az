import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

// Admin endpoint for payment analytics
export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = user.emailAddresses?.[0]?.emailAddress?.endsWith('@bir.guru') || false
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get payment analytics
    const [
      totalRevenue,
      monthlyRevenue,
      paymentStats,
      creditPaymentStats,
      recentPayments
    ] = await Promise.all([
      // Total revenue
      db.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      
      // Monthly revenue (last 30 days)
      db.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: { amount: true }
      }),

      // Payment status stats
      db.payment.groupBy({
        by: ['status'],
        _count: { status: true }
      }),

      // Credit-based payments stats
      db.payment.aggregate({
        where: { status: 'COMPLETED' },
        _count: { id: true },
        _sum: { amount: true }
      }),

      // Recent payments (last 10)
      db.payment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { email: true, firstName: true, lastName: true }
          }
        }
      })
    ])

    const analytics = {
      revenue: {
        total: totalRevenue._sum.amount || 0,
        monthly: monthlyRevenue._sum.amount || 0
      },
      payments: {
        statusBreakdown: paymentStats.map(stat => ({
          status: stat.status,
          count: stat._count.status
        })),
        creditStats: {
          totalPayments: creditPaymentStats._count.id,
          totalRevenue: creditPaymentStats._sum.amount || 0
        }
      },
      recentPayments: recentPayments.map(payment => ({
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        status: payment.status,
        userEmail: payment.user.email,
        createdAt: payment.createdAt
      }))
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching payment analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}