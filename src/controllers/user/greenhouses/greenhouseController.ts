import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../../../middlewares/auth'; 

const prisma = new PrismaClient();

export const GreenhouseController = {
  
  // GET /api/greenhouses
  // Lista as estufas que o usuário logado tem acesso (Privadas do Workspace + Públicas)
  async list(req: AuthenticatedRequest, res: Response) {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    try {
      const userId = req.user.id;

      const greenhouses = await prisma.greenhouse.findMany({
        where: {
          OR: [
            {
              workspace: {
                users: {
                  some: { userId }
                }
              }
            },
            {
              isPublic: true
            }
          ]
        },
        include: {
          devices: {
            select: {
              id: true,
              mac_address: true,
              activationToken: true
            }
          }
        },
        orderBy: { id: 'asc' }
      });

      return res.status(200).json(greenhouses);
    } catch (error) {
      console.error('Erro ao listar estufas:', error);
      return res.status(500).json({ message: 'Erro interno ao listar estufas.' });
    }
  },

  // POST /api/greenhouses
  // Cria uma estufa e gera o token temporário para o Captive Portal do ESP32
  async create(req: AuthenticatedRequest, res: Response) {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const { name, isPublic, allowExperiments, workspaceId } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'O nome da estufa é obrigatório.' });
    }

    try {
      const userId = req.user.id;
      let targetWorkspaceId = workspaceId ? Number(workspaceId) : null;

      // Se não houver workspaceId no corpo da requisição, resolve dinamicamente
      if (!targetWorkspaceId) {
        const userWorkspace = await prisma.workspaceUser.findFirst({
          where: { userId },
          select: { workspaceId: true }
        });

        if (userWorkspace) {
          targetWorkspaceId = userWorkspace.workspaceId;
        } else {
          // Garante fluxo contínuo para contas novas criando um Workspace padrão
          const newWorkspace = await prisma.workspace.create({
            data: {
              name: `Workspace de ${req.user.id}`, // Tratamento básico de string
              users: {
                create: {
                  userId,
                  role: 'OWNER'
                }
              }
            }
          });
          targetWorkspaceId = newWorkspace.id;
        }
      } else {
        // Se informou o workspaceId, valida se o usuário possui vínculo ativo nele
        const hasAccess = await prisma.workspaceUser.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: targetWorkspaceId,
              userId
            }
          }
        });

        if (!hasAccess) {
          return res.status(403).json({ message: 'Você não possui permissões neste workspace.' });
        }
      }

      // 1. Cria o registro da Estufa
      const greenhouse = await prisma.greenhouse.create({
        data: {
          name,
          workspaceId: targetWorkspaceId,
          isPublic: isPublic || false,
          allowExperiments: allowExperiments || false
        }
      });

      // 2. Cria o token criptográfico randômico de 8 caracteres (Ex: 7EC61D51)
      const activationToken = crypto.randomBytes(4).toString('hex');

      // 3. Cria o Device temporário aguardando o provisionamento físico em campo
      const device = await prisma.device.create({
        data: {
          deviceSecret: 'PENDING',
          activationToken,
          greenhouseId: greenhouse.id
        }
      });

      return res.status(201).json({
        message: 'Estufa criada com sucesso. Equipamento aguardando ativação.',
        greenhouse,
        activationToken 
      });

    } catch (error) {
      console.error('Erro ao criar estufa:', error);
      return res.status(500).json({ message: 'Erro interno ao criar estufa.' });
    }
  }
};