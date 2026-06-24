import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { groupExpensesByCategory, getRecentTransactions } from '../utils/firebaseQueries';
import { Transaction, Card } from '../types';
import { EditBalanceModal } from '../components/EditBalanceModal';
import { MonthPicker } from '../components/MonthPicker';

const { width } = Dimensions.get('window');

const CATEGORY_COLORS: Record<string, string> = {
  moradia: '#a855f7',
  transporte: '#06b6d4',
  alimentação: '#ec4899',
  saúde: '#10b981',
  lazer: '#f59e0b',
  cartão: '#3b82f6',
  outros: '#6366f1',
};

const getColorForCategory = (category: string): string =>
  CATEGORY_COLORS[category.toLowerCase()] || '#6366f1';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatAmount = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const formatDate = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate?.() || new Date(timestamp);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
};

// ─── Donut Chart ──────────────────────────────────────────────────────────────

interface DonutChartProps {
  categories: { name: string; value: number; color: string }[];
  total: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ categories, total }) => {
  const SIZE = 140, STROKE = 18;
  const CIRCUMFERENCE = 2 * Math.PI * (SIZE - STROKE) / 2;

  if (total === 0) return (
    <View style={[donutStyles.wrapper, { width: SIZE, height: SIZE }]}>
      <View style={[donutStyles.emptyRing, { width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: STROKE }]} />
      <View style={donutStyles.center}>
        <Text style={donutStyles.totalLabel}>Total</Text>
        <Text style={donutStyles.totalValue}>R$ 0</Text>
      </View>
    </View>
  );

  let cumulativePercent = 0;
  const segments = categories.map((cat) => {
    const percent = cat.value / total;
    const start = cumulativePercent;
    cumulativePercent += percent;
    return { ...cat, percent, start };
  });

  return (
    <View style={[donutStyles.wrapper, { width: SIZE, height: SIZE }]}>
      <View style={[donutStyles.ring, { width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: STROKE, borderColor: '#f0f0f0' }]} />
      {segments.map((seg, i) => (
        <View key={i} style={[donutStyles.ring, {
          width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: STROKE,
          borderColor: 'transparent',
          borderTopColor:    seg.percent > 0.25 ? seg.color : 'transparent',
          borderRightColor:  seg.percent > 0.5  ? seg.color : 'transparent',
          borderBottomColor: seg.percent > 0.75 ? seg.color : 'transparent',
          borderLeftColor:   seg.color,
          transform: [{ rotate: `${seg.start * 360}deg` }],
          opacity: seg.percent > 0 ? 1 : 0,
        }]} />
      ))}
      <View style={[donutStyles.center, { width: SIZE - STROKE * 2.5, height: SIZE - STROKE * 2.5, borderRadius: (SIZE - STROKE * 2.5) / 2 }]}>
        <Text style={donutStyles.totalLabel}>Total</Text>
        <Text style={donutStyles.totalValue} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(total)}</Text>
      </View>
    </View>
  );
};

const donutStyles = StyleSheet.create({
  wrapper:   { justifyContent: 'center', alignItems: 'center', position: 'relative' },
  ring:      { position: 'absolute' },
  emptyRing: { position: 'absolute', borderColor: '#f0f0f0' },
  center:    { position: 'absolute', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  totalLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },
  totalValue: { fontSize: 13, color: '#1f2937', fontWeight: '700', marginTop: 2 },
});

// ─── Summary Card ─────────────────────────────────────────────────────────────

const SummaryCard: React.FC<{ label: string; amount: number; icon: string; color: string }> = ({ label, amount, icon, color }) => (
  <View style={[styles.summaryCard, { backgroundColor: '#fff' }]}>
    <View style={[styles.summaryIconWrap, { backgroundColor: `${color}18` }]}>
      <Ionicons name={icon as any} size={22} color={color} />
    </View>
    <Text style={styles.summaryLabel}>{label}</Text>
    <View style={styles.summaryValueRow}>
      <Text style={[styles.summaryCurrency, { color }]}>R$</Text>
      <Text style={[styles.summaryAmount, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {formatAmount(amount)}
      </Text>
    </View>
  </View>
);

// ─── Transaction Item ─────────────────────────────────────────────────────────

const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const isIncome = transaction.type === 'income';
  const color    = isIncome ? '#10b981' : '#ef4444';
  const bgColor  = isIncome ? '#d1fae5' : '#fee2e2';
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
        <Text style={[styles.txAmount, { color }]}>{isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}</Text>
        <Text style={styles.txDate}>{formatDate(transaction.createdAt)}</Text>
      </View>
    </View>
  );
};

// ─── Card Item ────────────────────────────────────────────────────────────────

const CardItem: React.FC<{ card: Card }> = ({ card }) => {
  const spent  = card.currentSpent ?? 0;
  const limit  = card.limit ?? 0;
  const pct    = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const barColor = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981';
  const available = Math.max(limit - spent, 0);

  return (
    <View style={styles.cardItem}>
      <View style={styles.cardItemHeader}>
        <View style={styles.cardNameRow}>
          <View style={styles.cardIconWrap}>
            <Ionicons name="card" size={14} color="#f59e0b" />
          </View>
          <Text style={styles.cardName}>{card.name}</Text>
        </View>
        <Text style={[styles.cardPct, { color: barColor }]}>{pct.toFixed(0)}%</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
      </View>

      <View style={styles.cardItemFooter}>
        <View>
          <Text style={styles.cardFooterLabel}>Gasto</Text>
          <Text style={[styles.cardFooterValue, { color: '#ef4444' }]}>{formatCurrency(spent)}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.cardFooterLabel}>Disponível</Text>
          <Text style={[styles.cardFooterValue, { color: '#10b981' }]}>{formatCurrency(available)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.cardFooterLabel}>Limite</Text>
          <Text style={styles.cardFooterValue}>{formatCurrency(limit)}</Text>
        </View>
      </View>

      {card.closingDate && (
        <Text style={styles.cardClosing}>Fechamento: dia {card.closingDate}</Text>
      )}
    </View>
  );
};

// ─── Error Banner ─────────────────────────────────────────────────────────────

const ErrorBanner: React.FC<{ message: string; onDismiss: () => void }> = ({ message, onDismiss }) => (
  <View style={styles.errorBanner}>
    <View style={styles.errorContent}>
      <Ionicons name="alert-circle" size={18} color="#ef4444" />
      <Text style={styles.errorText}>{message}</Text>
    </View>
    <TouchableOpacity onPress={onDismiss}>
      <Ionicons name="close" size={18} color="#6b7280" />
    </TouchableOpacity>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [dismissedError, setDismissedError]       = useState(false);
  const [editBalanceModalVisible, setEditBalanceModalVisible] = useState(false);
  const [monthChanging, setMonthChanging]         = useState(false);

  const navigation = useNavigation<any>();
  const { user }   = useAuth();
  const { data, loading, error, currentMonth, currentYear, setCurrentMonth, updateBalance } = useFinance();

  const expenseCategories = useMemo(() => {
    if (!data?.transactions) return [];
    const grouped = groupExpensesByCategory(data.transactions);
    return Object.entries(grouped).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: getColorForCategory(name),
    }));
  }, [data?.transactions]);

  const totalExpenses = useMemo(
    () => expenseCategories.reduce((sum, cat) => sum + cat.value, 0),
    [expenseCategories]
  );

  const recentTransactions = useMemo(
    () => getRecentTransactions(data?.transactions || [], 5),
    [data?.transactions]
  );

  const handleMonthChange = useCallback((month: number, year: number) => {
    setMonthChanging(true);
    setTimeout(() => { setCurrentMonth(month, year); setMonthChanging(false); }, 200);
  }, [setCurrentMonth]);

  const handleSaveBalance = useCallback(async (newBalance: number) => {
    if (!user?.uid) throw new Error('Usuário não identificado');
    await updateBalance(newBalance, user.uid);
  }, [updateBalance, user]);

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Carregando dados financeiros...</Text>
      </View>
    );
  }

  // Cartões com algum limite cadastrado
  const hasCards = (data?.cards?.length ?? 0) > 0;

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {error && !dismissedError && (
          <ErrorBanner message={error} onDismiss={() => setDismissedError(true)} />
        )}

        <View style={styles.heroSection}>
          <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.header}>
            <View style={styles.headerTop}>
              <MonthPicker
                currentMonth={currentMonth}
                currentYear={currentYear}
                onMonthChange={handleMonthChange}
                disabled={monthChanging || loading}
              />
              <TouchableOpacity onPress={() => navigation.navigate('UserSettings')}>
                <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceLabel}>Saldo atual em contas</Text>
            <View style={styles.balanceContainer}>
              <Text style={styles.balance}>{data ? formatCurrency(data.currentBalance) : 'R$ 0,00'}</Text>
            </View>
          </LinearGradient>

          {monthChanging && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          )}

          <View style={styles.summaryRow}>
            <SummaryCard label="Receitas"  amount={data?.totalIncome ?? 0}    icon="arrow-down-outline" color="#10b981" />
            <SummaryCard label="Despesas"  amount={data?.totalExpense ?? 0}   icon="arrow-up-outline"   color="#ef4444" />
            <SummaryCard label="Cartões"   amount={data?.totalCardSpent ?? 0} icon="card-outline"       color="#f59e0b" />
          </View>
        </View>

        <View style={[styles.content, monthChanging && { opacity: 0.5 }]}>

          {/* Despesas por categoria */}
          {expenseCategories.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>DESPESAS POR CATEGORIA</Text>
              <View style={styles.chartRow}>
                <DonutChart categories={expenseCategories} total={totalExpenses} />
                <View style={styles.categoryList}>
                  {expenseCategories.map((cat, i) => (
                    <View key={i} style={styles.categoryItem}>
                      <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                      <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
                      <Text style={styles.categoryValue}>{formatCurrency(cat.value)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Cartões — sempre visível se houver cartões cadastrados */}
          {hasCards ? (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>CARTÕES</Text>
                <Text style={styles.cardSubtitle}>{data!.cards.length} cartão{data!.cards.length > 1 ? 'ões' : ''}</Text>
              </View>
              {data!.cards.map((card) => (
                <CardItem key={card.id} card={card} />
              ))}
            </View>
          ) : (
            // Empty state de cartões — só aparece se não houver nenhum cadastrado
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>CARTÕES</Text>
              </View>
              <View style={styles.emptyCards}>
                <Ionicons name="card-outline" size={32} color="#d1d5db" />
                <Text style={styles.emptyCardsText}>Nenhum cartão cadastrado</Text>
                <Text style={styles.emptyCardsSubtext}>
                  Adicione um cartão em Configurações para acompanhar seus gastos
                </Text>
              </View>
            </View>
          )}

          {/* Últimas transações */}
          {recentTransactions.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>ÚLTIMAS TRANSAÇÕES</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
                  <Text style={styles.seeAll}>Ver tudo</Text>
                </TouchableOpacity>
              </View>
              {recentTransactions.map((tx) => (
                <TransactionItem key={tx.id} transaction={tx} />
              ))}
            </View>
          )}

          {/* Empty state geral */}
          {!loading && (!data?.transactions || data.transactions.length === 0) && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="wallet-outline" size={40} color="#3b82f6" />
              </View>
              <Text style={styles.emptyTitle}>Nenhuma transação registrada</Text>
              <Text style={styles.emptyText}>Comece adicionando sua primeira transação</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('AddTransaction')}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.emptyButtonText}>Adicionar Transação</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <EditBalanceModal
        visible={editBalanceModalVisible}
        currentBalance={data?.currentBalance ?? 0}
        onClose={() => setEditBalanceModalVisible(false)}
        onSave={handleSaveBalance}
      />

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Transactions')}>
          <Ionicons name="list" size={24} color="#c4c4c4" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navCenter} onPress={() => navigation.navigate('AddTransaction')}>
          <LinearGradient colors={['#34d399', '#10b981']} style={styles.fab}>
            <Ionicons name="add" size={30} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Charts')}>
          <Ionicons name="pie-chart" size={24} color="#c4c4c4" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('UserSettings')}>
          <Ionicons name="menu" size={24} color="#c4c4c4" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f3f4f6' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: '#6b7280', fontSize: 15, fontWeight: '500' },

  errorBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fef2f2', borderLeftWidth: 4, borderLeftColor: '#ef4444',
    paddingHorizontal: 14, paddingVertical: 10, margin: 16, borderRadius: 8,
  },
  errorContent: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  errorText: { color: '#991b1b', fontSize: 12, fontWeight: '500', flex: 1 },

  heroSection:  { marginBottom: 8 },
  header:       { paddingTop: 52, paddingBottom: 64, paddingHorizontal: 20 },
  headerTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  balanceLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 6 },
  balanceContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balance:      { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20,
  },

  summaryRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: -52, zIndex: 1 },
  summaryCard: {
    flex: 1, borderRadius: 16, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  summaryIconWrap: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  summaryLabel:    { fontSize: 10, color: '#9ca3af', fontWeight: '600', marginBottom: 4 },
  summaryValueRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 3, width: '100%' },
  summaryCurrency: { fontSize: 11, fontWeight: '800' },
  summaryAmount:   { fontSize: 13, fontWeight: '800', flexShrink: 1 },

  content: { paddingHorizontal: 16, paddingTop: 8 },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle:    { fontSize: 12, fontWeight: '700', color: '#374151', letterSpacing: 0.8 },
  cardSubtitle: { fontSize: 11, color: '#9ca3af' },

  chartRow:     { flexDirection: 'row', alignItems: 'center', gap: 16 },
  categoryList: { flex: 1, gap: 10 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryDot:  { width: 10, height: 10, borderRadius: 5 },
  categoryName: { flex: 1, fontSize: 12, color: '#6b7280', fontWeight: '500' },
  categoryValue:{ fontSize: 12, color: '#1f2937', fontWeight: '700' },

  // Card item
  cardItem: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  cardItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardNameRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fffbeb', justifyContent: 'center', alignItems: 'center' },
  cardName:     { fontSize: 14, color: '#1f2937', fontWeight: '700' },
  cardPct:      { fontSize: 13, fontWeight: '800' },
  progressTrack:{ height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', borderRadius: 4 },
  cardItemFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardFooterLabel:{ fontSize: 10, color: '#9ca3af', fontWeight: '600', marginBottom: 2 },
  cardFooterValue:{ fontSize: 13, fontWeight: '700', color: '#1f2937' },
  cardClosing:  { fontSize: 10, color: '#9ca3af', marginTop: 8, fontStyle: 'italic' },

  // Empty cards
  emptyCards: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyCardsText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  emptyCardsSubtext: { fontSize: 12, color: '#9ca3af', textAlign: 'center', lineHeight: 18 },

  seeAll: { fontSize: 12, color: '#3b82f6', fontWeight: '600' },
  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  txIcon:        { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  txContent:     { flex: 1 },
  txCategory:    { fontSize: 13, color: '#1f2937', fontWeight: '600', marginBottom: 2 },
  txDescription: { fontSize: 11, color: '#9ca3af' },
  txRight:       { alignItems: 'flex-end' },
  txAmount:      { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  txDate:        { fontSize: 10, color: '#d1d5db' },

  emptyState:   { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyIconWrap:{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle:   { fontSize: 16, color: '#1f2937', fontWeight: '700', marginBottom: 6 },
  emptyText:    { fontSize: 13, color: '#9ca3af', textAlign: 'center', marginBottom: 20 },
  emptyButton:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#3b82f6', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 },
  emptyButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 72, backgroundColor: '#fff',
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: -2 }, elevation: 8,
  },
  navItem:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navCenter: { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  fab:       { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', borderRadius: 29 },
});
