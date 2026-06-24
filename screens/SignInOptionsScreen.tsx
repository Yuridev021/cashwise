import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

export default function SignInOptionsScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (value: string) => {
    return /\S+@\S+\.\S+/.test(value);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha o email e a senha para continuar.");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Erro", "Digite um email válido.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (error: any) {
      let message = "Não foi possível fazer login. Verifique seu email e senha.";
      if (error.code === "auth/user-not-found") {
        message = "Usuário não encontrado. Verifique o email cadastrado.";
      } else if (error.code === "auth/wrong-password") {
        message = "Senha incorreta. Tente novamente.";
      } else if (error.code === "auth/invalid-email") {
        message = "Email inválido. Verifique o formato do email.";
      }
      Alert.alert("Erro", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Bem-vindo de volta!</Text>
        <Text style={styles.subtitle}>Entre e continue sua jornada financeira.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="seu@email.com"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Senha</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Digite sua senha"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity style={styles.emailButtonWrapper} onPress={handleLogin} disabled={loading}>
          <LinearGradient
            colors={["#34d399", "#10b981"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.emailButton, loading && styles.buttonDisabled]}
          >
            <Ionicons name="mail-outline" size={20} color="#fff" />
            <Text style={styles.emailText}>{loading ? "Entrando..." : "Entrar"}</Text>
          </LinearGradient>
        </TouchableOpacity>



        <Text style={styles.footer}>
          Ao continuar você estará concordando com os{" "}
          <Text style={styles.linkText}>Termos de Uso</Text> e{" "}
          <Text style={styles.linkText}>Privacidade</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e5e7eb",
  },
  backButton: {
    marginTop: 50,
    marginLeft: 20,
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: "#34d399",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    color: "#555",
    marginBottom: 30,
  },
  socialText: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "400",
  },
  emailButtonWrapper: {
    borderRadius: 30,
    overflow: "hidden",
    marginBottom: 20,
  },
  emailButton: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  emailText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: "#475569",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    color: "#111827",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signUpLink: {
    textAlign: "center",
    color: "#6d28d9",
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 18,
  },
  footer: {
    textAlign: "center",
    color: "#666",
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  linkText: {
    color: "#6d28d9",
  },
});
