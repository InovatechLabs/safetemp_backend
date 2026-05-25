import { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getParsedBody = (req: Request) => {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
};

export const authenticateDevice = async (req: Request, res: Response, next: NextFunction) => {
  const chipIdHeader = req.headers['x-chip-id'] as string | undefined;
  const signature    = req.headers['x-device-signature'] as string | undefined;

  if (!chipIdHeader || !signature) {
    return res.status(401).json({ message: 'Headers ausentes.' });
  }

  const chipId = chipIdHeader.toUpperCase(); 

  try {
    const device = await prisma.device.findUnique({
      where: { mac_address: chipId },
    });

    if (!device) return res.status(401).json({ message: 'Dispositivo não cadastrado.' });

    const body = getParsedBody(req);
    let payload = chipId; 

    if (body.records && Array.isArray(body.records)) {
      // LÓGICA DE BATCH (ID|VAL|TIME|VAL|TIME...)
      for (const r of body.records) {
        const value = Number(r.value).toFixed(2);
        payload += `|${value}|${r.timestamp}`;
      }
    } else if (body.temp !== undefined) {
      // LÓGICA SINGLE (ID|VAL)
      const value = Number(body.temp).toFixed(2);
      payload = `${chipId}|${value}`;
    } else {
      return res.status(400).json({ message: 'Payload inválido.' });
    }

    const expected = createHmac('sha256', device.deviceSecret)
      .update(payload)
      .digest('hex');

    if (!timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) {
      return res.status(401).json({ message: 'Assinatura inválida.' });
    }

    (req as any).device = device;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno.' });
  }
};