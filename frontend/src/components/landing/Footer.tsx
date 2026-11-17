import React from 'react';
import { WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';

const footerLinks = [
  { label: 'Recursos', href: '#recursos' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Sobre', href: '#sobre' },
  { label: 'Planos', href: '#planos' },
];

export const Footer: React.FC = () => (
  <footer className="border-t border-slate-200 bg-white">
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-9 sm:px-8 md:flex-row md:items-center md:justify-between">
      <div>
        <a href="#inicio" className="inline-flex items-center gap-2" aria-label="Nemmus, voltar ao início">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white">
            <WalletCards size={19} />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">nemmus</span>
        </a>
      </div>
      <nav className="flex flex-wrap gap-x-6 gap-y-3" aria-label="Links do rodapé">
        {footerLinks.map(link => (
          <a key={link.href} href={link.href} className="text-sm text-slate-600 transition hover:text-sky-700">
            {link.label}
          </a>
        ))}
        <Link to="/login" className="text-sm font-semibold text-slate-700 transition hover:text-sky-700">
          Entrar
        </Link>
      </nav>
      <p className="text-xs text-slate-400">© {new Date().getFullYear()} Nemmus</p>
    </div>
  </footer>
);
