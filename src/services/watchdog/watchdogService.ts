import { PrismaClient } from '@prisma/client';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import cron from 'node-cron';

const prisma = new PrismaClient();
const expo = new Expo();


let alertaOfflineEnviado = false;

export const checkSensorHealth = async () => {
  try {

    const lastRecord = await prisma.temperatura.findFirst({
      orderBy: { timestamp: 'desc' }
    });

    if (!lastRecord) return;

    const now = new Date();

    const diffMs = now.getTime() - new Date(lastRecord.timestamp).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    const LIMITE_OFFLINE_MINUTOS = 10;

    if (diffMinutes > LIMITE_OFFLINE_MINUTOS) {
      
      if (!alertaOfflineEnviado) {
        console.log(`[WATCHDOG] ALERTA: Sensor offline há ${diffMinutes} minutos.`);
        await enviarNotificacaoMassiva(diffMinutes);
        alertaOfflineEnviado = true; 
      }

    } else {

      if (alertaOfflineEnviado) {
        console.log("[WATCHDOG] Sensor voltou a responder. Resetando alerta.");
        alertaOfflineEnviado = false;

      }
    }

  } catch (error) {
    console.error("[WATCHDOG] Erro ao verificar sensor:", error);
  }
};

const enviarNotificacaoMassiva = async (minutosOffline: number) => {

  const users = await prisma.user.findMany({
    where: {
      expoPushToken: { not: null }
    }
  });

  const messages: ExpoPushMessage[] = [];

  for (const user of users) {
    if (user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
      messages.push({
        to: user.expoPushToken,
        sound: 'default',
        title: '🚨 Estufa Desconectada!',
        body: `Atenção: Não recebemos dados da estufa há ${minutosOffline} minutos. Verifique energia e internet no local.`,
        priority: 'high',
      });
    }
  }

  if (messages.length > 0) {
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error("Erro ao enviar push de watchdog:", error);
      }
    }
  }
};

export const startWatchdog = () => {
  cron.schedule('*/5 * * * *', () => {
     console.log("[WATCHDOG] Verificando saúde...");
     checkSensorHealth();
  });
  console.log("Serviço de Watchdog iniciado.");
};