import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  User,
  Send,
  MessageCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AgendaView: React.FC = () => {
  const { emprestimos, clientes } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Month names in Portuguese
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Map installments by YYYY-MM-DD
  const parcelasPorData: Record<
    string,
    {
      clienteNome: string;
      clienteWhatsapp: string;
      valor: number;
      status: string;
      parcelaNumero: number;
    }[]
  > = {};

  emprestimos.forEach((emp) => {
    const cli = clientes.find((c) => c.id === emp.clienteID);
    (emp.parcelas || []).forEach((par) => {
      const vKey = par.vencimento || '';
      if (!vKey) return;
      if (!parcelasPorData[vKey]) {
        parcelasPorData[vKey] = [];
      }
      parcelasPorData[vKey].push({
        clienteNome: cli?.nome || 'Cliente',
        clienteWhatsapp: cli?.whatsapp || cli?.telefone || '',
        valor: (par.valorParcela || 0) - (par.valorPagoTotal || 0),
        status: par.status || 'Ativo',
        parcelaNumero: par.numero,
      });
    });
  });

  const formatBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Scheduled items for the selected day
  const parcelasDoDia = parcelasPorData[selectedDayStr] || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-amber-400" />
            Agenda de Vencimentos & Cobranças
          </h2>
          <p className="text-xs text-zinc-400">
            Calendário interativo para acompanhamento dos recebimentos diários.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid (Left) */}
        <div className="lg:col-span-7 rounded-2xl border border-amber-500/30 bg-zinc-900 p-5 shadow-xl">
          {/* Calendar Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
            <h3 className="text-base font-extrabold text-zinc-100 flex items-center gap-2">
              <span className="text-amber-400">{monthNames[month]}</span> {year}
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-zinc-300 hover:bg-zinc-800 hover:text-amber-400"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-zinc-300 hover:bg-zinc-800 hover:text-amber-400"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-zinc-500 mb-2 uppercase">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty slots for month start */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-20 rounded-xl bg-zinc-950/30 opacity-20" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dayFormatted = String(dayNum).padStart(2, '0');
              const monthFormatted = String(month + 1).padStart(2, '0');
              const dateStr = `${year}-${monthFormatted}-${dayFormatted}`;

              const isSelected = dateStr === selectedDayStr;
              const itemsOnDay = parcelasPorData[dateStr] || [];

              const hasOverdue = itemsOnDay.some((i) => i.status === 'Atrasado');
              const hasDueToday = itemsOnDay.some((i) => i.status === 'Vence hoje');

              return (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDayStr(dateStr)}
                  className={`h-20 rounded-xl border p-2 text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/10 ring-1 ring-amber-400'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-amber-300' : 'text-zinc-200'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {itemsOnDay.length > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${
                          hasOverdue
                            ? 'bg-red-500 text-white'
                            : hasDueToday
                            ? 'bg-amber-500 text-zinc-950'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {itemsOnDay.length}
                      </span>
                    )}
                  </div>

                  {itemsOnDay.length > 0 && (
                    <div className="text-[9px] font-extrabold text-amber-300 truncate">
                      {formatBRL(itemsOnDay.reduce((a, b) => a + b.valor, 0))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Detail (Right) */}
        <div className="lg:col-span-5 rounded-2xl border border-amber-500/30 bg-zinc-900 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase">
                Compromissos do Dia
              </span>
              <h3 className="text-base font-bold text-zinc-100">
                {selectedDayStr.split('-').reverse().join('/')}
              </h3>
            </div>
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-300">
              {parcelasDoDia.length} parcela(s)
            </span>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {parcelasDoDia.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500 bg-zinc-950 rounded-xl">
                Nenhum vencimento registrado para esta data.
              </div>
            ) : (
              parcelasDoDia.map((item, idx) => {
                const formatPhoneForWA = item.clienteWhatsapp.replace(/\D/g, '');
                const waText = encodeURIComponent(
                  `Olá ${item.clienteNome}, lembramos do vencimento de R$ ${item.valor.toFixed(2)} programado para ${selectedDayStr}.`
                );

                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-2 hover:border-amber-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-100 text-xs">{item.clienteNome}</span>
                      <span className="text-[10px] text-amber-400 font-bold uppercase">
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Parcela #{item.parcelaNumero}</span>
                      <span className="font-black text-amber-300">
                        {formatBRL(item.valor)}
                      </span>
                    </div>

                    {item.clienteWhatsapp && (
                      <div className="pt-2 border-t border-zinc-900 flex justify-end">
                        <a
                          href={`https://wa.me/${formatPhoneForWA}?text=${waText}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 rounded bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                        >
                          <MessageCircle className="h-3 w-3" />
                          Cobrar via WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
