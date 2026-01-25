import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import { generateExperimentReport } from '../../../services/experiments/experimentReport';

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
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const experiment = await prisma.experimento.findFirst({
      where: { id: Number(id), userId: userId, ativo: true },
      include: {
        dispositivo: true
      }
    });

    if (!experiment) return res.status(404).json({ message: 'Experimento não encontrado.' });


    const records = await prisma.temperatura.findMany({
      where: {
        chipId: experiment.dispositivo.mac_address,
        timestamp: {
          gte: experiment.data_inicio,
          lte: new Date()
        }
      },
      orderBy: { timestamp: 'asc' }
    });

    const report = await generateExperimentReport(experiment, records);

    await prisma.experimento.update({
      where: { id: experiment.id },
      data: { 
        ativo: false, 
        data_fim: new Date(),
        relatorio: report 
      }
    });

    return res.json({ 
      message: 'Experimento concluído e relatório gerado!',
      relatorio: report 
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao processar laudo científico.' });
  }
},

async listarPublicos(req: Request, res: Response) {
  try {
    const experimentos = await prisma.experimento.findMany({
      where: {
        ativo: false 
      },
      select: {
        id: true,
        nome: true,
        objetivo: true,
        data_inicio: true,
        data_fim: true,
        relatorio: true,
        temp_min_ideal: true,
        temp_max_ideal: true,
        responsavel: {
          select: {
            name: true
          }
        },
        dispositivo: {
          select: {
            mac_address: true
          }
        }
      },
      orderBy: { data_fim: 'desc' }
    });

    return res.json(experimentos);
  } catch (error) {
    console.error("Erro ao buscar repositório:", error);
    return res.status(500).json({ message: 'Erro ao carregar repositório.' });
  }
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