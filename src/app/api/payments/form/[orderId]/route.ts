import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    // Find the payment record to get the stored form HTML
    const payment = await db.payment.findFirst({
      where: { orderId: orderId }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (!payment.formHtml) {
      return NextResponse.json({ error: 'Payment form not available' }, { status: 404 })
    }

    // Return the HTML form directly
    return new NextResponse(payment.formHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      }
    })
  } catch (error) {
    console.error('Error serving payment form:', error)
    return NextResponse.json(
      { error: 'Failed to serve payment form' },
      { status: 500 }
    )
  }
}