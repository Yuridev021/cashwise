export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  createdAt: any;
  userId: string;
}

export interface Card {
  id: string;
  name: string;
  limit: number;
  currentSpent: number;
  closingDate: number;
  userId: string;
}

export interface FinancialData {
  totalIncome: number;
  totalExpense: number;
  totalCardSpent: number;
  currentBalance: number;
  transactions: Transaction[];
  cards: Card[];
}

export interface FinanceContextType {
  data: FinancialData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export interface ExpenseCategory {
  name: string;
  value: number;
  color: string;
}
