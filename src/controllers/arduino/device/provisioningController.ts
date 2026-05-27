import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// POST /api/device/activate
// Recebe: { "chipId": "A1B2C3D4E5F6", "activationToken": "X7K9-P2M4" }
export const activateDevice = async (req: Request, res: Response) => {
  const { chipId, activationToken } = req.body;

  if (!chipId || !activationToken) {
    return res.status(400).json({ message: 'chipId e activationToken são obrigatórios.' });
  }

  try {
    // 1. Busca se existe um dispositivo aguardando esse token
    const device = await prisma.device.findUnique({
      where: { activationToken },
    });

    if (!device) {
      return res.status(404).json({ message: 'Token de ativação inválido ou já utilizado.' });
    }

    // 2. Verifica se a estufa atrelada a esse token ainda existe
    if (!device.greenhouseId) {
      return res.status(400).json({ message: 'Este token não está vinculado a uma estufa válida.' });
    }

    // 3. Verifica se algum outro dispositivo já não "roubou" esse mac_address no banco
    const macInUse = await prisma.device.findUnique({
      where: { mac_address: chipId }
    });

    if (macInUse && macInUse.id !== device.id) {
      return res.status(409).json({ message: 'Este hardware (MAC) já está ativado em outra conta.' });
    }

    // 4. Gera um novo Secret seguro de 64 caracteres em HEX
    const newSecret = crypto.randomBytes(32).toString('hex');

    // 5. Atualiza o banco amarrando o hardware à estufa e inutilizando o token
    await prisma.device.update({
      where: { id: device.id },
      data: {
        mac_address: chipId,       
        deviceSecret: newSecret,   
        activationToken: null, 
      }
    });

    // 6. Devolve pro ESP32 salvar na NVS dele
    return res.status(200).json({ 
      message: 'Dispositivo ativado com sucesso!',
      deviceSecret: newSecret 
    });

  } catch (error) {
    console.error('Erro no provisionamento:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};