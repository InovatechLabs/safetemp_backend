import dotenv from 'dotenv';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';
import { hashToken } from '../../utils/functions/auth/hashToken';

dotenv.config();

const prisma = new PrismaClient();

const isProd = process.env.NODE_ENV === 'production';

export const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' as const : 'lax' as const,
    maxAge: 60 * 60 * 1000
};

export const refreshCookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' as const : 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000
};

export const clearTempCookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' as const : 'lax' as const,
};

export const register = async (req: AuthenticatedRequest, res: Response) => {

    const { name, email, password } = req.body;
    const platform = req.headers['x-platform'];

    try {

        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) return res.status(400).json({ message: 'E-mail já cadastrado.' });

        const salt = await bcrypt.genSalt(12); 
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = await prisma.user.create({
            data: { name, email, password: hashedPassword },
            select: { id: true, name: true, email: true } 
        });

        if (platform === 'web') {
            const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
            res.cookie('token', token, cookieOptions);
            return res.status(201).json({ success: true, message: 'Usuário criado e logado.' });
        }
        res.status(201).json({

            success: true,
            newUser
        
        });
    } catch (error) {

        console.error("Erro ao registrar usuário:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
}

export const login = async (req: AuthenticatedRequest, res: Response) => {

    const { email, password, token2FA } = req.body;
    const isWeb = req.headers['x-platform'] === 'web';

    if (!process.env.JWT_TEMP_SECRET) throw new Error('Variável de ambiente JWT_TEMP_SECRET não inicializada.')

    try {

        if (!email || !password) return res.status(400).json({ message: 'Todos credenciais são necessários.' })

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
        }

        if (user.is2FAEnabled) {
            if (!token2FA) {

                const tempToken = jwt.sign({
                    id: user.id
                }, process.env.JWT_TEMP_SECRET, { expiresIn: '15m' })

                if (isWeb) {
                    res.cookie('tempToken', tempToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
                    return res.status(206).json({ message: '2FA necessário', requires2FA: true, tempToken });
                }

                return res.status(206).json({
                    message: 'Código 2FA necessário.',
                    requires2FA: true,
                    tempToken,
                });
            }


            if (!user.twoFASecret) return res.status(400).json({ message: '2FA não configurado corretamente.' });

            const validToken = speakeasy.totp.verify({
                secret: user.twoFASecret,
                encoding: 'base32',
                token: token2FA,
                window: 1,
            });
            if (!validToken) return res.status(401).json({ message: 'Código 2FA inválido.' });

        }

        const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

        const refreshTokenHash = hashToken(refreshToken);
        await prisma.refreshToken.create({
            data: {
                tokenHash: refreshTokenHash,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            }
        });

        if (isWeb) {
            res.cookie('token', accessToken, cookieOptions);
            res.cookie('refreshToken', refreshToken, refreshCookieOptions);
            res.clearCookie('tempToken');
            return res.status(200).json({ success: true, user: { id: user.id, name: user.name } });
        }
        return res.status(200).json({
            success: true,
            accessToken
        });

    } catch (error) {
        console.log("Erro ao fazer login:", error)
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await prisma.refreshToken.deleteMany({
        where: { tokenHash }
      }).catch(() => {}); 
    }

    res.clearCookie('token', cookieOptions);
    res.clearCookie('refreshToken', refreshCookieOptions);

    return res.status(200).json({ message: 'Logout realizado com sucesso.' });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const logoutAll = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Não autorizado.' });

    await prisma.refreshToken.deleteMany({
      where: { userId }
    });

    res.clearCookie('token', cookieOptions);
    res.clearCookie('refreshToken', refreshCookieOptions);

    return res.status(200).json({ message: 'Logout realizado em todos os dispositivos.' });
  } catch (error) {
    console.error('Erro ao fazer logout geral:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        is2FAEnabled: true, 
      }
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Erro na rota /me:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token não encontrado.' });
    }

    // verifica se o token é um JWT válido
    let decoded: { id: number };
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { id: number };
    } catch {
      res.clearCookie('refreshToken');
      return res.status(401).json({ message: 'Refresh token inválido ou expirado.' });
    }

    // verifica se o hash existe no banco e nao expirou
    const tokenHash = hashToken(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash }
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      res.clearCookie('refreshToken');
      res.clearCookie('token');
      return res.status(401).json({ message: 'Sessão expirada. Faça login novamente.' });
    }

    // rotaçao do refresh token — invalida o atual e gera um novo
    await prisma.refreshToken.delete({ where: { tokenHash } });

    const newRefreshToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    const newRefreshTokenHash = hashToken(newRefreshToken);

    await prisma.refreshToken.create({
      data: {
        tokenHash: newRefreshTokenHash,
        userId: decoded.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    });

    // gera novo token de acesso
    const newAccessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    res.cookie('token', newAccessToken, cookieOptions);
    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);

    return res.status(200).json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

