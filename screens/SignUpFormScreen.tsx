
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { firestore } from "../config/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

export default function SignUpFormScreen() {
  const navigation = useNavigation();
  const { signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não correspondem");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      setLoading(true);

      // Criar usuário no Firebase Auth
      const userCredential = await signup(email, password);
      const userId = userCredential.user.uid;

      // Salvar dados do usuário no Firestore
      await setDoc(doc(firestore, "users", userId), {
        email: email,
        createdAt: new Date().toISOString(),
        displayName: email.split("@")[0],
      });

      setLoading(false);

      Alert.alert("Sucesso", "Cadastro realizado com sucesso!", [
        {
          text: "OK",
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: "Home" as never }],
            });
          },
        },
      ]);
    } catch (error: any) {
      setLoading(false);
      let errorMessage = "Erro ao criar conta";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este email já está cadastrado";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email inválido";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Senha muito fraca";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Erro", errorMessage);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* BOTÃO VOLTAR */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.back}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      {/* TEXTO */}
      <View style={styles.header}>
        <Text style={styles.title}>Crie sua conta</Text>
        <Text style={styles.subtitle}>
          Digite seu email e crie uma senha segura
        </Text>
      </View>

      {/* FORMULÁRIO */}
      <View style={styles.form}>
        {/* CAMPO EMAIL */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#34d399"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* CAMPO SENHA */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Senha</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#34d399"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Digite uma senha"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#34d399"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* CAMPO CONFIRMAR SENHA */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirmar Senha</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#34d399"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirme a senha"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#34d399"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* BOTÃO CADASTRAR */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Cadastrar</Text>
          )}
        </TouchableOpacity>

        {/* LINK PARA LOGIN */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Já tem conta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLink}>Entrar aqui</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TERMOS */}
      <Text style={styles.footer}>
        Ao continuar você estará concordando com os{" "}
        <Text style={styles.linkText}>Termos de Uso</Text> e{" "}
        <Text style={styles.linkText}>Privacidade</Text>.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 20,
  },

  back: {
    marginTop: 50,
    marginBottom: 10,
    width: 50,
    height: 50,
    backgroundColor: "#34d399",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    marginBottom: 30,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },

  form: {
    marginBottom: 30,
  },

  inputContainer: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  icon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    height: 50,
    color: "#1a1a1a",
    fontSize: 16,
  },

  button: {
    backgroundColor: "#34d399",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  loginText: {
    color: "#666",
    fontSize: 14,
  },

  loginLink: {
    color: "#34d399",
    fontWeight: "700",
    fontSize: 14,
  },

  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#666",
    marginBottom: 30,
  },

  linkText: {
    color: "#6d28d9",
    fontWeight: "600",
  },
});
