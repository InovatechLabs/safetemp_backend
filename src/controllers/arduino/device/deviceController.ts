import { sendCommandToDevice, getConnectedDevices } from '../../../websocket/wsServer';
import { Request, Response } from 'express';

// GET /api/devices/connected
// Retorna quais ESP32s estão conectados via WebSocket agora
export const listConnectedDevices = async (req: Request, res: Response) => {
  return res.status(200).json({ connected: getConnectedDevices() });
};

// POST /api/devices/:chipId/command
// Manda um comando para um ESP32 específico via WebSocket
// Body: { "command": "read_now" } ou { "command": "restart" }
export const sendCommand = async (req: Request, res: Response) => {
  const { chipId } = req.params;
  const { command } = req.body;

  if (!command) return res.status(400).json({ message: 'command é obrigatório.' });

  const sent = sendCommandToDevice(chipId, { type: 'command', command });

  if (!sent) {
    return res.status(404).json({ message: 'Dispositivo não conectado via WebSocket.' });
  }

  return res.status(200).json({ message: `Comando "${command}" enviado para ${chipId}.` });
};