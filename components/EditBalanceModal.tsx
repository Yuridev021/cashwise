import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EditBalanceModalProps {
  visible: boolean;
  currentBalance: number;
  onClose: () => void;
  onSave: (newBalance: number) => Promise<void>;
}

/**
 * Modal para editar o saldo da conta
 * Permite ao usuário inserir um novo valor de saldo
 * com formatação automática em Real (R$)
 */
export const EditBalanceModal: React.FC<EditBalanceModalProps> = ({
  visible,
  currentBalance,
  onClose,
  onSave,
}) => {
  const [inputValue, setInputValue] = useState(currentBalance.toFixed(2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setInputValue(currentBalance.toFixed(2));
      setError(null);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim, currentBalance]);

  // Formata o valor para Real (BRL)
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Formata a entrada do usuário
  const handleInputChange = (text: string) => {
    // Remove caracteres não numéricos exceto ponto
    let cleanedText = text.replace(/[^\d.]/g, '');
    
    // Evita múltiplos pontos
    const parts = cleanedText.split('.');
    if (parts.length > 2) {
      cleanedText = parts[0] + '.' + parts.slice(1).join('');
    }

    setInputValue(cleanedText);
    setError(null);
  };

  // Manipula o evento de salvar
  const handleSave = async () => {
    const numValue = parseFloat(inputValue);

    // Validações
    if (!inputValue || isNaN(numValue)) {
      setError('Insira um valor válido');
      return;
    }

    if (numValue < 0) {
      setError('O saldo não pode ser negativo');
      return;
    }

    try {
      setLoading(true);
      await onSave(numValue);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar saldo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      {/* Overlay escuro */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Container do modal com animação */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                {
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Header do modal */}
          <View style={styles.header}>
            <Text style={styles.title}>Editar Saldo</Text>
            <TouchableOpacity
              onPress={onClose}
              disabled={loading}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Conteúdo */}
          <View style={styles.content}>
            {/* Saldo atual */}
            <View style={styles.currentBalanceSection}>
              <Text style={styles.currentBalanceLabel}>Saldo Atual</Text>
              <Text style={styles.currentBalanceValue}>
                {formatCurrency(currentBalance)}
              </Text>
            </View>

            {/* Divisor */}
            <View style={styles.divider} />

            {/* Campo de entrada */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Novo Saldo</Text>
              <View style={[styles.inputWrapper, error && styles.inputWrapperError]}>
                <Text style={styles.currencyPrefix}>R$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0,00"
                  placeholderTextColor="#d1d5db"
                  value={inputValue}
                  onChangeText={handleInputChange}
                  keyboardType="decimal-pad"
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
              </View>

              {/* Mensagem de preview */}
              {inputValue && !isNaN(parseFloat(inputValue)) && (
                <View style={styles.previewSection}>
                  <Text style={styles.previewLabel}>Novo Valor:</Text>
                  <Text style={styles.previewValue}>
                    {formatCurrency(parseFloat(inputValue))}
                  </Text>
                </View>
              )}

              {/* Mensagem de erro */}
              {error && (
                <View style={styles.errorSection}>
                  <Ionicons name="alert-circle" size={16} color="#ef4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Footer com botões */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
  },

  // Content
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  currentBalanceSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  currentBalanceLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 4,
  },
  currentBalanceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3b82f6',
  },

  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginBottom: 16,
  },

  inputSection: {
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
  },
  inputWrapperError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6b7280',
    marginRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },

  previewSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  previewLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  previewValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },

  errorSection: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#991b1b',
    fontWeight: '500',
    flex: 1,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  buttonIcon: {
    marginRight: 2,
  },
});
