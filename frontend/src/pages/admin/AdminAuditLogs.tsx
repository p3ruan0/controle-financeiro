import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  RefreshCw,
  Shield,
  Clock,
  User,
  Building2,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../../services/api';
import { AuditLogItem } from '../../types';
import { formatDateTime } from '../../utils/formatters';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (actionFilter !== 'all') params.append('action', actionFilter);
      params.append('limit', '100');

      const res = await api.get<{ logs: AuditLogItem[] }>(`/admin/audit-logs?${params.toString()}`);
      setLogs(res.logs || []);
    } catch (err) {
      console.error('Erro ao buscar logs de auditoria:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionColor = (action: string) => {
    if (action.includes('EXCLUIU') || action.includes('BLOQUEOU') || action.includes('CANCELOU')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (action.includes('CRIOU') || action.includes('DESBLOQUEOU') || action.includes('REATIVOU')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (action.includes('REDEFINIU') || action.includes('SESSAO')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-sky-100 text-sky-800 border-sky-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <ScrollText className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Segurança & Rastreabilidade
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Logs de Auditoria</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Registro cronológico imutável de todas as ações administrativas realizadas na plataforma.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Atualizar Logs</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por descrição, responsável, usuário afetado ou empresa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Todas as Ações</option>
            <option value="CRIOU_USUARIO">Criou Usuário</option>
            <option value="EDITOU_USUARIO">Editou Usuário</option>
            <option value="BLOQUEOU_USUARIO">Bloqueou Usuário</option>
            <option value="DESBLOQUEOU_USUARIO">Desbloqueou Usuário</option>
            <option value="EXCLUIU_USUARIO">Excluiu Usuário</option>
            <option value="REDEFINIU_SENHA">Redefiniu Senha</option>
            <option value="CRIOU_CLIENTE">Cadastrou Empresa</option>
            <option value="EDITOU_CLIENTE">Editou Empresa</option>
            <option value="BLOQUEOU_CLIENTE">Bloqueou Empresa</option>
            <option value="REATIVOU_CLIENTE">Reativou Empresa</option>
            <option value="ENCERROU_SESSAO">Encerrou Sessão</option>
            <option value="REENVIOU_CONVITE">Reenviou Convite</option>
            <option value="CANCELOU_CONVITE">Cancelou Convite</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-3">Ação</th>
                <th className="py-3 px-3">Administrador</th>
                <th className="py-3 px-3">Descrição Detalhada</th>
                <th className="py-3 px-3">Alvo / Empresa</th>
                <th className="py-3 px-3">IP Origem</th>
                <th className="py-3 px-3 text-right">Metadados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                      <span>Carregando trilhas de auditoria...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Nenhum registro de auditoria encontrado para este filtro.
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                          {formatDateTime(log.createdAt)}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${getActionColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          {log.adminUser ? (
                            <div>
                              <p className="font-bold text-slate-800">{log.adminUser.name}</p>
                              <p className="text-[10px] text-slate-400">{log.adminUser.email}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Sistema Automático</span>
                          )}
                        </td>

                        <td className="py-3 px-3 max-w-sm text-slate-700 font-medium">{log.description}</td>

                        <td className="py-3 px-3">
                          {log.targetUser ? (
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-700">{log.targetUser.name}</span>
                            </div>
                          ) : log.company ? (
                            <div className="flex items-center space-x-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-700">{log.company.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{log.ipAddress || '-'}</td>

                        <td className="py-3 px-3 text-right">
                          {log.metadata ? (
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition inline-flex items-center"
                              title="Ver dados brutos / metadados"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Metadata row */}
                      {isExpanded && log.metadata && (
                        <tr className="bg-slate-50/90">
                          <td colSpan={7} className="px-6 py-3 border-t border-b border-slate-200">
                            <div className="text-[11px] font-mono bg-slate-900 text-emerald-400 p-3 rounded-xl overflow-x-auto">
                              <p className="text-slate-400 mb-1 text-[10px] uppercase font-bold">
                                // Metadados estruturados (JSON)
                              </p>
                              <pre>{JSON.stringify(JSON.parse(log.metadata), null, 2)}</pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
