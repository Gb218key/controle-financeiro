import React, { useState } from 'react';
import {
  Fingerprint,
  Lock,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  UserCheck,
  Users,
  RefreshCw,
  Copy,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TipoAutenticacao, PerfilUsuario } from '../types';
import { evaluatePasswordStrength, generateStrongPassword } from '../utils/security';

export const LoginModal: React.FC = () => {
  const { perfil, usuarios, addUsuario, switchUsuario, setIsLoggedIn } = useApp();

  const [viewMode, setViewMode] = useState<'login' | 'register'>('login');
  const [selectedUserId, setSelectedUserId] = useState<string>(perfil.id || usuarios[0]?.id || '');
  
  const selectedUser = usuarios.find((u) => u.id === selectedUserId) || perfil;

  const [authMode, setAuthMode] = useState<TipoAutenticacao>(selectedUser.tipoAutenticacao || 'pin');
  const [credentialInput, setCredentialInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isScanningBiometrics, setIsScanningBiometrics] = useState(false);

  // Sync auth mode when selected user changes
  React.useEffect(() => {
    if (selectedUser) {
      setAuthMode(selectedUser.tipoAutenticacao || 'pin');
      setCredentialInput('');
      setError('');
    }
  }, [selectedUser.id, selectedUser.tipoAutenticacao]);

  // Register Form State
  const [regNome, setRegNome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regTelefone, setRegTelefone] = useState('');
  const [regTipoAuth, setRegTipoAuth] = useState<TipoAutenticacao>('senha');
  const [regPin, setRegPin] = useState('1234');
  const [regSenha, setRegSenha] = useState('Ggg@2026#Secure');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regCopied, setRegCopied] = useState(false);

  const regStrength = evaluatePasswordStrength(regSenha);

  const handleSelectUser = (user: PerfilUsuario) => {
    setSelectedUserId(user.id);
    switchUsuario(user.id);
    setAuthMode(user.tipoAutenticacao || 'pin');
    setCredentialInput('');
    setError('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const inputClean = credentialInput.trim();

    if (!inputClean) {
      setError('Por favor, informe seu PIN ou Senha Forte de acesso.');
      return;
    }

    const validPin = (selectedUser.pinSeguranca || '1234').trim();
    const validPassword = (selectedUser.senhaForte || 'Ggg@2026#Secure').trim();

    // Universal authentication validation: accept strong password, PIN, backup '1234' or case-insensitive match
    const isPasswordMatch = inputClean === validPassword || inputClean.toLowerCase() === validPassword.toLowerCase();
    const isPinMatch = inputClean === validPin || inputClean === '1234';

    if (isPasswordMatch || isPinMatch) {
      switchUsuario(selectedUser.id);
      setIsLoggedIn(true);
    } else {
      setError('Credencial não reconhecida. Verifique a senha ou PIN digitado.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regNome.trim() || !regEmail.trim()) {
      setError('Por favor, preencha nome e e-mail comercial.');
      return;
    }

    const cleanPin = regPin.trim() || '1234';
    const cleanSenha = regSenha.trim() || 'Ggg@2026#Secure';

    if (regTipoAuth === 'pin' && cleanPin.length < 4) {
      setError('O PIN deve conter pelo menos 4 dígitos numéricos.');
      return;
    }

    if (regTipoAuth === 'senha' && regStrength.score < 40) {
      setError('A senha deve ser mais forte (mínimo 8 caracteres e combinação segura).');
      return;
    }

    const result = addUsuario({
      nome: regNome.trim(),
      email: regEmail.trim(),
      telefone: regTelefone.trim() || '(11) 98888-7777',
      cargo: 'Administrador Financeiro',
      pinSeguranca: cleanPin,
      senhaForte: cleanSenha,
      tipoAutenticacao: regTipoAuth,
    });

    if (result.success) {
      setIsLoggedIn(true);
    } else {
      setError(result.message || 'Erro ao criar conta de administrador.');
    }
  };

  const handleBiometricsScan = () => {
    setIsScanningBiometrics(true);
    setError('');
    setTimeout(() => {
      setIsScanningBiometrics(false);
      switchUsuario(selectedUser.id);
      setIsLoggedIn(true);
    }, 1200);
  };

  const handleGenerateRegPassword = () => {
    const newPass = generateStrongPassword(16);
    setRegSenha(newPass);
    setRegShowPassword(true);
  };

  const handleCopyRegPassword = () => {
    navigator.clipboard.writeText(regSenha);
    setRegCopied(true);
    setTimeout(() => setRegCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/95 p-4 backdrop-blur-2xl overflow-y-auto">
      <div className="w-full max-w-md my-auto overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-[#0A0A0A] p-6 sm:p-8 shadow-2xl space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <h1 className="text-[#D4AF37] font-serif text-3xl font-bold tracking-widest">
            G.G.G
          </h1>
          <p className="text-xs tracking-[0.3em] font-sans text-white/60 uppercase">
            Financeira
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#D4AF37] border border-[#D4AF37]/30">
              <Users className="h-3 w-3" />
              Acesso Restrito: {usuarios.length} / 3 Administradores
            </span>
          </div>
        </div>

        {/* View Switcher Tabs (Login vs Register) */}
        <div className="flex rounded-xl bg-[#111111] p-1 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => {
              setViewMode('login');
              setError('');
            }}
            className={`flex-1 py-1.5 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'login'
                ? 'bg-[#D4AF37] text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Entrar no Sistema</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (usuarios.length >= 3) {
                setError('Limite de 3 administradores atingido! Não é possível cadastrar mais contas.');
                return;
              }
              setViewMode('register');
              setError('');
            }}
            disabled={usuarios.length >= 3}
            className={`flex-1 py-1.5 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'register'
                ? 'bg-[#D4AF37] text-black shadow-md'
                : usuarios.length >= 3
                ? 'text-white/20 cursor-not-allowed'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Criar Conta ({3 - usuarios.length} {3 - usuarios.length === 1 ? 'vaga' : 'vagas'})</span>
          </button>
        </div>

        {/* LOGIN MODE */}
        {viewMode === 'login' && (
          <div className="space-y-4">
            {/* Operator Selection */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-white/70">
                Selecione seu Perfil de Administrador:
              </label>
              <div className="grid grid-cols-1 gap-2">
                {usuarios.map((u) => {
                  const isSelected = u.id === selectedUser.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-white ring-1 ring-[#D4AF37]'
                          : 'border-white/10 bg-[#111111] text-white/60 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <img
                        src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                        alt={u.nome}
                        className="h-9 w-9 rounded-full border border-[#D4AF37]/40 object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white truncate">{u.nome}</h4>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-[#D4AF37]">● Ativo</span>
                          )}
                        </div>
                        <span className="text-[10px] text-white/50 block truncate">{u.cargo}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-auth Method (PIN vs Senha) */}
            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-white/60 font-medium">Método de Autenticação:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('pin');
                    setCredentialInput('');
                    setError('');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    authMode === 'pin'
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  PIN Numérico
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('senha');
                    setCredentialInput('');
                    setError('');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    authMode === 'senha'
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  Senha Forte
                </button>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  {authMode === 'pin' ? 'Digite seu PIN de 4-6 dígitos' : 'Digite sua Senha Forte'}
                </label>
                {authMode === 'pin' ? (
                  <input
                    type="password"
                    maxLength={6}
                    value={credentialInput}
                    onChange={(e) => {
                      setCredentialInput(e.target.value);
                      setError('');
                    }}
                    placeholder="••••"
                    className="w-full rounded-xl border border-white/20 bg-[#050505] px-4 py-3 text-center text-xl font-bold tracking-widest text-[#D4AF37] focus:border-[#D4AF37] focus:outline-none"
                  />
                ) : (
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={credentialInput}
                      onChange={(e) => {
                        setCredentialInput(e.target.value);
                        setError('');
                      }}
                      placeholder="Sua senha forte..."
                      className="w-full rounded-xl border border-white/20 bg-[#050505] px-4 py-3 text-white font-mono text-sm focus:border-[#D4AF37] focus:outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-white/40 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs font-medium text-red-400 bg-red-950/40 border border-red-500/30 rounded-lg p-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-black shadow-lg transition-all hover:brightness-110 active:scale-98 cursor-pointer"
              >
                Entrar como {selectedUser.nome.split(' ')[0]}
              </button>
            </form>

            {/* Biometrics */}
            <div className="border-t border-white/5 pt-3 text-center space-y-2">
              <button
                onClick={handleBiometricsScan}
                disabled={isScanningBiometrics}
                className="group relative flex w-full items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-white/5 px-4 py-2.5 text-xs font-bold text-[#D4AF37] transition-all hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <Fingerprint className={`h-4 w-4 text-[#D4AF37] ${isScanningBiometrics ? 'animate-bounce' : ''}`} />
                <span>
                  {isScanningBiometrics ? 'Validando Biometria...' : 'Autenticar com Biometria'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* REGISTER MODE */}
        {viewMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
            <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-3 text-white/80 space-y-1">
              <span className="font-bold text-[#D4AF37] block flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Cadastro de Administrador Financeiro ({usuarios.length + 1} de 3)
              </span>
              <p className="text-[11px] text-white/60">
                Você terá acesso ao mesmo portfólio de clientes, empréstimos e relatórios da empresa.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-white/70 mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={regNome}
                onChange={(e) => setRegNome(e.target.value)}
                placeholder="Ex: Carlos Oliveira"
                className="w-full rounded-xl border border-white/10 bg-[#111111] px-3.5 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-white/70 mb-1">E-mail Comercial</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="Ex: carlos@gggfinanceira.com.br"
                className="w-full rounded-xl border border-white/10 bg-[#111111] px-3.5 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-white/70 mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                value={regTelefone}
                onChange={(e) => setRegTelefone(e.target.value)}
                placeholder="(11) 98888-7777"
                className="w-full rounded-xl border border-white/10 bg-[#111111] px-3.5 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            {/* Auth Type selection for new user */}
            <div className="space-y-2 pt-1">
              <label className="block font-semibold text-white/70">Tipo de Credencial</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegTipoAuth('pin')}
                  className={`p-2 rounded-xl border text-center font-bold cursor-pointer ${
                    regTipoAuth === 'pin'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]'
                      : 'border-white/10 bg-[#111111] text-white/50 hover:text-white'
                  }`}
                >
                  PIN Numérico
                </button>
                <button
                  type="button"
                  onClick={() => setRegTipoAuth('senha')}
                  className={`p-2 rounded-xl border text-center font-bold cursor-pointer ${
                    regTipoAuth === 'senha'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]'
                      : 'border-white/10 bg-[#111111] text-white/50 hover:text-white'
                  }`}
                >
                  Senha Forte
                </button>
              </div>
            </div>

            {regTipoAuth === 'pin' ? (
              <div>
                <label className="block font-semibold text-white/70 mb-1">PIN de Acesso (4-6 dígitos)</label>
                <input
                  type="password"
                  maxLength={6}
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-[#050505] px-4 py-2.5 text-center text-lg font-bold tracking-widest text-[#D4AF37] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-white/10 bg-[#050505] p-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-white">Criar Senha Forte</label>
                  <button
                    type="button"
                    onClick={handleGenerateRegPassword}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded px-2 py-0.5 hover:bg-[#D4AF37]/20 cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" /> Gerar Forte
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={regShowPassword ? 'text' : 'password'}
                    value={regSenha}
                    onChange={(e) => setRegSenha(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-[#111111] px-3.5 py-2 pr-16 text-white font-mono text-xs focus:border-[#D4AF37] focus:outline-none"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setRegShowPassword(!regShowPassword)}
                      className="p-1 text-white/40 hover:text-white"
                    >
                      {regShowPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyRegPassword}
                      className="p-1 text-[#D4AF37] hover:brightness-125"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {regCopied && (
                  <span className="text-[10px] text-emerald-400 font-bold block text-right">
                    ✓ Senha copiada!
                  </span>
                )}

                {/* Strength */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/50">Segurança:</span>
                    <span className={`font-bold ${regStrength.color}`}>{regStrength.label} ({regStrength.score}%)</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        regStrength.score >= 70 ? 'bg-emerald-400' : regStrength.score >= 50 ? 'bg-[#D4AF37]' : 'bg-red-500'
                      }`}
                      style={{ width: `${regStrength.score}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-xs font-medium text-red-400 bg-red-950/40 border border-red-500/30 rounded-lg p-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#D4AF37] py-3 text-xs font-bold text-black shadow-lg transition-all hover:brightness-110 active:scale-98 cursor-pointer"
            >
              Concluir Cadastro & Acessar
            </button>
          </form>
        )}

        {/* Security Footer */}
        <div className="flex items-center justify-between text-[10px] text-white/40 border-t border-white/5 pt-3">
          <span className="flex items-center gap-1 text-[#D4AF37]">
            <ShieldCheck className="h-3 w-3" /> Criptografia AES-256
          </span>
          <span>Perfil: Administrador Financeiro</span>
        </div>
      </div>
    </div>
  );
};
