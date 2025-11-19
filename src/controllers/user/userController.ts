import dotenv from 'dotenv';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import passwordValidator from '../../validators/passwordValidator';
import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';

dotenv.config();

const prisma = new PrismaClient();

export const register = async (req: AuthenticatedRequest, res: Response) => {

    const { name, email, password } = req.body;

    try {

        if(!name || !email || !password) return res.status(400).json({ message: 'Credenciais incompletos.'});

        if(!passwordValidator(password)) return res.status(400).json({ message: 'A senha não atende aos requisitos mínimos e/ou não possui caracteres suficientes.'})

        const user = await prisma.user.findUnique({ 
            where: { email }
        });

        if (user) return res.status(400).json({ message: 'E-mail já cadastrado.'})    

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = await prisma.user.create({
         data: {
            name,
            email,
            password: hashedPassword
         },
        }); 
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
    if (!process.env.JWT_TEMP_SECRET) throw new Error('Variável de ambiente JWT_TEMP_SECRET não inicializada.')

    try {

        if(!email || !password) return res.status(401).json({ message: 'Todos credenciais são necessários.'})

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if(!user) return res.status(404).json({ message: 'Usuário não cadastrado.'});
        const validPassword = await bcrypt.compare(password, user.password);


        if(!validPassword) return res.status(400).json({ message: 'Senha incorreta.'});

        if (user.is2FAEnabled) {
            if (!token2FA) {
                
                const tempToken = jwt.sign({
                id: user.id }, process.env.JWT_TEMP_SECRET, { expiresIn: '6h'})

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

        const token = jwt.sign({ id: user.id}, process.env.JWT_SECRET!, {expiresIn: '1h'});
        return res.status(200).json({ 
            success: true,
            token 
        })
   
    } catch (error) {
        console.log("Erro ao fazer login:", error)
        res.status(500).json({ message: 'Erro interno do servidor'});
    }
}
