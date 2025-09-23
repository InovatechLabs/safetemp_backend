import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request{

    user?: { id: number }
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token não fornecido" });

  const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido ou expirado.'})
    }
}