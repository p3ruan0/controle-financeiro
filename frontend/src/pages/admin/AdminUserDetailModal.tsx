import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Clock,
  Laptop,
  AlertTriangle,
  Lock,
  KeyRound,
  CheckCircle2,
  Trash2,
  Building2,
  Calendar,
  Activity,
  UserCheck,
  UserX,
  History,
} from 'lucide-react';
import { api } from '../../services/api';
import { User, UserSession, LoginHistoryItem, AuditLogItem } from '../../types';
import { formatDateTime, formatRelativeTime, getRoleBadge, getUserStatusBadge } from '../../utils/formatters';

interface AdminUserDetailModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated?: () => void;
}

export const AdminUserDetailModal: React.FC<AdminUserDetailModalProps> = ({
  userId,
  isOpen,
  onClose,
  onUserUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loginHistories, setLoginHistories] = useState<LoginHistoryItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'sessions' | 'history' | 'audit'>('info');

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [tempPasswordModal, setTempPasswordModal] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchDetails();
    } else {
      setUser(null);
      setSessions([]);
      setLoginHistories([]);
      setAuditLogs([]);
      setActiveTab('info');
    }
  }, [isOpen, userId]);

  const fetchDetails = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await api.get<{
        user: User;
        sessions: UserSession[];
        loginHistories: LoginHistoryItem[];
        auditLogs: AuditLogItem[];
      }>(`/admin/users/${userId}`);
      setUser(res.user);
      setSessions(res.sessions || []);
      setLoginHistories(res.loginHistories || []);
      setAuditLogs(res.auditLogs || []);
    } catch (err) {
      console.error('Erro ao buscar detalhes do usuário:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;
    if (!confirm(`Deseja gerar uma nova senha temporária para ${user.name}? Todas as sessões serão encerradas.`)) return;

    setActionLoading(true);
    try {
      const res = await api.post<{ temporaryPassword: string; message: string }>(
        `/admin/users/${user.id}/reset-password`,
        {}
      );
      setTempPasswordModal(res.temporaryPassword);
      fetchDetails();
      if (onUserUpdated) onUserUpdated();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao redefinir senha.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/users/${user.id}/block`, { reason: blockReason });
      setShowBlockModal(false);
      setBlockReason('');
      fetchDetails();
      if (onUserUpdated) onUserUpdated();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao bloquear usuário.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!user) return;
    if (!confirm(`Deseja desbloquear o acesso de ${user.name}?`)) return;

    setActionLoading(true);
    try {
      await api.patch(`/admin/users/${user.id}/unblock`, {});
      fetchDetails();
      if (onUserUpdated) onUserUpdated();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao desbloquear usuário.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await api.delete(`/admin/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao encerrar sessão.');
    }
  };

  const handleTerminateAllSessions = async () => {
    if (!user) return;
    if (!confirm(`Deseja encerrar todas as sessões ativas de ${user.name}?`)) return;

    try {
      await api.delete(`/admin/users/${user.id}/sessions`);
      setSessions([]);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao encerrar sessões.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              {user?.name.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{user?.name || 'Carregando...'}</h2>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'info'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Visão Geral & Segurança
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'sessions'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Sessões Ativas</span>
            {sessions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                {sessions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'history'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Histórico de Logins ({loginHistories.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'audit'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Trilhas de Auditoria ({auditLogs.length})
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500">Buscando dados do usuário...</p>
            </div>
          ) : !user ? (
            <div className="text-center py-12 text-slate-400 text-sm">Usuário não encontrado.</div>
          ) : (
            <>
              {/* TAB 1: INFO & SECURITY */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  {/* Status & Alerts */}
                  {user.status === 'BLOQUEADO' && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-3 text-xs">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Acesso do usuário BLOQUEADO</p>
                        <p className="mt-0.5">Motivo: {user.blockedReason || 'Não informado'}</p>
                        <p className="text-[11px] text-rose-600 mt-1">
                          Bloqueado em: {formatDateTime(user.blockedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Main Grid Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card: Perfil e Vínculo */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>Perfil & Organização</span>
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center py-1 border-b border-slate-200">
                          <span className="text-slate-500">Perfil de Acesso:</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              getRoleBadge(user.role).bg
                            }`}
                          >
                            {getRoleBadge(user.role).emoji} {getRoleBadge(user.role).label}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-200">
                          <span className="text-slate-500">Status da Conta:</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              getUserStatusBadge(user.status).bg
                            }`}
                          >
                            {getUserStatusBadge(user.status).label}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-200">
                          <span className="text-slate-500">Empresa / Cliente:</span>
                          <span className="font-bold text-slate-800">
                            {user.company?.name || 'Sem empresa vinculada'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-500">Data de Cadastro:</span>
                          <span className="font-medium text-slate-700">{formatDateTime(user.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card: Métricas de Acesso */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-slate-400" />
                        <span>Estatísticas de Acesso</span>
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center py-1 border-b border-slate-200">
                          <span className="text-slate-500">Último Acesso:</span>
                          <span className="font-bold text-slate-800">
                            {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Nunca acessou'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-200">
                          <span className="text-slate-500">Primeiro Acesso:</span>
                          <span className="font-medium text-slate-700">
                            {user.firstLoginAt ? formatDateTime(user.firstLoginAt) : 'Ainda não acessou'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-200">
                          <span className="text-slate-500">Total de Logins:</span>
                          <span className="font-bold text-purple-700">{user.loginCount || 0} vezes</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-500">Último IP & Navegador:</span>
                          <span className="font-medium text-slate-700">
                            {user.lastLoginBrowser || 'Navegador'} ({user.lastLoginIp || '-'})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Card */}
                  <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200/70 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-purple-700" />
                      <span>Segurança & Integridade</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                        <span className="text-slate-400 block text-[10px]">ÚLTIMA TROCA DE SENHA</span>
                        <span className="font-bold text-slate-800">
                          {user.lastPasswordChangeAt ? formatDateTime(user.lastPasswordChangeAt) : 'Não registrada'}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                        <span className="text-slate-400 block text-[10px]">FALHAS CONSECUTIVAS</span>
                        <span
                          className={`font-bold ${
                            (user.failedLoginAttempts || 0) > 3 ? 'text-rose-600' : 'text-slate-800'
                          }`}
                        >
                          {user.failedLoginAttempts || 0} tentativas
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                        <span className="text-slate-400 block text-[10px]">SESSÕES ATIVAS AGORA</span>
                        <span className="font-bold text-emerald-600">{sessions.length} ativas</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ACTIVE SESSIONS */}
              {activeTab === 'sessions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Sessões Remotas Ativas</h3>
                      <p className="text-xs text-slate-500">
                        Dispositivos e conexões ativas atualmente para este usuário.
                      </p>
                    </div>
                    {sessions.length > 0 && (
                      <button
                        onClick={handleTerminateAllSessions}
                        className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 text-xs font-semibold transition"
                      >
                        Derrubar Todas as Sessões
                      </button>
                    )}
                  </div>

                  {sessions.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs">
                      Nenhuma sessão ativa no momento para este usuário.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sessions.map(s => (
                        <div
                          key={s.id}
                          className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                              <Laptop className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">
                                {s.browser || 'Navegador'} • {s.device || 'Desktop'}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                IP: {s.ipAddress || '-'} • Atividade: {formatRelativeTime(s.lastActivityAt)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleTerminateSession(s.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
                          >
                            Encerrar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: LOGIN HISTORY */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Histórico de Logins</h3>
                    <p className="text-xs text-slate-500">Registro de todas as tentativas recentes de autenticação</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="py-2.5 px-3 rounded-l-lg">Status</th>
                          <th className="py-2.5 px-2">Dispositivo / Navegador</th>
                          <th className="py-2.5 px-2">IP</th>
                          <th className="py-2.5 px-2">Motivo</th>
                          <th className="py-2.5 px-3 rounded-r-lg text-right">Data/Hora</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loginHistories.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-6 text-slate-400">
                              Nenhum histórico de login registrado.
                            </td>
                          </tr>
                        ) : (
                          loginHistories.map(lh => (
                            <tr key={lh.id} className="hover:bg-slate-50/60 transition">
                              <td className="py-2.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    lh.status === 'SUCCESS'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : lh.status === 'BLOCKED'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {lh.status === 'SUCCESS'
                                    ? 'Sucesso'
                                    : lh.status === 'BLOCKED'
                                    ? 'Bloqueado'
                                    : 'Falha'}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-slate-700">
                                {lh.browser || 'Navegador'} • {lh.device || 'Desktop'}
                              </td>
                              <td className="py-2.5 px-2 text-slate-500">{lh.ipAddress || '-'}</td>
                              <td className="py-2.5 px-2 text-slate-400">{lh.failureReason || '-'}</td>
                              <td className="py-2.5 px-3 text-right text-slate-600 whitespace-nowrap">
                                {formatDateTime(lh.createdAt)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIT TRAIL */}
              {activeTab === 'audit' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Trilha de Auditoria</h3>
                    <p className="text-xs text-slate-500">Histórico de ações que afetaram este usuário</p>
                  </div>

                  <div className="space-y-2">
                    {auditLogs.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        Nenhum evento de auditoria encontrado para este usuário.
                      </div>
                    ) : (
                      auditLogs.map(log => (
                        <div
                          key={log.id}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-start justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-white text-slate-800 border border-slate-200">
                                {log.action}
                              </span>
                              <span className="text-slate-400">• Por {log.adminUser?.name || 'Sistema'}</span>
                            </div>
                            <p className="text-slate-700 font-medium">{log.description}</p>
                          </div>
                          <span className="text-slate-400 text-[11px] whitespace-nowrap ml-4">
                            {formatDateTime(log.createdAt)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetPassword}
              disabled={actionLoading || !user}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              <KeyRound className="w-3.5 h-3.5 text-purple-600" />
              <span>Gerar Nova Senha</span>
            </button>

            {user?.status === 'BLOQUEADO' ? (
              <button
                onClick={handleUnblockUser}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Desbloquear Usuário</span>
              </button>
            ) : (
              <button
                onClick={() => setShowBlockModal(true)}
                disabled={actionLoading || !user}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Bloquear Acesso</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Modal: Redefinição de Senha Exibição */}
      {tempPasswordModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Nova Senha Temporária</h3>
            <p className="text-xs text-slate-500">
              Copie a senha abaixo e forneça ao usuário. Ela será exigida no próximo login.
            </p>
            <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-300 font-mono text-base font-bold text-slate-900 select-all">
              {tempPasswordModal}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(tempPasswordModal);
                alert('Senha copiada para a área de transferência!');
                setTempPasswordModal(null);
              }}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition shadow-sm shadow-purple-600/25"
            >
              Copiar Senha e Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Bloqueio com Motivo */}
      {showBlockModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Confirmar Bloqueio de Usuário</h3>
            </div>
            <p className="text-xs text-slate-600">
              Ao bloquear este usuário, todas as suas sessões ativas serão canceladas imediatamente e ele não conseguirá mais entrar na plataforma.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Motivo do Bloqueio
              </label>
              <textarea
                value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
                placeholder="Ex: Suspeita de fraude, término de contrato, solicitação do cliente..."
                rows={3}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleBlockUser}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-sm"
              >
                Bloquear Usuário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
