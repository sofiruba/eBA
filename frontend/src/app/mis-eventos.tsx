import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import {
  PlusCircle,
  CalendarDays,
  MapPin,
  Clock3,
  CheckCircle2,
  XCircle,
} from "lucide-react-native";
import { API_URL } from "../config/api";
import LoadingScreen from "../components/LoadingScreen";
import BottomNav from "../components/BottomNav";
import { Evento } from "../types/Evento";
import { obtenerUsuarioActualizado } from "../utils/usuario";
import {
  obtenerImagen,
  formatearFecha,
  obtenerUbicacion,
} from "../utils/eventHelpers";

const ESTADO_CONFIG: Record<
  string,
  { icon: any; color: string; bg: string; label: string }
> = {
  pendiente: {
    icon: Clock3,
    color: "#B7791F",
    bg: "#FFF7E6",
    label: "En revisión",
  },
  aprobado: {
    icon: CheckCircle2,
    color: "#1E9E5A",
    bg: "#E9FBF1",
    label: "Aprobado",
  },
  rechazado: {
    icon: XCircle,
    color: "#E53935",
    bg: "#FFF1F2",
    label: "Rechazado",
  },
};

export default function MisEventosScreen() {
  const [permitido, setPermitido] = useState<boolean | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      iniciar();
    }, [])
  );

  const iniciar = async () => {
    try {
      setLoading(true);

      const usuario = await obtenerUsuarioActualizado();

      if (!usuario) {
        router.replace("/login" as any);
        return;
      }

      if (!usuario.esOrganizador) {
        setPermitido(false);
        return;
      }

      setPermitido(true);

      const usuarioId = usuario.id || usuario._id;

      const response = await fetch(
        `${API_URL}/api/eventos/organizador/${usuarioId}`
      );
      const data = await response.json();

      if (response.ok) {
        setEventos(data.eventos || []);
      }
    } catch (error) {
      console.log("Error cargando mis eventos:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (loading || permitido === null) {
    return <LoadingScreen text="Cargando tus eventos..." />;
  }

  if (permitido === false) {
    return (
      <View style={styles.screen}>
        <View style={styles.container}>
          <Text style={styles.title}>Acceso restringido</Text>
          <Text style={styles.subtitle}>
            Esta sección es solo para organizadores verificados de eBA.
          </Text>
        </View>
        <BottomNav />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Mis eventos</Text>
            <Text style={styles.subtitle}>
              Creá, editá o eliminá tus eventos. Todo evento nuevo pasa por
              revisión de un manager antes de publicarse.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.crearButton}
          activeOpacity={0.85}
          onPress={() => router.push("/mis-eventos/nuevo" as any)}
        >
          <PlusCircle size={18} color="#FFFFFF" />
          <Text style={styles.crearButtonText}>Crear evento</Text>
        </TouchableOpacity>

        {eventos.length === 0 ? (
          <Text style={styles.emptyText}>
            Todavía no creaste ningún evento.
          </Text>
        ) : (
          eventos.map((evento) => {
            const estadoInfo =
              ESTADO_CONFIG[evento.estado || "pendiente"] ||
              ESTADO_CONFIG.pendiente;
            const EstadoIcon = estadoInfo.icon;

            return (
              <TouchableOpacity
                key={evento._id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() =>
                  router.push(`/mis-eventos/${evento._id}` as any)
                }
              >
                <Image
                  source={{ uri: obtenerImagen(evento.imagen) }}
                  style={styles.cardImage}
                />

                <View style={styles.cardBody}>
                  <View
                    style={[styles.estadoChip, { backgroundColor: estadoInfo.bg }]}
                  >
                    <EstadoIcon size={13} color={estadoInfo.color} />
                    <Text style={[styles.estadoChipText, { color: estadoInfo.color }]}>
                      {estadoInfo.label}
                    </Text>
                  </View>

                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {evento.nombre}
                  </Text>

                  <View style={styles.cardRow}>
                    <CalendarDays size={13} color="#8D8A99" />
                    <Text style={styles.cardRowText}>
                      {formatearFecha(evento.fecha)}
                    </Text>
                  </View>

                  <View style={styles.cardRow}>
                    <MapPin size={13} color="#8D8A99" />
                    <Text style={styles.cardRowText} numberOfLines={1}>
                      {obtenerUbicacion(evento.ubicacion)}
                    </Text>
                  </View>

                  {evento.estado === "rechazado" && evento.motivoRechazo && (
                    <Text style={styles.motivoText} numberOfLines={2}>
                      Motivo: {evento.motivoRechazo}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
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
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 150,
  },
  headerRow: {
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#332047",
  },
  subtitle: {
    fontSize: 13,
    color: "#8D8A99",
    lineHeight: 19,
    marginTop: 6,
  },
  crearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#7528F0",
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 22,
  },
  crearButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    color: "#8D8A99",
    textAlign: "center",
    marginTop: 30,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8E2F8",
    marginBottom: 14,
    overflow: "hidden",
  },
  cardImage: {
    width: 96,
    height: "100%",
    minHeight: 118,
  },
  cardBody: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  estadoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 4,
  },
  estadoChipText: {
    fontSize: 11,
    fontWeight: "800",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#332047",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardRowText: {
    fontSize: 12,
    color: "#8D8A99",
  },
  motivoText: {
    fontSize: 12,
    color: "#E53935",
    marginTop: 4,
  },
});