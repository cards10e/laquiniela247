import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Liga MX teams
  console.log('📊 Creating teams...');
  const teams = [
    { name: 'Club Necaxa', shortName: 'NEC', logoUrl: 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/NECAXA.png' },
    { name: 'Querétaro FC', shortName: 'QRO', logoUrl: 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/QUERETARO-2.png' },
    { name: 'Mazatlán FC', shortName: 'MAZ', logoUrl: 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/MAZATLAN.png' },
    { name: 'Atlas FC', shortName: 'ATL', logoUrl: 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/ATLAS-1.png' },
    { name: 'Club América', shortName: 'AME', logoUrl: '' },
    { name: 'Chivas Guadalajara', shortName: 'CHI', logoUrl: '' },
    { name: 'Cruz Azul', shortName: 'CAZ', logoUrl: '' },
    { name: 'Pumas UNAM', shortName: 'PUM', logoUrl: '' },
    { name: 'Tigres UANL', shortName: 'TIG', logoUrl: '' },
    { name: 'Monterrey', shortName: 'MTY', logoUrl: '' },
    { name: 'Santos Laguna', shortName: 'SAN', logoUrl: '' },
    { name: 'León FC', shortName: 'LEO', logoUrl: '' },
    { name: 'Pachuca', shortName: 'PAC', logoUrl: '' },
    { name: 'Toluca FC', shortName: 'TOL', logoUrl: '' },
    { name: 'Puebla FC', shortName: 'PUE', logoUrl: '' },
    { name: 'FC Juárez', shortName: 'JUA', logoUrl: '' },
    { name: 'Tijuana', shortName: 'TIJ', logoUrl: '' },
    { name: 'Atlético San Luis', shortName: 'ASL', logoUrl: '' }
  ];

  for (const team of teams) {
    // Try to find the team by shortName
    const existingTeam = await prisma.team.findFirst({ where: { shortName: team.shortName } });
    if (existingTeam) {
      await prisma.team.update({ where: { id: existingTeam.id }, data: team });
    } else {
      await prisma.team.create({ data: team });
    }
  }

  console.log(`✅ Created ${teams.length} teams`);

  // DO NOT CREATE WEEK 99 OR ANY WEEKS/GAMES/BETS HERE.
  // All week/game/bet seeding is now handled by seedHistory.ts.

  // Create demo users
  console.log('👥 Creating demo users...');
  
  // Demo user
  const demoPasswordHash = await bcrypt.hash('demo123', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@laquiniela247.mx' },
    update: {},
    create: {
      email: 'demo@laquiniela247.mx',
      passwordHash: demoPasswordHash,
      firstName: 'Demo',
      lastName: 'User',
      role: 'USER',
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  // Create demo user profile
  await prisma.userProfile.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      totalBets: 24,
      totalCorrect: 16,
      overallPercentage: 66.67,
      totalWinnings: 2500.00,
      bestWeekPercentage: 85.00,
      bestRankingPosition: 5,
      preferredLanguage: 'es',
      favoriteTeamId: 5 // América
    }
  });

  // Admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@laquiniela247.mx' },
    update: {},
    create: {
      email: 'admin@laquiniela247.mx',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  // Create admin user profile
  await prisma.userProfile.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      totalBets: 0,
      totalCorrect: 0,
      overallPercentage: 0,
      totalWinnings: 0,
      bestWeekPercentage: 0,
      preferredLanguage: 'es'
    }
  });

  console.log('✅ Created demo and admin users');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('👤 Demo User: demo@laquiniela247.mx / demo123');
  console.log('🔧 Admin User: admin@laquiniela247.mx / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });