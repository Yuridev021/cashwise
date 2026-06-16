import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { MonthPicker } from "../components/MonthPicker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useAuth } from "../context/AuthContext";
import { useFinance } from "../context/FinanceContext";
import { MONTHS_PT } from "../types";
import { transactionsToMonthlyCsv } from "../utils/exportMonthlyTransactionsCsv";
import { transactionsToMonthlyPdf } from "../utils/exportMonthlyTransactionsPdf";

import * as Print from "expo-print";



export default function UserSettingsScreen() {
  const navigation = useNavigation<any>();
  const { user, logout, setProfilePhoto } = useAuth();
  const {
    data,
    currentMonth,
    currentYear,
    setCurrentMonth,
    loading: financeLoading,
  } = useFinance();
  const [photoURI, setPhotoURI] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);


  useEffect(() => {
    if (user?.photoURL) {
      setPhotoURI(user.photoURL);
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permissão necessária",
        "É preciso permitir acesso à galeria para escolher uma foto de perfil."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) {
      return;
    }

    const selectedUri = result.assets[0].uri;
    setPhotoURI(selectedUri);

    try {
      await setProfilePhoto(selectedUri);
      Alert.alert("Perfil atualizado", "Sua foto de perfil foi salva com sucesso.");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar a foto de perfil.");
    }
  };

  const monthLabel = useMemo(() => {
    const name = MONTHS_PT[currentMonth] ?? String(currentMonth + 1);
    return `${name} de ${currentYear}`;
  }, [currentMonth, currentYear]);

  const handleExportPdf = async () => {
    try {
      if (exporting) return;
      if (!data?.transactions) {
        Alert.alert('Sem dados', 'Carregue suas transações do mês antes de exportar.');
        return;
      }

      if (data.transactions.length === 0) {
        Alert.alert('Nada para exportar', `Não há transações em ${monthLabel}.`);
        return;
      }

      setExporting(true);

      const { html, filename } = transactionsToMonthlyPdf({
        transactions: data.transactions,
        month: currentMonth,
        year: currentYear,
      });

      const pdf = await Print.printToFileAsync({
        html,
      });

      if (!pdf?.uri) {
        throw new Error('Falha ao gerar PDF');
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdf.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartilhar relatório PDF',
        });
      } else {
        Alert.alert(
          'Exportação indisponível',
          'Seu dispositivo não suporta compartilhamento de arquivos.'
        );
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível exportar o relatório PDF.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      if (exporting) return;
      if (!data?.transactions) {
        Alert.alert("Sem dados", "Carregue suas transações do mês antes de exportar.");
        return;
      }

      if (data.transactions.length === 0) {
        Alert.alert("Nada para exportar", `Não há transações em ${monthLabel}.`);
        return;
      }

      setExporting(true);

      const { csv, filename } = transactionsToMonthlyCsv({
        transactions: data.transactions,
        month: currentMonth,
        year: currentYear,
      });

      const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileUri = `${FileSystem.cacheDirectory}${safeFilename}`;

      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Compartilhar relatório CSV',
        });
      } else {
        Alert.alert(
          "Exportação indisponível",
          "Seu dispositivo não suporta compartilhamento de arquivos."
        );
      }
    } catch {
      Alert.alert("Erro", "Não foi possível exportar o relatório CSV.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Configurações do usuário</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Exportar relatório do mês</Text>
        <Text style={styles.cardText}>
          Selecione o mês e exporte um CSV com todas as transações.
        </Text>

        <View style={styles.exportMonthWrapper}>
          <MonthPicker
            currentMonth={currentMonth}
            currentYear={currentYear}
            onMonthChange={setCurrentMonth}
            disabled={exporting || financeLoading}
          />
        </View>

        <Text style={styles.exportMonthLabel}>{monthLabel}</Text>

        <TouchableOpacity
          style={[styles.exportButton, exporting && { opacity: 0.7 }]}
          onPress={handleExportCsv}
          disabled={exporting || financeLoading}
        >
          {exporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={18} color="#fff" />
              <Text style={styles.exportButtonText}>Exportar CSV</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.exportSecondaryButton, exporting && { opacity: 0.7 }]}
          onPress={handleExportPdf}
          disabled={exporting || financeLoading}
        >
          <Ionicons name="download-outline" size={18} color="#111827" />
          <Text style={styles.exportSecondaryButtonText}>Exportar PDF</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Conta</Text>
        <Text style={styles.cardText}>
          Gerencie seu perfil e finalize sua sessão quando desejar.
        </Text>

        <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage}>
          {photoURI ? (
            <Image source={{ uri: photoURI }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={36} color="#6b7280" />
            </View>
          )}
          <Text style={styles.avatarText}>
            {photoURI ? "Alterar foto de perfil" : "Adicionar foto de perfil"}
          </Text>
        </TouchableOpacity>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email cadastrado</Text>
          <Text style={styles.infoValue}>{user?.email ?? "Sem email"}</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 18,
  },
  exportMonthWrapper: {
    marginBottom: 10,
  },
  exportMonthLabel: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "700",
    marginBottom: 14,
  },
  exportButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 10,
  },
  exportButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  exportSecondaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  exportSecondaryButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 18,
  },

  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  infoRow: {
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
  },
  logoutButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
