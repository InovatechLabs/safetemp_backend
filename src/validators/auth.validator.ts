import { z } from 'zod';

export const RegisterSchema = z.object({
    body: z.object({
        name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres").max(50),
        email: z.email("Formato de e-mail inválido").trim().toLowerCase(),
        password: z.string()
            .min(8, "A senha deve ter no mínimo 8 caracteres")
            .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula")
            .regex(/[0-9]/, "A senha deve conter ao menos um número")
    })
});

export const LoginSchema = z.object({
    body: z.object({
        email: z.email("E-mail inválido"),
        password: z.string().min(1, "A senha é obrigatória"),
        token2FA: z.string().optional()
    })
});