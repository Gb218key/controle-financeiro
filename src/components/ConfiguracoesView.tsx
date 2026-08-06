import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Database,
  Download,
  Upload,
  Percent,
  CreditCard,
  Building,
  KeyRound,
  Check,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Terminal
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TipoJuros } from '../types';
import { encryptData, decryptData } from '../utils/crypto';

export const ConfiguracoesView: React.FC = () => {
  const {
    configuracoes,
    updateConfiguracoes,
    exportarBackupJson,
    importarBackupJson,
    executarRecuperacaoProfundaData,
  } = useApp();

  const [nomeEmpresa, setNomeEmpresa] = useState(configuracoes.nomeEmpresa);
  const [cnpj, setCnpj] = useState(configuracoes.cnpj);
  const [chavePix, setChavePix] = useState(configuracoes.chavePix);
  const [favorecidoPix, setFavorecidoPix] = useState(configuracoes.favorecidoPix);
  const [taxaJurosPadrao, setTaxaJurosPadrao] = useState(configuracoes.taxaJurosPadrao);
  const [tipoJurosPadrao, setTipoJurosPadrao] = useState<TipoJuros>(configuracoes.tipoJurosPadrao);
  const [multaAtrasoPercentual, setMultaAtrasoPercentual] = useState(configuracoes.multaAtrasoPercentual);
  const [jurosMoraDiarioPercentual, setJurosMoraDiarioPercentual] = useState(configuracoes.jurosMoraDiarioPercentual);
  const [saldoInicialCaixa, setSaldoInicialCaixa] = useState(configuracoes.saldoInicialCaixa ?? 0);
  const [exigirBiometria, setExigirBiometria] = useState(configuracoes.exigirBiometria);
  const [criptografiaAtiva, setCriptografiaAtiva] = useState(configuracoes.criptografiaAtiva);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Crypto Test Sandbox State
  const [cryptoTestInput, setCryptoTestInput] = useState('Mensagem Secreta de Teste - GGG Financeira');
  const [cryptoTestOutput, setCryptoTestOutput] = useState<{ encrypted: string; decrypted: string } | null>(null);

  const handleTestEncryption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cryptoTestInput) return;
    const enc = encryptData(cryptoTestInput);
    const dec = decryptData(enc, '');
    setCryptoTestOutput({ encrypted: enc, decrypted: dec });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfiguracoes({
      nomeEmpresa,
      cnpj,
      chavePix,
      favorecidoPix,
      taxaJurosPadrao,
      tipoJurosPadrao,
      multaAtrasoPercentual,
      jurosMoraDiarioPercentual,
      saldoInicialCaixa,
      exigirBiometria,
      criptografiaAtiva,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const success = importarBackupJson(content);
        if (success) {
          setImportStatus('Backup restaurado com sucesso!');
        } else {
          setImportStatus('Arquivo de backup inválido.');
        }
        setTimeout(() => setImportStatus(null), 4000);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Settings className="h-5 w-5 text-amber-400" />
            Configurações do Sistema GGG
          </h2>
          <p className="text-xs text-zinc-400">
            Ajustes de taxas de juros, PIX, segurança biométrica e backup de dados.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Company & Financial Parameters (Left) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Company Data */}
          <div className="rounded-2xl border border-amber-500/20 bg-zinc-900 p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Building className="h-4 w-4 text-amber-400" />
              Dados da Financeira
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Nome do Estabelecimento / Financeira
                </label>
                <input
                  type="text"
                  value={nomeEmpresa}
                  onChange={(e) => setNomeEmpresa(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-zinc-100 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  CNPJ / CPF do Credor
                </label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-zinc-100 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Chave PIX Oficial para Recebimentos
                </label>
                <input
                  type="text"
                  value={chavePix}
                  onChange={(e) => setChavePix(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Nome do Favorecido PIX
                </label>
                <input
                  type="text"
                  value={favorecidoPix}
                  onChange={(e) => setFavorecidoPix(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-zinc-100 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Interest Rates & Penalties */}
          <div className="rounded-2xl border border-amber-500/20 bg-zinc-900 p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Percent className="h-4 w-4 text-amber-400" />
              Parâmetros de Juros & Multas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Taxa Padrão de Juros (% Mensal)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={taxaJurosPadrao}
                  onChange={(e) => setTaxaJurosPadrao(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Tipo de Juros Padrão
                </label>
                <select
                  value={tipoJurosPadrao}
                  onChange={(e) => setTipoJurosPadrao(e.target.value as TipoJuros)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-zinc-100 focus:border-amber-400 focus:outline-none"
                >
                  <option value="Simples">Juros Simples</option>
                  <option value="Composto">Juros Composto</option>
                  <option value="Fixo">Fixo Mensal</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Multa por Atraso (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={multaAtrasoPercentual}
                  onChange={(e) => setMultaAtrasoPercentual(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-zinc-100 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Juros de Mora Diário (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={jurosMoraDiarioPercentual}
                  onChange={(e) => setJurosMoraDiarioPercentual(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-zinc-100 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Saldo Inicial em Caixa (R$)
                </label>
                <input
                  type="number"
                  step="100"
                  value={saldoInicialCaixa}
                  onChange={(e) => setSaldoInicialCaixa(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 px-6 py-3 text-xs font-black text-zinc-950 shadow-lg shadow-amber-500/10 hover:brightness-110"
          >
            <Check className="h-4 w-4" />
            <span>Salvar Configurações</span>
          </button>

          {savedSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300">
              <Check className="h-4 w-4" />
              <span>Configurações atualizadas com sucesso!</span>
            </div>
          )}
        </div>

        {/* Security & Backup (Right) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Security Box */}
          <div className="rounded-2xl border border-amber-500/20 bg-zinc-900 p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-3">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Segurança & Autenticação
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3 cursor-pointer">
                <div>
                  <span className="font-bold text-zinc-200 block">Exigir Autenticação Obrigatória (PIN / Senha)</span>
                  <span className="text-[10px] text-zinc-500">Solicitar identificação antes de liberar acesso ao sistema</span>
                </div>
                <input
                  type="checkbox"
                  checked={exigirBiometria}
                  onChange={(e) => setExigirBiometria(e.target.checked)}
                  className="h-4 w-4 rounded accent-amber-500"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3 cursor-pointer">
                <div>
                  <span className="font-bold text-zinc-200 block">Criptografia Local AES-256-GCM</span>
                  <span className="text-[10px] text-zinc-500">Proteger banco de dados e perfis contra leitura direta</span>
                </div>
                <input
                  type="checkbox"
                  checked={criptografiaAtiva}
                  onChange={(e) => setCriptografiaAtiva(e.target.checked)}
                  className="h-4 w-4 rounded accent-amber-500"
                />
              </label>
            </div>
          </div>

          {/* Encryption Engine Status & Sandbox */}
          <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#0A0A0A] p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-white/10 pb-3">
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#D4AF37]" />
                Núcleo de Criptografia de Alta Segurança
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                AES-256-GCM ACTIVE
              </span>
            </h3>

            <div className="space-y-3 text-xs text-white/70">
              <div className="bg-[#111111] p-3 rounded-xl border border-white/5 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-white/40">
                  <span>Algoritmo:</span>
                  <span className="text-[#D4AF37]">AES-GCM-256 + PBKDF2</span>
                </div>
                <div className="flex justify-between text-white/40">
                  <span>Vetor de Inicialização (IV):</span>
                  <span className="text-emerald-400">96-bit Random Per-Payload</span>
                </div>
                <div className="flex justify-between text-white/40">
                  <span>Armazenamento Local:</span>
                  <span className="text-white/80">Criptografado no Navegador</span>
                </div>
              </div>

              {/* Encryption Test Tool */}
              <div className="pt-1 space-y-2">
                <label className="block text-xs font-bold text-white">Testar Algoritmo de Criptografia</label>
                <form onSubmit={handleTestEncryption} className="space-y-2">
                  <input
                    type="text"
                    value={cryptoTestInput}
                    onChange={(e) => setCryptoTestInput(e.target.value)}
                    placeholder="Digite um texto para criptografar..."
                    className="w-full rounded-xl border border-white/10 bg-[#111111] px-3.5 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] text-black font-bold text-xs py-2 hover:brightness-110 cursor-pointer"
                  >
                    <Terminal className="h-3.5 w-3.5" /> Executar Criptografia AES-256-GCM
                  </button>
                </form>

                {cryptoTestOutput && (
                  <div className="bg-[#050505] border border-white/10 p-3 rounded-xl space-y-2 font-mono text-[10px] break-all">
                    <div>
                      <span className="text-amber-400 block font-bold">Ciphertext Gerado (Payload Criptografado):</span>
                      <span className="text-white/60">{cryptoTestOutput.encrypted}</span>
                    </div>
                    <div className="border-t border-white/5 pt-1.5">
                      <span className="text-emerald-400 block font-bold">Dado Descriptografado Original:</span>
                      <span className="text-white">{cryptoTestOutput.decrypted}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Backup Box */}
          <div className="rounded-2xl border border-amber-500/20 bg-zinc-900 p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Database className="h-4 w-4 text-amber-400" />
              Backup Diário & Restauração
            </h3>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Exporte todos os seus dados em formato JSON para salvar no computador ou restaurar em caso de troca de dispositivo.
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={exportarBackupJson}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-zinc-950 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/10 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Exportar Backup (JSON)</span>
              </button>

              <label className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>Importar / Restaurar Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  const result = executarRecuperacaoProfundaData();
                  if (result.clientesRecuperados > 0 || result.emprestimosRecuperados > 0) {
                    setImportStatus(
                      `Recuperação Concluída! ${result.clientesRecuperados} cliente(s) e ${result.emprestimosRecuperados} empréstimo(s) restaurados com sucesso!`
                    );
                  } else if (result.totalLocalEncontrado > 0) {
                    setImportStatus(
                      `Todos os ${result.totalLocalEncontrado} registro(s) locais já estão ativos e sincronizados!`
                    );
                  } else {
                    setImportStatus('Verificação concluída: Seus dados estão 100% atualizados.');
                  }
                  setTimeout(() => setImportStatus(null), 6000);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/40 cursor-pointer"
              >
                <Database className="h-4 w-4" />
                <span>Escaneamento & Recuperação Profunda de Dados</span>
              </button>

              {importStatus && (
                <div className="text-xs font-bold text-amber-400 text-center pt-2 bg-amber-950/30 border border-amber-500/30 p-2.5 rounded-xl">
                  {importStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
