import { Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const categorySchema = z.object({
  name: z.string().min(1, 'O nome da categoria é obrigatório'),
  type: z.enum(['ENTRADA', 'SAIDA'], { message: 'Tipo deve ser ENTRADA ou SAIDA' }),
  color: z.string().optional().default('#64748b'),
  icon: z.string().optional().default('Tag'),
});

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: req.userId },
          { userId: null },
        ],
      },
      orderBy: { name: 'asc' },
    });

    return res.json({ categories });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return res.status(500).json({ error: 'Erro ao buscar categorias.' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const data = categorySchema.parse(req.body);

    const existing = await prisma.category.findFirst({
      where: {
        userId: req.userId,
        name: { equals: data.name },
        type: data.type,
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Já existe uma categoria com este nome.' });
    }

    const category = await prisma.category.create({
      data: {
        ...data,
        userId: req.userId,
        isDefault: false,
      },
    });

    return res.status(201).json({ category, message: 'Categoria criada com sucesso!' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    return res.status(500).json({ error: 'Erro ao criar categoria.' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = categorySchema.partial().parse(req.body);

    const category = await prisma.category.findFirst({
      where: { id, userId: req.userId },
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada ou você não tem permissão para editá-la.' });
    }

    const updated = await prisma.category.update({
      where: { id },
      data,
    });

    return res.json({ category: updated, message: 'Categoria atualizada com sucesso!' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    return res.status(500).json({ error: 'Erro ao atualizar categoria.' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findFirst({
      where: { id, userId: req.userId },
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada ou é uma categoria padrão do sistema.' });
    }

    // Set categoryId to null on associated records before delete
    await prisma.transaction.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await prisma.recurringExpense.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await prisma.receivableAccount.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await prisma.category.delete({
      where: { id },
    });

    return res.json({ message: 'Categoria excluída com sucesso!' });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return res.status(500).json({ error: 'Erro ao excluir categoria.' });
  }
};
