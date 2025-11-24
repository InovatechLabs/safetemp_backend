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
            message: 'Segredo gerado com sucesso.',
            otpauth_url: secret.otpauth_url,
            secret: secret.base32,
            backupCode
        });
    
    } catch (error) {
        console.error("Erro ao ativar 2FA:", error);
    }
};

export const verify2FA = async (req: AuthenticatedRequest, res: Response) => {

    if (!process.env.JWT_TEMP_SECRET) throw new Error("Variável de ambiente JWT_TEMP_SECRET não incializada ou não encontrada.");
    if (!process.env.JWT_SECRET) throw new Error("Variável de ambiente JWT_TEMP_SECRET não incializada ou não encontrada.");
  try {
    const { token2FA } = req.body;

    if (!token2FA ) {
      return res.status(400).json({ message: "Token 2FA ausente." });
    }

    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.twoFASecret) {
      return res.status(400).json({ message: "2FA não está configurado para este usuário." });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: "base32",
      token: token2FA,
      window: 1,
    });

    if (!verified) {
      return res.status(401).json({ message: "Código 2FA inválido." });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        is2FAEnabled: true
      }
    });
    return res.status(200).json({ message: '2FA configurado com sucesso.' });

  } catch (error) {
    console.error("Erro ao validar 2FA:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};


export const verifyLoginCode = async (req: AuthenticatedRequest, res: Response) => {

    if (!process.env.JWT_TEMP_SECRET) throw new Error("Variável de ambiente JWT_TEMP_SECRET não incializada ou não encontrada.");
    if (!process.env.JWT_SECRET) throw new Error("Variável de ambiente JWT_SECRET não incializada ou não encontrada.");

    const { token2FA, tempToken } = req.body;

    try {
        const decodedTempToken = jwt.verify(tempToken, process.env.JWT_TEMP_SECRET) as { id: number };
        if(!decodedTempToken) return res.status(401).json({ message: 'Token inválido ou expirado.' });

        const user = await prisma.user.findUnique({
            where: { id: decodedTempToken.id }
        });
        if (!user || !user.twoFASecret) return res.status(400).json({ message: 'Autenticação dois fatores não configurada para este usuário.' });

        const validToken = speakeasy.totp.verify({
            secret: user.twoFASecret,
            encoding: 'base32',
            token: token2FA,
            window: 1,
        });
        if (!validToken) return res.status(401).json({ message: 'Código 2FA inválido.' });

        const token = jwt.sign({ id: decodedTempToken.id }, process.env.JWT_SECRET, { expiresIn: '3h'});

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
};

export const disable2FA = async (req: AuthenticatedRequest, res: Response) => {

  try {

    const { token2FA } = req.body;
    const userId = req.user?.id;

    if (!req.user) return res.status(400).json({ message: 'Usuário não autenticado.' });

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
    if (!user.twoFASecret) return res.status(400).json({ message: 'Autenticação dois fatores não está ativada.' });

    const validToken = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token: token2FA,
      window: 1,
    });
    if (!validToken) return res.status(401).json({ message: 'Código 2FA inválido.' });

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFASecret: null,
        backupCode: null,
        is2FAEnabled: false,
      }
    });
    return res.status(200).json({ message: '2FA desativado com sucesso.' });

  } catch (error) {
    console.error('Erro ao desativar 2FA do usuário:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

export const getBackupCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Não autorizado.' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        backupCode: true, 
        is2FAEnabled: true 
      }
    });

    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

    if (!user.is2FAEnabled || !user.backupCode) {
        return res.status(400).json({ message: '2FA não está ativo ou código não gerado.' });
    }

    return res.status(200).json({ backupCode: user.backupCode, is2FAEnabled: user.is2FAEnabled });

  } catch (error) {
    console.error('Erro ao buscar código de backup:', error);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};
