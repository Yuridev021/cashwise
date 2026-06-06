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
import { Transaction } from '../types';

const { width } = Dimensions.get('window');

const CATEGORY_COLORS: Record<string, string> = {
  moradia: '#a855f7',
  housing: '#a855f7',
  transporte: '#06b6d4',
  transport: '#06b6d4',
  alimentação: '#ec4899',
  food: '#ec4899',
  saúde: '#10b981',
  health: '#10b981',
  lazer: '#f59e0b',
  entertainment: '#f59e0b',
  cartão: '#3b82f6',
  outros: '#6366f1',
  other: '#6366f1',
};

const getColorForCategory = (category: string): string => {
  return CATEGORY_COLORS[category.toLowerCase()] || '#6366f1';
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatAmount = (value: number): string =>
  new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate?.() || new Date(timestamp);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
};

// ─── Donut Chart (SVG-free, usando Views) ─────────────────────────────────────

interface DonutChartProps {
  categories: { name: string; value: number; color: string }[];
  total: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ categories, total }) => {
  const SIZE = 140;
  const STROKE = 18;
  const R = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * R;

  if (total === 0) {
    return (
      <View style={[donutStyles.wrapper, { width: SIZE, height: SIZE }]}>
        <View style={[donutStyles.emptyRing, { width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: STROKE }]} />
        <View style={donutStyles.center}>
          <Text style={donutStyles.totalLabel}>Total</Text>
          <Text style={donutStyles.totalValue}>R$ 0</Text>
        </View>
      </View>
    );
  }

  // Build arc segments usando SVG via inline style trick com border
  // Usamos múltiplos View circulares sobrepostos com overflow hidden
  let cumulativePercent = 0;
  const segments = categories.map((cat) => {
    const percent = cat.value / total;
    const start = cumulativePercent;
    cumulativePercent += percent;
    return { ...cat, percent, start };
  });

  return (
    <View style={[donutStyles.wrapper, { width: SIZE, height: SIZE }]}>
      {/* Anel base cinza */}
      <View style={[
        donutStyles.ring,
        {
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          borderWidth: STROKE,
          borderColor: '#f0f0f0',
        }
      ]} />
      {/* Segmentos coloridos — simplificado: usamos bordas coloridas por quadrante */}
      {segments.map((seg, i) => {
        const dashArray = seg.percent * CIRCUMFERENCE;
        const dashOffset = (1 - seg.start) * CIRCUMFERENCE;
        return (
          <View
            key={i}
            style={[
              donutStyles.ring,
              {
                width: SIZE,
                height: SIZE,
                borderRadius: SIZE / 2,
                borderWidth: STROKE,
                borderColor: 'transparent',
                borderTopColor: seg.percent > 0.25 ? seg.color : 'transparent',
                borderRightColor: seg.percent > 0.5 ? seg.color : 'transparent',
                borderBottomColor: seg.percent > 0.75 ? seg.color : 'transparent',
                borderLeftColor: seg.color,
                transform: [{ rotate: `${seg.start * 360}deg` }],
                opacity: seg.percent > 0 ? 1 : 0,
              }
            ]}
          />
        );
      })}
      {/* Centro */}
      <View style={[donutStyles.center, { width: SIZE - STROKE * 2.5, height: SIZE - STROKE * 2.5, borderRadius: (SIZE - STROKE * 2.5) / 2 }]}>
        <Text style={donutStyles.totalLabel}>Total</Text>
        <Text style={donutStyles.totalValue} numberOfLines={1} adjustsFontSizeToFit>
          {formatCurrency(total)}
        </Text>
      </View>
    </View>
  );
};

const donutStyles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
  },
  emptyRing: {
    position: 'absolute',
    borderColor: '#f0f0f0',
  },
  center: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  totalLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '700',
    marginTop: 2,
  },
});

// ─── Summary Card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  amount: number;
  icon: string;
  color: string;
  bgColor: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, amount, icon, color, bgColor }) => (
  <View style={[styles.summaryCard, { backgroundColor: bgColor }]}>
    <View style={[styles.summaryIconWrap, { backgroundColor: `${color}18` }]}>
      <Ionicons name={icon as any} size={22} color={color} />
    </View>
    <Text style={styles.summaryLabel}>{label}</Text>
    <View style={styles.summaryValueRow}>
      <Text style={[styles.summaryCurrency, { color }]}>R$</Text>
      <Text
        style={[styles.summaryAmount, { color }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {formatAmount(amount)}
      </Text>
    </View>
  </View>
);

// ─── Transaction Item ─────────────────────────────────────────────────────────

const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const isIncome = transaction.type === 'income';
  const color = isIncome ? '#10b981' : '#ef4444';
  const bgColor = isIncome ? '#d1fae5' : '#fee2e2';
  const icon = isIncome ? 'arrow-down' : 'arrow-up';

  return (
    <View style={styles.txItem}>
      <View style={[styles.txIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon as any} size={15} color={color} />
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
  const [dismissedError, setDismissedError] = useState(false);
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { data, loading, error } = useFinance();

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

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Carregando dados financeiros...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {error && !dismissedError && (
          <ErrorBanner message={error} onDismiss={() => setDismissedError(true)} />
        )}

        {/* ── Header + summary cards sobre a transição azul/cinza ── */}
        <View style={styles.heroSection}>
          <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity style={styles.monthButton}>
                <Text style={styles.monthText}>Fevereiro</Text>
                <Ionicons name="chevron-down" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('UserSettings')}>
                <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.balanceLabel}>Saldo atual em contas</Text>
            <Text style={styles.balance}>
              {data ? formatCurrency(data.currentBalance) : 'R$ 0,00'}
            </Text>
          </LinearGradient>

          <View style={styles.summaryRow}>
            <SummaryCard
              label="Receitas"
              amount={data?.totalIncome ?? 0}
              icon="arrow-down-outline"
              color="#10b981"
              bgColor="#fff"
            />
            <SummaryCard
              label="Despesas"
              amount={data?.totalExpense ?? 0}
              icon="arrow-up-outline"
              color="#ef4444"
              bgColor="#fff"
            />
            <SummaryCard
              label="Cartões"
              amount={data?.totalCardSpent ?? 0}
              icon="card-outline"
              color="#f59e0b"
              bgColor="#fff"
            />
          </View>
        </View>

        {/* ── Content ── */}
        <View style={styles.content}>

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

          {/* Cartões */}
          {data && data.cards.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>CARTÕES</Text>
                <TouchableOpacity>
                  <Ionicons name="add-circle-outline" size={22} color="#3b82f6" />
                </TouchableOpacity>
              </View>
              {data.cards.map((card) => {
                const pct = Math.min((card.currentSpent / card.limit) * 100, 100);
                const barColor = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981';
                return (
                  <View key={card.id} style={styles.cardItem}>
                    <View style={styles.cardItemHeader}>
                      <Text style={styles.cardName}>{card.name}</Text>
                      <Text style={styles.cardPct}>{pct.toFixed(0)}%</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
                    </View>
                    <View style={styles.cardItemFooter}>
                      <Text style={styles.cardSpent}>Gasto: {formatCurrency(card.currentSpent)}</Text>
                      <Text style={styles.cardLimit}>Limite: {formatCurrency(card.limit)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Orçamento — placeholder visual */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>ORÇAMENTO</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Budget')}>
                <Ionicons name="add-circle-outline" size={22} color="#3b82f6" />
              </TouchableOpacity>
            </View>
            {data && data.transactions.length > 0 ? (
              <>
                <View style={styles.budgetRow}>
                  <View style={styles.budgetInfo}>
                    <Text style={styles.budgetLabel}>Meta</Text>
                    <Text style={styles.budgetValue}>{formatCurrency(data.totalIncome)}</Text>
                  </View>
                  <View style={styles.budgetBarWrap}>
                    <View style={styles.budgetTrack}>
                      <View style={[
                        styles.budgetFill,
                        {
                          width: `${Math.min((data.totalExpense / (data.totalIncome || 1)) * 100, 100)}%` as any,
                        }
                      ]} />
                    </View>
                    <Text style={styles.budgetPct}>
                      {data.totalIncome > 0
                        ? `${((data.totalExpense / data.totalIncome) * 100).toFixed(0)}%`
                        : '0%'}
                    </Text>
                  </View>
                </View>
                <View style={styles.budgetRow}>
                  <View style={styles.budgetInfo}>
                    <Text style={styles.budgetLabel}>Valor gasto</Text>
                    <Text style={styles.budgetValue}>{formatCurrency(data.totalExpense)}</Text>
                  </View>
                </View>
                <View style={styles.budgetRow}>
                  <View style={styles.budgetInfo}>
                    <Text style={styles.budgetLabel}>Previsto</Text>
                    <Text style={[styles.budgetValue, { color: data.currentBalance >= 0 ? '#10b981' : '#ef4444' }]}>
                      {formatCurrency(data.currentBalance)}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.emptySmall}>Adicione transações para ver o orçamento</Text>
            )}
          </View>

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

          {/* Empty state */}
          {!loading && (!data?.transactions || data.transactions.length === 0) && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="wallet-outline" size={40} color="#3b82f6" />
              </View>
              <Text style={styles.emptyTitle}>Nenhuma transação registrada</Text>
              <Text style={styles.emptyText}>Comece adicionando sua primeira transação</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('AddTransaction')}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.emptyButtonText}>Adicionar Transação</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>

      {/* ── Bottom Nav ── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Transactions')}
        >
          <Ionicons name="list" size={24} color="#c4c4c4" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navCenter}
          onPress={() => navigation.navigate('AddTransaction')}
        >
          <LinearGradient colors={['#34d399', '#10b981']} style={styles.fab}>
            <Ionicons name="add" size={30} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Charts')}>
          <Ionicons name="pie-chart" size={24} color="#c4c4c4" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('UserSettings')}
        >
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

  // Error
  errorBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fef2f2', borderLeftWidth: 4, borderLeftColor: '#ef4444',
    paddingHorizontal: 14, paddingVertical: 10, margin: 16, borderRadius: 8,
  },
  errorContent: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  errorText: { color: '#991b1b', fontSize: 12, fontWeight: '500', flex: 1 },

  heroSection: {
    marginBottom: 8,
  },
  header: {
    paddingTop: 52,
    paddingBottom: 64,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 18,
  },
  monthButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  monthText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  balanceLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 6 },
  balance: { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },

  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: -52,
    zIndex: 1,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  summaryIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  summaryLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '600', marginBottom: 4 },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
  },
  summaryCurrency: { fontSize: 11, fontWeight: '800' },
  summaryAmount: { fontSize: 13, fontWeight: '800', flexShrink: 1 },

  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Generic card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 12, fontWeight: '700', color: '#374151', letterSpacing: 0.8 },

  // Donut chart row
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  categoryList: { flex: 1, gap: 10 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  categoryName: { flex: 1, fontSize: 12, color: '#6b7280', fontWeight: '500' },
  categoryValue: { fontSize: 12, color: '#1f2937', fontWeight: '700' },

  // Credit cards
  cardItem: { marginBottom: 12 },
  cardItemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardName: { fontSize: 13, color: '#1f2937', fontWeight: '600' },
  cardPct: { fontSize: 12, color: '#3b82f6', fontWeight: '700' },
  progressTrack: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 3 },
  cardItemFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardSpent: { fontSize: 11, color: '#6b7280' },
  cardLimit: { fontSize: 11, color: '#9ca3af' },

  // Budget
  budgetRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  budgetInfo: { width: 110 },
  budgetLabel: { fontSize: 11, color: '#9ca3af', marginBottom: 2 },
  budgetValue: { fontSize: 13, color: '#1f2937', fontWeight: '700' },
  budgetBarWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  budgetTrack: { flex: 1, height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
  budgetFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 3 },
  budgetPct: { fontSize: 12, color: '#3b82f6', fontWeight: '700', minWidth: 32, textAlign: 'right' },
  emptySmall: { fontSize: 12, color: '#9ca3af', textAlign: 'center', paddingVertical: 8 },

  // Transactions
  seeAll: { fontSize: 12, color: '#3b82f6', fontWeight: '600' },
  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  txIcon: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  txContent: { flex: 1 },
  txCategory: { fontSize: 13, color: '#1f2937', fontWeight: '600', marginBottom: 2 },
  txDescription: { fontSize: 11, color: '#9ca3af' },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  txDate: { fontSize: 10, color: '#d1d5db' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, color: '#1f2937', fontWeight: '700', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#9ca3af', textAlign: 'center', marginBottom: 20 },
  emptyButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#3b82f6', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12,
  },
  emptyButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Bottom nav
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 72, backgroundColor: '#fff',
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#f3f4f6',
    paddingBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  navItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navCenter: { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  fab: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', borderRadius: 29 },
});
