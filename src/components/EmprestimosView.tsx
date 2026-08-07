import React, { useState } from 'react';
import {
  Calculator,
  Plus,
  DollarSign,
  Calendar,
  Percent,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Filter,
  CreditCard,
  Building,
  Check,
  X,
  Printer,
  ChevronRight,
  Send,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TipoJuros, StatusEmprestimo, Emprestimo, Periodicidade } from '../types';

interface EmprestimosViewProps {
  initialOpenNovo?: boolean;
}

export const EmprestimosView: React.FC<EmprestimosViewProps> = ({ initialOpenNovo }) => {
  const {
    clientes,
    emprestimos,
    addEmprestimo,
    deleteEmprestimo,
    registrarPagamento,
    simularEmprestimo,
    configuracoes,
    setSelectedEmprestimoForContract,
    setActiveModule,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'NOVO' | 'LISTA' | 'PAGAMENTO'>(
    initialOpenNovo ? 'NOVO' : 'LISTA'
  );

  // Form fields for Novo Empréstimo
  const [selectedClienteID, setSelectedClienteID] = useState<string>(
    clientes[0]?.id || ''
  );
  const [valorInput, setValorInput] = useState<string>('400');
  const [taxaInput, setTaxaInput] = useState<string>(
    (configuracoes.taxaJurosPadrao || 10).toString()
  );
  const [tipoJuros, setTipoJuros] = useState<TipoJuros>(
    configuracoes.tipoJurosPadrao || 'Simples'
  );
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>('Diário');
  const [parcelasCount, setParcelasCount] = useState<number>(20);
  const [dataEmprestimo, setDataEmprestimo] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [vencimentoInicial, setVencimentoInicial] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [observacoes, setObservacoes] = useState<string>('');

  const valor = Math.max(0, parseFloat(valorInput.replace(',', '.')) || 0);
  const taxa = Math.max(0, parseFloat(taxaInput.replace(',', '.')) || 0);

  // Auto-sync selected client if list updates
  React.useEffect(() => {
    if ((!selectedClienteID || selectedClienteID === '') && clientes.length > 0) {
      setSelectedClienteID(clientes[0].id);
    }
  }, [clientes, selectedClienteID]);

  // Alert and status banners instead of native window.alert
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Simulation result state
  const [simulacao, setSimulacao] = useState<ReturnType<typeof simularEmprestimo> | null>(() =>
    simularEmprestimo(400, 20, 20, 'Simples', new Date().toISOString().split('T')[0], 'Diário')
  );

  // Auto-calculate simulation on form parameter changes
  React.useEffect(() => {
    if (valor > 0 && taxa >= 0 && parcelasCount > 0) {
      const res = simularEmprestimo(valor, taxa, parcelasCount, tipoJuros, vencimentoInicial, periodicidade);
      setSimulacao(res);
    }
  }, [valor, taxa, parcelasCount, tipoJuros, vencimentoInicial, periodicidade]);

  // Payment Modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<Emprestimo | null>(null);
  const [selectedParcelaNum, setSelectedParcelaNum] = useState<number>(1);
  const [valorPagoInput, setValorPagoInput] = useState<number>(0);
  const [formaPagamento, setFormaPagamento] = useState<'PIX' | 'Dinheiro' | 'Transferência' | 'Cartão' | 'Outro'>('PIX');

  // Delete Confirmation Modal state
  const [loanToDelete, setLoanToDelete] = useState<Emprestimo | null>(null);

  // Filters for Loans List
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');

  const handleCalcular = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!valor || !taxa || !parcelasCount) return;
    const res = simularEmprestimo(valor, taxa, parcelasCount, tipoJuros, vencimentoInicial, periodicidade);
    setSimulacao(res);
  };

  const handleSalvarEmprestimo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const targetCliente = clientes.find((c) => c.id === selectedClienteID) || clientes[0];

      if (!targetCliente) {
        setErrorMsg('Por favor, cadastre ou selecione um cliente antes de cadastrar o empréstimo.');
        return;
      }

      if (!valor || valor <= 0) {
        setErrorMsg('Informe um valor de empréstimo válido.');
        return;
      }

      const currentSim =
        simulacao ||
        simularEmprestimo(
          valor,
          taxa,
          parcelasCount,
          tipoJuros,
          vencimentoInicial,
          periodicidade
        );

      const empId = addEmprestimo({
        clienteID: targetCliente.id,
        valorEmprestado: valor,
        juros: taxa,
        tipoJuros,
        periodicidade,
        parcelasCount,
        dataEmprestimo: dataEmprestimo || new Date().toISOString().split('T')[0],
        vencimento: vencimentoInicial || new Date().toISOString().split('T')[0],
        observacoes,
      });

      const newLoanObj: Emprestimo = {
        id: empId,
        clienteID: targetCliente.id,
        valorEmprestado: valor,
        juros: taxa,
        tipoJuros,
        periodicidade,
        valorTotal: currentSim.valorTotal,
        parcelasCount,
        valorParcela: currentSim.valorParcela,
        dataEmprestimo: dataEmprestimo || new Date().toISOString().split('T')[0],
        vencimento: vencimentoInicial || new Date().toISOString().split('T')[0],
        status: 'Ativo',
        observacoes,
        parcelas: currentSim.tabelaParcelas.map((p, idx) => ({
          ...p,
          id: `par-${empId}-${idx + 1}`,
        })),
        createdAt: new Date().toISOString().split('T')[0],
      };
      if (typeof setSelectedEmprestimoForContract === 'function') {
        setSelectedEmprestimoForContract(newLoanObj);
      }

      setSuccessMsg(
        `Empréstimo ${periodicidade} (R$ ${valor.toLocaleString('pt-BR')}) para ${targetCliente.nome} cadastrado com sucesso!`
      );

      setTimeout(() => {
        setSuccessMsg(null);
        setActiveTab('LISTA');
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao cadastrar empréstimo:', err);
      setErrorMsg(`Erro ao efetivar empréstimo: ${err?.message || 'Tente novamente.'}`);
    }
  };

  const openPagamentoModal = (emp: Emprestimo, parcelaNum: number) => {
    const par = emp.parcelas.find((p) => p.numero === parcelaNum);
    setSelectedLoanForPayment(emp);
    setSelectedParcelaNum(parcelaNum);
    setValorPagoInput(par ? par.valorParcela - par.valorPagoTotal : emp.valorParcela);
    setFormaPagamento('PIX');
    setIsPaymentModalOpen(true);
  };

  const handleConfirmarPagamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForPayment || valorPagoInput <= 0) return;

    registrarPagamento({
      emprestimoID: selectedLoanForPayment.id,
      parcelaNumero: selectedParcelaNum,
      valorPago: valorPagoInput,
      formaPagamento,
    });

    setIsPaymentModalOpen(false);
    setSelectedLoanForPayment(null);
  };

  const formatBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Loan filtering
  const emprestimosFiltrados = emprestimos.filter((emp) => {
    const cli = clientes.find((c) => c.id === emp.clienteID);
    const matchesSearch =
      cli?.nome.toLowerCase().includes(search.toLowerCase()) ||
      emp.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'TODOS' || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Gestão de Empréstimos</h2>
          <p className="text-xs text-zinc-400">
            Simulação, concessão, parcelas e baixa de pagamentos.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 rounded-xl bg-zinc-900 p-1 border border-zinc-800">
          <button
            onClick={() => setActiveTab('NOVO')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'NOVO'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calculator className="h-3.5 w-3.5" />
            Novo / Calculadora
          </button>

          <button
            onClick={() => setActiveTab('LISTA')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'LISTA'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            Empréstimos & Parcelas
          </button>
        </div>
      </div>

      {/* TAB 1: NOVO EMPRÉSTIMO & CALCULADORA */}
      {activeTab === 'NOVO' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Calculator (Left) */}
          <div className="lg:col-span-5 rounded-2xl border border-amber-500/30 bg-zinc-900 p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Calculator className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-bold text-zinc-100">Calculadora de Empréstimo</h3>
            </div>

            <form onSubmit={handleCalcular} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Cliente Mutuário *
                </label>
                <select
                  value={selectedClienteID}
                  onChange={(e) => setSelectedClienteID(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 focus:border-amber-400 focus:outline-none"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} (CPF: {c.cpf})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Valor Emprestado (R$) *
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valorInput}
                    onChange={(e) => setValorInput(e.target.value)}
                    placeholder="Ex: 400"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Taxa Juros (%) *
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={taxaInput}
                    onChange={(e) => setTaxaInput(e.target.value)}
                    placeholder="Ex: 75.5 ou 75,5"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Frequência de Cobrança *
                </label>
                <select
                  value={periodicidade}
                  onChange={(e) => {
                    const p = e.target.value as Periodicidade;
                    setPeriodicidade(p);
                    if (p === 'Quinzenal' && (parcelasCount === 20 || parcelasCount > 12)) {
                      setParcelasCount(2);
                    } else if (p === 'Diário' && parcelasCount <= 4) {
                      setParcelasCount(20);
                    }
                  }}
                  className="w-full rounded-xl border border-amber-500/40 bg-zinc-950 px-3 py-2 font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                >
                  <option value="Diário">📆 Diário / Diária (Cobrança por Dia)</option>
                  <option value="Semanal">🗓️ Semanal (Cobrança por Semana)</option>
                  <option value="Quinzenal">📆 Quinzenal (A cada 15 dias)</option>
                  <option value="Mensal">📅 Mensal (Cobrança por Mês)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Tipo de Juros
                  </label>
                  <select
                    value={tipoJuros}
                    onChange={(e) => setTipoJuros(e.target.value as TipoJuros)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Simples">Simples (Mercado)</option>
                    <option value="Composto">Composto</option>
                    <option value="Fixo">Fixo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    {periodicidade === 'Diário' ? 'Nº de Dias / Diárias *' : 'Nº de Parcelas *'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={parcelasCount}
                    onChange={(e) => setParcelasCount(Number(e.target.value))}
                    placeholder={periodicidade === 'Diário' ? 'Ex: 20 dias' : 'Ex: 3'}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 font-bold text-zinc-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Data do Empréstimo
                  </label>
                  <input
                    type="date"
                    value={dataEmprestimo}
                    onChange={(e) => setDataEmprestimo(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    {periodicidade === 'Diário' ? 'Início da Cobrança Diária *' : 'Vencimento 1ª Parcela *'}
                  </label>
                  <input
                    type="date"
                    value={vencimentoInicial}
                    onChange={(e) => setVencimentoInicial(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Garantias fornecidas, finalidade do empréstimo..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-200 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Botão Calcular Requested */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-zinc-800 border border-amber-500/30 py-2.5 text-xs font-bold text-amber-300 hover:bg-zinc-700 hover:border-amber-400 transition-all"
                >
                  Calcular Tabela
                </button>
              </div>
            </form>
          </div>

          {/* Simulation Results Table (Right) */}
          <div className="lg:col-span-7 rounded-2xl border border-amber-500/30 bg-zinc-900 p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-amber-400" />
                  Resultado da Simulação {periodicidade === 'Diário' && '(Cobrança Diária)'}
                </h3>
                {simulacao && (
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/20">
                    {simulacao.parcelasCount}x de {formatBRL(simulacao.valorParcela)}{periodicidade === 'Diário' ? '/dia' : ''}
                  </span>
                )}
              </div>

              {simulacao && (
                <>
                  {/* Daily Highlight Banner */}
                  {periodicidade === 'Diário' && (
                    <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-300 font-semibold">
                        <Calendar className="h-4 w-4 text-amber-400 shrink-0" />
                        <span>Plano Diário: Cobrança diária consecutiva de <strong>{formatBRL(simulacao.valorParcela)}</strong> por <strong>{simulacao.parcelasCount} dias</strong></span>
                      </div>
                    </div>
                  )}

                  {/* Summary Cards */}
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs">
                      <span className="text-zinc-500 block">Valor Emprestado</span>
                      <span className="text-sm font-black text-zinc-100">
                        {formatBRL(simulacao.valorEmprestado)}
                      </span>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs">
                      <span className="text-zinc-500 block">Total Juros ({simulacao.jurosPercentual}%)</span>
                      <span className="text-sm font-black text-yellow-400">
                        + {formatBRL(simulacao.valorTotalJuros)}
                      </span>
                    </div>

                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
                      <span className="text-amber-400/90 font-bold block">Valor Total Final</span>
                      <span className="text-sm font-black text-amber-300">
                        {formatBRL(simulacao.valorTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Parcelas Table */}
                  <div className="mt-4 max-h-64 overflow-y-auto rounded-xl border border-zinc-800">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-950 text-zinc-400 font-semibold text-[10px] uppercase">
                          <th className="py-2.5 px-3">{periodicidade === 'Diário' ? 'Dia / Cobrança' : 'Nº Parcela'}</th>
                          <th className="py-2.5 px-3">Data Vencimento</th>
                          <th className="py-2.5 px-3">{periodicidade === 'Diário' ? 'Valor Diário' : 'Valor Parcela'}</th>
                          <th className="py-2.5 px-3">Juros</th>
                          <th className="py-2.5 px-3">Amortização</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {simulacao.tabelaParcelas.map((par) => (
                          <tr key={par.numero} className="hover:bg-zinc-800/40">
                            <td className="py-2 px-3 font-bold text-amber-400">
                              {periodicidade === 'Diário' ? `Dia #${par.numero}` : `#${par.numero}`}
                            </td>
                            <td className="py-2 px-3 text-zinc-300">{par.vencimento}</td>
                            <td className="py-2 px-3 font-extrabold text-zinc-100">
                              {formatBRL(par.valorParcela)}
                            </td>
                            <td className="py-2 px-3 text-yellow-400">{formatBRL(par.juros)}</td>
                            <td className="py-2 px-3 text-zinc-400">{formatBRL(par.amortizacao)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Success & Error Status Banners */}
            {successMsg && (
              <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs font-bold text-emerald-300 flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mt-3 rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs font-bold text-red-300 flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action to Save Loan */}
            <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                Pronto para assinar? O contrato será emitido automaticamente.
              </span>

              <button
                type="button"
                onClick={handleSalvarEmprestimo}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 px-6 py-2.5 text-xs font-black text-zinc-950 shadow-lg shadow-amber-500/20 transition-all hover:brightness-110 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Efetivar & Confirmar Empréstimo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LISTA DE EMPRÉSTIMOS & PARCELAS */}
      {activeTab === 'LISTA' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por cliente ou ID do empréstimo..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-9 pr-4 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              {['TODOS', 'Ativo', 'Atrasado', 'Quitado'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* List of Loans */}
          <div className="space-y-4">
            {emprestimosFiltrados.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-12 text-center text-xs text-zinc-500">
                Nenhum empréstimo encontrado.
              </div>
            ) : (
              emprestimosFiltrados.map((emp) => {
                const cli = clientes.find((c) => c.id === emp.clienteID);

                return (
                  <div
                    key={emp.id}
                    className="rounded-2xl border border-amber-500/20 bg-zinc-900 p-5 shadow-xl space-y-4"
                  >
                    {/* Top Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-100">{cli?.nome}</h4>
                          <span className="text-[10px] text-zinc-400">
                            Contrato #{emp.id} • CPF: {cli?.cpf}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedEmprestimoForContract(emp);
                            setActiveModule('Contratos');
                          }}
                          className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-zinc-800 cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Gerar Contrato
                        </button>

                        <button
                          onClick={() => setLoanToDelete(emp)}
                          title="Remover empréstimo criado por engano"
                          className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-950/40 px-2.5 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-900/60 hover:border-red-500 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          <span>Excluir</span>
                        </button>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold border ${
                            emp.status === 'Quitado'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : emp.status === 'Atrasado'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </div>
                    </div>

                    {/* Financial Metrics Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                      <div>
                        <span className="text-zinc-500 block">Valor Emprestado</span>
                        <span className="font-extrabold text-zinc-100">
                          {formatBRL(emp.valorEmprestado)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Taxa & Tipo</span>
                        <span className="font-bold text-yellow-400">
                          {emp.juros}% ({emp.tipoJuros})
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Total a Receber</span>
                        <span className="font-extrabold text-amber-300">
                          {formatBRL(emp.valorTotal)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Plano / Cobrança</span>
                        <span className="font-bold text-zinc-200">
                          {emp.parcelasCount}x de {formatBRL(emp.valorParcela)}{emp.periodicidade === 'Diário' ? '/dia' : ''}
                          {emp.periodicidade && (
                            <span className="ml-1 text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              {emp.periodicidade}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Installments Badges Grid */}
                    <div>
                      <span className="text-[11px] font-bold text-zinc-400 block mb-2">
                        {emp.periodicidade === 'Diário' ? 'Detalhamento de Diárias (Clique para dar Baixa):' : 'Detalhamento de Parcelas (Clique para dar Baixa):'}
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                        {emp.parcelas.map((par) => {
                          const valorRestante = par.valorParcela - par.valorPagoTotal;

                          return (
                            <div
                              key={par.id}
                              className={`rounded-xl border p-3 flex flex-col justify-between space-y-2 transition-all ${
                                par.status === 'Pago'
                                  ? 'border-emerald-500/30 bg-emerald-950/20'
                                  : par.status === 'Atrasado'
                                  ? 'border-red-500/30 bg-red-950/20'
                                  : 'border-zinc-800 bg-zinc-950'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-amber-400">
                                  {emp.periodicidade === 'Diário' ? `Dia #${par.numero}` : `Parcela #${par.numero}`}
                                </span>
                                <span className="text-[10px] text-zinc-400">
                                  Venc: {par.vencimento}
                                </span>
                              </div>

                              <div className="text-sm font-black text-zinc-100">
                                {formatBRL(par.valorParcela)}
                              </div>

                              {par.valorPagoTotal > 0 && par.status !== 'Pago' && (
                                <div className="text-[10px] text-emerald-400 font-semibold">
                                  Pago parciais: {formatBRL(par.valorPagoTotal)}
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                                <span className="text-[10px] font-bold uppercase">
                                  {par.status}
                                </span>

                                {par.status !== 'Pago' ? (
                                  <button
                                    onClick={() => openPagamentoModal(emp, par.numero)}
                                    className="rounded bg-gradient-to-r from-amber-500 to-yellow-400 px-2.5 py-1 text-[10px] font-extrabold text-zinc-950 hover:brightness-110"
                                  >
                                    Dar Baixa
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                    <Check className="h-3 w-3" /> Quitado
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL DE PAGAMENTO / DAR BAIXA EM PARCELA */}
      {isPaymentModalOpen && selectedLoanForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-400" />
                Registrar Pagamento / Dar Baixa
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmarPagamento} className="space-y-3 text-xs">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <span className="text-zinc-500 block">Empréstimo</span>
                <span className="font-bold text-zinc-200">
                  {clientes.find((c) => c.id === selectedLoanForPayment.clienteID)?.nome} (Parcela #{selectedParcelaNum})
                </span>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Valor a Receber (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={valorPagoInput}
                  onChange={(e) => setValorPagoInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-amber-300 font-bold text-base focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Forma de Pagamento *
                </label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 focus:border-amber-400 focus:outline-none"
                >
                  <option value="PIX">PIX (Chave da Empresa)</option>
                  <option value="Dinheiro">Dinheiro em Espécie</option>
                  <option value="Transferência">Transferência Bancária / TED</option>
                  <option value="Cartão">Cartão de Débito/Crédito</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="rounded-xl border border-zinc-700 px-4 py-2 font-semibold text-zinc-300 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 px-5 py-2 font-black text-zinc-950 hover:brightness-110"
                >
                  Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAÇÃO DE EXCLUSÃO DE EMPRÉSTIMO */}
      {loanToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Excluir Empréstimo Incorreto
              </h3>
              <button
                onClick={() => setLoanToDelete(null)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-zinc-300">
                Esta ação destina-se a remover empréstimos que foram cadastrados por engano.
              </p>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-1.5 text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Contrato:</span>
                  <span className="font-mono font-bold text-amber-400">#{loanToDelete.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Cliente:</span>
                  <span className="font-bold text-white">
                    {clientes.find((c) => c.id === loanToDelete.clienteID)?.nome || 'Cliente'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Valor Principal:</span>
                  <span className="font-bold text-emerald-400">
                    {formatBRL(loanToDelete.valorEmprestado)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Total a Receber:</span>
                  <span className="font-bold text-zinc-100">
                    {formatBRL(loanToDelete.valorTotal)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-[11px] text-amber-200">
                💡 <strong>Ajuste Automático do Painel:</strong> Os indicadores do Painel de Controle (caixa, total emprestado e juros) serão recalculados sem afetação da integridade do sistema.
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setLoanToDelete(null)}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteEmprestimo(loanToDelete.id);
                  setLoanToDelete(null);
                }}
                className="rounded-xl bg-red-600 hover:bg-red-500 px-5 py-2 text-xs font-bold text-white shadow-lg transition-all cursor-pointer"
              >
                Sim, Excluir Empréstimo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
