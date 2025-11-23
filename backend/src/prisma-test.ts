import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = await prisma.$queryRawUnsafe(`SELECT NOW()`);
  console.log('DB time:', now);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });