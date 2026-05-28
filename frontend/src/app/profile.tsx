import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import BottomNav from "../components/BottomNav";

type Usuario = {
  id?: string;
  nombre?: string;
  email?: string;
  edad?: number;
  intereses?: string[];
};

export default function ProfileScreen() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const usuarioGuardado = await AsyncStorage.getItem("usuario");

        if (!usuarioGuardado) {
          router.replace("/login" as any);
          return;
        }

        setUsuario(JSON.parse(usuarioGuardado));
      } catch (error) {
        console.log("Error al cargar usuario:", error);
        router.replace("/login" as any);
      }
    };

    cargarUsuario();
  }, []);

  const cerrarSesion = async () => {
    await AsyncStorage.removeItem("usuario");
    await AsyncStorage.removeItem("token");
    router.replace("/login" as any);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Bienvenida, {usuario?.nombre || "Usuario"}!
        </Text>

        <Text style={styles.email}>
          {usuario?.email || "Sin email cargado"}
        </Text>

        <Text style={styles.subtitle}>
          Acá más pronto vas a poder ver y editar tu información personal, tus
          intereses y tus eventos guardados.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Tus intereses</Text>

          <Text style={styles.infoText}>
            {usuario?.intereses && usuario.intereses.length > 0
              ? usuario.intereses.join(", ")
              : "Todavía no hay intereses cargados"}
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={cerrarSesion}>
          <Text style={styles.logout}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F6FB",
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 80,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#332047",
    marginBottom: 6,
  },
  email: {
    fontSize: 14,
    color: "#8D8A99",
    marginBottom: 22,
  },
  subtitle: {
    fontSize: 15,
    color: "#8D8A99",
    lineHeight: 22,
    marginBottom: 22,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#332047",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#8D8A99",
    lineHeight: 21,
  },
  logoutButton: {
    marginTop: 6,
  },
  logout: {
    fontSize: 16,
    color: "#3a1fa6",
    textDecorationLine: "underline",
    fontWeight: "700",
  },
});