import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import userRouter from './routes/user/userRoutes';
import dataRouter from './routes/arduino/dataRoutes';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// ===================== MIDDLEWARES =====================
app.use(cors({
    origin: "*",
    credentials: true
}));

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(cookieParser());

// ===================== ROTAS =====================

app.use("/api/user", userRouter);    // Autenticação
app.use("/api/data", dataRouter);    // Registro de dados 


async function startServer() {

    const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

    try {
        
        await prisma.$queryRaw`SELECT 1`;
        console.log("✅ Conectado ao MySQL com sucesso");

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`🚀 Servidor rodando em ${process.env.BACKEND_URL}`);
        });
    } catch (error) {
        console.error(`❌ Erro ao iniciar servidor: `, error);
        process.exit(1);
    }
}

startServer();