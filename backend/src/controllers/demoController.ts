import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const loadDemoData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Get categories for user
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
      },
    });

    const getCatId = (name: string, type: string) => {
      const found = categories.find(c => c.name.toLowerCase().includes(name.toLowerCase()) && c.type === type);
      return found ? found.id : null;
    };

    // Clean previous transactions, fixed, receivables for user to avoid duplicating demo
    await prisma.transaction.deleteMany({ where: { userId } });
    await prisma.recurringExpense.deleteMany({ where: { userId } });
    await prisma.receivableAccount.deleteMany({ where: { userId } });

    // 1. Create Recurring Expenses (Gastos Fixos)
    const fixedAluguel = await prisma.recurringExpense.create({
      data: {
        userId,
        name: 'Aluguel do Imóvel',
        amount: 1600.00,
        dueDay: 5,
        paymentMethod: 'TRANSFERENCIA',
        recurrence: 'MENSAL',
        isActive: true,
        autoGenerate: true,
        categoryId: getCatId('Moradia', 'SAIDA'),
        notes: 'Aluguel apartamento',
      },
    });

    const fixedCondominio = await prisma.recurringExpense.create({
      data: {
        userId,
        name: 'Condomínio',
        amount: 450.00,
        dueDay: 10,
        paymentMethod: 'BOLETO',
        recurrence: 'MENSAL',
        isActive: true,
        autoGenerate: true,
        categoryId: getCatId('Moradia', 'SAIDA'),
      },
    });

    const fixedInternet = await prisma.recurringExpense.create({
      data: {
        userId,
        name: 'Internet Fibra 600MB',
        amount: 119.90,
        dueDay: 10,
        paymentMethod: 'BOLETO',
        recurrence: 'MENSAL',
        isActive: true,
        autoGenerate: true,
        categoryId: getCatId('Contas', 'SAIDA'),
      },
    });

    const fixedEnergia = await prisma.recurringExpense.create({
      data: {
        userId,
        name: 'Energia Elétrica',
        amount: 185.50,
        dueDay: 18,
        paymentMethod: 'PIX',
        recurrence: 'MENSAL',
        isActive: true,
        autoGenerate: true,
        categoryId: getCatId('Contas', 'SAIDA'),
      },
    });

    const fixedAcademia = await prisma.recurringExpense.create({
      data: {
        userId,
        name: 'Academia SmartFit',
        amount: 119.90,
        dueDay: 20,
        paymentMethod: 'CARTAO_CREDITO',
        recurrence: 'MENSAL',
        isActive: true,
        autoGenerate: true,
        categoryId: getCatId('Saúde', 'SAIDA'),
      },
    });

    const fixedStreaming = await prisma.recurringExpense.create({
      data: {
        userId,
        name: 'Assinaturas Streaming',
        amount: 69.90,
        dueDay: 25,
        paymentMethod: 'CARTAO_CREDITO',
        recurrence: 'MENSAL',
        isActive: true,
        autoGenerate: true,
        categoryId: getCatId('Assinaturas', 'SAIDA'),
      },
    });

    // 2. Create Transactions for Current Month
    // Incomes
    await prisma.transaction.create({
      data: {
        userId,
        type: 'ENTRADA',
        description: 'Salário Mensal',
        amount: 5500.00,
        date: new Date(year, month, 5, 10, 0, 0),
        paymentDate: new Date(year, month, 5, 10, 0, 0),
        status: 'RECEBIDO',
        paymentMethod: 'TRANSFERENCIA',
        categoryId: getCatId('Salário', 'ENTRADA'),
        notes: 'Depósito em conta corrente',
      },
    });

    await prisma.transaction.create({
      data: {
        userId,
        type: 'ENTRADA',
        description: 'Freelance Design de Interface',
        amount: 1800.00,
        date: new Date(year, month, 8, 14, 30, 0),
        paymentDate: new Date(year, month, 8, 14, 30, 0),
        status: 'RECEBIDO',
        paymentMethod: 'PIX',
        categoryId: getCatId('Freelance', 'ENTRADA'),
      },
    });

    await prisma.transaction.create({
      data: {
        userId,
        type: 'ENTRADA',
        description: 'Dividendos de Investimentos',
        amount: 320.40,
        date: new Date(year, month, 10, 9, 0, 0),
        paymentDate: new Date(year, month, 10, 9, 0, 0),
        status: 'RECEBIDO',
        paymentMethod: 'TRANSFERENCIA',
        categoryId: getCatId('Investimentos', 'ENTRADA'),
      },
    });

    // Expenses: Fixed
    await prisma.transaction.create({
      data: {
        userId,
        type: 'SAIDA',
        description: 'Aluguel do Imóvel',
        amount: 1600.00,
        date: new Date(year, month, 5, 11, 0, 0),
        dueDate: new Date(year, month, 5, 11, 0, 0),
        paymentDate: new Date(year, month, 5, 11, 0, 0),
        status: 'PAGO',
        paymentMethod: 'TRANSFERENCIA',
        isFixed: true,
        recurringExpenseId: fixedAluguel.id,
        categoryId: getCatId('Moradia', 'SAIDA'),
      },
    });

    await prisma.transaction.create({
      data: {
        userId,
        type: 'SAIDA',
        description: 'Condomínio',
        amount: 450.00,
        date: new Date(year, month, 10, 10, 0, 0),
        dueDate: new Date(year, month, 10, 10, 0, 0),
        paymentDate: new Date(year, month, 10, 10, 0, 0),
        status: 'PAGO',
        paymentMethod: 'BOLETO',
        isFixed: true,
        recurringExpenseId: fixedCondominio.id,
        categoryId: getCatId('Moradia', 'SAIDA'),
      },
    });

    // Internet: Due yesterday/past -> Vencido or Pendente
    await prisma.transaction.create({
      data: {
        userId,
        type: 'SAIDA',
        description: 'Internet Fibra 600MB',
        amount: 119.90,
        date: new Date(year, month, 9, 10, 0, 0),
        dueDate: new Date(year, month, 9, 10, 0, 0),
        status: 'VENCIDO',
        paymentMethod: 'BOLETO',
        isFixed: true,
        recurringExpenseId: fixedInternet.id,
        categoryId: getCatId('Contas', 'SAIDA'),
        notes: 'Boleto pendente de pagamento',
      },
    });

    // Energia: Pendente
    await prisma.transaction.create({
      data: {
        userId,
        type: 'SAIDA',
        description: 'Energia Elétrica',
        amount: 185.50,
        date: new Date(year, month, 18, 10, 0, 0),
        dueDate: new Date(year, month, 18, 10, 0, 0),
        status: 'PENDENTE',
        paymentMethod: 'PIX',
        isFixed: true,
        recurringExpenseId: fixedEnergia.id,
        categoryId: getCatId('Contas', 'SAIDA'),
      },
    });

    // Academia: Pendente
    await prisma.transaction.create({
      data: {
        userId,
        type: 'SAIDA',
        description: 'Academia SmartFit',
        amount: 119.90,
        date: new Date(year, month, 20, 10, 0, 0),
        dueDate: new Date(year, month, 20, 10, 0, 0),
        status: 'PENDENTE',
        paymentMethod: 'CARTAO_CREDITO',
        isFixed: true,
        recurringExpenseId: fixedAcademia.id,
        categoryId: getCatId('Saúde', 'SAIDA'),
      },
    });

    // Variable expenses (Gastos Variáveis)
    await prisma.transaction.create({
      data: {
        userId,
        type: 'SAIDA',
        description: 'Compras Supermercado Pão de Açúcar',
        amount: 485.60,
        date: new Date(year, month, 4, 18, 20, 0),
        paymentDate: new Date(year, month, 4, 18, 20, 0),
        status: 'PAGO',
        paymentMethod: 'CARTAO_CREDITO',
        isFixed: false,
        categoryId: getCatId('Alimentação', 'SAIDA'),
        notes: 'Compras do mês',
      },
    });

    await prisma.transaction.create({
      data: {
        userId,
        type: 'SAIDA',
        description: 'Feira Livre e Hortifruti',
        amount: 142.30,
        date: new Date(year, month, 7, 10, 15, 0),
        paymentDate: new Date(year, month, 7, 10, 15, 0),
        status: 'PAGO',
        paymentMethod: 'PIX',
        isFixed: false,
        categoryId: getCatId('Alimentação', 'SAIDA'),
      },
    });

    await prisma.transaction.create({
      data: {
        userId,
        type: 'SAIDA',
        description: 'Restaurante Jantar em Família',
        amount: 220.00,
        date: new Date(year, month, 8, 21, 0, 0),
        paymentDate: new Date(year, month, 8, 21, 0, 0),
        status: 'PAGO',
        paymentMethod: 'CARTAO_DEBITO',
        isFixed: false,
        categoryId: getCatId('Alimentação', 'SAIDA'),
      },
    });

    await prisma.transaction.create({
      data: {
        userId,
        type: 'SAIDA',
        description: 'Abastecimento Carro Gasolina',
        amount: 260.00,
        date: new Date(year, month, 6, 16, 40, 0),
        paymentDate: new Date(year, month, 6, 16, 40, 0),
        status: 'PAGO',
        paymentMethod: 'CARTAO_CREDITO',
        isFixed: false,
        categoryId: getCatId('Transporte', 'SAIDA'),
      },
    });

    await prisma.transaction.create({
      data: {
        userId,
        type: 'SAIDA',
        description: 'Farmácia Medicamentos e Vitaminas',
        amount: 112.50,
        date: new Date(year, month, 9, 12, 0, 0),
        paymentDate: new Date(year, month, 9, 12, 0, 0),
        status: 'PAGO',
        paymentMethod: 'PIX',
        isFixed: false,
        categoryId: getCatId('Saúde', 'SAIDA'),
      },
    });

    // 3. Receivables (Contas a Receber)
    await prisma.receivableAccount.create({
      data: {
        userId,
        debtorName: 'João Silva',
        description: 'Empréstimo Pessoal',
        amount: 500.00,
        expectedDate: new Date(year, month, 8, 12, 0, 0),
        status: 'ATRASADO',
        notes: 'João combinou de pagar via PIX até o dia 8',
        categoryId: getCatId('Outros', 'ENTRADA'),
      },
    });

    await prisma.receivableAccount.create({
      data: {
        userId,
        debtorName: 'Tech Solutions Consultoria',
        description: 'Manutenção de Servidores e Suporte',
        amount: 1350.00,
        expectedDate: new Date(year, month, 22, 12, 0, 0),
        status: 'A_RECEBER',
        notes: 'Faturamento mensal contrato PJ',
        categoryId: getCatId('Freelance', 'ENTRADA'),
      },
    });

    return res.json({
      message: 'Dados de demonstração carregados com sucesso no seu painel!',
    });
  } catch (error) {
    console.error('Erro ao carregar dados de demo:', error);
    return res.status(500).json({ error: 'Erro ao carregar dados de demonstração.' });
  }
};

export const clearUserData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    await prisma.transaction.deleteMany({ where: { userId } });
    await prisma.recurringExpense.deleteMany({ where: { userId } });
    await prisma.receivableAccount.deleteMany({ where: { userId } });

    return res.json({ message: 'Todos os seus lançamentos e contas foram limpos com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao limpar dados.' });
  }
};
