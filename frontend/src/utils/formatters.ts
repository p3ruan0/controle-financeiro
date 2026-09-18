export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatDate = (dateValue: string | Date | undefined | null): string => {
  if (!dateValue) return '-';
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '-';
    // Use UTC date to avoid timezone shift if formatted as YYYY-MM-DD
    if (typeof dateValue === 'string' && dateValue.length === 10) {
      const [year, month, day] = dateValue.split('-').map(Number);
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    }
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return '-';
  }
};

export const formatInputDate = (dateValue: string | Date | undefined | null): string => {
  if (!dateValue) return '';
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

export const getStatusDetails = (status: string, type: 'ENTRADA' | 'SAIDA' = 'SAIDA') => {
  switch (status) {
    case 'PAGO':
      return {
        label: 'Pago',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        emoji: '🟢',
      };
    case 'RECEBIDO':
      return {
        label: 'Recebido',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        emoji: '🟢',
      };
    case 'PENDENTE':
      return {
        label: 'Pendente',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        emoji: '🟡',
      };
    case 'VENCIDO':
      return {
        label: 'Vencido',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        emoji: '🔴',
      };
    case 'ATRASADO':
      return {
        label: 'Atrasado',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        emoji: '🔴',
      };
    case 'A_RECEBER':
      return {
        label: 'A Receber',
        bg: 'bg-sky-50 text-sky-700 border-sky-200',
        dot: 'bg-sky-500',
        emoji: '🟠',
      };
    case 'CANCELADO':
      return {
        label: 'Cancelado',
        bg: 'bg-slate-100 text-slate-500 border-slate-200',
        dot: 'bg-slate-400',
        emoji: '⚪',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
        emoji: '⚪',
      };
  }
};

export const formatDateTime = (dateValue: string | Date | undefined | null): string => {
  if (!dateValue) return '-';
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '-';
  }
};

export const formatRelativeTime = (dateValue: string | Date | undefined | null): string => {
  if (!dateValue) return 'Nunca acessou';
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return 'Nunca acessou';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 30) return `Há ${diffDays} dias`;
    if (diffDays < 365) return `Há ${Math.floor(diffDays / 30)} meses`;
    return `Há ${Math.floor(diffDays / 365)} anos`;
  } catch {
    return '-';
  }
};

export const getRoleBadge = (role: string) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return {
        label: 'Super Admin',
        emoji: '👑',
        bg: 'bg-purple-100 text-purple-800 border-purple-200',
      };
    case 'ADMIN':
      return {
        label: 'Administrador',
        emoji: '🛡️',
        bg: 'bg-sky-100 text-sky-800 border-sky-200',
      };
    case 'CLIENT_ADMIN':
      return {
        label: 'Admin Cliente',
        emoji: '🏢',
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'USER':
    default:
      return {
        label: 'Usuário Padrão',
        emoji: '👤',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
};

export const getUserStatusBadge = (status: string) => {
  switch (status) {
    case 'ATIVO':
      return {
        label: 'Ativo',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'BLOQUEADO':
      return {
        label: 'Bloqueado',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
      };
    case 'PENDENTE':
      return {
        label: 'Pendente',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'EXCLUIDO':
      return {
        label: 'Excluído',
        bg: 'bg-slate-100 text-slate-500 border-slate-300 line-through',
        dot: 'bg-slate-400',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
};

export const getPaymentMethodName = (method: string): string => {
  const map: Record<string, string> = {
    DINHEIRO: 'Dinheiro',
    PIX: 'PIX',
    CARTAO_CREDITO: 'Cartão de Crédito',
    CARTAO_DEBITO: 'Cartão de Débito',
    BOLETO: 'Boleto Bancário',
    TRANSFERENCIA: 'Transferência / TED',
    OUTRO: 'Outro',
  };
  return map[method] || method;
};


