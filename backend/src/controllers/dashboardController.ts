import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const getDashboardData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const now = new Date();

    // Support month/year query or default to current month/year
    const queryMonth = req.query.month ? parseInt(req.query.month as string) - 1 : now.getMonth();
    const queryYear = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();

    const startOfMonth = new Date(queryYear, queryMonth, 1, 0, 0, 0);
    const endOfMonth = new Date(queryYear, queryMonth + 1, 0, 23, 59, 59);

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59);

    // 1. Fetch all transactions for overall balance calculation
    const allTransactions = await prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
    });

    // 2. Fetch all receivables
    const allReceivables = await prisma.receivableAccount.findMany({
      where: { userId },
      include: { category: true },
    });

    // Classify and calculate dynamic statuses
    const processedTransactions = allTransactions.map(t => {
      let status = t.status;
      if (t.status === 'PENDENTE' && t.dueDate) {
        const d = new Date(t.dueDate);
        d.setHours(0, 0, 0, 0);
        if (d < todayStart) {
          status = t.type === 'SAIDA' ? 'VENCIDO' : 'ATRASADO';
        }
      }
      return { ...t, status };
    });

    const processedReceivables = allReceivables.map(r => {
      let status = r.status;
      if (r.status === 'A_RECEBER' && r.expectedDate) {
        const d = new Date(r.expectedDate);
        d.setHours(0, 0, 0, 0);
        if (d < todayStart) {
          status = 'ATRASADO';
        }
      }
      return { ...r, status };
    });

    // --- OVERALL METRICS ---
    // Saldo atual = Entradas recebidas - Despesas pagas
    const totalEntradasRecebidas = processedTransactions
      .filter(t => t.type === 'ENTRADA' && t.status === 'RECEBIDO')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDespesasPagas = processedTransactions
      .filter(t => t.type === 'SAIDA' && t.status === 'PAGO')
      .reduce((sum, t) => sum + t.amount, 0);

    const saldoAtual = totalEntradasRecebidas - totalDespesasPagas;

    // Total de entradas (todas cadastradas)
    const totalEntradasGeral = processedTransactions
      .filter(t => t.type === 'ENTRADA' && t.status !== 'CANCELADO')
      .reduce((sum, t) => sum + t.amount, 0);

    // Total de saídas (todas cadastradas)
    const totalSaidasGeral = processedTransactions
      .filter(t => t.type === 'SAIDA' && t.status !== 'CANCELADO')
      .reduce((sum, t) => sum + t.amount, 0);

    // Contas a pagar pendentes e vencidas
    const totalContasPendentes = processedTransactions
      .filter(t => t.type === 'SAIDA' && t.status === 'PENDENTE')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalContasVencidas = processedTransactions
      .filter(t => t.type === 'SAIDA' && t.status === 'VENCIDO')
      .reduce((sum, t) => sum + t.amount, 0);

    // Valores a receber (Contas a receber pendentes + entradas pendentes)
    const totalReceivablesPending = processedReceivables
      .filter(r => r.status === 'A_RECEBER' || r.status === 'ATRASADO')
      .reduce((sum, r) => sum + r.amount, 0);

    const totalEntradasPendentes = processedTransactions
      .filter(t => t.type === 'ENTRADA' && (t.status === 'PENDENTE' || t.status === 'ATRASADO'))
      .reduce((sum, t) => sum + t.amount, 0);

    const totalValoresAReceber = totalReceivablesPending + totalEntradasPendentes;

    // Saldo Previsto = Saldo Atual + Valores a Receber - Contas Pendentes/Vencidas
    const saldoPrevisto = saldoAtual + totalValoresAReceber - (totalContasPendentes + totalContasVencidas);

    // --- MONTHLY METRICS (For query month) ---
    const monthTransactions = processedTransactions.filter(t => {
      const d = new Date(t.date);
      return d >= startOfMonth && d <= endOfMonth && t.status !== 'CANCELADO';
    });

    const monthEntradas = monthTransactions
      .filter(t => t.type === 'ENTRADA')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthSaidas = monthTransactions
      .filter(t => t.type === 'SAIDA')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthSaldo = monthEntradas - monthSaidas;

    const monthContasPagas = monthTransactions
      .filter(t => t.type === 'SAIDA' && t.status === 'PAGO')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthContasPendentes = monthTransactions
      .filter(t => t.type === 'SAIDA' && (t.status === 'PENDENTE' || t.status === 'VENCIDO'))
      .reduce((sum, t) => sum + t.amount, 0);

    const monthAReceber = monthTransactions
      .filter(t => t.type === 'ENTRADA' && (t.status === 'PENDENTE' || t.status === 'ATRASADO'))
      .reduce((sum, t) => sum + t.amount, 0);

    // Counts for dashboard badges
    const countPagas = processedTransactions.filter(t => t.type === 'SAIDA' && t.status === 'PAGO').length;
    const countPendentes = processedTransactions.filter(t => t.type === 'SAIDA' && t.status === 'PENDENTE').length;
    const countVencidas = processedTransactions.filter(t => t.type === 'SAIDA' && t.status === 'VENCIDO').length;
    const countAReceber = processedReceivables.filter(r => r.status === 'A_RECEBER' || r.status === 'ATRASADO').length;

    // Receivables summary
    const totalRecebidoContas = processedReceivables
      .filter(r => r.status === 'RECEBIDO')
      .reduce((sum, r) => sum + r.amount, 0);

    const totalAtrasadoReceivables = processedReceivables
      .filter(r => r.status === 'ATRASADO')
      .reduce((sum, r) => sum + r.amount, 0);

    // --- INSIGHT: CATEGORIA EM QUE MAIS GASTEI ESTE MÊS ---
    const categorySpending: { [key: string]: { name: string; amount: number; color: string } } = {};
    let totalExpenseInMonth = 0;

    monthTransactions
      .filter(t => t.type === 'SAIDA')
      .forEach(t => {
        totalExpenseInMonth += t.amount;
        const catName = t.category?.name || 'Sem Categoria';
        const catColor = t.category?.color || '#94a3b8';
        if (!categorySpending[catName]) {
          categorySpending[catName] = { name: catName, amount: 0, color: catColor };
        }
        categorySpending[catName].amount += t.amount;
      });

    const categoryList = Object.values(categorySpending).sort((a, b) => b.amount - a.amount);
    const topCategory = categoryList.length > 0 ? {
      name: categoryList[0].name,
      amount: categoryList[0].amount,
      percentage: totalExpenseInMonth > 0 ? Math.round((categoryList[0].amount / totalExpenseInMonth) * 100) : 0,
      color: categoryList[0].color,
    } : null;

    // Fixed vs Variable in current month
    const fixedExpensesTotal = monthTransactions
      .filter(t => t.type === 'SAIDA' && t.isFixed)
      .reduce((sum, t) => sum + t.amount, 0);

    const variableExpensesTotal = monthTransactions
      .filter(t => t.type === 'SAIDA' && !t.isFixed)
      .reduce((sum, t) => sum + t.amount, 0);

    // --- CHARTS DATA ---
    // 1. Entradas x Saídas últimos 6 meses
    const monthlyHistory = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(queryYear, queryMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthStart = new Date(y, m, 1, 0, 0, 0);
      const monthEnd = new Date(y, m + 1, 0, 23, 59, 59);

      const monthLabel = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
      const formattedLabel = `${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}/${y.toString().slice(2)}`;

      const mTrans = processedTransactions.filter(t => {
        const td = new Date(t.date);
        return td >= monthStart && td <= monthEnd && t.status !== 'CANCELADO';
      });

      const entradas = mTrans.filter(t => t.type === 'ENTRADA').reduce((sum, t) => sum + t.amount, 0);
      const saidas = mTrans.filter(t => t.type === 'SAIDA').reduce((sum, t) => sum + t.amount, 0);

      monthlyHistory.push({
        label: formattedLabel,
        entradas,
        saidas,
        saldo: entradas - saidas,
      });
    }

    // --- ALERTS / NOTIFICATIONS ---
    const alerts: Array<{
      id: string;
      type: 'vencida' | 'vencendo_hoje' | 'vencendo_amanha' | 'receber_hoje' | 'receber_atrasado';
      title: string;
      description: string;
      amount: number;
      date: string;
      severity: 'red' | 'yellow' | 'blue' | 'green';
    }> = [];

    // Overdue expenses
    processedTransactions
      .filter(t => t.type === 'SAIDA' && t.status === 'VENCIDO')
      .forEach(t => {
        alerts.push({
          id: `trans-overdue-${t.id}`,
          type: 'vencida',
          title: 'Conta Vencida',
          description: `${t.description} venceu em ${new Date(t.dueDate || t.date).toLocaleDateString('pt-BR')}`,
          amount: t.amount,
          date: (t.dueDate || t.date).toISOString(),
          severity: 'red',
        });
      });

    // Due today / tomorrow
    processedTransactions
      .filter(t => t.type === 'SAIDA' && t.status === 'PENDENTE' && t.dueDate)
      .forEach(t => {
        const d = new Date(t.dueDate!);
        if (d >= todayStart && d <= todayEnd) {
          alerts.push({
            id: `trans-today-${t.id}`,
            type: 'vencendo_hoje',
            title: 'Conta Vencendo Hoje',
            description: `${t.description} vence hoje`,
            amount: t.amount,
            date: t.dueDate!.toISOString(),
            severity: 'yellow',
          });
        } else if (d > todayEnd && d <= tomorrowEnd) {
          alerts.push({
            id: `trans-tomorrow-${t.id}`,
            type: 'vencendo_amanha',
            title: 'Conta Vencendo Amanhã',
            description: `${t.description} vence amanhã`,
            amount: t.amount,
            date: t.dueDate!.toISOString(),
            severity: 'blue',
          });
        }
      });

    // Receivables alerts
    processedReceivables
      .filter(r => r.status === 'ATRASADO')
      .forEach(r => {
        alerts.push({
          id: `rec-overdue-${r.id}`,
          type: 'receber_atrasado',
          title: 'Recebimento Atrasado',
          description: `${r.debtorName} (${r.description}) previsto para ${new Date(r.expectedDate).toLocaleDateString('pt-BR')}`,
          amount: r.amount,
          date: r.expectedDate.toISOString(),
          severity: 'red',
        });
      });

    processedReceivables
      .filter(r => r.status === 'A_RECEBER')
      .forEach(r => {
        const d = new Date(r.expectedDate);
        if (d >= todayStart && d <= todayEnd) {
          alerts.push({
            id: `rec-today-${r.id}`,
            type: 'receber_hoje',
            title: 'Recebimento Previsto para Hoje',
            description: `${r.debtorName} (${r.description})`,
            amount: r.amount,
            date: r.expectedDate.toISOString(),
            severity: 'green',
          });
        }
      });

    return res.json({
      cards: {
        saldoAtual,
        saldoPrevisto,
        totalEntradasGeral,
        totalSaidasGeral,
        totalEntradasRecebidas,
        totalDespesasPagas,
        totalValoresAReceber,
        totalContasVencidas,
        totalContasPendentes,
      },
      resumoMes: {
        mes: queryMonth + 1,
        ano: queryYear,
        entradas: monthEntradas,
        saidas: monthSaidas,
        saldo: monthSaldo,
        contasPagas: monthContasPagas,
        contasPendentes: monthContasPendentes,
        aReceber: monthAReceber,
      },
      indicadores: {
        contasPagas: countPagas,
        contasPendentes: countPendentes,
        contasVencidas: countVencidas,
        valoresAReceber: countAReceber,
        totalAReceberGeral: totalReceivablesPending,
        totalAtrasadoReceber: totalAtrasadoReceivables,
        totalRecebidoContas,
      },
      topCategory,
      gastosPorCategoria: categoryList,
      gastosFixosVsVariaveis: {
        fixos: fixedExpensesTotal,
        variaveis: variableExpensesTotal,
      },
      valoresPagosVsPendentes: {
        pagos: monthContasPagas,
        pendentes: monthContasPendentes,
      },
      receivablesDistribution: {
        aReceber: totalReceivablesPending - totalAtrasadoReceivables,
        recebido: totalRecebidoContas,
        atrasado: totalAtrasadoReceivables,
      },
      monthlyHistory,
      alerts,
    });
  } catch (error) {
    console.error('Erro no dashboard:', error);
    return res.status(500).json({ error: 'Erro ao carregar dados do dashboard.' });
  }
};
