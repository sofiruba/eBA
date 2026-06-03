import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { Ticket, Users } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../config/api";
import BottomNav from "../components/BottomNav";
import LoadingScreen from "../components/LoadingScreen";
import EmptyState from "../components/EmptyState";
import EventListCard from "../components/EventListCard";
import Logo from "../components/Logo";

import { Asistencia } from "../types/Asistencia";
import { Evento } from "../types/Evento";

export default function FavoritesScreen() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarMisEventos();
  }, []);

  const cargarMisEventos = async () => {
    try {
      setLoading(true);

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
        `${API_URL}/api/asistencias/usuario/${usuarioId}`
      );

      const data = await response.json();

      console.log("Mis asistencias:", data);

      if (!response.ok) {
        alert(data.error || data.message || "Error al traer tus eventos.");
        return;
      }

      setAsistencias(data.asistencias || []);
    } catch (error) {
      console.log("Error al cargar mis eventos:", error);
      alert("No se pudieron cargar tus eventos.");
    } finally {
      setLoading(false);
    }
  };

  const sacarDeMisEventos = async (asistenciaId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/asistencias/${asistenciaId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo sacar el evento.");
        return;
      }

      setAsistencias((prev) =>
        prev.filter((asistencia) => asistencia._id !== asistenciaId)
      );
    } catch (error) {
      console.log("Error al sacar evento:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };


  const irAEvento = (eventoId?: string) => {
    if (!eventoId) return;

    router.push(`/event-people/${eventoId}` as any);
  };

  const obtenerTextoEstado = (estado?: string) => {
    if (estado === "confirmado") return "Confirmado";
    if (estado === "cancelado") return "Cancelado";
    return "Interesado";
  };

  const eventosActivos = asistencias.filter(
    (asistencia) => asistencia.estado !== "cancelado"
  );

  if (loading) {
    return <LoadingScreen text="Cargando tus eventos..." />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <Logo size="medium" />

        <Text style={styles.title}>Mis eventos</Text>

        <Text style={styles.subtitle}>
          Eventos en los que tocaste “Quiero ir”.
        </Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ticket size={24} color="#7528F0" />
          </View>

          <View style={styles.summaryTextBox}>
            <Text style={styles.summaryTitle}>
              {eventosActivos.length} eventos guardados
            </Text>

            <Text style={styles.summaryText}>
              Acá aparecen los eventos donde marcaste interés.
            </Text>
          </View>
        </View>

        {eventosActivos.length === 0 ? (
          <EmptyState
            icon={<Users size={54} color="#C7B8E8" />}
            title="Todavía no marcaste eventos"
            text="Entrá a un evento y tocá “Quiero ir” para que aparezca en esta pantalla."
            buttonText="Explorar eventos"
            onPress={() => router.push("/explore" as any)}
          />
        ) : (
          <View style={styles.list}>
            {eventosActivos.map((asistencia) => {
              const evento = asistencia.eventoId as Evento;

              if (!evento) return null;

              return (
                <EventListCard
                  key={asistencia._id}
                  evento={evento}
                  status={obtenerTextoEstado(asistencia.estado)}
                  showRemove
                  onRemovePress={() => sacarDeMisEventos(asistencia._id)}
                  onPress={() => irAEvento(evento._id)}
                />
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
});