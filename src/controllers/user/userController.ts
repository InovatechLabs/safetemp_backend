import dotenv from 'dotenv';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';

dotenv.config();

const prisma = new PrismaClient();

const cookieOptions = {
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000 
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

        if(!email || !password) return res.status(401).json({ message: 'Todos credenciais são necessários.'})

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
        }

        if (user.is2FAEnabled) {
            if (!token2FA) {
                
                const tempToken = jwt.sign({
                id: user.id }, process.env.JWT_TEMP_SECRET, { expiresIn: '15m'})

                if (isWeb) {
                    res.cookie('tempToken', tempToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
                    return res.status(206).json({ message: '2FA necessário', requires2FA: true });
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

        const token = jwt.sign({ id: user.id}, process.env.JWT_SECRET!, {expiresIn: '7d'});

        if (isWeb) {
            res.cookie('token', token, cookieOptions);
            res.clearCookie('tempToken'); 
            return res.status(200).json({ success: true, user: { id: user.id, name: user.name } });
        }
        return res.status(200).json({ 
            success: true,
            token 
        });
   
    } catch (error) {
        console.log("Erro ao fazer login:", error)
        res.status(500).json({ message: 'Erro interno do servidor'});
    }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'lax',
  });

  res.status(200).json({ message: 'Logout bem-sucedido' })
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true, 
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

