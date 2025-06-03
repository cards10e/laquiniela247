import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const [,, email, newPassword] = process.argv;
  if (!email || !newPassword) {
    console.error('Usage: tsx scripts/resetAdminPassword.ts <email> <newPassword>');
    process.exit(1);
  }

  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  console.log(`Password for ${email} has been reset.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 