import React, { useState, useEffect } from 'react';
import { X, Save, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Category, Transaction, TransactionType } from '../types';
import { formatInputDate } from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionData: any) => Promise<void>;
  transaction?: Transaction | null;
  initialType?: TransactionType;
  categories: Category[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transaction,
  initialType = 'SAIDA',
  categories,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(formatInputDate(new Date()));
  const [dueDate, setDueDate] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [status, setStatus] = useState<string>('PAGO');
  const [isFixed, setIsFixed] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setDescription(transaction.description);
      setAmount(transaction.amount.toString());
      setDate(formatInputDate(transaction.date));
      setDueDate(transaction.dueDate ? formatInputDate(transaction.dueDate) : '');
      setPaymentDate(transaction.paymentDate ? formatInputDate(transaction.paymentDate) : '');
      setCategoryId(transaction.categoryId || '');
      setSubCategory(transaction.subCategory || '');
      setPaymentMethod(transaction.paymentMethod || 'PIX');
      setStatus(transaction.status);
      setIsFixed(transaction.isFixed);
      setNotes(transaction.notes || '');
    } else {
      setType(initialType);
      setDescription('');
      setAmount('');
      setDate(formatInputDate(new Date()));
      setDueDate('');
      setPaymentDate('');
      setCategoryId('');
      setSubCategory('');
      setPaymentMethod('PIX');
      setStatus(initialType === 'ENTRADA' ? 'RECEBIDO' : 'PAGO');
      setIsFixed(false);
      setNotes('');
    }
    setError('');
  }, [transaction, initialType, isOpen]);

  // Adjust default status when type changes
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (!transaction) {
      setStatus(newType === 'ENTRADA' ? 'RECEBIDO' : 'PAGO');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor monetário válido e maior que zero.');
      return;
    }

    if (!description.trim()) {
      setError('A descrição do lançamento é obrigatória.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        type,
        description: description.trim(),
        amount: parsedAmount,
        date: new Date(date).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        paymentDate: paymentDate ? new Date(paymentDate).toISOString() : null,
        categoryId: categoryId || null,
        subCategory: subCategory.trim() || null,
        paymentMethod,
        status,
        isFixed,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar lançamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                type === 'ENTRADA' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
              }`}
            >
              {type === 'ENTRADA' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {transaction ? 'Editar Lançamento' : type === 'ENTRADA' ? 'Nova Entrada' : 'Nova Saída'}
              </h3>
              <p className="text-xs text-slate-500">
                {transaction ? 'Atualize as informações do registro' : 'Preencha os dados do lançamento financeiro'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* Type Selector (Entrada / Saída) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange('ENTRADA')}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border transition ${
                type === 'ENTRADA'
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>Entrada (Receita)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('SAIDA')}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border transition ${
                type === 'SAIDA'
                  ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>Saída (Despesa)</span>
            </button>
          </div>

          {/* Amount & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Supermercado, Salário, Internet"
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

          {/* Dates: Data do Lançamento, Vencimento, Data de Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data do Lançamento <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Vencimento</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {type === 'ENTRADA' ? 'Data Recebimento' : 'Data Pagamento'}
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              >
                <option value="">Selecione uma categoria...</option>
                {filteredCategories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subcategoria (Opcional)</label>
              <input
                type="text"
                value={subCategory}
                onChange={e => setSubCategory(e.target.value)}
                placeholder="Ex: Frutas, Gasolina, Farmácia"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Method & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              >
                <option value="PIX">PIX</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="CARTAO_DEBITO">Cartão de Débito</option>
                <option value="BOLETO">Boleto Bancário</option>
                <option value="TRANSFERENCIA">Transferência / TED</option>
                <option value="DINHEIRO">Dinheiro em Espécie</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              >
                {type === 'SAIDA' ? (
                  <>
                    <option value="PAGO">Pago 🟢</option>
                    <option value="PENDENTE">Pendente 🟡</option>
                    <option value="VENCIDO">Vencido 🔴</option>
                    <option value="CANCELADO">Cancelado ⚪</option>
                  </>
                ) : (
                  <>
                    <option value="RECEBIDO">Recebido 🟢</option>
                    <option value="PENDENTE">Pendente 🟡</option>
                    <option value="ATRASADO">Atrasado 🔴</option>
                    <option value="CANCELADO">Cancelado ⚪</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Is Fixed (Gasto Fixo) Checkbox */}
          {type === 'SAIDA' && (
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="isFixed"
                checked={isFixed}
                onChange={e => setIsFixed(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
              />
              <label htmlFor="isFixed" className="text-xs font-medium text-slate-700 select-none cursor-pointer">
                Este é um <strong className="text-slate-900">Gasto Fixo</strong> (recorrente como aluguel, internet, etc.)
              </label>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Observações (Opcional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Detalhes adicionais sobre este lançamento..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Modal Actions */}
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
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Lançamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
