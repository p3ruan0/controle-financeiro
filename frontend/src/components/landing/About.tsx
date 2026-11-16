import React from 'react';
import { HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';

const values = [
  { icon: Sparkles, title: 'Simplicidade', text: 'Uma experiência pensada para deixar a organização mais leve.' },
  { icon: ShieldCheck, title: 'Visão integrada', text: 'Informações financeiras reunidas para facilitar seu acompanhamento.' },
  { icon: HeartHandshake, title: 'Feita para apoiar', text: 'Uma ferramenta para ajudar você a tomar decisões com mais clareza.' },
];

export const About: React.FC = () => (
  <section id="sobre" className="py-20 sm:py-24">
    <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-700 to-indigo-900 p-8 text-white sm:p-10">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full border-[28px] border-white/10" />
        <p className="relative text-sm font-bold uppercase tracking-[0.18em] text-sky-200">Sobre a Nemmus</p>
        <h2 className="relative mt-5 text-3xl font-bold leading-tight sm:text-4xl">
          Mais confiança para escolher seus próximos passos.
        </h2>
        <p className="relative mt-5 leading-7 text-sky-50/90">
          Acreditamos que entender suas finanças é o primeiro passo para fazer planos com mais segurança. A Nemmus ajuda a transformar informações dispersas em uma visão mais organizada do seu dia a dia.
        </p>
      </div>
      <div className="space-y-7">
        {values.map(({ icon: Icon, title, text }) => (
          <article key={title} className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <Icon size={22} />
            </span>
            <div>
              <h3 className="font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);
