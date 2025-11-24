import dotenv from 'dotenv';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import { Expo } from 'expo-server-sdk';
import { fromZonedTime, toZonedTime, format } from 'date-fns-tz';

dotenv.config();

const prisma = new PrismaClient();
const expo = new Expo();

export const registerAlert = async (req: AuthenticatedRequest, res: Response) => {

    const { temperatura_min, temperatura_max, hora_inicio, hora_fim, nome, nota } = req.body;
    const timeZone = 'America/Sao_Paulo';

    try {
        if (!req.user || !req.user.id) return res.status(401).json({ message: "Usuário não autenticado" });
 
        if (temperatura_min === undefined && temperatura_max === undefined) {
             return res.status(400).json({ message: 'Defina ao menos uma temperatura limite.' });
        }

        const userId = req.user.id;
        let utcHoraInicio = null;
        let utcHoraFim = null;

        const now = new Date();
        const brazilTime = toZonedTime(now, timeZone); 
        const brazilDateString = format(brazilTime, 'yyyy-MM-dd');

        if (hora_inicio) {

            const timePart = hora_inicio.includes('T') ? hora_inicio.split('T')[1].substring(0, 5) : hora_inicio;
            const combinedString = `${brazilDateString} ${timePart}`;

            utcHoraInicio = fromZonedTime(combinedString, timeZone);
        }

        if (hora_fim) {
            const timePart = hora_fim.includes('T') ? hora_fim.split('T')[1].substring(0, 5) : hora_fim;
            const combinedString = `${brazilDateString} ${timePart}`;
            utcHoraFim = fromZonedTime(combinedString, timeZone);
        }

        const alert = await prisma.alerts.create({
            data: {
                user_id: userId,
                temperatura_min: temperatura_min ? parseFloat(temperatura_min) : null,
                temperatura_max: temperatura_max ? parseFloat(temperatura_max) : null,
                hora_inicio: utcHoraInicio,
                hora_fim: utcHoraFim,
                ativo: true,
                nome: nome || null,
                nota: nota || null
            },
        });

        return res.status(201).json(alert);

    } catch (err) {
        console.error("Erro ao criar alerta:", err);
        return res.status(500).json({ message: "Erro interno ao cadastrar alerta." });
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

export const enableAlert = async (req: AuthenticatedRequest, res: Response) => {

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
                ativo: true
            }
        });

        res.status(200).json({ message: 'Alerta ativado com sucesso.' });
    } catch (error) {
        console.error("Não foi possível excluir alerta:", error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

export const editAlertName = async (req: AuthenticatedRequest, res: Response) => {

    const id = Number(req.params.id);
    const { nome } = req.body;

    try {

        const userId = req.user?.id;
        if (!req.user) return res.status(400).json({ message: 'Usuário não autenticado.' });

        if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
            return res.status(400).json({ message: 'O nome do alerta é obrigatório e não pode ser vazio.' });
        }
        if (isNaN(id)) {
            return res.status(400).json({ message: 'ID inválido.' });
        }

        const result = await prisma.alerts.updateMany({
            where: {
                id: id,
                user_id: userId 
            },
            data: {
                nome: nome
            }
        });

        if (result.count === 0) {
            return res.status(404).json({ message: 'Alerta não encontrado ou você não tem permissão para editá-lo.' });
        }
        
        return res.status(200).json({ message: `Nome atualizado com sucesso para "${nome}".` });
    } catch (error) {
        console.error("Erro ao editar nome de alerta:", error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

export const list = async (req: Request, res: Response) => {

    try {
        const alerts = await prisma.alerts.findMany();
        res.status(200).json(alerts);
    } catch (error) {
        console.error("Erro ao listar alertas:", error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
}
