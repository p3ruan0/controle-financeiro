import React, { useEffect, useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  PlusCircle,
  MinusCircle,
  ArrowDownRight,
  ArrowUpRight,
  Trophy,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { DashboardData } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useDashboardData } from '../hooks/useDashboardData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardProps {
  onOpenQuickModal: (type: 'ENTRADA' | 'SAIDA' | 'CONTA_PAGAR' | 'VALOR_RECEBER') => void;
  refreshTrigger?: number;
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const Dashboard: React.FC<DashboardProps> = ({ onOpenQuickModal }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const currentMonth = selectedDate.getMonth() + 1;
  const currentYear = selectedDate.getFullYear();

  const { data, isLoading } = useDashboardData(currentMonth, currentYear);

  const handlePrevMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  // --- CHART CONFIGURATIONS ---
  // 1. Entradas x Saídas por mês
  const monthlyHistoryData = useMemo(() => {
    if (!data?.monthlyHistory) return null;
    return {
      labels: data.monthlyHistory.map(h => h.label),
      datasets: [
        {
          label: 'Entradas (R$)',
          data: data.monthlyHistory.map(h => h.entradas),
          backgroundColor: 'rgba(16, 185, 129, 0.85)',
          borderRadius: 6,
        },
        {
          label: 'Saídas (R$)',
          data: data.monthlyHistory.map(h => h.saidas),
          backgroundColor: 'rgba(239, 68, 68, 0.85)',
          borderRadius: 6,
        },
      ],
    };
  }, [data]);

  // 2. Gastos por Categoria
  const categoryChartData = useMemo(() => {
    if (!data?.gastosPorCategoria || data.gastosPorCategoria.length === 0) return null;
    return {
      labels: data.gastosPorCategoria.map(c => c.name),
      datasets: [
        {
          data: data.gastosPorCategoria.map(c => c.amount),
          backgroundColor: data.gastosPorCategoria.map(c => c.color || '#38bdf8'),
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    };
  }, [data]);

  // 3. Evolução do Saldo
  const balanceEvolutionData = useMemo(() => {
    if (!data?.monthlyHistory) return null;
    return {
      labels: data.monthlyHistory.map(h => h.label),
      datasets: [
        {
          label: 'Saldo Mensal (R$)',
          data: data.monthlyHistory.map(h => h.saldo),
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.1)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#0284c7',
          pointRadius: 4,
        },
      ],
    };
  }, [data]);

  // 4. Gastos Fixos x Gastos Variáveis
  const fixedVsVariableData = useMemo(() => {
    if (!data?.gastosFixosVsVariaveis) return null;
    const { fixos, variaveis } = data.gastosFixosVsVariaveis;
    if (fixos === 0 && variaveis === 0) return null;
    return {
      labels: ['Gastos Fixos', 'Gastos Variáveis'],
      datasets: [
        {
          data: [fixos, variaveis],
          backgroundColor: ['#8b5cf6', '#f59e0b'],
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    };
  }, [data]);

  // 5. Valores Pagos x Pendentes
  const paidVsPendingData = useMemo(() => {
    if (!data?.valoresPagosVsPendentes) return null;
    const { pagos, pendentes } = data.valoresPagosVsPendentes;
    if (pagos === 0 && pendentes === 0) return null;
    return {
      labels: ['Contas Pagas', 'Contas Pendentes'],
      datasets: [
        {
          label: 'Total (R$)',
          data: [pagos, pendentes],
          backgroundColor: ['#10b981', '#f97316'],
          borderRadius: 6,
        },
      ],
    };
  }, [data]);

  // 6. Valores a Receber por Status
  const receivablesChartData = useMemo(() => {
    if (!data?.receivablesDistribution) return null;
    const { aReceber, recebido, atrasado } = data.receivablesDistribution;
    if (aReceber === 0 && recebido === 0 && atrasado === 0) return null;
    return {
      labels: ['A Receber', 'Recebido', 'Atrasado'],
      datasets: [
        {
          data: [aReceber, recebido, atrasado],
          backgroundColor: ['#0284c7', '#10b981', '#ef4444'],
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    };
  }, [data]);

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  const { cards, resumoMes, indicadores, topCategory } = data || {
    cards: {
      saldoAtual: 0,
      saldoPrevisto: 0,
      totalEntradasGeral: 0,
      totalSaidasGeral: 0,
      totalEntradasRecebidas: 0,
      totalDespesasPagas: 0,
      totalValoresAReceber: 0,
      totalContasVencidas: 0,
      totalContasPendentes: 0,
    },
    resumoMes: {
      mes: currentMonth,
      ano: currentYear,
      entradas: 0,
      saidas: 0,
      saldo: 0,
      contasPagas: 0,
      contasPendentes: 0,
      aReceber: 0,
    },
    indicadores: {
      contasPagas: 0,
      contasPendentes: 0,
      contasVencidas: 0,
      valoresAReceber: 0,
      totalAReceberGeral: 0,
      totalAtrasadoReceber: 0,
      totalRecebidoContas: 0,
    },
    topCategory: null,
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Month Selector Bar & Quick Actions for Mobile */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Month Navigator */}
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-slate-800 text-sm sm:text-base min-w-[140px] text-center">
              {monthNames[currentMonth - 1]} de {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Próximo Mês"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleCurrentMonth}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            Mês Atual
          </button>
        </div>

        {/* Quick Actions Buttons (Visible on all devices, especially useful on mobile) */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onOpenQuickModal('ENTRADA')}
            className="flex items-center justify-center space-x-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Nova Entrada</span>
          </button>

          <button
            onClick={() => onOpenQuickModal('SAIDA')}
            className="flex items-center justify-center space-x-1 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
          >
            <MinusCircle className="w-4 h-4" />
            <span>- Nova Saída</span>
          </button>

          <button
            onClick={() => onOpenQuickModal('CONTA_PAGAR')}
            className="flex items-center justify-center space-x-1 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>+ Conta a Pagar</span>
          </button>

          <button
            onClick={() => onOpenQuickModal('VALOR_RECEBER')}
            className="flex items-center justify-center space-x-1 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-sm"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+ A Receber</span>
          </button>
        </div>
      </div>

      {/* QUICK STATUS NOTIFICATIONS BANNER */}
      {(indicadores.totalAReceberGeral > 0 || indicadores.totalAtrasadoReceber > 0 || cards.totalContasVencidas > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {indicadores.totalAReceberGeral > 0 && (
            <div className="p-3.5 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold text-sm">
                  💰
                </div>
                <div>
                  <p className="text-xs font-bold text-sky-950">Você tem valores para receber</p>
                  <p className="text-xs font-semibold text-sky-700">{formatCurrency(indicadores.totalAReceberGeral)}</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                {indicadores.valoresAReceber} pendente(s)
              </span>
            </div>
          )}

          {indicadores.totalAtrasadoReceber > 0 && (
            <div className="p-3.5 bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                  ⚠️
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-950">Recebimentos Atrasados</p>
                  <p className="text-xs font-semibold text-rose-700">{formatCurrency(indicadores.totalAtrasadoReceber)} em atraso</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                Atrasado
              </span>
            </div>
          )}

          {cards.totalContasVencidas > 0 && (
            <div className="p-3.5 bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm">
                  🔴
                </div>
                <div>
                  <p className="text-xs font-bold text-rose-950">Atenção: Contas Vencidas</p>
                  <p className="text-xs font-semibold text-rose-700">{formatCurrency(cards.totalContasVencidas)}</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {indicadores.contasVencidas} conta(s)
              </span>
            </div>
          )}
        </div>
      )}

      {/* 1. PRINCIPAIS CARDS FINANCEIROS (8 CARDS OBRIGATÓRIOS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Saldo Atual */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">💰 Saldo Atual</span>
            <div className={`p-2 rounded-xl ${cards.saldoAtual >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-black ${cards.saldoAtual >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(cards.saldoAtual)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Entradas recebidas - Despesas pagas</p>
          </div>
        </div>

        {/* 2. Saldo Previsto */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">💵 Saldo Previsto</span>
            <div className={`p-2 rounded-xl ${cards.saldoPrevisto >= 0 ? 'bg-sky-50 text-sky-600' : 'bg-rose-50 text-rose-600'}`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-black ${cards.saldoPrevisto >= 0 ? 'text-sky-600' : 'text-rose-600'}`}>
              {formatCurrency(cards.saldoPrevisto)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Saldo atual + a receber - a pagar</p>
          </div>
        </div>

        {/* 3. Total de Entradas */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">📈 Total de Entradas</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-800">
              {formatCurrency(cards.totalEntradasGeral)}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              🟢 {formatCurrency(cards.totalEntradasRecebidas)} recebidos
            </p>
          </div>
        </div>

        {/* 4. Total de Saídas */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">📉 Total de Saídas</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-800">
              {formatCurrency(cards.totalSaidasGeral)}
            </h3>
            <p className="text-[11px] text-rose-600 font-semibold mt-1">
              {formatCurrency(cards.totalDespesasPagas)} efetivamente pagas
            </p>
          </div>
        </div>

        {/* 5. Valores Recebidos */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">🟢 Valores Recebidos</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-700">
              {formatCurrency(cards.totalEntradasRecebidas)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Entradas em caixa</p>
          </div>
        </div>

        {/* 6. Valores a Receber */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">🟠 Valores a Receber</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-sky-700">
              {formatCurrency(cards.totalValoresAReceber)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">{indicadores.valoresAReceber} valores aguardando</p>
          </div>
        </div>

        {/* 7. Contas Vencidas */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">🔴 Contas Vencidas</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-rose-600">
              {formatCurrency(cards.totalContasVencidas)}
            </h3>
            <p className="text-[11px] text-rose-600 font-semibold mt-1">{indicadores.contasVencidas} conta(s) em atraso</p>
          </div>
        </div>

        {/* 8. Contas Pendentes */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">🟡 Contas Pendentes</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-700">
              {formatCurrency(cards.totalContasPendentes)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">{indicadores.contasPendentes} despesa(s) a vencer</p>
          </div>
        </div>
      </div>

      {/* 2. RESUMO DO MÊS & DESTAQUE DE MAIOR GASTO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Resumo do Mês */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Resumo de {monthNames[currentMonth - 1]} de {currentYear}
              </h3>
              <p className="text-xs text-slate-400">Desempenho financeiro do período selecionado</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              {indicadores.contasPagas} contas pagas • {indicadores.contasPendentes} pendentes
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Entradas do Mês</span>
              <p className="text-lg font-black text-emerald-600 mt-1">{formatCurrency(resumoMes.entradas)}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Saídas do Mês</span>
              <p className="text-lg font-black text-rose-600 mt-1">{formatCurrency(resumoMes.saidas)}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Saldo do Mês</span>
              <p className={`text-lg font-black mt-1 ${resumoMes.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(resumoMes.saldo)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Pago</span>
              <p className="text-lg font-black text-slate-700 mt-1">{formatCurrency(resumoMes.contasPagas)}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Pendente</span>
              <p className="text-lg font-black text-amber-600 mt-1">{formatCurrency(resumoMes.contasPendentes)}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase">A Receber no Mês</span>
              <p className="text-lg font-black text-sky-600 mt-1">{formatCurrency(resumoMes.aReceber)}</p>
            </div>
          </div>
        </div>

        {/* Destaque Inteligente: Categoria em que mais gastei */}
        <div className="bg-gradient-to-br from-slate-900 to-sky-950 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl"></div>

          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Trophy className="w-4 h-4" />
              <span>Análise do Mês</span>
            </div>
            <h4 className="text-base font-extrabold text-white">Categoria com Maior Gasto</h4>
            <p className="text-xs text-slate-400 mt-0.5">Onde seu dinheiro está mais concentrado neste mês</p>

            {topCategory ? (
              <div className="mt-5 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: topCategory.color }}></span>
                    {topCategory.name}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300">
                    {topCategory.percentage}% do total
                  </span>
                </div>
                <p className="text-2xl font-black text-white">{formatCurrency(topCategory.amount)}</p>
                <div className="w-full bg-white/20 rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${topCategory.percentage}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-6 py-6 text-center text-slate-400 text-xs">
                Nenhum gasto registrado para este mês até o momento.
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>Status Geral:</span>
            <span className={cards.saldoAtual >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {cards.saldoAtual >= 0 ? 'Saúde Financeira Positiva' : 'Atenção ao Saldo Negativo'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. OS 6 GRÁFICOS SOLICITADOS NO PROMPT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Gráfico 1: Entradas x Saídas por mês */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-800">1. Entradas x Saídas por Mês</h4>
            <p className="text-[11px] text-slate-400">Comparativo histórico dos últimos 6 meses</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            {monthlyHistoryData ? (
              <Bar
                data={monthlyHistoryData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } },
                }}
              />
            ) : (
              <p className="text-xs text-slate-400">Sem dados históricos</p>
            )}
          </div>
        </div>

        {/* Gráfico 2: Gastos por Categoria */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-800">2. Gastos por Categoria</h4>
            <p className="text-[11px] text-slate-400">Distribuição percentual das despesas</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            {categoryChartData ? (
              <Doughnut
                data={categoryChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
                }}
              />
            ) : (
              <p className="text-xs text-slate-400">Nenhum gasto neste mês</p>
            )}
          </div>
        </div>

        {/* Gráfico 3: Evolução do Saldo */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-800">3. Evolução do Saldo</h4>
            <p className="text-[11px] text-slate-400">Trajetória do saldo líquido mensal</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            {balanceEvolutionData ? (
              <Line
                data={balanceEvolutionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                }}
              />
            ) : (
              <p className="text-xs text-slate-400">Sem dados de evolução</p>
            )}
          </div>
        </div>

        {/* Gráfico 4: Gastos Fixos x Gastos Variáveis */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-800">4. Gastos Fixos x Variáveis</h4>
            <p className="text-[11px] text-slate-400">Comprometimento de renda fixa vs pontual</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            {fixedVsVariableData ? (
              <Doughnut
                data={fixedVsVariableData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } },
                }}
              />
            ) : (
              <p className="text-xs text-slate-400">Sem despesas registradas</p>
            )}
          </div>
        </div>

        {/* Gráfico 5: Valores Pagos x Pendentes */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-800">5. Valores Pagos x Pendentes</h4>
            <p className="text-[11px] text-slate-400">Despesas liquidadas vs a pagar no mês</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            {paidVsPendingData ? (
              <Bar
                data={paidVsPendingData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                }}
              />
            ) : (
              <p className="text-xs text-slate-400">Sem lançamentos no período</p>
            )}
          </div>
        </div>

        {/* Gráfico 6: Valores a Receber */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-800">6. Valores a Receber</h4>
            <p className="text-[11px] text-slate-400">A receber vs Recebidos vs Atrasados</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            {receivablesChartData ? (
              <Doughnut
                data={receivablesChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } },
                }}
              />
            ) : (
              <p className="text-xs text-slate-400">Nenhum valor a receber cadastrado</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
