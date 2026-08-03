import { Cliente, Emprestimo, Pagamento, Notificacao, ConfiguracoesApp, PerfilUsuario } from '../types';

// Utility to generate YYYY-MM-DD relative to today
const getRelativeDate = (daysOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

const todayStr = getRelativeDate(0);
const yesterdayStr = getRelativeDate(-1);
const tomorrowStr = getRelativeDate(1);
const in5DaysStr = getRelativeDate(5);
const in15DaysStr = getRelativeDate(15);
const ago10DaysStr = getRelativeDate(-10);
const ago30DaysStr = getRelativeDate(-30);

export const initialClientes: Cliente[] = [];

export const initialEmprestimos: Emprestimo[] = [];

export const initialPagamentos: Pagamento[] = [];

export const initialNotificacoes: Notificacao[] = [];

export const initialConfiguracoes: ConfiguracoesApp = {
  nomeEmpresa: 'GGG Financeira',
  cnpj: '38.492.103/0001-89',
  chavePix: 'financeira@ggg.com.br',
  tipoChavePix: 'Email',
  favorecidoPix: 'G.G.G Gestão de Crédito e Finanças Ltda',
  taxaJurosPadrao: 10,
  tipoJurosPadrao: 'Simples',
  diasAvisoVencimento: 2,
  exigirBiometria: true,
  criptografiaAtiva: true,
  backupDiarioAutomatico: true,
  ultimoBackup: todayStr,
  multaAtrasoPercentual: 2,
  jurosMoraDiarioPercentual: 0.33,
  saldoInicialCaixa: 0,
};

export const initialPerfil: PerfilUsuario = {
  id: 'usr-001',
  nome: 'Guilherme G. Gualberto',
  cargo: 'Administrador Financeiro',
  email: 'admin@gggfinanceira.com.br',
  telefone: '(11) 99999-8888',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  pinSeguranca: '1234',
  senhaForte: 'Ggg@2026#Secure',
  tipoAutenticacao: 'pin',
  biometriaAtiva: true,
  createdAt: '2026-01-01',
};

export const initialUsuarios: PerfilUsuario[] = [
  initialPerfil,
];
