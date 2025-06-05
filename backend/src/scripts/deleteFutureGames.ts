import { prisma } from '../index';

async function deleteFutureGames() {
  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // First delete all bets for games in week 15+ created today
    const games = await prisma.game.findMany({
      where: {
        AND: [
          {
            weekNumber: {
              gte: 15
            }
          },
          {
            createdAt: {
              gte: today
            }
          }
        ]
      },
      select: {
        id: true,
        createdAt: true,
        weekNumber: true
      }
    });

    console.log('Found games to delete:', games.map(g => ({
      id: g.id,
      createdAt: g.createdAt,
      weekNumber: g.weekNumber
    })));

    const gameIds = games.map(g => g.id);
    console.log(`Found ${gameIds.length} games in week 15+ created today to delete`);

    // Delete bets first
    await prisma.bet.deleteMany({
      where: {
        gameId: {
          in: gameIds
        }
      }
    });
    console.log('Deleted all bets for these games');

    // Then delete the games
    await prisma.game.deleteMany({
      where: {
        id: {
          in: gameIds
        }
      }
    });
    console.log('Deleted all games in week 15+ created today');

    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteFutureGames(); 