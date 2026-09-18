export type TransactionType = 'ENTRADA' | 'SAIDA';

export type TransactionStatus =
  | 'PAGO'
  | 'RECEBIDO'
  | 'PENDENTE'
  | 'VENCIDO'
  | 'ATRASADO'
  | 'CANCELADO';

export type PaymentMethod =
  | 'DINHEIRO'
  | 'PIX'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'BOLETO'
  | 'TRANSFERENCIA'
  | 'OUTRO';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT_ADMIN' | 'USER';
export type UserStatus = 'ATIVO' | 'BLOQUEADO' | 'PENDENTE' | 'EXCLUIDO';

export interface Company {
  id: string;
  name: string;
  cnpj?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  status: 'ATIVO' | 'BLOQUEADO';
  blockedAt?: string | null;
  blockedReason?: string | null;
  createdAt: string;
  usersCount?: number;
  activeUsersCount?: number;
  latestLogin?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  companyId?: string | null;
  company?: {
    id: string;
    name: string;
    cnpj?: string | null;
    status: string;
  } | null;
  firstLoginAt?: string | null;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  lastLoginDevice?: string | null;
  lastLoginBrowser?: string | null;
  loginCount?: number;
  failedLoginAttempts?: number;
  lastPasswordChangeAt?: string | null;
  blockedAt?: string | null;
  blockedReason?: string | null;
  blockedByUserId?: string | null;
  deletedAt?: string | null;
  createdAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    company?: { name: string } | null;
  };
  ipAddress?: string | null;
  userAgent?: string | null;
  device?: string | null;
  browser?: string | null;
  isActive: boolean;
  lastActivityAt: string;
  expiresAt: string;
  createdAt: string;
}

export interface LoginHistoryItem {
  id: string;
  userId?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  email: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED' | string;
  ipAddress?: string | null;
  device?: string | null;
  browser?: string | null;
  failureReason?: string | null;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  adminUserId?: string | null;
  adminUser?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
  targetUserId?: string | null;
  targetUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
  companyId?: string | null;
  company?: {
    id: string;
    name: string;
  } | null;
  action: string;
  description: string;
  metadata?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface InvitationItem {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId?: string | null;
  company?: { id: string; name: string } | null;
  token: string;
  status: 'PENDENTE' | 'ACEITO' | 'EXPIRADO' | 'CANCELADO' | string;
  expiresAt: string;
  createdById?: string | null;
  createdBy?: { id: string; name: string; email: string } | null;
  acceptedAt?: string | null;
  createdAt: string;
}

export interface AdminDashboardData {
  metrics: {
    users: {
      total: number;
      active: number;
      blocked: number;
      pending: number;
      neverLoggedIn: number;
    };
    companies: {
      total: number;
      active: number;
      blocked: number;
    };
    accesses: {
      today: number;
      last7Days: number;
      last30Days: number;
    };
    alerts: {
      inactiveOver30Days: number;
      neverLoggedIn: number;
      blockedUsers: number;
      pendingInvitations: number;
    };
  };
  recentLogins: LoginHistoryItem[];
  recentAuditLogs: AuditLogItem[];
}

export interface Category {
  id: string;
  userId?: string | null;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  categoryId?: string | null;
  category?: Category | null;
  type: TransactionType;
  description: string;
  amount: number;
  date: string;
  dueDate?: string | null;
  paymentDate?: string | null;
  status: TransactionStatus;
  paymentMethod: PaymentMethod | string;
  isFixed: boolean;
  subCategory?: string | null;
  notes?: string | null;
  recurringExpenseId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecurringExpense {
  id: string;
  userId: string;
  categoryId?: string | null;
  category?: Category | null;
  name: string;
  amount: number;
  dueDay: number;
  paymentMethod: PaymentMethod | string;
  recurrence: 'MENSAL' | 'SEMANAL' | 'ANUAL' | string;
  isActive: boolean;
  autoGenerate: boolean;
  notes?: string | null;
  createdAt?: string;
}

export interface ReceivableAccount {
  id: string;
  userId: string;
  categoryId?: string | null;
  category?: Category | null;
  debtorName: string;
  description: string;
  amount: number;
  expectedDate: string;
  receivedDate?: string | null;
  status: 'A_RECEBER' | 'RECEBIDO' | 'ATRASADO' | 'CANCELADO' | string;
  notes?: string | null;
  createdAt?: string;
}

export interface DashboardCards {
  saldoAtual: number;
  saldoPrevisto: number;
  totalEntradasGeral: number;
  totalSaidasGeral: number;
  totalEntradasRecebidas: number;
  totalDespesasPagas: number;
  totalValoresAReceber: number;
  totalContasVencidas: number;
  totalContasPendentes: number;
}

export interface DashboardResumoMes {
  mes: number;
  ano: number;
  entradas: number;
  saidas: number;
  saldo: number;
  contasPagas: number;
  contasPendentes: number;
  aReceber: number;
}

export interface DashboardIndicadores {
  contasPagas: number;
  contasPendentes: number;
  contasVencidas: number;
  valoresAReceber: number;
  totalAReceberGeral: number;
  totalAtrasadoReceber: number;
  totalRecebidoContas: number;
}

export interface CategoryExpense {
  name: string;
  amount: number;
  color: string;
}

export interface DashboardAlert {
  id: string;
  type: 'vencida' | 'vencendo_hoje' | 'vencendo_amanha' | 'receber_hoje' | 'receber_atrasado';
  title: string;
  description: string;
  amount: number;
  date: string;
  severity: 'red' | 'yellow' | 'blue' | 'green';
}

export interface DashboardData {
  cards: DashboardCards;
  resumoMes: DashboardResumoMes;
  indicadores: DashboardIndicadores;
  topCategory: {
    name: string;
    amount: number;
    percentage: number;
    color: string;
  } | null;
  gastosPorCategoria: CategoryExpense[];
  gastosFixosVsVariaveis: {
    fixos: number;
    variaveis: number;
  };
  valoresPagosVsPendentes: {
    pagos: number;
    pendentes: number;
  };
  receivablesDistribution: {
    aReceber: number;
    recebido: number;
    atrasado: number;
  };
  monthlyHistory: Array<{
    label: string;
    entradas: number;
    saidas: number;
    saldo: number;
  }>;
  alerts: DashboardAlert[];
}

export interface FinancialReportData {
  period: string;
  startDate: string;
  endDate: string;
  fluxoDeCaixa: {
    totalEntradas: number;
    totalSaidas: number;
    saldo: number;
    totalEntradasRecebidas: number;
    totalSaidasPagas: number;
  };
  entradas: {
    total: number;
    porCategoria: CategoryExpense[];
  };
  saidas: {
    total: number;
    fixos: number;
    variaveis: number;
    porCategoria: CategoryExpense[];
    maiorCategoria: CategoryExpense | null;
    maiorGastoIndividual: Transaction | null;
    menorCategoria: CategoryExpense | null;
  };
  analiseGastos: {
    insights: string[];
    comparacaoMesAnterior: {
      mesAtual: number;
      mesAnterior: number;
      variacaoPercentual: number;
    };
  };
}

export interface CalendarEvent {
  id: string;
  source: 'transaction' | 'receivable';
  sourceId: string;
  title: string;
  amount: number;
  date: string;
  type: TransactionType;
  status: string;
  categoryName: string;
  categoryColor: string;
  paymentMethod?: string;
  notes?: string | null;
  isFixed?: boolean;
}
