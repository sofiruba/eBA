import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  CheckCircle2,
  XCircle,
  Save,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../../config/api";
import LoadingScreen from "../../components/LoadingScreen";
import { Evento } from "../../types/Evento";
import { obtenerImagen, formatearFechaLarga } from "../../utils/eventHelpers";
import { invalidateEventCaches } from "../../utils/cache";

export default function ManagerEventoDetalle() {
  const { id } = useLocalSearchParams();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [managerId, setManagerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [mostrarRechazo, setMostrarRechazo] = useState(false);

  // Campos editables
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");

  useEffect(() => {
    iniciar();
  }, [id]);

  const iniciar = async () => {
    try {
      const usuarioGuardado = await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado) {
        router.replace("/login" as any);
        return;
      }

      const usuario = JSON.parse(usuarioGuardado);

      if (!usuario.esManager) {
        alert("Esta sección es solo para managers.");
        router.replace("/home" as any);
        return;
      }

      setManagerId(usuario.id || usuario._id || null);

      if (!id) return;

      const response = await fetch(`${API_URL}/api/eventos/${id}`);
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo cargar el evento.");
        router.back();
        return;
      }

      const eventoData: Evento = data.evento;
      setEvento(eventoData);
      setNombre(eventoData.nombre || "");
      setDescripcion(eventoData.descripcion || "");
      setCategoria(eventoData.categoria || "");
      setDireccion(eventoData.ubicacion?.direccion || "");
      setCiudad(eventoData.ubicacion?.ciudad || "");
    } catch (error) {
      console.log("Error al cargar evento (manager):", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const guardarCambios = async () => {
    if (!evento) return;

    try {
      setGuardando(true);

      const response = await fetch(`${API_URL}/api/eventos/${evento._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          descripcion,
          categoria,
          ubicacion: {
            ...evento.ubicacion,
            direccion,
            ciudad,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudieron guardar los cambios.");
        return;
      }

      setEvento(data.evento);
      invalidateEventCaches(evento._id);
      alert("Cambios guardados.");
    } catch (error) {
      console.log("Error al guardar evento (manager):", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (
    estado: "aprobado" | "rechazado",
    motivo?: string
  ) => {
    if (!evento) return;

    try {
      setGuardando(true);

      const response = await fetch(
        `${API_URL}/api/eventos/${evento._id}/estado`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            estado,
            motivoRechazo: motivo,
            managerId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo actualizar el estado.");
        return;
      }

      setEvento(data.evento);
      setMostrarRechazo(false);
      invalidateEventCaches(evento._id);
    } catch (error) {
      console.log("Error al verificar evento:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return <LoadingScreen text="Cargando evento..." />;
  }

  if (!evento) {
    return <LoadingScreen text="Evento no encontrado..." />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#332047" />
          </Pressable>

          <View style={[styles.pill, estiloPill(evento.estado)]}>
            <Text style={[styles.pillText, estiloPillText(evento.estado)]}>
              {estadoLabel(evento.estado)}
            </Text>
          </View>
        </View>

        <Image
          source={{ uri: obtenerImagen(evento.imagen) }}
          style={styles.image}
        />

        <View style={styles.infoRow}>
          <CalendarDays size={14} color="#7528F0" />
          <Text style={styles.infoText}>
            {formatearFechaLarga(evento.fecha)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MapPin size={14} color="#7528F0" />
          <Text style={styles.infoText}>
            {evento.ubicacion?.direccion || "Dirección a confirmar"}
            {evento.ubicacion?.ciudad ? `, ${evento.ubicacion.ciudad}` : ""}
          </Text>
        </View>

        {evento.organizador && (
          <Text style={styles.organizador}>
            Organiza: {evento.organizador}
          </Text>
        )}

        <Text style={styles.sectionTitle}>Editar evento</Text>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre del evento"
        />

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Descripción"
          multiline
        />

        <Text style={styles.label}>Categoría</Text>
        <TextInput
          style={styles.input}
          value={categoria}
          onChangeText={setCategoria}
          placeholder="Categoría"
        />

        <Text style={styles.label}>Dirección</Text>
        <TextInput
          style={styles.input}
          value={direccion}
          onChangeText={setDireccion}
          placeholder="Dirección"
        />

        <Text style={styles.label}>Ciudad</Text>
        <TextInput
          style={styles.input}
          value={ciudad}
          onChangeText={setCiudad}
          placeholder="Ciudad"
        />

        <Pressable
          style={styles.saveButton}
          onPress={guardarCambios}
          disabled={guardando}
        >
          <Save size={16} color="#7528F0" />
          <Text style={styles.saveButtonText}>Guardar cambios</Text>
        </Pressable>

        {evento.estado === "rechazado" && evento.motivoRechazo ? (
          <View style={styles.motivoBox}>
            <Text style={styles.motivoTitle}>Motivo del rechazo</Text>
            <Text style={styles.motivoText}>{evento.motivoRechazo}</Text>
          </View>
        ) : null}

        {mostrarRechazo && (
          <View style={styles.motivoBox}>
            <Text style={styles.label}>Motivo del rechazo</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={motivoRechazo}
              onChangeText={setMotivoRechazo}
              placeholder="Contale al organizador por qué se rechaza"
              multiline
            />
          </View>
        )}

        <Text style={styles.sectionTitle}>Verificación</Text>

        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => cambiarEstado("aprobado")}
            disabled={guardando}
          >
            <CheckCircle2 size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Aprobar</Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => {
              if (!mostrarRechazo) {
                setMostrarRechazo(true);
                return;
              }
              cambiarEstado("rechazado", motivoRechazo);
            }}
            disabled={guardando}
          >
            <XCircle size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {mostrarRechazo ? "Confirmar rechazo" : "Rechazar"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const estadoLabel = (estado?: string) => {
  if (estado === "aprobado") return "Aprobado";
  if (estado === "rechazado") return "Rechazado";
  return "Pendiente";
};

const estiloPill = (estado?: string) => {
  if (estado === "aprobado") return { backgroundColor: "#ECFDF3" };
  if (estado === "rechazado") return { backgroundColor: "#FFF1F2" };
  return { backgroundColor: "#FFF7E6" };
};

const estiloPillText = (estado?: string) => {
  if (estado === "aprobado") return { color: "#12A150" };
  if (estado === "rechazado") return { color: "#E53935" };
  return { color: "#B7791F" };
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F5FF",
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 60,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8E2F8",
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "900",
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 20,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#8D8A99",
  },
  organizador: {
    fontSize: 13,
    color: "#332047",
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#332047",
    marginTop: 22,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8D8A99",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#2D2934",
    borderWidth: 1,
    borderColor: "#E8E2F8",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
    backgroundColor: "#F1ECFF",
    paddingVertical: 13,
    borderRadius: 16,
  },
  saveButtonText: {
    color: "#7528F0",
    fontWeight: "900",
    fontSize: 14,
  },
  motivoBox: {
    marginTop: 16,
    backgroundColor: "#FFF1F2",
    borderRadius: 16,
    padding: 14,
  },
  motivoTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#E53935",
    marginBottom: 4,
  },
  motivoText: {
    fontSize: 13,
    color: "#7A2E2E",
    lineHeight: 19,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
  },
  approveButton: {
    backgroundColor: "#12A150",
  },
  rejectButton: {
    backgroundColor: "#E53935",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
  },
});