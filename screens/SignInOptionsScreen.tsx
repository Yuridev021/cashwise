import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

export default function SignInOptionsScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Bem-vindo de volta!</Text>
        <Text style={styles.subtitle}>Entre e continue sua jornada financeira.</Text>

        <TouchableOpacity style={styles.socialButtonGoogle}>
          <Ionicons name="logo-google" size={20} color="#111827" />
          <Text style={styles.socialText}>Continuar com Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.emailButtonWrapper}>
          <LinearGradient
            colors={["#34d399", "#34d399"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.emailButton}
          >
            <Ionicons name="mail-outline" size={20} color="#fff" />
            <Text style={styles.emailText}>Continuar com E-mail</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("SignUpOptions")}>
          <Text style={styles.signUpLink}>Cadastrar</Text>
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
  socialButtonGoogle: {
    height: 56,
    borderRadius: 30,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 15,
    gap: 10,
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
