// This script seeds 4-5 weeks of historical and current data for the following users ONLY:
// - Demo User: demo@laquiniela247.mx / demo123
// - Admin User: admin@laquiniela247.mx / admin123
// It will NOT create users, only seed data for these emails if they exist.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding historical and current data for the following users:');
  console.log('   - Demo User: demo@laquiniela247.mx / demo123');
  console.log('   - Admin User: admin@laquiniela247.mx / admin123');

  // Find demo and admin users
  const demoUser = await prisma.user.findUnique({ where: { email: 'demo@laquiniela247.mx' } });
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@laquiniela247.mx' } });
  if (!demoUser || !adminUser) {
    throw new Error('Demo or admin user not found. Please ensure they exist before running this script.');
  }
  const users = [demoUser, adminUser];

  // Get all teams
  const teams = await prisma.team.findMany();
  if (teams.length < 2) throw new Error('Not enough teams in DB.');

  // Calculate weeks (4 previous + current)
  const now = new Date();
  const weeksToSeed = 5;
  const weekLengthMs = 7 * 24 * 60 * 60 * 1000;
  const startOfCurrentWeek = new Date(now);
  startOfCurrentWeek.setHours(0, 0, 0, 0);
  startOfCurrentWeek.setDate(startOfCurrentWeek.getDate() - startOfCurrentWeek.getDay()); // Sunday as start

  for (let w = 0; w < weeksToSeed; w++) {
    const weekStart = new Date(startOfCurrentWeek.getTime() - (weeksToSeed - w - 1) * weekLengthMs);
    const weekEnd = new Date(weekStart.getTime() + weekLengthMs - 1);
    const bettingDeadline = new Date(weekStart.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days after week start
    const weekNumber = getISOWeekNumber(weekStart);
    const status = w === weeksToSeed - 1 ? 'OPEN' : 'FINISHED';
    // Upsert week
    const week = await prisma.week.upsert({
      where: { weekNumber },
      update: { startDate: weekStart, endDate: weekEnd, bettingDeadline, status },
      create: {
        weekNumber,
        season: String(weekStart.getFullYear()),
        startDate: weekStart,
        endDate: weekEnd,
        bettingDeadline,
        status,
      },
    });
    console.log(`✅ Week ${weekNumber} (${status}) seeded.`);

    // Remove existing games for this week
    await prisma.game.deleteMany({ where: { weekNumber } });
    // Create 6 games
    const games = [];
    for (let i = 0; i < 6; i++) {
      const homeTeam = teams[i % teams.length];
      const awayTeam = teams[(i + 1) % teams.length];
      const matchDate = new Date(weekStart.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
      const game = await prisma.game.create({
        data: {
          weekNumber,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          matchDate,
          status: status === 'OPEN' ? 'SCHEDULED' : 'FINISHED',
        },
      });
      games.push(game);
    }
    console.log(`  - Created 6 games for week ${weekNumber}`);

    // Remove existing bets and userPerformance for this week for demo/admin
    for (const user of users) {
      await prisma.bet.deleteMany({
        where: {
          userId: user.id,
          weekId: week.id,
        },
      });
      await prisma.userPerformance.deleteMany({
        where: {
          userId: user.id,
          weekId: week.id,
        },
      });
    }

    // Create bets and userPerformance for each user
    for (const user of users) {
      let correct = 0;
      for (let i = 0; i < games.length; i++) {
        const prediction = ['HOME', 'DRAW', 'AWAY'][i % 3] as any;
        const isCorrect = w !== weeksToSeed - 1 ? i % 2 === 0 : null; // Only mark as correct for finished weeks
        if (isCorrect) correct++;
        await prisma.bet.create({
          data: {
            userId: user.id,
            weekId: week.id,
            gameId: games[i].id,
            prediction,
            isCorrect,
          },
        });
      }
      // User performance
      await prisma.userPerformance.create({
        data: {
          userId: user.id,
          weekId: week.id,
          totalPredictions: games.length,
          correctPredictions: correct,
          percentage: (correct / games.length) * 100,
          rankingPosition: Math.floor(Math.random() * 20) + 1,
          percentile: (correct / games.length) * 100,
          winnings: correct * 200,
          status: status === 'OPEN' ? 'PENDING' : 'CALCULATED',
        },
      });
      console.log(`    - Bets and performance for ${user.email} (week ${weekNumber}) seeded.`);
    }
  }

  // Update user profiles
  for (const user of users) {
    const totalBets = await prisma.bet.count({ where: { userId: user.id } });
    const totalCorrect = await prisma.bet.count({ where: { userId: user.id, isCorrect: true } });
    const totalWinnings = totalCorrect * 200;
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        totalBets,
        totalCorrect,
        overallPercentage: totalBets > 0 ? (totalCorrect / totalBets) * 100 : 0,
        totalWinnings,
        bestWeekPercentage: 100,
        bestRankingPosition: 1,
      },
    });
    console.log(`✅ Updated profile for ${user.email}`);
  }

  console.log('🎉 Historical/current seeding complete!');
}

// Helper: ISO week number (simple version, Sunday as start)
function getISOWeekNumber(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = (date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return Math.floor(diff / 7) + 1;
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 