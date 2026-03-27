import { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authenticateDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chipId    = req.headers['x-chip-id'] as string | undefined;
  const signature = req.headers['x-device-signature'] as string | undefined;

  if (!chipId || !signature) {
    return res.status(401).json({ message: 'Headers de autenticação ausentes.' });
  }

  try {
    const device = await prisma.device.findUnique({
      where: { mac_address: chipId },
    });

    if (!device) {
      return res.status(401).json({ message: 'Dispositivo não reconhecido.' });
    }

  const expected = createHmac('sha256', device.deviceSecret)
  .update(chipId)
  .digest('hex');

    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return res.status(401).json({ message: 'Assinatura inválida.' });
    }

    (req as any).device = device;

    next();
  } catch (error) {
    console.error('Erro na autenticação do dispositivo:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};