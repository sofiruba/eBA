import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { EyeOff, MailCheck, ArrowLeft } from "lucide-react-native";

import { API_URL } from "../config/api";
import Logo from "@/components/Logo";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nuevaContrasenia, setNuevaContrasenia] = useState("");
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const pedirCodigo = async () => {
    if (!email.trim()) {
      alert("Ingresá tu email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      alert("Ingresá un email válido.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/usuarios/recuperar-contrasenia`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        }
      );

      const data = await response.json();

      console.log("Respuesta recuperar contraseña:", data);

      if (!response.ok) {
        alert(data.message || data.error || "No se pudo enviar el código.");
        return;
      }

      alert(data.message || "Te enviamos un código a tu email.");
      setCodigoEnviado(true);
    } catch (error) {
      console.log("Error al pedir código:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const cambiarContrasenia = async () => {
    if (!codigo.trim()) {
      alert("Ingresá el código recibido por email.");
      return;
    }

    if (codigo.trim().length !== 6) {
      alert("El código debe tener 6 dígitos.");
      return;
    }

    if (!nuevaContrasenia.trim()) {
      alert("Ingresá tu nueva contraseña.");
      return;
    }

    if (nuevaContrasenia.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/usuarios/cambiar-contrasenia`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            codigo: codigo.trim(),
            nuevaContrasenia,
          }),
        }
      );

      const data = await response.json();

      console.log("Respuesta restablecer contraseña:", data);

      if (!response.ok) {
        alert(data.message || data.error || "No se pudo cambiar la contraseña.");
        return;
      }

      alert(data.message || "Contraseña actualizada correctamente.");
      router.replace("/login" as any);
    } catch (error) {
      console.log("Error al cambiar contraseña:", error);
      alert("No se pudo conectar con el servidor.");
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#332047" />
        </TouchableOpacity>

        <Logo size="large" centered={true} showText={true} />

        <View style={styles.iconCircle}>
          <MailCheck size={42} color="#7528F0" />
        </View>

        <Text style={styles.title}>
          Recuperar <Text style={styles.dark}>contraseña</Text>
        </Text>

        <Text style={styles.subtitle}>
          Te vamos a mandar un código por email para que puedas crear una nueva contraseña.
        </Text>

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
            editable={!codigoEnviado}
          />
        </View>

        {!codigoEnviado ? (
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabledButton]}
            activeOpacity={0.85}
            onPress={pedirCodigo}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? "Enviando código..." : "Enviar código"}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Código enviado</Text>
              <Text style={styles.infoText}>
                Revisá tu email e ingresá el código de 6 dígitos.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Código</Text>

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

            <View style={styles.field}>
              <Text style={styles.label}>Nueva contraseña</Text>

              <View style={styles.passwordBox}>
                <TextInput
                  placeholder="Nueva contraseña"
                  placeholderTextColor="#A8A5B3"
                  secureTextEntry
                  style={styles.passwordInput}
                  value={nuevaContrasenia}
                  onChangeText={setNuevaContrasenia}
                />

                <EyeOff size={18} color="#A8A5B3" />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              activeOpacity={0.85}
              onPress={cambiarContrasenia}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? "Cambiando contraseña..." : "Cambiar contraseña"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setCodigoEnviado(false);
                setCodigo("");
                setNuevaContrasenia("");
              }}
            >
              <Text style={styles.resendText}>Usar otro email</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.loginRow}>
          <Text style={styles.smallText}>¿Te acordaste? </Text>

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
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
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
  infoBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#E2DDF0",
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#332047",
    marginBottom: 5,
  },
  infoText: {
    fontSize: 13,
    color: "#8D8A99",
    lineHeight: 19,
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
  resendText: {
    color: "#7528F0",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 18,
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