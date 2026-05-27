import { PrismaClient } from '@prisma/client';
import { calcStats } from '../utils/statistics';
import { TemperatureRecord } from '../utils/types';

const prisma = new PrismaClient();

export async function getLastHourData(greenhouseId: number) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000); 

  const prismaRecords = await prisma.temperatura.findMany({
    where: {
      device: { greenhouseId: greenhouseId },
      timestamp: {
        gte: oneHourAgo,
        lte: now,
      },
    },
    include: { 
      device: { 
        include: { greenhouse: true } 
      } 
    },
    orderBy: { timestamp: 'asc' },
  });

  const records: TemperatureRecord[] = prismaRecords.map(r => ({
    id: r.id,
    deviceId: r.deviceId,
    greenhouseName: r.device?.greenhouse?.name || "Desconhecida",
    chipId: r.device?.mac_address || "Desconhecido",
    value: r.value,
    timestamp: r.timestamp.toISOString() 
  }));

  const values = records.map(r => r.value);
  const statistics = calcStats(values);

  return { records, statistics };
}