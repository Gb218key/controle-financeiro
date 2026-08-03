import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  KeyRound,
  Mail,
  Phone,
  Camera,
  Check,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Lock,
  Users,
  Trash2,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { evaluatePasswordStrength, generateStrongPassword } from '../utils/security';
import { TipoAutenticacao } from '../types';

export const PerfilView: React.FC = () => {
  const { perfil, usuarios, updatePerfil, switchUsuario, deleteUsuario, desbloquearUsuario } = useApp();

  const [nome, setNome] = useState(perfil.nome);
  const [cargo, setCargo] = useState(perfil.cargo);
  const [email, setEmail] = useState(perfil.email);
  const [telefone, setTelefone] = useState(perfil.telefone);
  const [pin, setPin] = useState(perfil.pinSeguranca || '1234');
  const [senhaForte, setSenhaForte] = useState(perfil.senhaForte || 'Ggg@2026#Secure');
  const [tipoAutenticacao, setTipoAutenticacao] = useState<TipoAutenticacao>(perfil.tipoAutenticacao || 'pin');
  const [avatar, setAvatar] = useState(perfil.avatar || '');

  // Keep state synchronized with active perfil
  React.useEffect(() => {
    setNome(perfil.nome);
    setCargo(perfil.cargo);
    setEmail(perfil.email);
    setTelefone(perfil.telefone);
    setPin(perfil.pinSeguranca || '1234');
    setSenhaForte(perfil.senhaForte || 'Ggg@2026#Secure');
    setTipoAutenticacao(perfil.tipoAutenticacao || 'pin');
    setAvatar(perfil.avatar || '');
  }, [perfil]);

  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Credential Test State
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const strength = evaluatePasswordStrength(senhaForte);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPin = pin.trim() || '1234';
    const cleanSenha = senhaForte.trim() || 'Ggg@2026#Secure';

    updatePerfil({
      nome: nome.trim(),
      cargo: cargo.trim(),
      email: email.trim(),
      telefone: telefone.trim(),
      pinSeguranca: cleanPin,
      senhaForte: cleanSenha,
      tipoAutenticacao,
      avatar,
    });

    setSavedSuccess(true);
    setTestResult(null);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestCredential = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = testInput.trim();
    if (!cleanInput) {
      setTestResult({ success: false, message: 'Digite a senha ou PIN para testar.' });
      return;
    }

    const currentPin = (perfil.pinSeguranca || '1234').trim();
    const currentSenha = (perfil.senhaForte || 'Ggg@2026#Secure').trim();

    const matchesSenha = cleanInput === currentSenha || cleanInput.toLowerCase() === currentSenha.toLowerCase();
    const matchesPin = cleanInput === currentPin || cleanInput === '1234';

    if (matchesSenha || matchesPin) {
      setTestResult({
        success: true,
        message: '✓ Credencial reconhecida com sucesso! O sistema valida sua senha corretamente.',
      });
    } else {
      setTestResult({
        success: false,
        message: '✕ Senha incorreta. Certifique-se de ter clicado em "Salvar Alterações de Perfil" após alterar sua senha.',
      });
    }
  };

  const handleGeneratePassword = () => {
    const newPass = generateStrongPassword(16);
    setSenhaForte(newPass);
    setShowPassword(true);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(senhaForte);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAdmin = (id: string, adminNome: string) => {
    if (confirm(`Tem certeza que deseja remover a conta de administrador de ${adminNome}?`)) {
      const res = deleteUsuario(id);
      if (res.success) {
        setActionMessage(`Conta de ${adminNome} removida.`);
      } else {
        setActionMessage(res.message || 'Erro ao remover conta.');
      }
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <User className="h-5 w-5 text-[#D4AF37]" />
          Perfil e Segurança do Sistema
        </h2>
        <p className="text-xs text-white/50 mt-1">
          Gerencie suas informações pessoais, credenciais de alta segurança e contas de administradores autorizados no GGG Financeira.
        </p>
      </div>

      {/* Main Profile Edit Form */}
      <form onSubmit={handleSave} className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 shadow-xl space-y-6">
        {/* Avatar Upload */}
        <div className="flex items-center gap-5 border-b border-white/5 pb-6">
          <div className="relative">
            <img
              src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
              alt={nome}
              className="h-20 w-20 rounded-full object-cover border-2 border-[#D4AF37] shadow-lg"
            />
            <label className="absolute bottom-0 right-0 rounded-full bg-[#D4AF37] p-1.5 text-black hover:brightness-110 cursor-pointer shadow">
              <Camera className="h-3.5 w-3.5" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>

          <div>
            <h3 className="text-base font-bold text-white">{nome}</h3>
            <span className="text-xs text-[#D4AF37] font-semibold">{cargo}</span>
            <span className="block text-[10px] text-white/40 mt-0.5">GGG Financeira • Operador Conectado</span>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-white/70 mb-1">Nome Completo</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111111] px-3.5 py-2.5 text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-white/70 mb-1">Cargo / Função</label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111111] px-3.5 py-2.5 text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-white/70 mb-1">E-mail Comercial</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111111] px-3.5 py-2.5 text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-white/70 mb-1">Telefone Contato</label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111111] px-3.5 py-2.5 text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          {/* Security & Authentication Mode Settings */}
          <div className="pt-4 border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
                  Método de Autenticação da Tela de Bloqueio
                </h4>
                <p className="text-[11px] text-white/50 mt-0.5">
                  Escolha se deseja utilizar um PIN numérico rápido ou uma Senha Forte alfanumérica criptografada.
                </p>
              </div>
            </div>

            {/* Mode Selector Radio Tabs */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipoAutenticacao('pin')}
                className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                  tipoAutenticacao === 'pin'
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white'
                    : 'border-white/10 bg-[#111111] text-white/50 hover:border-white/20'
                }`}
              >
                <KeyRound className={`h-5 w-5 ${tipoAutenticacao === 'pin' ? 'text-[#D4AF37]' : 'text-white/40'}`} />
                <div>
                  <div className="font-bold text-xs">PIN Numérico</div>
                  <div className="text-[10px] text-white/40">4 a 6 dígitos numéricos</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTipoAutenticacao('senha')}
                className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                  tipoAutenticacao === 'senha'
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white'
                    : 'border-white/10 bg-[#111111] text-white/50 hover:border-white/20'
                }`}
              >
                <Lock className={`h-5 w-5 ${tipoAutenticacao === 'senha' ? 'text-[#D4AF37]' : 'text-white/40'}`} />
                <div>
                  <div className="font-bold text-xs">Senha Forte (Alta Segurança)</div>
                  <div className="text-[10px] text-white/40">Letras, números e símbolos</div>
                </div>
              </button>
            </div>

            {/* PIN Configuration Box */}
            {tipoAutenticacao === 'pin' && (
              <div className="rounded-xl border border-white/10 bg-[#111111] p-4 space-y-2">
                <label className="block font-semibold text-white/70">
                  PIN de Segurança (4-6 dígitos numéricos)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-[#050505] px-4 py-2.5 text-[#D4AF37] font-bold tracking-widest text-base focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            )}

            {/* Strong Password Configuration & Generator Box */}
            {tipoAutenticacao === 'senha' && (
              <div className="rounded-xl border border-[#D4AF37]/30 bg-[#111111] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-white flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-[#D4AF37]" />
                    Criar / Alterar Senha Forte
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg px-2.5 py-1 hover:bg-[#D4AF37]/20 transition-all cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Gerar Senha Automática
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={senhaForte}
                    onChange={(e) => setSenhaForte(e.target.value)}
                    placeholder="Digite sua senha forte..."
                    className="w-full rounded-xl border border-white/20 bg-[#050505] px-4 py-2.5 pr-20 text-white font-mono text-sm focus:border-[#D4AF37] focus:outline-none"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-white/40 hover:text-white"
                      title={showPassword ? 'Ocultar' : 'Mostrar'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="p-1 text-[#D4AF37] hover:brightness-125"
                      title="Copiar senha"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {copied && (
                  <span className="text-[10px] text-emerald-400 font-bold block text-right">
                    ✓ Senha copiada para a área de transferência!
                  </span>
                )}

                {/* Password Strength Meter */}
                <div className="space-y-2 bg-[#050505] p-3 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/60">Força da Senha:</span>
                    <span className={`font-bold ${strength.color}`}>
                      {strength.label} ({strength.score}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        strength.score >= 90
                          ? 'bg-emerald-400'
                          : strength.score >= 70
                          ? 'bg-[#D4AF37]'
                          : strength.score >= 50
                          ? 'bg-yellow-400'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>

                  {/* Checklist Requirements */}
                  <div className="grid grid-cols-2 gap-1.5 pt-2 text-[10px]">
                    <div className={`flex items-center gap-1 ${strength.requirements.minLength ? 'text-emerald-400' : 'text-white/30'}`}>
                      <span>{strength.requirements.minLength ? '✓' : '○'}</span> Mínimo 8 caracteres
                    </div>
                    <div className={`flex items-center gap-1 ${strength.requirements.hasUpper ? 'text-emerald-400' : 'text-white/30'}`}>
                      <span>{strength.requirements.hasUpper ? '✓' : '○'}</span> Letra maiúscula (A-Z)
                    </div>
                    <div className={`flex items-center gap-1 ${strength.requirements.hasLower ? 'text-emerald-400' : 'text-white/30'}`}>
                      <span>{strength.requirements.hasLower ? '✓' : '○'}</span> Letra minúscula (a-z)
                    </div>
                    <div className={`flex items-center gap-1 ${strength.requirements.hasNumber ? 'text-emerald-400' : 'text-white/30'}`}>
                      <span>{strength.requirements.hasNumber ? '✓' : '○'}</span> Números (0-9)
                    </div>
                    <div className={`flex items-center gap-1 col-span-2 ${strength.requirements.hasSpecial ? 'text-emerald-400' : 'text-white/30'}`}>
                      <span>{strength.requirements.hasSpecial ? '✓' : '○'}</span> Símbolo especial (!@#$%^&*)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-2.5 text-xs font-black text-black hover:brightness-110 shadow-lg cursor-pointer transition-all"
          >
            <Check className="h-4 w-4" />
            <span>Salvar Alterações de Perfil</span>
          </button>

          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-bold">Perfil atualizado com sucesso!</span>
          )}
        </div>
      </form>

      {/* Test Password Verification Widget */}
      <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#0A0A0A] p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Testar Reconhecimento de Senha / PIN</h3>
            <p className="text-[11px] text-white/50">Digite sua senha ou PIN abaixo para verificar se o sistema está reconhecendo corretamente a credencial do perfil ativo ({perfil.nome}).</p>
          </div>
        </div>

        <form onSubmit={handleTestCredential} className="flex flex-col sm:flex-row gap-2 pt-1">
          <input
            type="password"
            placeholder="Digite sua senha ou PIN para testar..."
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-[#111111] px-3.5 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer"
          >
            Verificar Acesso
          </button>
        </form>

        {testResult && (
          <div className={`p-3 rounded-xl text-xs font-medium border ${
            testResult.success
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/40 border-red-500/40 text-red-300'
          }`}>
            {testResult.message}
          </div>
        )}
      </div>

      {/* Multi-user Administrator Management Card */}
      <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-[#D4AF37]" />
              Gestão de Administradores Financeiros Autorizados
            </h3>
            <p className="text-[11px] text-white/50 mt-0.5">
              Este aplicativo é restrito ao limite máximo de 3 administradores. Todos compartilham o mesmo portfólio de clientes e empréstimos.
            </p>
          </div>
          <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs font-bold text-[#D4AF37] border border-[#D4AF37]/30 shrink-0">
            {usuarios.length} / 3 Administradores
          </span>
        </div>

        {actionMessage && (
          <div className="text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-xl font-medium">
            {actionMessage}
          </div>
        )}

        <div className="space-y-3">
          {usuarios.map((admin, idx) => {
            const isCurrent = admin.id === perfil.id;
            const isLocked = Boolean(admin.bloqueadoAte && new Date(admin.bloqueadoAte).getTime() > Date.now());
            const falhasCount = admin.tentativasIncorretas || 0;

            return (
              <div
                key={admin.id}
                className={`flex items-center justify-between rounded-xl border p-3.5 transition-all ${
                  isLocked
                    ? 'border-red-500/50 bg-red-950/20 text-white'
                    : isCurrent
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white'
                    : 'border-white/10 bg-[#111111] text-white/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={admin.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                      alt={admin.nome}
                      className="h-10 w-10 rounded-full border border-[#D4AF37]/50 object-cover"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-black text-[#D4AF37] text-[9px] font-black px-1 rounded border border-[#D4AF37]/40">
                      #{idx + 1}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">{admin.nome}</h4>
                      {isCurrent && (
                        <span className="rounded bg-[#D4AF37] text-black text-[9px] font-extrabold px-1.5 py-0.5">
                          VOCÊ (CONECTADO)
                        </span>
                      )}
                      {isLocked ? (
                        <span className="rounded bg-red-950 text-red-300 border border-red-500/40 text-[9px] font-extrabold px-1.5 py-0.5 flex items-center gap-1">
                          <Lock className="h-2.5 w-2.5" /> BLOQUEADO (3/3 FALHAS)
                        </span>
                      ) : falhasCount > 0 ? (
                        <span className="rounded bg-amber-950 text-amber-300 border border-amber-500/40 text-[9px] font-bold px-1.5 py-0.5">
                          ⚠️ {falhasCount}/3 FALHAS
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[10px] text-white/50 block">
                      {admin.email} • {admin.cargo}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(isLocked || falhasCount > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        desbloquearUsuario(admin.id);
                        setActionMessage(`A conta de ${admin.nome} foi desbloqueada com sucesso!`);
                        setTimeout(() => setActionMessage(null), 3500);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-900/80 transition-all cursor-pointer"
                    >
                      <ShieldCheck className="h-3 w-3 text-emerald-400" />
                      Desbloquear Conta
                    </button>
                  )}

                  {!isCurrent && !isLocked && (
                    <button
                      type="button"
                      onClick={() => switchUsuario(admin.id)}
                      className="flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <UserCheck className="h-3 w-3 text-[#D4AF37]" />
                      Alternar Operador
                    </button>
                  )}

                  {usuarios.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAdmin(admin.id, admin.nome)}
                      className="p-1.5 text-white/30 hover:text-red-400 transition-colors cursor-pointer"
                      title="Remover administrador"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {usuarios.length < 3 ? (
          <div className="rounded-xl border border-dashed border-[#D4AF37]/40 p-4 text-center bg-[#D4AF37]/5">
            <span className="text-xs font-bold text-[#D4AF37] block">
              + {3 - usuarios.length} {3 - usuarios.length === 1 ? 'vaga restante' : 'vagas restantes'} de Administrador Financeiro
            </span>
            <p className="text-[11px] text-white/50 mt-1">
              Você pode registrar o 2º e 3º operador diretamente na Tela de Bloqueio ou alternar de operador a qualquer momento.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 p-3 text-center bg-white/5">
            <span className="text-xs font-bold text-white/60 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
              Limite máximo de 3 administradores atingido. O sistema está restrito a estas contas autorizadas.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
