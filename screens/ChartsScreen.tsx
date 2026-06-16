import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFinance } from '../context/FinanceContext';
import { groupExpensesByCategory } from '../utils/firebaseQueries';
import { Transaction } from '../types';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 64;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const CATEGORY_COLORS: Record<string, string> = {
  moradia: '#a855f7',
  transporte: '#06b6d4',
  alimentação: '#ec4899',
  saúde: '#10b981',
  lazer: '#f59e0b',
  cartão: '#3b82f6',
  outros: '#6366f1',
  salário: '#10b981',
  freelance: '#06b6d4',
  investimento: '#3b82f6',
};
const getColor = (cat: string) => CATEGORY_COLORS[cat.toLowerCase()] || '#6366f1';

// ─── Donut Chart ──────────────────────────────────────────────────────────────

const DonutChart: React.FC<{
  categories: { name: string; value: number; color: string }[];
  total: number;
  size?: number;
}> = ({ categories, total, size = 160 }) => {
  const STROKE = 20;
  if (total === 0) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: STROKE, borderColor: '#f0f0f0', position: 'absolute',
        }} />
        <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '600' }}>Sem dados</Text>
      </View>
    );
  }
  let cum = 0;
  const segments = categories.map(cat => {
    const pct = cat.value / total;
    const start = cum; cum += pct;
    return { ...cat, pct, start };
  });
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: STROKE, borderColor: '#f0f0f0', position: 'absolute' }} />
      {segments.map((seg, i) => (
        <View key={i} style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: STROKE, position: 'absolute',
          borderColor: 'transparent',
          borderTopColor: seg.pct > 0.25 ? seg.color : 'transparent',
          borderRightColor: seg.pct > 0.5 ? seg.color : 'transparent',
          borderBottomColor: seg.pct > 0.75 ? seg.color : 'transparent',
          borderLeftColor: seg.color,
          transform: [{ rotate: `${seg.start * 360}deg` }],
          opacity: seg.pct > 0 ? 1 : 0,
        }} />
      ))}
      <View style={{
        width: size - STROKE * 2.5, height: size - STROKE * 2.5,
        borderRadius: (size - STROKE * 2.5) / 2,
        backgroundColor: '#fff', position: 'absolute',
        justifyContent: 'center', alignItems: 'center',
      }}>
        <Text style={{ fontSize: 10, color: '#9ca3af', fontWeight: '600' }}>Total</Text>
        <Text style={{ fontSize: 14, color: '#1f2937', fontWeight: '800', marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit>
          {formatCurrency(total)}
        </Text>
      </View>
    </View>
  );
};

// ─── Bar Chart ────────────────────────────────────────────────────────────────

const BarChart: React.FC<{
  bars: { label: string; value: number; color: string }[];
  maxValue: number;
}> = ({ bars, maxValue }) => {
  const BAR_HEIGHT = 140;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: BAR_HEIGHT + 30 }}>
      {bars.map((bar, i) => {
        const heightPct = maxValue > 0 ? bar.value / maxValue : 0;
        const barH = Math.max(heightPct * BAR_HEIGHT, 4);
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
            <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 4, fontWeight: '600' }} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(bar.value).replace('R$\u00a0', '')}
            </Text>
            <View style={{
              width: '100%', height: barH, backgroundColor: bar.color,
              borderRadius: 6, opacity: 0.85,
            }} />
            <Text style={{ fontSize: 9, color: '#9ca3af', marginTop: 6, textAlign: 'center' }} numberOfLines={2}>
              {bar.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// ─── Insight Card ─────────────────────────────────────────────────────────────

const InsightCard: React.FC<{
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  type: 'warning' | 'success' | 'info';
}> = ({ icon, iconColor, iconBg, title, description, type }) => {
  const borderColor = type === 'warning' ? '#fbbf24' : type === 'success' ? '#34d399' : '#60a5fa';
  return (
    <View style={[insightStyles.card, { borderLeftColor: borderColor }]}>
      <View style={[insightStyles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={insightStyles.title}>{title}</Text>
        <Text style={insightStyles.desc}>{description}</Text>
      </View>
    </View>
  );
};

const insightStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 10, borderLeftWidth: 4,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 13, color: '#1f2937', fontWeight: '700', marginBottom: 3 },
  desc: { fontSize: 12, color: '#6b7280', lineHeight: 17 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

type TabKey = 'despesas' | 'receitas' | 'fluxo';

export default function ChartsScreen() {
  const navigation = useNavigation<any>();
  const { data } = useFinance();
  const [activeTab, setActiveTab] = useState<TabKey>('despesas');

  const transactions = data?.transactions || [];

  // Categorias de despesa
  const expenseByCategory = useMemo(() => {
    const grouped = groupExpensesByCategory(transactions);
    return Object.entries(grouped)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, color: getColor(name) }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const totalExpenses = useMemo(() => expenseByCategory.reduce((s, c) => s + c.value, 0), [expenseByCategory]);

  // Categorias de receita
  const incomeByCategory = useMemo(() => {
    const grouped: Record<string, number> = {};
    transactions.filter(t => t.type === 'income').forEach(t => {
      grouped[t.category] = (grouped[t.category] || 0) + t.amount;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, color: getColor(name) }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const totalIncome = useMemo(() => incomeByCategory.reduce((s, c) => s + c.value, 0), [incomeByCategory]);

  // Fluxo: últimos 6 meses (income vs expense)
  const flowData = useMemo(() => {
    const months: Record<string, { income: number; expense: number }> = {};
    transactions.forEach(t => {
      const date = t.createdAt?.toDate?.() || new Date(t.createdAt);
      const key = `${date.getMonth() + 1}/${String(date.getFullYear()).slice(2)}`;
      if (!months[key]) months[key] = { income: 0, expense: 0 };
      if (t.type === 'income') months[key].income += t.amount;
      else months[key].expense += t.amount;
    });
    return Object.entries(months).slice(-6).map(([label, v]) => ({ label, ...v }));
  }, [transactions]);

  // ── Insights ──────────────────────────────────────────────────────────────

  const insights = useMemo(() => {
    const list: { icon: string; iconColor: string; iconBg: string; title: string; description: string; type: 'warning' | 'success' | 'info' }[] = [];
    const balance = (data?.currentBalance ?? 0);
    const income = data?.totalIncome ?? 0;
    const expense = data?.totalExpense ?? 0;

    if (income === 0 && expense === 0) {
      list.push({ icon: 'information-circle-outline', iconColor: '#3b82f6', iconBg: '#eff6ff', title: 'Sem dados ainda', description: 'Adicione transações para receber insights personalizados.', type: 'info' });
      return list;
    }

    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    if (savingsRate >= 20) {
      list.push({ icon: 'trending-up-outline', iconColor: '#10b981', iconBg: '#d1fae5', title: 'Ótima taxa de poupança!', description: `Você está guardando ${savingsRate.toFixed(0)}% da sua renda. Continue assim para atingir suas metas.`, type: 'success' });
    } else if (savingsRate > 0) {
      list.push({ icon: 'alert-circle-outline', iconColor: '#f59e0b', iconBg: '#fef3c7', title: 'Taxa de poupança baixa', description: `Você poupa apenas ${savingsRate.toFixed(0)}% da renda. O ideal é poupar ao menos 20%. Tente reduzir gastos variáveis.`, type: 'warning' });
    } else if (savingsRate <= 0 && income > 0) {
      list.push({ icon: 'warning-outline', iconColor: '#ef4444', iconBg: '#fee2e2', title: 'Gastos maiores que receitas!', description: `Suas despesas superam a renda em ${formatCurrency(Math.abs(balance))}. Revise seus gastos com urgência.`, type: 'warning' });
    }

    // Categoria mais gastada
    if (expenseByCategory.length > 0) {
      const top = expenseByCategory[0];
      const topPct = totalExpenses > 0 ? (top.value / totalExpenses) * 100 : 0;
      if (topPct > 40) {
        list.push({ icon: 'pie-chart-outline', iconColor: '#a855f7', iconBg: '#f3e8ff', title: `${top.name} concentra ${topPct.toFixed(0)}% dos gastos`, description: `Essa categoria domina suas despesas. Analise se há formas de reduzir ou otimizar esses custos.`, type: 'warning' });
      } else {
        list.push({ icon: 'checkmark-circle-outline', iconColor: '#10b981', iconBg: '#d1fae5', title: 'Gastos bem distribuídos', description: `Nenhuma categoria domina mais de 40% das despesas. Seu controle está equilibrado.`, type: 'success' });
      }
    }

    // Receita diversificada?
    if (incomeByCategory.length === 1) {
      list.push({ icon: 'alert-outline', iconColor: '#f59e0b', iconBg: '#fef3c7', title: 'Renda concentrada em uma fonte', description: 'Depender de uma única fonte de renda é arriscado. Considere diversificar com freelances ou investimentos.', type: 'info' });
    } else if (incomeByCategory.length > 1) {
      list.push({ icon: 'shield-checkmark-outline', iconColor: '#3b82f6', iconBg: '#eff6ff', title: 'Renda diversificada', description: `Você possui ${incomeByCategory.length} fontes de renda. Isso aumenta sua segurança financeira.`, type: 'success' });
    }

    return list;
  }, [data, expenseByCategory, incomeByCategory, totalExpenses]);

  // ── Tab content ───────────────────────────────────────────────────────────

  const renderTabContent = () => {
    if (activeTab === 'despesas') {
      return (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>DISTRIBUIÇÃO DE DESPESAS</Text>
            <View style={styles.donutRow}>
              <DonutChart categories={expenseByCategory} total={totalExpenses} size={150} />
              <View style={{ flex: 1, gap: 8 }}>
                {expenseByCategory.map((cat, i) => (
                  <View key={i} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                    <Text style={styles.legendName} numberOfLines={1}>{cat.name}</Text>
                    <Text style={styles.legendValue}>{totalExpenses > 0 ? `${((cat.value / totalExpenses) * 100).toFixed(0)}%` : '0%'}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>VALOR POR CATEGORIA</Text>
            <View style={{ gap: 10, marginTop: 8 }}>
              {expenseByCategory.map((cat, i) => {
                const pct = totalExpenses > 0 ? (cat.value / totalExpenses) * 100 : 0;
                return (
                  <View key={i}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                        <Text style={{ fontSize: 12, color: '#374151', fontWeight: '600' }}>{cat.name}</Text>
                      </View>
                      <Text style={{ fontSize: 12, color: '#1f2937', fontWeight: '700' }}>{formatCurrency(cat.value)}</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: cat.color }]} />
                    </View>
                  </View>
                );
              })}
              {expenseByCategory.length === 0 && (
                <Text style={styles.emptyText}>Nenhuma despesa registrada</Text>
              )}
            </View>
          </View>
        </>
      );
    }

    if (activeTab === 'receitas') {
      return (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>DISTRIBUIÇÃO DE RECEITAS</Text>
            <View style={styles.donutRow}>
              <DonutChart categories={incomeByCategory} total={totalIncome} size={150} />
              <View style={{ flex: 1, gap: 8 }}>
                {incomeByCategory.map((cat, i) => (
                  <View key={i} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                    <Text style={styles.legendName} numberOfLines={1}>{cat.name}</Text>
                    <Text style={styles.legendValue}>{totalIncome > 0 ? `${((cat.value / totalIncome) * 100).toFixed(0)}%` : '0%'}</Text>
                  </View>
                ))}
                {incomeByCategory.length === 0 && (
                  <Text style={styles.emptyText}>Sem receitas</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>RECEITA vs DESPESA</Text>
            <View style={{ marginTop: 8, gap: 12 }}>
              {[
                { label: 'Receita total', value: data?.totalIncome ?? 0, color: '#10b981' },
                { label: 'Despesa total', value: data?.totalExpense ?? 0, color: '#ef4444' },
                { label: 'Gasto em cartões', value: data?.totalCardSpent ?? 0, color: '#f59e0b' },
              ].map((item, i) => {
                const max = Math.max(data?.totalIncome ?? 0, data?.totalExpense ?? 0, data?.totalCardSpent ?? 0, 1);
                const pct = (item.value / max) * 100;
                return (
                  <View key={i}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                      <Text style={{ fontSize: 12, color: '#374151', fontWeight: '600' }}>{item.label}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: item.color }}>{formatCurrency(item.value)}</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: item.color }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </>
      );
    }

    // Fluxo
    const maxFlow = Math.max(...flowData.map(d => Math.max(d.income, d.expense)), 1);
    return (
      <>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>FLUXO DE CAIXA</Text>
          {flowData.length > 0 ? (
            <>
              <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16, marginTop: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981' }} />
                  <Text style={{ fontSize: 11, color: '#6b7280' }}>Receitas</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' }} />
                  <Text style={{ fontSize: 11, color: '#6b7280' }}>Despesas</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {flowData.map((d, i) => {
                  const BAR_MAX = 120;
                  const incH = Math.max((d.income / maxFlow) * BAR_MAX, 4);
                  const expH = Math.max((d.expense / maxFlow) * BAR_MAX, 4);
                  return (
                    <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: BAR_MAX }}>
                        <View style={{ flex: 1, height: incH, backgroundColor: '#10b981', borderRadius: 4, opacity: 0.85 }} />
                        <View style={{ flex: 1, height: expH, backgroundColor: '#ef4444', borderRadius: 4, opacity: 0.85 }} />
                      </View>
                      <Text style={{ fontSize: 9, color: '#9ca3af', marginTop: 5, textAlign: 'center' }}>{d.label}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            <Text style={[styles.emptyText, { marginTop: 16 }]}>Sem dados de fluxo ainda</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>RESUMO FINANCEIRO</Text>
          <View style={{ gap: 12, marginTop: 8 }}>
            {[
              { label: 'Total de receitas', value: formatCurrency(data?.totalIncome ?? 0), color: '#10b981', icon: 'arrow-down-circle-outline' },
              { label: 'Total de despesas', value: formatCurrency(data?.totalExpense ?? 0), color: '#ef4444', icon: 'arrow-up-circle-outline' },
              { label: 'Saldo atual', value: formatCurrency(data?.currentBalance ?? 0), color: (data?.currentBalance ?? 0) >= 0 ? '#10b981' : '#ef4444', icon: 'wallet-outline' },
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${item.color}15`, justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '500' }}>{item.label}</Text>
                  <Text style={{ fontSize: 15, color: item.color, fontWeight: '800' }}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Análise Financeira</Text>
          <TouchableOpacity onPress={() => navigation.navigate('UserSettings')}>
            <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {([
            { key: 'despesas', label: 'Despesas' },
            { key: 'receitas', label: 'Receitas' },
            { key: 'fluxo', label: 'Fluxo' },
          ] as { key: TabKey; label: string }[]).map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Charts */}
        {renderTabContent()}

        {/* Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.insightsTitle}>💡 INSIGHTS E DICAS</Text>
          {insights.map((ins, i) => (
            <InsightCard key={i} {...ins} />
          ))}
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={24} color="#c4c4c4" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Transactions')}
        >
          <Ionicons name="list" size={24} color="#c4c4c4" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navCenter} onPress={() => navigation.navigate('AddTransaction')}>
          <LinearGradient colors={['#34d399', '#10b981']} style={styles.fab}>
            <Ionicons name="add" size={30} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="pie-chart" size={24} color="#3b82f6" />
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
  scrollContent: { padding: 16, paddingBottom: 100 },

  // Header
  header: { paddingTop: 52, paddingBottom: 0, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },

  // Tabs
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 0 },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#fff' },
  tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  tabTextActive: { color: '#fff' },

  // Cards
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18,
    marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardTitle: { fontSize: 11, fontWeight: '700', color: '#6b7280', letterSpacing: 1, marginBottom: 16 },

  // Donut row
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { flex: 1, fontSize: 12, color: '#6b7280', fontWeight: '500' },
  legendValue: { fontSize: 12, color: '#1f2937', fontWeight: '700' },

  // Progress
  progressTrack: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  // Insights
  insightsSection: { marginTop: 4, marginBottom: 8 },
  insightsTitle: { fontSize: 12, fontWeight: '700', color: '#374151', letterSpacing: 0.8, marginBottom: 12 },

  emptyText: { fontSize: 12, color: '#9ca3af', textAlign: 'center' },

  // Bottom nav
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 72, backgroundColor: '#fff',
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 }, elevation: 8,
  },
  navItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navCenter: { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  fab: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', borderRadius: 29 },
});
