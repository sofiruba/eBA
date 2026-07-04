import { useEffect, useRef } from "react";
import { AppState, Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import { Stack, router, usePathname } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import DesktopNav from "../components/DesktopNav";
import InAppNotificationToast from "../components/InAppNotificationToast";
import { API_URL } from "../config/api";

const VERIFICAR_SANCION_CADA_MS = 30000;
const FRAMED_ROUTES = [
  "/home",
  "/explore",
  "/event-detail",
  "/event-people",
  "/chats",
  "/chat",
  "/connections",
  "/user-profile",
  "/profile",
  "/edit-profile",
  "/favorites",
  "/notifications",
  "/publication-detail",
  "/ser-organizador",
  "/mis-eventos",
  "/crear-evento",
  "/manager",
];

export default function RootLayout() {
  const verificandoRef = useRef(false);
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 900;
  const shouldUseAppFrame = FRAMED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

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
    <View
      style={[
        styles.root,
        isDesktopWeb && shouldUseAppFrame && styles.webAppFrame,
      ]}
    >
      {isDesktopWeb && shouldUseAppFrame ? (
        <View style={styles.webShell}>
          <DesktopNav />
          <View style={[styles.stackShell, styles.webStackShell]}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>
        </View>
      ) : (
        <View style={styles.stackShell}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      )}
      <InAppNotificationToast />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  stackShell: {
    flex: 1,
  },
  webAppFrame: {
    minHeight: "100vh" as any,
    backgroundColor: "#F7F5FF",
    alignItems: "center",
  },
  webShell: {
    width: "100%",
    maxWidth: 1180,
    minHeight: "100vh" as any,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "center",
    gap: 18,
    paddingHorizontal: 28,
  },
  webStackShell: {
    flex: 1,
    maxWidth: 900,
    minHeight: "100vh" as any,
  },
});
