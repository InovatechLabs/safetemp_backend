import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Server } from 'http';
import { PrismaClient } from '@prisma/client';
import { createHmac } from 'crypto';
import { enviarNotificacaoOffline, enviarNotificacaoOnline } from '../services/watchdog/watchdogService';
import EventEmitter from 'events';

const prisma = new PrismaClient();
const deviceClients = new Map<string, WebSocket>();

export const logEvents = new EventEmitter();

// Controla quais dispositivos já tiveram alerta enviado
const alertasEnviados = new Set<string>();

export function initWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const CHIP_ID_REGEX = /^[A-F0-9]{12}$/;

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const chipId = url.searchParams.get('chipId');
    
    if (!chipId || !CHIP_ID_REGEX.test(chipId)) {
      ws.close(1008, 'chipId inválido.');
      return;
    }
    const sig = url.searchParams.get('signature');

    handleDeviceConnection(ws, chipId, sig);
  });

  console.log('WebSocket server iniciado em /ws');
  return wss;
}

async function handleDeviceConnection(
  ws: WebSocket,
  chipId: string | null,
  signature: string | null
) {
  if (!chipId || !signature) {
    ws.close(1008, 'chipId e signature são obrigatórios.');
    return;
  }

  const device = await prisma.device.findUnique({ where: { mac_address: chipId } });

  if (!device || !device.deviceSecret || device.deviceSecret.length == 0) {
    ws.close(1008, 'Dispositivo não reconhecido.');
    return;
  }

  const expected = createHmac('sha256', device.deviceSecret)
    .update(chipId)
    .digest('hex');

  if (signature !== expected) {
    ws.close(1008, 'Assinatura inválida.');
    return;
  }

  deviceClients.set(chipId, ws);
  console.log(`ESP32 conectado: ${chipId}`);

  if (alertasEnviados.has(chipId)) {
    alertasEnviados.delete(chipId);
    console.log(`[WATCHDOG] ${chipId} reconectado. Enviando notificação de retorno.`);
    enviarNotificacaoOnline(chipId, device.greenhouseId).catch(console.error);
  }

  ws.send(JSON.stringify({ type: 'connected', message: 'Conexão autenticada.' }));

  let isAlive = true;

  ws.on('pong', () => {
    isAlive = true;
  });

  const heartbeat = setInterval(() => {
    if (!isAlive) {
      console.log(`[WATCHDOG] ${chipId} não respondeu ao ping. Encerrando conexão.`);
      clearInterval(heartbeat);
      ws.terminate(); 
      return;
    }
    isAlive = false;
    ws.ping(); 
  }, 15000); 

  ws.on('message', (data) => handleDeviceMessage(ws, chipId, device.id, device.greenhouseId, data.toString()));

  ws.on('close', () => {
    clearInterval(heartbeat); 
    deviceClients.delete(chipId);
    console.log(`ESP32 desconectado: ${chipId}`);

    setTimeout(async () => {
      if (deviceClients.has(chipId)) return;
      if (alertasEnviados.has(chipId)) return;

      console.log(`[WATCHDOG] ${chipId} continua offline após 30s. Enviando alerta.`);
      alertasEnviados.add(chipId);
      enviarNotificacaoOffline(chipId, device.greenhouseId).catch(console.error);
    }, 30 * 1000);
  });
  
  ws.on('error', (err) => {
    clearInterval(heartbeat);
    console.error(`Erro WebSocket ESP32 ${chipId}:`, err);
    deviceClients.delete(chipId);
  });
}

async function handleDeviceMessage(ws: WebSocket, chipId: string, deviceId: number, greenhouseId: number | null, raw: string) {
  try {
    const msg = JSON.parse(raw);

    if (msg.type === 'temperature') {
      const value = Number(msg.value);

      if (isNaN(value) || value < -50 || value > 150) {
        ws.send(JSON.stringify({ type: 'error', message: 'Valor de temperatura inválido.' }));
        return;
      }

      const record = await prisma.temperatura.create({
        data: { deviceId, value, timestamp: new Date() },
      });

      ws.send(JSON.stringify({ type: 'ack', id: record.id }));
      console.log(`🌡️ Temperatura registrada: ${value}°C — ID ${record.id}`);

    } else if (msg.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }));
    } else if (msg.type === 'system_log') {

      const { level, message } = msg;
      
      const logData = { chipId, greenhouseId, level, message, timestamp: new Date() };
      
      if (level === 'WARN' || level === 'ERROR') {
        await prisma.systemLog.create({ data: { deviceId, level, message } });
      }

      logEvents.emit('new_log', logData);
    }

  } catch {
    ws.send(JSON.stringify({ type: 'error', message: 'Formato de mensagem inválido.' }));
  }
}

export function sendCommandToDevice(chipId: string, command: object): boolean {
  const client = deviceClients.get(chipId);
  if (!client || client.readyState !== WebSocket.OPEN) return false;
  client.send(JSON.stringify(command));
  return true;
}

export function getConnectedDevices(): string[] {
  return Array.from(deviceClients.keys());
}