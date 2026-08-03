import React from 'react';
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NotificationDrawerProps {
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ onClose }) => {
  const { notificacoes, marcarNotificacaoLida, marcarTodasNotificacoesLidas } = useApp();

  return (
    <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-xl border border-[#D4AF37]/30 bg-[#0A0A0A] p-4 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[#D4AF37]" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Central de Alertas</h3>
        </div>
        <div className="flex items-center gap-2">
          {notificacoes.some((n) => !n.lida) && (
            <button
              onClick={marcarTodasNotificacoesLidas}
              className="flex items-center gap-1 text-[11px] font-medium text-[#D4AF37] hover:underline"
            >
              <CheckCheck className="h-3 w-3" />
              Marcar todas
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded p-1 text-white/50 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
        {notificacoes.length === 0 ? (
          <div className="py-8 text-center text-xs text-white/40">
            Nenhuma notificação no momento.
          </div>
        ) : (
          notificacoes.map((notif) => {
            const getIcon = () => {
              switch (notif.tipo) {
                case 'urgente':
                  return <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />;
                case 'alerta':
                  return <AlertTriangle className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />;
                case 'sucesso':
                  return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />;
                default:
                  return <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />;
              }
            };

            return (
              <div
                key={notif.id}
                onClick={() => marcarNotificacaoLida(notif.id)}
                className={`flex items-start gap-3 rounded-lg border p-2.5 transition-all cursor-pointer ${
                  notif.lida
                    ? 'border-white/5 bg-white/5 text-white/40'
                    : 'border-[#D4AF37]/20 bg-[#D4AF37]/5 text-white hover:border-[#D4AF37]/40'
                }`}
              >
                {getIcon()}
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{notif.titulo}</span>
                    <span className="text-[10px] text-white/40">{notif.data}</span>
                  </div>
                  <p className="mt-1 text-white/70 leading-snug">{notif.mensagem}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
