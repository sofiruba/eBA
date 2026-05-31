import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
export default function WelcomeScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Image
          source={require("../../assets/images/logoeba.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Image
          source={require("../../assets/images/mascotaseba.png")}
          style={styles.characters}
          resizeMode="contain"
        />

        <Text style={styles.title}>
          Conectá con personas{"\n"}y viví experiencias
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/login" as any)}
        >
          <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/register-interests" as any)}>
          <Text style={styles.link}>Crear cuenta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    width: "100%",
    paddingHorizontal: 32,
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 80,
    marginBottom: 34,
  },
  characters: {
    width: 260,
    height: 180,
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#332047",
    textAlign: "center",
    lineHeight: 31,
    marginBottom: 30,
  },
  primaryButton: {
    width: "100%",
    height: 54,
    borderRadius: 12,
    backgroundColor: "#7528F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  link: {
    fontSize: 15,
    color: "#3A2451",
    textDecorationLine: "underline",
  },
});