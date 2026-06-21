import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  Heart,
  MapPin,
  Users,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../../config/api";
import Logo from "../../components/Logo";
import LoadingScreen from "../../components/LoadingScreen";
import EmptyState from "../../components/EmptyState";
import BottomNav from "../../components/BottomNav";
import { Evento } from "../../types/Evento";
import {
  obtenerImagen,
  formatearFechaLarga,
  obtenerUbicacion,
  eventoYaPaso,
} from "../../utils/eventHelpers";
import { getCached, invalidateEventCaches, setCached } from "../../utils/cache";

export default function EventDetail() {
  const { id } = useLocalSearchParams();

  const [eventData, setEventData] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrando, setRegistrando] = useState(false);
  const [favoritoId, setFavoritoId] = useState<string | null>(null);
  const [guardandoFavorito, setGuardandoFavorito] = useState(false);

  useEffect(() => {
    iniciarDetalle();
  }, [id]);

  const iniciarDetalle = async () => {
    try {
      const usuarioGuardado = await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado) {
        router.replace("/login" as any);
        return;
      }

      if (!id) {
        alert("No se encontró el ID del evento.");
        return;
      }

      const usuario = JSON.parse(usuarioGuardado);
      const usuarioId = usuario.id || usuario._id;

      const cacheKey = `evento:${String(id)}`;
      const eventoCacheado = getCached<Evento>(cacheKey);

      if (eventoCacheado) {
        setEventData(eventoCacheado);
        setLoading(false);
      }

      const response = await fetch(`${API_URL}/api/eventos/${id}`);
      const data = await response.json();

      if (!response.ok) {
        alert(data.message || data.error || "Error al traer detalle.");
        return;
      }

      const evento = data.evento || data;
      setEventData(evento);
      setCached(cacheKey, evento);

      if (usuarioId) {
        cargarFavorito(usuarioId, String(id));
      }
    } catch (error) {
      console.log("Error al traer detalle:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const cargarFavorito = async (usuarioId: string, eventoId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/favoritos/usuario/${usuarioId}`);
      const data = await response.json();

      if (!response.ok) return;

      const favorito = (data.favoritos || []).find((item: any) => {
        const evento = item.eventoId;
        const idEvento = typeof evento === "string" ? evento : evento?._id;
        return idEvento === eventoId;
      });

      setFavoritoId(favorito?._id || null);
    } catch (error) {
      console.log("Error cargando favorito:", error);
    }
  };

  const toggleFavorito = async () => {
    try {
      if (!eventData?._id || guardandoFavorito) return;

      setGuardandoFavorito(true);

      const usuarioGuardado = await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado) {
        router.replace("/login" as any);
        return;
      }

      const usuario = JSON.parse(usuarioGuardado);
      const usuarioId = usuario.id || usuario._id;

      if (!usuarioId) return;

      if (favoritoId) {
        const response = await fetch(`${API_URL}/api/favoritos/${favoritoId}`, {
          method: "DELETE",
        });
        const data = await response.json();

        if (!response.ok) {
          alert(data.error || "No se pudo sacar de guardados.");
          return;
        }

        setFavoritoId(null);
        invalidateEventCaches(eventData._id, usuarioId);
        return;
      }

      const response = await fetch(`${API_URL}/api/favoritos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId,
          eventoId: eventData._id,
        }),
      });

      const data = await response.json();

      if (!response.ok && data.error !== "El evento ya está en favoritos") {
        alert(data.error || "No se pudo guardar el evento.");
        return;
      }

      setFavoritoId(data.favorito?._id || "guardado");
      invalidateEventCaches(eventData._id, usuarioId);
    } catch (error) {
      console.log("Error actualizando favorito:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setGuardandoFavorito(false);
    }
  };

  const registrarAsistencia = async () => {
    try {
      if (registrando) return;

      setRegistrando(true);

      const usuarioGuardado = await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado) {
        router.replace("/login" as any);
        return;
      }

      if (!eventData?._id) {
        alert("No se encontró el evento.");
        return;
      }

      if (eventoYaPaso(eventData.fecha)) {
        alert("No podés marcar Quiero ir en un evento finalizado.");
        return;
      }

      const usuario = JSON.parse(usuarioGuardado);
      const usuarioId = usuario.id || usuario._id;

      if (!usuarioId) {
        alert("No se encontró el usuario logueado.");
        return;
      }

      const response = await fetch(`${API_URL}/api/asistencias`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId,
          eventoId: eventData._id,
          estado: "interesado",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Error al registrar asistencia.");
        return;
      }

      invalidateEventCaches(eventData._id, usuarioId);
      router.replace(`/event-people/${eventData._id}?returnToHome=1` as any);
    } catch (error) {
      console.log("Error al registrar asistencia:", error);
      alert("No se pudo registrar la asistencia.");
    } finally {
      setRegistrando(false);
    }
  };

  if (loading) {
    return <LoadingScreen text="Cargando detalle..." />;
  }

  if (!eventData) {
    return (
      <EmptyState
        title="No se encontró el evento"
        text="Volvé e intentá entrar nuevamente."
        buttonText="Volver"
        onPress={() => router.back()}
      />
    );
  }

  const eventoFinalizado = eventoYaPaso(eventData.fecha);

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <Logo size="medium" />

        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: obtenerImagen(eventData.imagen) }}
            style={styles.heroImage}
          />

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color="#9A98A6" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.category}>{eventData.categoria || "Evento"}</Text>

          <Text style={styles.title}>{eventData.nombre}</Text>

          <View style={styles.interestedRow}>
            <Heart size={17} color="#EF5B5B" fill="#EF5B5B" />
            <Text style={styles.interestedText}>
              Personas interesadas en asistir a este evento
            </Text>
          </View>

          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.iconBox}>
                <MapPin size={22} color="#7B2DF0" />
              </View>

              <View style={styles.infoTextBox}>
                <Text style={styles.infoTitle}>
                  {obtenerUbicacion(eventData.ubicacion)}
                </Text>
                <Text style={styles.infoSubtitle}>Ubicación del evento</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.iconBox}>
                <CalendarDays size={22} color="#7B2DF0" />
              </View>

              <View style={styles.infoTextBox}>
                <Text style={styles.infoTitle}>
                  {formatearFechaLarga(eventData.fecha)}
                </Text>
                <Text style={styles.infoSubtitle}>Fecha del evento</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.iconBox}>
                <Users size={22} color="#7B2DF0" />
              </View>

              <View style={styles.infoTextBox}>
                <Text style={styles.infoTitle}>Organizador</Text>
                <Text style={styles.infoSubtitle}>
                  {eventData.organizador || "eBA"}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.description}>
            {eventData.descripcion ||
              "Evento ideal para conocer personas con intereses similares y vivir la experiencia acompañado."}
          </Text>

          <TouchableOpacity
            style={styles.secondaryCard}
            activeOpacity={0.85}
            onPress={() => router.push(`/event-people/${eventData._id}` as any)}
          >
            <View>
              <Text style={styles.secondaryTitle}>Personas interesadas</Text>
              <Text style={styles.secondaryText}>
                Descubrí quiénes quieren ir y conectá antes del evento.
              </Text>
            </View>
            <Text style={styles.secondaryArrow}>›</Text>
          </TouchableOpacity>

          {!eventoFinalizado ? (
            <TouchableOpacity
              style={[
                styles.mainButton,
                registrando && styles.mainButtonDisabled,
              ]}
              activeOpacity={0.85}
              onPress={registrarAsistencia}
              disabled={registrando}
            >
              <Text style={styles.mainButtonText}>
                {registrando ? "Registrando..." : "Quiero ir"}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.mainButton, styles.finishedButton]}>
              <Text style={styles.finishedButtonText}>Evento finalizado</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveButton, favoritoId && styles.saveButtonActive]}
            activeOpacity={0.85}
            onPress={toggleFavorito}
            disabled={guardandoFavorito}
          >
            <Bookmark
              size={18}
              color={favoritoId ? "#FFFFFF" : "#7528F0"}
              fill={favoritoId ? "#FFFFFF" : "transparent"}
            />
            <Text
              style={[
                styles.saveButtonText,
                favoritoId && styles.saveButtonTextActive,
              ]}
            >
              {favoritoId ? "Guardado" : "Guardar evento"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F6FB",
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 140,
  },
  imageWrapper: {
    height: 245,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    marginBottom: 28,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  backButton: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 6,
  },
  category: {
    fontSize: 14,
    fontWeight: "800",
    color: "#7528F0",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#3A2451",
    marginBottom: 14,
  },
  interestedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  interestedText: {
    marginLeft: 8,
    fontSize: 15,
    color: "#5F5C68",
  },
  infoList: {
    marginBottom: 22,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1ECFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  infoTextBox: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D2934",
  },
  infoSubtitle: {
    fontSize: 13,
    color: "#8D8A99",
    marginTop: 3,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: "#6F6D7A",
    marginTop: 4,
    marginBottom: 18,
  },
  secondaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  secondaryTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2D2934",
    marginBottom: 4,
  },
  secondaryText: {
    fontSize: 13,
    color: "#8D8A99",
    maxWidth: 260,
  },
  secondaryArrow: {
    fontSize: 30,
    color: "#B9B6C8",
  },
  mainButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: "#7528F0",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 22,
    marginTop: 14,
  },
  mainButtonDisabled: {
    opacity: 0.7,
  },
  finishedButton: {
    backgroundColor: "#ECE8F4",
  },
  finishedButtonText: {
    color: "#8D8A99",
    fontSize: 17,
    fontWeight: "900",
  },
  mainButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  saveButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0D9F4",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginHorizontal: 22,
    marginTop: 12,
  },
  saveButtonActive: {
    backgroundColor: "#7528F0",
    borderColor: "#7528F0",
  },
  saveButtonText: {
    marginLeft: 8,
    color: "#7528F0",
    fontSize: 15,
    fontWeight: "900",
  },
  saveButtonTextActive: {
    color: "#FFFFFF",
  },
});
