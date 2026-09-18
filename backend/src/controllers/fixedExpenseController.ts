import { Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const fixedExpenseSchema = z.object({
  name: z.string().min(1, 'O nome da despesa é obrigatório'),
  amount: z.number().positive('O valor deve ser positivo'),
  categoryId: z.string().optional().nullable(),
  dueDay: z.number().min(1).max(31, 'O dia de vencimento deve ser entre 1 e 31'),
  paymentMethod: z.string().default('BOLETO'),
  recurrence: z.string().default('MENSAL'),
  isActive: z.boolean().default(true),
  autoGenerate: z.boolean().default(true),
  notes: z.string().optional().nullable(),
});

export const getFixedExpenses = async (req: AuthRequest, res: Response) => {
  try {
    const fixedExpenses = await prisma.recurringExpense.findMany({
      where: { userId: req.userId },
      include: { category: true },
      orderBy: { dueDay: 'asc' },
    });

    const totalMonthly = fixedExpenses
      .filter(f => f.isActive)
      .reduce((sum, f) => sum + f.amount, 0);

    return res.json({ fixedExpenses, totalMonthly });
  } catch (error) {
    console.error('Erro ao buscar gastos fixos:', error);
    return res.status(500).json({ error: 'Erro ao buscar gastos fixos.' });
  }
};

export const createFixedExpense = async (req: AuthRequest, res: Response) => {
  try {
    const data = fixedExpenseSchema.parse(req.body);

    const fixed = await prisma.recurringExpense.create({
      data: {
        ...data,
        userId: req.userId!,
      },
      include: { category: true },
    });

    // If autoGenerate is true, generate the transaction for the current month if it doesn't exist
    if (fixed.autoGenerate && fixed.isActive) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth(); // 0-indexed
      // Clamp day to max days in month
      const maxDays = new Date(year, month + 1, 0).getDate();
      const day = Math.min(fixed.dueDay, maxDays);
      const dueDate = new Date(year, month, day, 12, 0, 0);

      // Check if already created
      const existing = await prisma.transaction.findFirst({
        where: {
          userId: req.userId,
          recurringExpenseId: fixed.id,
          date: {
            gte: new Date(year, month, 1),
            lte: new Date(year, month + 1, 0, 23, 59, 59),
          },
        },
      });

      if (!existing) {
        await prisma.transaction.create({
          data: {
            userId: req.userId!,
            categoryId: fixed.categoryId,
            type: 'SAIDA',
            description: fixed.name,
            amount: fixed.amount,
            date: dueDate,
            dueDate: dueDate,
            status: dueDate < now ? 'VENCIDO' : 'PENDENTE',
            paymentMethod: fixed.paymentMethod,
            isFixed: true,
            recurringExpenseId: fixed.id,
            notes: fixed.notes ? `Gasto fixo: ${fixed.notes}` : 'Gasto fixo recorrente',
          },
        });
      }
    }

    return res.status(201).json({
      fixedExpense: fixed,
      message: 'Gasto fixo cadastrado com sucesso!',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao criar gasto fixo:', error);
    return res.status(500).json({ error: 'Erro ao cadastrar gasto fixo.' });
  }
};

export const updateFixedExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = fixedExpenseSchema.partial().parse(req.body);

    const existing = await prisma.recurringExpense.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Gasto fixo não encontrado.' });
    }

    const updated = await prisma.recurringExpense.update({
      where: { id },
      data,
      include: { category: true },
    });

    return res.json({ fixedExpense: updated, message: 'Gasto fixo atualizado com sucesso!' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    return res.status(500).json({ error: 'Erro ao atualizar gasto fixo.' });
  }
};

export const deleteFixedExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.recurringExpense.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Gasto fixo não encontrado.' });
    }

    await prisma.recurringExpense.delete({ where: { id } });

    return res.json({ message: 'Gasto fixo excluído com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao excluir gasto fixo.' });
  }
};

export const generateUpcomingTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.body;
    const now = new Date();
    const targetMonth = month !== undefined ? parseInt(month) - 1 : now.getMonth();
    const targetYear = year !== undefined ? parseInt(year) : now.getFullYear();

    const fixedExpenses = await prisma.recurringExpense.findMany({
      where: { userId: req.userId, isActive: true },
    });

    let createdCount = 0;
    const startOfMonth = new Date(targetYear, targetMonth, 1, 0, 0, 0);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    for (const fixed of fixedExpenses) {
      // Check if already created for this target month
      const existing = await prisma.transaction.findFirst({
        where: {
          userId: req.userId,
          recurringExpenseId: fixed.id,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      if (!existing) {
        const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
        const day = Math.min(fixed.dueDay, maxDays);
        const dueDate = new Date(targetYear, targetMonth, day, 12, 0, 0);

        const status = dueDate < now ? 'VENCIDO' : 'PENDENTE';

        await prisma.transaction.create({
          data: {
            userId: req.userId!,
            categoryId: fixed.categoryId,
            type: 'SAIDA',
            description: fixed.name,
            amount: fixed.amount,
            date: dueDate,
            dueDate: dueDate,
            status,
            paymentMethod: fixed.paymentMethod,
            isFixed: true,
            recurringExpenseId: fixed.id,
            notes: fixed.notes ? `Gasto fixo: ${fixed.notes}` : 'Gasto fixo recorrente',
          },
        });
        createdCount++;
      }
    }

    return res.json({
      message: `${createdCount} lançamento(s) recorrente(s) gerado(s) com sucesso para o período!`,
      createdCount,
    });
  } catch (error) {
    console.error('Erro ao gerar lançamentos automáticos:', error);
    return res.status(500).json({ error: 'Erro ao gerar lançamentos automáticos.' });
  }
};
