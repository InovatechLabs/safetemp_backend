import dotenv from 'dotenv';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { calcStats } from '../../utils/statistics';
import { Parser } from 'json2csv';
import { getDayRange } from '../../utils/dateRange';

dotenv.config();

const prisma = new PrismaClient();

export const registerTemperature = async ( req: Request, res: Response ) => {

    const { chipId, temp, timestamp } = req.body;

    if (!chipId || temp === undefined) return res.status(400).json({ message: 'Todos dados são necessários.' });

    try {

        const device = await prisma.device.findUnique({
            where: { mac_address: chipId }
        });

        if (!device) return res.status(401).json({ message: 'Dispositivo não autorizado.' });

        const nowUtc = new Date();

        const tempRegister = await prisma.temperatura.create({
            data: {
                chipId,
                value: temp,
                timestamp: nowUtc
            },
        });
        res.status(201).json(tempRegister);
    } catch (error) {
        console.error('Erro ao registrar temperatura:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

export const getLastRecord = async (req: Request, res: Response) => {

    try {
        const lastRecord = await prisma.temperatura.findFirst({
            orderBy: {
                id: "desc"
            },
            take: 1,
        });

        res.status(200).json({
            lastRecord
        });
    } catch (error) {
        throw new Error(`Erro ao coletar ultimo dado: ${error}`);
    };
};

export const getTemperatures = async (req: Request, res: Response) => {

    const { date, start, end } = req.query;

     if (!date && !start && !end) {
       return res.status(400).json({ message: "Por favor, informe os parâmetros para consulta." });
     }

  let startDate: Date;
  let endDate: Date;

  if (start && end) {
    startDate = new Date(start as string);
    endDate = new Date(end as string);
  } else if (date) {
    startDate = new Date(`${date}T00:00:00.000Z`);
    endDate = new Date(`${date}T23:59:59.999Z`);
  } else {
    return res.status(400).json({ message: "Informe tanto 'date' quanto 'start' e 'end' corretamente." });
  }

  try {
    const records = await prisma.temperatura.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: "asc" },
    });

    if (records.length === 0) {
      return res.status(200).json({ message: "Nenhum dado encontrado." });
    }

    const sv = records.map((r) => r.value);
    const statistics = calcStats(sv);

    res.json({ records, statistics });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

export const getTemperatures6h = async (req: Request, res: Response) => {

    const now = new Date();

    // IMPORTANTE: esta timestamp leva em consideração o ajuste de timezone do Render, o qual utiliza UTC +0, portanto,
    // é necessário subtrair -3 horas para se adequar ao horario de Brasilia. Assim que a api for movida para o Azure,
    // utilize  - 6 apenas e não (6 + 3).

    // const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const sixHoursAgo = new Date(now.getTime() - (6 + 3)  * 60 * 60 * 1000);

      try {
    const records = await prisma.temperatura.findMany({
      where: {
        timestamp: {
          gte: sixHoursAgo,
          lte: now,
        },
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
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

    try {
      
      const records = await prisma.temperatura.findMany({
      where: {
        timestamp: {
          gte: oneHourAgo,
          lte: now,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (!records || records.length === 0) {
        return res.json({ records: [], statistics: null });
    }

    const sv = records.map(r => r.value);
    const statistics = calcStats(sv);


    res.json({ records, statistics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar últimos dados' });
  }
};

export const exportCSV = async (req: Request, res: Response) => {
    
    const { data, type = 'temperatura', id } = req.query;
    const timeOptions: Intl.DateTimeFormatOptions = { timeZone: 'America/Sao_Paulo' };

    try {
        let dadosFormatados: any[] = [];
        let fields: string[] = [];
        let fileName = "";

      if (type === 'relatorios') {

        if (!id) {
          return res.status(400).json({ error: "ID do relatório é obrigatório para este tipo de exportação." });
        }

        const report = await prisma.relatorios.findUnique({
          where: { id: Number(id) }
        });

        if (!report) return res.status(404).json({ message: 'Relatório não encontrado.' });

        let resumoObj;
        try {
          resumoObj = JSON.parse(report.resumo);
        } catch (e) {
          resumoObj = {};
        }

        dadosFormatados = [{
          ID: report.id,
          Data: report.criado_em.toLocaleDateString('pt-BR', timeOptions),
          'Intervalo': (() => {
            if (!resumoObj.intervalo) return '-';

            const partes = resumoObj.intervalo.split(' → ');

            if (partes.length === 2) {
              const inicio = new Date(partes[0]);
              const fim = new Date(partes[1]);

              const horaInicio = inicio.toLocaleTimeString('pt-BR', { ...timeOptions, hour: '2-digit', minute: '2-digit' });
              const horaFim = fim.toLocaleTimeString('pt-BR', { ...timeOptions, hour: '2-digit', minute: '2-digit' });

              return `${horaInicio} até ${horaFim}`;
            }
            return resumoObj.intervalo;
          })(),
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

      } 
        else {
            
            if (!data || typeof data !== 'string') {
                return res.status(400).json({ error: "Data é obrigatória para exportação de temperatura." });
            }

            const dateInput = new Date(data);
            if (isNaN(dateInput.getTime())) return res.status(400).json({ error: "Data inválida" });
            
            const { startOfDay, endOfDay } = getDayRange(dateInput);

            const records = await prisma.temperatura.findMany({
                where: { timestamp: { gte: startOfDay, lt: endOfDay } },
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
}
