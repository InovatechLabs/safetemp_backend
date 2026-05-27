import { Response } from 'express';
import * as insightService from '../../services/insights/generateInsight';
import { TenantRequest } from '../../middlewares/tenantMiddleware';

export const generateInsight = async (req: TenantRequest, res: Response) => {
  try {

    const userContext = req.body; 

    const greenhouseId = req.greenhouse.id;

    const result = await insightService.generateQuickInsight(userContext, greenhouseId);
    
    return res.json(result);
  } catch (error) {
    console.error("Erro ao processar insight:", error);
    return res.status(500).json({ error: "Falha na comunicação com o serviço de IA" });
  }
};