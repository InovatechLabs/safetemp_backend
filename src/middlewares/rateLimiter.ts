import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: {
        status: 429,
        message: 'Muitas tentativas de login. Tente novamente em 10 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 60,
    message: {
        status: 429,
        message: 'Aguarde um momento antes de solicitar mais dados.'
    }
});

export const heavyContentLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 10,
    message: {
        status: 429,
        message: 'Muitas solicitações de documentos. Aguarde um minuto.'
    }
})