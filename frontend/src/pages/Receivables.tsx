import React, { useState, useEffect } from 'react';
import {
  Plus,
  CheckCircle,
  Search,
  ArrowUpRight,
  AlertTriangle,
  Clock,
  Trash2,
  Edit2,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import { Category, ReceivableAccount } from '../types';
import { formatCurrency, formatDate, getStatusDetails } from '../utils/formatters';
import { ReceivableModal } from '../components/ReceivableModal';
import { useCategories } from '../contexts/CategoriesContext';
import { useDataSync } from '../hooks/useDataSync';

export const Receivables: React.FC = () => {
  const [receivables, setReceivables] = useState<ReceivableAccount[]>([]);
  const { categories } = useCategories();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalAReceber: 0,
    totalRecebido: 0,
    totalAtrasado: 0,
    totalGeralPrevisto: 0,
  });

  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReceivable, setEditingReceivable] = useState<ReceivableAccount | null>(null);

  const fetchReceivables = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await api.get<{
        receivables: ReceivableAccount[];
        summary: any;
      }>(`/receivables?${params.toString()}`);

      setReceivables(res.receivables);
      if (res.summary) setSummary(res.summary);
    } catch (err) {
      console.error('Erro ao carregar contas a receber:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reactively re-fetch receivables when receivables change anywhere
  useDataSync(['receivables', 'all'], () => {
    fetchReceivables();
  });

  useEffect(() => {
    fetchReceivables();
  }, [statusFilter, search]);

  const handleMarkAsReceived = async (item: ReceivableAccount) => {
    try {
      await api.patch(`/receivables/${item.id}/receive`, {
        receivedDate: new Date().toISOString(),
        createTransactionEntry: true,
      });
      fetchReceivables();
    } catch (err) {
      alert('Erro ao marcar valor como recebido.');
    }
  };

  const handleSaveReceivable = async (data: any) => {
    if (editingReceivable) {
      await api.put(`/receivables/${editingReceivable.id}`, data);
    } else {
      await api.post('/receivables', data);
    }
    fetchReceivables();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja realmente excluir este registro de valor a receber?')) {
      try {
        await api.delete(`/receivables/${id}`);
        fetchReceivables();
      } catch (err) {
        alert('Erro ao excluir conta a receber.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Contas a Receber (Dinheiro a Receber)</h1>
          <p className="text-xs text-slate-500">
            Controle empréstimos, serviços prestados e devedores que precisam pagar você
          </p>
        </div>

        <button
          onClick={() => {
            setEditingReceivable(null);
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ Novo Valor a Receber</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total a Receber */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">🟠 Total a Receber</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-sky-700 mt-2">{formatCurrency(summary.totalAReceber)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Previsão de recebimento</p>
        </div>

        {/* Total Atrasado */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">🔴 Total Atrasado</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-rose-600 mt-2">{formatCurrency(summary.totalAtrasado)}</p>
          <p className="text-[11px] text-rose-600 font-semibold mt-0.5">Devedores com prazo expirado</p>
        </div>

        {/* Total Recebido */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">🟢 Total Recebido</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Check className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-600 mt-2">{formatCurrency(summary.totalRecebido)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Já depositado e creditado</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter('A_RECEBER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              statusFilter === 'A_RECEBER'
                ? 'bg-sky-600 text-white'
                : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
            }`}
          >
            🟠 A Receber
          </button>
          <button
            onClick={() => setStatusFilter('ATRASADO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              statusFilter === 'ATRASADO'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            🔴 Atrasados
          </button>
          <button
            onClick={() => setStatusFilter('RECEBIDO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              statusFilter === 'RECEBIDO'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            🟢 Recebidos
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por pessoa ou descrição..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Carregando valores a receber...</p>
          </div>
        ) : receivables.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-slate-700">Nenhum valor a receber encontrado</p>
            <p className="text-xs text-slate-400 mt-1">Cadastre pessoas ou empresas que precisam pagar você.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Devedor (Pessoa/Empresa)</th>
                  <th className="py-3 px-4">Referente a</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Data Prevista</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {receivables.map(item => {
                  const statusInfo = getStatusDetails(item.status, 'ENTRADA');
                  const isReceived = item.status === 'RECEBIDO';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {item.debtorName}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-800">{item.description}</div>
                        {item.notes && <div className="text-[11px] text-slate-400 truncate max-w-xs">{item.notes}</div>}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.category ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.category.color }} />
                            <span className="font-medium text-slate-700">{item.category.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Sem categoria</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        <div>{formatDate(item.expectedDate)}</div>
                        {isReceived && item.receivedDate && (
                          <div className="text-[10px] text-emerald-600">Recebido: {formatDate(item.receivedDate)}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.bg}`}
                        >
                          <span>{statusInfo.emoji}</span>
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right font-black font-mono text-emerald-700">
                        {formatCurrency(item.amount)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {!isReceived ? (
                            <button
                              onClick={() => handleMarkAsReceived(item)}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center space-x-1 transition shadow-sm"
                              title="Marcar como recebido e incluir no Saldo Atual"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Marcar como Recebido</span>
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Recebido
                            </span>
                          )}

                          <button
                            onClick={() => {
                              setEditingReceivable(item);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReceivableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveReceivable}
        receivable={editingReceivable}
        categories={categories}
      />
    </div>
  );
};
