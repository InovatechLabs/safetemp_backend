import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from './auth'; 

const prisma = new PrismaClient();


export interface TenantRequest extends AuthenticatedRequest {
  greenhouse?: any; 
}

export const requireTenantAccess = async (req: TenantRequest, res: Response, next: NextFunction) => {
  const targetId = req.params.greenhouseId || req.query.greenhouseId || req.headers['x-greenhouse-id'];

  try {
    // ==========================================
    // CENÁRIO 1: O Frontend pediu uma estufa ESPECÍFICA (Enviou o ID)
    // ==========================================
    if (targetId) {
      const greenhouseId = Number(targetId);
      if (isNaN(greenhouseId)) return res.status(400).json({ message: 'ID da estufa inválido.' });

      const greenhouse = await prisma.greenhouse.findUnique({
        where: { id: greenhouseId },
        include: { workspace: { include: { users: true } } }
      });

      if (!greenhouse) return res.status(404).json({ message: 'Estufa não encontrada no sistema.' });

      // Se é pública, libera direto (Visitantes podem ver)
      if (greenhouse.isPublic) {
        req.greenhouse = greenhouse;
        return next();
      }

      // Se for privada, exige login
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Acesso negado. Faça login para acessar estufas privadas.' });
      }

      // Verifica se o usuário logado pertence ao Workspace da estufa
      const hasAccess = greenhouse.workspace.users.some(wu => wu.userId === req.user!.id);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Você não tem permissão de acesso aos dados desta estufa.' });
      }

      req.greenhouse = greenhouse;
      return next();
    } 
    
    // ==========================================
    // CENÁRIO 2: FALLBACK (Frontend não enviou ID. Ex: Visitante na Home)
    // ==========================================
    else {
      let defaultGreenhouse = null;

      // Se o usuário estiver LOGADO, tenta achar a primeira estufa privada dele
      if (req.user && req.user.id) {
        defaultGreenhouse = await prisma.greenhouse.findFirst({
          where: { workspace: { users: { some: { userId: req.user.id } } } },
          include: { workspace: { include: { users: true } } }
        });
      }

      // Se ele NÃO estiver logado (visitante) OU se logou e não tem estufa, cai pra Pública
      if (!defaultGreenhouse) {
        defaultGreenhouse = await prisma.greenhouse.findFirst({
          where: { isPublic: true },
          include: { workspace: { include: { users: true } } }
        });
      }

      // Se o banco estiver literalmente vazio e não tiver nem a pública
      if (!defaultGreenhouse) {
        return res.status(404).json({ message: 'Nenhuma estufa disponível para visualização.' });
      }

      req.greenhouse = defaultGreenhouse;
      return next();
    }

  } catch (error) {
    console.error("Erro na resolução de Tenant:", error);
    return res.status(500).json({ message: 'Erro interno ao validar permissões.' });
  }
};