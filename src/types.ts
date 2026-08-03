export type StatusCliente = 'Ativo' | 'Inadimplente' | 'Quitado' | 'Inativo';

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  rg: string;
  telefone: string;
  whatsapp: string;
  endereco: string;
  cidade: string;
  estado: string;
  fotoDocumento?: string;
  observacao?: string;
  status: StatusCliente;
  createdAt: string;
}

export type StatusParcela = 'Em dia' | 'Vence hoje' | 'Atrasado' | 'Pago' | 'Parcial';

export interface Parcela {
  id: string;
  numero: number;
  vencimento: string; // YYYY-MM-DD
  valorParcela: number;
  juros: number;
  amortizacao: number;
  saldoRestante: number;
  status: StatusParcela;
  valorPagoTotal: number;
  dataPagamento?: string;
}

export type StatusEmprestimo = 'Ativo' | 'Quitado' | 'Atrasado' | 'Cancelado';
export type TipoJuros = 'Simples' | 'Composto' | 'Fixo';

export interface Emprestimo {
  id: string;
  clienteID: string;
  valorEmprestado: number;
  juros: number; // Porcentagem mensal (ex: 10)
  tipoJuros: TipoJuros;
  valorTotal: number;
  parcelasCount: number;
  valorParcela: number;
  dataEmprestimo: string; // YYYY-MM-DD
  vencimento: string; // YYYY-MM-DD (Primeira parcela)
  status: StatusEmprestimo;
  observacoes?: string;
  parcelas: Parcela[];
  createdAt: string;
}

export interface Pagamento {
  id: string;
  emprestimoID: string;
  clienteID: string;
  parcelaNumero: number;
  data: string; // YYYY-MM-DD HH:mm
  valorPago: number;
  formaPagamento: 'PIX' | 'Dinheiro' | 'Transferência' | 'Cartão' | 'Outro';
  saldoRestante: number;
  comprovanteNota?: string;
}

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'urgente' | 'alerta' | 'info' | 'sucesso';
  data: string;
  lida: boolean;
  clienteID?: string;
  emprestimoID?: string;
}

export interface ConfiguracoesApp {
  nomeEmpresa: string;
  cnpj: string;
  chavePix: string;
  tipoChavePix: 'CPF' | 'CNPJ' | 'Email' | 'Telefone' | 'Aleatoria';
  favorecidoPix: string;
  taxaJurosPadrao: number;
  tipoJurosPadrao: TipoJuros;
  diasAvisoVencimento: number;
  exigirBiometria: boolean;
  criptografiaAtiva: boolean;
  backupDiarioAutomatico: boolean;
  ultimoBackup?: string;
  multaAtrasoPercentual: number;
  jurosMoraDiarioPercentual: number;
  saldoInicialCaixa?: number;
}

export type TipoAutenticacao = 'pin' | 'senha';

export interface PerfilUsuario {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  telefone: string;
  avatar?: string;
  pinSeguranca: string;
  senhaForte?: string;
  tipoAutenticacao?: TipoAutenticacao;
  biometriaAtiva: boolean;
  tentativasIncorretas?: number;
  bloqueadoAte?: string | null;
  createdAt?: string;
}

export type ModuloApp = 
  | 'Dashboard' 
  | 'Clientes' 
  | 'Empréstimos' 
  | 'Cobranças' 
  | 'Relatórios' 
  | 'Contratos' 
  | 'Agenda' 
  | 'Configurações' 
  | 'Perfil';
