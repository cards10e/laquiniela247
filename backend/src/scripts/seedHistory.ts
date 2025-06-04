// DEMO MODE: This script always seeds the current week as weekNumber 99 (highest), status 'OPEN', with a future bettingDeadline and all games in the future and 'SCHEDULED'.
// 4-5 previous weeks are seeded as 'FINISHED' with sequentially lower week numbers, games, bets, and userPerformance for demo/admin only.
// Do NOT change the demo week number logic or delete/overwrite data for other users. This guarantees the demo always works, regardless of date.

import { PrismaClient, $Enums } from '@prisma/client';

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

  // DEMO: Always use weekNumber 99 as the current (OPEN) week
  const demoCurrentWeekNumber = 99;
  const weeksToSeed = 5;
  // Seed previous weeks (finished) and current week (open)
  for (let w = 0; w < weeksToSeed; w++) {
    const weekNumber = demoCurrentWeekNumber - (weeksToSeed - w - 1);
    let now = new Date();
    let weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1) - 7 * (weeksToSeed - w - 1)); // Monday
    weekStart.setHours(0, 0, 0, 0);
    let weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000); // Sunday 23:59:59
    let bettingDeadline = new Date(weekStart.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days after week start
    let status = w === weeksToSeed - 1 ? $Enums.WeekStatus.OPEN : $Enums.WeekStatus.FINISHED;
    if (status === $Enums.WeekStatus.OPEN) {
      weekStart = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hour from now
      weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000);
      bettingDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    }
    // Upsert week
    const week = await prisma.week.upsert({
      where: { weekNumber },
      update: { startDate: weekStart, endDate: weekEnd, bettingDeadline, status, season: String(weekStart.getFullYear()) },
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
    // Upsert (update or create) 6 games for this week
    const games = [];
    for (let i = 0; i < 6; i++) {
      const homeTeam = teams[i % teams.length];
      const awayTeam = teams[(i + 1) % teams.length];
      let matchDate = new Date(weekStart.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
      if (status === $Enums.WeekStatus.OPEN) {
        matchDate = new Date(Date.now() + (i + 2) * 60 * 60 * 1000); // 2, 3, 4... hours from now
      }
      let game = await prisma.game.findFirst({
        where: {
          weekNumber,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id
        }
      });
      if (game) {
        game = await prisma.game.update({
          where: { id: game.id },
          data: {
            matchDate,
            status: status === $Enums.WeekStatus.OPEN ? 'SCHEDULED' : 'FINISHED',
          }
        });
      } else {
        game = await prisma.game.create({
          data: {
            weekNumber,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            matchDate,
            status: status === $Enums.WeekStatus.OPEN ? 'SCHEDULED' : 'FINISHED',
          }
        });
      }
      games.push(game);
    }
    console.log(`  - Upserted 6 games for week ${weekNumber}`);
    // Remove existing bets and userPerformance for this week for demo/admin only
    for (const user of users) {
      await prisma.bet.deleteMany({ where: { userId: user.id, weekId: week.id } });
      await prisma.userPerformance.deleteMany({ where: { userId: user.id, weekId: week.id } });
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
          status: status === $Enums.WeekStatus.OPEN ? 'PENDING' : 'CALCULATED',
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

// Helper: ISO week number (Monday as start, matches backend expectations)
function getISOWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNum;
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 