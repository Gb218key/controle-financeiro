import React, { useState, Component, ReactNode, ErrorInfo } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';
import { DashboardView } from './components/DashboardView';
import { ClientesView } from './components/ClientesView';
import { EmprestimosView } from './components/EmprestimosView';
import { CobrancasView } from './components/CobrancasView';
import { BaixaJurosView } from './components/BaixaJurosView';
import { RelatoriosView } from './components/RelatoriosView';
import { ContratosView } from './components/ContratosView';
import { AgendaView } from './components/AgendaView';
import { ConfiguracoesView } from './components/ConfiguracoesView';
import { PerfilView } from './components/PerfilView';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (Component as any)<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full rounded-2xl border border-amber-500/30 bg-zinc-900 p-8 shadow-2xl space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-zinc-100">Instabilidade Temporária Evitada</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Detectamos uma inconsistência temporária na visualização. Todos os seus dados continuam 100% seguros no sistema.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 px-5 py-3 text-xs font-black text-black shadow-lg hover:brightness-110 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Recarregar e Continuar</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const MainLayout: React.FC = () => {
  const { activeModule, setActiveModule, isLoggedIn } = useApp();
  const [openNovoClienteDirect, setOpenNovoClienteDirect] = useState(false);
  const [openNovoEmprestimoDirect, setOpenNovoEmprestimoDirect] = useState(false);

  const handleOpenNovoCliente = () => {
    setOpenNovoClienteDirect(true);
    setActiveModule('Clientes');
  };

  const handleOpenNovoEmprestimo = () => {
    setOpenNovoEmprestimoDirect(true);
    setActiveModule('Empréstimos');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#050505] text-white font-sans antialiased selection:bg-[#D4AF37] selection:text-black">
        <LoginModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans antialiased selection:bg-[#D4AF37] selection:text-black">
      {/* Sidebar Navigation */}
      <Sidebar
        onOpenNovoCliente={handleOpenNovoCliente}
        onOpenNovoEmprestimo={handleOpenNovoEmprestimo}
      />

      {/* Main Content Area */}
      <div className="pl-64 flex flex-col min-h-screen">
        <Header
          onOpenNovoCliente={handleOpenNovoCliente}
          onOpenNovoEmprestimo={handleOpenNovoEmprestimo}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeModule === 'Dashboard' && (
            <DashboardView
              onOpenNovoCliente={handleOpenNovoCliente}
              onOpenNovoEmprestimo={handleOpenNovoEmprestimo}
            />
          )}

          {activeModule === 'Clientes' && (
            <ClientesView initialOpenNovo={openNovoClienteDirect} />
          )}

          {activeModule === 'Empréstimos' && (
            <EmprestimosView initialOpenNovo={openNovoEmprestimoDirect} />
          )}

          {activeModule === 'Baixa de Juros' && <BaixaJurosView />}

          {activeModule === 'Cobranças' && <CobrancasView />}

          {activeModule === 'Relatórios' && <RelatoriosView />}

          {activeModule === 'Contratos' && <ContratosView />}

          {activeModule === 'Agenda' && <AgendaView />}

          {activeModule === 'Configurações' && <ConfiguracoesView />}

          {activeModule === 'Perfil' && <PerfilView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ErrorBoundary>
  );
}
