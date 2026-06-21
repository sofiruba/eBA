import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import {
  Bell,
  CalendarDays,
  Check,
  MessageCircle,
  Trash2,
  Users,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../config/api";
import BottomNav from "../components/BottomNav";
import EmptyState from "../components/EmptyState";
import LoadingScreen from "../components/LoadingScreen";
import Logo from "../components/Logo";
import SectionHeader from "../components/SectionHeader";
import useAutoRefresh from "../hooks/useAutoRefresh";

type TipoNotificacion = "comentario" | "conexion" | "evento" | "sistema" | "chat";

type Notificacion = {
  _id: string;
  mensaje: string;
  tipo: TipoNotificacion;
  entidadTipo?: string;
  entidadId?: string;
  leida: boolean;
  createdAt?: string;
};

const tipoConfig: Record<
  TipoNotificacion,
  {
    label: string;
    color: string;
    backgroundColor: string;
    icon: typeof MessageCircle;
  }
> = {
  comentario: {
    label: "Comentario",
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
    icon: MessageCircle,
  },
  chat: {
    label: "Chat",
    color: "#0F766E",
    backgroundColor: "#ECFDF5",
    icon: MessageCircle,
  },
  conexion: {
    label: "Conexión",
    color: "#7B2DF0",
    backgroundColor: "#F1ECFF",
    icon: Users,
  },
  evento: {
    label: "Evento",
    color: "#0F766E",
    backgroundColor: "#ECFDF5",
    icon: CalendarDays,
  },
  sistema: {
    label: "Sistema",
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    icon: Bell,
  },
};

export default function NotificationsScreen() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargarNotificaciones();
    }, [])
  );

  const cargarNotificaciones = async (silencioso = false) => {
    try {
      if (!silencioso) {
        setLoading(true);
      }

      const usuarioGuardado = await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado) {
        router.replace("/login" as any);
        return;
      }

      const usuario = JSON.parse(usuarioGuardado);
      const usuarioId = usuario.id || usuario._id;

      if (!usuarioId) {
        alert("No se encontró el usuario logueado.");
        router.replace("/login" as any);
        return;
      }

      const response = await fetch(
        `${API_URL}/api/notificaciones/usuario/${usuarioId}`
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || data.message || "Error al traer notificaciones.");
        return;
      }

      setNotificaciones(data.notificaciones || []);
    } catch (error) {
      console.log("Error al cargar notificaciones:", error);
      if (!silencioso) {
        alert("No se pudieron cargar tus notificaciones.");
      }
    } finally {
      if (!silencioso) {
        setLoading(false);
      }
    }
  };

  useAutoRefresh(
    useCallback(() => cargarNotificaciones(true), []),
    60000,
    !loading
  );

  const marcarComoLeida = async (notificacionId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/notificaciones/${notificacionId}/leida`,
        {
          method: "PUT",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo marcar como leída.");
        return;
      }

      setNotificaciones((prev) =>
        prev.map((notificacion) =>
          notificacion._id === notificacionId
            ? { ...notificacion, leida: true }
            : notificacion
        )
      );
    } catch (error) {
      console.log("Error al marcar notificación:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  const eliminarNotificacion = async (notificacionId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/notificaciones/${notificacionId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo eliminar la notificación.");
        return;
      }

      setNotificaciones((prev) =>
        prev.filter((notificacion) => notificacion._id !== notificacionId)
      );
    } catch (error) {
      console.log("Error al eliminar notificación:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  const abrirNotificacion = (notificacion: Notificacion) => {
    if (!notificacion.leida) {
      marcarComoLeida(notificacion._id);
    }

    if (notificacion.tipo === "chat" && notificacion.entidadId) {
      router.push(`/chat/${notificacion.entidadId}` as any);
      return;
    }

    if (notificacion.tipo === "comentario" && notificacion.entidadId) {
      router.push(`/publication-detail/${notificacion.entidadId}` as any);
      return;
    }

    if (notificacion.tipo === "evento" && notificacion.entidadId) {
      router.push(`/event-detail/${notificacion.entidadId}` as any);
      return;
    }

    if (notificacion.tipo === "conexion") {
      router.push("/connections" as any);
    }
  };

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "Ahora";

    const fechaNotificacion = new Date(fecha);

    if (Number.isNaN(fechaNotificacion.getTime())) {
      return "Fecha no disponible";
    }

    return fechaNotificacion.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendientes = notificaciones.filter(
    (notificacion) => !notificacion.leida
  );

  if (loading) {
    return <LoadingScreen text="Cargando notificaciones..." />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <Logo size="medium" />

        <Text style={styles.title}>Notificaciones</Text>

        <Text style={styles.subtitle}>
          Avisos sobre conexiones, eventos y actividad de tu cuenta.
        </Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Bell size={24} color="#7528F0" />
          </View>

          <View style={styles.summaryTextBox}>
            <Text style={styles.summaryTitle}>
              {pendientes.length} sin leer
            </Text>

            <Text style={styles.summaryText}>
              Tenés {notificaciones.length} notificaciones en total.
            </Text>
          </View>
        </View>

        <SectionHeader title="Recientes" />

        {notificaciones.length === 0 ? (
          <EmptyState
            icon={<Bell size={52} color="#B484F2" />}
            title="No tenés notificaciones"
            text="Cuando haya novedades sobre tus conexiones o eventos, van a aparecer acá."
            buttonText="Explorar eventos"
            onPress={() => router.push("/explore" as any)}
          />
        ) : (
          <View style={styles.list}>
            {notificaciones.map((notificacion) => {
              const config =
                tipoConfig[notificacion.tipo] || tipoConfig.sistema;
              const Icon = config.icon;

              return (
                <TouchableOpacity
                  key={notificacion._id}
                  style={[
                    styles.notificationCard,
                    !notificacion.leida && styles.unreadCard,
                  ]}
                  activeOpacity={0.86}
                  onPress={() => abrirNotificacion(notificacion)}
                >
                  <View
                    style={[
                      styles.typeIcon,
                      { backgroundColor: config.backgroundColor },
                    ]}
                  >
                    <Icon size={22} color={config.color} />
                  </View>

                  <View style={styles.notificationContent}>
                    <View style={styles.cardHeader}>
                      <View
                        style={[
                          styles.typePill,
                          { backgroundColor: config.backgroundColor },
                        ]}
                      >
                        <Text style={[styles.typeText, { color: config.color }]}>
                          {config.label}
                        </Text>
                      </View>

                      {!notificacion.leida && <View style={styles.unreadDot} />}
                    </View>

                    <Text style={styles.message}>{notificacion.mensaje}</Text>

                    <Text style={styles.date}>
                      {formatearFecha(notificacion.createdAt)}
                    </Text>
                  </View>

                  <View style={styles.actions}>
                    {!notificacion.leida && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        activeOpacity={0.85}
                        onPress={() => marcarComoLeida(notificacion._id)}
                      >
                        <Check size={18} color="#12A150" />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.actionButton}
                      activeOpacity={0.85}
                      onPress={() => eliminarNotificacion(notificacion._id)}
                    >
                      <Trash2 size={17} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F5FF",
  },
  container: {
    paddingHorizontal: 28,
    paddingTop: 74,
    paddingBottom: 130,
  },
  title: {
    fontSize: 31,
    fontWeight: "900",
    color: "#332047",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#8D8A99",
    lineHeight: 22,
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 26,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  summaryIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#F1ECFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  summaryTextBox: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#332047",
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 13,
    color: "#8D8A99",
    lineHeight: 18,
  },
  list: {
    marginBottom: 20,
  },
  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  unreadCard: {
    borderColor: "rgba(117,40,240,0.2)",
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  typePill: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "900",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#7528F0",
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: "#2D2934",
    fontWeight: "700",
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: "#8D8A99",
    fontWeight: "600",
  },
  actions: {
    alignItems: "center",
    marginLeft: 10,
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F8F6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
});
