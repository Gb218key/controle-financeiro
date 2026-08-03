import React, { useRef, useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  PieChart
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const RelatoriosView: React.FC = () => {
  const { clientes, emprestimos, pagamentos, indicadores, configuracoes } = useApp();
  const [periodoFilter, setPeriodoFilter] = useState<'MES' | 'ANO' | 'TODOS'>('TODOS');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  const formatBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // PDF Export logic
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExportingPDF(true);

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#09090b',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`relatorio_ggg_financeira_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-400" />
            Relatórios Financeiros Automatizados
          </h2>
          <p className="text-xs text-zinc-400">
            Exportação em PDF contendo Clientes, Empréstimos, Recebimentos, Lucros e Inadimplência.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 px-5 py-2.5 text-xs font-black text-zinc-950 shadow-lg shadow-amber-500/10 hover:brightness-110 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{isExportingPDF ? 'Gerando PDF...' : 'Baixar Relatório PDF'}</span>
          </button>
        </div>
      </div>

      {/* Printable / Canvas Report Section */}
      <div
        ref={reportRef}
        className="rounded-2xl border border-amber-500/30 bg-zinc-950 p-6 sm:p-8 space-y-8 shadow-2xl text-zinc-100"
      >
        {/* Report Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-500/30 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 p-0.5">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-zinc-950 font-black text-amber-400 text-lg">
                G.G.G
              </div>
            </div>

            <div>
              <h1 className="text-xl font-black text-amber-300">{configuracoes.nomeEmpresa}</h1>
              <span className="text-xs text-zinc-400 font-mono">
                CNPJ: {configuracoes.cnpj} • Relatório Gerencial
              </span>
            </div>
          </div>

          <div className="text-right text-xs text-zinc-400">
            <div>Data do Relatório: <strong>{new Date().toLocaleDateString('pt-BR')}</strong></div>
            <div className="text-[10px] text-zinc-500">Sistema Criptografado GGG</div>
          </div>
        </div>

        {/* Section 1: Resumo dos Indicadores */}
        <div>
          <h3 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider mb-4 border-l-2 border-amber-400 pl-3">
            1. Resumo Executivo & Lucratividade
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Total Emprestado</span>
              <span className="text-lg font-black text-zinc-100 mt-1 block">
                {formatBRL(indicadores.totalEmprestado)}
              </span>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Total Recebido</span>
              <span className="text-lg font-black text-blue-400 mt-1 block">
                {formatBRL(indicadores.totalRecebido)}
              </span>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <span className="text-[10px] text-amber-400 font-bold uppercase block">Lucro em Juros</span>
              <span className="text-lg font-black text-amber-300 mt-1 block">
                {formatBRL(indicadores.jurosRecebidos)}
              </span>
            </div>

            <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4">
              <span className="text-[10px] text-red-300 font-bold uppercase block">Inadimplência</span>
              <span className="text-lg font-black text-red-400 mt-1 block">
                {formatBRL(indicadores.parcelasVencidasValor)}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Clientes e Inadimplentes */}
        <div>
          <h3 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider mb-3 border-l-2 border-amber-400 pl-3">
            2. Módulo de Clientes & Inadimplência
          </h3>

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900 text-zinc-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">CPF</th>
                  <th className="py-2.5 px-3">Telefone</th>
                  <th className="py-2.5 px-3">Cidade/UF</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 px-3 font-bold text-zinc-200">{c.nome}</td>
                    <td className="py-2 px-3 text-zinc-400">{c.cpf}</td>
                    <td className="py-2 px-3 text-zinc-400">{c.telefone}</td>
                    <td className="py-2 px-3 text-zinc-400">{c.cidade}/{c.estado}</td>
                    <td className="py-2 px-3 font-bold text-amber-400">{c.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Historico de Emprestimos Concedidos */}
        <div>
          <h3 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider mb-3 border-l-2 border-amber-400 pl-3">
            3. Carteira de Empréstimos
          </h3>

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900 text-zinc-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">ID / Mutuário</th>
                  <th className="py-2.5 px-3">Valor Emprestado</th>
                  <th className="py-2.5 px-3">Juros</th>
                  <th className="py-2.5 px-3">Valor Total</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {emprestimos.map((e) => {
                  const cli = clientes.find((c) => c.id === e.clienteID);
                  return (
                    <tr key={e.id}>
                      <td className="py-2 px-3 font-bold text-zinc-200">{cli?.nome || 'N/A'}</td>
                      <td className="py-2 px-3 font-extrabold text-amber-300">
                        {formatBRL(e.valorEmprestado)}
                      </td>
                      <td className="py-2 px-3 text-yellow-400">{e.juros}% ({e.tipoJuros})</td>
                      <td className="py-2 px-3 font-extrabold text-zinc-100">
                        {formatBRL(e.valorTotal)}
                      </td>
                      <td className="py-2 px-3 font-bold text-emerald-400">{e.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Recebimentos */}
        <div>
          <h3 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider mb-3 border-l-2 border-amber-400 pl-3">
            4. Histórico de Recebimentos
          </h3>

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900 text-zinc-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Data/Hora</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Valor Pago</th>
                  <th className="py-2.5 px-3">Forma de Pagamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {pagamentos.map((p) => {
                  const cli = clientes.find((c) => c.id === p.clienteID);
                  return (
                    <tr key={p.id}>
                      <td className="py-2 px-3 text-zinc-400">{p.data}</td>
                      <td className="py-2 px-3 font-bold text-zinc-200">{cli?.nome || 'N/A'}</td>
                      <td className="py-2 px-3 font-extrabold text-emerald-400">
                        {formatBRL(p.valorPago)}
                      </td>
                      <td className="py-2 px-3 text-zinc-300">{p.formaPagamento}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer legal signature */}
        <div className="pt-6 border-t border-zinc-800 flex justify-between items-center text-[10px] text-zinc-500">
          <span>Relatório emitido via GGG Financeira • Todos os direitos reservados</span>
          <span>Assinatura do Responsável: ___________________________</span>
        </div>
      </div>
    </div>
  );
};
