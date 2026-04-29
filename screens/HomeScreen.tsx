import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
  const [selectedMonth, setSelectedMonth] = useState("Fevereiro");
  const navigation = useNavigation<any>();

  const categories = [
    { name: "Moradia", value: 1200.0, color: "#a855f7" },
    { name: "Transporte", value: 350.0, color: "#06b6d4" },
    { name: "Alimentação", value: 520.0, color: "#ec4899" },
    { name: "Outros", value: 400.0, color: "#f59e0b" },
  ];

  const totalExpenses = categories.reduce((sum, cat) => sum + cat.value, 0);
  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER COM SALDO */}
        <LinearGradient colors={["#3b82f6", "#1e40af"]} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.monthSelector}>
            <TouchableOpacity style={styles.monthButton}>
              <Text style={styles.monthText}>{selectedMonth}</Text>
              <Ionicons name="chevron-down" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate("UserSettings")}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* SALDO */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Saldo atual em contas</Text>
          <Text style={styles.balance}>R$ 7.091,60</Text>
        </View>

        {/* CARDS DE RESUMO */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons name="arrow-down-outline" size={20} color="#10b981" />
            </View>
            <Text style={styles.summaryLabel}>Receitas</Text>
            <Text style={styles.summaryValue}>R$ 5.505,50</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons name="arrow-up-outline" size={20} color="#ef4444" />
            </View>
            <Text style={styles.summaryLabel}>Despesas</Text>
            <Text style={styles.summaryValue}>R$ 4.024,00</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons name="card-outline" size={20} color="#f59e0b" />
            </View>
            <Text style={styles.summaryLabel}>Cartões</Text>
            <Text style={styles.summaryValue}>R$ 480,00</Text>
          </View>
        </View>
      </LinearGradient>

      {/* CONTEÚDO */}
      <View style={styles.content}>
        {/* DESPESAS POR CATEGORIA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DESPESAS POR CATEGORIA</Text>

          <View style={styles.chartContainer}>
            <View style={styles.pieChartWrapper}>
              <View style={styles.chartPlaceholder}>
                <Text style={styles.chartPlaceholderLabel}>Total</Text>
                <Text style={styles.chartPlaceholderValue}>
                  R$ {totalExpenses.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.categoryList}>
              {categories.map((category, index) => (
                <View key={index} style={styles.categoryItem}>
                  <View
                    style={[
                      styles.categoryDot,
                      { backgroundColor: category.color },
                    ]}
                  />
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryValue}>
                    R$ {category.value.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ORÇAMENTO */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ORÇAMENTO</Text>
            <TouchableOpacity>
              <Ionicons name="add-circle-outline" size={24} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          <View style={styles.budgetItem}>
            <View>
              <Text style={styles.budgetLabel}>Meta</Text>
              <Text style={styles.budgetValue}>R$ 1.100,00</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progress, { width: "65%" }]} />
            </View>
          </View>

          <View style={styles.budgetItem}>
            <View>
              <Text style={styles.budgetLabel}>Valor gasto</Text>
              <Text style={styles.budgetValue}>R$ 300,00</Text>
            </View>
            <Text style={styles.budgetPercentage}>27%</Text>
          </View>

          <View style={styles.budgetItem}>
            <View>
              <Text style={styles.budgetLabel}>Previsto</Text>
              <Text style={styles.budgetValue}>R$ 4.024,00</Text>
            </View>
            <Text style={styles.budgetPercentage}>R$0</Text>
          </View>
        </View>

        {/* BALANÇO MENSAL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BALANÇO MENSAL</Text>

          <View style={styles.monthlyBalance}>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceMonth}>Meta</Text>
              <Text style={styles.balanceAmount}>R$ 1.100,00</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceRow}>
              <Text style={styles.balanceMonth}>Valor gasto</Text>
              <Text style={styles.balanceAmount}>R$ 300,00</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceRow}>
              <Text style={styles.balanceMonth}>Previsão</Text>
              <Text style={styles.balanceAmount}>R$ 4.024,00</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceRow}>
              <Text style={styles.balanceMonth}>Resultado de mês</Text>
              <Text style={styles.balanceAmount}>R$0</Text>
            </View>
          </View>
        </View>

      </View>

      </ScrollView>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#3b82f6" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="list" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItemCenter}>
          <LinearGradient colors={["#34d399", "#10b981"]} style={styles.fab}>
            <Ionicons name="add" size={32} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="pie-chart" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("UserSettings")}
        >
          <Ionicons name="menu" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  scrollContent: {
    paddingBottom: 100,
  },

  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  monthSelector: {
    flex: 1,
  },

  monthButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    width: 120,
  },

  monthText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },

  menuButton: {
    padding: 8,
  },

  balanceContainer: {
    marginBottom: 20,
  },

  balanceLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    marginBottom: 4,
  },

  balance: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
  },

  summaryCards: {
    flexDirection: "row",
    gap: 12,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },

  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  summaryLabel: {
    fontSize: 11,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },

  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  content: {
    padding: 20,
  },

  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    letterSpacing: 0.5,
  },

  chartContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  pieChartWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },

  chartPlaceholder: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 12,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  chartPlaceholderLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },

  chartPlaceholderValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  categoryList: {
    flex: 1,
    marginLeft: 20,
  },

  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },

  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  categoryName: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },

  categoryValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1a1a1a",
  },

  budgetItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  budgetLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },

  budgetValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },

  progressBar: {
    width: 100,
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    overflow: "hidden",
  },

  progress: {
    height: 6,
    backgroundColor: "#34d399",
    borderRadius: 3,
  },

  budgetPercentage: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3b82f6",
  },

  monthlyBalance: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
  },

  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },

  balanceMonth: {
    fontSize: 13,
    color: "#666",
  },

  balanceAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
  },

  balanceDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },

  navItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  navItemCenter: {
    marginTop: -30,
  },

  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});
