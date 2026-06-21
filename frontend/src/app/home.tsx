
import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Bell, CalendarDays, MapPin, Search, Users } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../config/api";
import BottomNav from "../components/BottomNav";
import Logo from "../components/Logo";
import LoadingScreen from "../components/LoadingScreen";
import SectionHeader from "../components/SectionHeader";
import EventListCard from "../components/EventListCard";
import EmptyState from "../components/EmptyState";
import InterestChips from "@/components/InterestChips";

import { Evento } from "../types/Evento";
import {
  obtenerImagen,
  formatearFecha,
  obtenerUbicacion,
  eventoYaPaso,
} from "../utils/eventHelpers";
import { getCached, setCached } from "../utils/cache";

type Interes = {
  _id: string;
  nombre: string;
  slug: string;
  icono?: string;
};

export default function HomeScreen() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventosRecomendados, setEventosRecomendados] = useState<Evento[]>([]);
  const [categorias, setCategorias] = useState<Interes[]>([]);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
  useCallback(() => {
    iniciarHome();
  }, [])
);

  const iniciarHome = async (silencioso = false) => {
    try {
      const usuarioGuardado = await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado) {
        router.replace("/login" as any);
        return;
      }

      const usuario = JSON.parse(usuarioGuardado);
      const usuarioId = usuario.id || usuario._id;
      const eventosCacheados = getCached<Evento[]>("eventos:todos");
      const categoriasCacheadas = getCached<Interes[]>("intereses:todos");
      const recomendadosCacheados = usuarioId
        ? getCached<Evento[]>(`eventos:recomendados:${usuarioId}`)
        : null;

      if (!silencioso && eventosCacheados) {
        setEventos(eventosCacheados);
        setCategorias(categoriasCacheadas || []);
        setEventosRecomendados(recomendadosCacheados || []);
        setLoading(false);
      }

      const responseEventos = await fetch(`${API_URL}/api/eventos`);
      const dataEventos = await responseEventos.json();

      if (!responseEventos.ok) {
        if (!silencioso) {
          alert(dataEventos.message || dataEventos.error || "Error al traer eventos.");
        }
        return;
      }

      setEventos(dataEventos.eventos || []);
      setCached("eventos:todos", dataEventos.eventos || []);
      (dataEventos.eventos || []).forEach((evento: Evento) => {
        if (evento._id) {
          setCached(`evento:${evento._id}`, evento);
        }
      });

      fetch(`${API_URL}/api/intereses`)
        .then((response) => response.json().then((data) => ({ response, data })))
        .then(({ response, data }) => {
          if (response.ok) {
            setCategorias(data.intereses || []);
            setCached("intereses:todos", data.intereses || []);
          } else {
            console.log("Error al traer categorías:", data);
          }
        })
        .catch((error) => console.log("Error al traer categorías:", error));

      if (usuarioId) {
        cargarNotificaciones(usuarioId);

        fetch(`${API_URL}/api/eventos/recomendados/${usuarioId}`)
          .then((response) => response.json().then((data) => ({ response, data })))
          .then(({ response, data }) => {
            if (response.ok) {
              setEventosRecomendados(data.eventos || []);
              setCached(`eventos:recomendados:${usuarioId}`, data.eventos || []);
            } else {
              console.log("Error al traer recomendados:", data);
            }
          })
          .catch((error) => console.log("Error al traer recomendados:", error));
      }
    } catch (error) {
      console.log("Error al iniciar home:", error);
      if (!silencioso) {
        alert("No se pudo conectar con el servidor.");
      }
    } finally {
      if (!silencioso) {
        setLoading(false);
      }
    }
  };

  const cargarNotificaciones = async (usuarioId: string) => {
    try {
      const responseResumen = await fetch(
        `${API_URL}/api/notificaciones/usuario/${usuarioId}/resumen`
      );
      const dataResumen = await responseResumen.json();

      if (responseResumen.ok) {
        setNotificacionesNoLeidas(dataResumen.noLeidas || 0);
        return;
      }

      const response = await fetch(
        `${API_URL}/api/notificaciones/usuario/${usuarioId}?limit=50`
      );
      const data = await response.json();

      if (!response.ok) {
        console.log("Error al traer notificaciones:", data);
        return;
      }

      const notificaciones = data.notificaciones || [];
      setNotificacionesNoLeidas(
        notificaciones.filter((notificacion: any) => !notificacion.leida).length
      );
    } catch (error) {
      console.log("Error cargando notificaciones:", error);
    }
  };

  const irADetalle = async (eventoId: string) => {
    try {
      const usuarioGuardado = await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado) {
        router.replace("/login" as any);
        return;
      }

      const usuario = JSON.parse(usuarioGuardado);
      const usuarioId = usuario.id || usuario._id;

      if (!usuarioId) {
        router.push(`/event-detail/${eventoId}` as any);
        return;
      }

      const response = await fetch(
        `${API_URL}/api/asistencias/usuario/${usuarioId}`
      );

      const data = await response.json();

      if (!response.ok) {
        router.push(`/event-detail/${eventoId}` as any);
        return;
      }

      const asistencias = data.asistencias || [];

      const yaEstaInteresado = asistencias.some((asistencia: any) => {
        const evento = asistencia.eventoId;

        if (!evento) return false;
        if (typeof evento === "string") return evento === eventoId;

        return evento._id === eventoId;
      });

      if (yaEstaInteresado) {
        router.push(`/event-people/${eventoId}` as any);
      } else {
        router.push(`/event-detail/${eventoId}` as any);
      }
    } catch (error) {
      console.log("Error verificando asistencia:", error);
      router.push(`/event-detail/${eventoId}` as any);
    }
  };

  const irAExplore = () => {
    router.push("/explore" as any);
  };

  const irAExplorePromocionados = () => {
    router.push("/explore?filtro=promocionados" as any);
  };

  const irAExploreTodos = () => {
    router.push("/explore?filtro=todos" as any);
  };

  const irAExploreCategoria = (categoria: string) => {
    router.push(`/explore?categoria=${categoria}` as any);
  };

  const irAExploreRecomendados = () => {
    router.push("/explore?filtro=recomendados" as any);
  };
  const eventosVigentes = eventos.filter((evento) => !eventoYaPaso(evento.fecha));
  const eventosDestacados = eventosVigentes.filter((evento) => evento.esPromocionado);

  const destacadosParaMostrar =
    eventosDestacados.length > 0
      ? eventosDestacados.slice(0, 2)
      : eventosVigentes.slice(0, 2);

  const recomendadosParaMostrar =
    eventosRecomendados.length > 0
      ? eventosRecomendados.filter((evento) => !eventoYaPaso(evento.fecha)).slice(0, 4)
      : eventosVigentes.filter((evento) => !evento.esPromocionado).slice(0, 4);

  if (loading) {
    return <LoadingScreen text="Cargando eventos..." />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Logo size="medium" />
          <Pressable
            style={styles.notificationButton}
            onPress={() => router.push("/notifications" as any)}
          >
            <Bell size={20} color="#6D28E8" />
            {notificacionesNoLeidas > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificacionesNoLeidas > 9 ? "9+" : notificacionesNoLeidas}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        <Pressable style={styles.searchBox} onPress={irAExplore}>
          <Search size={18} color="#7A6F91" />
          <Text style={styles.fakeInput}>
            Buscar eventos, intereses, personas...
          </Text>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categories}
          contentContainerStyle={styles.categoriesContent}
        >
          <InterestChips
            intereses={categorias}
            onPress={irAExploreCategoria}
            variant="home"
          />
        </ScrollView>

        <SectionHeader
          title="Destacados"
          actionText="Ver todos"
          onPress={irAExplorePromocionados}
        />

        {eventosVigentes.length === 0 ? (
          <EmptyState
            title="No hay eventos cargados"
            text="Cuando se carguen eventos en la base de datos, van a aparecer acá."
          />
        ) : (
          <>
            {destacadosParaMostrar[0] && (
              <Pressable
                style={styles.heroCard}
                onPress={() => irADetalle(destacadosParaMostrar[0]._id)}
              >
                <Image
                  source={{ uri: obtenerImagen(destacadosParaMostrar[0].imagen) }}
                  style={styles.heroImage}
                />
                <View style={styles.heroOverlay} />
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>DESTACADO</Text>
                </View>
                <View style={styles.heroContent}>
                  <Text style={styles.heroTitle} numberOfLines={2}>
                    {destacadosParaMostrar[0].nombre}
                  </Text>
                  <View style={styles.heroMetaRow}>
                    <CalendarDays size={14} color="#FFFFFF" />
                    <Text style={styles.heroMetaText}>
                      {formatearFecha(destacadosParaMostrar[0].fecha)}
                    </Text>
                  </View>
                  <View style={styles.heroMetaRow}>
                    <MapPin size={14} color="#FFFFFF" />
                    <Text style={styles.heroMetaText} numberOfLines={1}>
                      {obtenerUbicacion(destacadosParaMostrar[0].ubicacion)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}

            <View style={styles.featuredGrid}>
              {destacadosParaMostrar.slice(1).map((evento) => (
                <EventListCard
                  key={evento._id}
                  evento={evento}
                  onPress={() => irADetalle(evento._id)}
                />
              ))}
            </View>

            <Pressable style={styles.flowCard} onPress={irAExploreTodos}>
              <View style={styles.flowIcon}>
                <Users size={20} color="#6D28E8" />
              </View>
              <View style={styles.flowTextBox}>
                <Text style={styles.flowTitle}>
                  Explorá, elegí un evento y conectá
                </Text>
                <Text style={styles.flowText}>
                  El hub del evento reúne personas, publicaciones y chats.
                </Text>
              </View>
            </Pressable>

            <SectionHeader
              title="Para vos"
              actionText="Ver todos"
              onPress={irAExploreRecomendados}
            />

            <View style={styles.recommendedList}>
              {recomendadosParaMostrar.map((evento) => (
                <EventListCard
                  key={evento._id}
                  evento={evento}
                  onPress={() => irADetalle(evento._id)}
                />
              ))}
            </View>
          </>
        )}
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
    paddingTop: 62,
    paddingHorizontal: 24,
    paddingBottom: 140,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E2F8",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  searchBox: {
    height: 46,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E0F4",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 18,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  fakeInput: {
    marginLeft: 10,
    fontSize: 13,
    color: "#9A96A8",
    fontWeight: "500",
  },
categories: {
  marginBottom: 28,
},
categoriesContent: {
  paddingRight: 16,
  alignItems: "center",
},
  category: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    marginRight: 14,
    backgroundColor: "#FFFFFF",
  },
  categoryActive: {
    backgroundColor: "#E7F3FF",
  },
  categoryText: {
    color: "#A0A0AA",
    fontSize: 15,
    fontWeight: "600",
  },
  categoryTextActive: {
    color: "#177EEA",
    fontWeight: "800",
  },
  featuredGrid: {
    marginBottom: 6,
  },
  heroCard: {
    height: 218,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#211332",
    marginBottom: 16,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,10,38,0.34)",
  },
  heroBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    borderRadius: 10,
    backgroundColor: "#6D28E8",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  heroContent: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  heroMetaText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
    flex: 1,
  },
  flowCard: {
    minHeight: 74,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E2F8",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 26,
  },
  flowIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#F1ECFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  flowTextBox: {
    flex: 1,
  },
  flowTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#2D2934",
    marginBottom: 3,
  },
  flowText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    color: "#8D8A99",
  },
  recommendedList: {
    marginBottom: 20,
  },
});
