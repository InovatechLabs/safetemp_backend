import { Request, Response } from 'express';
import * as insightService from '../../services/insights/generateInsight';

export const generateInsight = async (req: Request, res: Response) => {
  try {

    const userContext = req.body; 

    const result = await insightService.generateQuickInsight(userContext);
    
    return res.json(result);
  } catch (error) {
    console.error("Erro ao processar insight:", error);
    return res.status(500).json({ error: "Falha na comunicação com o serviço de IA" });
  }
};