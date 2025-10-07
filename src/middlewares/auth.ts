import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request{

    user?: { id: number }
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token não fornecido ou malformado" });
  }

  const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
        req.user = decoded;

        if(!req.user) return res.status(401).json({ message: 'Usuário não encontrado.'});
        next();

    } catch (error) {

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expirado.' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido.' });
    }
      return res.status(401).json({ message: 'Token inválido ou expirado.'})
    }
}