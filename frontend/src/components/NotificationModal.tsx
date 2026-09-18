import React from 'react';
import { X, AlertCircle, Clock, AlertTriangle, CheckCircle, Bell } from 'lucide-react';
import { DashboardAlert } from '../types';
import { formatCurrency } from '../utils/formatters';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: DashboardAlert[];
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose, alerts }) => {
  if (!isOpen) return null;

  const getAlertStyle = (severity: string) => {
    switch (severity) {
      case 'red':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-900',
          icon: <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
          badge: 'bg-rose-100 text-rose-700',
        };
      case 'yellow':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          icon: <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
          badge: 'bg-amber-100 text-amber-700',
        };
      case 'green':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          icon: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
          badge: 'bg-emerald-100 text-emerald-700',
        };
      default:
        return {
          bg: 'bg-sky-50 border-sky-200 text-sky-900',
          icon: <AlertCircle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />,
          badge: 'bg-sky-100 text-sky-700',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Notificações e Alertas</h3>
              <p className="text-xs text-slate-500">
                {alerts.length === 0 ? 'Nenhum alerta pendente' : `${alerts.length} alerta(s) de vencimento e recebimento`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {alerts.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Tudo em dia!</p>
              <p className="text-xs text-slate-400 mt-1">Você não possui contas vencidas nem vencendo hoje.</p>
            </div>
          ) : (
            alerts.map(alert => {
              const style = getAlertStyle(alert.severity);
              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border flex items-start space-x-3 transition hover:shadow-sm ${style.bg}`}
                >
                  {style.icon}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{alert.title}</span>
                      <span className="text-xs font-bold font-mono">{formatCurrency(alert.amount)}</span>
                    </div>
                    <p className="text-xs mt-0.5 opacity-90">{alert.description}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
