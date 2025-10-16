import express, { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

const firmwareDir = path.join(__dirname, "../../../firmware");


export const firmwareVersion = async (req: Request, res: Response) => {

    try {

        const files = fs.readdirSync(firmwareDir).filter(file => file.endsWith(".bin"));
        if(files.length === 0) return res.status(404).json({ message: 'Nenhum arquivo de firmware encontrado.' });

        // Ordenar versao de firmware para mais recente
        const sortedFiles = files.sort((a, b) => {

        const aTime = fs.statSync(path.join(firmwareDir, a)).mtime.getTime();
        const bTime = fs.statSync(path.join(firmwareDir, b)).mtime.getTime();

        return bTime - aTime;
        });

        const latestFirmware = sortedFiles[0];
        const firmwarePath = path.join(firmwareDir, latestFirmware);

        // Extração da versao do firmware
        const versionMatch = latestFirmware.match(/v(\d+\.\d+\.\d+)/);
        const version = versionMatch ? versionMatch[1] : "unknown";

        const firmwareBuffer = fs.readFileSync(firmwarePath);
        const hash = crypto.createHash("sha256").update(firmwareBuffer).digest("hex");

        const baseUrl = `${req.protocol}s://${req.get("host")}/api/firmware`;

        return res.json({
            version,
            file: latestFirmware,
            hash,
            size: firmwareBuffer.length,
            url: `${baseUrl}/download/${latestFirmware}`,
            lastModified: fs.statSync(firmwarePath).mtime,

        });
    } catch (error) {
        console.error("Erro ao obter versão do firmware: ", error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

export const downloadFirmware = async (req: Request, res: Response) => {
    try {
        const { file } = req.params;
        const filePath = path.join(firmwareDir, file);

        if(!fs.existsSync(filePath)) return res.status(404).json({ message: 'Arquivo não encontrado.' });

        res.download(filePath);
    } catch (error) {
        console.error("Erro ao enviar firmware: ", error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
};
