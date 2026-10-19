import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { DEFAULT_CATEGORIES } from '../utils/defaultCategories';
import { logAudit } from '../utils/audit';
import { sendPasswordResetEmail } from '../services/mailService';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  companyName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail em formato inválido'),
});

const verifyResetCodeSchema = z.object({
  email: z.string().email('E-mail em formato inválido'),
  code: z.string().regex(/^\d{6}$/, 'O código de verificação deve conter exatamente 6 dígitos numéricos'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('E-mail em formato inválido'),
  resetAuthorizationToken: z.string().min(1, 'Token de autorização é obrigatório'),
  newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'A confirmação de senha deve ter no mínimo 6 caracteres'),
});

// In-memory rate limiting for password recovery requests
interface RateLimitEntry {
  count: number;
  firstRequestAt: number;
  lastRequestAt: number;
}
const recoveryRateLimits = new Map<string, RateLimitEntry>();

// Helper to detect device and browser from user-agent
const parseUserAgent = (userAgentString?: string) => {
  if (!userAgentString) return { device: 'Desconhecido', browser: 'Desconhecido' };
  
  let device = 'Computador';
  if (/mobile/i.test(userAgentString)) device = 'Celular';
  else if (/tablet|ipad/i.test(userAgentString)) device = 'Tablet';

  let browser = 'Navegador';
  if (/chrome/i.test(userAgentString) && !/edg/i.test(userAgentString)) browser = 'Chrome';
  else if (/safari/i.test(userAgentString) && !/chrome/i.test(userAgentString)) browser = 'Safari';
  else if (/firefox/i.test(userAgentString)) browser = 'Firefox';
  else if (/edg/i.test(userAgentString)) browser = 'Edge';

  return { device, browser };
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, companyName } = registerSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Já existe uma conta com este e-mail.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // If this is the very first user in the database, assign SUPER_ADMIN role
    const totalUsersCount = await prisma.user.count();
    const role = totalUsersCount === 0 ? 'SUPER_ADMIN' : 'CLIENT_ADMIN';

    // Optional company creation
    let companyId: string | undefined = undefined;
    if (companyName && companyName.trim()) {
      const company = await prisma.company.create({
        data: {
          name: companyName.trim(),
          contactName: name,
          email,
        },
      });
      companyId = company.id;
    }

    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';
    const { device, browser } = parseUserAgent(userAgent);

    const now = new Date();

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: passwordHash,
        role,
        status: 'ATIVO',
        companyId,
        firstLoginAt: now,
        lastLoginAt: now,
        lastLoginIp: ipAddress,
        lastLoginDevice: device,
        lastLoginBrowser: browser,
        loginCount: 1,
        lastPasswordChangeAt: now,
      },
      include: { company: true },
    });

    // Seed default categories for this user
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        userId: user.id,
      })),
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Create session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        ipAddress,
        userAgent,
        device,
        browser,
        expiresAt,
      },
    });

    // Log Login History
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        email: user.email,
        status: 'SUCCESS',
        ipAddress,
        userAgent,
        device,
        browser,
      },
    });

    return res.status(201).json({
      message: 'Conta criada com sucesso!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        company: user.company ? { id: user.company.id, name: user.company.name } : null,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro no registro:', error);
    return res.status(500).json({ error: 'Erro interno no servidor ao registrar usuário.' });
  }
};

export const login = async (req: Request, res: Response) => {
  const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || '';
  const { device, browser } = parseUserAgent(userAgent);

  try {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { company: true },
    });

    if (!user || user.deletedAt !== null) {
      await prisma.loginHistory.create({
        data: {
          email: normalizedEmail,
          status: 'FAILED',
          ipAddress,
          userAgent,
          device,
          browser,
          failureReason: 'Usuário não encontrado ou inativo',
        },
      });
      return res.status(400).json({ error: 'E-mail ou senha incorretos.' });
    }

    // Check if user is blocked
    if (user.status === 'BLOQUEADO') {
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          email: user.email,
          status: 'BLOCKED',
          ipAddress,
          userAgent,
          device,
          browser,
          failureReason: 'Usuário bloqueado pelo administrador',
        },
      });
      return res.status(403).json({
        error: `Seu acesso à plataforma está bloqueado pelo administrador.${user.blockedReason ? ` Motivo: ${user.blockedReason}` : ''}`,
        isBlocked: true,
      });
    }

    // Check if company is blocked
    if (user.company && user.company.status === 'BLOQUEADO') {
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          email: user.email,
          status: 'BLOCKED',
          ipAddress,
          userAgent,
          device,
          browser,
          failureReason: 'Empresa bloqueada pelo administrador',
        },
      });
      return res.status(403).json({
        error: `O acesso da empresa ${user.company.name} está bloqueado pelo administrador.${user.company.blockedReason ? ` Motivo: ${user.company.blockedReason}` : ''}`,
        isCompanyBlocked: true,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: { increment: 1 } },
      });
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          email: user.email,
          status: 'FAILED',
          ipAddress,
          userAgent,
          device,
          browser,
          failureReason: 'Senha incorreta',
        },
      });
      return res.status(400).json({ error: 'E-mail ou senha incorretos.' });
    }

    const now = new Date();

    // Reset failed attempts, increment count, track last login
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        firstLoginAt: user.firstLoginAt || now,
        lastLoginAt: now,
        lastLoginIp: ipAddress,
        lastLoginDevice: device,
        lastLoginBrowser: browser,
        loginCount: { increment: 1 },
      },
      include: { company: true },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Create active session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        ipAddress,
        userAgent,
        device,
        browser,
        expiresAt,
      },
    });

    // Record login history
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        email: user.email,
        status: 'SUCCESS',
        ipAddress,
        userAgent,
        device,
        browser,
      },
    });

    return res.json({
      message: 'Login realizado com sucesso!',
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        company: updatedUser.company ? { id: updatedUser.company.id, name: updatedUser.company.name } : null,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        companyId: true,
        company: {
          select: { id: true, name: true, status: true },
        },
        firstLoginAt: true,
        lastLoginAt: true,
        loginCount: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar dados do usuário.' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const updateData: any = {};
    if (name && name.trim().length >= 2) {
      updateData.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Informe a senha atual para alterá-la.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Senha atual incorreta.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(newPassword, salt);
      updateData.lastPasswordChangeAt = new Date();
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true },
    });

    return res.json({ message: 'Perfil atualizado com sucesso!', user: updatedUser });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    // Rate Limiting: max 5 requests per 15 minutes, with 60s cooldown
    const now = Date.now();
    const rateLimit = recoveryRateLimits.get(normalizedEmail);
    if (rateLimit) {
      if (now - rateLimit.lastRequestAt < 60 * 1000) {
        const waitSeconds = Math.ceil((60 * 1000 - (now - rateLimit.lastRequestAt)) / 1000);
        return res.status(429).json({
          error: `Aguarde ${waitSeconds} segundos antes de solicitar um novo código de recuperação.`,
        });
      }
      if (now - rateLimit.firstRequestAt < 15 * 60 * 1000 && rateLimit.count >= 5) {
        return res.status(429).json({
          error: 'Muitas solicitações de recuperação para este e-mail. Por segurança, tente novamente em 15 minutos.',
        });
      }
      if (now - rateLimit.firstRequestAt >= 15 * 60 * 1000) {
        recoveryRateLimits.set(normalizedEmail, { count: 1, firstRequestAt: now, lastRequestAt: now });
      } else {
        rateLimit.count += 1;
        rateLimit.lastRequestAt = now;
      }
    } else {
      recoveryRateLimits.set(normalizedEmail, { count: 1, firstRequestAt: now, lastRequestAt: now });
    }

    const genericMessage = 'Se o e-mail informado estiver cadastrado em nossa base, o código de recuperação foi enviado para a sua caixa de entrada. Verifique a pasta de spam.';

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || user.deletedAt !== null || user.status === 'BLOQUEADO') {
      return res.json({ message: genericMessage });
    }

    // Generate cryptographically secure 6-digit random code
    const resetCode = crypto.randomInt(100000, 1000000).toString();
    const codeHash = crypto.createHash('sha256').update(resetCode).digest('hex');

    const expiryMinutes = parseInt(process.env.RESET_TOKEN_EXPIRY_MINUTES || '10', 10);
    const expiry = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: codeHash,
        resetTokenExpiry: expiry,
        resetTokenAttempts: 0,
      },
    });

    // Send email using configured service
    const mailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      code: resetCode,
      expiryMinutes,
    });

    if (!mailResult.success) {
      console.error(`[AUTH] Falha ao enviar e-mail de recuperação para ${user.email}: ${mailResult.error}`);
      return res.status(503).json({
        error: 'Não foi possível enviar o e-mail com o código de recuperação. Verifique a configuração do servidor SMTP e tente novamente.',
      });
    }

    await logAudit({
      targetUserId: user.id,
      companyId: user.companyId,
      action: 'SOLICITOU_RECUPERACAO',
      description: `Código de recuperação gerado e despachado por e-mail para ${user.email}.`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json({
      message: genericMessage,
      providerStatus: mailResult.providerStatus,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0]?.message || 'E-mail inválido.' });
    }
    console.error('Erro ao processar recuperação de senha:', error);
    return res.status(500).json({ error: 'Erro interno ao processar recuperação de senha.' });
  }
};

export const verifyResetCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = verifyResetCodeSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      return res.status(400).json({ error: 'Código de recuperação inválido ou inexistente. Solicite um novo código.' });
    }

    // Check if code was already verified and awaiting password reset
    if (user.resetToken.startsWith('AUTHORIZED:')) {
      return res.status(400).json({
        error: 'Este código já foi validado. Conclua a definição de sua nova senha.',
      });
    }

    // Check expiration
    if (new Date() > user.resetTokenExpiry) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: null, resetTokenExpiry: null, resetTokenAttempts: 0 },
      });
      return res.status(400).json({ error: 'O código de recuperação expirou. Solicite um novo código.' });
    }

    // Check brute force attempts (max 5)
    if (user.resetTokenAttempts >= 5) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: null, resetTokenExpiry: null, resetTokenAttempts: 0 },
      });
      return res.status(429).json({
        error: 'Limite de tentativas excedido para este código. Por segurança, o código foi cancelado. Solicite um novo.',
      });
    }

    // Compare hash with timing-safe comparison
    const inputHash = crypto.createHash('sha256').update(code.trim()).digest('hex');
    const isMatch =
      inputHash.length === user.resetToken.length &&
      crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(user.resetToken));

    if (!isMatch) {
      const newAttempts = user.resetTokenAttempts + 1;
      const remaining = 5 - newAttempts;
      if (remaining <= 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { resetToken: null, resetTokenExpiry: null, resetTokenAttempts: 0 },
        });
        return res.status(400).json({
          error: 'Código incorreto. Limite máximo de tentativas atingido. O código foi invalidado.',
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { resetTokenAttempts: newAttempts },
        });
        return res.status(400).json({
          error: `Código de verificação incorreto. Você ainda tem ${remaining} tentativa(s).`,
          remainingAttempts: remaining,
        });
      }
    }

    // Code verified! Generate single-use authorization token
    const nonce = crypto.randomBytes(24).toString('hex');
    const authExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes window

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: `AUTHORIZED:${nonce}`,
        resetTokenExpiry: authExpiry,
        resetTokenAttempts: 0,
      },
    });

    const resetAuthorizationToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        purpose: 'PASSWORD_RESET_AUTHORIZED',
        nonce,
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );

    return res.json({
      message: 'Código de verificação validado com sucesso! Agora você pode cadastrar sua nova senha.',
      resetAuthorizationToken,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0]?.message || 'Dados inválidos.' });
    }
    console.error('Erro ao validar código de recuperação:', error);
    return res.status(500).json({ error: 'Erro interno ao validar código.' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, resetAuthorizationToken, newPassword, confirmPassword } = resetPasswordSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'A nova senha e a confirmação de senha não coincidem.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
    }

    // Verify reset authorization JWT
    let decoded: any;
    try {
      decoded = jwt.verify(resetAuthorizationToken, process.env.JWT_SECRET || 'secret');
    } catch (err) {
      return res.status(401).json({
        error: 'Autorização de redefinição expirada ou inválida. Recomece o processo de recuperação.',
      });
    }

    if (decoded.purpose !== 'PASSWORD_RESET_AUTHORIZED' || !decoded.userId || !decoded.nonce) {
      return res.status(401).json({ error: 'Token de autorização inválido.' });
    }

    if (decoded.email.toLowerCase() !== normalizedEmail) {
      return res.status(401).json({ error: 'A autorização de redefinição não corresponde ao e-mail informado.' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.deletedAt !== null) {
      return res.status(404).json({ error: 'Usuário não encontrado ou inativo.' });
    }

    if (user.status === 'BLOQUEADO') {
      return res.status(403).json({ error: 'Sua conta está bloqueada pelo administrador.' });
    }

    // Ensure authorization state matches nonce and has not been used or expired
    if (
      !user.resetToken ||
      user.resetToken !== `AUTHORIZED:${decoded.nonce}` ||
      !user.resetTokenExpiry ||
      new Date() > user.resetTokenExpiry
    ) {
      return res.status(401).json({
        error: 'Esta autorização de redefinição já foi utilizada ou expirou. Solicite um novo código.',
      });
    }

    // Secure bcrypt hashing
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Persist new password and invalidate reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        resetTokenAttempts: 0,
        failedLoginAttempts: 0,
        lastPasswordChangeAt: new Date(),
      },
    });

    // Invalidate all active sessions for this user across devices
    await prisma.userSession.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    });

    await logAudit({
      targetUserId: user.id,
      companyId: user.companyId,
      action: 'REDEFINIU_SENHA',
      description: `Senha redefinida com sucesso pelo usuário (${user.email}). Todas as sessões anteriores foram encerradas.`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json({
      message: 'Senha alterada com sucesso! Todas as sessões anteriores foram encerradas por segurança. Você já pode fazer login com sua nova senha.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0]?.message || 'Dados inválidos.' });
    }
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({ error: 'Erro interno ao redefinir senha.' });
  }
};

// Accept invitation public endpoint
export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token e senha são obrigatórios.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { company: true },
    });

    if (!invitation || invitation.status !== 'PENDENTE' || invitation.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Convite inválido, cancelado ou expirado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user or update existing
    const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } });
    const createdOrUpdatedUser = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            password: passwordHash,
            status: 'ATIVO',
            role: invitation.role,
            companyId: invitation.companyId,
            lastPasswordChangeAt: new Date(),
          },
        })
      : await prisma.user.create({
          data: {
            name: invitation.name,
            email: invitation.email,
            password: passwordHash,
            role: invitation.role,
            status: 'ATIVO',
            companyId: invitation.companyId,
            lastPasswordChangeAt: new Date(),
          },
        });

    if (!existingUser) {
      // Seed categories for new user
      await prisma.category.createMany({
        data: DEFAULT_CATEGORIES.map(cat => ({
          ...cat,
          userId: createdOrUpdatedUser.id,
        })),
      });
    }

    // Mark invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACEITO',
        acceptedAt: new Date(),
      },
    });

    await logAudit({
      targetUserId: createdOrUpdatedUser.id,
      companyId: invitation.companyId,
      action: 'ACEITOU_CONVITE',
      description: `Usuário ${createdOrUpdatedUser.email} aceitou o convite e ativou seu acesso.`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json({
      message: 'Conta ativada com sucesso! Você já pode fazer login na plataforma.',
    });
  } catch (error) {
    console.error('Erro ao aceitar convite:', error);
    return res.status(500).json({ error: 'Erro ao aceitar convite.' });
  }
};
