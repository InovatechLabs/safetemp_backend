import { Expo } from 'expo-server-sdk';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const expo = new Expo();

export const verificarAlertas = async () => {
  console.log('Iniciando verificação de alertas...'); // Log de início

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
        hora_inicio: { lte: now },
        hora_fim: { gte: now },
      },
      include: { user: true },
    });

    if (alertas.length === 0) {
      console.log('Nenhum alerta ativo para o horário atual.');
      return;
    }

    console.log(`Encontrados ${alertas.length} alertas ativos.`);

    // --- INÍCIO DA MUDANÇA ---

    // 1. Crie um array vazio para as mensagens
    let messages = [];
    let usersNotificados = []; // Apenas para logar os IDs no final

    for (const alerta of alertas) {
      if (
        (alerta.temperatura_min && temperaturaAtual < alerta.temperatura_min) ||
        (alerta.temperatura_max && temperaturaAtual > alerta.temperatura_max)
      ) {
        const token = alerta.user.expoPushToken;

        if (token && Expo.isExpoPushToken(token)) {
          // 2. Adicione a mensagem ao array, em vez de enviar
          messages.push({
            to: token,
            sound: 'default',
            title: '⚠️ Alerta de Temperatura',
            body: `A temperatura atual é ${temperaturaAtual.toFixed(2)}°C — fora do limite configurado.`,
          });
          usersNotificados.push(alerta.user.id);
        } else if (token) {
          // Log de aviso se o token existir mas for inválido
          console.warn(`Token inválido (não é Expo) para usuário ${alerta.user.id}: ${token}`);
        }
      }
    }

    // 3. Verifique se há mensagens para enviar (DEPOIS do loop)
    if (messages.length > 0) {
      console.log(`Preparando para enviar ${messages.length} notificações...`);

      // 4. Envie todas de uma vez e adicione o try...catch detalhado
      try {
        let tickets = await expo.sendPushNotificationsAsync(messages);
        console.log('Tickets de push recebidos pela Expo:', tickets);

        // 5. Verifique os tickets individuais para erros (MUITO IMPORTANTE)
        tickets.forEach(ticket => {
          if (ticket.status === 'error') {
            console.error(`Erro no ticket individual: ${ticket.message}`);
            if (ticket.details) {
              // Ex: { "error": "DeviceNotRegistered" }
              console.error('Detalhes do erro no ticket:', ticket.details);
            }
          }
        });

  
        console.log(`🔔 Notificações enviadas (ou ao menos tentadas) para usuários: ${usersNotificados.join(', ')}`);

      } catch (error: any) {
      
        console.error('ERRO GERAL AO CHAMAR A API DO EXPO PUSH:', error.message);
        if (error.details) {
          console.error('Detalhes do erro da API Expo:', JSON.stringify(error.details, null, 2));
        }
      }
    } else {
      console.log('Temperaturas dentro dos limites para todos os alertas ativos.');
    }
    // --- FIM DA MUDANÇA ---

  } catch (error) {
    console.error('Erro fatal ao verificar alertas (ex: falha no Prisma/DB):', error);
  }
};