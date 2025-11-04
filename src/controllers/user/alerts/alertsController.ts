import dotenv from 'dotenv';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthenticatedRequest } from '../../../middlewares/auth';
import { Expo } from 'expo-server-sdk';

dotenv.config();

const prisma = new PrismaClient();
const expo = new Expo();

export const registerAlert = async (req: Request, res: Response) => {

    const { userId, temperatura_min, temperatura_max, hora_inicio, hora_fim } = req.body;
    try {
        const alert = await prisma.alerts.create({
            data: {
                user_id: userId,
                temperatura_min,
                temperatura_max,
                hora_inicio: hora_inicio ? new Date(hora_inicio) : null,
                hora_fim: hora_fim ? new Date(hora_fim) : null,
            },
        });

        res.json(alert);
    } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao criar alerta" });
  }
};

export const saveUserToken = async (req: AuthenticatedRequest, res: Response) => {

    try {       
        const { expoPushToken } = req.body;

        if (!expoPushToken) return res.status(400).json({ message: 'Expo Push Token é obrigatório' });
        const userId = req.user!.id;
    
        const user = await prisma.user.update({
            where: { id: userId },
            data: expoPushToken,
        });
        res.json(user);
    } catch (err) {
        console.error("Falha ao salvar userToken:", err);
        res.status(500).json({ message: 'Erro ao salvar token de push'});
    }
};
