import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Users to delete (all test users we created)
const usersToDelete = [
  'jim@laquiniela247.mx',
  'juancarlos@laquiniela247.mx',
  'dimitri@laquiniela247.mx'
];

// Users to preserve (never delete these)
const preserveUsers = [
  'demo@laquiniela247.mx',
  'admin@laquiniela247.mx'
];

async function cleanupTestUsers() {
  try {
    console.log('🧹 Cleaning up test users...');
    console.log(`🛡️  Preserving: ${preserveUsers.join(', ')}`);
    
    let deletedCount = 0;
    let notFoundCount = 0;

    for (const email of usersToDelete) {
      console.log(`\n🔍 Processing: ${email}`);
      
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          profile: true,
          bets: true,
          transactions: true,
          performance: true
        }
      });

      if (!user) {
        console.log(`⚠️  User not found, skipping...`);
        notFoundCount++;
        continue;
      }

      // Safety check - never delete preserved users
      if (preserveUsers.includes(email)) {
        console.log(`🛡️  Protected user, skipping deletion...`);
        continue;
      }

      // Delete user and all related data
      console.log(`🗑️  Deleting user and related data...`);
      
      // Delete in correct order due to foreign key constraints
      await prisma.userPerformance.deleteMany({ where: { userId: user.id } });
      await prisma.transaction.deleteMany({ where: { userId: user.id } });
      await prisma.bet.deleteMany({ where: { userId: user.id } });
      
      if (user.profile) {
        await prisma.userProfile.delete({ where: { userId: user.id } });
      }
      
      await prisma.user.delete({ where: { id: user.id } });
      
      console.log(`✅ Deleted: ${email}`);
      deletedCount++;
    }

    console.log('\n🎉 Cleanup completed!');
    console.log(`✅ Deleted: ${deletedCount} users`);
    console.log(`⚠️  Not found: ${notFoundCount} users`);
    console.log(`🛡️  Preserved: ${preserveUsers.length} users (demo & admin)`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestUsers(); 