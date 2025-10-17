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
};

export const getTemperatures = async (req: Request, res: Response) => {

    const { date } = req.query;

    if(!date) return res.status(400).json({ message: 'Por favor, informe os parâmetros para consulta' });

    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);

    try {
        const records = await prisma.temperatura.findMany({
            where: {
                timestamp: {
                    gte: start,
                    lte: end,
                },
            },
            orderBy: {timestamp: `asc` },
        });
        res.json(records);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
}

export const getTemperatures6h = async (req: Request, res: Response) => {

    const now = new Date();

    // IMPORTANTE: esta timestamp leva em consideração o ajuste de timezone do Render, o qual utiliza UTC +0, portanto,
    // é necessário subtrair -3 horas para se adequar ao horario de Brasilia. Assim que a api for movida para o Azure,
    // utilize  - 6 apenas e não (6 + 3).

    // const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const sixHoursAgo = new Date(now.getTime() - (6 + 3)  * 60 * 60 * 1000);

      try {
    const records = await prisma.temperatura.findMany({
      where: {
        timestamp: {
          gte: sixHoursAgo,
          lte: now,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar últimos dados' });
  }
}