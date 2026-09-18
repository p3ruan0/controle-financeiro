import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Activity,
  AlertTriangle,
  UserCheck,
  UserX,
  Clock,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  Mail,
  ScrollText,
  Laptop,
} from 'lucide-react';
import { api } from '../../services/api';
import { AdminDashboardData } from '../../types';
import { formatDateTime, formatRelativeTime, getRoleBadge } from '../../utils/formatters';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.get<AdminDashboardData>('/admin/dashboard');
      setData(res);
    } catch (err) {
      console.error('Erro ao buscar dados do dashboard administrativo:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Carregando métricas do painel administrativo...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
              Master Admin
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Painel de Controle Administrativo
          </h1>
          <p className="text-sm text-slate-500">
            Gerenciamento global de clientes, acessos, auditoria e segurança da plataforma.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
          <Link
            to="/admin/usuarios"
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition shadow-sm shadow-purple-600/30"
          >
            <Users className="w-4 h-4" />
            <span>Gerenciar Usuários</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-purple-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Usuários na Plataforma
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{metrics?.users.total || 0}</span>
            <span className="text-xs text-slate-400">cadastrados</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">ATIVOS</span>
              <span className="font-bold text-emerald-600">{metrics?.users.active || 0}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">BLOQUEADOS</span>
              <span className="font-bold text-rose-600">{metrics?.users.blocked || 0}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">PENDENTES</span>
              <span className="font-bold text-amber-600">{metrics?.users.pending || 0}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Companies */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-sky-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Clientes / Empresas
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{metrics?.companies.total || 0}</span>
            <span className="text-xs text-slate-400">empresas</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">EMPRESAS ATIVAS</span>
              <span className="font-bold text-emerald-600">{metrics?.companies.active || 0}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">EMPRESAS BLOQUEADAS</span>
              <span className="font-bold text-rose-600">{metrics?.companies.blocked || 0}</span>
            </div>
            <Link
              to="/admin/clientes"
              className="text-sky-600 hover:text-sky-800 text-xs font-medium flex items-center"
            >
              Ver todas <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>

        {/* Card 3: Accesses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Logins Bem-Sucedidos
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{metrics?.accesses.today || 0}</span>
            <span className="text-xs text-slate-400">hoje</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">ÚLTIMOS 7 DIAS</span>
              <span className="font-bold text-slate-700">{metrics?.accesses.last7Days || 0} acessos</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">ÚLTIMOS 30 DIAS</span>
              <span className="font-bold text-slate-700">{metrics?.accesses.last30Days || 0} acessos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Banners Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link
          to="/admin/usuarios?lastAccess=mais30"
          className="flex items-center justify-between p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl hover:bg-amber-100/70 transition"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-900">Inativos há +30 dias</p>
              <p className="text-xs text-amber-700 font-bold">{metrics?.alerts.inactiveOver30Days || 0} usuários</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-amber-600" />
        </Link>

        <Link
          to="/admin/usuarios?lastAccess=nunca"
          className="flex items-center justify-between p-3.5 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200/70 transition"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-slate-200 text-slate-700">
              <UserX className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">Nunca acessaram</p>
              <p className="text-xs text-slate-600 font-bold">{metrics?.alerts.neverLoggedIn || 0} usuários</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-500" />
        </Link>

        <Link
          to="/admin/usuarios?status=BLOQUEADO"
          className="flex items-center justify-between p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl hover:bg-rose-100/70 transition"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-900">Usuários Bloqueados</p>
              <p className="text-xs text-rose-700 font-bold">{metrics?.alerts.blockedUsers || 0} bloqueados</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-rose-600" />
        </Link>

        <Link
          to="/admin/convites"
          className="flex items-center justify-between p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl hover:bg-purple-100/70 transition"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-purple-900">Convites Pendentes</p>
              <p className="text-xs text-purple-700 font-bold">{metrics?.alerts.pendingInvitations || 0} pendentes</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-purple-600" />
        </Link>
      </div>

      {/* Quick Navigation Cards */}
      <div className="bg-gradient-to-r from-slate-900 to-purple-950 p-5 rounded-2xl text-white shadow-lg">
        <div className="mb-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <span>🛡️ Ações Rápidas de Administração</span>
          </h2>
          <p className="text-xs text-slate-300">
            Acesse rapidamente as ferramentas de auditoria e governança da plataforma
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            to="/admin/usuarios"
            className="p-3 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition flex flex-col items-center text-center group"
          >
            <Users className="w-6 h-6 text-purple-300 mb-1.5 group-hover:scale-110 transition" />
            <span className="text-xs font-bold text-white">Usuários & Acessos</span>
            <span className="text-[10px] text-slate-400">Controle completo</span>
          </Link>

          <Link
            to="/admin/clientes"
            className="p-3 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition flex flex-col items-center text-center group"
          >
            <Building2 className="w-6 h-6 text-sky-300 mb-1.5 group-hover:scale-110 transition" />
            <span className="text-xs font-bold text-white">Clientes / Empresas</span>
            <span className="text-[10px] text-slate-400">Empresas e CNPJs</span>
          </Link>

          <Link
            to="/admin/logs"
            className="p-3 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition flex flex-col items-center text-center group"
          >
            <ScrollText className="w-6 h-6 text-amber-300 mb-1.5 group-hover:scale-110 transition" />
            <span className="text-xs font-bold text-white">Logs de Auditoria</span>
            <span className="text-[10px] text-slate-400">Histórico de ações</span>
          </Link>

          <Link
            to="/admin/sessoes"
            className="p-3 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition flex flex-col items-center text-center group"
          >
            <Laptop className="w-6 h-6 text-emerald-300 mb-1.5 group-hover:scale-110 transition" />
            <span className="text-xs font-bold text-white">Sessões Ativas</span>
            <span className="text-[10px] text-slate-400">Derrubar acessos</span>
          </Link>

          <Link
            to="/admin/convites"
            className="p-3 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition flex flex-col items-center text-center group col-span-2 sm:col-span-1"
          >
            <Mail className="w-6 h-6 text-rose-300 mb-1.5 group-hover:scale-110 transition" />
            <span className="text-xs font-bold text-white">Convites Enviados</span>
            <span className="text-[10px] text-slate-400">Links de cadastro</span>
          </Link>
        </div>
      </div>

      {/* Two Column Layout: Recent Logins & Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Logins */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Últimos Acessos / Logins</span>
              </h2>
              <p className="text-xs text-slate-500">Tentativas de acesso mais recentes à plataforma</p>
            </div>
            <Link
              to="/admin/sessoes"
              className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center"
            >
              Sessões <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Usuário</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2">Dispositivo / IP</th>
                  <th className="py-2.5 px-3 rounded-r-lg text-right">Data/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recentLogins && data.recentLogins.length > 0 ? (
                  data.recentLogins.map(login => (
                    <tr key={login.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-slate-900">{login.user?.name || login.email}</p>
                        <p className="text-[11px] text-slate-400">{login.email}</p>
                      </td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            login.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : login.status === 'BLOCKED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {login.status === 'SUCCESS'
                            ? 'Sucesso'
                            : login.status === 'BLOCKED'
                            ? 'Bloqueado'
                            : 'Falha'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-600">
                        <p className="font-medium text-slate-700">{login.browser || 'Navegador'} • {login.device || 'Desktop'}</p>
                        <p className="text-[10px] text-slate-400">{login.ipAddress || '-'}</p>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500 whitespace-nowrap">
                        {formatDateTime(login.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-slate-400">
                      Nenhum histórico de login registrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ScrollText className="w-4 h-4 text-purple-600" />
                <span>Logs de Auditoria Recentes</span>
              </h2>
              <p className="text-xs text-slate-500">Histórico de ações administrativas realizadas</p>
            </div>
            <Link
              to="/admin/logs"
              className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center"
            >
              Ver todos <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Ação</th>
                  <th className="py-2.5 px-2">Responsável</th>
                  <th className="py-2.5 px-2">Descrição</th>
                  <th className="py-2.5 px-3 rounded-r-lg text-right">Data/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recentAuditLogs && data.recentAuditLogs.length > 0 ? (
                  data.recentAuditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <p className="font-semibold text-slate-800">{log.adminUser?.name || 'Sistema'}</p>
                        <p className="text-[10px] text-slate-400">{log.adminUser?.email || '-'}</p>
                      </td>
                      <td className="py-2.5 px-2 max-w-[220px] truncate text-slate-600" title={log.description}>
                        {log.description}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500 whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-slate-400">
                      Nenhum registro de auditoria encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
