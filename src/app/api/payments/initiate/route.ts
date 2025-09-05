import { NextResponse } from 'next/server'

// DEPRECATED: This route has been replaced by /api/payments/initiate-credits
// All payments are now credit-based, not plan-based
export async function POST() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Please use /api/payments/initiate-credits for credit-based payments.' 
    },
    { status: 410 } // 410 Gone status for deprecated endpoints
  )
}