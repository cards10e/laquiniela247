import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('🔍 Fetching all users from database...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${users.length} users:\n`);
    
    // Display users in a formatted table
    console.table(users.map(user => ({
      ID: user.id,
      Name: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A',
      Email: user.email,
      Role: user.role,
      'Created': user.createdAt.toLocaleDateString()
    })));

    console.log(`\n✅ Successfully listed ${users.length} users`);
    
  } catch (error) {
    console.error('❌ Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers(); 