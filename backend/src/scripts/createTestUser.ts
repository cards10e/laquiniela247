import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  const [,, email, password, firstName, lastName, role] = process.argv;
  
  if (!email || !password) {
    console.error('❌ Usage: tsx scripts/createTestUser.ts <email> <password> [firstName] [lastName] [role]');
    console.error('📝 Example: tsx scripts/createTestUser.ts test@example.com password123 John Doe USER');
    process.exit(1);
  }

  try {
    console.log(`👤 Creating test user: ${email}`);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log(`⚠️  User with email ${email} already exists`);
      return;
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: firstName || 'Test',
        lastName: lastName || null,
        role: (role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER') as any,
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

    console.log('✅ Test user created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    const displayName = lastName ? `${firstName || 'Test'} ${lastName}` : (firstName || 'Test');
    console.log(`👤 Name: ${displayName}`);
    console.log(`🛡️  Role: ${user.role}`);

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser(); 