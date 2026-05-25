import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export const sendWebPushAlert = async (userId: number, title: string, body: string, url: string = '/home') => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { webPushToken: true }
        });

        if (!user || !user.webPushToken) {
            console.log(`Usuário ${userId} não possui Web Push configurado.`);
            return;
        }

        const subscription = user.webPushToken as unknown as webpush.PushSubscription;

        const payload = JSON.stringify({
            title: title,
            body: body,
            url: url
        });

        await webpush.sendNotification(subscription, payload);
        console.log(`Alerta Web Push disparado com sucesso para o usuário ${userId}!`);

    } catch (error: any) {
        console.error(`Erro ao disparar Web Push para o usuário ${userId}:`, error);

        if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`A inscrição do usuário ${userId} expirou. Limpando do banco de dados...`);
            await prisma.user.update({
                where: { id: userId },
                data: { webPushToken: undefined }
            });
        }
    }
};