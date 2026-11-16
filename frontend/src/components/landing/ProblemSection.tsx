import React from 'react';
import { CircleHelp, EyeOff, ListTodo } from 'lucide-react';

const problems = [
  {
    icon: ListTodo,
    title: 'Contas espalhadas',
    description: 'Anotações, planilhas e aplicativos diferentes tornam difícil saber onde está cada informação.',
  },
  {
    icon: EyeOff,
    title: 'Pouca visibilidade',
    description: 'Sem uma visão do conjunto, acompanhar o mês e antecipar compromissos fica mais trabalhoso.',
  },
  {
    icon: CircleHelp,
    title: 'Decisões no escuro',
    description: 'Quando os números não estão organizados, planejar os próximos passos pode parecer complicado.',
  },
];

export const ProblemSection: React.FC = () => (
  <section className="py-20 sm:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700">Fica mais simples</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Cuidar do dinheiro não precisa ser complicado
        </h2>
        <p className="mt-4 leading-7 text-slate-600">
          A organização financeira começa quando você consegue ver o que acontece com seu dinheiro.
        </p>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {problems.map(({ icon: Icon, title, description }) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5">
            <span className="inline-flex rounded-xl bg-slate-100 p-3 text-slate-700">
              <Icon size={22} />
            </span>
            <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);
