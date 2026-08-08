import React, { useState } from 'react';
import {
  AlertCircle,
  MessageCircle,
  Send,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Phone,
  Search,
  Filter,
  DollarSign,
  ShieldAlert,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CobrancasView: React.FC = () => {
  const { clientes, emprestimos, configuracoes, registrarPagamento, deleteEmprestimo } = useApp();
  const [copiedPix, setCopiedPix] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'TODOS' | 'ATRASADO' | 'VENCE_HOJE' | 'EM_DIA'>('TODOS');
  const [search, setSearch] = useState('');

  // Payment modal state
  const [paymentTarget, setPaymentTarget] = useState<{
    emprestimoID: string;
    parcelaNumero: number;
    clienteNome: string;
    valorParcela: number;
  } | null>(null);
  const [valorPago, setValorPago] = useState<number>(0);
  const [formaPagamento, setFormaPagamento] = useState<'PIX' | 'Dinheiro' | 'Transferência' | 'Cartão' | 'Outro'>('PIX');

  // Build automatic list of pending installments
  const cobrancasLista: {
    id: string;
    clienteID: string;
    clienteNome: string;
    clienteCpf: string;
    clientePhone: string;
    clienteWhatsapp: string;
    emprestimoID: string;
    parcelaNumero: number;
    vencimento: string;
    valorParcela: number;
    valorPagoTotal: number;
    saldoDevedorParcela: number;
    status: 'Em dia' | 'Vence hoje' | 'Atrasado';
    diasAtraso: number;
  }[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  emprestimos.forEach((emp) => {
    if (emp.status !== 'Quitado' && emp.status !== 'Cancelado') {
      const cli = clientes.find((c) => c.id === emp.clienteID);
      (emp.parcelas || []).forEach((par) => {
        if (par.status !== 'Pago') {
          const saldo = (par.valorParcela || 0) - (par.valorPagoTotal || 0);

          const vencStr = par.vencimento || '';
          const vencDate = vencStr ? new Date(vencStr.includes('T') ? vencStr : vencStr + 'T00:00:00') : new Date();
          const validTime = !isNaN(vencDate.getTime()) ? vencDate.getTime() : today.getTime();
          const diffTime = today.getTime() - validTime;
          const calcDays = Math.floor(diffTime / (1000 * 3600 * 24));
          const diasAtraso = isNaN(calcDays) ? 0 : calcDays;

          let statusCategoria: 'Em dia' | 'Vence hoje' | 'Atrasado' = 'Em dia';

          if (diasAtraso > 0) {
            statusCategoria = 'Atrasado';
          } else if (diasAtraso === 0 || par.status === 'Vence hoje') {
            statusCategoria = 'Vence hoje';
          }

          cobrancasLista.push({
            id: `${emp.id}-${par.numero}`,
            clienteID: emp.clienteID,
            clienteNome: cli?.nome || 'Cliente Desconhecido',
            clienteCpf: cli?.cpf || '',
            clientePhone: cli?.telefone || '',
            clienteWhatsapp: cli?.whatsapp || cli?.telefone || '',
            emprestimoID: emp.id,
            parcelaNumero: par.numero,
            vencimento: vencStr,
            valorParcela: par.valorParcela || 0,
            valorPagoTotal: par.valorPagoTotal || 0,
            saldoDevedorParcela: Math.round(saldo * 100) / 100,
            status: statusCategoria,
            diasAtraso: Math.max(0, diasAtraso),
          });
        }
      });
    }
  });

  // Sort by priority: Atrasados first, then Vence Hoje, then Em dia
  cobrancasLista.sort((a, b) => {
    const priorityMap = { Atrasado: 1, 'Vence hoje': 2, 'Em dia': 3 };
    const pA = priorityMap[a.status] || 3;
    const pB = priorityMap[b.status] || 3;
    if (pA !== pB) {
      return pA - pB;
    }
    return (a.vencimento || '').localeCompare(b.vencimento || '');
  });

  const handleCopyPix = () => {
    navigator.clipboard.writeText(configuracoes.chavePix);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const filteredCobrancas = cobrancasLista.filter((item) => {
    const matchesSearch =
      item.clienteNome.toLowerCase().includes(search.toLowerCase()) ||
      item.clienteCpf.includes(search);

    let matchesCategory = true;
    if (filterCategory === 'ATRASADO') matchesCategory = item.status === 'Atrasado';
    if (filterCategory === 'VENCE_HOJE') matchesCategory = item.status === 'Vence hoje';
    if (filterCategory === 'EM_DIA') matchesCategory = item.status === 'Em dia';

    return matchesSearch && matchesCategory;
  });

  const formatBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleOpenPayment = (item: (typeof cobrancasLista)[0]) => {
    setPaymentTarget({
      emprestimoID: item.emprestimoID,
      parcelaNumero: item.parcelaNumero,
      clienteNome: item.clienteNome,
      valorParcela: item.saldoDevedorParcela,
    });
    setValorPago(item.saldoDevedorParcela);
    setFormaPagamento('PIX');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTarget || valorPago <= 0) return;

    registrarPagamento({
      emprestimoID: paymentTarget.emprestimoID,
      parcelaNumero: paymentTarget.parcelaNumero,
      valorPago,
      formaPagamento,
    });

    setPaymentTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & PIX Key Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-zinc-900 p-5 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-400" />
            Central Automática de Cobranças
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Notificações e lista inteligente de cobranças em dia, para vencer hoje e atrasadas.
          </p>
        </div>

        {/* PIX Quick Copy Button */}
        <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-amber-500/20 w-full md:w-auto">
          <div className="text-xs">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">
              Chave PIX Recebimentos
            </span>
            <span className="font-mono font-bold text-amber-300">
              {configuracoes.chavePix}
            </span>
          </div>

          <button
            onClick={handleCopyPix}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all"
          >
            {copiedPix ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copiar PIX</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por nome de cliente..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-9 pr-4 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setFilterCategory('TODOS')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
              filterCategory === 'TODOS'
                ? 'bg-amber-500 text-zinc-950'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todos ({cobrancasLista.length})
          </button>

          <button
            onClick={() => setFilterCategory('ATRASADO')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
              filterCategory === 'ATRASADO'
                ? 'bg-red-500 text-white'
                : 'bg-zinc-950 text-red-400 hover:bg-zinc-800'
            }`}
          >
            🔴 Atrasado ({cobrancasLista.filter((i) => i.status === 'Atrasado').length})
          </button>

          <button
            onClick={() => setFilterCategory('VENCE_HOJE')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
              filterCategory === 'VENCE_HOJE'
                ? 'bg-amber-500 text-zinc-950'
                : 'bg-zinc-950 text-amber-400 hover:bg-zinc-800'
            }`}
          >
            🟡 Vence Hoje ({cobrancasLista.filter((i) => i.status === 'Vence hoje').length})
          </button>

          <button
            onClick={() => setFilterCategory('EM_DIA')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
              filterCategory === 'EM_DIA'
                ? 'bg-emerald-500 text-zinc-950'
                : 'bg-zinc-950 text-emerald-400 hover:bg-zinc-800'
            }`}
          >
            🟢 Em dia ({cobrancasLista.filter((i) => i.status === 'Em dia').length})
          </button>
        </div>
      </div>

      {/* List of Charges */}
      <div className="space-y-3">
        {filteredCobrancas.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-12 text-center text-xs text-zinc-500">
            Nenhuma cobrança encontrada na categoria selecionada.
          </div>
        ) : (
          filteredCobrancas.map((item) => {
            const formatPhoneForWA = item.clienteWhatsapp.replace(/\D/g, '');

            let statusCardStyle = 'border-emerald-500/20 bg-zinc-900';
            let badgeComponent = (
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-extrabold text-emerald-400 border border-emerald-500/30">
                🟢 Em dia
              </span>
            );

            if (item.status === 'Vence hoje') {
              statusCardStyle = 'border-amber-500/40 bg-zinc-900 shadow-md shadow-amber-500/5';
              badgeComponent = (
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-extrabold text-amber-400 border border-amber-500/30 animate-pulse">
                  🟡 Vence hoje
                </span>
              );
            } else if (item.status === 'Atrasado') {
              statusCardStyle = 'border-red-500/40 bg-red-950/10 shadow-md shadow-red-500/5';
              badgeComponent = (
                <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-extrabold text-red-400 border border-red-500/40">
                  🔴 Atrasado ({item.diasAtraso} dias)
                </span>
              );
            }

            // Custom Message Template for WhatsApp
            const waText = encodeURIComponent(
              `Olá ${item.clienteNome}, tudo bem?\n\nPassando para lembrar que a Parcela nº ${item.parcelaNumero} no valor de ${formatBRL(item.saldoDevedorParcela)} ${
                item.status === 'Atrasado'
                  ? `venceu no dia ${item.vencimento} (${item.diasAtraso} dias em atraso).`
                  : `vence no dia ${item.vencimento}.`
              }\n\n📍 *Dados para Pagamento via PIX*:\nChave PIX: *${configuracoes.chavePix}*\nFavorecido: ${configuracoes.favorecidoPix}\n\nApós efetuar o pagamento, por favor envie o comprovante por aqui. Obrigado!`
            );

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${statusCardStyle}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-zinc-100">{item.clienteNome}</h3>
                    {badgeComponent}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                    <span>CPF: {item.clienteCpf}</span>
                    <span>• Parcela #{item.parcelaNumero}</span>
                    <span>• Vencimento: <strong className="text-zinc-200">{item.vencimento}</strong></span>
                  </div>
                </div>

                {/* Amount and Actions */}
                <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 border-zinc-800 pt-3 md:pt-0">
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 block uppercase font-semibold">
                      Valor a Receber
                    </span>
                    <span className="text-lg font-black text-amber-300">
                      {formatBRL(item.saldoDevedorParcela)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.clienteWhatsapp && (
                      <a
                        href={`https://wa.me/${formatPhoneForWA}?text=${waText}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all shadow-md"
                      >
                        <MessageCircle className="h-4 w-4 text-emerald-400" />
                        <span>Notificar WhatsApp</span>
                      </a>
                    )}

                    <button
                      onClick={() => handleOpenPayment(item)}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 px-4 py-2 text-xs font-black text-zinc-950 hover:brightness-110 transition-all shadow-md cursor-pointer"
                    >
                      <DollarSign className="h-4 w-4" />
                      <span>Dar Baixa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja excluir o empréstimo #${item.emprestimoID}? O empréstimo será removido e o Painel de Controle será recalculado.`)) {
                          deleteEmprestimo(item.emprestimoID);
                        }
                      }}
                      title="Excluir empréstimo lançado por erro"
                      className="p-2 rounded-xl border border-red-500/30 bg-red-950/40 text-red-300 hover:bg-red-900 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                      <span className="hidden sm:inline">Excluir</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Payment Confirmation Modal */}
      {paymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-3">
              <DollarSign className="h-5 w-5 text-amber-400" />
              Dar Baixa de Cobrança
            </h3>

            <form onSubmit={handleConfirmPayment} className="space-y-3 text-xs">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <span className="text-zinc-500 block">Cliente</span>
                <span className="font-bold text-zinc-200">
                  {paymentTarget.clienteNome} (Parcela #{paymentTarget.parcelaNumero})
                </span>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Valor Recebido (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={valorPago}
                  onChange={(e) => setValorPago(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 font-bold text-base text-amber-300 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Forma de Recebimento
                </label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 focus:border-amber-400 focus:outline-none"
                >
                  <option value="PIX">PIX</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência">Transferência Bancária</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentTarget(null)}
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
    </div>
  );
};
