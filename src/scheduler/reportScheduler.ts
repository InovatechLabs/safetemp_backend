
import { PrismaClient } from "@prisma/client";
import type { HistoryResponse, PythonResponse, TemperatureRecord } from "../utils/types";
import { getLastHourData } from "../services/dataService";
import cron from 'node-cron';
import jwt from 'jsonwebtoken';   

const prisma = new PrismaClient();

const PYTHON_API_URL = process.env.PYTHON_API_URL as string;
const BACKEND_URL = process.env.BACKEND_URL as string;
const SECRET_KEY = process.env.SECRET_KEY as string;

if (!PYTHON_API_URL || !BACKEND_URL || !SECRET_KEY) {
  throw new Error("Variáveis de ambiente necessárias faltando.");
}

export async function generateReports(): Promise<void> {
  try {
    
   const { records, statistics } = await getLastHourData();

    if (!records || records.length === 0) {
      console.log("[CRON] Nenhum dado encontrado na última hora.");
      return;
    }

    console.log(`[CRON] ${records.length} registros encontrados. Enviando ao microserviço...`);

    const body = { records, statistics };
    const token = jwt.sign({ service: 'safetemp-api' }, SECRET_KEY, { expiresIn: '30s', algorithm: 'HS256'   });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const pythonResponse = await fetch(`${PYTHON_API_URL}/gerar-report`, {
      method: "POST",
      headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}` 
    },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!pythonResponse.ok) {
      throw new Error(`[CRON] Erro da API Python: ${pythonResponse.statusText}`);
    }

    const report = (await pythonResponse.json()) as PythonResponse;
    const now = new Date();

    const newReport = await prisma.relatorios.create({
      data: {
        chip_id: records[0]?.chipId ?? "Desconhecido",
        data: now,
        relatorio: report.relatorio,
        resumo: JSON.stringify(report.resumo),
      },
    });

    console.log(`[CRON] Relatório salvo com sucesso! ID: ${newReport.id}`);
  } catch (error: any) {
    console.error("[CRON] Erro ao gerar relatório:", error.message);
  }
}
generateReports();

cron.schedule("0 * * * *", generateReports);