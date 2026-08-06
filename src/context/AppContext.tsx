import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Cliente,
  Emprestimo,
  Pagamento,
  Notificacao,
  ConfiguracoesApp,
  PerfilUsuario,
  ModuloApp,
  Parcela,
  StatusParcela,
  StatusCliente,
  TipoJuros,
  Periodicidade
} from '../types';
import {
  initialClientes,
  initialEmprestimos,
  initialPagamentos,
  initialNotificacoes,
  initialConfiguracoes,
  initialPerfil,
  initialUsuarios,
} from '../data/mockData';
import { getEncryptedStorage, setEncryptedStorage } from '../utils/crypto';

interface SimularEmprestimoResult {
  valorEmprestado: number;
  jurosPercentual: number;
  tipoJuros: TipoJuros;
  periodicidade: Periodicidade;
  valorTotalJuros: number;
  valorTotal: number;
  parcelasCount: number;
  valorParcela: number;
  tabelaParcelas: Omit<Parcela, 'id'>[];
}

interface AppContextType {
  clientes: Cliente[];
  emprestimos: Emprestimo[];
  pagamentos: Pagamento[];
  notificacoes: Notificacao[];
  configuracoes: ConfiguracoesApp;
  perfil: PerfilUsuario;
  usuarios: PerfilUsuario[];
  activeModule: ModuloApp;
  setActiveModule: (mod: ModuloApp) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  
  // Handlers
  addCliente: (cliente: Omit<Cliente, 'id' | 'createdAt'>) => string;
  updateCliente: (id: string, cliente: Partial<Cliente>) => void;
  deleteCliente: (id: string) => void;
  
  addEmprestimo: (emprestimoData: {
    clienteID: string;
    valorEmprestado: number;
    juros: number;
    tipoJuros: TipoJuros;
    periodicidade?: Periodicidade;
    parcelasCount: number;
    dataEmprestimo: string;
    vencimento: string;
    observacoes?: string;
  }) => string;
  deleteEmprestimo: (id: string) => void;

  registrarPagamento: (pagamentoData: {
    emprestimoID: string;
    parcelaNumero: number;
    valorPago: number;
    formaPagamento: Pagamento['formaPagamento'];
  }) => void;

  simularEmprestimo: (
    valor: number,
    taxaPercentual: number,
    parcelasCount: number,
    tipoJuros: TipoJuros,
    dataVencimentoInicial: string,
    periodicidade?: Periodicidade
  ) => SimularEmprestimoResult;

  marcarNotificacaoLida: (id: string) => void;
  marcarTodasNotificacoesLidas: () => void;
  updateConfiguracoes: (config: Partial<ConfiguracoesApp>) => void;
  updateDinheiroCaixa: (novoValor: number) => void;
  updatePerfil: (perf: Partial<PerfilUsuario>) => void;
  
  // Multi-user Account Management
  addUsuario: (userData: Omit<PerfilUsuario, 'id' | 'biometriaAtiva' | 'createdAt'>) => { success: boolean; message?: string };
  switchUsuario: (id: string) => void;
  deleteUsuario: (id: string) => { success: boolean; message?: string };
  registrarTentativaFalha: (id: string) => { bloqueado: boolean; tentativasRestantes: number; tempoBloqueioMinutos: number };
  desbloquearUsuario: (id: string) => void;
  resetTentativas: (id: string) => void;

  exportarBackupJson: () => void;
  importarBackupJson: (fileContent: string) => boolean;
  
  // Quick filters / modal triggers
  selectedClienteForHistory: Cliente | null;
  setSelectedClienteForHistory: (cliente: Cliente | null) => void;
  selectedEmprestimoForContract: Emprestimo | null;
  setSelectedEmprestimoForContract: (emp: Emprestimo | null) => void;
  
  // Cross-device sync status
  syncStatus: { isOnline: boolean; lastSyncTime: string };
  manualSync: () => Promise<void>;

  // Dashboard Metrics
  indicadores: {
    dinheiroCaixa: number;
    totalEmprestado: number;
    totalRecebido: number;
    jurosRecebidos: number;
    clientesAtivos: number;
    clientesInadimplentes: number;
    parcelasVencidasCount: number;
    parcelasVencidasValor: number;
    parcelasParaVencerCount: number;
    parcelasParaVencerValor: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'ggg_financeira_prod_v2';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clientes, setClientes] = useState<Cliente[]>(() => {
    return getEncryptedStorage(`${LOCAL_STORAGE_KEY}_clientes`, initialClientes);
  });

  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>(() => {
    return getEncryptedStorage(`${LOCAL_STORAGE_KEY}_emprestimos`, initialEmprestimos);
  });

  const [pagamentos, setPagamentos] = useState<Pagamento[]>(() => {
    return getEncryptedStorage(`${LOCAL_STORAGE_KEY}_pagamentos`, initialPagamentos);
  });

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>(() => {
    return getEncryptedStorage(`${LOCAL_STORAGE_KEY}_notificacoes`, initialNotificacoes);
  });

  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesApp>(() => {
    return getEncryptedStorage(`${LOCAL_STORAGE_KEY}_configuracoes`, initialConfiguracoes);
  });

  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>(() => {
    return getEncryptedStorage(`${LOCAL_STORAGE_KEY}_usuarios`, initialUsuarios);
  });

  const [perfil, setPerfil] = useState<PerfilUsuario>(() => {
    const saved = getEncryptedStorage<PerfilUsuario | null>(`${LOCAL_STORAGE_KEY}_perfil`, null);
    if (saved) return saved;
    return usuarios[0] || initialPerfil;
  });

  const [activeModule, setActiveModule] = useState<ModuloApp>('Dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); // Authentication required before opening dashboard
  
  const [selectedClienteForHistory, setSelectedClienteForHistory] = useState<Cliente | null>(null);
  const [selectedEmprestimoForContract, setSelectedEmprestimoForContract] = useState<Emprestimo | null>(null);

  // Cross-device Sync Engine
  const lastServerTimestampRef = React.useRef<number>(0);
  const isUpdatingFromRemoteRef = React.useRef<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{ isOnline: boolean; lastSyncTime: string }>({
    isOnline: true,
    lastSyncTime: 'Iniciando...',
  });

  const fetchSharedState = React.useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      if (!res.ok) {
        setSyncStatus((prev) => ({ ...prev, isOnline: false }));
        return;
      }
      const data = await res.json();

      if (data.empty) {
        // First run on server: publish current local state
        const payload = {
          clientes,
          emprestimos,
          pagamentos,
          notificacoes,
          configuracoes,
          usuarios,
          perfil,
        };
        const postRes = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (postRes.ok) {
          const postData = await postRes.json();
          lastServerTimestampRef.current = postData.lastUpdated || Date.now();
          setSyncStatus({ isOnline: true, lastSyncTime: new Date().toLocaleTimeString('pt-BR') });
        }
      } else if (data.lastUpdated && data.lastUpdated > lastServerTimestampRef.current) {
        // Server has newer changes from another device!
        isUpdatingFromRemoteRef.current = true;
        if (Array.isArray(data.clientes)) setClientes(data.clientes);
        if (Array.isArray(data.emprestimos)) setEmprestimos(data.emprestimos);
        if (Array.isArray(data.pagamentos)) setPagamentos(data.pagamentos);
        if (Array.isArray(data.notificacoes)) setNotificacoes(data.notificacoes);
        if (data.configuracoes) setConfiguracoes(data.configuracoes);
        if (Array.isArray(data.usuarios)) setUsuarios(data.usuarios);
        if (data.perfil) setPerfil(data.perfil);

        lastServerTimestampRef.current = data.lastUpdated;
        setSyncStatus({ isOnline: true, lastSyncTime: new Date().toLocaleTimeString('pt-BR') });
      } else {
        setSyncStatus({ isOnline: true, lastSyncTime: new Date().toLocaleTimeString('pt-BR') });
      }
    } catch (err) {
      console.warn('Sync server connection warning:', err);
      setSyncStatus((prev) => ({ ...prev, isOnline: false }));
    }
  }, []);

  const manualSync = async () => {
    await fetchSharedState();
  };

  // Poll server for changes every 2.5 seconds
  useEffect(() => {
    fetchSharedState();
    const interval = setInterval(() => {
      fetchSharedState();
    }, 2500);
    return () => clearInterval(interval);
  }, [fetchSharedState]);

  // Sync state locally (localStorage) and push local edits to server
  useEffect(() => {
    setEncryptedStorage(`${LOCAL_STORAGE_KEY}_clientes`, clientes);
    setEncryptedStorage(`${LOCAL_STORAGE_KEY}_emprestimos`, emprestimos);
    setEncryptedStorage(`${LOCAL_STORAGE_KEY}_pagamentos`, pagamentos);
    setEncryptedStorage(`${LOCAL_STORAGE_KEY}_notificacoes`, notificacoes);
    setEncryptedStorage(`${LOCAL_STORAGE_KEY}_configuracoes`, configuracoes);
    setEncryptedStorage(`${LOCAL_STORAGE_KEY}_perfil`, perfil);
    setEncryptedStorage(`${LOCAL_STORAGE_KEY}_usuarios`, usuarios);

    if (isUpdatingFromRemoteRef.current) {
      isUpdatingFromRemoteRef.current = false;
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const payload = {
          clientes,
          emprestimos,
          pagamentos,
          notificacoes,
          configuracoes,
          usuarios,
          perfil,
        };
        const res = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const resData = await res.json();
          lastServerTimestampRef.current = resData.lastUpdated;
          setSyncStatus({ isOnline: true, lastSyncTime: new Date().toLocaleTimeString('pt-BR') });
        }
      } catch (e) {
        console.warn('Failed to send update to server:', e);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [clientes, emprestimos, pagamentos, notificacoes, configuracoes, perfil, usuarios]);

  // Recalculate client statuses based on current loans
  useEffect(() => {
    setClientes((prev) =>
      prev.map((cli) => {
        const cliLoans = emprestimos.filter((e) => e.clienteID === cli.id && e.status !== 'Cancelado');
        if (cliLoans.length === 0) return cli;

        const hasOverdue = cliLoans.some((emp) =>
          emp.parcelas.some((p) => p.status === 'Atrasado')
        );

        const allPaid = cliLoans.every((emp) => emp.status === 'Quitado');

        let newStatus: StatusCliente = cli.status;
        if (hasOverdue) {
          newStatus = 'Inadimplente';
        } else if (allPaid) {
          newStatus = 'Quitado';
        } else {
          newStatus = 'Ativo';
        }

        return newStatus !== cli.status ? { ...cli, status: newStatus } : cli;
      })
    );
  }, [emprestimos]);

  // Simulation calculation
  const simularEmprestimo = (
    valor: number,
    taxaPercentual: number,
    parcelasCount: number,
    tipoJuros: TipoJuros,
    dataVencimentoInicial: string,
    periodicidade: Periodicidade = 'Mensal'
  ): SimularEmprestimoResult => {
    let valorTotalJuros = 0;
    let valorTotal = 0;

    const numValor = Math.max(0, Number(valor) || 0);
    const numTaxa = Math.max(0, Number(taxaPercentual) || 0);
    const numParcelas = Math.max(1, Number(parcelasCount) || 1);

    if (tipoJuros === 'Fixo') {
      // Juros Fixo: Taxa fixa total sobre o empréstimo
      valorTotalJuros = numValor * (numTaxa / 100);
      valorTotal = numValor + valorTotalJuros;
    } else if (tipoJuros === 'Simples') {
      if (periodicidade === 'Diário') {
        // Para diárias, a taxa é o percentual do contrato dividido/distribuído no período
        valorTotalJuros = numValor * (numTaxa / 100);
      } else {
        valorTotalJuros = numValor * (numTaxa / 100) * numParcelas;
      }
      valorTotal = numValor + valorTotalJuros;
    } else {
      // Composto M = P * (1 + i)^n
      const periods = periodicidade === 'Diário' ? 1 : numParcelas;
      const factor = Math.pow(1 + numTaxa / 100, periods);
      valorTotal = numValor * factor;
      valorTotalJuros = valorTotal - numValor;
    }

    const valorParcela = numParcelas > 0 ? valorTotal / numParcelas : 0;

    const tabelaParcelas: Omit<Parcela, 'id'>[] = [];
    let saldoDevedorAcumulado = valorTotal;

    const dateStr = dataVencimentoInicial || new Date().toISOString().split('T')[0];
    const [vYear, vMonth, vDay] = dateStr.split('-').map((n) => parseInt(n, 10));

    for (let i = 1; i <= numParcelas; i++) {
      const dt = new Date(vYear || new Date().getFullYear(), (vMonth || 1) - 1, vDay || 1);

      if (periodicidade === 'Diário') {
        dt.setDate(dt.getDate() + (i - 1));
      } else if (periodicidade === 'Semanal') {
        dt.setDate(dt.getDate() + (i - 1) * 7);
      } else if (periodicidade === 'Quinzenal') {
        dt.setDate(dt.getDate() + (i - 1) * 15);
      } else {
        dt.setMonth(dt.getMonth() + (i - 1));
      }

      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      const vencimento = `${yyyy}-${mm}-${dd}`;

      const jurosParcela = valorTotalJuros / numParcelas;
      const amortizacaoParcela = numValor / numParcelas;
      saldoDevedorAcumulado -= valorParcela;

      tabelaParcelas.push({
        numero: i,
        vencimento,
        valorParcela: Math.round(valorParcela * 100) / 100,
        juros: Math.round(jurosParcela * 100) / 100,
        amortizacao: Math.round(amortizacaoParcela * 100) / 100,
        saldoRestante: Math.max(0, Math.round(saldoDevedorAcumulado * 100) / 100),
        status: 'Em dia',
        valorPagoTotal: 0,
      });
    }

    return {
      valorEmprestado: numValor,
      jurosPercentual: numTaxa,
      tipoJuros,
      periodicidade,
      valorTotalJuros: Math.round(valorTotalJuros * 100) / 100,
      valorTotal: Math.round(valorTotal * 100) / 100,
      parcelasCount: numParcelas,
      valorParcela: Math.round(valorParcela * 100) / 100,
      tabelaParcelas,
    };
  };

  // Add Client
  const addCliente = (clienteData: Omit<Cliente, 'id' | 'createdAt'>): string => {
    const newId = `cli-${Date.now()}`;
    const newCliente: Cliente = {
      ...clienteData,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setClientes((prev) => [newCliente, ...prev]);

    // Notification
    setNotificacoes((prev) => [
      {
        id: `not-${Date.now()}`,
        titulo: 'Novo Cliente Cadastrado',
        mensagem: `Cliente ${clienteData.nome} foi cadastrado com sucesso.`,
        tipo: 'sucesso',
        data: new Date().toISOString().split('T')[0],
        lida: false,
        clienteID: newId,
      },
      ...prev,
    ]);

    return newId;
  };

  // Update Client
  const updateCliente = (id: string, clienteData: Partial<Cliente>) => {
    setClientes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...clienteData } : c))
    );
  };

  // Delete Client
  const deleteCliente = (id: string) => {
    setClientes((prev) => prev.filter((c) => c.id !== id));
  };

  // Add Loan
  const addEmprestimo = (data: {
    clienteID: string;
    valorEmprestado: number;
    juros: number;
    tipoJuros: TipoJuros;
    periodicidade?: Periodicidade;
    parcelasCount: number;
    dataEmprestimo: string;
    vencimento: string;
    observacoes?: string;
  }): string => {
    const periodicidade = data.periodicidade || 'Mensal';
    const sim = simularEmprestimo(
      data.valorEmprestado,
      data.juros,
      data.parcelasCount,
      data.tipoJuros,
      data.vencimento,
      periodicidade
    );

    const empId = `emp-${Date.now()}`;

    const parcelasWithIds: Parcela[] = sim.tabelaParcelas.map((p, idx) => ({
      ...p,
      id: `par-${empId}-${idx + 1}`,
    }));

    const newEmprestimo: Emprestimo = {
      id: empId,
      clienteID: data.clienteID,
      valorEmprestado: data.valorEmprestado,
      juros: data.juros,
      tipoJuros: data.tipoJuros,
      periodicidade,
      valorTotal: sim.valorTotal,
      parcelasCount: data.parcelasCount,
      valorParcela: sim.valorParcela,
      dataEmprestimo: data.dataEmprestimo || new Date().toISOString().split('T')[0],
      vencimento: data.vencimento,
      status: 'Ativo',
      observacoes: data.observacoes,
      parcelas: parcelasWithIds,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setEmprestimos((prev) => [newEmprestimo, ...prev]);

    const cliente = clientes.find((c) => c.id === data.clienteID);
    setNotificacoes((prev) => [
      {
        id: `not-${Date.now()}`,
        titulo: 'Novo Empréstimo Concedido',
        mensagem: `Empréstimo de R$ ${data.valorEmprestado.toLocaleString('pt-BR')} concedido a ${cliente?.nome || 'Cliente'}.`,
        tipo: 'info',
        data: new Date().toISOString().split('T')[0],
        lida: false,
        clienteID: data.clienteID,
        emprestimoID: empId,
      },
      ...prev,
    ]);

    return empId;
  };

  // Delete Loan (Remover empréstimo lançado por engano)
  const deleteEmprestimo = (id: string) => {
    const emp = emprestimos.find((e) => e.id === id);
    if (!emp) return;

    const cliente = clientes.find((c) => c.id === emp.clienteID);

    // 1. Remove loan from state
    setEmprestimos((prev) => prev.filter((e) => e.id !== id));

    // 2. Remove all associated payments
    setPagamentos((prev) => prev.filter((p) => p.emprestimoID !== id));

    // 3. Clear selected loan for contract if it was this one
    if (selectedEmprestimoForContract?.id === id) {
      setSelectedEmprestimoForContract(null);
    }

    // 4. Create notification about deletion
    setNotificacoes((prev) => [
      {
        id: `not-${Date.now()}`,
        titulo: 'Empréstimo Removido',
        mensagem: `O empréstimo de R$ ${emp.valorEmprestado.toLocaleString('pt-BR')} (${cliente?.nome || 'Cliente'}) foi excluído. Indicadores recalculados.`,
        tipo: 'alerta',
        data: new Date().toISOString().split('T')[0],
        lida: false,
        clienteID: emp.clienteID,
      },
      ...prev,
    ]);
  };

  // Register Payment
  const registrarPagamento = (pagamentoData: {
    emprestimoID: string;
    parcelaNumero: number;
    valorPago: number;
    formaPagamento: Pagamento['formaPagamento'];
  }) => {
    const { emprestimoID, parcelaNumero, valorPago, formaPagamento } = pagamentoData;
    const emp = emprestimos.find((e) => e.id === emprestimoID);
    if (!emp) return;

    const nowStr = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Update installment
    const updatedParcelas = emp.parcelas.map((p) => {
      if (p.numero === parcelaNumero) {
        const totalPagoAteAgora = p.valorPagoTotal + valorPago;
        let novoStatus: StatusParcela = 'Parcial';

        if (totalPagoAteAgora >= p.valorParcela) {
          novoStatus = 'Pago';
        }

        return {
          ...p,
          valorPagoTotal: totalPagoAteAgora,
          status: novoStatus,
          dataPagamento: nowStr,
        };
      }
      return p;
    });

    const todosPagos = updatedParcelas.every((p) => p.status === 'Pago');
    const novoStatusEmprestimo = todosPagos ? 'Quitado' : emp.status;

    // Total loan balance remaining
    const totalPagoEmprestimo = updatedParcelas.reduce((acc, p) => acc + p.valorPagoTotal, 0);
    const saldoRestanteTotal = Math.max(0, emp.valorTotal - totalPagoEmprestimo);

    // Update loan
    setEmprestimos((prev) =>
      prev.map((e) =>
        e.id === emprestimoID
          ? {
              ...e,
              parcelas: updatedParcelas,
              status: novoStatusEmprestimo,
            }
          : e
      )
    );

    // Create payment record
    const newPagamento: Pagamento = {
      id: `pag-${Date.now()}`,
      emprestimoID,
      clienteID: emp.clienteID,
      parcelaNumero,
      data: nowStr,
      valorPago,
      formaPagamento,
      saldoRestante: Math.round(saldoRestanteTotal * 100) / 100,
    };

    setPagamentos((prev) => [newPagamento, ...prev]);

    const cliente = clientes.find((c) => c.id === emp.clienteID);
    setNotificacoes((prev) => [
      {
        id: `not-${Date.now()}`,
        titulo: 'Pagamento Registrado',
        mensagem: `Pagamento de R$ ${valorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} recebido de ${cliente?.nome || 'Cliente'} (Parcela ${parcelaNumero}).`,
        tipo: 'sucesso',
        data: new Date().toISOString().split('T')[0],
        lida: false,
        clienteID: emp.clienteID,
        emprestimoID,
      },
      ...prev,
    ]);
  };

  const marcarNotificacaoLida = (id: string) => {
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
  };

  const marcarTodasNotificacoesLidas = () => {
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  };

  const updateConfiguracoes = (config: Partial<ConfiguracoesApp>) => {
    setConfiguracoes((prev) => ({ ...prev, ...config }));
  };

  const updatePerfil = (perf: Partial<PerfilUsuario>) => {
    setPerfil((prev) => {
      const updated = { ...prev, ...perf };
      setUsuarios((prevUsers) =>
        prevUsers.map((u) => (u.id === prev.id ? updated : u))
      );
      return updated;
    });
  };

  const addUsuario = (
    userData: Omit<PerfilUsuario, 'id' | 'biometriaAtiva' | 'createdAt'>
  ): { success: boolean; message?: string } => {
    if (usuarios.length >= 3) {
      return {
        success: false,
        message: 'Limite de 3 administradores atingido. Não é possível cadastrar novas contas.',
      };
    }

    const newUser: PerfilUsuario = {
      ...userData,
      id: `usr-${Date.now()}`,
      cargo: 'Administrador Financeiro',
      biometriaAtiva: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsuarios((prev) => [...prev, newUser]);
    setPerfil(newUser);
    return { success: true };
  };

  const switchUsuario = (id: string) => {
    const found = usuarios.find((u) => u.id === id);
    if (found) {
      // Check if user lock expired
      if (found.bloqueadoAte && new Date(found.bloqueadoAte).getTime() <= Date.now()) {
        const unlocked = { ...found, tentativasIncorretas: 0, bloqueadoAte: null };
        setUsuarios((prev) => prev.map((u) => (u.id === id ? unlocked : u)));
        setPerfil(unlocked);
      } else {
        setPerfil(found);
      }
    }
  };

  const registrarTentativaFalha = (id: string): { bloqueado: boolean; tentativasRestantes: number; tempoBloqueioMinutos: number } => {
    let result = { bloqueado: false, tentativasRestantes: 2, tempoBloqueioMinutos: 5 };
    setUsuarios((prevUsers) => {
      return prevUsers.map((u) => {
        if (u.id === id) {
          const falhas = (u.tentativasIncorretas || 0) + 1;
          const estaBloqueado = falhas >= 3;
          const bloqueioIso = estaBloqueado ? new Date(Date.now() + 5 * 60 * 1000).toISOString() : u.bloqueadoAte;

          result = {
            bloqueado: estaBloqueado,
            tentativasRestantes: Math.max(0, 3 - falhas),
            tempoBloqueioMinutos: 5,
          };

          const updated = {
            ...u,
            tentativasIncorretas: falhas,
            bloqueadoAte: bloqueioIso,
          };

          if (perfil.id === id) {
            setPerfil(updated);
          }

          return updated;
        }
        return u;
      });
    });
    return result;
  };

  const resetTentativas = (id: string) => {
    setUsuarios((prevUsers) =>
      prevUsers.map((u) => {
        if (u.id === id) {
          const updated = { ...u, tentativasIncorretas: 0, bloqueadoAte: null };
          if (perfil.id === id) setPerfil(updated);
          return updated;
        }
        return u;
      })
    );
  };

  const desbloquearUsuario = (id: string) => {
    resetTentativas(id);
  };

  const deleteUsuario = (id: string): { success: boolean; message?: string } => {
    if (usuarios.length <= 1) {
      return {
        success: false,
        message: 'O sistema deve possuir pelo menos 1 administrador financeiro cadastrado.',
      };
    }
    const filtered = usuarios.filter((u) => u.id !== id);
    setUsuarios(filtered);
    if (perfil.id === id) {
      setPerfil(filtered[0]);
    }
    return { success: true };
  };

  const exportarBackupJson = () => {
    const state = {
      clientes,
      emprestimos,
      pagamentos,
      notificacoes,
      configuracoes,
      perfil,
      exportDate: new Date().toISOString(),
      app: 'GGG Financeira',
    };
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ggg_financeira_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importarBackupJson = (fileContent: string): boolean => {
    try {
      const parsed = JSON.parse(fileContent);
      if (parsed.clientes && parsed.emprestimos) {
        setClientes(parsed.clientes);
        setEmprestimos(parsed.emprestimos);
        if (parsed.pagamentos) setPagamentos(parsed.pagamentos);
        if (parsed.notificacoes) setNotificacoes(parsed.notificacoes);
        if (parsed.configuracoes) setConfiguracoes(parsed.configuracoes);
        if (parsed.perfil) setPerfil(parsed.perfil);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Compute Indicators
  const totalEmprestado = emprestimos
    .filter((e) => e.status === 'Ativo' || e.status === 'Atrasado')
    .reduce((acc, e) => acc + e.valorEmprestado, 0);

  const totalRecebido = pagamentos.reduce((acc, p) => acc + p.valorPago, 0);

  // Interest received: total paid - amortized capital portion paid
  let jurosRecebidos = 0;
  emprestimos.forEach((emp) => {
    emp.parcelas.forEach((par) => {
      if (par.valorPagoTotal > 0) {
        const proporcaoJuros = par.juros / par.valorParcela;
        jurosRecebidos += par.valorPagoTotal * (isNaN(proporcaoJuros) ? 0 : proporcaoJuros);
      }
    });
  });

  const updateDinheiroCaixa = (novoValor: number) => {
    const novoSaldoInicial = novoValor - totalRecebido + totalEmprestado;
    updateConfiguracoes({ saldoInicialCaixa: novoSaldoInicial });
  };

  const baseCaixa = configuracoes.saldoInicialCaixa ?? 0;
  const dinheiroCaixa = baseCaixa + totalRecebido - totalEmprestado;

  const clientesAtivos = clientes.filter((c) => c.status === 'Ativo').length;
  const clientesInadimplentes = clientes.filter((c) => c.status === 'Inadimplente').length;

  let parcelasVencidasCount = 0;
  let parcelasVencidasValor = 0;
  let parcelasParaVencerCount = 0;
  let parcelasParaVencerValor = 0;

  emprestimos.forEach((emp) => {
    if (emp.status !== 'Cancelado' && emp.status !== 'Quitado') {
      emp.parcelas.forEach((par) => {
        if (par.status === 'Atrasado') {
          parcelasVencidasCount += 1;
          parcelasVencidasValor += (par.valorParcela - par.valorPagoTotal);
        } else if (par.status === 'Em dia' || par.status === 'Vence hoje') {
          parcelasParaVencerCount += 1;
          parcelasParaVencerValor += (par.valorParcela - par.valorPagoTotal);
        }
      });
    }
  });

  const indicadores = {
    dinheiroCaixa: Math.round(dinheiroCaixa * 100) / 100,
    totalEmprestado: Math.round(totalEmprestado * 100) / 100,
    totalRecebido: Math.round(totalRecebido * 100) / 100,
    jurosRecebidos: Math.round(jurosRecebidos * 100) / 100,
    clientesAtivos,
    clientesInadimplentes,
    parcelasVencidasCount,
    parcelasVencidasValor: Math.round(parcelasVencidasValor * 100) / 100,
    parcelasParaVencerCount,
    parcelasParaVencerValor: Math.round(parcelasParaVencerValor * 100) / 100,
  };

  return (
    <AppContext.Provider
      value={{
        clientes,
        emprestimos,
        pagamentos,
        notificacoes,
        configuracoes,
        perfil,
        usuarios,
        activeModule,
        setActiveModule,
        isLoggedIn,
        setIsLoggedIn,
        addCliente,
        updateCliente,
        deleteCliente,
        addEmprestimo,
        deleteEmprestimo,
        registrarPagamento,
        simularEmprestimo,
        marcarNotificacaoLida,
        marcarTodasNotificacoesLidas,
        updateConfiguracoes,
        updateDinheiroCaixa,
        updatePerfil,
        addUsuario,
        switchUsuario,
        deleteUsuario,
        registrarTentativaFalha,
        desbloquearUsuario,
        resetTentativas,
        exportarBackupJson,
        importarBackupJson,
        selectedClienteForHistory,
        setSelectedClienteForHistory,
        selectedEmprestimoForContract,
        setSelectedEmprestimoForContract,
        syncStatus,
        manualSync,
        indicadores,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
