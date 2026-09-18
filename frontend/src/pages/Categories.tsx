import React, { useState, useEffect } from 'react';
import { Plus, Tags, Trash2, Edit2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { api } from '../services/api';
import { Category } from '../types';
import { CategoryModal } from '../components/CategoryModal';

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'TODAS' | 'ENTRADA' | 'SAIDA'>('TODAS');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ categories: Category[] }>('/categories');
      setCategories(res.categories);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSaveCategory = async (data: any) => {
    if (editingCategory) {
      await api.put(`/categories/${editingCategory.id}`, data);
    } else {
      await api.post('/categories', data);
    }
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir esta categoria? Os lançamentos vinculados passarão a ficar sem categoria.')) {
      try {
        await api.delete(`/categories/${id}`);
        fetchCategories();
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir categoria.');
      }
    }
  };

  const filtered = categories.filter(c => {
    if (activeTab === 'TODAS') return true;
    return c.type === activeTab;
  });

  const entradas = categories.filter(c => c.type === 'ENTRADA');
  const saidas = categories.filter(c => c.type === 'SAIDA');

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Gerenciamento de Categorias</h1>
          <p className="text-xs text-slate-500">
            Organize suas receitas e despesas com categorias e cores personalizadas
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCategory(null);
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nova Categoria</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-white p-1.5 shadow-sm border border-slate-200/80 max-w-md">
        <button
          onClick={() => setActiveTab('TODAS')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'TODAS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Todas ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('ENTRADA')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
            activeTab === 'ENTRADA'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowUpCircle className="w-3.5 h-3.5" />
          <span>Entradas ({entradas.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('SAIDA')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
            activeTab === 'SAIDA'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowDownCircle className="w-3.5 h-3.5" />
          <span>Saídas ({saidas.length})</span>
        </button>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-2"></div>
          <p className="text-xs text-slate-400">Carregando categorias...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(cat => {
            const isEntrada = cat.type === 'ENTRADA';

            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 hover:shadow-md transition flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm shrink-0"
                    style={{ backgroundColor: cat.color }}
                  >
                    <Tags className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 truncate">{cat.name}</h3>
                    <span
                      className={`inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                        isEntrada ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {isEntrada ? 'Receita' : 'Despesa'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition">
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"
                    title="Editar Categoria"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Excluir Categoria"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCategory}
        category={editingCategory}
      />
    </div>
  );
};
