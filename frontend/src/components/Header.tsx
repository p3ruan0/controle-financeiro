import React from 'react';
import { Menu, Bell, PlusCircle, MinusCircle, LogOut, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardAlert } from '../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenQuickModal: (type: 'ENTRADA' | 'SAIDA' | 'CONTA_PAGAR' | 'VALOR_RECEBER') => void;
  alerts: DashboardAlert[];
  onOpenAlertsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenQuickModal,
  alerts,
  onOpenAlertsModal,
}) => {
  const { user, logout } = useAuth();
  const alertCount = alerts.length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-sm">
      {/* Left side: Hamburger & Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition"
          aria-label="Abrir Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider">Gestão Financeira</p>
            {user?.role && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  user.role === 'SUPER_ADMIN'
                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                    : user.role === 'ADMIN'
                    ? 'bg-sky-100 text-sky-800 border-sky-200'
                    : user.role === 'CLIENT_ADMIN'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {user.role === 'SUPER_ADMIN'
                  ? '👑 Super Admin'
                  : user.role === 'ADMIN'
                  ? '🛡️ Admin'
                  : user.role === 'CLIENT_ADMIN'
                  ? '🏢 Cliente'
                  : '👤 Usuário'}
              </span>
            )}
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-800">
            Olá, {user?.name.split(' ')[0] || 'Usuário'}! 👋
          </h2>
        </div>

      </div>

      {/* Right side: Quick Action Buttons, Notifications, User Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Quick Action Buttons (Desktop & Tablet) */}
        <div className="hidden md:flex items-center space-x-2">
          <button
            onClick={() => onOpenQuickModal('ENTRADA')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>+ Nova Entrada</span>
          </button>

          <button
            onClick={() => onOpenQuickModal('SAIDA')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-semibold transition shadow-sm"
          >
            <MinusCircle className="w-4 h-4 text-rose-600" />
            <span>- Nova Saída</span>
          </button>

          <button
            onClick={() => onOpenQuickModal('CONTA_PAGAR')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-semibold transition shadow-sm"
          >
            <ArrowDownRight className="w-4 h-4 text-amber-600" />
            <span>+ Conta a Pagar</span>
          </button>

          <button
            onClick={() => onOpenQuickModal('VALOR_RECEBER')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 text-xs font-semibold transition shadow-sm"
          >
            <ArrowUpRight className="w-4 h-4 text-sky-600" />
            <span>+ A Receber</span>
          </button>
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenAlertsModal}
          className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          title="Notificações e Alertas"
        >
          <Bell className="w-5 h-5" />
          {alertCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        {/* User Info & Logout */}
        <div className="flex items-center pl-2 border-l border-slate-200 space-x-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
            {user?.name.charAt(0) || 'U'}
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Sair do sistema"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
