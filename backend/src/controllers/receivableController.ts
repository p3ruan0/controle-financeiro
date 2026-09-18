import { Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const receivableSchema = z.object({
  debtorName: z.string().min(1, 'O nome da pessoa ou empresa é obrigatório'),
  description: z.string().min(1, 'A descrição é obrigatória'),
  amount: z.number().positive('O valor deve ser positivo'),
  expectedDate: z.string().transform(str => new Date(str)),
  receivedDate: z.string().optional().nullable().transform(str => (str ? new Date(str) : null)),
  categoryId: z.string().optional().nullable(),
  status: z.enum(['A_RECEBER', 'RECEBIDO', 'ATRASADO', 'CANCELADO']).default('A_RECEBER'),
  notes: z.string().optional().nullable(),
});

export const getReceivables = async (req: AuthRequest, res: Response) => {
  try {
    const { status, search } = req.query;

    const where: any = { userId: req.userId };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      where.OR = [
        { debtorName: { contains: search.trim() } },
        { description: { contains: search.trim() } },
        { notes: { contains: search.trim() } },
      ];
    }

    const receivables = await prisma.receivableAccount.findMany({
      where,
      include: { category: true },
      orderBy: { expectedDate: 'asc' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Dynamically flag overdue as ATRASADO if expectedDate is past and status is A_RECEBER
    const mapped = receivables.map(r => {
      let currentStatus = r.status;
      if (r.status === 'A_RECEBER' && r.expectedDate) {
        const d = new Date(r.expectedDate);
        d.setHours(0, 0, 0, 0);
        if (d < today) {
          currentStatus = 'ATRASADO';
        }
      }
      return { ...r, status: currentStatus };
    });

    // Summary calculations
    let totalAReceber = 0;
    let totalRecebido = 0;
    let totalAtrasado = 0;

    mapped.forEach(r => {
      if (r.status === 'A_RECEBER') totalAReceber += r.amount;
      else if (r.status === 'RECEBIDO') totalRecebido += r.amount;
      else if (r.status === 'ATRASADO') totalAtrasado += r.amount;
    });

    return res.json({
      receivables: mapped,
      summary: {
        totalAReceber,
        totalRecebido,
        totalAtrasado,
        totalGeralPrevisto: totalAReceber + totalAtrasado,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar contas a receber:', error);
    return res.status(500).json({ error: 'Erro ao buscar contas a receber.' });
  }
};

export const createReceivable = async (req: AuthRequest, res: Response) => {
  try {
    const data = receivableSchema.parse(req.body);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(data.expectedDate);
    exp.setHours(0, 0, 0, 0);

    let initialStatus = data.status;
    if (initialStatus === 'A_RECEBER' && exp < today) {
      initialStatus = 'ATRASADO';
    }

    const receivable = await prisma.receivableAccount.create({
      data: {
        ...data,
        status: initialStatus,
        userId: req.userId!,
      },
      include: { category: true },
    });

    return res.status(201).json({
      receivable,
      message: 'Valor a receber cadastrado com sucesso!',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao criar conta a receber:', error);
    return res.status(500).json({ error: 'Erro ao cadastrar conta a receber.' });
  }
};

export const updateReceivable = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = receivableSchema.partial().parse(req.body);

    const existing = await prisma.receivableAccount.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Conta a receber não encontrada.' });
    }

    const updated = await prisma.receivableAccount.update({
      where: { id },
      data,
      include: { category: true },
    });

    return res.json({ receivable: updated, message: 'Conta a receber atualizada com sucesso!' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    return res.status(500).json({ error: 'Erro ao atualizar conta a receber.' });
  }
};

export const markAsReceived = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { receivedDate, createTransactionEntry } = req.body;

    const receivable = await prisma.receivableAccount.findFirst({
      where: { id, userId: req.userId },
      include: { category: true },
    });

    if (!receivable) {
      return res.status(404).json({ error: 'Conta a receber não encontrada.' });
    }

    const effectiveDate = receivedDate ? new Date(receivedDate) : new Date();

    const updated = await prisma.receivableAccount.update({
      where: { id },
      data: {
        status: 'RECEBIDO',
        receivedDate: effectiveDate,
      },
      include: { category: true },
    });

    // Optionally create a transaction entry in cash flow so it counts into Saldo Atual
    if (createTransactionEntry !== false) {
      await prisma.transaction.create({
        data: {
          userId: req.userId!,
          categoryId: receivable.categoryId,
          type: 'ENTRADA',
          description: `Recebimento: ${receivable.debtorName} - ${receivable.description}`,
          amount: receivable.amount,
          date: effectiveDate,
          dueDate: receivable.expectedDate,
          paymentDate: effectiveDate,
          status: 'RECEBIDO',
          paymentMethod: 'PIX',
          notes: receivable.notes ? `Recebido de ${receivable.debtorName}: ${receivable.notes}` : `Recebido de ${receivable.debtorName}`,
        },
      });
    }

    return res.json({
      receivable: updated,
      message: 'Valor marcado como recebido com sucesso!',
    });
  } catch (error) {
    console.error('Erro ao marcar como recebido:', error);
    return res.status(500).json({ error: 'Erro ao marcar valor como recebido.' });
  }
};

export const deleteReceivable = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.receivableAccount.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Conta a receber não encontrada.' });
    }

    await prisma.receivableAccount.delete({ where: { id } });

    return res.json({ message: 'Conta a receber excluída com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao excluir conta a receber.' });
  }
};
