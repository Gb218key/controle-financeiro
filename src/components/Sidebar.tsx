import React from 'react';
import {
  LayoutDashboard,
  Users,
  Banknote,
  AlertCircle,
  FileText,
  FileSignature,
  Calendar,
  Settings,
  User,
  LogIn,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Landmark,
  Percent
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ModuloApp } from '../types';

interface SidebarProps {
  onOpenNovoCliente: () => void;
  onOpenNovoEmprestimo: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenNovoCliente, onOpenNovoEmprestimo }) => {
  const { activeModule, setActiveModule, setIsLoggedIn, notificacoes, perfil } = useApp();

  const overdueCount = notificacoes.filter((n) => n.tipo === 'urgente' && !n.lida).length;

  const menuItems: {
    id: ModuloApp;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { id: 'Dashboard', label: 'Painel de Controle', icon: LayoutDashboard },
    { id: 'Clientes', label: 'Clientes', icon: Users },
    { id: 'Empréstimos', label: 'Empréstimos', icon: Banknote },
    { id: 'Baixa de Juros', label: 'Baixa de Juros', icon: Percent },
    {
      id: 'Cobranças',
      label: 'Cobranças',
      icon: AlertCircle,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-red-500 text-white',
    },
    { id: 'Relatórios', label: 'Relatórios', icon: FileText },
    { id: 'Contratos', label: 'Contratos', icon: FileSignature },
    { id: 'Agenda', label: 'Agenda', icon: Calendar },
    { id: 'Configurações', label: 'Configurações', icon: Settings },
    { id: 'Perfil', label: 'Perfil', icon: User },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[#D4AF37]/20 bg-[#0A0A0A] text-white transition-all">
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-[#D4AF37]/30">
        <h1 className="text-[#D4AF37] font-serif text-2xl font-bold tracking-widest">
          G.G.G
          <br />
          <span className="text-xs tracking-[0.3em] font-sans text-white/50 uppercase block mt-1">
            Financeira
          </span>
        </h1>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        <div className="px-2 pb-2 text-[10px] font-bold tracking-[0.2em] text-[#D4AF37]/70 uppercase">
          Módulos do Sistema
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`group flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-l-2 border-[#D4AF37]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-[#D4AF37]' : 'text-white/40 group-hover:text-white'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      item.badgeColor || 'bg-[#D4AF37] text-black'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                <ChevronRight
                  className={`h-3.5 w-3.5 opacity-0 transition-all group-hover:opacity-100 ${
                    isActive ? 'opacity-100 text-[#D4AF37]' : 'text-white/30'
                  }`}
                />
              </div>
            </button>
          );
        })}

        {/* Login / Auth Direct Action */}
        <div className="pt-4 border-t border-white/5 mt-4">
          <button
            onClick={() => setIsLoggedIn(false)}
            className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/70 transition-all hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"
          >
            <div className="flex items-center gap-2.5">
              <LogIn className="h-4 w-4 text-[#D4AF37]" />
              <span>Bloquear / Trocar PIN</span>
            </div>
            <span className="rounded bg-[#D4AF37]/10 px-1.5 py-0.5 text-[10px] text-[#D4AF37] border border-[#D4AF37]/30">
              Seguro
            </span>
          </button>
        </div>
      </div>

      {/* Footer User Profile */}
      <div className="p-4 border-t border-white/5 bg-[#050505]">
        <div className="flex items-center gap-3">
          {perfil.avatar ? (
            <img
              src={perfil.avatar}
              alt={perfil.nome}
              className="w-9 h-9 rounded-full border border-[#D4AF37]/50 object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#D4AF37] flex items-center justify-center text-black font-bold text-xs">
              {perfil.nome.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold text-white truncate">{perfil.nome}</p>
            <p className="text-[10px] text-[#D4AF37] font-semibold truncate">{perfil.cargo}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
