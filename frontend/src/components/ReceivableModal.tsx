import React, { useState, useEffect } from 'react';
import { X, Save, ArrowUpRight } from 'lucide-react';
import { Category, ReceivableAccount } from '../types';
import { formatInputDate } from '../utils/formatters';

interface ReceivableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  receivable?: ReceivableAccount | null;
  categories: Category[];
}

export const ReceivableModal: React.FC<ReceivableModalProps> = ({
  isOpen,
  onClose,
  onSave,
  receivable,
  categories,
}) => {
  const [debtorName, setDebtorName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expectedDate, setExpectedDate] = useState(formatInputDate(new Date()));
  const [receivedDate, setReceivedDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('A_RECEBER');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (receivable) {
      setDebtorName(receivable.debtorName);
      setDescription(receivable.description);
      setAmount(receivable.amount.toString());
      setExpectedDate(formatInputDate(receivable.expectedDate));
      setReceivedDate(receivable.receivedDate ? formatInputDate(receivable.receivedDate) : '');
      setCategoryId(receivable.categoryId || '');
      setStatus(receivable.status);
      setNotes(receivable.notes || '');
    } else {
      setDebtorName('');
      setDescription('');
      setAmount('');
      setExpectedDate(formatInputDate(new Date()));
      setReceivedDate('');
      setCategoryId('');
      setStatus('A_RECEBER');
      setNotes('');
    }
    setError('');
  }, [receivable, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor monetário válido.');
      return;
    }

    if (!debtorName.trim()) {
      setError('O nome da pessoa ou empresa devedora é obrigatório.');
      return;
    }

    if (!description.trim()) {
      setError('A descrição é obrigatória.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        debtorName: debtorName.trim(),
        description: description.trim(),
        amount: parsedAmount,
        expectedDate: new Date(expectedDate).toISOString(),
        receivedDate: receivedDate ? new Date(receivedDate).toISOString() : null,
        categoryId: categoryId || null,
        status,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar conta a receber.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const incomeCategories = categories.filter(c => c.type === 'ENTRADA');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-sky-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {receivable ? 'Editar Valor a Receber' : 'Novo Valor a Receber'}
              </h3>
              <p className="text-xs text-slate-500">Cadastre quem deve pagar e a data prevista</p>
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

          {/* Debtor Name & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome da Pessoa ou Empresa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={debtorName}
                onChange={e => setDebtorName(e.target.value)}
                placeholder="Ex: João Silva, Empresa ABC"
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

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Referente a / Descrição <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Empréstimo, Prestação de Serviço, Venda"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Expected Date & Received Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data Prevista para Receber <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={expectedDate}
                onChange={e => setExpectedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Data Efetiva do Recebimento</label>
              <input
                type="date"
                value={receivedDate}
                onChange={e => setReceivedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              >
                <option value="">Selecione a categoria...</option>
                {incomeCategories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              >
                <option value="A_RECEBER">A Receber 🟠</option>
                <option value="RECEBIDO">Recebido 🟢</option>
                <option value="ATRASADO">Atrasado 🔴</option>
                <option value="CANCELADO">Cancelado ⚪</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Observações</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Combinou de pagar via PIX..."
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
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition shadow-md shadow-sky-600/20"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Valor a Receber'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
