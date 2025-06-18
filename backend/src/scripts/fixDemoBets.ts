import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDemoBets() {
  try {
    console.log('🔧 Fixing demo user bet types...');
    
    // Find demo user
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@laquiniela247.mx' }
    });
    
    if (!demoUser) {
      console.log('❌ Demo user not found');
      return;
    }
    
    console.log(`📧 Found demo user: ${demoUser.email} (ID: ${demoUser.id})`);
    
    // Find all demo user bets and their week info
    const demoBets = await prisma.bet.findMany({
      where: { userId: demoUser.id },
      include: {
        week: true,
        game: {
          include: {
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } }
          }
        }
      }
    });
    
    console.log(`🎯 Found ${demoBets.length} bets for demo user`);
    
    if (demoBets.length === 0) {
      console.log('✅ No bets to fix');
      return;
    }
    
    // Group bets by week to identify parlay patterns
    const betsByWeek = demoBets.reduce((acc, bet) => {
      const weekId = bet.weekId;
      if (!acc[weekId]) {
        acc[weekId] = [];
      }
      acc[weekId].push(bet);
      return acc;
    }, {} as Record<number, typeof demoBets>);
    
    console.log(`📅 Found bets in ${Object.keys(betsByWeek).length} different weeks`);
    
    for (const [weekId, weekBets] of Object.entries(betsByWeek)) {
      const week = weekBets[0].week;
      console.log(`\n📊 Week ${week.weekNumber}: ${weekBets.length} bets`);
      
      // Get total games in this week
      const totalGames = await prisma.game.count({
        where: { weekNumber: week.weekNumber }
      });
      
      // If user bet on all games in a week, classify as parlay
      if (weekBets.length === totalGames && totalGames > 1) {
        console.log(`   🎯 ${weekBets.length}/${totalGames} games → PARLAY`);
        
        // Update all bets in this week to parlay
        const updateResult = await prisma.bet.updateMany({
          where: {
            userId: demoUser.id,
            weekId: parseInt(weekId)
          },
          data: {
            betType: 'PARLAY'
          }
        });
        
        console.log(`   ✅ Updated ${updateResult.count} bets to parlay`);
      } else {
        console.log(`   🎯 ${weekBets.length}/${totalGames} games → SINGLE`);
        
        // Update to single bets
        const updateResult = await prisma.bet.updateMany({
          where: {
            userId: demoUser.id,
            weekId: parseInt(weekId)
          },
          data: {
            betType: 'SINGLE'
          }
        });
        
        console.log(`   ✅ Updated ${updateResult.count} bets to single`);
      }
    }
    
    console.log('\n🎉 Demo user bet types fixed!');
    
  } catch (error) {
    console.error('❌ Error fixing demo bets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  fixDemoBets();
} 