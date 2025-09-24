import dotenv from 'dotenv';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import passwordValidator from '../../validators/passwordValidator';
import { PrismaClient } from '@prisma/client';

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
        res.status(201).json(newUser);
    } catch (error) {

        console.error("Erro ao registrar usuário:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
}

export const login = async (req: AuthenticatedRequest, res: Response) => {

    const { email, password } = req.body;

    try {

        if(!email || !password) return res.status(401).json({ message: 'Todos credenciais são necessários.'})

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if(!user) return res.status(404).json({ message: 'Usuário não cadastrado.'});
        const validPassword = await bcrypt.compare(password, user.password);


        if(!validPassword) return res.status(400).json({ message: 'Senha incorreta.'});

        const token = jwt.sign({ id: user.id}, process.env.JWT_SECRET!, {expiresIn: '1h'});
        return res.status(200).json({ token })
   
    } catch (error) {

        console.log("Erro ao fazer login:", error)
        res.status(500).json({ message: 'Erro interno do servidor'});
    }
}
