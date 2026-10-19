import nodemailer, { Transporter } from 'nodemailer';

export interface SendResetEmailParams {
  to: string;
  name: string;
  code: string;
  expiryMinutes?: number;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string | false;
  error?: string;
  providerStatus?: string;
}

// Global cached transporter to reuse connection pools
let transporterInstance: Transporter | null = null;
let isEthereal = false;

/**
 * Creates or retrieves the nodemailer transporter based on environment variables.
 */
export async function getTransporter(): Promise<{ transporter: Transporter; isFallback: boolean }> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  // If explicit SMTP credentials are provided
  if (host && user && pass) {
    if (!transporterInstance || isEthereal) {
      transporterInstance = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
      });
      isEthereal = false;
    }
    return { transporter: transporterInstance, isFallback: false };
  }

  // Fallback in Development / Testing: use Ethereal Test Account
  if (!transporterInstance || !isEthereal) {
    try {
      console.log('[MAIL SERVICE] SMTP_HOST não configurado. Criando conta de teste segura (Ethereal)...');
      const testAccount = await nodemailer.createTestAccount();
      transporterInstance = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      isEthereal = true;
      console.log(`[MAIL SERVICE] Transporter Ethereal inicializado: ${testAccount.user}`);
    } catch (err: any) {
      console.error('[MAIL SERVICE] Falha ao criar conta Ethereal:', err.message);
      // Last-resort stub transporter to avoid crashing server if offline
      transporterInstance = nodemailer.createTransport({
        jsonTransport: true,
      });
      isEthereal = true;
    }
  }

  return { transporter: transporterInstance, isFallback: true };
}

/**
 * Verifies if the SMTP transporter is operational.
 */
export async function verifyMailConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const { transporter, isFallback } = await getTransporter();
    await transporter.verify();
    return {
      ok: true,
      message: isFallback
        ? 'Conexão ativa via provedor de testes (Ethereal).'
        : 'Conexão SMTP com provedor oficial validada com sucesso.',
    };
  } catch (error: any) {
    return {
      ok: false,
      message: `Falha na verificação SMTP: ${error.message}`,
    };
  }
}

/**
 * Sends a password recovery email with the 6-digit verification code.
 */
export async function sendPasswordResetEmail({
  to,
  name,
  code,
  expiryMinutes = 10,
}: SendResetEmailParams): Promise<SendEmailResult> {
  const from = process.env.EMAIL_FROM || '"Fluxo de Caixa" <nao-responda@fluxocaixa.com>';
  const sanitizedName = name || 'Usuário';

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Senha - FluxoCaixa</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0f172a;
      color: #334155;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 540px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }
    .header {
      background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .text {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }
    .code-box {
      background: #f8fafc;
      border: 2px dashed #0284c7;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .code-label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .code-digits {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #0284c7;
      font-family: 'Courier New', Courier, monospace;
    }
    .warning {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      font-size: 12px;
      color: #92400e;
      border-radius: 4px;
      margin-bottom: 24px;
    }
    .footer {
      background: #f1f5f9;
      padding: 20px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Fluxo<span style="color: #38bdf8;">Caixa</span></h1>
      <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Recuperação de Acesso e Segurança</p>
    </div>
    <div class="content">
      <div class="greeting">Olá, ${sanitizedName}!</div>
      <p class="text">
        Recebemos uma solicitação para redefinir a senha da sua conta vinculada a este endereço de e-mail.
        Utilize o código de validação de 6 dígitos abaixo para prosseguir com a recuperação:
      </p>

      <div class="code-box">
        <div class="code-label">Código de Verificação</div>
        <div class="code-digits">${code}</div>
      </div>

      <div class="warning">
        <strong>Atenção:</strong> Este código é válido por <strong>${expiryMinutes} minutos</strong> e de uso único.
        Nunca compartilhe este código com ninguém. Nossa equipe nunca solicitará seu código de recuperação.
      </div>

      <p class="text" style="font-size: 12px; color: #64748b; margin-bottom: 0;">
        Se você não solicitou a redefinição de senha, nenhuma ação é necessária. Sua senha atual permanece inalterada e sua conta protegida.
      </p>
    </div>
    <div class="footer">
      Este é um e-mail automático gerado pelo sistema FluxoCaixa.<br />
      Por favor, não responda diretamente a esta mensagem.
    </div>
  </div>
</body>
</html>
  `.trim();

  const textContent = `
Olá, ${sanitizedName}!

Recebemos uma solicitação de recuperação de senha para sua conta no FluxoCaixa.

Seu código de verificação é: ${code}

Este código expira em ${expiryMinutes} minutos e pode ser utilizado apenas uma vez.
Se você não solicitou a recuperação de senha, desconsidere esta mensagem.

Equipe FluxoCaixa
  `.trim();

  try {
    const { transporter, isFallback } = await getTransporter();

    const info = await transporter.sendMail({
      from,
      to,
      subject: `Código de recuperação de senha: ${code.slice(0, 3)}... - FluxoCaixa`,
      text: textContent,
      html: htmlContent,
    });

    const preview = isFallback && nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : false;

    // Never log the actual code in production!
    if (process.env.NODE_ENV === 'production') {
      console.log(`[MAIL SERVICE] E-mail de recuperação enviado para destinatário. MessageId: ${info.messageId}`);
    } else {
      console.log(`[MAIL SERVICE] E-mail enviado com sucesso para ${to}. ID: ${info.messageId}`);
      if (preview) {
        console.log(`[MAIL SERVICE] Preview URL (Ethereal): ${preview}`);
      }
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: preview,
      providerStatus: isFallback ? 'ENVIADO_ETHEREAL_TEST' : 'ENVIADO_SMTP_OFICIAL',
    };
  } catch (error: any) {
    // Operational logging without revealing secrets or code
    console.error(`[MAIL SERVICE ERROR] Falha no disparo de e-mail para ${to}:`, error.message);
    return {
      success: false,
      error: error.message || 'Falha na comunicação com o servidor de e-mail.',
      providerStatus: 'FALHA_ENVIO',
    };
  }
}
