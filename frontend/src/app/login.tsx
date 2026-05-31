import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { EyeOff } from "lucide-react-native";
import { API_URL } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      alert("Ingresá tu email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      alert("Ingresá un email válido.");
      return;
    }

    if (!contrasenia.trim()) {
      alert("Ingresá tu contraseña.");
      return;
    }

    const usuarioLogin = {
      email: email.trim().toLowerCase(),
      contrasenia,
    };

    console.log("Intentando login:", usuarioLogin);
    console.log("URL:", `${API_URL}/api/usuarios/login`);

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/usuarios/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(usuarioLogin),
      });

      const data = await response.json();

      console.log("Respuesta login:", data);

      if (!response.ok) {
        alert(data.message || data.error || "Email o contraseña incorrectos.");
        return;
      }

      alert("Inicio de sesión exitoso.");
      await AsyncStorage.setItem("usuario", JSON.stringify(data.usuario));

      if (data.token) {
        await AsyncStorage.setItem("token", data.token);
      }

      router.replace("/home" as any);
    } catch (error) {
      console.log("Error al conectar con backend:", error);
      alert(
        "No se pudo conectar con el servidor. Revisá que el backend esté prendido."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Image
          source={require("../../assets/images/logoeba.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>
          ¡Hola de <Text style={styles.highlight}>vuelta!</Text>
        </Text>

        <TextInput
          placeholder="Correo electrónico"
          placeholderTextColor="#A8A5B3"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.passwordBox}>
          <TextInput
            placeholder="Contraseña"
            placeholderTextColor="#A8A5B3"
            secureTextEntry
            style={styles.passwordInput}
            value={contrasenia}
            onChangeText={setContrasenia}
          />
          <EyeOff size={18} color="#A8A5B3" />
        </View>

        <TouchableOpacity>
          <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </Text>
        </TouchableOpacity>

        <View style={styles.registerRow}>
          <Text style={styles.smallText}>¿No tenés cuenta? </Text>
          <TouchableOpacity
            onPress={() => router.push("/register-interests" as any)}
          >
            <Text style={styles.registerLink}>Registrate</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <Text style={styles.continueText}>O continuá con...</Text>

        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialText}>Apple</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F5FF",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 34,
    alignItems: "center",
  },
  logo: {
    width: 130,
    height: 90,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#332047",
    marginBottom: 42,
  },
  highlight: {
    color: "#8B35E8",
  },
  input: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8D5E2",
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#332047",
    marginBottom: 14,
    backgroundColor: "#FAFAFF",
    outlineStyle: "none" as any,
  },
  passwordBox: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8D5E2",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFF",
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: "#332047",
    outlineStyle: "none" as any,
  },
  forgot: {
    alignSelf: "flex-start",
    color: "#3A2451",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 28,
  },
  primaryButton: {
    width: "100%",
    height: 54,
    borderRadius: 12,
    backgroundColor: "#7528F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  disabledButton: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  registerRow: {
    flexDirection: "row",
    marginBottom: 26,
  },
  smallText: {
    color: "#9A98A6",
    fontSize: 13,
  },
  registerLink: {
    color: "#7528F0",
    fontSize: 13,
    fontWeight: "800",
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#D8C8FF",
    marginBottom: 22,
  },
  continueText: {
    color: "#A8A5B3",
    fontSize: 13,
    marginBottom: 18,
  },
  socialRow: {
    flexDirection: "row",
  },
  socialButton: {
    width: 120,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D8D5E2",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
  socialText: {
    color: "#9A98A6",
    fontSize: 14,
  },
});