import dotenv from 'dotenv';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

export const registerTemperature = async ( req: Request, res: Response ) => {

    const { chipId, temp, timestamp } = req.body;

    if (!chipId || !timestamp || temp === undefined) return res.status(400).json({ message: 'Todos dados são necessários.' });

    try {

        const device = await prisma.device.findUnique({
            where: { mac_address: chipId }
        });

        if (!device) return res.status(401).json({ message: 'Dispositivo não autorizado.' });

        const tempRegister = await prisma.temperatura.create({
            data: {
                chipId,
                value: temp,
                timestamp: timestamp ? new Date(timestamp) : undefined
            },
        });
        res.status(201).json(tempRegister);
    } catch (error) {
        console.error('Erro ao registrar temperatura:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}