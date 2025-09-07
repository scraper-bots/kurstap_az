import { NextRequest, NextResponse } from 'next/server'
import { UsageService } from '@/lib/usage-service'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const usageStats = await UsageService.getUserUsageStats(userId)
    const upgradePrompts = await UsageService.getUpgradePrompts(userId)

    return NextResponse.json({
      ...usageStats,
      upgradePrompts
    })
  } catch (error) {
    console.error('Error fetching usage stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    )
  }
}