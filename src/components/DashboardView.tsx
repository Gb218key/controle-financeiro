import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Percent,
  Users,
  UserX,
  AlertTriangle,
  Clock,
  Plus,
  DollarSign,
  TrendingUp,
  ChevronRight,
  Send,
  CalendarDays,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface DashboardViewProps {
  onOpenNovoCliente: () => void;
  onOpenNovoEmprestimo: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNovoCliente,
  onOpenNovoEmprestimo,
}) => {
  const { indicadores, emprestimos, clientes, setActiveModule, setSelectedClienteForHistory, updateDinheiroCaixa } = useApp();

  const [isEditingCaixa, setIsEditingCaixa] = useState(false);
  const [novoCaixaInput, setNovoCaixaInput] = useState('');

  const handleStartEditCaixa = () => {
    setNovoCaixaInput(indicadores.dinheiroCaixa.toString());
    setIsEditingCaixa(true);
  };

  const handleSaveCaixa = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(novoCaixaInput);
    if (!isNaN(parsed) && parsed >= 0) {
      updateDinheiroCaixa(parsed);
    }
    setIsEditingCaixa(false);
  };

  // Upcoming and overdue installments list
  const todasParcelasComInfo: {
    clienteNome: string;
    clienteWhatsapp: string;
    clienteID: string;
    emprestimoID: string;
    numero: number;
    vencimento: string;
    valorParcela: number;
    status: string;
  }[] = [];

  emprestimos.forEach((emp) => {
    if (emp.status !== 'Quitado' && emp.status !== 'Cancelado') {
      const cli = clientes.find((c) => c.id === emp.clienteID);
      emp.parcelas.forEach((par) => {
        if (par.status !== 'Pago') {
          todasParcelasComInfo.push({
            clienteNome: cli?.nome || 'Cliente Desconhecido',
            clienteWhatsapp: cli?.whatsapp || '',
            clienteID: emp.clienteID,
            emprestimoID: emp.id,
            numero: par.numero,
            vencimento: par.vencimento,
            valorParcela: par.valorParcela - par.valorPagoTotal,
            status: par.status,
          });
        }
      });
    }
  });

  // Sort by vencimento
  todasParcelasComInfo.sort((a, b) => a.vencimento.localeCompare(b.vencimento));

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      {/* Top Banner / Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-[#D4AF37]/20 bg-[#0A0A0A] p-6 shadow-xl">
        <div>
          <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.2em]">
            Visão Geral
          </span>
          <h2 className="text-2xl font-serif font-bold text-white mt-1">
            Painel de Controle
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Controle integrado de caixa, carteira de crédito e fluxo de cobranças.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onOpenNovoCliente}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-white/10 hover:border-white/30"
          >
            <Plus className="h-4 w-4 text-[#D4AF37]" />
            Cadastrar Cliente
          </button>

          <button
            onClick={onOpenNovoEmprestimo}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-5 py-2.5 text-xs font-bold text-black shadow-lg transition-all hover:brightness-110 active:scale-98"
          >
            <DollarSign className="h-4 w-4" />
            Novo Empréstimo
          </button>
        </div>
      </div>

      {/* Financial KPI Grid - 4 Primary Cards in Elegant Dark */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Dinheiro em Caixa (Editável) */}
        <div className="bg-[#111111] p-5 rounded-xl border border-[#D4AF37]/30 shadow-sm relative group">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/40 uppercase tracking-tighter">Dinheiro em Caixa</p>
            {!isEditingCaixa && (
              <button
                type="button"
                onClick={handleStartEditCaixa}
                className="flex items-center gap-1 text-[10px] font-bold text-[#D4AF37] hover:text-white bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 px-2 py-0.5 rounded transition-all cursor-pointer"
                title="Editar saldo disponível em caixa"
              >
                <Pencil className="h-3 w-3" />
                <span>Editar</span>
              </button>
            )}
          </div>

          {isEditingCaixa ? (
            <form onSubmit={handleSaveCaixa} className="mt-2 space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[#D4AF37] font-serif font-bold text-lg">R$</span>
                <input
                  type="number"
                  step="any"
                  autoFocus
                  value={novoCaixaInput}
                  onChange={(e) => setNovoCaixaInput(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-[#050505] border border-[#D4AF37] rounded-lg px-2.5 py-1 text-white font-serif font-bold text-lg focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1 bg-[#D4AF37] text-black font-bold text-xs py-1 rounded hover:brightness-110 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" /> Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingCaixa(false)}
                  className="px-2.5 py-1 bg-white/10 text-white/70 hover:text-white font-bold text-xs rounded cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          ) : (
            <p
              onClick={handleStartEditCaixa}
              className="text-2xl font-serif text-[#D4AF37] mt-1 font-bold cursor-pointer hover:underline flex items-baseline gap-2"
              title="Clique para editar o saldo em caixa"
            >
              {formatBRL(indicadores.dinheiroCaixa)}
            </p>
          )}
        </div>

        {/* 2. Total Emprestado */}
        <div className="bg-[#111111] p-5 rounded-xl border border-white/5 shadow-sm">
          <p className="text-xs text-white/40 uppercase tracking-tighter">Total Emprestado</p>
          <p className="text-2xl font-serif text-white mt-1 font-bold">
            {formatBRL(indicadores.totalEmprestado)}
          </p>
        </div>

        {/* 3. Total Recebido */}
        <div className="bg-[#111111] p-5 rounded-xl border border-white/5 shadow-sm">
          <p className="text-xs text-white/40 uppercase tracking-tighter">Total Recebido</p>
          <p className="text-2xl font-serif text-white mt-1 font-bold">
            {formatBRL(indicadores.totalRecebido)}
          </p>
        </div>

        {/* 4. Juros Recebidos */}
        <div className="bg-[#111111] p-5 rounded-xl border border-white/5 shadow-sm">
          <p className="text-xs text-white/40 uppercase tracking-tighter">Juros Recebidos</p>
          <p className="text-2xl font-serif text-[#D4AF37] mt-1 font-bold">
            {formatBRL(indicadores.jurosRecebidos)}
          </p>
        </div>
      </div>

      {/* Secondary Indicators - Client & Status Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Clientes Ativos */}
        <div className="bg-[#111111] p-4 rounded-xl border border-white/5">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] text-white/40 uppercase">Clientes Ativos</p>
              <p className="text-xl font-medium mt-1 text-white">{indicadores.clientesAtivos}</p>
            </div>
            <div className="w-12 h-1 bg-[#D4AF37]/20 rounded">
              <div className="w-3/4 h-full bg-[#D4AF37]"></div>
            </div>
          </div>
        </div>

        {/* Clientes Inadimplentes */}
        <div className="bg-[#111111] p-4 rounded-xl border border-white/5">
          <p className="text-[10px] text-white/40 uppercase">Clientes Inadimplentes</p>
          <p className="text-xl font-medium mt-1 text-red-500">{indicadores.clientesInadimplentes}</p>
        </div>

        {/* Parcelas Vencidas */}
        <div className="bg-[#111111] p-4 rounded-xl border border-white/5">
          <p className="text-[10px] text-white/40 uppercase">Parcelas Vencidas</p>
          <p className="text-xl font-medium mt-1 text-red-400">
            {indicadores.parcelasVencidasCount} <span className="text-xs text-white/40 font-normal">({formatBRL(indicadores.parcelasVencidasValor)})</span>
          </p>
        </div>

        {/* Parcelas A Vencer */}
        <div className="bg-[#111111] p-4 rounded-xl border border-white/5">
          <p className="text-[10px] text-white/40 uppercase">A Vencer (7 dias)</p>
          <p className="text-xl font-medium mt-1 text-white">
            {indicadores.parcelasParaVencerCount} <span className="text-xs text-white/40 font-normal">({formatBRL(indicadores.parcelasParaVencerValor)})</span>
          </p>
        </div>
      </div>

      {/* Main Visual Sections: Cobranças Prioritárias & Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cobranças Prioritárias List */}
        <div className="lg:col-span-2 bg-[#0A0A0A] rounded-2xl border border-[#D4AF37]/10 flex flex-col">
          <div className="p-5 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-sm font-semibold tracking-widest uppercase text-white">
              Cobranças Prioritárias
            </h3>
            <span className="text-[10px] bg-[#D4AF37] text-black font-bold px-2 py-0.5 rounded">
              AUTOMÁTICO
            </span>
          </div>

          <div className="flex-grow overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] uppercase text-white/30 border-b border-white/5">
                <tr>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Vencimento</th>
                  <th className="px-6 py-3 text-right">Valor</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-white/5">
                {todasParcelasComInfo.slice(0, 5).map((item, idx) => {
                  let statusMarkup = (
                    <span className="flex items-center gap-1.5 text-green-500 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Em dia
                    </span>
                  );

                  if (item.status === 'Vence hoje') {
                    statusMarkup = (
                      <span className="flex items-center gap-1.5 text-yellow-500 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> Vence Hoje
                      </span>
                    );
                  } else if (item.status === 'Atrasado') {
                    statusMarkup = (
                      <span className="flex items-center gap-1.5 text-red-500 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Atrasado
                      </span>
                    );
                  }

                  const formatPhoneForWA = item.clienteWhatsapp.replace(/\D/g, '');
                  const waMsg = encodeURIComponent(
                    `Olá ${item.clienteNome}, lembramos que sua parcela nº ${item.numero} no valor de ${formatBRL(item.valorParcela)} venceu/vence em ${item.vencimento}. Chave PIX da GGG Financeira: financeira@ggg.com.br. Dúvidas, estamos à disposição!`
                  );

                  return (
                    <tr key={idx} className="hover:bg-white/5 cursor-pointer transition-colors">
                      <td className="px-6 py-3.5 font-medium text-white">
                        {item.clienteNome}
                        <span className="block text-[10px] text-white/40">
                          Parcela #{item.numero}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-white/70">{item.vencimento}</td>
                      <td className="px-6 py-3.5 text-right font-serif text-[#D4AF37] font-bold">
                        {formatBRL(item.valorParcela)}
                      </td>
                      <td className="px-6 py-3.5">{statusMarkup}</td>
                      <td className="px-6 py-3.5 text-right">
                        {item.clienteWhatsapp ? (
                          <a
                            href={`https://wa.me/${formatPhoneForWA}?text=${waMsg}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-green-500/10 border border-green-500/30 px-2.5 py-1 text-[10px] font-bold text-green-400 hover:bg-green-500/20"
                          >
                            <Send className="h-3 w-3" />
                            Cobrar
                          </a>
                        ) : (
                          <button
                            onClick={() => setActiveModule('Cobranças')}
                            className="rounded border border-white/20 bg-white/5 px-2.5 py-1 text-[10px] text-white/80 hover:bg-white/10"
                          >
                            Cobrar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alertas Ativos & Rentabilidade Card */}
        <div className="bg-[#0A0A0A] rounded-2xl border border-white/5 flex flex-col">
          <div className="p-5 border-b border-white/5">
            <h3 className="text-sm font-semibold tracking-widest uppercase text-white">
              Alertas Ativos
            </h3>
          </div>
          <div className="p-4 space-y-3 flex-grow">
            <div className="p-3 bg-red-500/10 border-l-2 border-red-500 rounded-r">
              <p className="text-xs font-semibold text-white">Parcelas em Atraso</p>
              <p className="text-[10px] text-white/70 mt-1">
                {indicadores.parcelasVencidasCount} parcelas necessitam de cobrança urgente. Total: {formatBRL(indicadores.parcelasVencidasValor)}.
              </p>
            </div>

            <div className="p-3 bg-[#D4AF37]/10 border-l-2 border-[#D4AF37] rounded-r">
              <p className="text-xs font-semibold text-white">Rentabilidade de Juros</p>
              <p className="text-[10px] text-white/70 mt-1">
                Total acumulado em lucro de juros: <span className="text-[#D4AF37] font-bold">{formatBRL(indicadores.jurosRecebidos)}</span>.
              </p>
            </div>

            <div className="p-3 bg-white/5 border-l-2 border-white/20 rounded-r">
              <p className="text-xs font-semibold text-white">Backup & Segurança</p>
              <p className="text-[10px] text-white/70 mt-1">
                Sistema de encriptação biométrico e backup em nuvem sincronizados.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2 pt-2">
              <button
                onClick={() => setActiveModule('Relatórios')}
                className="w-full py-2 bg-white text-black text-[10px] font-bold uppercase tracking-wider rounded hover:bg-white/90 transition-all cursor-pointer"
              >
                Gerar Relatório PDF
              </button>
              <button
                onClick={() => setActiveModule('Cobranças')}
                className="w-full py-2 border border-white/20 text-white text-[10px] font-bold uppercase tracking-wider rounded hover:bg-white/5 transition-all cursor-pointer"
              >
                Ver Todas Cobranças
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
