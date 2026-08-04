import React, { useRef, useState } from 'react';
import {
  FileSignature,
  Printer,
  Download,
  Edit3,
  Check,
  RotateCcw,
  Building2,
  UserCheck,
  Calendar,
  DollarSign,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const ContratosView: React.FC = () => {
  const {
    clientes,
    emprestimos,
    configuracoes,
    perfil,
    selectedEmprestimoForContract,
    setSelectedEmprestimoForContract,
  } = useApp();

  const [selectedLoanID, setSelectedLoanID] = useState<string>(
    selectedEmprestimoForContract?.id || emprestimos[0]?.id || ''
  );

  const [isExporting, setIsExporting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customNotes, setCustomNotes] = useState<string>('');
  const contractRef = useRef<HTMLDivElement>(null);

  const currentLoan = emprestimos.find((e) => e.id === selectedLoanID) || emprestimos[0];
  const currentClient = clientes.find((c) => c.id === currentLoan?.clienteID) || clientes[0];

  const formatBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!contractRef.current) return;
    setIsExporting(true);

    try {
      const element = contractRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
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
      pdf.save(`contrato_emprestimo_${currentClient?.nome.replace(/\s+/g, '_') || 'termo'}.pdf`);
    } catch (err) {
      console.error(err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Loan Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-[#D4AF37]" />
            Contratos e Notas Promissórias
          </h2>
          <p className="text-xs text-white/50">
            Emissão legal de termo de confissão de dívida. Você pode ativar o modo de edição para alterar qualquer cláusula.
          </p>
        </div>

        {/* Contract Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedLoanID}
            onChange={(e) => setSelectedLoanID(e.target.value)}
            className="rounded-xl border border-white/20 bg-[#0A0A0A] px-3.5 py-2 text-xs font-bold text-[#D4AF37] focus:border-[#D4AF37] focus:outline-none"
          >
            {emprestimos.map((e) => {
              const cli = clientes.find((c) => c.id === e.clienteID);
              return (
                <option key={e.id} value={e.id}>
                  Contrato #{e.id} - {cli?.nome} ({formatBRL(e.valorEmprestado)})
                </option>
              );
            })}
          </select>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              isEditing
                ? 'bg-[#D4AF37] text-black shadow-lg ring-2 ring-[#D4AF37]/50'
                : 'border border-white/20 bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            {isEditing ? <Check className="h-4 w-4" /> : <Edit3 className="h-4 w-4 text-[#D4AF37]" />}
            <span>{isEditing ? 'Concluir Edição' : 'Editar Contrato'}</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-black text-black shadow-md hover:brightness-110 disabled:opacity-50 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Baixar PDF</span>
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-3.5 text-xs text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-[#D4AF37]" />
            <span>
              <strong>Modo de Edição Ativo:</strong> Clique diretamente em qualquer texto do documento abaixo para editar livremente seu conteúdo.
            </span>
          </div>
        </div>
      )}

      {/* Printable Paper Contract Layout */}
      {currentLoan && currentClient ? (
        <div
          ref={contractRef}
          contentEditable={isEditing}
          suppressContentEditableWarning={true}
          className={`mx-auto max-w-3xl rounded-2xl border bg-white p-8 sm:p-12 text-zinc-900 shadow-2xl space-y-6 leading-relaxed font-serif transition-all ${
            isEditing
              ? 'border-2 border-dashed border-[#D4AF37] ring-4 ring-[#D4AF37]/20 outline-none'
              : 'border-zinc-300'
          }`}
        >
          {/* Header Paper */}
          <div className="border-b-2 border-zinc-900 pb-4 text-center">
            <h1 className="text-xl font-black tracking-wider text-zinc-950 uppercase font-sans">
              CONTRATO DE EMPRÉSTIMO DE DINHEIRO E NOTA PROMISSÓRIA
            </h1>
            <p className="text-xs font-mono text-zinc-600 mt-1 uppercase">
              {configuracoes.nomeEmpresa} • TERMO Nº {currentLoan.id}
            </p>
          </div>

          {/* Qualificação das Partes */}
          <div className="space-y-3 text-xs text-justify">
            <p>
              <strong>CREDOR(A):</strong> <strong>{configuracoes.nomeEmpresa}</strong>, inscrita no CNPJ sob o nº <strong>{configuracoes.cnpj}</strong>, neste ato representada por seu administrador <strong>{perfil.nome}</strong>.
            </p>

            <p>
              <strong>DEVEDOR(A) MUTUÁRIO(A):</strong> <strong>{currentClient.nome}</strong>, inscrito(a) no CPF nº <strong>{currentClient.cpf}</strong>, portador(a) do RG nº <strong>{currentClient.rg || 'N/A'}</strong>, residente e domiciliado(a) no endereço: <strong>{currentClient.endereco}, {currentClient.cidade} - {currentClient.estado}</strong>, telefone <strong>{currentClient.telefone}</strong>.
            </p>
          </div>

          {/* Cláusulas do Contrato */}
          <div className="space-y-4 text-xs">
            <div>
              <h3 className="font-bold font-sans text-zinc-900 border-b border-zinc-300 pb-1 uppercase">
                CLÁUSULA PRIMEIRA - DO OBJETO E VALOR
              </h3>
              <p className="mt-1 text-justify">
                O(A) CREDOR(A) concede nesta data ao(à) DEVEDOR(A) a quantia em espécie/PIX de <strong>{formatBRL(currentLoan.valorEmprestado)}</strong>, a ser restituído com a taxa de juros de <strong>{currentLoan.juros}% {currentLoan.periodicidade === 'Diário' ? 'no período' : 'ao mês'} ({currentLoan.tipoJuros})</strong>, perfazendo o montante total ajustado de <strong>{formatBRL(currentLoan.valorTotal)}</strong>.
              </p>
            </div>

            <div>
              <h3 className="font-bold font-sans text-zinc-900 border-b border-zinc-300 pb-1 uppercase">
                CLÁUSULA SEGUNDA - DO PARCELAMENTO E VENCIMENTOS
              </h3>
              <p className="mt-1 text-justify">
                O valor total será pago em <strong>{currentLoan.parcelasCount} {currentLoan.periodicidade === 'Diário' ? 'cobrança(s) diária(s)' : 'parcela(s)'}</strong> consecutiva(s) no valor de <strong>{formatBRL(currentLoan.valorParcela)}{currentLoan.periodicidade === 'Diário' ? ' por dia' : ''}</strong>, com o vencimento inicial estipulado para o dia <strong>{currentLoan.vencimento}</strong>.
              </p>

              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[10px] bg-zinc-100 p-3 rounded border border-zinc-300 max-h-48 overflow-y-auto">
                {currentLoan.parcelas.map((p) => (
                  <div key={p.numero}>
                    {currentLoan.periodicidade === 'Diário' ? `Dia #${p.numero}` : `Parcela #${p.numero}`}: {p.vencimento} - {formatBRL(p.valorParcela)}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold font-sans text-zinc-900 border-b border-zinc-300 pb-1 uppercase">
                CLÁUSULA TERCEIRA - DOS ENCARGOS POR ATRASO
              </h3>
              <p className="mt-1 text-justify">
                O não pagamento de qualquer parcela na data do vencimento implicará na incidência de multa moratória de <strong>{configuracoes.multaAtrasoPercentual}%</strong> sobre o saldo devedor, acrescido de juros de mora diários de <strong>{configuracoes.jurosMoraDiarioPercentual}% ao dia</strong> e cobrança de despesas operacionais.
              </p>
            </div>

            <div>
              <h3 className="font-bold font-sans text-zinc-900 border-b border-zinc-300 pb-1 uppercase">
                CLÁUSULA QUARTA - DO FORO
              </h3>
              <p className="mt-1 text-justify">
                Para dirimir quaisquer dúvidas oriundas do presente contrato, as partes elegem o Foro da Comarca de <strong>{currentClient.cidade} - {currentClient.estado}</strong>, com renúncia expressa de qualquer outro.
              </p>
            </div>
          </div>

          {/* Seção Nota Promissória em anexo */}
          <div className="border-2 border-dashed border-zinc-900 p-4 rounded-xl space-y-2 bg-zinc-50 font-sans">
            <div className="flex items-center justify-between border-b border-zinc-400 pb-2">
              <span className="font-black text-sm uppercase">NOTA PROMISSÓRIA Nº {currentLoan.id}</span>
              <span className="font-mono text-xs font-bold">VALOR: {formatBRL(currentLoan.valorTotal)}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-justify">
              No dia de vencimento das parcelas aqui pactuadas, pagarei por esta NOTA PROMISSÓRIA a <strong>{configuracoes.nomeEmpresa}</strong> ou à sua ordem, a quantia de <strong>{formatBRL(currentLoan.valorTotal)}</strong> em moeda corrente nacional.
            </p>
            <div className="text-[10px] text-zinc-600 font-mono">
              Emitente: {currentClient.nome} • CPF: {currentClient.cpf}
            </div>
          </div>

          {/* Assinaturas */}
          <div className="pt-8 space-y-8 font-sans">
            <div className="text-center text-xs">
              {currentClient.cidade} - {currentClient.estado}, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.
            </div>

            <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4">
              <div className="border-t border-zinc-900 pt-2">
                <strong>{configuracoes.nomeEmpresa}</strong>
                <span className="block text-[10px] text-zinc-600">CREDOR(A) / FINANCEIRA</span>
              </div>

              <div className="border-t border-zinc-900 pt-2">
                <strong>{currentClient.nome}</strong>
                <span className="block text-[10px] text-zinc-600">DEVEDOR(A) MUTUÁRIO(A)</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-zinc-500 text-xs">
          Selecione ou cadastre um empréstimo para visualizar o contrato.
        </div>
      )}
    </div>
  );
};

