import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

const inclusions = [
  'Painel para acompanhar suas finanças',
  'Registro de receitas e despesas',
  'Categorias e relatórios',
  'Gestão de contas e compromissos',
];

export const Pricing: React.FC = () => (
  <section id="planos" className="bg-slate-50 py-20 sm:py-24">
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700">Planos</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Um espaço para organizar sua gestão financeira
        </h2>
        <p className="mt-4 leading-7 text-slate-600">
          Conheça a plataforma e veja como os recursos podem apoiar sua rotina.
        </p>
      </div>
      <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-sky-200 bg-white p-7 shadow-xl shadow-sky-900/5 sm:p-9">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-sky-700">Nemmus</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-950">Gestão em um só lugar</h3>
          </div>
          <span className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800">Financeiro</span>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Entre na plataforma para conhecer os recursos de controle e acompanhamento financeiro.
        </p>
        <ul className="mt-6 space-y-3">
          {inclusions.map(item => (
            <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
              <Check className="mt-0.5 shrink-0 text-emerald-600" size={17} />
              {item}
            </li>
          ))}
        </ul>
        <a
          href="https://wa.me/5519987019852"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 px-6 py-3.5 font-semibold text-white transition hover:bg-sky-700"
        >
          Acessar a Nemmus
          <ArrowRight size={17} />
        </a>
      </div>
    </div>
  </section>
);
