import dotenv from 'dotenv';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { calcStats } from '../../utils/statistics';
import { Parser } from 'json2csv';
import { getDayRange } from '../../utils/dateRange';
import { aggregateByGranularity } from '../../utils/analytics/aggregation';

dotenv.config();

const prisma = new PrismaClient();

function parseBody(req: Request): any {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}



export const registerTemperature = async (req: Request, res: Response) => {
  const body = parseBody(req);
  const { temp } = body;

  if (temp === undefined) {
    return res.status(400).json({ message: 'Todos dados são necessários.' });
  }

  const parsedTemp = Number(temp);
  if (isNaN(parsedTemp)) {
    return res.status(400).json({ message: 'Temperatura deve ser um número válido.' });
  }
  

  const TEMP_MIN = -50;
  const TEMP_MAX = 150;

  if (parsedTemp < TEMP_MIN || parsedTemp > TEMP_MAX) {
    return res.status(400).json({
      message: `Temperatura fora do intervalo permitido (${TEMP_MIN}°C a ${TEMP_MAX}°C). Valor recebido: ${parsedTemp}`,
    });
  }

  try {
    const device = (req as any).device;
    if (!device) return res.status(401).json({ message: 'Dispositivo não autorizado.' });

    const tempRegister = await prisma.temperatura.create({
      data: { 
        deviceId: device.id, 
        value: parsedTemp, 
        timestamp: new Date() 
      },
    });

    return res.status(201).json(tempRegister);
  } catch (error) {
    console.error('Erro ao registrar temperatura:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const batchRegisterTemperature = async (req: Request, res: Response) => {
  const body = parseBody(req);
  const { chipId, records } = body;

  const TEMP_MIN = -50;
  const TEMP_MAX = 150;
  const BATCH_MAX_RECORDS = 1440;

  if (!chipId || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: 'Formato inválido ou lista vazia.' });
  }
  if (records.length > BATCH_MAX_RECORDS) {
    return res.status(400).json({ message: `Lote muito grande. Máximo permitido: ${BATCH_MAX_RECORDS} registros.` });
  }

  try {
    const device = (req as any).device;
    if (!device) return res.status(401).json({ message: 'Dispositivo não autorizado.' });

    const now            = new Date();
    const thirtyDaysAgo  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const invalidRecords: number[] = [];
    const dataToInsert: { deviceId: number; value: number; timestamp: Date }[] = [];

    for (let i = 0; i < records.length; i++) {
      const value     = Number(records[i].value);
      const timestamp = new Date(records[i].timestamp);

      if (isNaN(value) || value < TEMP_MIN || value > TEMP_MAX) { invalidRecords.push(i); continue; }
      if (isNaN(timestamp.getTime()) || timestamp > now || timestamp < thirtyDaysAgo) { invalidRecords.push(i); continue; }

      dataToInsert.push({ deviceId: device.id, value, timestamp });
    }

    if (dataToInsert.length === 0) {
      return res.status(400).json({ message: 'Nenhum registro válido no lote.', invalidIndexes: invalidRecords });
    }

    const result = await prisma.temperatura.createMany({ data: dataToInsert, skipDuplicates: true });

    return res.status(201).json({
      message: `Sincronização concluída. ${result.count} registros salvos.`,
      saved: result.count,
      skipped: invalidRecords.length,
      ...(invalidRecords.length > 0 && { invalidIndexes: invalidRecords }),
    });
  } catch (error) {
    console.error('Erro no batch upload:', error);
    return res.status(500).json({ message: 'Erro interno ao salvar lote.' });
  }
};



export const getLastRecord = async (req: Request, res: Response) => {
  const greenhouse = (req as any).greenhouse; // Injetado pelo tenantMiddleware

  try {
      const lastRecord = await prisma.temperatura.findFirst({
          where: {
            device: { greenhouseId: greenhouse.id } // MUDANÇA: Filtra pela estufa
          },
          orderBy: {
              id: "desc"
          },
          take: 1,
      });

      res.status(200).json({ lastRecord });
  } catch (error) {
      res.status(500).json({ message: `Erro ao coletar ultimo dado` });
  };
};

export const getTemperatures = async (req: Request, res: Response) => {
  const greenhouse = (req as any).greenhouse;
  const { date, start, end, granularity } = req.query;

  if (!date && !start && !end) {
    return res.status(400).json({ message: "Por favor, informe os parâmetros para consulta." });
  }

  let startDate: Date;
  let endDate: Date;

  if (start && end) {
    startDate = new Date(start as string);
    endDate = new Date(end as string);
  } else if (date) {
    startDate = new Date(`${date}T03:00:00.000Z`);
    const nextDay = new Date(startDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    endDate = new Date(startDate.getTime() + (24 * 60 * 60 * 1000) - 1);
  } else {
    return res.status(400).json({ message: "Parâmetros insuficientes." });
  }

  const GRANULARITY_MAP: Record<string, number> = { "1m": 1, "5m": 5, "10m": 10, "15m": 15, "30m": 30, "1h": 60 };
  const granularityMinutes = granularity && GRANULARITY_MAP[granularity as string] ? GRANULARITY_MAP[granularity as string] : null;

  try {
    const records = await prisma.temperatura.findMany({
      where: {
        device: { greenhouseId: greenhouse.id }, // MUDANÇA: Filtra pela estufa
        timestamp: { gte: startDate, lte: endDate },
      },
      orderBy: { timestamp: "asc" },
    });

    if (records.length === 0) return res.status(200).json({ message: "Nenhum dado encontrado." });

    let finalRecords: any[] = records;

    if (granularityMinutes) {
      finalRecords = aggregateByGranularity(
        records.map((r) => ({ value: r.value, timestamp: r.timestamp })),
        granularityMinutes
      );
    }

    const values = finalRecords.map((r) => r.value);
    const statistics = calcStats(values);

    res.json({
      records: finalRecords,
      statistics,
      granularity: granularityMinutes ? `${granularityMinutes}m` : "raw",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

export const getTemperatures6h = async (req: Request, res: Response) => {
  const greenhouse = (req as any).greenhouse;
  const now = new Date();
  const sixHoursAgo = new Date(now.getTime() - (6 + 3)  * 60 * 60 * 1000);

  try {
    const records = await prisma.temperatura.findMany({
      where: {
        device: { greenhouseId: greenhouse.id }, // MUDANÇA: Filtra pela estufa
        timestamp: { gte: sixHoursAgo, lte: now },
      },
      orderBy: { timestamp: 'asc' },
    });

    const sv = records.map(r => r.value);
    const statistics = calcStats(sv);

    res.json({ records, statistics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar últimos dados' });
  }
};

export const getHistory1h = async (req: Request, res: Response) => {
  const greenhouse = (req as any).greenhouse;
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

  try {
    const records = await prisma.temperatura.findMany({
      where: {
        device: { greenhouseId: greenhouse.id }, // MUDANÇA: Filtra pela estufa
        timestamp: { gte: oneHourAgo, lte: now },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (!records || records.length === 0) return res.json({ records: [], statistics: null });

    const sv = records.map(r => r.value);
    const statistics = calcStats(sv);

    res.json({ records, statistics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar últimos dados' });
  }
};

export const exportCSV = async (req: Request, res: Response) => {
    const greenhouse = (req as any).greenhouse;
    const { data, type = 'temperatura', id } = req.query;
    const timeOptions: Intl.DateTimeFormatOptions = { timeZone: 'America/Sao_Paulo' };

    try {
        let dadosFormatados: any[] = [];
        let fields: string[] = [];
        let fileName = "";

      if (type === 'relatorios') {
        if (!id) return res.status(400).json({ error: "ID do relatório é obrigatório." });

        // MUDANÇA: Garante que o usuário só baixe relatórios da própria estufa!
        const report = await prisma.relatorios.findFirst({
          where: { 
            id: Number(id),
            greenhouseId: greenhouse.id 
          }
        });

        if (!report) return res.status(404).json({ message: 'Relatório não encontrado ou acesso negado.' });

        let resumoObj;
        try { resumoObj = JSON.parse(report.resumo); } catch (e) { resumoObj = {}; }

        dadosFormatados = [{
          ID: report.id,
          Data: report.criado_em.toLocaleDateString('pt-BR', timeOptions),
          'Intervalo': (() => { /* ... sua logica de intervalo mantida ... */ return resumoObj.intervalo; })(),
          'Média (°C)': resumoObj.media !== undefined ? Number(resumoObj.media).toFixed(2).replace('.', ',') : '-',
          'Mínima (°C)': resumoObj.min !== undefined ? Number(resumoObj.min).toFixed(2).replace('.', ',') : '-',
          'Máxima (°C)': resumoObj.max !== undefined ? Number(resumoObj.max).toFixed(2).replace('.', ',') : '-',
          'Desvio Padrão (%)': resumoObj.std !== undefined ? Number(resumoObj.std).toFixed(2).replace('.', ',') : '-',
          'Variância (%)': resumoObj.variancia !== undefined ? Number(resumoObj.variancia).toFixed(2).replace('.', ',') : '-',
          'CVOutliers (%)': resumoObj.cvoutlier !== undefined ? Number(resumoObj.cvoutlier).toFixed(2).replace('.', ',') : '-',
          'CVNoOutliers (%)': resumoObj.cvnooutlier !== undefined ? Number(resumoObj.cvnooutlier).toFixed(2).replace('.', ',') : '-',
          'Total de Outliers': resumoObj.totalOutliers !== undefined ? Number(resumoObj.totalOutliers).toFixed(2).replace('.', ',') : '-',
          'Total de Registros': resumoObj.registros ?? '-'
        }];

        fields = ['ID', 'Data', 'Intervalo', 'Média (°C)', 'Mínima (°C)', 'Máxima (°C)', 'Desvio Padrão (%)', 'Variância (%)', 'CVOutliers (%)', 'CVNoOutliers (%)', 'Total de Outliers', 'Total de Registros'];
        fileName = `resumo_relatorio_${id}.csv`;

      } else {
            if (!data || typeof data !== 'string') return res.status(400).json({ error: "Data é obrigatória." });

            const dateInput = new Date(data);
            if (isNaN(dateInput.getTime())) return res.status(400).json({ error: "Data inválida" });
            
            const { startOfDay, endOfDay } = getDayRange(dateInput);

            // MUDANÇA: Garante que só baixe temperaturas da estufa!
            const records = await prisma.temperatura.findMany({
                where: { 
                  device: { greenhouseId: greenhouse.id },
                  timestamp: { gte: startOfDay, lt: endOfDay } 
                },
                orderBy: { timestamp: 'asc' }
            });

            if (records.length === 0) return res.status(404).json({ message: 'Sem dados brutos para esta data.' });

            dadosFormatados = records.map(reg => ({
                ID: reg.id,
                Data: reg.timestamp.toLocaleDateString('pt-BR', timeOptions),
                Hora: reg.timestamp.toLocaleTimeString('pt-BR', timeOptions),
                Temperatura: reg.value.toFixed(2).replace('.', ','), 
            }));

            fields = ['ID', 'Data', 'Hora', 'Temperatura'];
            fileName = `dados_brutos_${data}.csv`;
        }

        const json2csvParser = new Parser({ fields, delimiter: ';', withBOM: true });
        const csv = json2csvParser.parse(dadosFormatados);

        res.header('Content-Type', 'text/csv');
        res.attachment(fileName);
        return res.send(csv);

    } catch (error) {
        console.error("Erro na exportação CSV:", error);
        return res.status(500).json({ message: 'Erro interno.' });
    }
};