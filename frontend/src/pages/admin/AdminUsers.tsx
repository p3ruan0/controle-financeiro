import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  RefreshCw,
  Building2,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../../services/api';
import { User, Company, UserRole, UserStatus } from '../../types';
import { formatDateTime, formatRelativeTime, getRoleBadge, getUserStatusBadge } from '../../utils/formatters';
import { AdminUserDetailModal } from './AdminUserDetailModal';
import { useAuth } from '../../contexts/AuthContext';
import { useDataSync } from '../../hooks/useDataSync';

export const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || 'all');
  const [companyFilter, setCompanyFilter] = useState(searchParams.get('companyId') || 'all');
  const [lastAccessFilter, setLastAccessFilter] = useState(searchParams.get('lastAccess') || 'all');

  // Modals
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER' as UserRole,
    companyId: '',
    sendInvitation: true,
  });
  const [createdInviteResult, setCreatedInviteResult] = useState<{
    link?: string;
    tempPassword?: string;
    userEmail: string;
  } | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'USER' as UserRole,
    companyId: '',
    status: 'ATIVO' as UserStatus,
  });

  const [copiedLink, setCopiedLink] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (companyFilter !== 'all') params.append('companyId', companyFilter);
      if (lastAccessFilter !== 'all') params.append('lastAccess', lastAccessFilter);

      const [usersRes, companiesRes] = await Promise.all([
        api.get<{ users: User[] }>(`/admin/users?${params.toString()}`),
        api.get<{ companies: Company[] }>('/admin/companies'),
      ]);

      setUsers(usersRes.users || []);
      setCompanies(companiesRes.companies || []);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter, roleFilter, companyFilter, lastAccessFilter]);

  // Reactively re-fetch users when admin user or company data mutates
  useDataSync(['admin-users', 'admin-companies', 'all'], () => {
    fetchUsers();
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload: any = {
        name: createForm.name,
        email: createForm.email,
        role: createForm.role,
        companyId: createForm.companyId || null,
        sendInvitation: createForm.sendInvitation,
      };

      if (!createForm.sendInvitation && createForm.password) {
        payload.password = createForm.password;
      }

      const res = await api.post<{
        user: User;
        temporaryPassword?: string;
        invitationToken?: string;
      }>('/admin/users', payload);

      if (res.invitationToken) {
        const inviteUrl = `${window.location.origin}/convite/${res.invitationToken}`;
        setCreatedInviteResult({
          link: inviteUrl,
          userEmail: res.user.email,
        });
      } else if (res.temporaryPassword) {
        setCreatedInviteResult({
          tempPassword: res.temporaryPassword,
          userEmail: res.user.email,
        });
      } else {
        setIsCreateModalOpen(false);
      }

      fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao criar usuário.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId || '',
      status: user.status,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/users/${editingUser.id}`, {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        companyId: editForm.companyId || null,
        status: editForm.status,
      });

      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao atualizar dados do usuário.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Tem certeza que deseja remover o usuário ${user.name} da plataforma? (Seus lançamentos históricos permanecerão seguros para auditoria)`)) {
      return;
    }

    try {
      await api.delete(`/admin/users/${user.id}`);
      fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao excluir usuário.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
              <Users className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
              Gestão de Acessos
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Usuários e Permissões</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Visualize quem possui acesso, acompanhe último login, bloqueie contas e crie novos acessos.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchUsers}
            className="p-2.5 text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-sm"
            title="Atualizar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCreateForm({
                name: '',
                email: '',
                password: '',
                role: 'USER',
                companyId: '',
                sendInvitation: true,
              });
              setCreatedInviteResult(null);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition shadow-sm shadow-purple-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Usuário / Acesso</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou empresa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 transition"
          >
            Buscar
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todos os Status</option>
              <option value="ATIVO">🟢 Ativos</option>
              <option value="BLOQUEADO">🔴 Bloqueados</option>
              <option value="PENDENTE">🟡 Pendentes</option>
              <option value="EXCLUIDO">⚪ Excluídos</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Perfil / Função
            </label>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todos os Perfis</option>
              <option value="SUPER_ADMIN">👑 Super Admin</option>
              <option value="ADMIN">🛡️ Administrador</option>
              <option value="CLIENT_ADMIN">🏢 Admin Cliente</option>
              <option value="USER">👤 Usuário Padrão</option>
            </select>
          </div>

          {/* Company Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Cliente / Empresa
            </label>
            <select
              value={companyFilter}
              onChange={e => setCompanyFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todas as Empresas</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Last Login Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Último Acesso
            </label>
            <select
              value={lastAccessFilter}
              onChange={e => setLastAccessFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Qualquer período</option>
              <option value="hoje">Hoje</option>
              <option value="7dias">Últimos 7 dias</option>
              <option value="30dias">Últimos 30 dias</option>
              <option value="mais30">Inativos há +30 dias</option>
              <option value="mais60">Inativos há +60 dias</option>
              <option value="mais90">Inativos há +90 dias</option>
              <option value="nunca">Nunca acessaram</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nome / E-mail</th>
                <th className="py-3 px-3">Cliente / Empresa</th>
                <th className="py-3 px-3">Perfil</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Último Acesso</th>
                <th className="py-3 px-3">Criação</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      <span>Carregando usuários...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Nenhum usuário encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                users.map(u => {
                  const roleBadge = getRoleBadge(u.role);
                  const statusBadge = getUserStatusBadge(u.status);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <p className="text-[11px] text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="py-3 px-3">
                        {u.company ? (
                          <div className="flex items-center space-x-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-800">{u.company.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Individual</span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge.bg}`}
                        >
                          <span className="mr-1">{roleBadge.emoji}</span>
                          {roleBadge.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusBadge.dot}`} />
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="py-3 px-3">
                        {u.lastLoginAt ? (
                          <div>
                            <p className="font-semibold text-slate-800">{formatRelativeTime(u.lastLoginAt)}</p>
                            <p className="text-[10px] text-slate-400">
                              {u.lastLoginBrowser || 'Web'} • {formatDateTime(u.lastLoginAt)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Nunca acessou</span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {formatDateTime(u.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => {
                              setSelectedUserId(u.id);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
                            title="Visualizar detalhes completos"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition"
                            title="Editar usuário"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {u.id !== currentUser?.id && u.status !== 'EXCLUIDO' && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Remover acesso (Soft delete)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Detail Modal */}
      <AdminUserDetailModal
        userId={selectedUserId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedUserId(null);
        }}
        onUserUpdated={fetchUsers}
      />

      {/* Modal: Novo Usuário */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span>Cadastrar Novo Usuário / Acesso</span>
            </h2>

            {createdInviteResult ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h3 className="font-bold text-emerald-900 text-sm">Usuário criado com sucesso!</h3>
                  <p className="text-xs text-emerald-700">
                    O acesso para <strong>{createdInviteResult.userEmail}</strong> foi configurado.
                  </p>
                </div>

                {createdInviteResult.link && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Link do Convite de Acesso
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={createdInviteResult.link}
                        className="w-full p-2 text-xs bg-slate-100 rounded-xl border border-slate-300 font-mono text-slate-800"
                      />
                      <button
                        onClick={() => {
                          if (createdInviteResult.link) {
                            navigator.clipboard.writeText(createdInviteResult.link);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }
                        }}
                        className="px-3 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0"
                      >
                        {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Envie este link para o colaborador definir sua senha e começar a usar a plataforma.
                    </p>
                  </div>
                )}

                {createdInviteResult.tempPassword && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Senha Temporária Gerada
                    </label>
                    <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 font-mono text-center font-bold text-slate-900 select-all">
                      {createdInviteResult.tempPassword}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-full py-2.5 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition"
                >
                  Concluir e Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Ex: João Silva"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    E-mail de Acesso *
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="Ex: joao@empresa.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Perfil de Acesso
                    </label>
                    <select
                      value={createForm.role}
                      onChange={e => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="USER">👤 Usuário Padrão</option>
                      <option value="CLIENT_ADMIN">🏢 Admin do Cliente</option>
                      {currentUser?.role === 'SUPER_ADMIN' && (
                        <>
                          <option value="ADMIN">🛡️ Administrador</option>
                          <option value="SUPER_ADMIN">👑 Super Admin</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Vincular Empresa
                    </label>
                    <select
                      value={createForm.companyId}
                      onChange={e => setCreateForm({ ...createForm, companyId: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Nenhuma (Individual)</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Activation method */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.sendInvitation}
                      onChange={e => setCreateForm({ ...createForm, sendInvitation: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-semibold">Gerar convite com link de ativação</span>
                  </label>
                  <p className="text-[10px] text-slate-400 pl-5">
                    O usuário receberá um link seguro para definir sua própria senha.
                  </p>
                </div>

                {!createForm.sendInvitation && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Senha Inicial
                    </label>
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-sm"
                  >
                    {actionLoading ? 'Salvando...' : 'Criar Usuário'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Editar Usuário */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-sky-600" />
              <span>Editar Dados do Usuário</span>
            </h2>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Perfil
                  </label>
                  <select
                    value={editForm.role}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="USER">👤 Usuário Padrão</option>
                    <option value="CLIENT_ADMIN">🏢 Admin do Cliente</option>
                    {currentUser?.role === 'SUPER_ADMIN' && (
                      <>
                        <option value="ADMIN">🛡️ Administrador</option>
                        <option value="SUPER_ADMIN">👑 Super Admin</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value as UserStatus })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="ATIVO">🟢 Ativo</option>
                    <option value="BLOQUEADO">🔴 Bloqueado</option>
                    <option value="PENDENTE">🟡 Pendente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Empresa / Cliente Vinculado
                </label>
                <select
                  value={editForm.companyId}
                  onChange={e => setEditForm({ ...editForm, companyId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Nenhuma (Individual)</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-sm"
                >
                  {actionLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
