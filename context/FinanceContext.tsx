import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  subscribeToTransactions,
  subscribeToCards,
  calculateFinancialData,
} from '../utils/firebaseQueries';
import { FinancialData, FinanceContextType, Transaction, Card } from '../types';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode; userId: string }> = ({
  children,
  userId,
}) => {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  const handleTransactionsChange = useCallback((newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
  }, []);

  const handleCardsChange = useCallback((newCards: Card[]) => {
    setCards(newCards);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    console.error('FinanceContext Error:', errorMessage);
    if (errorMessage.includes('Missing or insufficient permissions')) {
      setError('⚠️ Security Rules não configuradas. Veja a documentação FIX_PERMISSIONS_ERROR.ts');
    } else {
      setError(errorMessage);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribeTransactions = subscribeToTransactions(
      userId,
      handleTransactionsChange,
      handleError
    );

    const unsubscribeCards = subscribeToCards(
      userId,
      handleCardsChange,
      handleError
    );

    return () => {
      unsubscribeTransactions();
      unsubscribeCards();
    };
  }, [userId, handleTransactionsChange, handleCardsChange, handleError]);

  useEffect(() => {
  const calculatedData = calculateFinancialData(transactions, cards);
  setData({
    ...calculatedData,
    transactions,
    cards,
  });
  setLoading(false);
}, [transactions, cards]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    return new Promise((resolve) => {
      setTimeout(() => {
        setLoading(false);
        resolve(undefined);
      }, 500);
    });
  }, []);

  return (
    <FinanceContext.Provider
      value={{
        data,
        loading,
        error,
        refreshData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance deve ser usado dentro de FinanceProvider');
  }
  return context;
};
