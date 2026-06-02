import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { Search } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../config/api";
import BottomNav from "../components/BottomNav";
import Logo from "../components/Logo";
import LoadingScreen from "../components/LoadingScreen";
import SectionHeader from "../components/SectionHeader";
import EventListCard from "../components/EventListCard";
import EmptyState from "../components/EmptyState";

import { Evento } from "../types/Evento";

const categoriasHome = [
  { label: "Festival", value: "festival" },
  { label: "Recital", value: "recital" },
  { label: "Fiesta", value: "fiesta" },
  { label: "Teatro", value: "teatro" },
  { label: "Cultura", value: "cultura" },
  { label: "Gastronomía", value: "gastronomia" },
];

export default function HomeScreen() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    iniciarHome();
  }, []);

  const iniciarHome = async () => {
    try {
      const usuarioGuardado = await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado) {
        router.replace("/login" as any);
        return;
      }

      const response = await fetch(`${API_URL}/api/eventos`);
      const data = await response.json();

      if (!response.ok) {
        alert(data.message || data.error || "Error al traer eventos.");
        return;
      }

      setEventos(data.eventos || []);
    } catch (error) {
      console.log("Error al iniciar home:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
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

  const eventosDestacados = eventos.filter((evento) => evento.esPromocionado);
  const eventosRecomendados = eventos.filter((evento) => !evento.esPromocionado);

  const destacadosParaMostrar =
    eventosDestacados.length > 0
      ? eventosDestacados.slice(0, 2)
      : eventos.slice(0, 2);

  const recomendadosParaMostrar =
    eventosRecomendados.length > 0
      ? eventosRecomendados.slice(0, 4)
      : eventos.slice(2, 6);

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
        <Logo size="medium" />

        <Text style={styles.title}>¿Qué te pinta hoy?</Text>

        <Pressable style={styles.searchBox} onPress={irAExplore}>
          <Search size={18} color="#A7A7B0" />
          <Text style={styles.fakeInput}>Buscar eventos, personas...</Text>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categories}
          contentContainerStyle={styles.categoriesContent}
        >
          {categoriasHome.map((item, index) => (
            <Pressable
              key={item.value}
              style={[styles.category, index === 0 && styles.categoryActive]}
              onPress={() => irAExploreCategoria(item.value)}
            >
              <Text
                style={[
                  styles.categoryText,
                  index === 0 && styles.categoryTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <SectionHeader
          title="Destacados"
          actionText="Ver todos"
          onPress={irAExplorePromocionados}
        />

        {eventos.length === 0 ? (
          <EmptyState
            title="No hay eventos cargados"
            text="Cuando se carguen eventos en la base de datos, van a aparecer acá."
          />
        ) : (
          <>
            <View style={styles.featuredGrid}>
              {destacadosParaMostrar.map((evento) => (
                <EventListCard
                  key={evento._id}
                  evento={evento}
                  onPress={() => irADetalle(evento._id)}
                />
              ))}
            </View>

            <SectionHeader
              title="Recomendados"
              actionText="Ver todos"
              onPress={irAExploreTodos}
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
    paddingTop: 70,
    paddingHorizontal: 28,
    paddingBottom: 140,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#332047",
    marginBottom: 22,
  },
  searchBox: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EEF5FF",
    borderWidth: 1,
    borderColor: "#D6E8FF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 26,
  },
  fakeInput: {
    marginLeft: 10,
    fontSize: 15,
    color: "#A7A7B0",
  },
  categories: {
    marginBottom: 28,
  },
  categoriesContent: {
    paddingRight: 16,
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
    marginBottom: 28,
  },
  recommendedList: {
    marginBottom: 20,
  },
});