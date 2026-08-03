import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';
import { DashboardView } from './components/DashboardView';
import { ClientesView } from './components/ClientesView';
import { EmprestimosView } from './components/EmprestimosView';
import { CobrancasView } from './components/CobrancasView';
import { RelatoriosView } from './components/RelatoriosView';
import { ContratosView } from './components/ContratosView';
import { AgendaView } from './components/AgendaView';
import { ConfiguracoesView } from './components/ConfiguracoesView';
import { PerfilView } from './components/PerfilView';

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

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans antialiased selection:bg-[#D4AF37] selection:text-black">
      {/* Login Screen Overlay when logged out */}
      {!isLoggedIn && <LoginModal />}

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
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
