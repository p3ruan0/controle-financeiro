import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  companyId?: string | null;
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acesso não autorizado. Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'secret';

  try {
    const decoded = jwt.verify(token, secret) as { userId: string; email: string };
    
    // Fetch user and check active status, block and soft delete
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { company: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    if (user.deletedAt !== null) {
      return res.status(401).json({ error: 'Esta conta foi desativada ou excluída da plataforma.' });
    }

    if (user.status === 'BLOQUEADO') {
      return res.status(403).json({
        error: `Seu acesso está bloqueado pelo administrador.${user.blockedReason ? ` Motivo: ${user.blockedReason}` : ''}`,
        isBlocked: true,
      });
    }

    // Check if user's company is blocked
    if (user.company && user.company.status === 'BLOQUEADO') {
      return res.status(403).json({
        error: `O acesso da sua empresa (${user.company.name}) está temporariamente suspenso.${user.company.blockedReason ? ` Motivo: ${user.company.blockedReason}` : ''}`,
        isCompanyBlocked: true,
      });
    }

    req.userId = user.id;
    req.userEmail = user.email;
    req.userRole = user.role;
    req.companyId = user.companyId;
    req.user = user;

    // Optional: touch session activity
    prisma.userSession.updateMany({
      where: { token, isActive: true },
      data: { lastActivityAt: new Date() },
    }).catch(() => {});

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Acesso negado. Esta funcionalidade é exclusiva para Administradores.' });
  }
  next();
};

export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Acesso negado. Esta funcionalidade é restrita ao Administrador Master (Super Admin).' });
  }
  next();
};
