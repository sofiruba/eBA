import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { PlusCircle, ArrowLeft } from "lucide-react-native";
import { API_URL } from "../../config/api";
import LoadingScreen from "../../components/LoadingScreen";
import BottomNav from "../../components/BottomNav";
import { invalidateEventCaches } from "../../utils/cache";
import { obtenerUsuarioActualizado } from "../../utils/usuario";

export default function NuevoEventoOrganizador() {
  const [permitido, setPermitido] = useState<boolean | null>(null);
  const [usuarioId, setUsuarioId] = useState("");
  const [usuarioNombre, setUsuarioNombre] = useState("");
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
  }, []);

  const iniciar = async () => {
    const usuario = await obtenerUsuarioActualizado();

    if (!usuario) {
      router.replace("/login" as any);
      return;
    }

    if (!usuario.esOrganizador) {
      setPermitido(false);
      return;
    }

    setUsuarioId(usuario.id || usuario._id || "");
    setUsuarioNombre(usuario.nombre || "eBA");
    setPermitido(true);
  };

  const crearEvento = async () => {
    if (!nombre.trim() || !descripcion.trim() || !categoria.trim() || !fecha.trim()) {
      alert("Completá al menos nombre, descripción, categoría y fecha.");
      return;
    }

    const fechaDate = new Date(fecha);

    if (isNaN(fechaDate.getTime())) {
      alert("La fecha no es válida. Usá el formato AAAA-MM-DD (ej: 2026-08-20).");
      return;
    }

    try {
      setGuardando(true);

      const response = await fetch(`${API_URL}/api/eventos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          descripcion,
          categoria,
          fecha: fechaDate.toISOString(),
          ubicacion: {
            direccion: direccion || undefined,
            ciudad: ciudad || undefined,
            barrio: barrio || undefined,
          },
          imagen: imagen || undefined,
          organizador: usuarioNombre,
          organizadorId: usuarioId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo crear el evento.");
        return;
      }

      invalidateEventCaches();
      alert(
        "¡Listo! Tu evento fue enviado a revisión. Te vamos a avisar cuando un manager lo apruebe o lo rechace."
      );
      router.replace("/mis-eventos" as any);
    } catch (error) {
      console.log("Error al crear evento:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  };

  if (permitido === null) {
    return <LoadingScreen text="Cargando..." />;
  }

  if (permitido === false) {
    return (
      <View style={styles.screen}>
        <View style={styles.container}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#332047" />
          </Pressable>
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
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#332047" />
        </Pressable>

        <View style={styles.headerRow}>
          <PlusCircle size={22} color="#7528F0" />
          <Text style={styles.title}>Crear evento</Text>
        </View>

        <Text style={styles.subtitle}>
          Un manager va a revisar tu evento antes de publicarlo. Te avisamos
          apenas lo apruebe o lo rechace.
        </Text>

        <Text style={styles.label}>Nombre *</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre del evento"
        />

        <Text style={styles.label}>Descripción *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Descripción"
          multiline
        />

        <Text style={styles.label}>Categoría *</Text>
        <TextInput
          style={styles.input}
          value={categoria}
          onChangeText={setCategoria}
          placeholder="Ej: techno, arte, festivales"
        />

        <Text style={styles.label}>Fecha *</Text>
        <TextInput
          style={styles.input}
          value={fecha}
          onChangeText={setFecha}
          placeholder="AAAA-MM-DD (ej: 2026-08-20)"
        />

        <Text style={styles.label}>Dirección</Text>
        <TextInput
          style={styles.input}
          value={direccion}
          onChangeText={setDireccion}
          placeholder="Dirección"
        />

        <Text style={styles.label}>Barrio</Text>
        <TextInput
          style={styles.input}
          value={barrio}
          onChangeText={setBarrio}
          placeholder="Barrio"
        />

        <Text style={styles.label}>Ciudad</Text>
        <TextInput
          style={styles.input}
          value={ciudad}
          onChangeText={setCiudad}
          placeholder="Ciudad"
        />

        <Text style={styles.label}>Imagen (URL)</Text>
        <TextInput
          style={styles.input}
          value={imagen}
          onChangeText={setImagen}
          placeholder="https://..."
        />

        <Pressable
          style={styles.submitButton}
          onPress={crearEvento}
          disabled={guardando}
        >
          <PlusCircle size={18} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>
            {guardando ? "Enviando..." : "Enviar a revisión"}
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8E2F8",
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#332047",
  },
  subtitle: {
    fontSize: 14,
    color: "#8D8A99",
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 22,
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
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 26,
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