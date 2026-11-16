import React from 'react';
import {
  BellRing,
  CalendarDays,
  ChartPie,
  CircleDollarSign,
  Tags,
  WalletCards,
} from 'lucide-react';

const features = [
  {
    icon: WalletCards,
    title: 'Painel financeiro',
    description: 'Tenha um resumo do seu cenário financeiro assim que entrar na plataforma.',
  },
  {
    icon: CircleDollarSign,
    title: 'Receitas e despesas',
    description: 'Registre movimentações e acompanhe seus lançamentos em um só lugar.',
  },
  {
    icon: CalendarDays,
    title: 'Contas e calendário',
    description: 'Visualize compromissos e datas importantes para manter sua rotina organizada.',
  },
  {
    icon: ChartPie,
    title: 'Relatórios',
    description: 'Explore relatórios para entender melhor como seu dinheiro se movimenta.',
  },
  {
    icon: Tags,
    title: 'Categorias',
    description: 'Classifique as movimentações para facilitar a consulta e o acompanhamento.',
  },
  {
    icon: BellRing,
    title: 'Alertas',
    description: 'Acompanhe notificações e informações importantes da sua gestão.',
  },
];

export const Features: React.FC = () => (
  <section id="recursos" className="bg-slate-50 py-20 sm:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700">Recursos</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Tudo o que você precisa para se organizar
        </h2>
        <p className="mt-4 leading-7 text-slate-600">
          Ferramentas essenciais para acompanhar suas finanças com mais praticidade.
        </p>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <article key={title} className="rounded-2xl border border-slate-200/80 bg-white p-6">
            <span className="inline-flex rounded-xl bg-sky-50 p-3 text-sky-700">
              <Icon size={21} />
            </span>
            <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);
