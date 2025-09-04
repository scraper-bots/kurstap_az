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

    console.log('Looking for payment with orderId:', orderId)
    console.log('Payment found:', !!payment)
    console.log('Payment has formHtml:', !!payment?.formHtml)

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (!payment.formHtml) {
      console.log('Payment record exists but no formHtml:', {
        id: payment.id,
        orderId: payment.orderId,
        status: payment.status,
        transactionId: payment.transactionId
      })
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