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

  // Create current week (Week 15, 2025)
  console.log('📅 Creating current week...');
  const currentWeek = await prisma.week.upsert({
    where: { weekNumber: 15 },
    update: {},
    create: {
      weekNumber: 15,
      season: '2025',
      startDate: new Date('2025-01-06T00:00:00Z'),
      endDate: new Date('2025-01-12T23:59:59Z'),
      bettingDeadline: new Date('2025-01-08T18:00:00Z'),
      status: 'OPEN'
    }
  });

  console.log('✅ Created current week');

  // Create sample games for current week
  console.log('⚽ Creating sample games...');
  const sampleGames = [
    {
      weekNumber: 15,
      homeTeamId: 1, // Necaxa
      awayTeamId: 2, // Querétaro
      matchDate: new Date('2025-01-07T19:00:00Z')
    },
    {
      weekNumber: 15,
      homeTeamId: 3, // Mazatlán
      awayTeamId: 4, // Atlas
      matchDate: new Date('2025-01-07T21:00:00Z')
    },
    {
      weekNumber: 15,
      homeTeamId: 5, // América
      awayTeamId: 6, // Chivas
      matchDate: new Date('2025-01-08T20:00:00Z')
    },
    {
      weekNumber: 15,
      homeTeamId: 7, // Cruz Azul
      awayTeamId: 8, // Pumas
      matchDate: new Date('2025-01-09T19:00:00Z')
    },
    {
      weekNumber: 15,
      homeTeamId: 9, // Tigres
      awayTeamId: 10, // Monterrey
      matchDate: new Date('2025-01-09T21:00:00Z')
    },
    {
      weekNumber: 15,
      homeTeamId: 11, // Santos
      awayTeamId: 12, // León
      matchDate: new Date('2025-01-10T19:00:00Z')
    },
    {
      weekNumber: 15,
      homeTeamId: 13, // Pachuca
      awayTeamId: 14, // Toluca
      matchDate: new Date('2025-01-10T21:00:00Z')
    },
    {
      weekNumber: 15,
      homeTeamId: 15, // Puebla
      awayTeamId: 16, // Juárez
      matchDate: new Date('2025-01-11T19:00:00Z')
    },
    {
      weekNumber: 15,
      homeTeamId: 17, // Tijuana
      awayTeamId: 18, // San Luis
      matchDate: new Date('2025-01-11T21:00:00Z')
    }
  ];

  for (const game of sampleGames) {
    // Try to find the game by weekNumber, homeTeamId, and awayTeamId
    const existingGame = await prisma.game.findFirst({
      where: {
        weekNumber: game.weekNumber,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId
      }
    });
    if (existingGame) {
      await prisma.game.update({ where: { id: existingGame.id }, data: game });
    } else {
      await prisma.game.create({ data: game });
    }
  }

  console.log(`✅ Created ${sampleGames.length} games`);

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

  // Create some sample bets for demo user
  console.log('🎯 Creating sample bets...');
  const games = await prisma.game.findMany({
    where: { weekNumber: 15 },
    take: 5
  });

  const samplePredictions = ['HOME', 'DRAW', 'AWAY', 'HOME', 'AWAY'];
  
  for (let i = 0; i < games.length; i++) {
    await prisma.bet.upsert({
      where: {
        userId_gameId: {
          userId: demoUser.id,
          gameId: games[i].id
        }
      },
      update: {},
      create: {
        userId: demoUser.id,
        weekId: currentWeek.id,
        gameId: games[i].id,
        prediction: samplePredictions[i] as any
      }
    });
  }

  console.log(`✅ Created ${games.length} sample bets`);

  // Create previous weeks with performance data
  console.log('📈 Creating historical data...');
  
  const previousWeeks = [
    { weekNumber: 14, percentage: 75.0, correct: 6, total: 8 },
    { weekNumber: 13, percentage: 62.5, correct: 5, total: 8 },
    { weekNumber: 12, percentage: 87.5, correct: 7, total: 8 },
    { weekNumber: 11, percentage: 50.0, correct: 4, total: 8 }
  ];

  for (const weekData of previousWeeks) {
    // Pad day with leading zero
    const startDay = String(weekData.weekNumber - 10).padStart(2, '0');
    const endDay = String(weekData.weekNumber - 9).padStart(2, '0');
    const week = await prisma.week.upsert({
      where: { weekNumber: weekData.weekNumber },
      update: {},
      create: {
        weekNumber: weekData.weekNumber,
        season: '2025',
        startDate: new Date(`2025-01-${startDay}T00:00:00Z`),
        endDate: new Date(`2025-01-${endDay}T23:59:59Z`),
        bettingDeadline: new Date(`2025-01-${endDay}T18:00:00Z`),
        status: 'FINISHED'
      }
    });

    await prisma.userPerformance.upsert({
      where: {
        userId_weekId: {
          userId: demoUser.id,
          weekId: week.id
        }
      },
      update: {},
      create: {
        userId: demoUser.id,
        weekId: week.id,
        totalPredictions: weekData.total,
        correctPredictions: weekData.correct,
        percentage: weekData.percentage,
        rankingPosition: Math.floor(Math.random() * 20) + 1,
        percentile: weekData.percentage,
        winnings: weekData.correct * 100,
        status: 'CALCULATED'
      }
    });
  }

  console.log('✅ Created historical performance data');

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