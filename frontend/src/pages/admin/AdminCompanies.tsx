import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Lock,
  Unlock,
  Users,
  RefreshCw,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  Clock,
  X,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';
import { Company, User } from '../../types';
import { formatDateTime, formatRelativeTime, getUserStatusBadge } from '../../utils/formatters';
import { useDataSync } from '../../hooks/useDataSync';

export const AdminCompanies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    cnpj: '',
    contactName: '',
    email: '',
    phone: '',
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    cnpj: '',
    contactName: '',
    email: '',
    phone: '',
  });

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [targetCompany, setTargetCompany] = useState<Company | null>(null);
  const [statusReason, setStatusReason] = useState('');

  // Company users modal
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [companyUsers, setCompanyUsers] = useState<User[]>([]);
  const [usersModalLoading, setUsersModalLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await api.get<{ companies: Company[] }>(`/admin/companies?${params.toString()}`);
      setCompanies(res.companies || []);
    } catch (err) {
      console.error('Erro ao buscar empresas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [statusFilter]);

  // Reactively re-fetch companies when admin data mutates
  useDataSync(['admin-companies', 'all'], () => {
    fetchCompanies();
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompanies();
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/admin/companies', createForm);
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', cnpj: '', contactName: '', email: '', phone: '' });
      fetchCompanies();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao cadastrar empresa.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (c: Company) => {
    setEditingCompany(c);
    setEditForm({
      name: c.name,
      cnpj: c.cnpj || '',
      contactName: c.contactName || '',
      email: c.email || '',
      phone: c.phone || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/companies/${editingCompany.id}`, editForm);
      setIsEditModalOpen(false);
      fetchCompanies();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao atualizar empresa.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!targetCompany) return;
    setActionLoading(true);
    const action = targetCompany.status === 'ATIVO' ? 'block' : 'unblock';
    try {
      await api.patch(`/admin/companies/${targetCompany.id}/status`, {
        action,
        reason: statusReason,
      });
      setIsStatusModalOpen(false);
      setStatusReason('');
      setTargetCompany(null);
      fetchCompanies();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao alterar status da empresa.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenUsersModal = async (c: Company) => {
    setTargetCompany(c);
    setIsUsersModalOpen(true);
    setUsersModalLoading(true);
    try {
      const res = await api.get<{ users: User[] }>(`/admin/companies/${c.id}/users`);
      setCompanyUsers(res.users || []);
    } catch (err) {
      console.error('Erro ao buscar usuários da empresa:', err);
    } finally {
      setUsersModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
              <Building2 className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
              Multi-Empresas
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Clientes & Empresas</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Gerenciamento corporativo, bloqueio em cascata e visualização de colaboradores vinculados.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchCompanies}
            className="p-2.5 text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-sm"
            title="Atualizar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCreateForm({ name: '', cnpj: '', contactName: '', email: '', phone: '' });
              setIsCreateModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-700 transition shadow-sm shadow-sky-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Nova Empresa</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CNPJ, contato ou e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">Todos os Status</option>
            <option value="ATIVO">🟢 Ativas</option>
            <option value="BLOQUEADO">🔴 Bloqueadas</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Empresa / Razão Social</th>
                <th className="py-3 px-3">CNPJ</th>
                <th className="py-3 px-3">Contato Principal</th>
                <th className="py-3 px-3">Colaboradores</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Último Acesso</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                      <span>Carregando empresas...</span>
                    </div>
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              ) : (
                companies.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <p className="text-[10px] text-slate-400">Criada em {formatDateTime(c.createdAt)}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-700">
                      {c.cnpj || <span className="text-slate-400 italic">Não informado</span>}
                    </td>

                    <td className="py-3 px-3">
                      {c.contactName || c.email ? (
                        <div>
                          <p className="font-semibold text-slate-800">{c.contactName || 'Contato'}</p>
                          <p className="text-[11px] text-slate-500">{c.email || c.phone || '-'}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleOpenUsersModal(c)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                      >
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>{c.usersCount || 0} usuários</span>
                      </button>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          c.status === 'ATIVO'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            c.status === 'ATIVO' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {c.status === 'ATIVO' ? 'Ativa' : 'Bloqueada'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      {c.latestLogin ? (
                        <div>
                          <p className="font-semibold text-slate-800">{formatRelativeTime(c.latestLogin)}</p>
                          <p className="text-[10px] text-slate-400">{formatDateTime(c.latestLogin)}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Sem acessos</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition"
                          title="Editar empresa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setTargetCompany(c);
                            setStatusReason(c.blockedReason || '');
                            setIsStatusModalOpen(true);
                          }}
                          className={`p-1.5 rounded-lg transition ${
                            c.status === 'ATIVO'
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={c.status === 'ATIVO' ? 'Bloquear empresa' : 'Reativar empresa'}
                        >
                          {c.status === 'ATIVO' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nova Empresa */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-600" />
              <span>Cadastrar Empresa / Cliente</span>
            </h2>

            <form onSubmit={handleCreateCompany} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nome da Empresa / Razão Social *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Ex: Alfa Soluções Digitais Ltda"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={createForm.cnpj}
                    onChange={e => setCreateForm({ ...createForm, cnpj: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Contato Responsável
                  </label>
                  <input
                    type="text"
                    value={createForm.contactName}
                    onChange={e => setCreateForm({ ...createForm, contactName: e.target.value })}
                    placeholder="Ex: Carlos Oliveira"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    E-mail Corporativo
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="contato@empresa.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={createForm.phone}
                    onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

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
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-sm"
                >
                  {actionLoading ? 'Salvando...' : 'Cadastrar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Empresa */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-sky-600" />
              <span>Editar Empresa</span>
            </h2>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nome da Empresa / Razão Social
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={editForm.cnpj}
                    onChange={e => setEditForm({ ...editForm, cnpj: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Contato Responsável
                  </label>
                  <input
                    type="text"
                    value={editForm.contactName}
                    onChange={e => setEditForm({ ...editForm, contactName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    E-mail Corporativo
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
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

      {/* Modal: Bloquear / Reativar Empresa (Cascata) */}
      {isStatusModalOpen && targetCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">
                {targetCompany.status === 'ATIVO' ? 'Bloqueio em Cascata da Empresa' : 'Reativar Empresa'}
              </h3>
            </div>

            {targetCompany.status === 'ATIVO' ? (
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-2">
                <p className="font-bold">Atenção! Efeito em cascata:</p>
                <p>
                  Ao bloquear a empresa <strong>{targetCompany.name}</strong>, <u>todos</u> os seus usuários vinculados
                  terão suas sessões ativas encerradas imediatamente e perderão o acesso à plataforma até o desbloqueio.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                Ao reativar a empresa <strong>{targetCompany.name}</strong>, seus usuários poderão efetuar login novamente.
              </p>
            )}

            {targetCompany.status === 'ATIVO' && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Motivo do Bloqueio
                </label>
                <textarea
                  value={statusReason}
                  onChange={e => setStatusReason(e.target.value)}
                  placeholder="Ex: Inadimplência, rescisão contratual, solicitação da diretoria..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={actionLoading}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl transition shadow-sm ${
                  targetCompany.status === 'ATIVO'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {actionLoading
                  ? 'Processando...'
                  : targetCompany.status === 'ATIVO'
                  ? 'Bloquear Empresa e Usuários'
                  : 'Reativar Empresa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Usuários Vinculados à Empresa */}
      {isUsersModalOpen && targetCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center space-x-2.5">
                <Building2 className="w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Colaboradores de {targetCompany.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">{companyUsers.length} usuários cadastrados</p>
                </div>
              </div>
              <button
                onClick={() => setIsUsersModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {usersModalLoading ? (
                <div className="text-center py-8 text-slate-400 text-xs">Carregando usuários...</div>
              ) : companyUsers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Nenhum colaborador vinculado a esta empresa ainda.
                </div>
              ) : (
                <div className="space-y-2">
                  {companyUsers.map(u => {
                    const statusBadge = getUserStatusBadge(u.status);
                    return (
                      <div
                        key={u.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs uppercase">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <p className="text-[11px] text-slate-500">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.bg}`}
                          >
                            {statusBadge.label}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {u.lastLoginAt ? formatRelativeTime(u.lastLoginAt) : 'Nunca acessou'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsUsersModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
