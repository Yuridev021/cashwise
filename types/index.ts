export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  createdAt: any;
  userId: string;
  month?: number;
  year?: number;
  // ── Recorrência ──────────────────────────────
  recurring?: boolean;
  recurringDay?: number;
  recurringId?: string;
  isRecurringTemplate?: boolean;
  recurringStartMonth?: number;
  recurringStartYear?: number;
  // ── Cartão ───────────────────────────────────
  cardId?: string;            // ID do cartão vinculado (opcional)
}

export interface Card {
  id: string;
  name: string;
  limit: number;
  closingDate: number;
  userId: string;
  // currentSpent é calculado dinamicamente a partir das transações do mês
  currentSpent?: number;
}

export interface FinancialData {
  totalIncome: number;
  totalExpense: number;
  totalCardSpent: number;
  currentBalance: number;
  transactions: Transaction[];
  cards: Card[];           // cartões com currentSpent já calculado para o mês
}

export interface FinanceContextType {
  data: FinancialData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  currentMonth: number;
  currentYear: number;
  setCurrentMonth: (month: number, year: number) => void;
  updateBalance: (newBalance: number, userId: string) => Promise<void>;
  balanceSavedBalance: number;
}

export interface ExpenseCategory {
  name: string;
  value: number;
  color: string;
}

export const getMonthYearFromDate = (
  timestamp: any
): { month: number; year: number } => {
  const date = timestamp?.toDate?.() || new Date(timestamp);
  return {
    month: date.getMonth(),
    year: date.getFullYear(),
  };
};

export const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];