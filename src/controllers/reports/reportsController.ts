import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateReportPDF } from '../../services/reportService';
import { getDayRange } from '../../utils/dateRange';

const prisma = new PrismaClient();

export const listReports = async (req: Request, res: Response) => {

    try {

        const reports = await prisma.relatorios.findMany();
        return res.status(200).json(reports);
    } catch (error) {

        console.error('Erro ao buscar relatórios:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' })
    }
};

export const listTodayReports = async (req: Request, res: Response) => {
    const now = new Date();
    const { startOfDay, endOfDay } = getDayRange(now);

    try {
        const todayReports = await prisma.relatorios.findMany({
            where: {
                criado_em: {
                    gte: startOfDay,
                    lt: endOfDay
                }
            }
        });

        return res.json(todayReports);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
};

export const listReportsByDate = async (req: Request, res: Response) => {
    const { data } = req.query;

    if (!data) {
        return res.status(400).json({ error: "Data é obrigatória (YYYY-MM-DD)" });
    }

    const date = new Date(data as string);

    if (isNaN(date.getTime())) {
        return res.status(400).json({ error: "Data inválida" });
    }

    const { startOfDay, endOfDay } = getDayRange(date);

    try {
        const reports = await prisma.relatorios.findMany({
            where: {
                criado_em: {
                    gte: startOfDay,
                    lt: endOfDay
                }
            }
        });

        return res.json(reports);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
};

export const listReportsByInterval = async (req: Request, res: Response) => {
    const { inicio, fim } = req.query;

    if (!inicio || !fim) {
        return res.status(400).json({ error: "inicio e fim são obrigatórios (YYYY-MM-DD)" });
    }

    const start = new Date(inicio as string);
    const end = new Date(fim as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: "Datas inválidas" });
    }

    end.setDate(end.getDate() + 1);

    try {
        const reports = await prisma.relatorios.findMany({
            where: {
                criado_em: {
                    gte: start,
                    lt: end
                }
            }
        });

        return res.json(reports);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro ao buscar relatórios" });
    }
};

export const exportPDF = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const reportId = Number(id);
        if (isNaN(reportId)) {
            return res.status(400).json({ error: "ID inválido" });
        }

        const report = await prisma.relatorios.findUnique({ where: { id: reportId } });

        if (!report) return res.status(404).json({ error: "Relatório não encontrado" });

        const pdf = await generateReportPDF(report);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=relatorio_${id}.pdf`);

        return res.send(pdf);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Erro ao gerar PDF" });
    }
};
