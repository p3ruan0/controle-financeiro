import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { DEFAULT_CATEGORIES } from '../utils/defaultCategories';
import { logAudit } from '../utils/audit';

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

    const existingUser = await prisma.user.findUnique({ where: { email } });
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
        email,
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

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user || user.deletedAt !== null) {
      await prisma.loginHistory.create({
        data: {
          email,
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
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Informe seu e-mail.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ message: 'Se o e-mail existir em nossa base, as instruções de recuperação serão enviadas.' });
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: expiry,
      },
    });

    return res.json({
      message: 'Código de recuperação gerado com sucesso.',
      resetToken,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao processar recuperação de senha.' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.resetToken !== resetToken || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return res.status(400).json({ error: 'Código de recuperação inválido ou expirado.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        lastPasswordChangeAt: new Date(),
      },
    });

    await logAudit({
      targetUserId: user.id,
      action: 'REDEFINIU_SENHA',
      description: `Senha redefinida pelo próprio usuário via fluxo de recuperação`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json({ message: 'Senha redefinida com sucesso! Você já pode fazer login.' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao redefinir senha.' });
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
