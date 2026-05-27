import { PrismaClient } from '@prisma/client';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const prisma = new PrismaClient();
const expo = new Expo();

export const enviarNotificacaoOffline = async (chipId: string, greenhouseId: number | null) => {
  if (!greenhouseId) return;

  const greenhouse = await prisma.greenhouse.findUnique({
    where: { id: greenhouseId },
    include: {
      workspace: {
        include: {
          users: {
            include: { user: true }
          }
        }
      }
    }
  });

  if (!greenhouse) return;

  const messages: ExpoPushMessage[] = [];

  for (const workspaceUser of greenhouse.workspace.users) {
    const user = workspaceUser.user;
    
    if (user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
      messages.push({
        to: user.expoPushToken,
        sound: 'default',
        title: `🚨 Alerta de Conexão: ${greenhouse.name}`,
        body: `A estufa perdeu conexão com a rede. Verifique a energia e a internet no local.`,
        priority: 'high',
      });
    }
  }

  if (messages.length > 0) {
    await enviarChunks(messages);
  }
};

export const enviarNotificacaoOnline = async (chipId: string, greenhouseId: number | null) => {
  if (!greenhouseId) return;

  const greenhouse = await prisma.greenhouse.findUnique({
    where: { id: greenhouseId },
    include: {
      workspace: {
        include: {
          users: {
            include: { user: true }
          }
        }
      }
    }
  });

  if (!greenhouse) return;

  const messages: ExpoPushMessage[] = [];

  for (const workspaceUser of greenhouse.workspace.users) {
    const user = workspaceUser.user;
    
    if (user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
      messages.push({
        to: user.expoPushToken,
        sound: 'default',
        title: `✅ Conexão Restabelecida: ${greenhouse.name}`,
        body: `A estufa voltou a operar e comunicar normalmente.`,
        priority: 'normal',
      });
    }
  }

  if (messages.length > 0) {
    await enviarChunks(messages);
  }
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

export const startWatchdog = () => {
  console.log('Serviço de Watchdog iniciado (modo WebSocket).');
};