import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CTA: React.FC = () => (
  <section className="px-5 py-16 sm:px-8 sm:py-20">
    <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-sky-700 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-200">Seu próximo passo</p>
      <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
        Comece a olhar para suas finanças com mais clareza
      </h2>
      <p className="mx-auto mt-4 max-w-2xl leading-7 text-sky-100">
        Acesse a Nemmus e tenha suas informações financeiras reunidas em um só lugar.
      </p>
      <Link
        to="/login"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-sky-800 transition hover:bg-sky-50"
      >
        Entrar na plataforma
        <ArrowRight size={18} />
      </Link>
    </div>
  </section>
);
