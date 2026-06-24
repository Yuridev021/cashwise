import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { firestore } from '../config/firebaseConfig';
import {
  subscribeToTransactions,
  subscribeToCards,
  calculateFinancialDataByMonth,
  filterTransactionsByMonth,
  filterCardsByMonth,
  calcularTotalCardSpent,
  updateUserBalance,
  getUserBalance,
} from '../utils/firebaseQueries';
import { FinancialData, FinanceContextType, Transaction, Card } from '../types';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// ─── Gera cópias mensais a partir dos templates recorrentes ──────────────────

const generateRecurringForMonth = async (
  userId: string,
  allTransactions: Transaction[],
  month: number,
  year: number
) => {
  const templates = allTransactions.filter(
    (t) => t.recurring === true && t.isRecurringTemplate === true
  );
  if (templates.length === 0) return;

  const alreadyGeneratedIds = new Set(
    allTransactions
      .filter((t) => t.recurringId && t.month === month && t.year === year)
      .map((t) => t.recurringId)
  );

  for (const template of templates) {
    if (alreadyGeneratedIds.has(template.id)) continue;

    const startMonth: number = template.recurringStartMonth ?? (() => {
      const d = template.createdAt?.toDate?.() || new Date(template.createdAt ?? Date.now());
      return d.getMonth();
    })();
    const startYear: number = template.recurringStartYear ?? (() => {
      const d = template.createdAt?.toDate?.() || new Date(template.createdAt ?? Date.now());
      return d.getFullYear();
    })();

    const targetDate   = new Date(year, month, 1);
    const creationDate = new Date(startYear, startMonth, 1);
    if (targetDate <= creationDate) continue;

    const day = Math.min(template.recurringDay || 1, 28);
    await addDoc(collection(firestore, 'finance', userId, 'transactions'), {
      userId,
      type:                template.type,
      amount:              template.amount,
      category:            template.category,
      description:         template.description,
      createdAt:           new Date(year, month, day),
      month,
      year,
      recurring:           false,
      isRecurringTemplate: false,
      recurringId:         template.id,
    });
  }
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const FinanceProvider: React.FC<{ children: ReactNode; userId: string }> = ({
  children,
  userId,
}) => {
  const [data, setData]       = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards]               = useState<Card[]>([]);

  const today = new Date();
  const [currentMonth, setCurrentMonthState] = useState(today.getMonth());
  const [currentYear,  setCurrentYearState]  = useState(today.getFullYear());
  const [balanceSavedBalance, setBalanceSavedBalance] = useState(0);
  const [recurringKey, setRecurringKey] = useState('');

  const setCurrentMonth = useCallback((month: number, year: number) => {
    setCurrentMonthState(month);
    setCurrentYearState(year);
  }, []);

  const updateBalance = useCallback(async (newBalance: number, userId_: string) => {
    await updateUserBalance(userId_, newBalance);
    setBalanceSavedBalance(newBalance);
  }, []);

  const handleError = useCallback((msg: string) => {
    setError(msg.includes('Missing or insufficient permissions')
      ? '⚠️ Security Rules não configuradas.'
      : msg);
  }, []);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    getUserBalance(userId).then(setBalanceSavedBalance).catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const unsubTx   = subscribeToTransactions(userId, setTransactions, handleError);
    const unsubCard = subscribeToCards(userId, setCards, handleError);
    return () => { unsubTx(); unsubCard(); };
  }, [userId, handleError]);

  // Gera recorrentes — uma vez por userId+mês+ano
  useEffect(() => {
    if (!userId || transactions.length === 0) return;
    const key = `${userId}-${currentMonth}-${currentYear}`;
    if (recurringKey === key) return;
    generateRecurringForMonth(userId, transactions, currentMonth, currentYear)
      .then(() => setRecurringKey(key))
      .catch(console.error);
  }, [userId, transactions, currentMonth, currentYear, recurringKey]);

  // Calcula dados do mês
  useEffect(() => {
    const monthTransactions = filterTransactionsByMonth(transactions, currentMonth, currentYear);
    const monthCards        = filterCardsByMonth(cards, transactions, currentMonth, currentYear);

    // totalCardSpent soma TODAS as transações com category 'cartão' do mês,
    // independente de ter cartão cadastrado no Firestore
    const totalCardSpent = calcularTotalCardSpent(transactions, currentMonth, currentYear);

    const monthData = calculateFinancialDataByMonth(transactions, cards, currentMonth, currentYear);

    const finalBalance =
      monthTransactions.length === 0 && monthCards.length === 0 && totalCardSpent === 0
        ? balanceSavedBalance
        : monthData.currentBalance;

    setData({
      ...monthData,
      totalCardSpent,        // garante que usa o valor calculado diretamente das transações
      currentBalance: finalBalance,
      transactions:   monthTransactions,
      cards:          monthCards,
    });
    setLoading(false);
  }, [transactions, cards, currentMonth, currentYear, balanceSavedBalance]);

  const refreshData = useCallback(async () => {
    return new Promise<void>((resolve) => setTimeout(resolve, 300));
  }, []);

  return (
    <FinanceContext.Provider value={{
      data, loading, error, refreshData,
      currentMonth, currentYear, setCurrentMonth,
      updateBalance, balanceSavedBalance,
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance deve ser usado dentro de FinanceProvider');
  return context;
};
