import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  Repeat,
  PieChart,
  Calendar,
  FileBarChart,
  Tags,
  Settings,
  X,
  Wallet,
  ShieldCheck,
  Users,
  Building2,
  ScrollText,
  Laptop,
  Mail,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Lançamentos', href: '/lancamentos', icon: ArrowLeftRight },
    { name: 'Contas a Pagar', href: '/contas-a-pagar', icon: TrendingDown },
    { name: 'Contas a Receber', href: '/contas-a-receber', icon: TrendingUp },
    { name: 'Gastos Fixos', href: '/gastos-fixos', icon: Repeat },
    { name: 'Gastos Variáveis', href: '/gastos-variaveis', icon: PieChart },
    { name: 'Calendário', href: '/calendario', icon: Calendar },
    { name: 'Relatórios', href: '/relatorios', icon: FileBarChart },
    { name: 'Categorias', href: '/categorias', icon: Tags },
    { name: 'Configurações', href: '/configuracoes', icon: Settings },
  ];

  const adminNavigation = [
    { name: 'Painel Master', href: '/admin', icon: ShieldCheck },
    { name: 'Usuários e Acessos', href: '/admin/usuarios', icon: Users },
    { name: 'Clientes / Empresas', href: '/admin/clientes', icon: Building2 },
    { name: 'Logs de Auditoria', href: '/admin/logs', icon: ScrollText },
    { name: 'Sessões Ativas', href: '/admin/sessoes', icon: Laptop },
    { name: 'Convites de Acesso', href: '/admin/convites', icon: Mail },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-slate-800 shadow-xl`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center shadow-md shadow-sky-500/20">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                Fluxo<span className="text-sky-400">Caixa</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Controle Financeiro</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu Principal
          </div>
          {navigation.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          {/* Seção Administrativa (Exclusivo Admins / Master) */}
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-1">
              <div className="px-3 pb-2 text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center justify-between">
                <span>Administração</span>
                <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-semibold border border-purple-500/30">
                  MASTER
                </span>
              </div>
              {adminNavigation.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => onClose()}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3.5 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 font-semibold'
                          : 'text-purple-200/80 hover:text-white hover:bg-purple-950/40'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0 text-purple-400" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>


        {/* Footer Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Versão 1.0</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Online
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
