import { Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const transactionSchema = z.object({
  type: z.enum(['ENTRADA', 'SAIDA'], { message: 'Tipo deve ser ENTRADA ou SAIDA' }),
  description: z.string().min(1, 'A descrição é obrigatória'),
  amount: z.number().positive('O valor deve ser positivo'),
  date: z.string().transform(str => new Date(str)),
  dueDate: z.string().optional().nullable().transform(str => (str ? new Date(str) : null)),
  paymentDate: z.string().optional().nullable().transform(str => (str ? new Date(str) : null)),
  categoryId: z.string().optional().nullable(),
  subCategory: z.string().optional().nullable(),
  paymentMethod: z.string().default('OUTRO'),
  status: z.enum(['PAGO', 'RECEBIDO', 'PENDENTE', 'VENCIDO', 'ATRASADO', 'CANCELADO']).default('PENDENTE'),
  isFixed: z.boolean().default(false),
  notes: z.string().optional().nullable(),
  recurringExpenseId: z.string().optional().nullable(),
});

// Helper to auto-update overdue status
const checkAndSetOverdue = (status: string, dueDate: Date | null, type: string) => {
  if (dueDate && status === 'PENDENTE') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    if (due < today) {
      return type === 'SAIDA' ? 'VENCIDO' : 'ATRASADO';
    }
  }
  return status;
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      month,
      year,
      type,
      categoryId,
      status,
      paymentMethod,
      isFixed,
      search,
      minAmount,
      maxAmount,
    } = req.query;

    const where: any = {
      userId: req.userId,
    };

    if (type && (type === 'ENTRADA' || type === 'SAIDA')) {
      where.type = type;
    }

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (paymentMethod && paymentMethod !== 'all') {
      where.paymentMethod = paymentMethod;
    }

    if (isFixed !== undefined && isFixed !== 'all') {
      where.isFixed = isFixed === 'true';
    }

    if (minAmount) {
      where.amount = { ...where.amount, gte: parseFloat(minAmount as string) };
    }

    if (maxAmount) {
      where.amount = { ...where.amount, lte: parseFloat(maxAmount as string) };
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      where.OR = [
        { description: { contains: search.trim() } },
        { notes: { contains: search.trim() } },
        { subCategory: { contains: search.trim() } },
      ];
    }

    // Date filters
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    } else if (month && year) {
      const m = parseInt(month as string) - 1; // 0-indexed
      const y = parseInt(year as string);
      const start = new Date(y, m, 1, 0, 0, 0);
      const end = new Date(y, m + 1, 0, 23, 59, 59);
      where.date = {
        gte: start,
        lte: end,
      };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Dynamically adjust overdue status if due date passed and still pending
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mapped = transactions.map(t => {
      let currentStatus = t.status;
      if (t.status === 'PENDENTE' && t.dueDate) {
        const d = new Date(t.dueDate);
        d.setHours(0, 0, 0, 0);
        if (d < today) {
          currentStatus = t.type === 'SAIDA' ? 'VENCIDO' : 'ATRASADO';
        }
      }
      return {
        ...t,
        status: currentStatus,
      };
    });

    return res.json({ transactions: mapped });
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error);
    return res.status(500).json({ error: 'Erro ao buscar lançamentos.' });
  }
};

export const getTransactionById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
      include: { category: true },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Lançamento não encontrado.' });
    }

    return res.json({ transaction });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar lançamento.' });
  }
};

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const data = transactionSchema.parse(req.body);

    const initialStatus = checkAndSetOverdue(data.status, data.dueDate, data.type);

    // If marked as PAGO or RECEBIDO and no paymentDate given, set paymentDate = date or now
    let paymentDate = data.paymentDate;
    if ((data.status === 'PAGO' || data.status === 'RECEBIDO') && !paymentDate) {
      paymentDate = data.date || new Date();
    }

    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        status: initialStatus,
        paymentDate,
        userId: req.userId!,
      },
      include: { category: true },
    });

    return res.status(201).json({
      transaction,
      message: `${data.type === 'ENTRADA' ? 'Entrada' : 'Despesa'} registrada com sucesso!`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao criar lançamento:', error);
    return res.status(500).json({ error: 'Erro ao registrar lançamento.' });
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = transactionSchema.partial().parse(req.body);

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Lançamento não encontrado.' });
    }

    let updatedStatus = data.status || existing.status;
    let dueDate = data.dueDate !== undefined ? data.dueDate : existing.dueDate;
    let type = data.type || existing.type;

    updatedStatus = checkAndSetOverdue(updatedStatus, dueDate, type);

    let paymentDate = data.paymentDate !== undefined ? data.paymentDate : existing.paymentDate;
    if ((updatedStatus === 'PAGO' || updatedStatus === 'RECEBIDO') && !paymentDate) {
      paymentDate = new Date();
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...data,
        status: updatedStatus,
        paymentDate,
      },
      include: { category: true },
    });

    return res.json({ transaction, message: 'Lançamento atualizado com sucesso!' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao atualizar lançamento:', error);
    return res.status(500).json({ error: 'Erro ao atualizar lançamento.' });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Lançamento não encontrado.' });
    }

    await prisma.transaction.delete({ where: { id } });

    return res.json({ message: 'Lançamento excluído com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao excluir lançamento.' });
  }
};

export const markAsPaidOrReceived = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentDate } = req.body;

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Lançamento não encontrado.' });
    }

    const newStatus = transaction.type === 'SAIDA' ? 'PAGO' : 'RECEBIDO';
    const effectivePaymentDate = paymentDate ? new Date(paymentDate) : new Date();

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        status: newStatus,
        paymentDate: effectivePaymentDate,
      },
      include: { category: true },
    });

    return res.json({
      transaction: updated,
      message: transaction.type === 'SAIDA' ? 'Conta marcada como paga!' : 'Entrada marcada como recebida!',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar status do lançamento.' });
  }
};
