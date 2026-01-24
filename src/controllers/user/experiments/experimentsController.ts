import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../../../middlewares/auth';

const prisma = new PrismaClient();

export const ExperimentoController = {

  async iniciar(req: AuthenticatedRequest, res: Response) {

    const { nome, objetivo, temp_min_ideal, temp_max_ideal, deviceId, data_fim } = req.body;

    if(!req.user) return res.status(400).json({ message: 'Usuário não autenticado.' });
    const userId = req.user.id; 

    try {
 
      await prisma.experimento.updateMany({
        where: { deviceId, ativo: true },
        data: { ativo: false, data_fim: new Date() }
      });


      const novo = await prisma.experimento.create({
        data: {
          nome,
          objetivo,
          temp_min_ideal,
          temp_max_ideal,
          userId,
          deviceId,
          data_fim,
          ativo: true
        },
        include: {
            responsavel: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
      });

      return res.status(201).json(novo);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao iniciar o experimento." });
    }
  },


  async finalizar(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;

    if(!req.user) return res.status(400).json({ message: 'Usuário não autenticado.' });
    const userId = req.user?.id; 

    const numberedId = Number(id);
      if (isNaN(numberedId)) {
      return res.status(400).json({ message: 'ID de experimento inválido.' });
    }

    const experiment = await prisma.experimento.findFirst({
      where: { 
      id: numberedId,
      userId: userId,
      ativo: true
      }
    })
    if (!experiment) return res.status(404).json({ message: 'Experimento não encontrado' });

  
    await prisma.experimento.update({
        where: { id: experiment.id },
        data: { ativo: false }
      });
      return res.json({ message: 'Experimento finalizado com sucesso.' });
  },

  async buscarAtivoPorDevice(req: Request, res: Response) {
    const { mac_address } = req.params;
    try {
      const ativo = await prisma.experimento.findFirst({
        where: { 
          dispositivo: { mac_address },
          ativo: true 
        },
        include: {
            responsavel: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
      });
      return res.json(ativo);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao buscar experimento." });
    }
  }
};