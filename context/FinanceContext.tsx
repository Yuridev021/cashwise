import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../config/firebaseConfig';
import {
  subscribeToTransactions,
  subscribeToCards,
  calculateFinancialData,
  calculateFinancialDataByMonth,
  filterTransactionsByMonth,
  filterCardsByMonth,
  updateUserBalance,
  getUserBalance,
} from '../utils/firebaseQueries';
import { FinancialData, FinanceContextType, Transaction, Card } from '../types';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// ─── Helper: gera recorrentes do mês atual se ainda não existirem ─────────────

const generateRecurringForMonth = async (
  userId: string,
  allTransactions: Transaction[],
  month: number,
  year: number
) => {
  // Pega todas as transações marcadas como recorrentes (originais)
  const recurringOriginals = allTransactions.filter(
    (t) => t.recurring === true && !t.recurringId
  );

  if (recurringOriginals.length === 0) return;

  // Verifica quais já foram geradas neste mês/ano
  const alreadyGenerated = allTransactions.filter(
    (t) => t.recurringId && t.month === month && t.year === year
  ).map((t) => t.recurringId);

  for (const original of recurringOriginals) {
    // Pula se já foi gerada para este mês
    if (alreadyGenerated.includes(original.id)) continue;

    // Não duplica o próprio mês de criação
    const createdAt = original.createdAt?.toDate?.() || new Date(original.createdAt);
    const createdMonth = createdAt.getMonth();
    const createdYear = createdAt.getFullYear();
    if (createdMonth === month && createdYear === year) continue;

    // Não gera para meses no passado antes da criação
    const targetDate = new Date(year, month, 1);
    const creationDate = new Date(createdYear, createdMonth, 1);
    if (targetDate < creationDate) continue;

    // Cria a cópia da transação para este mês
    const day = Math.min(original.recurringDay || 1, 28);
    const recurringDate = new Date(year, month, day);

    await addDoc(collection(firestore, 'finance', userId, 'transactions'), {
      userId:      userId,
      type:        original.type,
      amount:      original.amount,
      category:    original.category,
      description: original.description,
      createdAt:   recurringDate,
      month:       month,
      year:        year,
      recurring:   false,         // cópia não é "original"
      recurringId: original.id,   // referência ao original
    });
  }
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const FinanceProvider: React.FC<{ children: ReactNode; userId: string }> = ({
  children,
  userId,
}) => {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  const today = new Date();
  const [currentMonth, setCurrentMonthState] = useState(today.getMonth());
  const [currentYear, setCurrentYearState] = useState(today.getFullYear());
  const [balanceSavedBalance, setBalanceSavedBalance] = useState(0);
  const [recurringGenerated, setRecurringGenerated] = useState(false);

  const setCurrentMonth = useCallback((month: number, year: number) => {
    setCurrentMonthState(month);
    setCurrentYearState(year);
    setRecurringGenerated(false); // força re-check ao mudar mês
  }, []);

  const updateBalance = useCallback(async (newBalance: number, userId_: string) => {
    try {
      await updateUserBalance(userId_, newBalance);
      setBalanceSavedBalance(newBalance);
    } catch (err) {
      console.error('Erro ao atualizar saldo:', err);
      throw err;
    }
  }, []);

  const handleTransactionsChange = useCallback((newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
  }, []);

  const handleCardsChange = useCallback((newCards: Card[]) => {
    setCards(newCards);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    if (errorMessage.includes('Missing or insufficient permissions')) {
      setError('⚠️ Security Rules não configuradas.');
    } else {
      setError(errorMessage);
    }
  }, []);

  // Carrega saldo salvo
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    getUserBalance(userId)
      .then(setBalanceSavedBalance)
      .catch(() => {});
  }, [userId]);

  // Subscribe transações e cartões
  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    setLoading(true);
    setError(null);

    const unsubTx   = subscribeToTransactions(userId, handleTransactionsChange, handleError);
    const unsubCard = subscribeToCards(userId, handleCardsChange, handleError);

    return () => { unsubTx(); unsubCard(); };
  }, [userId, handleTransactionsChange, handleCardsChange, handleError]);

  // Gera recorrentes quando transactions carregam ou mês muda
  useEffect(() => {
    if (!userId || transactions.length === 0 || recurringGenerated) return;

    generateRecurringForMonth(userId, transactions, currentMonth, currentYear)
      .then(() => setRecurringGenerated(true))
      .catch((err) => console.error('Erro ao gerar recorrentes:', err));
  }, [userId, transactions, currentMonth, currentYear, recurringGenerated]);

  // Calcula dados do mês selecionado
  useEffect(() => {
    const monthTransactions = filterTransactionsByMonth(transactions, currentMonth, currentYear);
    const monthCards        = filterCardsByMonth(cards, currentMonth, currentYear);
    const monthData         = calculateFinancialDataByMonth(transactions, cards, currentMonth, currentYear);

    let finalBalance = monthData.currentBalance;
    if (monthTransactions.length === 0 && monthCards.length === 0) {
      finalBalance = balanceSavedBalance;
    }

    setData({
      ...monthData,
      currentBalance: finalBalance,
      transactions:   monthTransactions,
      cards:          monthCards,
    });
    setLoading(false);
  }, [transactions, cards, currentMonth, currentYear, balanceSavedBalance]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRecurringGenerated(false); // re-verifica recorrentes no refresh
    return new Promise<void>((resolve) => {
      setTimeout(() => { setLoading(false); resolve(); }, 500);
    });
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
