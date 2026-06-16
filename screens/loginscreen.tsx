import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function LoginScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>

      <Image
        source={require("../assets/backgroundcadastro.gif")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      <View style={styles.card}>
        <Text style={styles.title}>
          Cuidar do dinheiro pode{"\n"}ser fácil!
        </Text>
        <Text style={styles.subtitle}>
          Cadastre-se, planeje o que você quer comprar e controle seus gastos como
          um expert!
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("SignUpOptions")}
        >
          <Text style={styles.buttonText}>Cadastrar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("SignInOptions")}
        >
          <Text style={styles.link}>Já sou cadastrado</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Home")}
          style={styles.skipContainer}
        >
          
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2c3e50",
  },

  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: -200,
    left: 0,
  },

  card: {
    backgroundColor: "#01033e",
    padding: 24,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    alignItems: "center",
    zIndex: 10,
    marginTop: "auto",
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
    backgroundColor: "#1CA149",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    marginBottom: 8,
    width: "100%",
    maxWidth: 300,
  },

  buttonText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },

  link: {
    color: "#fff",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 2,
  },

  skipContainer: {
    marginTop: 20,
    paddingVertical: 8,
  },

  skipText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
});