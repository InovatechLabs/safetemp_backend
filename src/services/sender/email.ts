const SibApiV3Sdk = require('sib-api-v3-sdk');
import dotenv from 'dotenv';
dotenv.config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY as string;
const BREVO_VERIFIED_EMAIL = process.env.BREVO_VERIFIED_EMAIL;

if (!BREVO_VERIFIED_EMAIL) throw new Error('E-mail não configurado.');

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

export const sendRecoveryEmail = async (email: string, token: string) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/recover/${token}`;

    const sendSmtpEmail = {
      to: [{ email }],
      sender: { name: 'SafeTemp', email: process.env.BREVO_VERIFIED_EMAIL },
      subject: 'Recuperação de Senha — SafeTemp',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="text-align: center; color: #962fd6;">SafeTemp</h2>
          <h3 style="text-align: center; color: #333;">Recuperação de Senha</h3>
          <p>Olá, você solicitou a recuperação de senha da sua conta SafeTemp.</p>
          <p>Clique no botão abaixo para redefinir sua senha:</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" style="background-color: #962fd6; color: #fff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Redefinir Senha
            </a>
          </div>
          <p style="color: #e53e3e; text-align: center; font-size: 13px;">
            Atenção: este link expira em 15 minutos.
          </p>
          <p style="color: #999; font-size: 12px;">Se você não solicitou isso, ignore este e-mail.</p>
        </div>
      `,
    };

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return response;
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    throw new Error('Erro ao enviar e-mail de recuperação');
  }
};