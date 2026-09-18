import React, { useState, useEffect } from 'react';
import { X, Save, Tags } from 'lucide-react';
import { Category, TransactionType } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  category?: Category | null;
}

const PRESET_COLORS = [
  '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#84cc16',
  '#eab308', '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#d946ef',
  '#a855f7', '#8b5cf6', '#6366f1', '#64748b'
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  category,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('SAIDA');
  const [color, setColor] = useState('#3b82f6');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type);
      setColor(category.color || '#3b82f6');
    } else {
      setName('');
      setType('SAIDA');
      setColor('#3b82f6');
    }
    setError('');
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome da categoria é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        type,
        color,
        icon: 'Tag',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar categoria.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {category ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <p className="text-xs text-slate-500">Personalize suas categorias de receitas e despesas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome da Categoria <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Combustível, Pets, Cuidados Pessoais"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo da Categoria</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('SAIDA')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  type === 'SAIDA'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                Saída (Despesa)
              </button>
              <button
                type="button"
                onClick={() => setType('ENTRADA')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  type === 'ENTRADA'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                Entrada (Receita)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Cor de Identificação</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-lg transition-transform ${
                    color === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-800' : 'hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition shadow-md shadow-sky-600/20"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Categoria'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
