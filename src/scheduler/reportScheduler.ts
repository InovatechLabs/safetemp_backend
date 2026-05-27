
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

const chunkArray = <T>(arr: T[], size: number): T[][] => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
    );
};

async function processSingleGreenhouse(greenhouse: any) {
    const { records, statistics } = await getLastHourData(greenhouse.id);

    if (!records || records.length === 0) {
        return;
    }

    console.log(`[CRON] Estufa ID ${greenhouse.id} (${greenhouse.name}): Gerando relatório...`);

    const body = { records, statistics };
    const token = jwt.sign({ service: 'safetemp-api' }, SECRET_KEY, { expiresIn: '30s', algorithm: 'HS256' });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
        const pythonResponse = await fetch(`${PYTHON_API_URL}/reports/gerar-report`, {
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
           throw new Error(`Status ${pythonResponse.status} - ${pythonResponse.statusText}`);
        }

        const report = (await pythonResponse.json()) as PythonResponse;
        
        await prisma.relatorios.create({
            data: {
                greenhouseId: greenhouse.id,
                data: new Date(),
                relatorio: report.relatorio,
                resumo: JSON.stringify(report.resumo),
            },
        });
        
        console.log(`[CRON] Estufa ID ${greenhouse.id}: Relatório concluído e guardado.`);
    } catch (err: any) {
        clearTimeout(timeout);
        console.error(`[CRON] Erro ao comunicar com IA para estufa ${greenhouse.id}:`, err.message);
    }
}

export async function generateReports(): Promise<void> {
    try {
        const greenhouses = await prisma.greenhouse.findMany();

        if (greenhouses.length === 0) {
            console.log("[CRON] Nenhuma estufa cadastrada.");
            return;
        }

        console.log(`[CRON] A iniciar ciclo para ${greenhouses.length} estufa(s)...`);

        // Define quantas estufas processar ao mesmo tempo (Paralelismo)
        const CONCURRENCY_LIMIT = 5; 
        const chunks = chunkArray(greenhouses, CONCURRENCY_LIMIT);

        // Processa lote por lote
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const promises = chunk.map(greenhouse => processSingleGreenhouse(greenhouse));

            await Promise.allSettled(promises); 
        }

        console.log(`[CRON] Ciclo de relatórios concluído com sucesso!`);
    } catch (error: any) {
        console.error("[CRON] Erro fatal no scheduler de relatórios:", error.message);
    }
}

cron.schedule("0 * * * *", generateReports);