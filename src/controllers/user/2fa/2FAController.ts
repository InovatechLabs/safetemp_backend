import speakeasy from 'speakeasy';
import { Request, Response } from 'express';
import qrcode from 'qrcode';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import generateBackupCode from '../../../utils/functions/generateBackupCode';
import jwt from 'jsonwebtoken';


dotenv.config();
const prisma = new PrismaClient();

export const enable2FA = async (req: AuthenticatedRequest, res: Response) => {
    try {

        const userId = req.user?.id;
        if (!req.user) return res.status(401).json({ message: 'Usuário não autenticado.' });

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if(!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

        const secret = speakeasy.generateSecret({
            name: `SafeTemp: ${user.email}`,
            length: 20,
            issuer: 'SafeTemp'
        });

        if (!secret.otpauth_url) return res.status(500).json({ message: 'Erro ao gerar URL do QRCode.' });

        const backupCode = generateBackupCode();
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFASecret: secret.base32,
                backupCode: backupCode,
            }
        });

        return res.status(200).json({
            message: '2FA ativado com sucesso.',
            otpauthUrl: secret.otpauth_url,
            backupCode
        });
    
    } catch (error) {
        console.error("Erro ao ativar 2FA:", error);
    }
};

export const verify2FA = async (req: AuthenticatedRequest, res: Response) => {

    try {
        const userId = req.user?.id;
        const { token } = req.body;

        if (!req.user) return res.status(401).json({ message: 'Usuário não autenticado.' });

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user || !user.twoFASecret) return res.status(400).json({ message: 'Autenticação dois fatores não configurada para este usuário.' });

        const verified = speakeasy.totp.verify({
            secret: user.twoFASecret,
            encoding: 'base32',
            token,
            window: 1,
        });
        if (!verified) return res.status(401).json({ message: 'Token inválido ou mal configurado.' });

        await prisma.user.update({
            where: { id: userId },
            data: {
                is2FAEnabled: true
            },
        });
        return res.status(200).json({ message: '2FA verificado com sucesso!' });

    } catch (error) {
        console.error("Erro ao habilitar 2FA:", error);
        return res.status(500).json({ message: 'Erro interno do servidor '});
    }
};

export const verifyLoginCode = async (req: AuthenticatedRequest, res: Response) => {

    if (!process.env.JWT_TEMP_SECRET) throw new Error("Variável de ambiente JWT_TEMP_SECRET não incializada ou não encontrada.");

    const { token2FA, tempToken } = req.body;

    const userId = req.user?.id;
    if (!req.user) return res.status(401).json({ message: 'Usuário não autenticado.' });

    try {
        const decodedTempToken = jwt.verify(tempToken, process.env.JWT_TEMP_SECRET);
        if(!decodedTempToken) return res.status(401).json({ message: 'Token inválido ou expirado.' });

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user || !user.twoFASecret) return res.status(400).json({ message: 'Autenticação dois fatores não configurada para este usuário.' });

        const validToken = speakeasy.totp.verify({
            secret: user.twoFASecret,
            encoding: 'base32',
            token: token2FA,
            window: 1,
        });
        if (!validToken) return res.status(401).json({ message: 'Código 2FA inválido.' });

        const token = jwt.sign({ id: userId }, process.env.JWT_TEMP_SECRET, { expiresIn: '3h'});

        return res.status(200).json({
            message: 'Login bem-sucedido',
            success: true,
            token
        });
    } catch (error) {
        console.error("Erro ao verificar código 2FA:", error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

export const verifyBackupCode = async (req: AuthenticatedRequest, res: Response) => {

    if (!process.env.JWT_TEMP_SECRET) throw new Error("Variável de ambiente JWT_TEMP_SECRET não incializada ou não encontrada.");

    try {
    const { backupCode } = req.body;

    const userId = req.user?.id;
    if (!req.user) return res.status(401).json({ message: 'Usuário não autenticado.' });

    const validCode = await prisma.user.findFirst({
        where: { 
            id: userId, 
            backupCode: backupCode 
        },
    });

    if(!validCode) return res.status(404).json({message: 'Não foi possível encontrar este código de backup'});
    
    const token = jwt.sign({ id: validCode.id }, process.env.JWT_TEMP_SECRET, {expiresIn: '1h'});

    await prisma.user.update({
        where: { id: userId },
        data: {
            backupCode: null,
            is2FAEnabled: false,
            twoFASecret: null,
        }
    });

    return res.status(200).json({
        message: 'Login bem-sucedido',
        success: true,
        fromBackupVerify: true,
        token
    });
  
  } catch (err) {
    console.error("Erro ao verificar backup code:", err);
    return res.status(500).json({ message: 'Erro ao verificar backup code', err });
  }
}
