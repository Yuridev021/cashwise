import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MONTHS_PT } from '../types';

interface MonthPickerProps {
  currentMonth: number; // 0-11
  currentYear: number;
  onMonthChange: (month: number, year: number) => void;
  disabled?: boolean;
}

/**
 * Componente de seletor de mês com dropdown animado
 * Permite ao usuário selecionar um mês do ano
 * com indicador visual do mês selecionado
 */
export const MonthPicker: React.FC<MonthPickerProps> = ({
  currentMonth,
  currentYear,
  onMonthChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  // Anima a abertura do dropdown
  const openDropdown = () => {
    setIsOpen(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Anima o fechamento do dropdown
  const closeDropdown = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsOpen(false);
    });
  };

  // Manipula a seleção de um mês
  const handleSelectMonth = (monthIndex: number) => {
    onMonthChange(monthIndex, currentYear);
    closeDropdown();
  };

  // Obtém o nome do mês atual
  const currentMonthName = MONTHS_PT[currentMonth];

  const { width } = Dimensions.get('window');

  return (
    <View style={styles.container}>
      {/* Botão do mês */}
      <TouchableOpacity
        style={[styles.monthButton, disabled && styles.monthButtonDisabled]}
        onPress={openDropdown}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={styles.monthButtonContent}>
          <Ionicons name="calendar" size={16} color="#fff" style={styles.monthButtonIcon} />
          <Text style={styles.monthButtonText}>{currentMonthName}</Text>
        </View>
        <Animated.View
          style={[
            styles.chevronIcon,
            {
              transform: [
                {
                  rotate: isOpen ? '180deg' : '0deg',
                },
              ],
            },
          ]}
        >
          <Ionicons name="chevron-down" size={16} color="#fff" />
        </Animated.View>
      </TouchableOpacity>

      {/* Modal do dropdown */}
      <Modal visible={isOpen} transparent animationType="none">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeDropdown}
        >
          {/* Dropdown container com animação */}
          <Animated.View
            style={[
              styles.dropdownContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateY: 0 },
                ],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header do dropdown */}
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownHeaderText}>Selecione um mês</Text>
              <TouchableOpacity
                onPress={closeDropdown}
                style={styles.dropdownCloseButton}
              >
                <Ionicons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Lista de meses */}
            <ScrollView
              style={styles.monthsList}
              scrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {MONTHS_PT.map((monthName, index) => {
                const isSelected = index === currentMonth;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.monthItem,
                      isSelected && styles.monthItemSelected,
                    ]}
                    onPress={() => handleSelectMonth(index)}
                    activeOpacity={0.6}
                  >
                    {/* Número do mês */}
                    <View
                      style={[
                        styles.monthNumber,
                        isSelected && styles.monthNumberSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.monthNumberText,
                          isSelected && styles.monthNumberTextSelected,
                        ]}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </Text>
                    </View>

                    {/* Nome do mês */}
                    <Text
                      style={[
                        styles.monthItemText,
                        isSelected && styles.monthItemTextSelected,
                      ]}
                    >
                      {monthName}
                    </Text>

                    {/* Indicador de seleção */}
                    {isSelected && (
                      <View style={styles.checkIcon}>
                        <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Footer com ano */}
            <View style={styles.dropdownFooter}>
              <Text style={styles.yearText}>Ano: {currentYear}</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
  },

  // Botão do mês
  monthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  monthButtonDisabled: {
    opacity: 0.5,
  },
  monthButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthButtonIcon: {
    marginRight: 2,
  },
  monthButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  chevronIcon: {
    marginLeft: 4,
  },

  // Overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Dropdown container
  dropdownContainer: {
    width: '80%',
    maxWidth: 350,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  // Header
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  dropdownCloseButton: {
    padding: 6,
  },

  // Lista de meses
  monthsList: {
    maxHeight: 380,
  },

  // Item de mês
  monthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
    gap: 12,
  },
  monthItemSelected: {
    backgroundColor: '#f0f9ff',
  },
  monthNumber: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  monthNumberSelected: {
    backgroundColor: '#3b82f6',
  },
  monthNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  monthNumberTextSelected: {
    color: '#fff',
  },
  monthItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  monthItemTextSelected: {
    fontWeight: '700',
    color: '#3b82f6',
  },
  checkIcon: {
    marginLeft: 'auto',
  },

  // Footer
  dropdownFooter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#fafafa',
  },
  yearText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
});
