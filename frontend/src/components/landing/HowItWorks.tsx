import React from 'react';
import { ArrowRight, ChartNoAxesCombined, ClipboardList, SlidersHorizontal } from 'lucide-react';

const steps = [
  {
    icon: ClipboardList,
    number: '01',
    title: 'Registre',
    description: 'Adicione suas receitas, despesas e compromissos conforme acontecem.',
  },
  {
    icon: SlidersHorizontal,
    number: '02',
    title: 'Organize',
    description: 'Agrupe os lançamentos por categorias e acompanhe o que importa.',
  },
  {
    icon: ChartNoAxesCombined,
    number: '03',
    title: 'Acompanhe',
    description: 'Consulte seu panorama financeiro e planeje os próximos passos.',
  },
];

export const HowItWorks: React.FC = () => (
  <section id="como-funciona" className="bg-slate-950 py-20 text-white sm:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <div className="max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-300">Como funciona</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Um caminho claro para sua vida financeira
        </h2>
        <p className="mt-4 leading-7 text-slate-300">
          Comece com o essencial e construa uma rotina de acompanhamento no seu ritmo.
        </p>
      </div>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {steps.map(({ icon: Icon, number, title, description }, index) => (
          <article key={number} className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-7">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold tracking-widest text-sky-300">{number}</span>
              <Icon className="text-sky-300" size={23} />
            </div>
            <h3 className="mt-8 text-xl font-bold">{title}</h3>
            <p className="mt-3 leading-7 text-slate-300">{description}</p>
            {index < steps.length - 1 && (
              <ArrowRight className="absolute -right-6 top-1/2 hidden -translate-y-1/2 text-slate-500 md:block" size={18} />
            )}
          </article>
        ))}
      </div>
    </div>
  </section>
);
