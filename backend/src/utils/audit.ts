import prisma from '../lib/prisma';

export async function logAudit({
  adminUserId,
  targetUserId,
  companyId,
  action,
  description,
  metadata,
  ipAddress,
}: {
  adminUserId?: string | null;
  targetUserId?: string | null;
  companyId?: string | null;
  action: string;
  description: string;
  metadata?: any;
  ipAddress?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        adminUserId: adminUserId || null,
        targetUserId: targetUserId || null,
        companyId: companyId || null,
        action,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error('Erro ao gravar log de auditoria:', err);
  }
}
