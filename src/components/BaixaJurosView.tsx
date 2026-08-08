import React, { useState } from 'react';
import {
  Percent,
  Search,
  Filter,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  MessageCircle,
  Printer,
  Copy,
  RefreshCw,
  AlertCircle,
  FileText,
  User,
  ArrowRight,
  ShieldCheck,
  X,
  History,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Emprestimo, Cliente, Pagamento, Parcela } from '../types';

export const BaixaJurosView: React.FC = () => {
  const {
    emprestimos,
    clientes,
    pagamentos,
    configuracoes,
    registrarBaixaJuros,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'LISTA' | 'HISTORICO'>('LISTA');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriodicidade, setFilterPeriodicidade] = useState<string>('TODOS');
  
  // Selection for Modal
  const [selectedEmprestimo, setSelectedEmprestimo] = useState<Emprestimo | null>(null);
  const [selectedParcelaNum, setSelectedParcelaNum] = useState<number>(1);
  const [valorJurosInput, setValorJurosInput] = useState<number>(0);
  const [formaPagamento, setFormaPagamento] = useState<Pagamento['formaPagamento']>('PIX');
  const [prorrogar, setProrrogar] = useState<boolean>(true);
  const [dataBaixaInput, setDataBaixaInput] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [observacoesInput, setObservacoesInput] = useState<string>('');

  // Success / Receipt Modal
  const [comprovanteData, setComprovanteData] = useState<{
    clienteNome: string;
    clienteWhatsapp: string;
    emprestimoId: string;
    valorJuros: number;
    valorCapital: number;
    formaPagamento: string;
    dataBaixa: string;
    novoVencimento?: string;
    prorrogado: boolean;
  } | null>(null);

  const [copySuccess, setCopySuccess] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Filter Active Loans
  const activeLoans = emprestimos.filter(
    (e) => e.status !== 'Quitado' && e.status !== 'Cancelado'
  );

  const filteredLoans = activeLoans.filter((emp) => {
    const cli = clientes.find((c) => c.id === emp.clienteID);
    const textToSearch = `${cli?.nome || ''} ${cli?.cpf || ''} ${emp.id}`.toLowerCase();
    const matchesSearch = textToSearch.includes(searchTerm.toLowerCase());
    const matchesPeriod =
      filterPeriodicidade === 'TODOS' || emp.periodicidade === filterPeriodicidade;
    return matchesSearch && matchesPeriod;
  });

  // Filter Interest Payments History
  const baixasJurosHistory = pagamentos.filter((p) => {
    const isJurosNote = p.comprovanteNota && p.comprovanteNota.toLowerCase().includes('juros');
    const isJurosType = p.tipoPagamento === 'Apenas Juros';
    return isJurosType || isJurosNote;
  });

  // Metric Computations
  const totalEstimadoJurosAtivos = activeLoans.reduce((acc, emp) => {
    // calculate estimated interest value per cycle
    const jurosCiclo = (emp.valorEmprestado * emp.juros) / 100;
    return acc + jurosCiclo;
  }, 0);

  const totalJurosRecebidosGeral = pagamentos
    .filter((p) => p.tipoPagamento === 'Apenas Juros' || (p.comprovanteNota && p.comprovanteNota.toLowerCase().includes('juros')))
    .reduce((acc, p) => acc + p.valorPago, 0);

  const openModalBaixa = (emp: Emprestimo) => {
    const nextParcela = emp.parcelas.find((p) => p.status !== 'Pago') || emp.parcelas[0];
    const num = nextParcela ? nextParcela.numero : 1;

    // Calculate interest amount
    let calcJuros = 0;
    if (nextParcela && nextParcela.juros > 0) {
      calcJuros = nextParcela.juros;
    } else {
      calcJuros = (emp.valorEmprestado * emp.juros) / 100;
    }

    setSelectedEmprestimo(emp);
    setSelectedParcelaNum(num);
    setValorJurosInput(Math.round(calcJuros * 100) / 100);
    setFormaPagamento('PIX');
    setProrrogar(true);
    setDataBaixaInput(new Date().toISOString().split('T')[0]);
    setObservacoesInput('');
  };

  const handleConfirmarBaixa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmprestimo || valorJurosInput <= 0) return;

    const cli = clientes.find((c) => c.id === selectedEmprestimo.clienteID);
    const currentParcela = selectedEmprestimo.parcelas.find(
      (p) => p.numero === selectedParcelaNum
    );

    // Calculate next due date if prorrogar is true
    let novoVenc = currentParcela?.vencimento || selectedEmprestimo.vencimento;
    if (prorrogar && novoVenc) {
      const parts = novoVenc.split('-').map((n) => parseInt(n, 10));
      const y = !isNaN(parts[0]) && parts[0] > 1900 ? parts[0] : new Date().getFullYear();
      const m = !isNaN(parts[1]) && parts[1] >= 1 && parts[1] <= 12 ? parts[1] : new Date().getMonth() + 1;
      const d = !isNaN(parts[2]) && parts[2] >= 1 && parts[2] <= 31 ? parts[2] : new Date().getDate();

      let dt: Date;
      if (selectedEmprestimo.periodicidade === 'Diário') {
        dt = new Date(y, m - 1, d + 1);
      } else if (selectedEmprestimo.periodicidade === 'Semanal') {
        dt = new Date(y, m - 1, d + 7);
      } else if (selectedEmprestimo.periodicidade === 'Quinzenal') {
        dt = new Date(y, m - 1, d + 15);
      } else {
        dt = new Date(y, m, Math.min(d, new Date(y, m + 1, 0).getDate()));
      }

      if (!isNaN(dt.getTime())) {
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        novoVenc = `${yyyy}-${mm}-${dd}`;
      }
    }

    registrarBaixaJuros({
      emprestimoID: selectedEmprestimo.id,
      parcelaNumero: selectedParcelaNum,
      valorJurosPago: valorJurosInput,
      formaPagamento,
      prorrogarVencimento: prorrogar,
      dataBaixa: dataBaixaInput,
      observacoes: observacoesInput,
    });

    // Open Comprovante Modal
    setComprovanteData({
      clienteNome: cli?.nome || 'Cliente',
      clienteWhatsapp: cli?.whatsapp || cli?.telefone || '',
      emprestimoId: selectedEmprestimo.id,
      valorJuros: valorJurosInput,
      valorCapital: selectedEmprestimo.valorEmprestado,
      formaPagamento,
      dataBaixa: dataBaixaInput,
      novoVencimento: prorrogar ? novoVenc : undefined,
      prorrogado: prorrogar,
    });

    setSelectedEmprestimo(null);
    setFeedbackMessage('Baixa de juros realizada com sucesso!');
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const generateWhatsAppMessage = () => {
    if (!comprovanteData) return '';

    const formatCurr = (val: number) =>
      val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const formatDataBr = (dateStr: string) => {
      if (!dateStr) return '';
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    };

    return `*COMPROVANTE DE QUITAÇÃO DE JUROS*
🏢 *${configuracoes.nomeEmpresa}*

👤 *Cliente:* ${comprovanteData.clienteNome}
🆔 *Contrato:* #${comprovanteData.emprestimoId.replace('emp-', '')}
💰 *Juros Quitados:* ${formatCurr(comprovanteData.valorJuros)}
💳 *Forma de Pagamento:* ${comprovanteData.formaPagamento}
📅 *Data da Baixa:* ${formatDataBr(comprovanteData.dataBaixa)}
${
  comprovanteData.prorrogado && comprovanteData.novoVencimento
    ? `📆 *Novo Vencimento do Capital:* ${formatDataBr(comprovanteData.novoVencimento)}`
    : ''
}
💵 *Capital Principal:* ${formatCurr(comprovanteData.valorCapital)}

_Agradecemos a preferência!_`;
  };

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-zinc-900 via-black to-zinc-900 p-6 rounded-2xl border border-[#D4AF37]/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">
                Baixa Exclusiva de Juros
              </h1>
              <p className="text-xs text-zinc-400">
                Receba apenas o rendimento mensal/periódico mantendo o capital principal renovado
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('LISTA')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'LISTA'
                ? 'bg-[#D4AF37] text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Percent className="h-3.5 w-3.5" />
            <span>Contratos Ativos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HISTORICO')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'HISTORICO'
                ? 'bg-[#D4AF37] text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Histórico de Baixas</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Alert */}
      {feedbackMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 space-y-1">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
            Juros Estimados por Ciclo (Ativos)
          </span>
          <div className="text-2xl font-black text-[#D4AF37]">
            {formatBRL(totalEstimadoJurosAtivos)}
          </div>
          <p className="text-[10px] text-zinc-500">Soma dos juros periódicos de contratos ativos</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 space-y-1">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
            Total Recebido em Juros
          </span>
          <div className="text-2xl font-black text-emerald-400">
            {formatBRL(totalJurosRecebidosGeral)}
          </div>
          <p className="text-[10px] text-zinc-500">Histórico total acumulado de baixas de juros</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 space-y-1">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
            Contratos em Aberto
          </span>
          <div className="text-2xl font-black text-white">
            {activeLoans.length} <span className="text-xs font-normal text-zinc-400">empréstimos</span>
          </div>
          <p className="text-[10px] text-zinc-500">Elegíveis para renovação/baixa de juros</p>
        </div>
      </div>

      {/* TAB 1: LISTA DE CONTRATOS ATIVOS */}
      {activeTab === 'LISTA' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/80 p-3 rounded-xl border border-white/10">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar por cliente, CPF ou nº..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg bg-zinc-950 pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 border border-white/10 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs text-zinc-400 font-medium whitespace-nowrap flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Periodicidade:
              </span>
              {['TODOS', 'Diário', 'Semanal', 'Quinzenal', 'Mensal'].map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setFilterPeriodicidade(period)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    filterPeriodicidade === period
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                      : 'bg-zinc-950 text-zinc-400 border border-white/5 hover:text-white'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          {filteredLoans.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-white/5 space-y-3">
              <AlertCircle className="mx-auto h-10 w-10 text-zinc-600" />
              <h3 className="text-sm font-semibold text-zinc-300">
                Nenhum contrato ativo encontrado
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {searchTerm || filterPeriodicidade !== 'TODOS'
                  ? 'Tente ajustar seus filtros de busca acima.'
                  : 'Cadastre novos empréstimos para realizar baixas exclusivas de juros.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLoans.map((emp) => {
                const cli = clientes.find((c) => c.id === emp.clienteID);
                const nextParcela =
                  emp.parcelas.find((p) => p.status !== 'Pago') || emp.parcelas[0];

                // Calculate interest
                const valJurosCalc = nextParcela?.juros > 0
                  ? nextParcela.juros
                  : (emp.valorEmprestado * emp.juros) / 100;

                return (
                  <div
                    key={emp.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-5 space-y-4 hover:border-[#D4AF37]/50 transition-all shadow-lg"
                  >
                    {/* Top Info */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-zinc-500 block uppercase">
                            Contrato #{emp.id.replace('emp-', '')}
                          </span>
                          <h3 className="text-base font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                            {cli?.nome || 'Cliente Desconhecido'}
                          </h3>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                          {emp.periodicidade || 'Mensal'}
                        </span>
                      </div>

                      {/* Main Financial Numbers */}
                      <div className="p-3 rounded-xl bg-zinc-950 border border-white/5 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Capital Emprestado:</span>
                          <span className="font-bold text-white">{formatBRL(emp.valorEmprestado)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Taxa de Juros:</span>
                          <span className="font-bold text-amber-400">{emp.juros}% ({emp.tipoJuros})</span>
                        </div>
                        <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                          <span className="text-xs font-bold text-zinc-300">Valor do Juro (Ciclo):</span>
                          <span className="text-base font-black text-[#D4AF37]">
                            {formatBRL(valJurosCalc)}
                          </span>
                        </div>
                      </div>

                      {/* Next Installment Vencimento */}
                      {nextParcela && (
                        <div className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-900/80 p-2.5 rounded-lg border border-white/5">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-[#D4AF37]" />
                            Vencimento Atual:
                          </span>
                          <span
                            className={`font-mono font-bold ${
                              nextParcela.status === 'Atrasado'
                                ? 'text-red-400'
                                : nextParcela.status === 'Vence hoje'
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {nextParcela.vencimento} ({nextParcela.status})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={() => openModalBaixa(emp)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#D4AF37] px-4 py-3 text-xs font-black text-black shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                    >
                      <Percent className="h-4 w-4" />
                      <span>DAR BAIXA NO JURO ({formatBRL(valJurosCalc)})</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HISTÓRICO DE BAIXAS REALIZADAS */}
      {activeTab === 'HISTORICO' && (
        <div className="bg-zinc-900/80 rounded-2xl border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <History className="h-4 w-4 text-[#D4AF37]" />
              Histórico de Baixas de Juros
            </h2>
            <span className="text-xs text-zinc-400 font-mono">
              Total de registros: {baixasJurosHistory.length}
            </span>
          </div>

          {baixasJurosHistory.length === 0 ? (
            <div className="p-10 text-center text-zinc-500 text-xs">
              Nenhuma baixa exclusiva de juros registrada até o momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Data/Hora</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Valor Juro</th>
                    <th className="p-3">Forma Pagto</th>
                    <th className="p-3">Observação / Nota</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {baixasJurosHistory.map((p) => {
                    const cli = clientes.find((c) => c.id === p.clienteID);
                    const emp = emprestimos.find((e) => e.id === p.emprestimoID);

                    return (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 text-zinc-300 font-mono">{p.data}</td>
                        <td className="p-3 font-semibold text-white">
                          {cli?.nome || 'Cliente'}
                        </td>
                        <td className="p-3 font-bold text-[#D4AF37]">
                          {formatBRL(p.valorPago)}
                        </td>
                        <td className="p-3 text-zinc-300">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 border border-white/10 font-mono text-[10px]">
                            {p.formaPagamento}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-400 max-w-xs truncate">
                          {p.comprovanteNota || 'Baixa de Juros'}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setComprovanteData({
                                clienteNome: cli?.nome || 'Cliente',
                                clienteWhatsapp: cli?.whatsapp || cli?.telefone || '',
                                emprestimoId: p.emprestimoID,
                                valorJuros: p.valorPago,
                                valorCapital: emp?.valorEmprestado || 0,
                                formaPagamento: p.formaPagamento,
                                dataBaixa: p.data.split(' ')[0],
                                prorrogado: (p.comprovanteNota || '').includes('Prorrogação'),
                              });
                            }}
                            className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 text-[11px] font-semibold transition-all cursor-pointer"
                          >
                            Recibo
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: FORMULÁRIO DE BAIXA DE JUROS */}
      {selectedEmprestimo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#D4AF37]/40 bg-zinc-950 p-6 shadow-2xl space-y-5 animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                  <Percent className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Dar Baixa Exclusiva de Juros
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Contrato #{selectedEmprestimo.id.replace('emp-', '')} •{' '}
                    {clientes.find((c) => c.id === selectedEmprestimo.clienteID)?.nome}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmprestimo(null)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmarBaixa} className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-900 border border-white/5 text-xs">
                <div>
                  <span className="text-zinc-500 block">Capital Principal</span>
                  <span className="font-bold text-white text-sm">
                    {formatBRL(selectedEmprestimo.valorEmprestado)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Taxa Contratada</span>
                  <span className="font-bold text-amber-400 text-sm">
                    {selectedEmprestimo.juros}% ({selectedEmprestimo.periodicidade || 'Mensal'})
                  </span>
                </div>
              </div>

              {/* Parcela Selection if multiple */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1 block">
                  Parcela / Ciclo de Referência
                </label>
                <select
                  value={selectedParcelaNum}
                  onChange={(e) => {
                    const num = parseInt(e.target.value, 10);
                    setSelectedParcelaNum(num);
                    const par = selectedEmprestimo.parcelas.find((p) => p.numero === num);
                    if (par) {
                      const calc = par.juros > 0 ? par.juros : (selectedEmprestimo.valorEmprestado * selectedEmprestimo.juros) / 100;
                      setValorJurosInput(Math.round(calc * 100) / 100);
                    }
                  }}
                  className="w-full rounded-xl bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                >
                  {selectedEmprestimo.parcelas.map((p) => (
                    <option key={p.numero} value={p.numero}>
                      Parcela #{p.numero} - Vencimento {p.vencimento} ({p.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Valor do Juro Input */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1 block">
                  Valor dos Juros a Baixar (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={valorJurosInput}
                    onChange={(e) => setValorJurosInput(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl bg-zinc-900 pl-9 pr-4 py-2 text-base font-bold text-[#D4AF37] border border-white/10 focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              {/* Prorrogação Checkbox */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prorrogar}
                    onChange={(e) => setProrrogar(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#D4AF37]"
                  />
                  <span className="text-xs font-bold text-amber-300">
                    Renovar e Prorrogar Vencimento para o próximo ciclo (+1 {selectedEmprestimo.periodicidade || 'período'})
                  </span>
                </label>
                <p className="text-[11px] text-zinc-400 pl-6 leading-relaxed">
                  Ao manter marcado, o cliente quita os juros do período atual e o prazo de pagamento do capital principal é renovado automaticamente.
                </p>
              </div>

              {/* Forma de Pagamento & Data */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-1 block">
                    Forma de Pagamento
                  </label>
                  <select
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value as any)}
                    className="w-full rounded-xl bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Transferência">Transferência</option>
                    <option value="Cartão">Cartão</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-1 block">
                    Data da Baixa
                  </label>
                  <input
                    type="date"
                    required
                    value={dataBaixaInput}
                    onChange={(e) => setDataBaixaInput(e.target.value)}
                    className="w-full rounded-xl bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1 block">
                  Observações Internas (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Juros pagos via PIX em mãos"
                  value={observacoesInput}
                  onChange={(e) => setObservacoesInput(e.target.value)}
                  className="w-full rounded-xl bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedEmprestimo(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-zinc-300 hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#D4AF37] text-xs font-black text-black shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  EFETIVAR BAIXA DE JUROS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COMPROVANTE / RECIBO DE QUITAÇÃO DE JUROS */}
      {comprovanteData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-[#D4AF37] bg-zinc-950 p-6 shadow-2xl space-y-5 animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <ShieldCheck className="h-6 w-6" />
                <h3 className="text-base font-bold text-white">Recibo de Quitação de Juros</h3>
              </div>
              <button
                type="button"
                onClick={() => setComprovanteData(null)}
                className="rounded-lg p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Styled Printable Receipt Box */}
            <div className="p-5 rounded-xl bg-zinc-900 border border-[#D4AF37]/30 text-xs space-y-3 font-sans">
              <div className="text-center border-b border-white/10 pb-3 space-y-1">
                <h4 className="font-serif font-bold text-base text-[#D4AF37]">
                  {configuracoes.nomeEmpresa}
                </h4>
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest block">
                  Comprovante Oficial de Renovação / Baixa de Juros
                </span>
              </div>

              <div className="space-y-2 text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Cliente:</span>
                  <span className="font-bold text-white">{comprovanteData.clienteNome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Contrato:</span>
                  <span className="font-mono text-white">#{comprovanteData.emprestimoId.replace('emp-', '')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Valor Juros Quitados:</span>
                  <span className="font-black text-[#D4AF37] text-sm">
                    {formatBRL(comprovanteData.valorJuros)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Forma Pagamento:</span>
                  <span className="font-semibold text-white">{comprovanteData.formaPagamento}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Data da Operação:</span>
                  <span className="font-mono text-zinc-200">{comprovanteData.dataBaixa}</span>
                </div>

                {comprovanteData.prorrogado && comprovanteData.novoVencimento && (
                  <div className="flex justify-between p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    <span>Novo Vencimento Capital:</span>
                    <span className="font-mono font-bold">{comprovanteData.novoVencimento}</span>
                  </div>
                )}

                <div className="flex justify-between pt-2 border-t border-white/5">
                  <span className="text-zinc-500">Capital Principal Ativo:</span>
                  <span className="font-bold text-white">{formatBRL(comprovanteData.valorCapital)}</span>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-center text-zinc-500 italic">
                Documento gerado eletronicamente em {new Date().toLocaleDateString('pt-BR')}.
              </div>
            </div>

            {/* Buttons Row */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 text-xs transition-all cursor-pointer shadow-md"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{copySuccess ? 'Copiado para WhatsApp!' : 'Copiar Texto para WhatsApp'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-900 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimir</span>
                </button>

                <button
                  type="button"
                  onClick={() => setComprovanteData(null)}
                  className="flex-1 rounded-xl bg-zinc-800 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition-all cursor-pointer text-center"
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
