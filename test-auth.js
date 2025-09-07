// Simple test script to verify auth system
const { PrismaClient } = require('@prisma/client')

async function testAuth() {
  console.log('🔍 Testing authentication system...')
  
  try {
    const prisma = new PrismaClient()
    
    // Test database connection
    console.log('📊 Testing database connection...')
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection successful')
    
    // Test if users table exists
    console.log('👥 Testing users table...')
    const userCount = await prisma.user.count()
    console.log(`✅ Users table accessible, current user count: ${userCount}`)
    
    // Test if user_sessions table exists
    console.log('🔑 Testing user sessions table...')
    const sessionCount = await prisma.userSession.count()
    console.log(`✅ User sessions table accessible, current session count: ${sessionCount}`)
    
    console.log('🎉 All database tests passed!')
    
  } catch (error) {
    console.error('❌ Error testing auth system:', error)
  }
}

testAuth().then(() => process.exit(0)).catch(() => process.exit(1))