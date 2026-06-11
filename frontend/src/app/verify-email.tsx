import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { MailCheck } from "lucide-react-native";

import { API_URL } from "../config/api";
import Logo from "@/components/Logo";

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams();

  const emailParam = typeof params.email === "string" ? params.email : "";

  const [email, setEmail] = useState(emailParam);
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyEmail = async () => {
    if (!email.trim()) {
      alert("Ingresá tu email.");
      return;
    }

    if (!codigo.trim()) {
      alert("Ingresá el código que recibiste por mail.");
      return;
    }

    if (codigo.trim().length !== 6) {
      alert("El código debe tener 6 dígitos.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/usuarios/verificar-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          codigo: codigo.trim(),
        }),
      });

      const data = await response.json();

      console.log("Respuesta verificar email:", data);

      if (!response.ok) {
        alert(data.message || data.error || "No se pudo verificar el email.");
        return;
      }

      alert(data.message || "Email verificado correctamente.");

      router.replace("/login" as any);
    } catch (error) {
      console.log("Error al verificar email:", error);
      alert(
        "No se pudo conectar con el servidor. Revisá que el backend esté prendido."
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

        <View style={styles.iconCircle}>
          <MailCheck size={44} color="#7528F0" />
        </View>

        <Text style={styles.title}>
          Verificá <Text style={styles.dark}>tu email</Text>
        </Text>

        <Text style={styles.subtitle}>
          Te mandamos un código de 6 dígitos. Ingresalo para activar tu cuenta.
        </Text>

        <View style={styles.selectedBox}>
          <Text style={styles.selectedTitle}>Email a verificar</Text>

          <Text style={styles.selectedText}>
            {email || "Ingresá el email con el que te registraste"}
          </Text>
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
          <Text style={styles.label}>Código de verificación</Text>
          <TextInput
            placeholder="123456"
            placeholderTextColor="#A8A5B3"
            style={styles.codeInput}
            value={codigo}
            onChangeText={setCodigo}
            keyboardType="numeric"
            maxLength={6}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          activeOpacity={0.85}
          onPress={handleVerifyEmail}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? "Verificando..." : "Verificar email"}
          </Text>
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.smallText}>¿Ya verificaste? </Text>

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
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#FFFFFF",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2DDF0",
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
    lineHeight: 19,
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
  codeInput: {
    width: "100%",
    height: 58,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8D5E2",
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 8,
    color: "#332047",
    backgroundColor: "#FAFAFF",
    textAlign: "center",
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