const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateToCredits() {
  console.log('🔄 Starting migration to credit-based system...')
  
  try {
    // Get all users with their current plan types
    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        planType: true,
        interviewCredits: true
      }
    })

    console.log(`📊 Found ${users.length} users to migrate`)

    let migratedCount = 0
    let alreadyMigratedCount = 0

    for (const user of users) {
      // Skip users who already have credits (already migrated)
      if (user.interviewCredits > 0) {
        console.log(`✅ User ${user.email} already has ${user.interviewCredits} credits`)
        alreadyMigratedCount++
        continue
      }

      // Convert plan types to credits
      let creditsToAdd = 0
      switch (user.planType) {
        case 'FREE':
          creditsToAdd = 0 // Free users get no credits
          break
        case 'BASIC':
          creditsToAdd = 1 // Basic users get 1 credit
          break
        case 'STANDARD':
          creditsToAdd = 5 // Standard users get 5 credits
          break
        case 'PREMIUM':
          creditsToAdd = 10 // Premium users get 10 credits (no longer unlimited)
          break
        default:
          creditsToAdd = 0
      }

      // Update user with credits and set to FREE plan
      await prisma.user.update({
        where: { id: user.id },
        data: {
          interviewCredits: creditsToAdd,
          planType: 'FREE' // All users are now FREE with credits
        }
      })

      console.log(`🔄 Migrated ${user.email}: ${user.planType} → ${creditsToAdd} credits`)
      migratedCount++
    }

    console.log(`\n✅ Migration completed!`)
    console.log(`📊 Statistics:`)
    console.log(`   - Users migrated: ${migratedCount}`)
    console.log(`   - Users already migrated: ${alreadyMigratedCount}`)
    console.log(`   - Total users: ${users.length}`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateToCredits()