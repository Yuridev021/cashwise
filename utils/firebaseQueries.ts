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

// ─── Listeners ────────────────────────────────────────────────────────────────

export const subscribeToTransactions = (
  userId: string,
  onDataChange: (transactions: Transaction[]) => void,
  onError: (error: string) => void
): (() => void) => {
  try {
    const ref = collection(firestore, 'finance', userId, 'transactions');
    return onSnapshot(
      ref,
      (snapshot) => {
        const transactions: Transaction[] = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Transaction))
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB.getTime() - dateA.getTime();
          });
        onDataChange(transactions);
      },
      () => onError('Erro ao carregar transações')
    );
  } catch {
    onError('Erro ao configurar listener');
    return () => {};
  }
};

export const subscribeToCards = (
  userId: string,
  onDataChange: (cards: Card[]) => void,
  onError: (error: string) => void
): (() => void) => {
  try {
    const ref = collection(firestore, 'finance', userId, 'cards');
    return onSnapshot(
      ref,
      (snapshot) => {
        const cards: Card[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Card));
        onDataChange(cards);
      },
      () => onError('Erro ao carregar cartões')
    );
  } catch {
    onError('Erro ao configurar listener');
    return () => {};
  }
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const deleteTransaction = async (
  userId: string,
  transactionId: string
): Promise<void> => {
  await deleteDoc(doc(firestore, 'finance', userId, 'transactions', transactionId));
};

export const updateTransaction = async (
  userId: string,
  transactionId: string,
  data: Partial<Pick<Transaction, 'amount' | 'description' | 'category' | 'type'>>
): Promise<void> => {
  await updateDoc(doc(firestore, 'finance', userId, 'transactions', transactionId), data);
};

// ─── Filtros ──────────────────────────────────────────────────────────────────

export const filterTransactionsByMonth = (
  transactions: Transaction[],
  month: number,
  year: number
): Transaction[] =>
  transactions.filter((t) => {
    const { month: m, year: y } = getMonthYearFromDate(t.createdAt);
    return m === month && y === year;
  });

/**
 * Cartões com currentSpent calculado a partir das transações do mês.
 * Se não houver cartões cadastrados, retorna array vazio
 * (o totalCardSpent é calculado separadamente via calcularTotalCardSpent).
 */
export const filterCardsByMonth = (
  cards: Card[],
  transactions: Transaction[],
  month: number,
  year: number
): Card[] => {
  if (cards.length === 0) return [];

  const monthTxs = filterTransactionsByMonth(transactions, month, year);

  return cards.map((card) => {
    const spent = monthTxs
      .filter((t) => t.cardId === card.id)
      .reduce((sum, t) => sum + t.amount, 0);
    return { ...card, currentSpent: spent };
  });
};

/**
 * Calcula o total gasto em cartão no mês.
 * Soma TODAS as transações com category === 'cartão',
 * independente de ter cardId ou cartão cadastrado.
 */
export const calcularTotalCardSpent = (
  transactions: Transaction[],
  month: number,
  year: number
): number => {
  const monthTxs = filterTransactionsByMonth(transactions, month, year);
  return monthTxs
    .filter((t) => t.category === 'cartão')
    .reduce((sum, t) => sum + t.amount, 0);
};

// ─── Cálculos financeiros ─────────────────────────────────────────────────────

export const calculateFinancialData = (
  transactions: Transaction[],
  cards: Card[],
  totalCardSpent: number
): Omit<FinancialData, 'transactions' | 'cards'> => {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  // Despesas normais excluem transações de cartão (já contabilizadas em totalCardSpent)
  const totalExpense = transactions
    .filter((t) => t.type === 'expense' && t.category !== 'cartão')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = totalIncome - totalExpense - totalCardSpent;

  return { totalIncome, totalExpense, totalCardSpent, currentBalance };
};

export const calculateFinancialDataByMonth = (
  transactions: Transaction[],
  cards: Card[],
  month: number,
  year: number
): Omit<FinancialData, 'transactions' | 'cards'> => {
  const monthTransactions = filterTransactionsByMonth(transactions, month, year);
  const monthCards        = filterCardsByMonth(cards, transactions, month, year);
  const totalCardSpent    = calcularTotalCardSpent(transactions, month, year);
  return calculateFinancialData(monthTransactions, monthCards, totalCardSpent);
};

// ─── Utilitários ──────────────────────────────────────────────────────────────

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

export const getRecentTransactions = (
  transactions: Transaction[],
  limit = 5
): Transaction[] => transactions.slice(0, limit);

export const updateUserBalance = async (
  userId: string,
  newBalance: number
): Promise<void> => {
  const ref = doc(firestore, 'finance', userId, 'metadata', 'balance');
  await setDoc(ref, { savedBalance: newBalance, updatedAt: new Date() }, { merge: true });
};

export const getUserBalance = async (userId: string): Promise<number> => {
  try {
    const ref  = doc(firestore, 'finance', userId, 'metadata', 'balance');
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data()?.savedBalance ?? 0) : 0;
  } catch {
    return 0;
  }
};