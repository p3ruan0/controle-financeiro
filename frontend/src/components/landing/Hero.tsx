import React from 'react';
import { ArrowRight, Check, Trophy, WalletCards } from 'lucide-react';

const summary = [
  { label: 'Entradas do mês', value: 'R$ 7.620,40', color: 'text-emerald-600' },
  { label: 'Saídas do mês', value: 'R$ 3.695,70', color: 'text-rose-600' },
  { label: 'Saldo do mês', value: 'R$ 3.924,70', color: 'text-emerald-600' },
  { label: 'Total pago', value: 'R$ 3.270,40', color: 'text-slate-700' },
  { label: 'Total pendente', value: 'R$ 425,30', color: 'text-amber-600' },
  { label: 'A receber no mês', value: 'R$ 0,00', color: 'text-sky-600' },
];

const monthlyBars = [
  { income: 24, expense: 10 },
  { income: 38, expense: 22 },
  { income: 31, expense: 18 },
  { income: 49, expense: 29 },
  { income: 42, expense: 24 },
  { income: 77, expense: 38 },
];

const chartMonths = ['Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov'];

export const Hero: React.FC = () => (
  <section id="inicio" className="relative isolate overflow-hidden bg-slate-50">
    <div className="absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-sky-100 blur-3xl" />
    <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-16 lg:py-28">
      <div>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-3.5 py-2 text-xs font-semibold text-sky-800 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Mais clareza para cuidar do seu dinheiro
        </div>
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
          Suas finanças em ordem.{' '}
          <span className="text-sky-600">Suas escolhas, mais leves.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
          A Nemmus reúne receitas, despesas e planejamento em um só lugar para você enxergar o todo e decidir com confiança.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="https://wa.me/5519987019852"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:-translate-y-0.5 hover:bg-sky-700"
          >
            Organizar minhas finanças
            <ArrowRight size={18} />
          </a>
          <a
            href="#como-funciona"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Conheça a Nemmus
          </a>
        </div>
        <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
          {['Visão clara do mês', 'Organização em um só lugar'].map(label => (
            <span key={label} className="inline-flex items-center gap-2">
              <Check size={16} className="text-emerald-600" />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-2xl">
        <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-sky-200/70 via-cyan-100/40 to-indigo-100/70 blur-2xl" />
        <div className="relative rounded-2xl border border-slate-200 bg-slate-100 p-2 shadow-2xl shadow-slate-900/15 sm:rounded-3xl sm:p-3">
          <div className="grid gap-2 sm:grid-cols-[1.8fr_1fr]">
            <section className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4" aria-label="Resumo financeiro ilustrativo">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-xs font-bold text-slate-800 sm:text-sm">Resumo de Novembro</h2>
                  <p className="mt-0.5 text-[9px] text-slate-400 sm:text-[10px]">Desempenho financeiro do período</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-semibold text-slate-600 sm:text-[9px]">
                  7 pagas · 2 pendentes
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {summary.map(item => (
                  <div key={item.label} className="rounded-lg border border-slate-100 bg-slate-50 p-2 sm:p-2.5">
                    <p className="text-[8px] font-bold uppercase leading-3 text-slate-500 sm:text-[9px]">{item.label}</p>
                    <p className={`mt-1 text-[10px] font-extrabold sm:text-xs ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="flex flex-col justify-between rounded-xl bg-gradient-to-br from-slate-900 to-sky-950 p-3 text-white shadow-sm sm:rounded-2xl sm:p-4" aria-label="Análise do mês ilustrativa">
              <div>
                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide text-amber-400">
                  <Trophy size={12} />
                  Análise do mês
                </div>
                <h3 className="mt-2 text-xs font-extrabold sm:text-sm">Categoria com maior gasto</h3>
                <p className="mt-0.5 text-[9px] leading-4 text-slate-400">Onde seu dinheiro está mais concentrado</p>
                <div className="mt-3 rounded-lg border border-white/10 bg-white/10 p-2.5 sm:p-3">
                  <div className="flex items-center justify-between gap-1 text-[9px] font-bold">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" />Moradia</span>
                    <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-amber-300">55%</span>
                  </div>
                  <p className="mt-1 text-base font-black sm:text-lg">R$ 2.050,00</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
                    <div className="h-full w-[55%] rounded-full bg-amber-400" />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-1 border-t border-white/10 pt-2 text-[8px] sm:text-[9px]">
                <span className="text-slate-400">Status geral</span>
                <span className="font-bold text-emerald-400">Saúde financeira positiva</span>
              </div>
            </section>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2">
            <section className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-sm sm:rounded-2xl sm:p-3" aria-label="Gráfico ilustrativo de entradas e saídas">
              <h3 className="text-[9px] font-bold leading-3 text-slate-800 sm:text-[10px]">Entradas x Saídas</h3>
              <p className="mt-0.5 truncate text-[8px] text-slate-400">Comparativo mensal</p>
              <div className="mt-3 flex h-16 items-end justify-around border-b border-slate-100 px-1 sm:h-20">
                {monthlyBars.map((bar, index) => (
                  <div key={index} className="flex h-full items-end gap-0.5">
                    <span className="w-1.5 rounded-t-sm bg-emerald-500 sm:w-2" style={{ height: `${bar.income}%` }} />
                    <span className="w-1.5 rounded-t-sm bg-rose-500 sm:w-2" style={{ height: `${bar.expense}%` }} />
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-[7px] text-slate-400 sm:text-[8px]">
                {chartMonths.map(month => <span key={month}>{month}</span>)}
              </div>
              <div className="mt-2 flex gap-2 text-[7px] text-slate-500 sm:text-[8px]">
                <span className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-sm bg-emerald-500" />Entradas</span>
                <span className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-sm bg-rose-500" />Saídas</span>
              </div>
            </section>

            <section className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-sm sm:rounded-2xl sm:p-3" aria-label="Gráfico ilustrativo de gastos por categoria">
              <h3 className="text-[9px] font-bold leading-3 text-slate-800 sm:text-[10px]">Gastos por categoria</h3>
              <p className="mt-0.5 truncate text-[8px] text-slate-400">Distribuição das despesas</p>
              <div className="flex h-[5.25rem] items-center justify-center sm:h-24">
                <svg viewBox="0 0 100 100" className="h-16 w-16 sm:h-20 sm:w-20" role="img" aria-label="Gráfico de rosca com categorias de gastos">
                  <circle cx="50" cy="50" r="36" fill="none" stroke="#3b82f6" strokeWidth="18" strokeDasharray="124 226" transform="rotate(-90 50 50)" />
                  <circle cx="50" cy="50" r="36" fill="none" stroke="#ef4444" strokeWidth="18" strokeDasharray="55 226" strokeDashoffset="-124" transform="rotate(-90 50 50)" />
                  <circle cx="50" cy="50" r="36" fill="none" stroke="#eab308" strokeWidth="18" strokeDasharray="22 226" strokeDashoffset="-179" transform="rotate(-90 50 50)" />
                  <circle cx="50" cy="50" r="36" fill="none" stroke="#f97316" strokeWidth="18" strokeDasharray="15 226" strokeDashoffset="-201" transform="rotate(-90 50 50)" />
                  <circle cx="50" cy="50" r="36" fill="none" stroke="#ec4899" strokeWidth="18" strokeDasharray="10 226" strokeDashoffset="-216" transform="rotate(-90 50 50)" />
                </svg>
              </div>
              <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-[7px] text-slate-500 sm:text-[8px]">
                <span className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 bg-blue-500" />Moradia</span>
                <span className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 bg-rose-500" />Alimentação</span>
              </div>
            </section>

            <section className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-sm sm:rounded-2xl sm:p-3" aria-label="Gráfico ilustrativo da evolução do saldo">
              <h3 className="text-[9px] font-bold leading-3 text-slate-800 sm:text-[10px]">Evolução do saldo</h3>
              <p className="mt-0.5 truncate text-[8px] text-slate-400">Trajetória mensal</p>
              <div className="mt-2 flex h-[5.25rem] items-center sm:h-24">
                <svg viewBox="0 0 180 85" className="h-full w-full" role="img" aria-label="Gráfico de linha do saldo mensal">
                  <path d="M8 72 H174 M8 50 H174 M8 28 H174 M8 6 H174" stroke="#e2e8f0" strokeWidth="1" />
                  <path d="M8 72 L40 70 L72 70 L104 69 L136 66 L170 12 L170 72 Z" fill="#0ea5e9" fillOpacity=".12" />
                  <path d="M8 72 L40 70 L72 70 L104 69 L136 66 L170 12" fill="none" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  {[8, 40, 72, 104, 136, 170].map((x, index) => (
                    <circle key={x} cx={x} cy={[72, 70, 70, 69, 66, 12][index]} r="2.5" fill="#0284c7" />
                  ))}
                </svg>
              </div>
              <div className="mt-1 flex justify-between text-[7px] text-slate-400 sm:text-[8px]">
                {chartMonths.map(month => <span key={month}>{month}</span>)}
              </div>
            </section>
          </div>

          <p className="px-1 pt-2 text-right text-[8px] text-slate-400">Prévia ilustrativa do painel Nemmus</p>
        </div>
      </div>
    </div>
  </section>
);
