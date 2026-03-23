import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// toda madrugada às 3h
cron.schedule('0 3 * * *', async () => {
  await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } }
  });
  console.log('Refresh tokens expirados removidos.');
});