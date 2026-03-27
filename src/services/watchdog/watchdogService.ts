import { PrismaClient } from '@prisma/client';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const prisma = new PrismaClient();
const expo = new Expo();

export const enviarNotificacaoOffline = async (chipId: string) => {
  const users = await prisma.user.findMany({
    where: { expoPushToken: { not: null } }
  });

  const messages: ExpoPushMessage[] = [];

  for (const user of users) {
    if (user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
      messages.push({
        to: user.expoPushToken,
        sound: 'default',
        title: '🚨 Estufa Desconectada!',
        body: `O dispositivo ${chipId} perdeu conexão. Verifique energia e internet no local.`,
        priority: 'high',
      });
    }
  }

  await enviarChunks(messages);
};

export const enviarNotificacaoOnline = async (chipId: string) => {
  const users = await prisma.user.findMany({
    where: { expoPushToken: { not: null } }
  });

  const messages: ExpoPushMessage[] = [];

  for (const user of users) {
    if (user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
      messages.push({
        to: user.expoPushToken,
        sound: 'default',
        title: '✅ Estufa Reconectada!',
        body: `O dispositivo ${chipId} voltou a operar normalmente.`,
        priority: 'normal',
      });
    }
  }

  await enviarChunks(messages);
};

const enviarChunks = async (messages: ExpoPushMessage[]) => {
  if (messages.length === 0) return;

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error('[WATCHDOG] Erro ao enviar push:', error);
    }
  }
};

// Mantido para compatibilidade — não faz mais nada pois o watchdog
// agora é orientado a eventos via WebSocket
export const startWatchdog = () => {
  console.log('Serviço de Watchdog iniciado (modo WebSocket).');
};