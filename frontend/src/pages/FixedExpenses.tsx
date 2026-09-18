import React, { useState, useEffect } from 'react';
import {
  Plus,
  Repeat,
  Calendar,
  Zap,
  Edit2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { Category, RecurringExpense } from '../types';
import { formatCurrency, getPaymentMethodName } from '../utils/formatters';
import { FixedExpenseModal } from '../components/FixedExpenseModal';

export const FixedExpenses: React.FC = () => {
  const [fixedExpenses, setFixedExpenses] = useState<RecurringExpense[]>([]);
  const [totalMonthly, setTotalMonthly] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);

  const fetchFixedExpenses = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{
        fixedExpenses: RecurringExpense[];
        totalMonthly: number;
      }>('/fixed-expenses');
      setFixedExpenses(res.fixedExpenses);
      setTotalMonthly(res.totalMonthly);
    } catch (err) {
      console.error('Erro ao carregar gastos fixos:', err);
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
    fetchFixedExpenses();
    fetchCategories();
  }, []);

  const handleSaveExpense = async (data: any) => {
    if (editingExpense) {
      await api.put(`/fixed-expenses/${editingExpense.id}`, data);
    } else {
      await api.post('/fixed-expenses', data);
    }
    fetchFixedExpenses();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja realmente excluir esta despesa fixa?')) {
      try {
        await api.delete(`/fixed-expenses/${id}`);
        fetchFixedExpenses();
      } catch (err) {
        alert('Erro ao excluir despesa fixa.');
      }
    }
  };

  const handleGenerateMonth = async () => {
    try {
      setIsGenerating(true);
      setGenerationMessage('');
      const now = new Date();
      const res = await api.post<{ message: string; createdCount: number }>('/fixed-expenses/generate', {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });
      setGenerationMessage(res.message);
      setTimeout(() => setGenerationMessage(''), 5000);
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar lançamentos.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Gastos Fixos e Recorrentes</h1>
          <p className="text-xs text-slate-500">
            Despesas mensais previsíveis (aluguel, internet, condomínio, assinaturas, academia)
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={handleGenerateMonth}
            disabled={isGenerating}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-purple-100 text-purple-800 hover:bg-purple-200 text-xs font-bold transition border border-purple-200 shadow-sm"
            title="Gera os lançamentos deste mês para todos os gastos fixos ativos"
          >
            <Zap className="w-4 h-4 text-purple-600" />
            <span>{isGenerating ? 'Gerando...' : 'Gerar Lançamentos do Mês'}</span>
          </button>

          <button
            onClick={() => {
              setEditingExpense(null);
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Gasto Fixo</span>
          </button>
        </div>
      </div>

      {generationMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{generationMessage}</span>
        </div>
      )}

      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-purple-200">
            <Repeat className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-purple-200 uppercase tracking-wider">Custo Fixo Mensal Estimado</p>
            <h2 className="text-3xl font-black text-white mt-0.5">{formatCurrency(totalMonthly)}</h2>
            <p className="text-xs text-purple-200/80 mt-1">
              Soma de {fixedExpenses.filter(f => f.isActive).length} despesas fixas ativas
            </p>
          </div>
        </div>

        <div className="text-center sm:text-right">
          <span className="inline-block text-xs font-bold px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-purple-100">
            Automação Ativada
          </span>
          <p className="text-[11px] text-purple-200 mt-1 max-w-xs">
            Lançamentos criados automaticamente na virada de cada mês
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Carregando gastos fixos...</p>
          </div>
        ) : fixedExpenses.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-slate-700">Nenhum gasto fixo cadastrado</p>
            <p className="text-xs text-slate-400 mt-1">
              Cadastre suas contas recorrentes (aluguel, internet, condomínio, assinaturas).
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Nome da Despesa</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Dia Vencimento</th>
                  <th className="py-3 px-4">Forma Pagto</th>
                  <th className="py-3 px-4">Recorrência</th>
                  <th className="py-3 px-4">Auto Gerar</th>
                  <th className="py-3 px-4 text-right">Valor Mensal</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {fixedExpenses.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{item.name}</div>
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

                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-semibold">
                      Dia {item.dueDay}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {getPaymentMethodName(item.paymentMethod)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200">
                        {item.recurrence}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.autoGenerate ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span>{item.autoGenerate ? 'Sim 🟢' : 'Não'}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-right font-black font-mono text-purple-700">
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FixedExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveExpense}
        fixedExpense={editingExpense}
        categories={categories}
      />
    </div>
  );
};
