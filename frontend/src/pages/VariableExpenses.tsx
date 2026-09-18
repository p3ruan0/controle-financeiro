import React, { useState, useEffect } from 'react';
import {
  Plus,
  PieChart,
  ShoppingBag,
  TrendingDown,
  Calendar,
  Utensils,
  Car,
  Trash2,
  Edit2,
} from 'lucide-react';
import { api } from '../services/api';
import { Category, Transaction } from '../types';
import { formatCurrency, formatDate, getPaymentMethodName, getStatusDetails } from '../utils/formatters';
import { TransactionModal } from '../components/TransactionModal';

export const VariableExpenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Transaction | null>(null);

  const fetchVariableExpenses = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ transactions: Transaction[] }>('/transactions?type=SAIDA&isFixed=false');
      setExpenses(res.transactions);
    } catch (err) {
      console.error('Erro ao carregar despesas variáveis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get<{ categories: Category[] }>('/categories');
      setCategories(res.categories);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  };

  useEffect(() => {
    fetchVariableExpenses();
    fetchCategories();
  }, []);

  const handleSaveExpense = async (data: any) => {
    if (editingExpense) {
      await api.put(`/transactions/${editingExpense.id}`, { ...data, isFixed: false });
    } else {
      await api.post('/transactions', { ...data, isFixed: false });
    }
    fetchVariableExpenses();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir este gasto variável?')) {
      try {
        await api.delete(`/transactions/${id}`);
        fetchVariableExpenses();
      } catch (err) {
        alert('Erro ao excluir.');
      }
    }
  };

  const totalVariaveis = expenses.reduce((sum, e) => sum + e.amount, 0);
  const ticketMedio = expenses.length > 0 ? totalVariaveis / expenses.length : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Gastos Variáveis do Dia a Dia</h1>
          <p className="text-xs text-slate-500">
            Acompanhe compras de mercado, alimentação, transporte, farmácia e lazer
          </p>
        </div>

        <button
          onClick={() => {
            setEditingExpense(null);
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ Novo Gasto Variável</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total em Gastos Variáveis</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{formatCurrency(totalVariaveis)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{expenses.length} compras / despesas registradas</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Ticket Médio por Gasto</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{formatCurrency(ticketMedio)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Média gasta por transação variável</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Foco de Controle</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-800 mt-2">Alimentação & Transporte</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Normalmente representam o maior volume</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Carregando despesas...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-slate-700">Nenhum gasto variável registrado</p>
            <p className="text-xs text-slate-400 mt-1">
              Registre suas compras de mercado, restaurantes, postos de gasolina, etc.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Forma Pagto</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {expenses.map(item => {
                  const statusInfo = getStatusDetails(item.status, 'SAIDA');

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

                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {formatDate(item.date)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {getPaymentMethodName(item.paymentMethod)}
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
                          <button
                            onClick={() => {
                              setEditingExpense(item);
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

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveExpense}
        transaction={editingExpense}
        initialType="SAIDA"
        categories={categories}
      />
    </div>
  );
};
