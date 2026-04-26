import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { height } = Dimensions.get("window");

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      
      {/* FUNDO COM GRADIENTE */}
      <LinearGradient
        colors={["#02132b", "#000"]}
        style={styles.background}
      />

      {/* IMAGEM DO CELULAR */}
      <View style={styles.imageContainer}>
        <Image
          source={require("../assets/backgroundfinance.jpg")}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* CARD INFERIOR */}
      <View style={styles.card}>
        <Text style={styles.title}>
          Cuidar do dinheiro pode{"\n"}ser fácil!
        </Text>

        <Text style={styles.subtitle}>
          Cadastre-se, planeje o que você quer comprar e controle seus gastos como um expert!
        </Text>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Cadastrar</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.link}>Já sou cadastrado</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  background: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },

  image: {
    width: "75%",
    height: height * 0.45,
  },

  card: {
    backgroundColor: "#020617",
    padding: 24,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },

  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 34,
  },

  subtitle: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 25,
    paddingHorizontal: 10,
    lineHeight: 20,
  },

  button: {
    backgroundColor: "#34d399",
    paddingVertical: 16,
    borderRadius: 999, // deixa pill perfeita
    alignItems: "center",
    marginBottom: 12,
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  link: {
    color: "#34d399",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
  },
});