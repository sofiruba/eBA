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
  Save,
  Trash2,
  Clock3,
  CheckCircle2,
  XCircle,
} from "lucide-react-native";
import { API_URL } from "../../config/api";
import LoadingScreen from "../../components/LoadingScreen";
import BottomNav from "../../components/BottomNav";
import { Evento } from "../../types/Evento";
import { obtenerImagen, formatearFechaLarga } from "../../utils/eventHelpers";
import { invalidateEventCaches } from "../../utils/cache";
import { obtenerUsuarioActualizado } from "../../utils/usuario";

const ESTADO_CONFIG: Record<
  string,
  { icon: any; color: string; bg: string; label: string }
> = {
  pendiente: {
    icon: Clock3,
    color: "#B7791F",
    bg: "#FFF7E6",
    label: "En revisión por un manager",
  },
  aprobado: {
    icon: CheckCircle2,
    color: "#1E9E5A",
    bg: "#E9FBF1",
    label: "Aprobado y publicado",
  },
  rechazado: {
    icon: XCircle,
    color: "#E53935",
    bg: "#FFF1F2",
    label: "Rechazado",
  },
};

export default function MiEventoDetalle() {
  const { id } = useLocalSearchParams();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("");
  const [fecha, setFecha] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [barrio, setBarrio] = useState("");
  const [imagen, setImagen] = useState("");

  useEffect(() => {
    iniciar();
  }, [id]);

  const iniciar = async () => {
    try {
      const usuario = await obtenerUsuarioActualizado();

      if (!usuario) {
        router.replace("/login" as any);
        return;
      }

      const idUsuario = usuario.id || usuario._id || null;

      if (!usuario.esOrganizador) {
        alert("Esta sección es solo para organizadores.");
        router.replace("/home" as any);
        return;
      }

      setUsuarioId(idUsuario);

      if (!id) return;

      const response = await fetch(`${API_URL}/api/eventos/${id}`);
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo cargar el evento.");
        router.back();
        return;
      }

      const eventoData: Evento = data.evento;

      if (eventoData.organizadorId !== idUsuario) {
        alert("Este evento no te pertenece.");
        router.replace("/mis-eventos" as any);
        return;
      }

      setEvento(eventoData);
      setNombre(eventoData.nombre || "");
      setDescripcion(eventoData.descripcion || "");
      setCategoria(eventoData.categoria || "");
      setFecha(
        eventoData.fecha ? eventoData.fecha.slice(0, 10) : ""
      );
      setDireccion(eventoData.ubicacion?.direccion || "");
      setBarrio(eventoData.ubicacion?.barrio || "");
      setCiudad(eventoData.ubicacion?.ciudad || "");
      setImagen(eventoData.imagen || "");
    } catch (error) {
      console.log("Error al cargar tu evento:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const guardarCambios = async () => {
    if (!evento || !usuarioId) return;

    if (!nombre.trim() || !descripcion.trim() || !categoria.trim() || !fecha.trim()) {
      alert("Completá al menos nombre, descripción, categoría y fecha.");
      return;
    }

    const fechaDate = new Date(fecha);

    if (isNaN(fechaDate.getTime())) {
      alert("La fecha no es válida. Usá el formato AAAA-MM-DD.");
      return;
    }

    try {
      setGuardando(true);

      const response = await fetch(`${API_URL}/api/eventos/${evento._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solicitanteId: usuarioId,
          nombre,
          descripcion,
          categoria,
          fecha: fechaDate.toISOString(),
          ubicacion: {
            direccion,
            barrio,
            ciudad,
          },
          imagen: imagen || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudieron guardar los cambios.");
        return;
      }

      setEvento(data.evento);
      invalidateEventCaches(evento._id);
      alert(
        data.evento.estado === "pendiente"
          ? "Cambios guardados. Como editaste el evento, vuelve a quedar en revisión."
          : "Cambios guardados."
      );
    } catch (error) {
      console.log("Error al guardar tu evento:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarEvento = async () => {
    if (!evento || !usuarioId) return;

    const confirmar = confirm(
      `¿Seguro que querés eliminar "${evento.nombre}"? Esta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
      setGuardando(true);

      const response = await fetch(`${API_URL}/api/eventos/${evento._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solicitanteId: usuarioId }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo eliminar el evento.");
        return;
      }

      invalidateEventCaches(evento._id);
      alert("Evento eliminado correctamente.");
      router.replace("/mis-eventos" as any);
    } catch (error) {
      console.log("Error al eliminar tu evento:", error);
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

  const estadoInfo =
    ESTADO_CONFIG[evento.estado || "pendiente"] || ESTADO_CONFIG.pendiente;
  const EstadoIcon = estadoInfo.icon;

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

          <Pressable
            style={styles.deleteButton}
            onPress={eliminarEvento}
            disabled={guardando}
          >
            <Trash2 size={18} color="#E53935" />
          </Pressable>
        </View>

        <Image
          source={{ uri: obtenerImagen(evento.imagen) }}
          style={styles.imagenPreview}
        />

        <View style={[styles.estadoCard, { backgroundColor: estadoInfo.bg }]}>
          <EstadoIcon size={18} color={estadoInfo.color} />
          <Text style={[styles.estadoTexto, { color: estadoInfo.color }]}>
            {estadoInfo.label}
          </Text>
        </View>

        {evento.estado === "rechazado" && evento.motivoRechazo && (
          <Text style={styles.motivoText}>
            Motivo del rechazo: {evento.motivoRechazo}
          </Text>
        )}

        <Text style={styles.label}>Nombre</Text>
        <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
        />

        <Text style={styles.label}>Categoría</Text>
        <TextInput style={styles.input} value={categoria} onChangeText={setCategoria} />

        <Text style={styles.label}>Fecha</Text>
        <TextInput
          style={styles.input}
          value={fecha}
          onChangeText={setFecha}
          placeholder="AAAA-MM-DD"
        />

        <Text style={styles.label}>Dirección</Text>
        <TextInput style={styles.input} value={direccion} onChangeText={setDireccion} />

        <Text style={styles.label}>Barrio</Text>
        <TextInput style={styles.input} value={barrio} onChangeText={setBarrio} />

        <Text style={styles.label}>Ciudad</Text>
        <TextInput style={styles.input} value={ciudad} onChangeText={setCiudad} />

        <Text style={styles.label}>Imagen (URL)</Text>
        <TextInput style={styles.input} value={imagen} onChangeText={setImagen} />

        <View style={styles.metaRow}>
          <CalendarDays size={14} color="#8D8A99" />
          <Text style={styles.metaText}>{formatearFechaLarga(evento.fecha)}</Text>
        </View>

        <Pressable
          style={styles.submitButton}
          onPress={guardarCambios}
          disabled={guardando}
        >
          <Save size={18} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>
            {guardando ? "Guardando..." : "Guardar cambios"}
          </Text>
        </Pressable>
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
    paddingTop: 58,
    paddingBottom: 150,
  },
  topBar: {
    flexDirection: "row",
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
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF1F2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFD9DC",
  },
  imagenPreview: {
    width: "100%",
    height: 160,
    borderRadius: 18,
    marginBottom: 14,
  },
  estadoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  estadoTexto: {
    fontSize: 13,
    fontWeight: "800",
  },
  motivoText: {
    fontSize: 12,
    color: "#E53935",
    marginBottom: 14,
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
    minHeight: 90,
    textAlignVertical: "top",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
  },
  metaText: {
    fontSize: 12,
    color: "#8D8A99",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 22,
    backgroundColor: "#7528F0",
    paddingVertical: 15,
    borderRadius: 16,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
  },
});