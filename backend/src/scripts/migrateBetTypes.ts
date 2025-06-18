import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface BetAnalysis {
  userId: number;
  weekId: number;
  betCount: number;
  totalGamesInWeek: number;
  firstBetTime: Date;
  lastBetTime: Date;
  timeSpanMinutes: number;
  likelyType: 'PARLAY' | 'SINGLE'; // Use uppercase to match Prisma TypeScript enum
  reasoning: string;
}

async function analyzeBets(): Promise<BetAnalysis[]> {
  console.log('🔍 Analyzing existing bets to determine likely types...');
  
  try {
    // Get all bets grouped by user and week
    const betGroups = await prisma.$queryRaw<any[]>`
      SELECT 
        b.user_id as userId,
        b.week_id as weekId,
        COUNT(*) as betCount,
        MIN(b.created_at) as firstBetTime,
        MAX(b.created_at) as lastBetTime,
        TIMESTAMPDIFF(MINUTE, MIN(b.created_at), MAX(b.created_at)) as timeSpanMinutes
      FROM bets b
      GROUP BY b.user_id, b.week_id
      ORDER BY b.user_id, b.week_id
    `;

    // Handle empty database case
    if (betGroups.length === 0) {
      console.log('📊 No existing bets found - migration will only add database schema');
      return [];
    }

    const analyses: BetAnalysis[] = [];

    for (const group of betGroups) {
      // Get total games in that week
      const week = await prisma.week.findUnique({
        where: { id: group.weekId },
        include: { games: true }
      });

      if (!week) {
        console.log(`⚠️  Warning: Week ${group.weekId} not found, skipping bet analysis`);
        continue;
      }

      const totalGamesInWeek = week.games.length;
      const timeSpanMinutes = group.timeSpanMinutes || 0;
      
      // Determine likely bet type based on heuristics
      let likelyType: 'PARLAY' | 'SINGLE';
      let reasoning: string;

      const betCount = Number(group.betCount);
      if (betCount === totalGamesInWeek && timeSpanMinutes <= 5) {
        // User bet on ALL games within 5 minutes = likely PARLAY
        likelyType = 'PARLAY';
        reasoning = `All ${totalGamesInWeek} games bet within ${timeSpanMinutes} minutes`;
      } else if (betCount === totalGamesInWeek && timeSpanMinutes <= 60) {
        // All games within 1 hour = probably PARLAY
        likelyType = 'PARLAY';
        reasoning = `All ${totalGamesInWeek} games bet within ${timeSpanMinutes} minutes (likely batch)`;
      } else {
        // Partial games or spread over time = SINGLE bets
        likelyType = 'SINGLE';
        reasoning = `${betCount}/${totalGamesInWeek} games over ${timeSpanMinutes} minutes (individual bets)`;
      }

      analyses.push({
        userId: group.userId,
        weekId: group.weekId,
        betCount: betCount,
        totalGamesInWeek,
        firstBetTime: group.firstBetTime,
        lastBetTime: group.lastBetTime,
        timeSpanMinutes,
        likelyType,
        reasoning
      });
    }

    return analyses;
  } catch (error) {
    console.error('❌ Error analyzing bets:', error);
    throw error;
  }
}

async function runMigration(dryRun: boolean = true) {
  try {
    console.log('🚀 Starting Bet Type Migration...');
    console.log(`📋 Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE MIGRATION'}`);
    
    // Step 1: Check if bet_type column exists
    console.log('\n🔍 Checking if bet_type column exists...');
    
    try {
      const columnCheck = await prisma.$queryRaw<any[]>`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'bets' 
        AND COLUMN_NAME = 'bet_type'
      `;
      
      if (columnCheck.length === 0) {
        console.log('🔧 bet_type column does not exist, creating it...');
        
        if (!dryRun) {
          await prisma.$executeRaw`
            ALTER TABLE bets 
            ADD COLUMN bet_type ENUM('single', 'parlay') NOT NULL DEFAULT 'single'
          `;
          console.log('✅ bet_type column added successfully');
        } else {
          console.log('📋 DRY RUN: Would add bet_type column');
        }
      } else {
        console.log('✅ bet_type column already exists');
      }
    } catch (error) {
      console.error('❌ Error checking/adding bet_type column:', error);
      throw error;
    }
    
    // Step 2: Analyze existing bets
    const analyses = await analyzeBets();
    
    console.log(`\n📊 Analysis Results: ${analyses.length} user-week combinations found`);
    
    let parlayGroups = 0;
    let singleGroups = 0;
    let totalBets = 0;

    analyses.forEach(analysis => {
      console.log(`  User ${analysis.userId}, Week ${analysis.weekId}: ${analysis.likelyType} - ${analysis.reasoning}`);
      if (analysis.likelyType === 'PARLAY') {
        parlayGroups++;
      } else {
        singleGroups++;
      }
      totalBets += Number(analysis.betCount);
    });

    console.log(`\n📈 Summary:`);
    console.log(`  Total bets to migrate: ${totalBets}`);
    console.log(`  Likely PARLAY groups: ${parlayGroups}`);
    console.log(`  Likely SINGLE groups: ${singleGroups}`);

    if (dryRun) {
      console.log('\n✅ DRY RUN COMPLETE - No changes made');
      console.log('🔄 Run with --live flag to execute migration');
      return;
    }

    // Step 3: Update bet types using Prisma ORM (this handles the enum mapping correctly)
    console.log('\n🔄 Updating bet types...');
    
    for (const analysis of analyses) {
      const updateCount = await prisma.bet.updateMany({
        where: {
          userId: analysis.userId,
          weekId: analysis.weekId
        },
        data: {
          betType: analysis.likelyType // Prisma will handle the enum mapping
        }
      });

      console.log(`  ✅ Updated ${updateCount.count} bets for User ${analysis.userId}, Week ${analysis.weekId} → ${analysis.likelyType}`);
    }

    // Step 4: Verify migration
    console.log('\n🔍 Verifying migration...');
    
    const parlayCount = await prisma.bet.count({
      where: { betType: 'PARLAY' }
    });
    
    const singleCount = await prisma.bet.count({
      where: { betType: 'SINGLE' }
    });

    console.log(`  PARLAY bets: ${parlayCount}`);
    console.log(`  SINGLE bets: ${singleCount}`);
    console.log(`  Total: ${parlayCount + singleCount}`);

    console.log('\n✅ MIGRATION COMPLETED SUCCESSFULLY!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function rollbackMigration() {
  console.log('🔄 Rolling back migration...');
  
  try {
    await prisma.$executeRaw`
      ALTER TABLE bets DROP COLUMN bet_type
    `;
    console.log('✅ Rollback completed - bet_type column removed');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case '--analyze':
      await analyzeBets();
      break;
    case '--dry-run':
      await runMigration(true);
      break;
    case '--live':
      console.log('⚠️  LIVE MIGRATION - This will modify the database!');
      console.log('⚠️  Press Ctrl+C within 10 seconds to abort...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      await runMigration(false);
      break;
    case '--rollback':
      console.log('⚠️  ROLLBACK - This will remove the bet_type column!');
      console.log('⚠️  Press Ctrl+C within 5 seconds to abort...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      await rollbackMigration();
      break;
    default:
      console.log('📋 Bet Type Migration Script');
      console.log('');
      console.log('Usage:');
      console.log('  npm run migrate:bet-types -- --analyze    # Analyze existing bets');
      console.log('  npm run migrate:bet-types -- --dry-run    # Test migration (no changes)');
      console.log('  npm run migrate:bet-types -- --live       # Execute migration');
      console.log('  npm run migrate:bet-types -- --rollback   # Remove bet_type column');
      console.log('');
      console.log('⚠️  Always run --dry-run first!');
  }
}

if (require.main === module) {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

export { runMigration, rollbackMigration, analyzeBets }; 