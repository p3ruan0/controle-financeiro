import React from 'react';
import { ArrowUpRight, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';

const navigation = [
  { label: 'Recursos', href: '#recursos' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Sobre', href: '#sobre' },
  { label: 'Planos', href: '#planos' },
];

export const Header: React.FC = () => (
  <header className="relative z-10 border-b border-slate-100 bg-white/90 backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
      <a href="#inicio" className="flex items-center gap-2.5" aria-label="Nemmus, início">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white">
          <WalletCards size={22} />
        </span>
        <span className="text-xl font-extrabold tracking-tight text-slate-900">nemmus</span>
      </a>

      <nav className="hidden items-center gap-8 md:flex" aria-label="Navegação principal">
        {navigation.map(item => (
          <a
            key={item.href}
            href={item.href}
            className="text-sm font-medium text-slate-600 transition hover:text-sky-700"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <Link
          to="/login"
          className="hidden px-3 py-2 text-sm font-semibold text-slate-700 transition hover:text-sky-700 sm:inline-flex"
        >
          Entrar
        </Link>
        <a
          href="https://wa.me/5519987019852"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 sm:px-5"
        >
          Começar agora
          <ArrowUpRight size={16} />
        </a>
      </div>
    </div>
  </header>
);
