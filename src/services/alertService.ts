import { Expo } from 'expo-server-sdk';
import { PrismaClient } from '@prisma/client';
import { sendWebPushAlert } from './webPushService';

const prisma = new PrismaClient();
const expo = new Expo();

export const verificarAlertas = async () => {
  console.log('Iniciando verificação de alertas...');

  try {
    const lastRecord = await prisma.temperatura.findFirst({
      orderBy: { id: 'desc' },
    });

    if (!lastRecord) {
      console.log('Nenhum registro de temperatura encontrado.');
      return;
    }

    const temperaturaAtual = lastRecord.value;
    const now = new Date();


   const greenhousesComAlertas = await prisma.greenhouse.findMany({
      where: {
        alerts: {
          some: {
            ativo: true,
            OR: [
              { hora_inicio: null, hora_fim: null },
              { hora_inicio: { lte: now }, hora_fim: { gte: now } }
            ]
          }
        }
      },
      include: {
        alerts: {
          where: {
            ativo: true,
            OR: [
              { hora_inicio: null, hora_fim: null },
              { hora_inicio: { lte: now }, hora_fim: { gte: now } }
            ]
          },
          include: { user: true }
        }
      }
    });

    if (greenhousesComAlertas.length === 0) {
      return; 
    }

    let messages = [];
    let updates = [];
    let notificationsToCreate = [];
    let webPushPromises = [];

for (const greenhouse of greenhousesComAlertas) {

      const lastRecord = await prisma.temperatura.findFirst({
        where: { device: { greenhouseId: greenhouse.id } },
        orderBy: { timestamp: 'desc' },
      });

      if (!lastRecord) continue; 

      const temperaturaAtual = lastRecord.value;

      for (const alerta of greenhouse.alerts) {
        const token = alerta.user.expoPushToken;
        const tempForaDoLimite = (alerta.temperatura_min !== null && temperaturaAtual < alerta.temperatura_min) ||
                                 (alerta.temperatura_max !== null && temperaturaAtual > alerta.temperatura_max);

        if (tempForaDoLimite) {
          if (alerta.notificacaoAtiva === false) {
            const title = `⚠️ Alerta: ${greenhouse.name}`;
            const body = `A temperatura atual é ${temperaturaAtual.toFixed(2)}°C — fora do limite configurado.`;

            if (token && Expo.isExpoPushToken(token)) {
              messages.push({ to: token, sound: 'default', title, body });
            }
            
            const targetUserId = (alerta as any).user_id || (alerta as any).userId;

            webPushPromises.push(sendWebPushAlert(targetUserId, title, body, '/dashboard'));

            notificationsToCreate.push({
              userId: targetUserId,
              alertId: alerta.id,
              title: title,
              content: body,
              read: false
            });

            updates.push(prisma.alerts.update({
              where: { id: alerta.id },
              data: { notificacaoAtiva: true }
            }));
          }
        } else {
          if (alerta.notificacaoAtiva === true) {
            const title = `✅ Normalizado: ${greenhouse.name}`;
            const body = `A temperatura agora é ${temperaturaAtual.toFixed(2)}°C e está dentro dos limites.`;

            if (token && Expo.isExpoPushToken(token)) {
              messages.push({ to: token, sound: 'default', title, body });
            }
            
            const targetUserId = (alerta as any).user_id || (alerta as any).userId;

            webPushPromises.push(sendWebPushAlert(targetUserId, title, body, '/dashboard'));

            notificationsToCreate.push({
              userId: targetUserId,
              alertId: alerta.id,
              title: title,
              content: body,
              read: false
            });

            updates.push(prisma.alerts.update({
              where: { id: alerta.id },
              data: { notificacaoAtiva: false }
            }));
          }
        }
      }
    }

    if (messages.length > 0) {
      try { await expo.sendPushNotificationsAsync(messages); } 
      catch (error) { console.error('Erro Push:', error); }
    }
    
    if (webPushPromises.length > 0) {
      try { await Promise.all(webPushPromises); } 
      catch (error) { console.error('Erro WebPush:', error); }
    }

    if (updates.length > 0) {
      try { await Promise.all(updates); } 
      catch (error) { console.error('Erro DB Alertas:', error); }
    }

    if (notificationsToCreate.length > 0) {
      try { await prisma.notification.createMany({ data: notificationsToCreate }); } 
      catch (error) { console.error('Erro Histórico:', error); }
    }

  } catch (error) {
    console.error('Erro fatal ao verificar alertas:', error);
  }
};