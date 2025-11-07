import { Expo } from 'expo-server-sdk';
import { PrismaClient } from '@prisma/client';

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


    const alertas = await prisma.alerts.findMany({
      where: {
        ativo: true,


        OR: [
          { hora_inicio: null, hora_fim: null },
          {
            hora_inicio: { lte: now },
            hora_fim: { gte: now }
          }
        ]
      },
      include: { user: true },
    });

    if (alertas.length === 0) {
      console.log('Nenhum alerta ativo.');
      return;
    }

    let messages = [];
    let updates = [];

    for (const alerta of alertas) {
      const token = alerta.user.expoPushToken;
      const tempForaDoLimite = (alerta.temperatura_min && temperaturaAtual < alerta.temperatura_min) ||
        (alerta.temperatura_max && temperaturaAtual > alerta.temperatura_max);

      if (tempForaDoLimite) {

        if (alerta.notificacaoAtiva === false) {
          console.log(`VIOLAÇÃO: Usuário ${alerta.user.id}. Enviando notificação.`);
          if (token && Expo.isExpoPushToken(token)) {
            messages.push({
              to: token,
              sound: 'default',
              title: '⚠️ Alerta de Temperatura',
              body: `A temperatura atual é ${temperaturaAtual.toFixed(2)}°C — fora do limite configurado.`,
            });
          }
          updates.push(prisma.alerts.update({
            where: { id: alerta.id },
            data: { notificacaoAtiva: true }
          }));
        }

      } else {

        if (alerta.notificacaoAtiva === true) {
          updates.push(prisma.alerts.update({
            where: { id: alerta.id },
            data: { notificacaoAtiva: false }
          }));

          if (token && Expo.isExpoPushToken(token)) {
            messages.push({
              to: token,
              sound: null,
              title: '✅ Temperatura Normalizada',
              body: `A temperatura agora é ${temperaturaAtual.toFixed(2)}°C e está dentro dos limites.`,
            });
          }
        } else {

        }
      }

    }

    if (messages.length > 0) {
      console.log(`Enviando ${messages.length} notificações em lote...`);
      try {
        await expo.sendPushNotificationsAsync(messages);
        console.log('Notificações enviadas com sucesso.');
      } catch (error) {
        console.error('Erro ao enviar notificações em lote:', error);
      }
    }


    if (updates.length > 0) {
      console.log(`Atualizando ${updates.length} status de alertas no DB...`);
      try {
        await Promise.all(updates);
        console.log('Status dos alertas atualizados no DB.');
      } catch (error) {
        console.error('Erro ao atualizar status dos alertas:', error);
      }
    }

  } catch (error) {
    console.error('Erro fatal ao verificar alertas:', error);
  }
};