import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  PieChart,
  AlertTriangle,
  Trophy,
} from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { api } from '../services/api';
import { FinancialReportData } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

export const Reports: React.FC = () => {
  const [period, setPeriod] = useState('este_mes');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [reportData, setReportData] = useState<FinancialReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ period });
      if (period === 'personalizado' && customStart && customEnd) {
        params.append('startDate', customStart);
        params.append('endDate', customEnd);
      }
      const res = await api.get<FinancialReportData>(`/reports?${params.toString()}`);
      setReportData(res);
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period]);

  const handleExport = async (format: 'excel' | 'csv' | 'pdf') => {
    try {
      setIsExporting(format);
      const params = new URLSearchParams({ period });
      if (period === 'personalizado' && customStart && customEnd) {
        params.append('startDate', customStart);
        params.append('endDate', customEnd);
      }

      const filename = `relatorio-financeiro-${period}-${Date.now()}.${format === 'excel' ? 'xlsx' : format}`;
      await api.download(`/reports/export/${format}?${params.toString()}`, filename);
    } catch (err) {
      alert(`Erro ao exportar arquivo ${format.toUpperCase()}.`);
    } finally {
      setIsExporting(null);
    }
  };

  // Chart data for spending by category
  const expenseCategoriesChart = reportData?.saidas.porCategoria && reportData.saidas.porCategoria.length > 0 ? {
    labels: reportData.saidas.porCategoria.map(c => c.name),
    datasets: [
      {
        data: reportData.saidas.porCategoria.map(c => c.amount),
        backgroundColor: reportData.saidas.porCategoria.map(c => c.color || '#ef4444'),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  } : null;

  // Chart data for income by category
  const incomeCategoriesChart = reportData?.entradas.porCategoria && reportData.entradas.porCategoria.length > 0 ? {
    labels: reportData.entradas.porCategoria.map(c => c.name),
    datasets: [
      {
        data: reportData.entradas.porCategoria.map(c => c.amount),
        backgroundColor: reportData.entradas.porCategoria.map(c => c.color || '#10b981'),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  } : null;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Relatórios Financeiros & Análise de Gastos</h1>
          <p className="text-xs text-slate-500">
            Visão aprofundada do fluxo de caixa, inteligência comparativa e exportações
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => handleExport('excel')}
            disabled={!!isExporting}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm"
            title="Exportar para planilha Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExporting === 'excel' ? 'Baixando...' : 'Excel (.xlsx)'}</span>
          </button>

          <button
            onClick={() => handleExport('csv')}
            disabled={!!isExporting}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm"
            title="Exportar em formato CSV"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting === 'csv' ? 'Baixando...' : 'CSV'}</span>
          </button>

          <button
            onClick={() => handleExport('pdf')}
            disabled={!!isExporting}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm"
            title="Exportar relatório formatado em PDF"
          >
            <FileText className="w-4 h-4" />
            <span>{isExporting === 'pdf' ? 'Baixando...' : 'PDF'}</span>
          </button>
        </div>
      </div>

      {/* Period Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
          {[
            { id: 'este_mes', label: 'Este Mês' },
            { id: 'mes_anterior', label: 'Mês Anterior' },
            { id: 'ultimos_3_meses', label: 'Últimos 3 Meses' },
            { id: 'ultimos_6_meses', label: 'Últimos 6 Meses' },
            { id: 'este_ano', label: 'Este Ano' },
            { id: 'personalizado', label: 'Personalizado' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                period === p.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period === 'personalizado' && (
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <span className="text-xs text-slate-400">até</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <button
              onClick={fetchReport}
              className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition"
            >
              Filtrar
            </button>
          </div>
        )}
      </div>

      {isLoading || !reportData ? (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-2"></div>
          <p className="text-xs text-slate-400">Calculando indicadores financeiros...</p>
        </div>
      ) : (
        <>
          {/* FLUXO DE CAIXA CARD */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">Demonstrativo de Fluxo de Caixa</h3>
                <p className="text-xs text-slate-400">
                  Período analisado: {formatDate(reportData.startDate)} até {formatDate(reportData.endDate)}
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
                Entradas - Saídas = Saldo Líquido
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
              {/* Entradas */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold uppercase">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Total de Entradas</span>
                </div>
                <p className="text-2xl font-black text-emerald-700 mt-2 font-mono">
                  {formatCurrency(reportData.fluxoDeCaixa.totalEntradas)}
                </p>
                <p className="text-[11px] text-emerald-600 mt-1">
                  Efetivamente recebidas: {formatCurrency(reportData.fluxoDeCaixa.totalEntradasRecebidas)}
                </p>
              </div>

              {/* Saídas */}
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100">
                <div className="flex items-center space-x-2 text-rose-800 text-xs font-bold uppercase">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  <span>Total de Saídas</span>
                </div>
                <p className="text-2xl font-black text-rose-700 mt-2 font-mono">
                  {formatCurrency(reportData.fluxoDeCaixa.totalSaidas)}
                </p>
                <p className="text-[11px] text-rose-600 mt-1">
                  Efetivamente pagas: {formatCurrency(reportData.fluxoDeCaixa.totalSaidasPagas)}
                </p>
              </div>

              {/* Saldo Líquido */}
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100">
                <div className="flex items-center space-x-2 text-sky-800 text-xs font-bold uppercase">
                  <Trophy className="w-4 h-4 text-sky-600" />
                  <span>Saldo Líquido do Período</span>
                </div>
                <p
                  className={`text-2xl font-black mt-2 font-mono ${
                    reportData.fluxoDeCaixa.saldo >= 0 ? 'text-sky-700' : 'text-rose-700'
                  }`}
                >
                  {formatCurrency(reportData.fluxoDeCaixa.saldo)}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {reportData.fluxoDeCaixa.saldo >= 0 ? 'Superávit no período' : 'Déficit no período'}
                </p>
              </div>
            </div>
          </div>

          {/* ANÁLISE AUTOMÁTICA DE GASTOS (SMART INSIGHTS) */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center space-x-2.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-5 h-5" />
              <span>Inteligência e Análise Automática de Gastos</span>
            </div>
            <h3 className="text-lg font-black text-white">Insights do seu Comportamento Financeiro</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Identificação de padrões, aumento/redução de gastos e alertas inteligentes
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {/* Insight Cards */}
              {reportData.analiseGastos.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-start space-x-3"
                >
                  <p className="text-xs text-slate-100 font-medium leading-relaxed">{insight}</p>
                </div>
              ))}

              {/* Comparativo Mês Anterior */}
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-300">Comparação com o Mês Anterior</span>
                <div className="mt-2">
                  <span className="text-xl font-extrabold text-white">
                    {reportData.analiseGastos.comparacaoMesAnterior.variacaoPercentual > 0 ? '+' : ''}
                    {reportData.analiseGastos.comparacaoMesAnterior.variacaoPercentual}%
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Mês anterior: {formatCurrency(reportData.analiseGastos.comparacaoMesAnterior.mesAnterior)}
                  </p>
                </div>
              </div>

              {/* Fixos vs Variáveis */}
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-300">Divisão de Custos</span>
                <div className="mt-2">
                  <p className="text-xs text-purple-300 font-bold">
                    Fixos: {formatCurrency(reportData.saidas.fixos)}
                  </p>
                  <p className="text-xs text-amber-300 font-bold mt-1">
                    Variáveis: {formatCurrency(reportData.saidas.variaveis)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* DETALHAMENTO DE CATEGORIAS (ENTRADAS E SAÍDAS) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Saídas por Categoria */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
              <h3 className="text-sm font-bold text-slate-800 mb-1">Detalhamento de Saídas por Categoria</h3>
              <p className="text-xs text-slate-400 mb-4">Onde você mais gastou neste período</p>

              <div className="h-56 flex items-center justify-center mb-4">
                {expenseCategoriesChart ? (
                  <Doughnut
                    data={expenseCategoriesChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } },
                    }}
                  />
                ) : (
                  <p className="text-xs text-slate-400">Nenhum gasto registrado</p>
                )}
              </div>

              <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-1">
                {reportData.saidas.porCategoria.map(cat => {
                  const pct = reportData.saidas.total > 0 ? Math.round((cat.amount / reportData.saidas.total) * 100) : 0;
                  return (
                    <div key={cat.name} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-semibold text-slate-700">{cat.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 font-mono">
                        <span className="text-slate-400 font-sans">{pct}%</span>
                        <span className="font-bold text-slate-900">{formatCurrency(cat.amount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Entradas por Categoria */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
              <h3 className="text-sm font-bold text-slate-800 mb-1">Origem das Entradas</h3>
              <p className="text-xs text-slate-400 mb-4">Distribuição das suas fontes de receita</p>

              <div className="h-56 flex items-center justify-center mb-4">
                {incomeCategoriesChart ? (
                  <Doughnut
                    data={incomeCategoriesChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } },
                    }}
                  />
                ) : (
                  <p className="text-xs text-slate-400">Nenhuma receita registrada</p>
                )}
              </div>

              <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-1">
                {reportData.entradas.porCategoria.map(cat => {
                  const pct = reportData.entradas.total > 0 ? Math.round((cat.amount / reportData.entradas.total) * 100) : 0;
                  return (
                    <div key={cat.name} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-semibold text-slate-700">{cat.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 font-mono">
                        <span className="text-slate-400 font-sans">{pct}%</span>
                        <span className="font-bold text-emerald-700">{formatCurrency(cat.amount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
