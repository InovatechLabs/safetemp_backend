import jwt from 'jsonwebtoken';
import { getLastHourData } from '../dataService'; 
import { getSampling } from '../../utils/analytics/sampling';
import { InsightRequest, InsightStatistics } from '../../utils/types/insights';

export const generateQuickInsight = async (userContext: any) => {

    const SECRET_KEY = process.env.SECRET_KEY as string;
    const PYTHON_API_URL = process.env.PYTHON_API_URL as string;

    if (!SECRET_KEY || !PYTHON_API_URL) throw new Error('Variáveis de ambiente não configuradas corretamente ou ausentes.')

    const { records, statistics: baseStats } = await getLastHourData();

    if (!records || records.length === 0) return { error: "Sem dados" };

    const statisticsForPython: InsightStatistics = {
        mean: baseStats.media ?? 0,
        max: baseStats.max ?? 0,
        min: baseStats.min ?? 0,
        stdDev: baseStats.desvioPadrao,
        lastValue: records[records.length - 1].value,
        outliers: baseStats.outliers || [],
        sampling: getSampling(records)
    };

    const body: InsightRequest = {
        mode: userContext.mode,
        text: userContext.text,
        statistics: statisticsForPython,

        ...(userContext.mode === 'experiment' && {
            culture: userContext.culture,
            stage: userContext.stage,
            thresholds: userContext.thresholds,
            equipment: userContext.equipment
        })
    };

    const token = jwt.sign({ service: 'safetemp-api' }, SECRET_KEY, { expiresIn: '30s' });

    console.log("--- ENVIANDO PARA PYTHON ---");
console.log("Body enviado:", JSON.stringify(body));

    const response = await fetch(`${PYTHON_API_URL}/insights/gerar-insight`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
    });

    return await response.json();
};