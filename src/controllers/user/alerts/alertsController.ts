import dotenv from 'dotenv';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import { Expo } from 'expo-server-sdk';
import { fromZonedTime } from 'date-fns-tz';

dotenv.config();

const prisma = new PrismaClient();
const expo = new Expo();

export const registerAlert = async (req: AuthenticatedRequest, res: Response) => {

    const { temperatura_min, temperatura_max, hora_inicio, hora_fim } = req.body;
    const timeZone = 'America/Sao_Paulo';
    try {

      if (!req.user || !req.user.id) return res.status(401).json({ message: "Usuário não autenticado" });
 

   const userId = req.user.id;

   const utcHoraInicio = hora_inicio 
            ? fromZonedTime(hora_inicio, timeZone) 
            : null;
        
        const utcHoraFim = hora_fim 
            ? fromZonedTime(hora_fim, timeZone) 
            : null;
        const alert = await prisma.alerts.create({
            data: {
                user_id: userId,
                temperatura_min,
                temperatura_max,
                hora_inicio: utcHoraInicio, 
                hora_fim: utcHoraFim,
                ativo: true,
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
            data: { expoPushToken: expoPushToken },
        });
        res.json(user);
    } catch (err) {
        console.error("Falha ao salvar userToken:", err);
        res.status(500).json({ message: 'Erro ao salvar token de push'});
    }
};

export const listUserAlerts = async (req: AuthenticatedRequest, res: Response) => {

    try {
        
        if (!req.user) return res.status(400).json({ message: 'Usuário não autenticado.' });
        const userId = req.user.id;

        const list = await prisma.alerts.findMany({
            where: { 
            user_id: userId 
            },
            orderBy: {
                criado_em: 'desc'   
            },
        });
        return res.status(200).json(list);
    } catch (error) {
        console.error("Não foi possível retornar alertas de usuário:", error)
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

export const deleteAlert = async (req: AuthenticatedRequest, res: Response) => {

    const { id } = req.params;

    try {
        if(!req.user) return res.status(400).json({ message: 'Usuário não autenticado.' });

        const userId = req.user.id; 
        const alertId = Number(id);

        const alert = await prisma.alerts.findFirst({
            where: {
                id: alertId,
                user_id: userId,
            },
        });
        if(!alert) return res.status(404).json({ message: 'Alerta não encontrado.' });

        await prisma.alerts.delete({
            where: {
                id: alert.id
            },
        });

        res.status(200).json({ message: 'Alerta excluído com sucesso.' });
    } catch (error) {
        console.error("Não foi possível excluir alerta:", error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

export const disableAlert = async (req: AuthenticatedRequest, res: Response) => {

    const { id } = req.params;

    try {
        if(!req.user) return res.status(400).json({ message: 'Usuário não autenticado.' });

        const userId = req.user.id; 
        const alertId = Number(id);

        const alert = await prisma.alerts.findFirst({
            where: {
                id: alertId,
                user_id: userId,
            },
        });
        if(!alert) return res.status(404).json({ message: 'Alerta não encontrado.' });

        await prisma.alerts.update({
            where: {
                id: alert.id
            },
            data: {
                ativo: false
            }
        });

        res.status(200).json({ message: 'Alerta desativado com sucesso.' });
    } catch (error) {
        console.error("Não foi possível excluir alerta:", error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

export const list = async (req: Request, res: Response) => {

    try {
        const alerts = await prisma.alerts.findMany();
        res.status(200).json(alerts);
    } catch (error) {
        console.error("Erro ao listar alertas:", error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
}
