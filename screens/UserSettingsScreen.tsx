import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";

export default function UserSettingsScreen() {
  const navigation = useNavigation<any>();
  const { user, logout, setProfilePhoto } = useAuth();
  const [photoURI, setPhotoURI] = useState<string | null>(null);

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
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar a foto de perfil.");
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
        <Text style={styles.cardTitle}>Conta</Text>
        <Text style={styles.cardText}>
          Gerencie seu perfil e finalize sua sessão quando desejar.
        </Text>

        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handlePickImage}
        >
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
