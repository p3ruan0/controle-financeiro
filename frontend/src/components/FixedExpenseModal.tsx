import React, { useState, useEffect } from 'react';
import { X, Save, Repeat } from 'lucide-react';
import { Category, RecurringExpense } from '../types';
import { useCategories } from '../contexts/CategoriesContext';

interface FixedExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  fixedExpense?: RecurringExpense | null;
  categories?: Category[];
}

export const FixedExpenseModal: React.FC<FixedExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  fixedExpense,
  categories: propCategories,
}) => {
  const { categories: contextCategories } = useCategories();
  const categories = propCategories && propCategories.length > 0 ? propCategories : contextCategories;
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState(10);
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BOLETO');
  const [recurrence, setRecurrence] = useState('MENSAL');
  const [isActive, setIsActive] = useState(true);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (fixedExpense) {
      setName(fixedExpense.name);
      setAmount(fixedExpense.amount.toString());
      setDueDay(fixedExpense.dueDay);
      setCategoryId(fixedExpense.categoryId || '');
      setPaymentMethod(fixedExpense.paymentMethod || 'BOLETO');
      setRecurrence(fixedExpense.recurrence || 'MENSAL');
      setIsActive(fixedExpense.isActive);
      setAutoGenerate(fixedExpense.autoGenerate);
      setNotes(fixedExpense.notes || '');
    } else {
      setName('');
      setAmount('');
      setDueDay(10);
      setCategoryId('');
      setPaymentMethod('BOLETO');
      setRecurrence('MENSAL');
      setIsActive(true);
      setAutoGenerate(true);
      setNotes('');
    }
    setError('');
  }, [fixedExpense, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor monetário válido.');
      return;
    }

    if (!name.trim()) {
      setError('O nome do gasto fixo é obrigatório.');
      return;
    }

    if (dueDay < 1 || dueDay > 31) {
      setError('O dia de vencimento deve estar entre 1 e 31.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        amount: parsedAmount,
        dueDay: Number(dueDay),
        categoryId: categoryId || null,
        paymentMethod,
        recurrence,
        isActive,
        autoGenerate,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar gasto fixo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const expenseCategories = categories.filter(c => c.type === 'SAIDA');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {fixedExpense ? 'Editar Gasto Fixo' : 'Novo Gasto Fixo'}
              </h3>
              <p className="text-xs text-slate-500">Despesas recorrentes mensais (aluguel, contas, etc.)</p>
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
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* Name & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome da Despesa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Internet, Aluguel, Academia"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor (R$) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2 text-sm font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Due Day & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dia do Vencimento (1 a 31) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={dueDay}
                onChange={e => setDueDay(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              >
                <option value="">Selecione uma categoria...</option>
                {expenseCategories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method & Recurrence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              >
                <option value="BOLETO">Boleto Bancário</option>
                <option value="PIX">PIX</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="CARTAO_DEBITO">Cartão de Débito</option>
                <option value="TRANSFERENCIA">Transferência / TED</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Recorrência</label>
              <select
                value={recurrence}
                onChange={e => setRecurrence(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              >
                <option value="MENSAL">Mensal</option>
                <option value="SEMANAL">Semanal</option>
                <option value="ANUAL">Anual</option>
              </select>
            </div>
          </div>

          {/* Checkboxes: Despesa Recorrente / Auto-gerar */}
          <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 space-y-2">
            <label className="flex items-center space-x-2 text-xs font-semibold text-purple-950 cursor-pointer">
              <input
                type="checkbox"
                checked={autoGenerate}
                onChange={e => setAutoGenerate(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-purple-300 focus:ring-purple-500"
              />
              <span>Gerar lançamentos automaticamente para os próximos meses</span>
            </label>
            <p className="text-[11px] text-purple-700 pl-6">
              Quando ativada, o sistema cria o lançamento automaticamente nas Contas a Pagar no dia agendado.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Observações</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Código de débito automático ou observações..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
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
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition shadow-md shadow-purple-600/20"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Gasto Fixo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
