import React, { useState } from 'react';
import {
  Bell,
  Lock,
  Plus,
  UserCheck,
  ShieldCheck,
  Search,
  DollarSign,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NotificationDrawer } from './NotificationDrawer';

interface HeaderProps {
  onOpenNovoCliente: () => void;
  onOpenNovoEmprestimo: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNovoCliente, onOpenNovoEmprestimo }) => {
  const {
    activeModule,
    notificacoes,
    perfil,
    configuracoes,
    setIsLoggedIn,
    syncStatus,
    manualSync
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notificacoes.filter((n) => !n.lida).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/5 bg-[#050505] px-6 md:px-8">
      {/* Module Title / Status */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <h2 className="text-lg font-light tracking-wide uppercase text-white flex items-center gap-2">
            <span>{activeModule}</span>
          </h2>
          <span className="text-[10px] text-white/40 uppercase tracking-wider hidden sm:inline-block">
            {configuracoes.nomeEmpresa} • Gestão Financeira
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Quick Action Buttons */}
        <div className="hidden md:flex items-center gap-2.5">
          <button
            onClick={onOpenNovoCliente}
            className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition-all hover:bg-white/10 hover:text-white"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Novo Cliente
          </button>
          <button
            onClick={onOpenNovoEmprestimo}
            className="flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-black shadow-md transition-all hover:brightness-110 active:scale-95"
          >
            <DollarSign className="h-3.5 w-3.5" />
            Novo Empréstimo
          </button>
        </div>

        {/* Cross-Device Live Sync Badge */}
        <button
          type="button"
          onClick={() => manualSync()}
          title="Sincronização em tempo real entre todos os dispositivos. Clique para atualizar manualmente."
          className={`flex items-center gap-2 px-3 py-1 border text-xs rounded-full font-mono transition-all cursor-pointer ${
            syncStatus.isOnline
              ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40'
              : 'border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                syncStatus.isOnline ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                syncStatus.isOnline ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="hidden sm:inline font-sans font-semibold text-[11px]">
            {syncStatus.isOnline ? 'Sincronizado Ao Vivo' : 'Off-line'}
          </span>
          <RefreshCw className="h-3 w-3 opacity-60 hover:opacity-100" />
        </button>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg border border-white/10 bg-[#111111] p-2 text-white/80 transition-colors hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
            title="Notificações e Alertas"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37] text-[10px] font-bold text-black">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <NotificationDrawer onClose={() => setShowNotifications(false)} />
          )}
        </div>

        {/* User Profile / Lock */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <button
            onClick={() => setIsLoggedIn(false)}
            className="flex items-center gap-2 rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/5 hover:text-[#D4AF37]"
            title="Bloquear / Trocar PIN"
          >
            {perfil.avatar ? (
              <img
                src={perfil.avatar}
                alt={perfil.nome}
                className="h-7 w-7 rounded-full border border-[#D4AF37]/50 object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-black">
                JS
              </div>
            )}
            <Lock className="h-3.5 w-3.5 text-white/40 hover:text-[#D4AF37]" />
          </button>
        </div>
      </div>
    </header>
  );
};
