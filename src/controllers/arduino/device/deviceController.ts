import { sendCommandToDevice, getConnectedDevices, logEvents } from '../../../websocket/wsServer';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/devices/connected
// Retorna quais ESP32s estão conectados via WebSocket agora
export const listConnectedDevices = async (req: Request, res: Response) => {
  return res.status(200).json({ connected: getConnectedDevices() });
};

// POST /api/devices/:chipId/command
// Manda um comando para um ESP32 específico via WebSocket ou comando para o servidor (API Node.js)
// Body: { "command": "read_now" } ou { "command": "restart" }
const ESP_COMMAND_WHITELIST = [
  'read_now', 
  'ping', 
  'system_info', 
  'wifi_scan', 
  'mem_map', 
  'chip_info',
  'force_flush'
];

export const sendCommand = async (req: Request, res: Response) => {
  const { chipId } = req.params;
  const { command } = req.body;

  if (!command) return res.status(400).json({ message: 'command é obrigatório.' });

  if (command.startsWith('sys:') || command.startsWith('db:')) {
    const action = command.split(':')[1];
    let msg = "";

    switch (action) {
      case 'last_warn':
        const lastWarn = await prisma.systemLog.findFirst({
          where: { chipId, level: 'WARN' },
          orderBy: { timestamp: 'desc' },
        });
        msg = lastWarn ? `[DB] Último Alerta: ${lastWarn.message}` : "[DB] Nenhum alerta WARN encontrado.";
        break;

      case 'last_error':
        const lastError = await prisma.systemLog.findFirst({
          where: { chipId, level: 'ERROR' },
          orderBy: { timestamp: 'desc' },
        });
        msg = lastError ? `[DB] Último Erro: ${lastError.message}` : "[DB] Nenhum erro encontrado.";
        break;

      case 'ws_clients':
        const clients = getConnectedDevices(); 
        msg = `[SISTEMA] Dispositivos WebSocket ativos: ${clients.length} (${clients.join(', ')})`;
        break;

      case 'log_size':
        const count = await prisma.systemLog.count({ where: { chipId } });
        msg = `[DB] O dispositivo possui ${count} logs persistidos no banco.`;
        break;

      default:
        msg = `[SISTEMA] Comando '${action}' não reconhecido pelo servidor.`;
        logEvents.emit('new_log', { chipId, level: 'WARN', message: msg, timestamp: new Date() });
        return res.status(200).json({ message: 'Comando inválido processado.' });
    }

    logEvents.emit('new_log', { chipId, level: 'INFO', message: msg, timestamp: new Date() });
    return res.status(200).json({ message: 'Comando de sistema executado.' });
  }

  const cleanCommand = command.startsWith('esp:') ? command.substring(4) : command;

  if (!ESP_COMMAND_WHITELIST.includes(cleanCommand)) {
    const errorMsg = `[SISTEMA] Comando '${cleanCommand}' inválido ou inexistente.`;
    logEvents.emit('new_log', { chipId, level: 'ERROR', message: errorMsg, timestamp: new Date() });
    return res.status(403).json({ message: 'Comando de hardware não autorizado.' });
  }

  // Envio via WebSocket
  const sent = sendCommandToDevice(chipId, { type: 'command', command: cleanCommand });

  if (!sent) {
    const failMsg = `[SISTEMA] Falha ao rotear '${cleanCommand}': Hardware offline.`;
    logEvents.emit('new_log', { chipId, level: 'WARN', message: failMsg, timestamp: new Date() });
    return res.status(404).json({ message: 'Dispositivo desconectado.' });
  }

  return res.status(200).json({ message: `Comando "${cleanCommand}" enviado com sucesso.` });
};