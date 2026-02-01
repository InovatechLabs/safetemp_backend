import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../../../middlewares/auth';

const prisma = new PrismaClient();

export const NotificationController = {

  async list(req: AuthenticatedRequest, res: Response) {
    try {


    const userId = req.user?.id;
    if (!req.user) return res.status(401).json({ message: 'Usuário não autenticado.' });

      const notifications = await prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { sent_at: 'desc' }, 
        take: 30, 
      });

      return res.json(notifications);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar notificações.' });
    }
  },

  async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        if (!req.user) return res.status(401).json({ message: 'Usuário não autenticado.' });

      await prisma.notification.updateMany({
        where: { 
          user_id: userId,
          read: false 
        },
        data: { read: true },
      });

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar notificações.' });
    }
  }
};