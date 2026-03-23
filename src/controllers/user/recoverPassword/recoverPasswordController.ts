import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendRecoveryEmail } from '../../../services/sender/email';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

export const createRecoverToken = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Forneça o e-mail.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(200).json({ message: 'Se o e-mail existir, você receberá um link para recuperação.' });
    }

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET!, { expiresIn: '15m' });

    await prisma.user.update({
      where: { email },
      data: {
        resetToken: token,
        resetTokenExpires: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    await sendRecoveryEmail(email, token);

    return res.status(200).json({ message: 'Se o e-mail existir, você receberá um link para recuperação.' });
  } catch (err) {
    console.error('Erro ao criar token de recuperação:', err);
    return res.status(500).json({ message: 'Erro interno ao criar token de recuperação.' });
  }
};

export const validateToken = (req: Request, res: Response) => {
  const { token } = req.params;
  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    return res.status(200).json({ valid: true });
  } catch (error) {
    return res.status(400).json({ valid: false, message: 'Token inválido ou expirado.' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };

    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    if (!user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      return res.status(400).json({ message: 'Token expirado.' });
    }

    if (user.resetToken !== token) {
      return res.status(400).json({ message: 'Token inválido.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email: decoded.email },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return res.status(200).json({ message: 'Senha atualizada com sucesso.' });
  } catch (error) {
    return res.status(400).json({ message: 'Token inválido ou expirado.' });
  }
};