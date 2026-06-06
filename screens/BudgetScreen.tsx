import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../config/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';

const CATEGORIES = [
  { key: 'moradia',     label: 'Moradia',      icon: 'home-outline',            color: '#a855f7' },
  { key: 'transporte',  label: 'Transporte',   icon: 'car-outline',             color: '#06b6d4' },
  { key: 'alimentação', label: 'Alimentação',  icon: 'restaurant-outline',      color: '#ec4899' },
  { key: 'saúde',       label: 'Saúde',        icon: 'medkit-outline',          color: '#10b981' },
  { key: 'lazer',       label: 'Lazer',        icon: 'game-controller-outline', color: '#f59e0b' },
  { key: 'outros',      label: 'Outros',       icon: 'ellipsis-horizontal',     color: '#6366f1' },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDisplay = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const value = parseInt(digits, 10) / 100;
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function BudgetScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { data } = useFinance();

  const [selectedCategory, setSelectedCategory] = useState('');
  const [rawAmount, setRawAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const displayAmount = formatDisplay(rawAmount);

  const handleAmountChange = useCallback((text: string) => {
    setRawAmount(text.replace(/\D/g, ''));
  }, []);

  const handleSave = useCallback(async () => {
    const finalAmount = parseInt(rawAmount, 10) / 100;

    if (!selectedCategory) {
      Alert.alert('Categoria obrigatória', 'Selecione uma categoria para o orçamento.');
      return;
    }
    if (!finalAmount || finalAmount <= 0) {
      Alert.alert('Valor inválido', 'Informe um valor maior que zero.');
      return;
    }
    if (!user?.uid) return;

    setLoading(true);
    try {
      await addDoc(collection(firestore, 'finance', user.uid, 'budgets'), {
        category: selectedCategory,
        limit: finalAmount,
        createdAt: serverTimestamp(),
      });
      Alert.alert('Sucesso', 'Meta de orçamento salva!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível salvar.');
    } finally {
      setLoading(false);
    }
  }, [rawAmount, selectedCategory, user, navigation]);

  // Calcula gasto atual por categoria
  const spentByCategory: Record<string, number> = {};
  (data?.transactions || [])
    .filter(t => t.type === 'expense')
    .forEach(t => {
      spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.amount;
    });

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meta de Orçamento</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Gastos atuais por categoria */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>GASTO ATUAL POR CATEGORIA</Text>
          {CATEGORIES.map(cat => {
            const spent = spentByCategory[cat.key] || 0;
            return (
              <View key={cat.key} style={styles.spentRow}>
                <View style={[styles.catIconWrap, { backgroundColor: `${cat.color}18` }]}>
                  <Ionicons name={cat.icon as any} size={16} color={cat.color} />
                </View>
                <Text style={styles.spentLabel}>{cat.label}</Text>
                <Text style={[styles.spentValue, { color: spent > 0 ? '#ef4444' : '#9ca3af' }]}>
                  {spent > 0 ? formatCurrency(spent) : '—'}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Definir meta */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>DEFINIR NOVA META</Text>

          <Text style={styles.label}>Categoria</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryChip, isActive && { backgroundColor: cat.color, borderColor: cat.color }]}
                  onPress={() => setSelectedCategory(cat.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={cat.icon as any} size={15} color={isActive ? '#fff' : cat.color} />
                  <Text style={[styles.chipText, isActive && { color: '#fff' }]}>{cat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.label, { marginTop: 20 }]}>Valor limite</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.amountInput}
              value={displayAmount}
              onChangeText={handleAmountChange}
              keyboardType="number-pad"
              placeholder="0,00"
              placeholderTextColor="#d1d5db"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Salvar Meta</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f3f4f6' },
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  header: {
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18,
    marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardTitle: { fontSize: 11, fontWeight: '700', color: '#6b7280', letterSpacing: 1, marginBottom: 16 },

  spentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  catIconWrap: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  spentLabel: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '500' },
  spentValue: { fontSize: 13, fontWeight: '700' },

  label: { fontSize: 11, fontWeight: '700', color: '#6b7280', letterSpacing: 1, marginBottom: 12 },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  chipText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },

  amountRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, borderWidth: 1, borderColor: '#e5e7eb',
  },
  currencySymbol: { fontSize: 20, fontWeight: '700', color: '#3b82f6' },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '700', color: '#1f2937' },

  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 14, marginTop: 20,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
