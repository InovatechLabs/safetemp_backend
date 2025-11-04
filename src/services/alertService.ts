import { Expo } from 'expo-server-sdk';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const expo = new Expo();

export const verificarAlertas = async () => {
  try {

    const lastRecord = await prisma.temperatura.findFirst({
      orderBy: { id: 'desc' },
    });

    if (!lastRecord) {
      console.log('Nenhum registro de temperatura encontrado.');
      return;
    }

    const temperaturaAtual = lastRecord.value; 
    const now = new Date(Date.now() - 3 * 60 * 60 * 1000);

    const alertas = await prisma.alerts.findMany({
      where: {
      hora_inicio: { lte: now },
      hora_fim: { gte: now },
    },
      include: { user: true },
    });

    for (const alerta of alertas) {
      if (
        (alerta.temperatura_min && temperaturaAtual < alerta.temperatura_min) ||
        (alerta.temperatura_max && temperaturaAtual > alerta.temperatura_max)
      ) {
        const token = alerta.user.expoPushToken;

        if (token && Expo.isExpoPushToken(token)) {
          await expo.sendPushNotificationsAsync([
            {
              to: token,
              sound: 'default',
              title: '⚠️ Alerta de Temperatura',
              body: `A temperatura atual é ${temperaturaAtual.toFixed(2)}°C — fora do limite configurado.`,
            },
          ]);
          console.log(`🔔 Notificação enviada para usuário ${alerta.user.id}`);
        }
      }
    }
  } catch (error) {
    console.error('Erro ao verificar alertas:', error);
  }
};
