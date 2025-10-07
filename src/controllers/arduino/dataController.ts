import dotenv from 'dotenv';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

export const registerTemperature = async ( req: Request, res: Response ) => {

    const { chipId, temp, timestamp } = req.body;

    if (!chipId || temp === undefined) return res.status(400).json({ message: 'Todos dados são necessários.' });

    try {

        const device = await prisma.device.findUnique({
            where: { mac_address: chipId }
        });

        if (!device) return res.status(401).json({ message: 'Dispositivo não autorizado.' });

         const nowUtc = new Date();
        const offset = -3 * 60; // -3 horas em minutos
        nowUtc.setMinutes(nowUtc.getMinutes() + offset);

        const tempRegister = await prisma.temperatura.create({
            data: {
                chipId,
                value: temp,
                timestamp: nowUtc
            },
        });
        res.status(201).json(tempRegister);
    } catch (error) {
        console.error('Erro ao registrar temperatura:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

export const getLastRecord = async (req: Request, res: Response) => {

    try {
        const lastRecord = await prisma.temperatura.findFirst({
            orderBy: {
                id: "desc"
            },
            take: 1,
        });

        res.status(200).json({
            lastRecord
        });
    } catch (error) {
        throw new Error(`Erro ao coletar ultimo dado: ${error}`);
    };
}