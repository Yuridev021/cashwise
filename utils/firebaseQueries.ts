import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';

import { firestore } from '../config/firebaseConfig';
import { Transaction, Card, FinancialData, getMonthYearFromDate } from '../types';

/**
 * Configura listeners em tempo real para transações do usuário
 */
export const subscribeToTransactions = (
  userId: string,
  onDataChange: (transactions: Transaction[]) => void,
  onError: (error: string) => void
): (() => void) => {
  try {
    const ref = collection(firestore, 'finance', userId, 'transactions');

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const transactions: Transaction[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Transaction));

        transactions.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

        onDataChange(transactions);
      },
      (error) => {
        onError('Erro ao carregar transações');
      }
    );

    return unsubscribe;
  } catch (error: any) {
    onError('Erro ao configurar listener');
    return () => {};
  }
};

/**
 * Configura listeners em tempo real para cartões do usuário
 */
export const subscribeToCards = (
  userId: string,
  onDataChange: (cards: Card[]) => void,
  onError: (error: string) => void
): (() => void) => {
  try {
    const ref = collection(firestore, 'finance', userId, 'cards');

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const cards: Card[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Card));

        onDataChange(cards);
      },
      (error) => {
        onError('Erro ao carregar cartões');
      }
    );

    return unsubscribe;
  } catch (error: any) {
    onError('Erro ao configurar listener');
    return () => {};
  }
};

/**
 * Exclui uma transação do Firebase
 */
export const deleteTransaction = async (
  userId: string,
  transactionId: string
): Promise<void> => {
  const ref = doc(firestore, 'finance', userId, 'transactions', transactionId);
  await deleteDoc(ref);
};

/**
 * Atualiza uma transação no Firebase
 */
export const updateTransaction = async (
  userId: string,
  transactionId: string,
  data: Partial<Pick<Transaction, 'amount' | 'description' | 'category' | 'type'>>
): Promise<void> => {
  const ref = doc(firestore, 'finance', userId, 'transactions', transactionId);
  await updateDoc(ref, data);
};

/**
 * Calcula os dados financeiros totais
 */
export const calculateFinancialData = (
  transactions: Transaction[],
  cards: Card[]
): Omit<FinancialData, 'transactions' | 'cards'> => {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCardSpent = cards.reduce(
    (sum, card) => sum + card.currentSpent,
    0
  );

  const currentBalance = totalIncome - totalExpense - totalCardSpent;

  return { totalIncome, totalExpense, totalCardSpent, currentBalance };
};

/**
 * Agrupa transações de despesa por categoria
 */
export const groupExpensesByCategory = (
  transactions: Transaction[]
): Record<string, number> => {
  const grouped: Record<string, number> = {};

  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      grouped[t.category] = (grouped[t.category] || 0) + t.amount;
    });

  return grouped;
};

/**
 * Obtém as últimas transações
 */
export const getRecentTransactions = (
  transactions: Transaction[],
  limit: number = 5
): Transaction[] => {
  return transactions.slice(0, limit);
};

/**
 * Filtra transações por mês e ano
 */
export const filterTransactionsByMonth = (
  transactions: Transaction[],
  month: number,
  year: number
): Transaction[] => {
  return transactions.filter((t) => {
    const { month: txMonth, year: txYear } = getMonthYearFromDate(t.createdAt);
    return txMonth === month && txYear === year;
  });
};

/**
 * Filtra cartões por mês e ano
 */
export const filterCardsByMonth = (
  cards: Card[],
  month: number,
  year: number
): Card[] => {
  return cards.filter((c) => {
    const cardMonth = c.month ?? 0;
    const cardYear = c.year ?? new Date().getFullYear();
    return cardMonth === month && cardYear === year;
  });
};

/**
 * Calcula dados financeiros para um mês específico
 */
export const calculateFinancialDataByMonth = (
  transactions: Transaction[],
  cards: Card[],
  month: number,
  year: number
): Omit<FinancialData, 'transactions' | 'cards'> => {
  const monthTransactions = filterTransactionsByMonth(transactions, month, year);
  const monthCards = filterCardsByMonth(cards, month, year);
  return calculateFinancialData(monthTransactions, monthCards);
};

/**
 * Salva o saldo manual do usuário no Firebase
 */
export const updateUserBalance = async (
  userId: string,
  newBalance: number
): Promise<void> => {
  try {
    const userBalanceRef = doc(firestore, 'finance', userId, 'metadata', 'balance');
    await setDoc(userBalanceRef, {
      savedBalance: newBalance,
      updatedAt: new Date(),
    }, { merge: true });
  } catch (error) {
    console.error('Erro ao salvar saldo:', error);
    throw error;
  }
};

/**
 * Obtém o saldo manual salvo do usuário
 */
export const getUserBalance = async (userId: string): Promise<number> => {
  try {
    const userBalanceRef = doc(firestore, 'finance', userId, 'metadata', 'balance');
    const docSnapshot = await getDoc(userBalanceRef);
    if (docSnapshot.exists()) {
      return docSnapshot.data()?.savedBalance ?? 0;
    }
    return 0;
  } catch (error) {
    console.error('Erro ao obter saldo:', error);
    return 0;
  }
};