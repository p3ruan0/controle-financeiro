import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCcw,
} from 'lucide-react';
import { api } from '../services/api';
import { Category, Transaction, TransactionType } from '../types';
import { formatCurrency, formatDate, getPaymentMethodName, getStatusDetails } from '../utils/formatters';
import { TransactionModal } from '../components/TransactionModal';
import { useCategories } from '../contexts/CategoriesContext';
import { useDataSync } from '../hooks/useDataSync';

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { categories } = useCategories();
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [monthFilter, setMonthFilter] = useState((new Date().getMonth() + 1).toString());
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [modalInitialType, setModalInitialType] = useState<TransactionType>('SAIDA');

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (categoryFilter !== 'all') params.append('categoryId', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (methodFilter !== 'all') params.append('paymentMethod', methodFilter);
      if (minAmount) params.append('minAmount', minAmount);
      if (maxAmount) params.append('maxAmount', maxAmount);
      if (monthFilter) params.append('month', monthFilter);
      if (yearFilter) params.append('year', yearFilter);

      const res = await api.get<{ transactions: Transaction[] }>(`/transactions?${params.toString()}`);
      setTransactions(res.transactions);
    } catch (err) {
      console.error('Erro ao buscar lançamentos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reactively re-fetch transactions when any mutation occurs across the application
  useDataSync(['transactions', 'all'], () => {
    fetchTransactions();
  });

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTransactions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [
    search,
    typeFilter,
    categoryFilter,
    statusFilter,
    methodFilter,
    minAmount,
    maxAmount,
    monthFilter,
    yearFilter,
  ]);

  const handleSaveTransaction = async (data: any) => {
    if (editingTransaction) {
      await api.put(`/transactions/${editingTransaction.id}`, data);
    } else {
      await api.post('/transactions', data);
    }
    fetchTransactions();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este lançamento?')) {
      try {
        await api.delete(`/transactions/${id}`);
        fetchTransactions();
      } catch (err) {
        alert('Erro ao excluir lançamento.');
      }
    }
  };

  const handleMarkAsPaid = async (t: Transaction) => {
    try {
      await api.patch(`/transactions/${t.id}/pay`, { paymentDate: new Date().toISOString() });
      fetchTransactions();
    } catch (err) {
      alert('Erro ao atualizar status.');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setStatusFilter('all');
    setMethodFilter('all');
    setMinAmount('');
    setMaxAmount('');
    setMonthFilter((new Date().getMonth() + 1).toString());
    setYearFilter(new Date().getFullYear().toString());
  };

  // Calculate totals of current filtered list
  const totalEntradasFiltradas = transactions
    .filter(t => t.type === 'ENTRADA' && t.status !== 'CANCELADO')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSaidasFiltradas = transactions
    .filter(t => t.type === 'SAIDA' && t.status !== 'CANCELADO')
    .reduce((sum, t) => sum + t.amount, 0);

  const saldoFiltrado = totalEntradasFiltradas - totalSaidasFiltradas;

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Lançamentos Financeiros</h1>
          <p className="text-xs text-slate-500">Histórico detalhado de todas as suas entradas e saídas</p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setEditingTransaction(null);
              setModalInitialType('ENTRADA');
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Entrada</span>
          </button>

          <button
            onClick={() => {
              setEditingTransaction(null);
              setModalInitialType('SAIDA');
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Saída</span>
          </button>
        </div>
      </div>

      {/* Summary Chips for Filtered Data */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-800">Entradas Filtradas</span>
          <span className="text-sm font-black text-emerald-700">{formatCurrency(totalEntradasFiltradas)}</span>
        </div>
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
          <span className="text-xs font-bold text-rose-800">Saídas Filtradas</span>
          <span className="text-sm font-black text-rose-700">{formatCurrency(totalSaidasFiltradas)}</span>
        </div>
        <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between">
          <span className="text-xs font-bold text-sky-800">Saldo do Filtro</span>
          <span className={`text-sm font-black ${saldoFiltrado >= 0 ? 'text-sky-700' : 'text-rose-700'}`}>
            {formatCurrency(saldoFiltrado)}
          </span>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-sky-600" />
            <span>Filtros e Pesquisa Avançada</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs text-sky-600 hover:underline flex items-center space-x-1 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar Filtros</span>
          </button>
        </div>

        {/* Search Input & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search text */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar por descrição ou nota..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Type */}
          <div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white font-medium"
            >
              <option value="all">Todos os Tipos (Entradas e Saídas)</option>
              <option value="ENTRADA">Apenas Entradas</option>
              <option value="SAIDA">Apenas Saídas</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white font-medium"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.type === 'ENTRADA' ? '🟢 ' : '🔴 '}
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white font-medium"
            >
              <option value="all">Todos os Status</option>
              <option value="PAGO">Pago 🟢</option>
              <option value="RECEBIDO">Recebido 🟢</option>
              <option value="PENDENTE">Pendente 🟡</option>
              <option value="VENCIDO">Vencido 🔴</option>
              <option value="ATRASADO">Atrasado 🔴</option>
              <option value="CANCELADO">Cancelado ⚪</option>
            </select>
          </div>
        </div>

        {/* Secondary filters: Month, Year, Payment Method */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <select
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
            >
              <option value="">Todos os Meses</option>
              <option value="1">Janeiro</option>
              <option value="2">Fevereiro</option>
              <option value="3">Março</option>
              <option value="4">Abril</option>
              <option value="5">Maio</option>
              <option value="6">Junho</option>
              <option value="7">Julho</option>
              <option value="8">Agosto</option>
              <option value="9">Setembro</option>
              <option value="10">Outubro</option>
              <option value="11">Novembro</option>
              <option value="12">Dezembro</option>
            </select>
          </div>

          <div>
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
            >
              <option value="">Todos os Anos</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          <div>
            <select
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
            >
              <option value="all">Todas as Formas de Pagto</option>
              <option value="PIX">PIX</option>
              <option value="CARTAO_CREDITO">Cartão de Crédito</option>
              <option value="CARTAO_DEBITO">Cartão de Débito</option>
              <option value="BOLETO">Boleto</option>
              <option value="TRANSFERENCIA">Transferência</option>
              <option value="DINHEIRO">Dinheiro</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <input
              type="text"
              value={minAmount}
              onChange={e => setMinAmount(e.target.value)}
              placeholder="R$ Mín"
              className="w-1/2 px-2 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <input
              type="text"
              value={maxAmount}
              onChange={e => setMaxAmount(e.target.value)}
              placeholder="R$ Máx"
              className="w-1/2 px-2 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Carregando lançamentos...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-slate-700">Nenhum lançamento encontrado</p>
            <p className="text-xs text-slate-400 mt-1">Tente ajustar os filtros ou registre um novo lançamento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Data / Venc.</th>
                  <th className="py-3 px-4">Forma Pagto</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {transactions.map(t => {
                  const isEntrada = t.type === 'ENTRADA';
                  const statusInfo = getStatusDetails(t.status, t.type);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition group">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isEntrada ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {isEntrada ? (
                            <ArrowUpCircle className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{isEntrada ? 'Entrada' : 'Saída'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{t.description}</div>
                        {t.notes && <div className="text-[11px] text-slate-400 truncate max-w-xs">{t.notes}</div>}
                        {t.isFixed && (
                          <span className="inline-block mt-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            Gasto Fixo
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {t.category ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.category.color }} />
                            <span className="font-medium text-slate-700">{t.category.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Sem categoria</span>
                        )}
                        {t.subCategory && <div className="text-[10px] text-slate-400">{t.subCategory}</div>}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        <div>{formatDate(t.date)}</div>
                        {t.dueDate && (
                          <div className="text-[10px] text-slate-400">Vence: {formatDate(t.dueDate)}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {getPaymentMethodName(t.paymentMethod)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right font-black font-mono">
                        <span className={isEntrada ? 'text-emerald-600' : 'text-rose-600'}>
                          {isEntrada ? '+ ' : '- '}
                          {formatCurrency(t.amount)}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {/* Quick Pay button if pending or overdue */}
                          {(t.status === 'PENDENTE' || t.status === 'VENCIDO' || t.status === 'ATRASADO') && (
                            <button
                              onClick={() => handleMarkAsPaid(t)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                              title={t.type === 'SAIDA' ? 'Marcar como Paga' : 'Marcar como Recebida'}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setEditingTransaction(t);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"
                            title="Editar lançamento"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Excluir lançamento"
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

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        transaction={editingTransaction}
        initialType={modalInitialType}
        categories={categories}
      />
    </div>
  );
};
