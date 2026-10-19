import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { CalendarEvent } from '../types';
import { formatCurrency, formatDate, getPaymentMethodName, getStatusDetails } from '../utils/formatters';
import { useDataSync } from '../hooks/useDataSync';

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const fetchCalendarEvents = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ events: CalendarEvent[] }>(`/calendar?month=${month}&year=${year}`);
      setEvents(res.events);
    } catch (err) {
      console.error('Erro ao carregar calendário:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarEvents();
  }, [month, year]);

  // Reactively re-fetch calendar events when financial data changes
  useDataSync(['calendar', 'all'], () => {
    fetchCalendarEvents();
  });

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // Calendar matrix calculations
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month, 0).getDate();

  // Create grid cells
  const daysArray: Array<{ dayNumber: number | null; dateString: string | null }> = [];

  // Blank slots before first day
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysArray.push({ dayNumber: null, dateString: null });
  }

  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysArray.push({ dayNumber: d, dateString: formattedDate });
  }

  const handleQuickPayOrReceive = async (ev: CalendarEvent) => {
    try {
      if (ev.source === 'transaction') {
        await api.patch(`/transactions/${ev.sourceId}/pay`, { paymentDate: new Date().toISOString() });
      } else {
        await api.patch(`/receivables/${ev.sourceId}/receive`, { receivedDate: new Date().toISOString() });
      }
      setSelectedEvent(null);
      fetchCalendarEvents();
    } catch (err) {
      alert('Erro ao processar ação.');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Calendário Financeiro</h1>
          <p className="text-xs text-slate-500">
            Acompanhe vencimentos de contas e previsões de recebimento dia a dia
          </p>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="font-bold text-slate-800 text-sm min-w-[150px] text-center">
            {monthNames[month - 1]} de {year}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={handleCurrentMonth}
            className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            Hoje
          </button>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 text-xs">
        <span className="font-bold text-slate-700">Legenda:</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Pago / Recebido 🟢
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> Conta a Vencer 🟡
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span> Vencido / Atrasado 🔴
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-semibold border border-sky-200">
          <span className="w-2 h-2 rounded-full bg-sky-500"></span> A Receber 🟠
        </span>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70 text-center text-xs font-bold text-slate-500 py-3">
          <span className="text-rose-500">Dom</span>
          <span>Seg</span>
          <span>Ter</span>
          <span>Qua</span>
          <span>Qui</span>
          <span>Sex</span>
          <span className="text-sky-600">Sáb</span>
        </div>

        {/* Days matrix */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[500px]">
          {daysArray.map((cell, index) => {
            if (!cell.dayNumber || !cell.dateString) {
              return <div key={`empty-${index}`} className="bg-slate-50/30 p-2 min-h-[90px] sm:min-h-[110px]" />;
            }

            const dayEvents = events.filter(e => e.date === cell.dateString);
            const isToday = cell.dateString === todayStr;

            return (
              <div
                key={cell.dateString}
                className={`p-1.5 sm:p-2 min-h-[90px] sm:min-h-[110px] transition flex flex-col justify-between ${
                  isToday ? 'bg-sky-50/40 ring-1 ring-inset ring-sky-300' : 'hover:bg-slate-50/50'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-extrabold ${
                      isToday ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-700'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400 sm:hidden">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Day Events list */}
                <div className="mt-1 space-y-1 flex-1 overflow-y-auto max-h-24">
                  {dayEvents.map(ev => {
                    const statusInfo = getStatusDetails(ev.status, ev.type);
                    return (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className={`w-full text-left px-1.5 py-1 rounded-lg text-[10px] sm:text-xs font-semibold truncate border transition shadow-xs flex items-center justify-between ${statusInfo.bg}`}
                        title={`${ev.title} - ${formatCurrency(ev.amount)}`}
                      >
                        <span className="truncate">{ev.title}</span>
                        <span className="shrink-0 font-bold ml-1 font-mono text-[9px] sm:text-[10px]">
                          {formatCurrency(ev.amount)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    selectedEvent.type === 'ENTRADA' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  {selectedEvent.type === 'ENTRADA' ? (
                    <ArrowUpCircle className="w-5 h-5" />
                  ) : (
                    <ArrowDownCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">{selectedEvent.title}</h3>
                  <p className="text-xs text-slate-500">
                    {selectedEvent.type === 'ENTRADA' ? 'Receita / Recebimento' : 'Despesa / Conta a Pagar'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-600">Valor do Lançamento</span>
                <span
                  className={`text-xl font-black font-mono ${
                    selectedEvent.type === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {formatCurrency(selectedEvent.amount)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Data Prevista</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{formatDate(selectedEvent.date)}</p>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Categoria</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedEvent.categoryName}</p>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Status</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {getStatusDetails(selectedEvent.status, selectedEvent.type).emoji}{' '}
                    {getStatusDetails(selectedEvent.status, selectedEvent.type).label}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Forma Pagto</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {selectedEvent.paymentMethod ? getPaymentMethodName(selectedEvent.paymentMethod) : 'PIX'}
                  </p>
                </div>
              </div>

              {selectedEvent.notes && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Observações</span>
                  <p className="text-slate-700 mt-0.5">{selectedEvent.notes}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl transition"
              >
                Fechar
              </button>

              {(selectedEvent.status === 'PENDENTE' ||
                selectedEvent.status === 'VENCIDO' ||
                selectedEvent.status === 'A_RECEBER' ||
                selectedEvent.status === 'ATRASADO') && (
                <button
                  onClick={() => handleQuickPayOrReceive(selectedEvent)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {selectedEvent.type === 'SAIDA' ? 'Marcar como Paga' : 'Marcar como Recebida'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
