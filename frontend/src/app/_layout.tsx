import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { Stack, router } from "expo-router";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import InAppNotificationToast from "../components/InAppNotificationToast";
import { API_URL } from "../config/api";

const VERIFICAR_SANCION_CADA_MS = 30000;

export default function RootLayout() {
  const verificandoRef = useRef(false);

  const verificarSancion = async () => {
    if (verificandoRef.current) return;

    try {
      verificandoRef.current = true;

      const usuarioGuardado = await AsyncStorage.getItem("usuario");
      if (!usuarioGuardado) return;

      const usuario = JSON.parse(usuarioGuardado);
      const usuarioId = usuario?.id || usuario?._id;
      if (!usuarioId) return;

      const response = await fetch(`${API_URL}/api/usuarios/${usuarioId}`);
      if (!response.ok) return;

      const data = await response.json();
      const sancionadoHasta = data?.usuario?.sancionadoHasta;

      if (sancionadoHasta && new Date(sancionadoHasta) > new Date()) {
        await AsyncStorage.removeItem("usuario");
        await AsyncStorage.removeItem("token");

        alert(
          `Tu cuenta está sancionada hasta el ${new Date(
            sancionadoHasta
          ).toLocaleString("es-AR")}.`
        );

        router.replace("/login" as any);
      }
    } catch (error) {
      console.log("Error verificando sanción:", error);
    } finally {
      verificandoRef.current = false;
    }
  };

  useEffect(() => {
    verificarSancion();

    const intervalo = setInterval(verificarSancion, VERIFICAR_SANCION_CADA_MS);

    const subscription = AppState.addEventListener("change", (estado) => {
      if (estado === "active") {
        verificarSancion();
      }
    });

    return () => {
      clearInterval(intervalo);
      subscription.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <InAppNotificationToast />
    </View>
  );
}