import { PrismaClient } from '@prisma/client';
import { calcStats } from '../utils/statistics';
import { TemperatureRecord } from '../utils/types';

const prisma = new PrismaClient();

export async function getLastHourData() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000); 

const prismaRecords = await prisma.temperatura.findMany({
    where: {
      timestamp: {
        gte: oneHourAgo,
        lte: now,
      },
    },
    orderBy: { timestamp: 'asc' },
  });

  const records: TemperatureRecord[] = prismaRecords.map(r => ({
    ...r,
    timestamp: r.timestamp.toISOString() 
  }));

  const values = records.map(r => r.value);
  const statistics = calcStats(values);

  return { records, statistics };
}
