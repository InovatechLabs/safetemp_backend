import { PrismaClient } from "@prisma/client";
import { calcStats } from "../../utils/statistics";
import { buildComparisonSummary, compareStats, sampleBalance } from "../../utils/functions/comparison";
import { Request, Response } from 'express';
import { TemperatureStats } from "../../utils/types/comparison/statistics";
import { buildDayRange } from "../../utils/dateRange";

const prisma = new PrismaClient();

export const compareTemperatureRanges = async (req: Request, res: Response) => {

    const { rangeA, rangeB } = req.body;
    const { start: startA, end: endA } = buildDayRange(rangeA);
    const { start: startB, end: endB } = buildDayRange(rangeB);

     try {
    const recordsA = await prisma.temperatura.findMany({
      where: {
        timestamp: {
            gte: startA,
            lte: endA
        },
      },
      orderBy: { timestamp: "asc" },
    });

    const recordsB = await prisma.temperatura.findMany({
      where: {
        timestamp: {
          gte: startB,
          lte: endB,
        },
      },
      orderBy: { timestamp: "asc" },
    });

    if (recordsA.length === 0 || recordsB.length === 0) {
      return res.status(400).json({
        message: "Um dos intervalos não possui dados suficientes",
      });
    }

    const valuesA = recordsA.map(r => r.value);
    const valuesB = recordsB.map(r => r.value);

    const statsA = calcStats(valuesA) as TemperatureStats;
    const statsB = calcStats(valuesB) as TemperatureStats;

    const balanceAnalysis = sampleBalance(valuesA.length, valuesB.length);
    const comparison = compareStats(statsA, statsB);
    const summary = buildComparisonSummary(comparison, balanceAnalysis);

    res.json({
      rangeA: {
        interval: rangeA,
        totalRecords: valuesA.length,
        statistics: statsA,
      },
      rangeB: {
        interval: rangeB,
        totalRecords: valuesB.length,
        statistics: statsB,
      },
      comparison,
      balanceAnalysis,
      summary,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao comparar intervalos" });
  }
};
