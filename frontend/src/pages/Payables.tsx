import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Plus,
  AlertTriangle,
  Clock,
  Check,
  Search,
  Calendar,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import { Category, Transaction } from '../types';
import { formatCurrency, formatDate, getStatusDetails } from '../utils/formatters';
import { TransactionModal } from '../components/TransactionModal';
import { useCategories } from '../contexts/CategoriesContext';
import { useDataSync } from '../hooks/useDataSync';

export const Payables: React.FC = () => {
  const [payables, setPayables] = useState<Transaction[]>([]);
  const { categories } = useCategories();
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDENTE' | 'VENCIDO' | 'PAGO'>('all');
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const fetchPayables = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ transactions: Transaction[] }>('/transactions?type=SAIDA');
      setPayables(res.transactions);
    } catch (err) {
      console.error('Erro ao carregar contas a pagar:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayables();
  }, []);

  // Reactively re-fetch payables when transactions change anywhere
  useDataSync(['transactions', 'all'], () => {
    fetchPayables();
  });

  const handleMarkAsPaid = async (item: Transaction) => {
    try {
      await api.patch(`/transactions/${item.id}/pay`, {
        paymentDate: new Date().toISOString(),
      });
      fetchPayables();
    } catch (err) {
      alert('Erro ao marcar conta como paga.');
    }
  };

  const handleSaveTransaction = async (data: any) => {
    if (editingTransaction) {
      await api.put(`/transactions/${editingTransaction.id}`, data);
    } else {
      await api.post('/transactions', data);
    }
    fetchPayables();
  };

  // Calculations for Summary
  let totalPendente = 0;
  let totalVencido = 0;
  let totalPago = 0;
  let proximoVencimento: Date | null = null;
  const now = new Date();

  payables.forEach(p => {
    if (p.status === 'PENDENTE') {
      totalPendente += p.amount;
      if (p.dueDate) {
        const d = new Date(p.dueDate);
        if (!proximoVencimento || (d > now && d < proximoVencimento)) {
          proximoVencimento = d;
        }
      }
    } else if (p.status === 'VENCIDO') {
      totalVencido += p.amount;
    } else if (p.status === 'PAGO') {
      totalPago += p.amount;
    }
  });

  // Filter list
  const filtered = payables.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      const descMatch = p.description.toLowerCase().includes(term);
      const catMatch = p.category?.name.toLowerCase().includes(term);
      if (!descMatch && !catMatch) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Contas a Pagar</h1>
          <p className="text-xs text-slate-500">Acompanhe e liquide seus compromissos financeiros e faturas</p>
        </div>

        <button
          onClick={() => {
            setEditingTransaction(null);
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nova Conta a Pagar</span>
        </button>
      </div>

      {/* Resumo do Topo (Exigido pelo Prompt) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pendente */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">🟡 Total Pendente</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-amber-600 mt-2">{formatCurrency(totalPendente)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Aguardando pagamento</p>
        </div>

        {/* Total Vencido */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">🔴 Total Vencido</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-rose-600 mt-2">{formatCurrency(totalVencido)}</p>
          <p className="text-[11px] text-rose-600 font-semibold mt-0.5">Requer pagamento urgente</p>
        </div>

        {/* Total Pago */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">🟢 Total Pago</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Check className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-600 mt-2">{formatCurrency(totalPago)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Contas já liquidadas</p>
        </div>

        {/* Próximo Vencimento */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">📅 Próximo Vencimento</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-800 mt-2">
            {proximoVencimento ? formatDate(proximoVencimento) : 'Sem pendências'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Mais próximo da data atual</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas as Contas
          </button>
          <button
            onClick={() => setStatusFilter('PENDENTE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'PENDENTE'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            🟡 Pendentes
          </button>
          <button
            onClick={() => setStatusFilter('VENCIDO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'VENCIDO'
                ? 'bg-rose-500 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            🔴 Vencidas
          </button>
          <button
            onClick={() => setStatusFilter('PAGO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'PAGO'
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            🟢 Pagas
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar conta..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Carregando contas a pagar...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-slate-700">Nenhuma conta a pagar encontrada</p>
            <p className="text-xs text-slate-400 mt-1">Parabéns! Todas as contas do filtro estão em dia.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map(item => {
                  const statusInfo = getStatusDetails(item.status, 'SAIDA');
                  const isPaid = item.status === 'PAGO';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{item.description}</div>
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
                        {formatDate(item.dueDate || item.date)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.bg}`}
                        >
                          <span>{statusInfo.emoji}</span>
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right font-black font-mono text-rose-600">
                        {formatCurrency(item.amount)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {!isPaid ? (
                            <button
                              onClick={() => handleMarkAsPaid(item)}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center space-x-1 transition shadow-sm"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Marcar como Paga</span>
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Pago em {formatDate(item.paymentDate)}
                            </span>
                          )}
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

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        transaction={editingTransaction}
        initialType="SAIDA"
        categories={categories}
      />
    </div>
  );
};
