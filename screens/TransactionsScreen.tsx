import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate?.() || new Date(timestamp);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(date);
};

type FilterType = 'all' | 'income' | 'expense';

const FILTERS: { key: FilterType; label: string; color: string }[] = [
  { key: 'all',     label: 'Todas',    color: '#3b82f6' },
  { key: 'income',  label: 'Receitas', color: '#10b981' },
  { key: 'expense', label: 'Despesas', color: '#ef4444' },
];

const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const isIncome = transaction.type === 'income';
  const color = isIncome ? '#10b981' : '#ef4444';
  const bgColor = isIncome ? '#d1fae5' : '#fee2e2';

  return (
    <View style={styles.txItem}>
      <View style={[styles.txIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={isIncome ? 'arrow-down' : 'arrow-up'} size={15} color={color} />
      </View>
      <View style={styles.txContent}>
        <Text style={styles.txCategory}>{transaction.category}</Text>
        <Text style={styles.txDescription} numberOfLines={1}>{transaction.description}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color }]}>
          {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
        </Text>
        <Text style={styles.txDate}>{formatDate(transaction.createdAt)}</Text>
      </View>
    </View>
  );
};

export default function TransactionsScreen() {
  const navigation = useNavigation<any>();
  const { data } = useFinance();
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = useMemo(() => {
    const txs = data?.transactions || [];
    if (filter === 'all') return txs;
    return txs.filter(t => t.type === filter);
  }, [data?.transactions, filter]);

  const totalIncome = useMemo(
    () => (data?.transactions || []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [data?.transactions]
  );
  const totalExpense = useMemo(
    () => (data?.transactions || []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [data?.transactions]
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transações</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Resumo */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Receitas</Text>
            <Text style={[styles.summaryValue, { color: '#34d399' }]}>{formatCurrency(totalIncome)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Despesas</Text>
            <Text style={[styles.summaryValue, { color: '#fca5a5' }]}>{formatCurrency(totalExpense)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>{filtered.length} itens</Text>
          </View>
        </View>

        {/* Filtros */}
        <View style={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterTab, filter === f.key && { borderBottomColor: '#fff', borderBottomWidth: 3 }]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && { color: '#fff' }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Lista */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Nenhuma transação</Text>
          <Text style={styles.emptyText}>Não há registros para este filtro</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <TransactionItem transaction={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f3f4f6' },

  // Header
  header: { paddingTop: 52, paddingBottom: 0, paddingHorizontal: 20 },
  headerTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  summaryRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, padding: 16, marginBottom: 16, gap: 0,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  summaryValue: { fontSize: 14, color: '#fff', fontWeight: '800' },
  summaryDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },

  filterRow: { flexDirection: 'row' },
  filterTab: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  filterText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },

  // List
  listContent: { padding: 16, paddingBottom: 40 },
  separator: { height: 1, backgroundColor: '#f3f4f6' },

  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
  },
  txIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  txContent: { flex: 1 },
  txCategory: { fontSize: 13, color: '#1f2937', fontWeight: '600', marginBottom: 2 },
  txDescription: { fontSize: 11, color: '#9ca3af' },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  txDate: { fontSize: 10, color: '#d1d5db' },

  // Empty
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, color: '#374151', fontWeight: '700' },
  emptyText: { fontSize: 13, color: '#9ca3af' },
});
