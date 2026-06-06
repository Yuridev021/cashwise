import {
  collection,
  onSnapshot,
} from 'firebase/firestore';

import { firestore } from '../config/firebaseConfig';
import { Transaction, Card, FinancialData } from '../types';

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