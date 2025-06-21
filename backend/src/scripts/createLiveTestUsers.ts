import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Live server test users with strong passwords
const liveTestUsers = [
  {
    email: 'jim@laquiniela247.mx',
    password: 'J1m$tr0ng2024!',
    firstName: 'Jim',
    lastName: '',
    role: 'USER'
  },
  {
    email: 'juancarlos@laquiniela247.mx', 
    password: 'JC$tr0ng2024!',
    firstName: 'Juan Carlos',
    lastName: '',
    role: 'USER'
  },
  {
    email: 'dimitri@laquiniela247.mx',
    password: 'D1m$tr0ng2024!', 
    firstName: 'Dimitri',
    lastName: '',
    role: 'USER'
  }
];

async function createLiveTestUsers() {
  try {
    console.log('👥 Creating test users for LIVE server...');
    console.log('🔒 Using strong passwords for production environment');
    
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    let created = 0;
    let skipped = 0;

    for (const userData of liveTestUsers) {
      console.log(`\n👤 Processing: ${userData.email}`);
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`⚠️  User already exists, skipping...`);
        skipped++;
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          passwordHash,
          firstName: userData.firstName,
          lastName: userData.lastName || null,
          role: userData.role as any,
          isActive: true,
          emailVerified: true,
          emailVerifiedAt: new Date()
        }
      });

      // Create user profile
      await prisma.userProfile.create({
        data: {
          userId: user.id,
          totalBets: 0,
          totalCorrect: 0,
          overallPercentage: 0,
          totalWinnings: 0,
          bestWeekPercentage: 0,
          preferredLanguage: 'es',
          emailNotifications: true
        }
      });

      const displayName = userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.firstName;
      console.log(`✅ Created: ${displayName}`);
      created++;
    }

    console.log('\n🎉 Live test user creation completed!');
    console.log(`✅ Created: ${created} users`);
    console.log(`⚠️  Skipped: ${skipped} users (already existed)`);
    
    if (created > 0) {
      console.log('\n📋 LIVE Test User Credentials (SECURE THESE):');
      liveTestUsers.forEach(user => {
        const displayName = user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
        console.log(`👤 ${displayName}: ${user.email} / ${user.password}`);
      });
      console.log('\n🔒 IMPORTANT: Store these credentials securely!');
    }

  } catch (error) {
    console.error('❌ Error creating live test users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createLiveTestUsers(); 