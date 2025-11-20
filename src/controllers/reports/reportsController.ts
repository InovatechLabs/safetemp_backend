import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateReportPDF } from '../../services/reportService';

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
