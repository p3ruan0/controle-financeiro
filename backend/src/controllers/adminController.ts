import { Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import { DEFAULT_CATEGORIES } from '../utils/defaultCategories';

// --- 1. ADMIN DASHBOARD ---
export const getAdminDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Users counts
    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      pendingUsers,
      neverLoggedInUsers,
      totalCompanies,
      activeCompanies,
      blockedCompanies,
      accessesToday,
      accesses7Days,
      accesses30Days,
      inactiveOver30Days,
      pendingInvitations,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, status: 'ATIVO' } }),
      prisma.user.count({ where: { deletedAt: null, status: 'BLOQUEADO' } }),
      prisma.user.count({ where: { deletedAt: null, status: 'PENDENTE' } }),
      prisma.user.count({ where: { deletedAt: null, lastLoginAt: null } }),
      prisma.company.count(),
      prisma.company.count({ where: { status: 'ATIVO' } }),
      prisma.company.count({ where: { status: 'BLOQUEADO' } }),
      prisma.loginHistory.count({ where: { status: 'SUCCESS', createdAt: { gte: todayStart } } }),
      prisma.loginHistory.count({ where: { status: 'SUCCESS', createdAt: { gte: sevenDaysAgo } } }),
      prisma.loginHistory.count({ where: { status: 'SUCCESS', createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({
        where: {
          deletedAt: null,
          lastLoginAt: { lte: thirtyDaysAgo },
        },
      }),
      prisma.invitation.count({ where: { status: 'PENDENTE', expiresAt: { gte: now } } }),
    ]);

    // Recent logins
    const recentLogins = await prisma.loginHistory.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // Recent audit logs
    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        adminUser: { select: { id: true, name: true, email: true } },
        targetUser: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true } },
      },
    });

    return res.json({
      metrics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          blocked: blockedUsers,
          pending: pendingUsers,
          neverLoggedIn: neverLoggedInUsers,
        },
        companies: {
          total: totalCompanies,
          active: activeCompanies,
          blocked: blockedCompanies,
        },
        accesses: {
          today: accessesToday,
          last7Days: accesses7Days,
          last30Days: accesses30Days,
        },
        alerts: {
          inactiveOver30Days,
          neverLoggedIn: neverLoggedInUsers,
          blockedUsers,
          pendingInvitations,
        },
      },
      recentLogins,
      recentAuditLogs,
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard admin:', error);
    return res.status(500).json({ error: 'Erro ao carregar dashboard administrativo.' });
  }
};

// --- 2. USERS MANAGEMENT ---
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, role, companyId, lastAccess } = req.query;

    const where: any = {
      // By default show non-deleted, unless specifically filtered
    };

    if (status && status !== 'all') {
      where.status = status;
    } else {
      where.deletedAt = null; // Do not show soft deleted by default
    }

    if (status === 'EXCLUIDO') {
      delete where.deletedAt;
      where.status = 'EXCLUIDO';
    }

    if (role && role !== 'all') {
      where.role = role;
    }

    if (companyId && companyId !== 'all') {
      where.companyId = companyId;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term } },
        { email: { contains: term } },
        { id: { contains: term } },
        { company: { name: { contains: term } } },
      ];
    }

    // Last access date filters
    const now = new Date();
    if (lastAccess) {
      if (lastAccess === 'hoje') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        where.lastLoginAt = { gte: todayStart };
      } else if (lastAccess === '7dias') {
        const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        where.lastLoginAt = { gte: d };
      } else if (lastAccess === '30dias') {
        const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        where.lastLoginAt = { gte: d };
      } else if (lastAccess === 'mais30') {
        const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        where.lastLoginAt = { lte: d, not: null };
      } else if (lastAccess === 'mais60') {
        const d = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        where.lastLoginAt = { lte: d, not: null };
      } else if (lastAccess === 'mais90') {
        const d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        where.lastLoginAt = { lte: d, not: null };
      } else if (lastAccess === 'nunca') {
        where.lastLoginAt = null;
      }
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        companyId: true,
        company: { select: { id: true, name: true, status: true } },
        firstLoginAt: true,
        lastLoginAt: true,
        lastLoginIp: true,
        lastLoginDevice: true,
        lastLoginBrowser: true,
        loginCount: true,
        blockedAt: true,
        blockedReason: true,
        createdAt: true,
        deletedAt: true,
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return res.json({ users });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return res.status(500).json({ error: 'Erro ao buscar lista de usuários.' });
  }
};

export const getUserDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        companyId: true,
        company: { select: { id: true, name: true, cnpj: true, status: true } },
        firstLoginAt: true,
        lastLoginAt: true,
        lastLoginIp: true,
        lastLoginDevice: true,
        lastLoginBrowser: true,
        loginCount: true,
        failedLoginAttempts: true,
        lastPasswordChangeAt: true,
        blockedAt: true,
        blockedReason: true,
        blockedByUserId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Fetch active sessions
    const sessions = await prisma.userSession.findMany({
      where: { userId: id, isActive: true },
      orderBy: { lastActivityAt: 'desc' },
      take: 10,
    });

    // Fetch recent login history
    const loginHistories = await prisma.loginHistory.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Fetch audit logs affecting this user
    const auditLogs = await prisma.auditLog.findMany({
      where: { targetUserId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        adminUser: { select: { id: true, name: true, email: true } },
      },
      take: 15,
    });

    return res.json({
      user,
      sessions,
      loginHistories,
      auditLogs,
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do usuário:', error);
    return res.status(500).json({ error: 'Erro ao carregar detalhes do usuário.' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const userSchema = z.object({
      name: z.string().min(2, 'Nome é obrigatório'),
      email: z.string().email('E-mail inválido'),
      password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
      role: z.enum(['SUPER_ADMIN', 'ADMIN', 'CLIENT_ADMIN', 'USER']).default('USER'),
      companyId: z.string().optional().nullable(),
      sendInvitation: z.boolean().default(false),
    });

    const data = userSchema.parse(req.body);

    // Permission check: only SUPER_ADMIN can create ADMIN or SUPER_ADMIN
    if ((data.role === 'ADMIN' || data.role === 'SUPER_ADMIN') && req.userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Apenas o Super Admin pode criar usuários administradores.' });
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(400).json({ error: 'Já existe um usuário com este e-mail.' });
    }

    // If invitation mode is active and no password provided, generate random initial password
    const rawPassword = data.password || crypto.randomBytes(8).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: passwordHash,
        role: data.role,
        status: data.sendInvitation ? 'PENDENTE' : 'ATIVO',
        companyId: data.companyId || null,
        lastPasswordChangeAt: new Date(),
      },
      include: { company: true },
    });

    // Seed default categories
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map(cat => ({ ...cat, userId: user.id })),
    });

    let invitationToken: string | undefined = undefined;
    if (data.sendInvitation) {
      invitationToken = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await prisma.invitation.create({
        data: {
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          token: invitationToken,
          status: 'PENDENTE',
          expiresAt,
          createdById: req.userId,
        },
      });
    }

    await logAudit({
      adminUserId: req.userId,
      targetUserId: user.id,
      companyId: user.companyId,
      action: 'CRIOU_USUARIO',
      description: `Administrador ${req.userEmail} cadastrou o usuário ${user.name} (${user.email}) como ${user.role}.`,
      metadata: { role: user.role, status: user.status, sendInvitation: data.sendInvitation },
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.status(201).json({
      message: data.sendInvitation
        ? 'Usuário cadastrado com sucesso! Convite de acesso gerado.'
        : 'Usuário cadastrado com sucesso!',
      user,
      temporaryPassword: data.sendInvitation ? undefined : rawPassword,
      invitationToken,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao criar usuário:', error);
    return res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateSchema = z.object({
      name: z.string().min(2).optional(),
      email: z.string().email().optional(),
      role: z.enum(['SUPER_ADMIN', 'ADMIN', 'CLIENT_ADMIN', 'USER']).optional(),
      companyId: z.string().optional().nullable(),
      status: z.enum(['ATIVO', 'BLOQUEADO', 'PENDENTE']).optional(),
    });

    const data = updateSchema.parse(req.body);

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Role safety check
    if (data.role && (data.role === 'ADMIN' || data.role === 'SUPER_ADMIN') && req.userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Apenas o Super Admin pode atribuir perfis de administrador.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      include: { company: true },
    });

    await logAudit({
      adminUserId: req.userId,
      targetUserId: id,
      companyId: updated.companyId,
      action: 'EDITOU_USUARIO',
      description: `Administrador ${req.userEmail} atualizou os dados do usuário ${updated.name}.`,
      metadata: { changes: data },
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json({ message: 'Usuário atualizado com sucesso!', user: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao atualizar usuário:', error);
    return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
};

export const blockUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (id === req.userId) {
      return res.status(400).json({ error: 'Você não pode bloquear sua própria conta de administrador.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (targetUser.role === 'SUPER_ADMIN' && req.userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Você não tem permissão para bloquear um Super Administrador.' });
    }

    const blocked = await prisma.user.update({
      where: { id },
      data: {
        status: 'BLOQUEADO',
        blockedAt: new Date(),
        blockedReason: reason || 'Bloqueio administrativo',
        blockedByUserId: req.userId,
      },
    });

    // Invalidate active sessions immediately
    await prisma.userSession.updateMany({
      where: { userId: id, isActive: true },
      data: { isActive: false },
    });

    await logAudit({
      adminUserId: req.userId,
      targetUserId: id,
      companyId: blocked.companyId,
      action: 'BLOQUEOU_USUARIO',
      description: `Administrador ${req.userEmail} bloqueou o acesso de ${blocked.name} (${blocked.email}). Motivo: ${reason || 'Bloqueio administrativo'}.`,
      metadata: { reason },
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json({
      message: 'Usuário bloqueado com sucesso! Sessões ativas foram encerradas.',
      user: blocked,
    });
  } catch (error) {
    console.error('Erro ao bloquear usuário:', error);
    return res.status(500).json({ error: 'Erro ao bloquear usuário.' });
  }
};

export const unblockUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const unblocked = await prisma.user.update({
      where: { id },
      data: {
        status: 'ATIVO',
        blockedAt: null,
        blockedReason: null,
        blockedByUserId: null,
        failedLoginAttempts: 0,
      },
    });

    await logAudit({
      adminUserId: req.userId,
      targetUserId: id,
      companyId: unblocked.companyId,
      action: 'DESBLOQUEOU_USUARIO',
      description: `Administrador ${req.userEmail} desbloqueou o acesso de ${unblocked.name}.`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json({ message: 'Acesso do usuário desbloqueado com sucesso!', user: unblocked });
  } catch (error) {
    console.error('Erro ao desbloquear usuário:', error);
    return res.status(500).json({ error: 'Erro ao desbloquear usuário.' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (id === req.userId) {
      return res.status(400).json({ error: 'Você não pode excluir sua própria conta.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (targetUser.role === 'SUPER_ADMIN' && req.userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Você não tem permissão para excluir um Super Administrador.' });
    }

    // Soft delete: set deletedAt, status EXCLUIDO and end sessions
    await prisma.user.update({
      where: { id },
      data: {
        status: 'EXCLUIDO',
        deletedAt: new Date(),
      },
    });

    await prisma.userSession.updateMany({
      where: { userId: id, isActive: true },
      data: { isActive: false },
    });

    await logAudit({
      adminUserId: req.userId,
      targetUserId: id,
      companyId: targetUser.companyId,
      action: 'EXCLUIU_USUARIO',
      description: `Administrador ${req.userEmail} realizou exclusão lógica (soft delete) do usuário ${targetUser.name} (${targetUser.email}).`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json({
      message: 'Usuário removido da plataforma com sucesso (registros preservados para auditoria).',
    });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
};

export const adminResetPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Generate secure temporary password
    const temporaryPassword = crypto.randomBytes(4).toString('hex').toUpperCase() + '!';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(temporaryPassword, salt);

    await prisma.user.update({
      where: { id },
      data: {
        password: passwordHash,
        lastPasswordChangeAt: new Date(),
        failedLoginAttempts: 0,
      },
    });

    // Invalidate sessions so user must log in with new password
    await prisma.userSession.updateMany({
      where: { userId: id, isActive: true },
      data: { isActive: false },
    });

    await logAudit({
      adminUserId: req.userId,
      targetUserId: id,
      companyId: targetUser.companyId,
      action: 'REDEFINIU_SENHA',
      description: `Administrador ${req.userEmail} gerou nova senha temporária para o usuário ${targetUser.name}.`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json({
      message: 'Nova senha temporária gerada com sucesso!',
      temporaryPassword,
    });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({ error: 'Erro ao redefinir senha do usuário.' });
  }
};

// --- 3. COMPANIES / CLIENTS MANAGEMENT ---
export const getCompanies = async (req: AuthRequest, res: Response) => {
  try {
    const { search, status } = req.query;

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term } },
        { contactName: { contains: term } },
        { email: { contains: term } },
        { cnpj: { contains: term } },
      ];
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        users: {
          where: { deletedAt: null },
          select: { id: true, name: true, email: true, status: true, lastLoginAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = companies.map(c => {
      // Find latest login among all company users
      let latestLogin: Date | null = null;
      c.users.forEach(u => {
        if (u.lastLoginAt) {
          if (!latestLogin || u.lastLoginAt > latestLogin) {
            latestLogin = u.lastLoginAt;
          }
        }
      });

      return {
        id: c.id,
        name: c.name,
        cnpj: c.cnpj,
        contactName: c.contactName,
        email: c.email,
        phone: c.phone,
        status: c.status,
        blockedAt: c.blockedAt,
        blockedReason: c.blockedReason,
        createdAt: c.createdAt,
        usersCount: c.users.length,
        activeUsersCount: c.users.filter(u => u.status === 'ATIVO').length,
        latestLogin,
      };
    });

    return res.json({ companies: mapped });
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    return res.status(500).json({ error: 'Erro ao buscar clientes/empresas.' });
  }
};

export const createCompany = async (req: AuthRequest, res: Response) => {
  try {
    const companySchema = z.object({
      name: z.string().min(2, 'O nome da empresa é obrigatório'),
      cnpj: z.string().optional().nullable(),
      contactName: z.string().optional().nullable(),
      email: z.string().email().optional().nullable(),
      phone: z.string().optional().nullable(),
    });

    const data = companySchema.parse(req.body);

    const company = await prisma.company.create({
      data: {
        name: data.name,
        cnpj: data.cnpj || null,
        contactName: data.contactName || null,
        email: data.email || null,
        phone: data.phone || null,
        status: 'ATIVO',
      },
    });

    await logAudit({
      adminUserId: req.userId,
      companyId: company.id,
      action: 'CRIOU_CLIENTE',
      description: `Administrador ${req.userEmail} cadastrou a empresa/cliente "${company.name}".`,
      metadata: data,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.status(201).json({ message: 'Empresa cadastrada com sucesso!', company });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao criar empresa:', error);
    return res.status(500).json({ error: 'Erro ao criar empresa.' });
  }
};

export const updateCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companySchema = z.object({
      name: z.string().min(2).optional(),
      cnpj: z.string().optional().nullable(),
      contactName: z.string().optional().nullable(),
      email: z.string().email().optional().nullable(),
      phone: z.string().optional().nullable(),
    });

    const data = companySchema.parse(req.body);

    const updated = await prisma.company.update({
      where: { id },
      data,
    });

    await logAudit({
      adminUserId: req.userId,
      companyId: id,
      action: 'EDITOU_CLIENTE',
      description: `Administrador ${req.userEmail} atualizou os dados da empresa "${updated.name}".`,
      metadata: data,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json({ message: 'Empresa atualizada com sucesso!', company: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao atualizar empresa:', error);
    return res.status(500).json({ error: 'Erro ao atualizar empresa.' });
  }
};

export const toggleCompanyStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'block' | 'unblock'

    const company = await prisma.company.findUnique({ where: { id }, include: { users: true } });
    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }

    const isBlocking = action === 'block';

    const updated = await prisma.company.update({
      where: { id },
      data: {
        status: isBlocking ? 'BLOQUEADO' : 'ATIVO',
        blockedAt: isBlocking ? new Date() : null,
        blockedReason: isBlocking ? (reason || 'Bloqueio administrativo da empresa') : null,
      },
    });

    if (isBlocking) {
      // Invalidate active sessions of all users in this company
      const companyUserIds = company.users.map(u => u.id);
      if (companyUserIds.length > 0) {
        await prisma.userSession.updateMany({
          where: { userId: { in: companyUserIds }, isActive: true },
          data: { isActive: false },
        });
      }
    }

    await logAudit({
      adminUserId: req.userId,
      companyId: id,
      action: isBlocking ? 'BLOQUEOU_CLIENTE' : 'REATIVOU_CLIENTE',
      description: isBlocking
        ? `Administrador ${req.userEmail} BLOQUEOU a empresa "${company.name}" e todos os seus usuários. Motivo: ${reason || 'Bloqueio administrativo'}.`
        : `Administrador ${req.userEmail} REATIVOU o acesso da empresa "${company.name}".`,
      metadata: { action, reason },
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json({
      message: isBlocking
        ? 'Empresa bloqueada com sucesso! Todos os usuários vinculados perderam o acesso.'
        : 'Empresa reativada com sucesso!',
      company: updated,
    });
  } catch (error) {
    console.error('Erro ao alterar status da empresa:', error);
    return res.status(500).json({ error: 'Erro ao alterar status da empresa.' });
  }
};

export const getCompanyUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const users = await prisma.user.findMany({
      where: { companyId: id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        loginCount: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar usuários da empresa.' });
  }
};

// --- 4. AUDIT LOGS ---
export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { search, action, limit = '50' } = req.query;

    const where: any = {};
    if (action && action !== 'all') {
      where.action = action;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim();
      where.OR = [
        { description: { contains: term } },
        { action: { contains: term } },
        { adminUser: { name: { contains: term } } },
        { adminUser: { email: { contains: term } } },
        { targetUser: { name: { contains: term } } },
        { targetUser: { email: { contains: term } } },
        { company: { name: { contains: term } } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      take: Math.min(parseInt(limit as string) || 50, 100),
      orderBy: { createdAt: 'desc' },
      include: {
        adminUser: { select: { id: true, name: true, email: true, role: true } },
        targetUser: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true } },
      },
    });

    return res.json({ logs });
  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    return res.status(500).json({ error: 'Erro ao buscar logs de auditoria.' });
  }
};

// --- 5. SESSIONS CONTROL ---
export const getActiveSessions = async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await prisma.userSession.findMany({
      where: { isActive: true },
      orderBy: { lastActivityAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            company: { select: { name: true } },
          },
        },
      },
    });

    return res.json({ sessions });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar sessões ativas.' });
  }
};

export const terminateSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const session = await prisma.userSession.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada.' });
    }

    await prisma.userSession.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      adminUserId: req.userId,
      targetUserId: session.userId,
      action: 'ENCERROU_SESSAO',
      description: `Administrador ${req.userEmail} encerrou a sessão remota do usuário ${session.user.name}.`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json({ message: 'Sessão encerrada com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao encerrar sessão.' });
  }
};

export const terminateUserSessions = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const result = await prisma.userSession.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    await logAudit({
      adminUserId: req.userId,
      targetUserId: userId,
      action: 'ENCERROU_TODAS_SESSOES',
      description: `Administrador ${req.userEmail} encerrou todas as ${result.count} sessões ativas do usuário ${targetUser.name}.`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json({
      message: `Todas as sessões ativas de ${targetUser.name} foram encerradas (${result.count} sessões).`,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao encerrar sessões do usuário.' });
  }
};

// --- 6. INVITATIONS ---
export const getInvitations = async (req: AuthRequest, res: Response) => {
  try {
    const invitations = await prisma.invitation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return res.json({ invitations });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar convites.' });
  }
};

export const resendInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const invitation = await prisma.invitation.findUnique({ where: { id } });
    if (!invitation) {
      return res.status(404).json({ error: 'Convite não encontrado.' });
    }

    const newToken = crypto.randomBytes(24).toString('hex');
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updated = await prisma.invitation.update({
      where: { id },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
        status: 'PENDENTE',
      },
    });

    await logAudit({
      adminUserId: req.userId,
      companyId: invitation.companyId,
      action: 'REENVIOU_CONVITE',
      description: `Administrador ${req.userEmail} renovou e reenviou o convite para ${invitation.email}.`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json({
      message: 'Convite renovado com sucesso!',
      invitation: updated,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao reenviar convite.' });
  }
};

export const cancelInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const invitation = await prisma.invitation.findUnique({ where: { id } });
    if (!invitation) {
      return res.status(404).json({ error: 'Convite não encontrado.' });
    }

    await prisma.invitation.update({
      where: { id },
      data: { status: 'CANCELADO' },
    });

    await logAudit({
      adminUserId: req.userId,
      companyId: invitation.companyId,
      action: 'CANCELOU_CONVITE',
      description: `Administrador ${req.userEmail} cancelou o convite para ${invitation.email}.`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json({ message: 'Convite cancelado com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao cancelar convite.' });
  }
};
