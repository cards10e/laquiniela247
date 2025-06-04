import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Liga MX teams with valid logo URLs for all
  console.log('📊 Creating teams...');
  const logoMap: Record<string, string> = {
    'NEC': 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/NECAXA.png',
    'QRO': 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/QUERETARO-2.png',
    'MAZ': 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/MAZATLAN.png',
    'ATL': 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/ATLAS-1.png',
    'AME': 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/AMERICA.png',
    'CHI': 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/CHIVAS.png',
    'CAZ': 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/CRUZAZUL.png',
    'PUM': 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/PUMAS.png',
    'TIG': 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/TIGRES.png',
    'MTY': 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/MONTERREY.png',
    'SAN': 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/SANTOS.png',
    'LEO': 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/LEON.png',
    'PAC': 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/PACHUCA.png',
    'TOL': 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/TOLUCA.png',
    'PUE': 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/PUEBLA.png',
    'JUA': 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/JUAREZ.png',
    'TIJ': 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/TIJUANA.png',
    'ASL': 'https://www.laquiniela247.mx/wp-content/uploads/2025/04/SANLUIS.png',
  };
  const teams = [
    { name: 'Club Necaxa', shortName: 'NEC' },
    { name: 'Querétaro FC', shortName: 'QRO' },
    { name: 'Mazatlán FC', shortName: 'MAZ' },
    { name: 'Atlas FC', shortName: 'ATL' },
    { name: 'Club América', shortName: 'AME' },
    { name: 'Chivas Guadalajara', shortName: 'CHI' },
    { name: 'Cruz Azul', shortName: 'CAZ' },
    { name: 'Pumas UNAM', shortName: 'PUM' },
    { name: 'Tigres UANL', shortName: 'TIG' },
    { name: 'Monterrey', shortName: 'MTY' },
    { name: 'Santos Laguna', shortName: 'SAN' },
    { name: 'León FC', shortName: 'LEO' },
    { name: 'Pachuca', shortName: 'PAC' },
    { name: 'Toluca FC', shortName: 'TOL' },
    { name: 'Puebla FC', shortName: 'PUE' },
    { name: 'FC Juárez', shortName: 'JUA' },
    { name: 'Tijuana', shortName: 'TIJ' },
    { name: 'Atlético San Luis', shortName: 'ASL' },
  ];
  for (const team of teams) {
    const logoUrl = logoMap[team.shortName] || '';
    const existingTeam = await prisma.team.findFirst({ where: { shortName: team.shortName } });
    if (existingTeam) {
      await prisma.team.update({ where: { id: existingTeam.id }, data: { ...team, logoUrl } });
    } else {
      await prisma.team.create({ data: { ...team, logoUrl } });
    }
  }
  console.log(`✅ Created ${teams.length} teams with valid logo URLs`);

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