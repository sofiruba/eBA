import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Search, SlidersHorizontal } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {Interes } from '../types/Interes'
import Logo from "../components/Logo";
import { API_URL } from "../config/api";
import BottomNav from "../components/BottomNav";
import LoadingScreen from "../components/LoadingScreen";
import EmptyState from "../components/EmptyState";
import EventListCard from "../components/EventListCard";
import SectionHeader from "../components/SectionHeader";
import InterestChips from "../components/InterestChips";

import { Evento } from "../types/Evento";

const busquedasPopulares = [
  "Lollapalooza",
  "Primavera",
  "Lali",
  "Airbag",
  "BRESH",
  "Techno",
];

export default function ExploreScreen() {
  const params = useLocalSearchParams();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [interesesDisponibles, setInteresesDisponibles] = useState<Interes[]>([]);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [buscoAlgo, setBuscoAlgo] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState("");
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [tituloPersonalizado, setTituloPersonalizado] = useState("");

  useEffect(() => {
    const iniciarPantalla = async () => {
      try {
        setLoading(true);

        const usuarioGuardado = await AsyncStorage.getItem("usuario");

        if (!usuarioGuardado) {
          router.replace("/login" as any);
          return;
        }

        const favoritosGuardados = await AsyncStorage.getItem("favoritos");
        setFavoritos(favoritosGuardados ? JSON.parse(favoritosGuardados) : []);

        await cargarIntereses();

        if (params.filtro === "promocionados") {
          setBuscoAlgo(true);
          setCategoriaActiva("");
          setTextoBusqueda("");
          setTituloPersonalizado("Eventos destacados");
          await obtenerEventosPromocionados();
          return;
        }

        if (params.filtro === "recomendados") {
          setBuscoAlgo(true);
          setCategoriaActiva("");
          setTextoBusqueda("");
          setTituloPersonalizado("Recomendados para vos");
          await obtenerEventosRecomendadosDelUsuario();
          return;
        }

        if (params.categoria) {
          await filtrarPorCategoria(String(params.categoria));
          return;
        }

        await obtenerTodosLosEventos();
      } catch (error) {
        console.log("Error al iniciar búsqueda:", error);
      } finally {
        setLoading(false);
      }
    };

    iniciarPantalla();
  }, [params.filtro, params.categoria]);

  const cargarIntereses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/intereses`);
      const data = await response.json();

      if (!response.ok) {
        console.log("Error al traer intereses:", data);
        return;
      }

      setInteresesDisponibles(data.intereses || []);
    } catch (error) {
      console.log("Error al cargar intereses:", error);
    }
  };

  const obtenerUsuarioId = async () => {
    const usuarioGuardado = await AsyncStorage.getItem("usuario");

    if (!usuarioGuardado) {
      router.replace("/login" as any);
      return null;
    }

    const usuario = JSON.parse(usuarioGuardado);
    return usuario.id || usuario._id || null;
  };

  const obtenerTodosLosEventos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/eventos`);
      const data = await response.json();

      if (!response.ok) {
        alert(data.message || data.error || "Error al traer eventos.");
        return;
      }

      setEventos(data.eventos || []);
      setBuscoAlgo(false);
      setCategoriaActiva("");
      setTituloPersonalizado("");
    } catch (error) {
      console.log("Error al traer eventos:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  const obtenerEventosRecomendadosDelUsuario = async () => {
    try {
      const usuarioId = await obtenerUsuarioId();

      if (!usuarioId) {
        alert("No se encontró el usuario logueado.");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/eventos/recomendados/${usuarioId}`
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || data.error || "Error al traer recomendados.");
        return;
      }

      setEventos(data.eventos || []);
      setBuscoAlgo(true);
      setCategoriaActiva("");
      setTituloPersonalizado("Recomendados para vos");
    } catch (error) {
      console.log("Error al traer recomendados:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  const obtenerEventosPromocionados = async () => {
    try {
      const response = await fetch(`${API_URL}/api/eventos/promocionados`);
      const data = await response.json();

      if (!response.ok) {
        alert(data.message || data.error || "Error al traer eventos promocionados.");
        return;
      }

      setEventos(data.eventos || []);
      setBuscoAlgo(true);
      setCategoriaActiva("");
    } catch (error) {
      console.log("Error al traer promocionados:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  const buscarEventos = async (texto: string) => {
    setTextoBusqueda(texto);
    setCategoriaActiva("");
    setTituloPersonalizado("");

    if (texto.trim().length === 0) {
      setBuscoAlgo(false);
      await obtenerTodosLosEventos();
      return;
    }

    try {
      setBuscoAlgo(true);

      const response = await fetch(
        `${API_URL}/api/eventos/buscar/${encodeURIComponent(texto.trim())}`
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || data.error || "Error al buscar eventos.");
        return;
      }

      setEventos(data.eventos || []);
    } catch (error) {
      console.log("Error al buscar eventos:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  const filtrarPorCategoria = async (categoria: string) => {
    try {
      setLoading(true);
      setBuscoAlgo(true);
      setCategoriaActiva(categoria);
      setTextoBusqueda("");
      setTituloPersonalizado("");

      const response = await fetch(
        `${API_URL}/api/eventos/categoria/${categoria}`
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || data.error || "Error al filtrar eventos.");
        return;
      }

      setEventos(data.eventos || []);
    } catch (error) {
      console.log("Error al filtrar categoría:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = async () => {
    setTextoBusqueda("");
    setCategoriaActiva("");
    setBuscoAlgo(false);
    setTituloPersonalizado("");
    await obtenerTodosLosEventos();
  };

  const toggleFavorito = async (eventoId: string) => {
    let nuevosFavoritos: string[];

    if (favoritos.includes(eventoId)) {
      nuevosFavoritos = favoritos.filter((id) => id !== eventoId);
    } else {
      nuevosFavoritos = [...favoritos, eventoId];
    }

    setFavoritos(nuevosFavoritos);
    await AsyncStorage.setItem("favoritos", JSON.stringify(nuevosFavoritos));
  };

  const esFavorito = (eventoId: string) => {
    return favoritos.includes(eventoId);
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
        console.log("Error al verificar asistencia:", data);
        router.push(`/event-detail/${eventoId}` as any);
        return;
      }

      const asistencias = data.asistencias || [];

      const yaEstaInteresado = asistencias.some((asistencia: any) => {
        const evento = asistencia.eventoId;

        if (!evento) return false;

        if (typeof evento === "string") {
          return evento === eventoId;
        }

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

  const obtenerNombreCategoriaActiva = () => {
    const interes = interesesDisponibles.find(
      (item) => item.slug === categoriaActiva
    );

    return interes?.nombre || categoriaActiva;
  };

  const obtenerTituloSeccion = () => {
    if (tituloPersonalizado) return tituloPersonalizado;
    if (params.filtro === "promocionados") return "Eventos destacados";
    if (params.filtro === "recomendados") return "Recomendados para vos";
    if (categoriaActiva) return `Eventos de ${obtenerNombreCategoriaActiva()}`;
    if (buscoAlgo) return "Resultados";
    return "Eventos";
  };

  if (loading) {
    return <LoadingScreen text="Cargando búsqueda..." />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Logo size="large" centered={true} showText={false} />

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={18} color="#A7A7B0" />

            <TextInput
              placeholder="Buscar eventos..."
              placeholderTextColor="#A7A7B0"
              style={styles.input}
              value={textoBusqueda}
              onChangeText={buscarEventos}
            />
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            activeOpacity={0.85}
            onPress={limpiarFiltros}
          >
            <SlidersHorizontal size={24} color="#7528F0" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categories}
        >
          <InterestChips
            intereses={interesesDisponibles}
            seleccionado={categoriaActiva}
            onPress={filtrarPorCategoria}
            variant="explore"
          />
        </ScrollView>

        {!buscoAlgo && (
          <EmptyState
            icon={<Search size={54} color="#8B35E8" />}
            title="Todavía no buscaste nada"
            text="Explorá eventos, personas o lugares para encontrar con quién ir."
          />
        )}

        <SectionHeader title="Búsquedas populares" />

        <View style={styles.popularContainer}>
          {busquedasPopulares.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.popularChip}
              activeOpacity={0.85}
              onPress={() => buscarEventos(item)}
            >
              <Search size={14} color="#8B35E8" />
              <Text style={styles.popularText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionHeader
          title={obtenerTituloSeccion()}
          actionText="Limpiar"
          onPress={limpiarFiltros}
        />

        {eventos.length === 0 ? (
          <View style={styles.noResultsCard}>
            <Text style={styles.noResultsTitle}>No encontramos eventos</Text>
            <Text style={styles.noResultsText}>
              Probá buscar otra palabra o elegir otra categoría.
            </Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {eventos.map((evento) => (
              <EventListCard
                key={evento._id}
                evento={evento}
                showHeart
                isFavorite={esFavorito(evento._id)}
                onHeartPress={() => toggleFavorito(evento._id)}
                onPress={() => irADetalle(evento._id)}
              />
            ))}
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
    paddingTop: 62,
    paddingBottom: 130,
  },
  logo: {
    width: 80,
    height: 52,
    alignSelf: "center",
    marginBottom: 28,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  searchBox: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EEF5FF",
    borderWidth: 1,
    borderColor: "#E2E8FF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginRight: 14,
  },
  input: {
    flex: 1,
    marginLeft: 9,
    fontSize: 14,
    color: "#332047",
    outlineStyle: "none" as any,
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D8C8FF",
  },
  categories: {
    marginBottom: 34,
  },
  popularContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
  },
  popularChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0D9F4",
    marginRight: 8,
    marginBottom: 10,
  },
  popularText: {
    marginLeft: 6,
    color: "#8B35E8",
    fontSize: 13,
    fontWeight: "700",
  },
  eventsList: {
    marginBottom: 24,
  },
  noResultsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  noResultsTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#332047",
    marginBottom: 6,
  },
  noResultsText: {
    fontSize: 14,
    color: "#8D8A99",
    lineHeight: 20,
  },
});