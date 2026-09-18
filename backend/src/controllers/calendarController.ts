import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const getCalendarEvents = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month as string) - 1 : now.getMonth();
    const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();

    const startOfMonth = new Date(year, month, 1, 0, 0, 0);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

    // 1. Transactions in this month (by dueDate or by date)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        OR: [
          { dueDate: { gte: startOfMonth, lte: endOfMonth } },
          { date: { gte: startOfMonth, lte: endOfMonth } },
        ],
        status: { not: 'CANCELADO' },
      },
      include: { category: true },
    });

    // 2. Receivables in this month (by expectedDate or receivedDate)
    const receivables = await prisma.receivableAccount.findMany({
      where: {
        userId,
        expectedDate: { gte: startOfMonth, lte: endOfMonth },
        status: { not: 'CANCELADO' },
      },
      include: { category: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events: Array<{
      id: string;
      source: 'transaction' | 'receivable';
      sourceId: string;
      title: string;
      amount: number;
      date: string;
      type: 'ENTRADA' | 'SAIDA';
      status: string;
      categoryName: string;
      categoryColor: string;
      paymentMethod?: string;
      notes?: string | null;
      isFixed?: boolean;
    }> = [];

    // Map transactions
    transactions.forEach(t => {
      let status = t.status;
      const eventDate = t.dueDate || t.date;
      const d = new Date(eventDate);
      d.setHours(0, 0, 0, 0);

      if (status === 'PENDENTE' && d < today) {
        status = t.type === 'SAIDA' ? 'VENCIDO' : 'ATRASADO';
      }

      events.push({
        id: `trans-${t.id}`,
        source: 'transaction',
        sourceId: t.id,
        title: t.description,
        amount: t.amount,
        date: new Date(eventDate).toISOString().split('T')[0],
        type: t.type as 'ENTRADA' | 'SAIDA',
        status,
        categoryName: t.category?.name || (t.type === 'ENTRADA' ? 'Receita' : 'Despesa'),
        categoryColor: t.category?.color || (t.type === 'ENTRADA' ? '#10b981' : '#ef4444'),
        paymentMethod: t.paymentMethod,
        notes: t.notes,
        isFixed: t.isFixed,
      });
    });

    // Map receivables
    receivables.forEach(r => {
      let status = r.status;
      const d = new Date(r.expectedDate);
      d.setHours(0, 0, 0, 0);

      if (status === 'A_RECEBER' && d < today) {
        status = 'ATRASADO';
      }

      events.push({
        id: `rec-${r.id}`,
        source: 'receivable',
        sourceId: r.id,
        title: `${r.debtorName}: ${r.description}`,
        amount: r.amount,
        date: new Date(r.expectedDate).toISOString().split('T')[0],
        type: 'ENTRADA',
        status,
        categoryName: r.category?.name || 'A Receber',
        categoryColor: r.category?.color || '#06b6d4',
        notes: r.notes,
      });
    });

    return res.json({
      month: month + 1,
      year,
      events,
    });
  } catch (error) {
    console.error('Erro ao buscar eventos do calendário:', error);
    return res.status(500).json({ error: 'Erro ao buscar eventos do calendário financeiro.' });
  }
};
