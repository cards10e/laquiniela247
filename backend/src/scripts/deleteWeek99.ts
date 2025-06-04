import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const week99 = await prisma.week.findFirst({ where: { weekNumber: 99 } });
  if (!week99) {
    console.log('No week 99 found. Nothing to delete.');
    return;
  }
  const week99Id = week99.id;
  console.log('Deleting bets for week 99...');
  await prisma.bet.deleteMany({ where: { weekId: week99Id } });
  console.log('Deleting games for week 99...');
  await prisma.game.deleteMany({ where: { weekNumber: 99 } });
  console.log('Deleting week 99...');
  await prisma.week.deleteMany({ where: { weekNumber: 99 } });
  console.log('✅ Deleted week 99 and all associated games/bets.');
}

main()
  .catch((e) => {
    console.error('❌ Error during deletion:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 