import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  CalendarDays,
  Heart,
  MapPin,
  Users,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../../config/api";

type Ubicacion = {
  ciudad?: string;
  barrio?: string;
  direccion?: string;
};

type Evento = {
  _id: string;
  nombre: string;
  descripcion?: string;
  fecha?: string;
  ubicacion?: Ubicacion;
  categoria?: string;
  imagen?: string;
  organizador?: string;
  esPromocionado?: boolean;
};

export default function EventDetail() {
  const { id } = useLocalSearchParams();

  const [eventData, setEventData] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

        const response = await fetch(`${API_URL}/api/eventos/${id}`);
        const data = await response.json();

        console.log("Detalle evento desde backend:", data);

        if (!response.ok) {
          alert(data.message || data.error || "Error al traer detalle.");
          return;
        }

        setEventData(data.evento || data);
      } catch (error) {
        console.log("Error al traer detalle:", error);
        alert("No se pudo conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    iniciarDetalle();
  }, [id]);

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "Fecha a confirmar";

    const fechaDate = new Date(fecha);

    if (isNaN(fechaDate.getTime())) {
      return fecha;
    }

    return fechaDate.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const obtenerUbicacionPrincipal = (ubicacion?: Ubicacion) => {
    if (!ubicacion) return "Ubicación a confirmar";

    if (ubicacion.direccion) return ubicacion.direccion;
    if (ubicacion.barrio) return ubicacion.barrio;
    if (ubicacion.ciudad) return ubicacion.ciudad;

    return "Ubicación a confirmar";
  };

  const obtenerUbicacionSecundaria = (ubicacion?: Ubicacion) => {
    if (!ubicacion) return "Buenos Aires";

    const partes = [];

    if (ubicacion.barrio) partes.push(ubicacion.barrio);
    if (ubicacion.ciudad) partes.push(ubicacion.ciudad);

    return partes.length > 0 ? partes.join(", ") : "Buenos Aires";
  };

  const obtenerImagen = (imagen?: string) => {
    if (!imagen || imagen.trim() === "") {
      return "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1000";
    }

    if (imagen.startsWith("http")) {
      return imagen;
    }

    return `${API_URL}${imagen}`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7528F0" />
        <Text style={styles.loadingText}>Cargando detalle...</Text>
      </View>
    );
  }

  if (!eventData) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No se encontró el evento</Text>

        <TouchableOpacity style={styles.backFallback} onPress={() => router.back()}>
          <Text style={styles.backFallbackText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <Image
          source={require("../../../assets/images/logoeba.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: obtenerImagen(eventData.imagen) }}
            style={styles.heroImage}
          />

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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

          <View style={styles.avatarRow}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200",
              }}
              style={styles.avatar}
            />
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200",
              }}
              style={[styles.avatar, styles.avatarOverlap]}
            />
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200",
              }}
              style={[styles.avatar, styles.avatarOverlap]}
            />
            <Text style={styles.avatarText}>Ver usuarios</Text>
          </View>

          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.iconBox}>
                <MapPin size={22} color="#7B2DF0" />
              </View>

              <View style={styles.infoTextBox}>
                <Text style={styles.infoTitle}>
                  {obtenerUbicacionPrincipal(eventData.ubicacion)}
                </Text>
                <Text style={styles.infoSubtitle}>
                  {obtenerUbicacionSecundaria(eventData.ubicacion)}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.iconBox}>
                <CalendarDays size={22} color="#7B2DF0" />
              </View>

              <View style={styles.infoTextBox}>
                <Text style={styles.infoTitle}>
                  {formatearFecha(eventData.fecha)}
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

          <TouchableOpacity style={styles.readMore}>
            <Text style={styles.readMoreText}>Leer más</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryCard}>
            <View>
              <Text style={styles.secondaryTitle}>Publicaciones</Text>
              <Text style={styles.secondaryText}>
                Mirá qué están compartiendo sobre este evento.
              </Text>
            </View>
            <Text style={styles.secondaryArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryCard}>
            <View>
              <Text style={styles.secondaryTitle}>Personas interesadas</Text>
              <Text style={styles.secondaryText}>
                Descubrí quiénes quieren ir y conectá antes del evento.
              </Text>
            </View>
            <Text style={styles.secondaryArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mainButton}>
            <Text style={styles.mainButtonText}>Quiero ir!</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F6FB",
  },
  center: {
    flex: 1,
    backgroundColor: "#F4F6FB",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#6F6D7A",
    fontWeight: "600",
  },
  errorText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#332047",
  },
  backFallback: {
    marginTop: 20,
    backgroundColor: "#7528F0",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  backFallbackText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 50,
  },
  logo: {
    width: 76,
    height: 46,
    marginBottom: 22,
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
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarOverlap: {
    marginLeft: -10,
  },
  avatarText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#3A2451",
    fontWeight: "600",
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
  },
  readMore: {
    marginTop: 10,
    marginBottom: 18,
  },
  readMoreText: {
    color: "#7B2DF0",
    fontSize: 14,
    fontWeight: "700",
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
  mainButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
});