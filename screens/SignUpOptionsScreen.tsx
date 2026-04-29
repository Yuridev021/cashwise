import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function SignUpOptionsScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      
      {/* BOTÃO VOLTAR */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      {/* TEXTO */}
      <Text style={styles.title}>
        É hora de iniciar sua jornada!
      </Text>

      <Text style={styles.subtitle}>
        Crie sua conta e comece a transformar suas finanças.
      </Text>

      {/* BOTÃO PRINCIPAL */}

      <TouchableOpacity style={styles.socialButton}>
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/2991/2991148.png" }}
          style={styles.googleIcon}
        />
        <Text style={styles.socialText}>Continuar com Google</Text>
      </TouchableOpacity>


      <TouchableOpacity onPress={() => navigation.navigate("SignUpForm")}>
        <LinearGradient
          colors={["#34d399", "#34d399"]}
          style={styles.mainButton}
        >
          <Ionicons name="mail-outline" size={20} color="#fff" />
          <Text style={styles.mainText}>Continuar com E-mail</Text>
        </LinearGradient>
      </TouchableOpacity>
      



      {/* LINK */}
      <TouchableOpacity onPress={() => navigation.navigate("SignInOptions")}>
        <Text style={styles.loginLink}>Entrar</Text>
      </TouchableOpacity>

      {/* TERMOS */}
      <Text style={styles.footer}>
        Ao continuar você estará concordando com os{" "}
        <Text style={styles.linkText}>Termos de Uso</Text> e{" "}
        <Text style={styles.linkText}>Privacidade</Text>.
      </Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    padding: 20,
    justifyContent: "center",
  },

  back: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "#34d399",
    padding: 10,
    borderRadius: 50,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    textAlign: "center",
    color: "#555",
    marginBottom: 30,
  },

  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 30,
    marginBottom: 15,
    justifyContent: "center",
    gap: 10,
  },

  socialText: {
    fontSize: 16,
  },

  googleIcon: {
    width: 20,
    height: 20,
  },

  mainButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 30,
    marginTop: 10,
    gap: 10,
  },

  mainText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  loginLink: {
    textAlign: "center",
    marginTop: 15,
    color: "#415292",
    fontWeight: "600",
  },

  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#666",
    marginTop: 20,
  },

  linkText: {
    color: "#6d28d9",
  },
});