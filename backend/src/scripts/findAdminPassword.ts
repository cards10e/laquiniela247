import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findAdminPassword() {
  try {
    console.log('🔍 Searching for admin user...\n');

    // Find admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    if (!adminUser) {
      console.log('❌ No admin user found in the database');
      return;
    }

    console.log('👤 Admin User Found:');
    console.log('=====================================');
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`👤 Name: ${adminUser.firstName} ${adminUser.lastName}`);
    console.log(`🆔 ID: ${adminUser.id}`);
    console.log(`🛡️  Role: ${adminUser.role}`);
    console.log(`✅ Active: ${adminUser.isActive}`);
    console.log(`📅 Created: ${adminUser.createdAt}`);
    console.log(`🔐 Last Login: ${adminUser.lastLoginAt || 'Never'}`);
    console.log(`🔒 Password Hash: ${adminUser.passwordHash}`);
    
    console.log('\n💡 Password Information:');
    console.log('=====================================');
    console.log('⚠️  The password is hashed with bcrypt and cannot be reversed.');
    console.log('📝 To reset the admin password, use the reset script:');
    console.log('   npm run reset-admin-password -- admin@laquiniela247.mx newpassword123');
    
    // Check if there's a reset password script
    console.log('\n🛠️  Available password reset options:');
    console.log('1. Use the resetAdminPassword.ts script');
    console.log('2. Create a new admin user');
    console.log('3. Update the password hash directly in the database');

  } catch (error) {
    console.error('❌ Error finding admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findAdminPassword(); 