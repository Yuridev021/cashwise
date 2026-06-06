import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../config/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type TransactionType = 'income' | 'expense' | 'card';

interface CategoryOption {
  key: string;
  label: string;
  icon: string;
  color: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INCOME_CATEGORIES: CategoryOption[] = [
  { key: 'salário',     label: 'Salário',      icon: 'briefcase-outline',    color: '#10b981' },
  { key: 'freelance',   label: 'Freelance',    icon: 'laptop-outline',       color: '#06b6d4' },
  { key: 'investimento',label: 'Investimento', icon: 'trending-up-outline',  color: '#3b82f6' },
  { key: 'outros',      label: 'Outros',       icon: 'ellipsis-horizontal',  color: '#6366f1' },
];

const EXPENSE_CATEGORIES: CategoryOption[] = [
  { key: 'moradia',     label: 'Moradia',      icon: 'home-outline',         color: '#a855f7' },
  { key: 'transporte',  label: 'Transporte',   icon: 'car-outline',          color: '#06b6d4' },
  { key: 'alimentação', label: 'Alimentação',  icon: 'restaurant-outline',   color: '#ec4899' },
  { key: 'saúde',       label: 'Saúde',        icon: 'medkit-outline',       color: '#10b981' },
  { key: 'lazer',       label: 'Lazer',        icon: 'game-controller-outline', color: '#f59e0b' },
  { key: 'outros',      label: 'Outros',       icon: 'ellipsis-horizontal',  color: '#6366f1' },
];

const TYPE_TABS: { key: TransactionType; label: string; color: string }[] = [
  { key: 'income',  label: 'Receita',  color: '#10b981' },
  { key: 'expense', label: 'Despesa',  color: '#ef4444' },
  { key: 'card',    label: 'Cartão',   color: '#f59e0b' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseCurrencyInput = (raw: string): number => {
  const clean = raw.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(clean) || 0;
};

const formatDisplay = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const value = parseInt(digits, 10) / 100;
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface CategoryGridProps {
  options: CategoryOption[];
  selected: string;
  onSelect: (key: string) => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ options, selected, onSelect }) => (
  <View style={styles.categoryGrid}>
    {options.map((cat) => {
      const isActive = selected === cat.key;
      return (
        <TouchableOpacity
          key={cat.key}
          style={[
            styles.categoryChip,
            isActive && { backgroundColor: cat.color, borderColor: cat.color },
          ]}
          onPress={() => onSelect(cat.key)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={cat.icon as any}
            size={16}
            color={isActive ? '#fff' : cat.color}
          />
          <Text style={[styles.categoryChipText, isActive && { color: '#fff' }]}>
            {cat.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddTransactionScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { data, refreshData } = useFinance();

  const [type, setType]               = useState<TransactionType>('expense');
  const [rawAmount, setRawAmount]     = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]       = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [loading, setLoading]         = useState(false);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const activeColor = TYPE_TABS.find((t) => t.key === type)?.color ?? '#3b82f6';

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAmountChange = useCallback((text: string) => {
    const digits = text.replace(/\D/g, '');
    setRawAmount(digits);
  }, []);

  const handleTypeChange = useCallback((newType: TransactionType) => {
    setType(newType);
    setCategory('');
    setSelectedCard('');
  }, []);

  const handleSubmit = useCallback(async () => {
    const amount = parseCurrencyInput(rawAmount.replace(/\D/g, '').replace(/(\d{2})$/, ',$1'));
    const finalAmount = parseInt(rawAmount, 10) / 100;

    if (!finalAmount || finalAmount <= 0) {
      Alert.alert('Valor inválido', 'Informe um valor maior que zero.');
      return;
    }
    if (!category && type !== 'card') {
      Alert.alert('Categoria obrigatória', 'Selecione uma categoria.');
      return;
    }
    if (type === 'card' && !selectedCard) {
      Alert.alert('Cartão obrigatório', 'Selecione um cartão.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Descrição obrigatória', 'Informe uma descrição.');
      return;
    }

    if (!user?.uid) {
      Alert.alert('Erro', 'Você precisa estar logado para salvar uma transação.');
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, any> = {
        userId:      user.uid,
        type:        type === 'card' ? 'expense' : type,
        amount:      finalAmount,
        category:    type === 'card' ? 'cartão' : category,
        description: description.trim(),
        createdAt:   serverTimestamp(),
      };

      if (type === 'card') {
        payload.cardId = selectedCard;
      }

      await addDoc(
        collection(firestore, 'finance', user.uid, 'transactions'),
        payload,
      );

      await refreshData();

      Alert.alert('Sucesso', 'Transação adicionada!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível salvar a transação.');
    } finally {
      setLoading(false);
    }
  }, [rawAmount, category, description, type, selectedCard, user, refreshData, navigation]);

  // ── Render ───────────────────────────────────────────────────────────────────

  const displayAmount = formatDisplay(rawAmount);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <LinearGradient colors={['#3b82f6', '#1e40af']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nova Transação</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Type selector */}
        <View style={styles.typeTabsContainer}>
          {TYPE_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.typeTab,
                type === tab.key && { backgroundColor: tab.color, borderColor: tab.color },
              ]}
              onPress={() => handleTypeChange(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeTabText, type === tab.key && { color: '#fff' }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Valor</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.currencySymbol, { color: activeColor }]}>R$</Text>
            <TextInput
              style={[styles.amountInput, { color: activeColor }]}
              value={displayAmount}
              onChangeText={handleAmountChange}
              keyboardType="number-pad"
              placeholder="0,00"
              placeholderTextColor="#d1d5db"
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DESCRIÇÃO</Text>
          <TextInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Ex: Supermercado, Salário, Netflix..."
            placeholderTextColor="#9ca3af"
            maxLength={100}
          />
        </View>

        {/* Category (income / expense) */}
        {type !== 'card' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CATEGORIA</Text>
            <CategoryGrid
              options={categories}
              selected={category}
              onSelect={setCategory}
            />
          </View>
        )}

        {/* Card selector */}
        {type === 'card' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CARTÃO</Text>
            {data?.cards && data.cards.length > 0 ? (
              <View style={styles.categoryGrid}>
                {data.cards.map((card) => {
                  const isActive = selectedCard === card.id;
                  return (
                    <TouchableOpacity
                      key={card.id}
                      style={[
                        styles.categoryChip,
                        isActive && { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
                      ]}
                      onPress={() => setSelectedCard(card.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="card-outline"
                        size={16}
                        color={isActive ? '#fff' : '#f59e0b'}
                      />
                      <Text style={[styles.categoryChipText, isActive && { color: '#fff' }]}>
                        {card.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyText}>Nenhum cartão cadastrado.</Text>
            )}
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: activeColor }, loading && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.submitText}>Salvar Transação</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },

  // Header
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  // Type tabs
  typeTabsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },

  // Amount card
  amountCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  amountLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
  },
  amountInput: {
    fontSize: 40,
    fontWeight: '700',
    minWidth: 120,
    textAlign: 'center',
  },

  // Generic section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  // Text input
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  // Category grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },

  emptyText: {
    color: '#9ca3af',
    fontSize: 13,
  },

  // Submit
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
