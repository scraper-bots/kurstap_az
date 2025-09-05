import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { UsageService } from '@/lib/usage-service'

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const usageStats = await UsageService.getUserUsageStats(user.id)
    const upgradePrompts = await UsageService.getUpgradePrompts(user.id)

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