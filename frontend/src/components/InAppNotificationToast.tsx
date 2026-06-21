import { useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, usePathname } from "expo-router";
import { Bell, MessageCircle, Users, CalendarDays } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { API_URL } from "../config/api";

type TipoNotificacion = "comentario" | "conexion" | "evento" | "sistema" | "chat";

type Notificacion = {
  _id: string;
  mensaje: string;
  tipo: TipoNotificacion;
  leida: boolean;
};

const STORAGE_KEY = "ultimaNotificacionToastId";
const INTERVALO_NOTIFICACIONES_MS = 18000;
const TOAST_VISIBLE_MS = 3200;

const iconos = {
  comentario: MessageCircle,
  chat: MessageCircle,
  conexion: Users,
  evento: CalendarDays,
  sistema: Bell,
};

export default function InAppNotificationToast() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const primeraCargaRef = useRef(true);
  const [notificacion, setNotificacion] = useState<Notificacion | null>(null);

  const ocultar = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    Animated.timing(translateY, {
      toValue: -120,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setNotificacion(null));
  };

  const mostrar = (nuevaNotificacion: Notificacion) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setNotificacion(nuevaNotificacion);

    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 170,
      mass: 0.8,
    }).start();

    timeoutRef.current = setTimeout(ocultar, TOAST_VISIBLE_MS);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.dy < -6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderMove: (_, gestureState) => {
        translateY.setValue(Math.max(-120, Math.min(0, gestureState.dy)));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -34 || gestureState.vy < -0.35) {
          ocultar();
          return;
        }

        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 170,
          mass: 0.8,
        }).start();
      },
    })
  ).current;

  const revisarNotificaciones = async () => {
    try {
      if (pathname === "/login" || pathname === "/register") return;

      const usuarioGuardado = await AsyncStorage.getItem("usuario");
      if (!usuarioGuardado) return;

      const usuario = JSON.parse(usuarioGuardado);
      const usuarioId = usuario.id || usuario._id;
      if (!usuarioId) return;

      const response = await fetch(
        `${API_URL}/api/notificaciones/usuario/${usuarioId}?limit=5`
      );
      const data = await response.json();

      if (!response.ok) return;

      const nuevaNoLeida = (data.notificaciones || []).find(
        (item: Notificacion) => !item.leida
      );

      if (!nuevaNoLeida?._id) return;

      const ultimaVista = await AsyncStorage.getItem(STORAGE_KEY);

      if (primeraCargaRef.current) {
        primeraCargaRef.current = false;
        await AsyncStorage.setItem(STORAGE_KEY, nuevaNoLeida._id);
        return;
      }

      if (ultimaVista === nuevaNoLeida._id) return;

      await AsyncStorage.setItem(STORAGE_KEY, nuevaNoLeida._id);
      mostrar(nuevaNoLeida);
    } catch (error) {
      console.log("Error revisando notificaciones in-app:", error);
    }
  };

  useEffect(() => {
    revisarNotificaciones();

    const interval = setInterval(
      revisarNotificaciones,
      INTERVALO_NOTIFICACIONES_MS
    );

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pathname]);

  if (!notificacion) return null;

  const Icono = iconos[notificacion.tipo] || Bell;

  return (
    <Animated.View
      pointerEvents="box-none"
      {...panResponder.panHandlers}
      style={[
        styles.wrapper,
        {
          paddingTop: Math.max(insets.top, 12),
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable
        style={styles.toast}
        onPress={() => {
          ocultar();
          router.push("/notifications" as any);
        }}
      >
        <View style={styles.iconBox}>
          <Icono size={19} color="#FFFFFF" />
        </View>

        <View style={styles.textBox}>
          <Text style={styles.title}>Nueva notificación</Text>
          <Text style={styles.message} numberOfLines={2}>
            {notificacion.mensaje}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
  },
  toast: {
    minHeight: 68,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6DDF8",
    shadowColor: "#2D174A",
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#6D28E8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textBox: {
    flex: 1,
  },
  title: {
    color: "#2D2934",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 2,
  },
  message: {
    color: "#6F6D7A",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
});
