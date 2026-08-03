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
  TipoJuros
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
    parcelasCount: number;
    dataEmprestimo: string;
    vencimento: string;
    observacoes?: string;
  }) => string;

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
    dataVencimentoInicial: string
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

  exportarBackupJson: () => void;
  importarBackupJson: (fileContent: string) => boolean;
  
  // Quick filters / modal triggers
  selectedClienteForHistory: Cliente | null;
  setSelectedClienteForHistory: (cliente: Cliente | null) => void;
  selectedEmprestimoForContract: Emprestimo | null;
  setSelectedEmprestimoForContract: (emp: Emprestimo | null) => void;
  
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

  // Sync state to local storage with AES-256-GCM encryption
  useEffect(() => {
    setEncryptedStorage(`${LOCAL_STORAGE_KEY}_clientes`, clientes);
  }, [clientes]);

  useEffect(() => {
    setEncryptedStorage(`${LOCAL_STORAGE_KEY}_emprestimos`, emprestimos);
  }, [emprestimos]);

  useEffect(() => {
    setEncryptedStorage(`${LOCAL_STORAGE_KEY}_pagamentos`, pagamentos);
  }, [pagamentos]);

  useEffect(() => {
    setEncryptedStorage(`${LOCAL_STORAGE_KEY}_notificacoes`, notificacoes);
  }, [notificacoes]);

  useEffect(() => {
    setEncryptedStorage(`${LOCAL_STORAGE_KEY}_configuracoes`, configuracoes);
  }, [configuracoes]);

  useEffect(() => {
    setEncryptedStorage(`${LOCAL_STORAGE_KEY}_perfil`, perfil);
  }, [perfil]);

  useEffect(() => {
    setEncryptedStorage(`${LOCAL_STORAGE_KEY}_usuarios`, usuarios);
  }, [usuarios]);

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
    dataVencimentoInicial: string
  ): SimularEmprestimoResult => {
    let valorTotalJuros = 0;
    let valorTotal = 0;

    if (tipoJuros === 'Simples' || tipoJuros === 'Fixo') {
      // Juros simples total = valor * (taxa/100) * (parcelasCount / 1 ou pro-rata)
      // Standard loan practice in market: Taxa mensal * N parcelas
      valorTotalJuros = valor * (taxaPercentual / 100) * parcelasCount;
      valorTotal = valor + valorTotalJuros;
    } else {
      // Composto M = P * (1 + i)^n
      const factor = Math.pow(1 + taxaPercentual / 100, parcelasCount);
      valorTotal = valor * factor;
      valorTotalJuros = valorTotal - valor;
    }

    const valorParcela = parcelasCount > 0 ? valorTotal / parcelasCount : 0;

    const tabelaParcelas: Omit<Parcela, 'id'>[] = [];
    let saldoDevedorAcumulado = valorTotal;

    const dtBase = new Date(dataVencimentoInicial || new Date());

    for (let i = 1; i <= parcelasCount; i++) {
      const dt = new Date(dtBase);
      dt.setMonth(dt.getMonth() + (i - 1));
      const vencimento = dt.toISOString().split('T')[0];

      const jurosParcela = valorTotalJuros / parcelasCount;
      const amortizacaoParcela = (valor / parcelasCount);
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
      valorEmprestado: valor,
      jurosPercentual: taxaPercentual,
      tipoJuros,
      valorTotalJuros: Math.round(valorTotalJuros * 100) / 100,
      valorTotal: Math.round(valorTotal * 100) / 100,
      parcelasCount,
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
    parcelasCount: number;
    dataEmprestimo: string;
    vencimento: string;
    observacoes?: string;
  }): string => {
    const sim = simularEmprestimo(
      data.valorEmprestado,
      data.juros,
      data.parcelasCount,
      data.tipoJuros,
      data.vencimento
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
      setPerfil(found);
    }
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
        exportarBackupJson,
        importarBackupJson,
        selectedClienteForHistory,
        setSelectedClienteForHistory,
        selectedEmprestimoForContract,
        setSelectedEmprestimoForContract,
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
