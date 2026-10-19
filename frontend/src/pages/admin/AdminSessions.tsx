import React, { useState, useEffect } from 'react';
import {
  Laptop,
  RefreshCw,
  XCircle,
  AlertOctagon,
  Shield,
  Building2,
  Clock,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';
import { UserSession } from '../../types';
import { formatDateTime, formatRelativeTime, getRoleBadge } from '../../utils/formatters';
import { useDataSync } from '../../hooks/useDataSync';

export const AdminSessions: React.FC = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ sessions: UserSession[] }>('/admin/sessions');
      setSessions(res.sessions || []);
    } catch (err) {
      console.error('Erro ao buscar sessões ativas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Reactively re-fetch sessions when sessions change
  useDataSync(['admin-sessions', 'all'], () => {
    fetchSessions();
  });

  const handleTerminateSession = async (sessionId: string, userName: string) => {
    if (!confirm(`Deseja derrubar esta sessão de ${userName}? O usuário será desconectado imediatamente desse dispositivo.`)) {
      return;
    }

    try {
      await api.delete(`/admin/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao encerrar sessão.');
    }
  };

  const handleTerminateUserSessions = async (userId: string, userName: string) => {
    if (!confirm(`Atenção: Deseja encerrar TODAS as sessões ativas de ${userName}? Ele precisará fazer login novamente em todos os navegadores e dispositivos.`)) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}/sessions`);
      setSessions(prev => prev.filter(s => s.userId !== userId));
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao derrubar sessões do usuário.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Radio className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Tempo Real
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Sessões Ativas na Plataforma</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Monitore acessos simultâneos e encerre sessões remotamente em caso de anomalia ou rescisão.
          </p>
        </div>

        <button
          onClick={fetchSessions}
          className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Atualizar Sessões</span>
        </button>
      </div>

      {/* Info Card */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <p className="text-xs font-bold text-emerald-950">
              {sessions.length} conexões ativas no momento
            </p>
            <p className="text-[11px] text-emerald-800">
              O encerramento de sessão tem efeito imediato e invalida o token JWT no próximo ciclo de requisições.
            </p>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-3">Empresa</th>
                <th className="py-3 px-3">Dispositivo / Navegador</th>
                <th className="py-3 px-3">Endereço IP</th>
                <th className="py-3 px-3">Última Atividade</th>
                <th className="py-3 px-3">Expiração</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span>Carregando sessões...</span>
                    </div>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Nenhuma sessão ativa encontrada.
                  </td>
                </tr>
              ) : (
                sessions.map(s => {
                  const roleBadge = getRoleBadge(s.user.role);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {s.user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{s.user.name}</p>
                            <p className="text-[11px] text-slate-500">{s.user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {s.user.company ? (
                          <span className="font-medium text-slate-800">{s.user.company.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Individual</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1.5">
                          <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-800">
                            {s.browser || 'Navegador'} • {s.device || 'Desktop'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        {s.ipAddress || '-'}
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-800">{formatRelativeTime(s.lastActivityAt)}</p>
                        <p className="text-[10px] text-slate-400">{formatDateTime(s.lastActivityAt)}</p>
                      </td>

                      <td className="py-3 px-3 text-slate-500">
                        {formatDateTime(s.expiresAt)}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleTerminateSession(s.id, s.user.name)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
                            title="Encerrar apenas esta sessão"
                          >
                            Derrubar
                          </button>
                          <button
                            onClick={() => handleTerminateUserSessions(s.userId, s.user.name)}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-rose-700 hover:bg-slate-100 rounded-lg transition"
                            title="Derrubar todas as sessões deste usuário"
                          >
                            Derrubar Todas
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
