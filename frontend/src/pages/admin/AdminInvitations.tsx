import React, { useState, useEffect } from 'react';
import {
  Mail,
  RefreshCw,
  Copy,
  Check,
  XCircle,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle,
  Send,
} from 'lucide-react';
import { api } from '../../services/api';
import { InvitationItem } from '../../types';
import { formatDateTime, formatRelativeTime, getRoleBadge } from '../../utils/formatters';

export const AdminInvitations: React.FC = () => {
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ invitations: InvitationItem[] }>('/admin/invitations');
      setInvitations(res.invitations || []);
    } catch (err) {
      console.error('Erro ao buscar convites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleCopyLink = (invitation: InvitationItem) => {
    const inviteUrl = `${window.location.origin}/convite/${invitation.token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(invitation.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResend = async (id: string, email: string) => {
    try {
      await api.post(`/admin/invitations/${id}/resend`, {});
      alert(`Novo convite gerado e renovado para ${email}!`);
      fetchInvitations();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao renovar convite.');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Deseja realmente cancelar este convite? O link deixará de funcionar imediatamente.')) {
      return;
    }

    try {
      await api.delete(`/admin/invitations/${id}`);
      fetchInvitations();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao cancelar convite.');
    }
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    if (status === 'ACEITO') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Aceito
        </span>
      );
    }
    if (status === 'CANCELADO') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 line-through">
          Cancelado
        </span>
      );
    }
    if (isExpired || status === 'EXPIRADO') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          Expirado
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        Pendente
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <Mail className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              Onboarding
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Convites de Acesso</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Acompanhe tokens gerados, links compartilhados, aceites e status de ativação de contas.
          </p>
        </div>

        <button
          onClick={fetchInvitations}
          className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Atualizar Convites</span>
        </button>
      </div>

      {/* Invitations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Destinatário</th>
                <th className="py-3 px-3">Empresa</th>
                <th className="py-3 px-3">Perfil</th>
                <th className="py-3 px-3">Link de Ativação</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Expira em</th>
                <th className="py-3 px-3">Criado por</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                      <span>Carregando convites...</span>
                    </div>
                  </td>
                </tr>
              ) : invitations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Nenhum convite gerado na plataforma ainda.
                  </td>
                </tr>
              ) : (
                invitations.map(inv => {
                  const roleBadge = getRoleBadge(inv.role);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{inv.name}</p>
                        <p className="text-[11px] text-slate-500">{inv.email}</p>
                      </td>

                      <td className="py-3 px-3">
                        {inv.company ? (
                          <span className="font-medium text-slate-800">{inv.company.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Individual</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge.bg}`}
                        >
                          {roleBadge.label}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleCopyLink(inv)}
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 transition"
                        >
                          {copiedId === inv.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Link Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar Link</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-3">{getStatusBadge(inv.status, inv.expiresAt)}</td>

                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {formatDateTime(inv.expiresAt)}
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-medium text-slate-800">{inv.createdBy?.name || 'Admin'}</p>
                        <p className="text-[10px] text-slate-400">{formatDateTime(inv.createdAt)}</p>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {inv.status === 'PENDENTE' && (
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleResend(inv.id, inv.email)}
                              className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
                              title="Renovar token e estender prazo"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCancel(inv.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Cancelar convite"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
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
