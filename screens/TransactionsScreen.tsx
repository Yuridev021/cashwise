import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { deleteTransaction, updateTransaction } from '../utils/firebaseQueries';
import { Transaction } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate?.() || new Date(timestamp);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(date);
};

const formatDisplay = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const value = parseInt(digits, 10) / 100;
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ─── Constants ────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'income' | 'expense';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all',     label: 'Todas'    },
  { key: 'income',  label: 'Receitas' },
  { key: 'expense', label: 'Despesas' },
];

const EXPENSE_CATEGORIES = [
  { key: 'moradia',     label: 'Moradia'      },
  { key: 'transporte',  label: 'Transporte'   },
  { key: 'alimentação', label: 'Alimentação'  },
  { key: 'saúde',       label: 'Saúde'        },
  { key: 'lazer',       label: 'Lazer'        },
  { key: 'outros',      label: 'Outros'       },
];

const INCOME_CATEGORIES = [
  { key: 'salário',      label: 'Salário'      },
  { key: 'freelance',    label: 'Freelance'    },
  { key: 'investimento', label: 'Investimento' },
  { key: 'outros',       label: 'Outros'       },
];

// ─── Action Sheet Modal ───────────────────────────────────────────────────────

interface ActionSheetProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ActionSheet: React.FC<ActionSheetProps> = ({ visible, transaction, onClose, onEdit, onDelete }) => {
  if (!transaction) return null;

  const isIncome = transaction.type === 'income';
  const color    = isIncome ? '#10b981' : '#ef4444';
  const bgColor  = isIncome ? '#d1fae5' : '#fee2e2';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={actionStyles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={actionStyles.sheet}>
          <View style={actionStyles.handle} />

          {/* Preview da transação */}
          <View style={actionStyles.preview}>
            <View style={[actionStyles.previewIcon, { backgroundColor: bgColor }]}>
              <Ionicons name={isIncome ? 'arrow-down' : 'arrow-up'} size={18} color={color} />
            </View>
            <View style={actionStyles.previewInfo}>
              <Text style={actionStyles.previewDescription} numberOfLines={1}>
                {transaction.description}
              </Text>
              <Text style={actionStyles.previewCategory}>{transaction.category}</Text>
            </View>
            <Text style={[actionStyles.previewAmount, { color }]}>
              {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
            </Text>
          </View>

          <View style={actionStyles.divider} />

          {/* Ações */}
          <TouchableOpacity style={actionStyles.action} onPress={onEdit}>
            <View style={[actionStyles.actionIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="pencil-outline" size={20} color="#3b82f6" />
            </View>
            <Text style={[actionStyles.actionText, { color: '#3b82f6' }]}>Editar transação</Text>
            <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={actionStyles.action} onPress={onDelete}>
            <View style={[actionStyles.actionIcon, { backgroundColor: '#fef2f2' }]}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </View>
            <Text style={[actionStyles.actionText, { color: '#ef4444' }]}>Excluir transação</Text>
            <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={actionStyles.cancelButton} onPress={onClose}>
            <Text style={actionStyles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const actionStyles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingBottom: 36, paddingHorizontal: 20,
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#e5e7eb',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  preview: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#f9fafb', borderRadius: 14, padding: 14,
    marginBottom: 16,
  },
  previewIcon: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  previewInfo: { flex: 1 },
  previewDescription: { fontSize: 14, color: '#1f2937', fontWeight: '600' },
  previewCategory:    { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  previewAmount:      { fontSize: 15, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginBottom: 8 },
  action: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14,
  },
  actionIcon: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  actionText:   { flex: 1, fontSize: 15, fontWeight: '600' },
  cancelButton: {
    marginTop: 8, paddingVertical: 16,
    backgroundColor: '#f3f4f6', borderRadius: 14, alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#6b7280' },
});

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (id: string, data: Partial<Transaction>) => Promise<void>;
}

const EditModal: React.FC<EditModalProps> = ({ visible, transaction, onClose, onSave }) => {
  const [description, setDescription] = useState('');
  const [rawAmount, setRawAmount]     = useState('');
  const [category, setCategory]       = useState('');
  const [type, setType]               = useState<'income' | 'expense'>('expense');
  const [loading, setLoading]         = useState(false);

  React.useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setRawAmount(String(Math.round(transaction.amount * 100)));
      setCategory(transaction.category);
      setType(transaction.type);
    }
  }, [transaction]);

  const categories  = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const displayAmount = formatDisplay(rawAmount);
  const activeColor   = type === 'income' ? '#10b981' : '#ef4444';

  const handleSave = async () => {
    if (!transaction) return;
    const finalAmount = parseInt(rawAmount, 10) / 100;
    if (!finalAmount || finalAmount <= 0) {
      Alert.alert('Valor inválido', 'Informe um valor maior que zero.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Descrição obrigatória', 'Informe uma descrição.');
      return;
    }
    setLoading(true);
    try {
      await onSave(transaction.id, { amount: finalAmount, description: description.trim(), category, type });
      onClose();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.handle} />
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Editar Transação</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={modalStyles.typeRow}>
            {(['expense', 'income'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[modalStyles.typeTab, type === t && {
                  backgroundColor: t === 'income' ? '#10b981' : '#ef4444',
                  borderColor:     t === 'income' ? '#10b981' : '#ef4444',
                }]}
                onPress={() => { setType(t); setCategory(''); }}
              >
                <Text style={[modalStyles.typeTabText, type === t && { color: '#fff' }]}>
                  {t === 'income' ? 'Receita' : 'Despesa'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={modalStyles.label}>Valor</Text>
          <View style={[modalStyles.amountRow, { borderColor: `${activeColor}40` }]}>
            <Text style={[modalStyles.currency, { color: activeColor }]}>R$</Text>
            <TextInput
              style={[modalStyles.amountInput, { color: activeColor }]}
              value={displayAmount}
              onChangeText={t => setRawAmount(t.replace(/\D/g, ''))}
              keyboardType="number-pad"
              placeholder="0,00"
              placeholderTextColor="#d1d5db"
            />
          </View>

          <Text style={modalStyles.label}>Descrição</Text>
          <TextInput
            style={modalStyles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Descrição"
            placeholderTextColor="#9ca3af"
            maxLength={100}
          />

          <Text style={modalStyles.label}>Categoria</Text>
          <View style={modalStyles.categoryGrid}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[modalStyles.categoryChip, category === cat.key && { backgroundColor: activeColor, borderColor: activeColor }]}
                onPress={() => setCategory(cat.key)}
              >
                <Text style={[modalStyles.categoryChipText, category === cat.key && { color: '#fff' }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[modalStyles.saveButton, { backgroundColor: activeColor }, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={modalStyles.saveButtonText}>Salvar alterações</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  container: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40,
  },
  handle: { width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  label: { fontSize: 11, fontWeight: '700', color: '#6b7280', letterSpacing: 1, marginBottom: 10, marginTop: 14 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  typeTab: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center',
  },
  typeTabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  amountRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f9fafb', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5,
  },
  currency:    { fontSize: 20, fontWeight: '700' },
  amountInput: { flex: 1, fontSize: 26, fontWeight: '700' },
  input: {
    backgroundColor: '#f9fafb', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#1f2937',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  categoryGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  categoryChipText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  saveButton:       { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  saveButtonText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
});

// ─── Transaction Item ─────────────────────────────────────────────────────────

interface TransactionItemProps {
  transaction: Transaction;
  onPress: (t: Transaction) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onPress }) => {
  const isIncome = transaction.type === 'income';
  const color    = isIncome ? '#10b981' : '#ef4444';
  const bgColor  = isIncome ? '#d1fae5' : '#fee2e2';

  return (
    <TouchableOpacity
      style={itemStyles.card}
      onPress={() => onPress(transaction)}
      activeOpacity={0.7}
    >
      <View style={[itemStyles.icon, { backgroundColor: bgColor }]}>
        <Ionicons name={isIncome ? 'arrow-down' : 'arrow-up'} size={15} color={color} />
      </View>
      <View style={itemStyles.content}>
        <Text style={itemStyles.category}>{transaction.category}</Text>
        <Text style={itemStyles.description} numberOfLines={1}>{transaction.description}</Text>
      </View>
      <View style={itemStyles.right}>
        <Text style={[itemStyles.amount, { color }]}>
          {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
        </Text>
        <Text style={itemStyles.date}>{formatDate(transaction.createdAt)}</Text>
      </View>
      {/* Indicador visual de que é clicável */}
      <Ionicons name="ellipsis-vertical" size={16} color="#d1d5db" style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
};

const itemStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  icon:        { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  content:     { flex: 1 },
  category:    { fontSize: 13, color: '#1f2937', fontWeight: '600', marginBottom: 2 },
  description: { fontSize: 11, color: '#9ca3af' },
  right:       { alignItems: 'flex-end' },
  amount:      { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  date:        { fontSize: 10, color: '#d1d5db' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const navigation = useNavigation<any>();
  const { user }   = useAuth();
  const { data }   = useFinance();

  const [filter, setFilter]             = useState<FilterType>('all');
  const [selectedTx, setSelectedTx]     = useState<Transaction | null>(null);
  const [actionVisible, setActionVisible] = useState(false);
  const [editingTx, setEditingTx]       = useState<Transaction | null>(null);

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

  const handlePressItem = useCallback((tx: Transaction) => {
    setSelectedTx(tx);
    setActionVisible(true);
  }, []);

  const handleCloseAction = useCallback(() => {
    setActionVisible(false);
  }, []);

  const handleEditFromAction = useCallback(() => {
    setActionVisible(false);
    // pequeno delay para o sheet fechar antes de abrir o edit modal
    setTimeout(() => setEditingTx(selectedTx), 300);
  }, [selectedTx]);

  const handleDeleteFromAction = useCallback(() => {
    setActionVisible(false);
    if (!selectedTx) return;
    Alert.alert(
      'Excluir transação',
      `Deseja excluir "${selectedTx.description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(user!.uid, selectedTx.id);
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir a transação.');
            }
          },
        },
      ]
    );
  }, [selectedTx, user]);

  const handleUpdate = useCallback(async (id: string, updatedData: Partial<Transaction>) => {
    await updateTransaction(user!.uid, id, updatedData);
  }, [user]);

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
          renderItem={({ item }) => (
            <TransactionItem transaction={item} onPress={handlePressItem} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      {/* Action Sheet — toque na transação */}
      <ActionSheet
        visible={actionVisible}
        transaction={selectedTx}
        onClose={handleCloseAction}
        onEdit={handleEditFromAction}
        onDelete={handleDeleteFromAction}
      />

      {/* Edit Modal */}
      <EditModal
        visible={!!editingTx}
        transaction={editingTx}
        onClose={() => setEditingTx(null)}
        onSave={handleUpdate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f3f4f6' },

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
    borderRadius: 16, padding: 16, marginBottom: 16,
  },
  summaryItem:   { flex: 1, alignItems: 'center' },
  summaryLabel:  { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  summaryValue:  { fontSize: 14, color: '#fff', fontWeight: '800' },
  summaryDivider:{ width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },

  filterRow: { flexDirection: 'row' },
  filterTab: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  filterText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },

  listContent: { padding: 16, paddingBottom: 40 },

  empty:      { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, color: '#374151', fontWeight: '700' },
  emptyText:  { fontSize: 13, color: '#9ca3af' },
});
