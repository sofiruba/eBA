import { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { API_URL } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Logo from "@/components/Logo";

export default function CompleteProfileGoogleScreen() {
  const { usuarioId, intereses } = useLocalSearchParams();
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [edad, setEdad] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCompletar = async () => {
    if (!nombreUsuario.trim()) {
      alert("Ingresá un nombre de usuario.");
      return;
    }
    if (!edad.trim() || isNaN(Number(edad)) || Number(edad) < 13) {
      alert("Ingresá una edad válida.");
      return;
    }

    try {
      setLoading(true);
      const interesesParsed = JSON.parse(intereses as string);

      const res = await fetch(`${API_URL}/api/usuarios/${usuarioId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreUsuario: nombreUsuario.trim(),
          edad: Number(edad),
          intereses: interesesParsed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al completar el perfil.");
        return;
      }

      await AsyncStorage.setItem("usuario", JSON.stringify(data.usuario));
      router.replace("/home" as any);
    } catch (error) {
      alert("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Logo size="large" centered={true} showText={true} />
        <Text style={styles.title}>Completá tu <Text style={styles.highlight}>perfil</Text></Text>

        <TextInput
          placeholder="Nombre de usuario"
          placeholderTextColor="#A8A5B3"
          style={styles.input}
          value={nombreUsuario}
          onChangeText={setNombreUsuario}
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Edad"
          placeholderTextColor="#A8A5B3"
          style={styles.input}
          value={edad}
          onChangeText={setEdad}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleCompletar}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? "Guardando..." : "Continuar"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F5FF", justifyContent: "center" },
  content: { paddingHorizontal: 34, alignItems: "center" },
  title: { fontSize: 28, fontWeight: "800", color: "#332047", marginBottom: 42 },
  highlight: { color: "#8B35E8" },
  input: {
    width: "100%", height: 52, borderRadius: 12, borderWidth: 1,
    borderColor: "#D8D5E2", paddingHorizontal: 16, fontSize: 15,
    color: "#332047", marginBottom: 14, backgroundColor: "#FAFAFF",
  },
  primaryButton: {
    width: "100%", height: 54, borderRadius: 12,
    backgroundColor: "#7528F0", alignItems: "center", justifyContent: "center",
  },
  disabledButton: { opacity: 0.65 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});