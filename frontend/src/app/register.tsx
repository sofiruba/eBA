import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { EyeOff, Eye } from "lucide-react-native";
import { API_URL } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Logo from "@/components/Logo";
export default function RegisterScreen() {
  const params = useLocalSearchParams();

  let intereses: string[] = [];

  try {
    intereses = params.intereses
      ? JSON.parse(params.intereses as string)
      : [];
  } catch (error) {
    intereses = [];
  }

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [edad, setEdad] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarContrasenia, setMostrarContrasenia] = useState(false);

  const handleRegister = async () => {
    if (intereses.length === 0) {
      alert("Tenés que seleccionar al menos un interés.");
      return;
    }

    if (!nombre.trim()) {
      alert("Ingresá tu nombre.");
      return;
    }

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
      alert("Ingresá una contraseña.");
      return;
    }

    if (contrasenia.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (!edad.trim()) {
      alert("Ingresá tu edad.");
      return;
    }

    const edadNumerica = Number(edad);

    if (isNaN(edadNumerica) || edadNumerica < 13 || edadNumerica > 100) {
      alert("Ingresá una edad válida.");
      return;
    }

    const nuevoUsuario = {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      contrasenia,
      edad: edadNumerica,
      intereses,
    };

    console.log("Enviando usuario:", nuevoUsuario);
    console.log("URL:", `${API_URL}/api/usuarios/registro`);

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/usuarios/registro`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nuevoUsuario),
      });

      const data = await response.json();

      console.log("Respuesta del backend:", data);

      if (!response.ok) {
        alert(data.message || data.error || "Error al registrar usuario.");
        return;
      }
      alert(
        data.message ||
        "Usuario creado correctamente. Revisá tu email para verificar la cuenta."
      );

      router.replace({
        pathname: "/verify-email",
        params: { email: email.trim().toLowerCase() },
      } as any);
    } catch (error) {
      console.log("Error al conectar con backend:", error);
      alert(
        "No se pudo conectar con el servidor. Revisá que el backend esté prendido y que la URL sea correcta."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <Logo size="large" centered={true} showText={true} />



        <Text style={styles.title}>
          Registrate <Text style={styles.dark}>a eBA</Text>
        </Text>

        <Text style={styles.subtitle}>Último paso para empezar a conectar.</Text>

        <View style={styles.selectedBox}>
          <Text style={styles.selectedTitle}>Intereses elegidos</Text>

          <Text style={styles.selectedText}>
            {intereses.length > 0
              ? intereses.join(", ")
              : "No seleccionaste intereses"}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/register-interests" as any)}
          >
            <Text style={styles.editInterests}>Editar intereses</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            placeholder="Sofi"
            placeholderTextColor="#A8A5B3"
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="sofi2@test.com"
            placeholderTextColor="#A8A5B3"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Contraseña</Text>

          <View style={styles.passwordBox}>
            <TextInput
              placeholder="123456"
              placeholderTextColor="#A8A5B3"
              secureTextEntry={!mostrarContrasenia}
              style={styles.passwordInput}
              value={contrasenia}
              onChangeText={setContrasenia}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMostrarContrasenia(!mostrarContrasenia)}
            >
              {mostrarContrasenia ? (
                <Eye size={18} color="#A8A5B3" />
              ) : (
                <EyeOff size={18} color="#A8A5B3" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Edad</Text>
          <TextInput
            placeholder="21"
            placeholderTextColor="#A8A5B3"
            style={styles.input}
            value={edad}
            onChangeText={setEdad}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          activeOpacity={0.85}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </Text>
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.smallText}>¿Ya tenés cuenta? </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/login" as any)}
          >
            <Text style={styles.loginLink}>Iniciá sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F5FF",
  },
  container: {
    paddingHorizontal: 34,
    paddingTop: 52,
    paddingBottom: 70,
  },
  logo: {
    width: 120,
    height: 80,
    alignSelf: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 27,
    fontWeight: "800",
    color: "#4DA7FF",
    textAlign: "center",
    marginBottom: 8,
  },
  dark: {
    color: "#332047",
  },
  subtitle: {
    fontSize: 13,
    color: "#8D8A99",
    textAlign: "center",
    marginBottom: 22,
  },
  selectedBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#E2DDF0",
  },
  selectedTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#332047",
    marginBottom: 5,
  },
  selectedText: {
    fontSize: 13,
    color: "#8D8A99",
    lineHeight: 19,
    marginBottom: 8,
  },
  editInterests: {
    color: "#7528F0",
    fontSize: 13,
    fontWeight: "800",
  },
  field: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2D2934",
    marginBottom: 8,
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
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: "#332047",
    outlineStyle: "none" as any,
  },
  primaryButton: {
    width: "100%",
    height: 54,
    borderRadius: 12,
    backgroundColor: "#7528F0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
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
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  smallText: {
    color: "#9A98A6",
    fontSize: 13,
  },
  loginLink: {
    color: "#7528F0",
    fontSize: 13,
    fontWeight: "800",
  },
});