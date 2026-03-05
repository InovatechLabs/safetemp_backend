import { NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';
import { Request, Response } from 'express';

export const validate = (schema: ZodObject) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Dados inválidos',
                    errors: error.issues.map(e => ({
                        path: e.path[e.path.length - 1],
                        message: e.message
                    }))
                });
            }
            return res.status(500).json({ message: 'Erro interno na validação' });
        }
    };