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
import { ArrowLeft, Plus, UserRound, CheckCircle } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../../config/api";
import LoadingScreen from "../../components/LoadingScreen";
import EmptyState from "../../components/EmptyState";
import UserAvatar from "../../components/UserAvatar";
import SectionHeader from "../../components/SectionHeader";

import { Evento } from "../../types/Evento";
import { Usuario } from "../../types/Usuario";
import {
  obtenerImagen,
  formatearFechaLarga,
} from "../../utils/eventHelpers";

type Asistencia = {
  _id: string;
  usuarioId: Usuario;
  eventoId: string;
  estado: string;
};

type Conexion = {
  _id: string;
  usuario1: Usuario;
  usuario2: Usuario;
};

export default function EventPeopleScreen() {
  const { id } = useLocalSearchParams();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [conexionesIds, setConexionesIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuarioActualId, setUsuarioActualId] = useState<string | null>(null);
  const [tabActiva, setTabActiva] = useState<
    "personas" | "publicaciones" | "info"
  >("personas");

  useEffect(() => {
    iniciarPantalla();
  }, [id]);

  const iniciarPantalla = async () => {
    try {
      const usuarioGuardado = await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado) {
        router.replace("/login" as any);
        return;
      }

      const usuario = JSON.parse(usuarioGuardado);
      const idUsuario = usuario.id || usuario._id;

      setUsuarioActualId(idUsuario);

      if (!id) {
        alert("No se encontró el evento.");
        return;
      }

      const responseEvento = await fetch(`${API_URL}/api/eventos/${id}`);
      const dataEvento = await responseEvento.json();

      if (!responseEvento.ok) {
        alert(dataEvento.message || dataEvento.error || "Error al traer evento.");
        return;
      }

      setEvento(dataEvento.evento || dataEvento);

      const responseAsistencias = await fetch(
        `${API_URL}/api/asistencias/evento/${id}`
      );

      const dataAsistencias = await responseAsistencias.json();

      if (!responseAsistencias.ok) {
        alert(
          dataAsistencias.message ||
            dataAsistencias.error ||
            "Error al traer personas interesadas."
        );
        return;
      }

      setAsistencias(dataAsistencias.asistencias || []);

      const responseConexiones = await fetch(
        `${API_URL}/api/conexiones/usuario/${idUsuario}`
      );

      const dataConexiones = await responseConexiones.json();

      if (responseConexiones.ok) {
        const idsAmigos = (dataConexiones || []).map((conexion: Conexion) => {
          const usuario1Id = conexion.usuario1?._id || conexion.usuario1?.id;
          const usuario2Id = conexion.usuario2?._id || conexion.usuario2?.id;

          if (usuario1Id === idUsuario) {
            return usuario2Id;
          }

          return usuario1Id;
        });

        setConexionesIds(idsAmigos.filter(Boolean));
      }
    } catch (error) {
      console.log("Error en pantalla de personas:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const enviarSolicitudConexion = async (usuarioReceptorId?: string) => {
    try {
      const usuarioGuardado = await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado) {
        router.replace("/login" as any);
        return;
      }

      const usuario = JSON.parse(usuarioGuardado);
      const usuarioSolicitanteId = usuario.id || usuario._id;

      if (!usuarioSolicitanteId || !usuarioReceptorId) {
        alert("No se pudo identificar a los usuarios.");
        return;
      }

      if (usuarioSolicitanteId === usuarioReceptorId) {
        alert("No podés conectarte con vos mismo.");
        return;
      }

      const response = await fetch(`${API_URL}/api/solicitudes-conexion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuariosolicitante: usuarioSolicitanteId,
          usuarioreceptor: usuarioReceptorId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.mensaje || "No se pudo enviar la solicitud.");
        return;
      }

      alert("Solicitud enviada correctamente.");
    } catch (error) {
      console.log("Error al enviar solicitud:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  const obtenerInicial = (nombre?: string) => {
    if (!nombre) return "U";
    return nombre.charAt(0).toUpperCase();
  };

  const obtenerUsuarioId = (usuario?: Usuario) => {
    return usuario?._id || usuario?.id;
  };

  const esAmigo = (usuarioId?: string) => {
    if (!usuarioId) return false;
    return conexionesIds.includes(usuarioId);
  };

  const obtenerUbicacionEvento = () => {
    if (!evento?.ubicacion) return "Ubicación a confirmar";

    if (evento.ubicacion.barrio) return evento.ubicacion.barrio;
    if (evento.ubicacion.ciudad) return evento.ubicacion.ciudad;
    if (evento.ubicacion.direccion) return evento.ubicacion.direccion;

    return "Ubicación a confirmar";
  };

  const asistenciasFiltradas = asistencias.filter((asistencia) => {
    const idUsuario = obtenerUsuarioId(asistencia.usuarioId);
    return idUsuario !== usuarioActualId;
  });

  if (loading) {
    return <LoadingScreen text="Cargando personas..." />;
  }

  if (!evento) {
    return (
      <EmptyState
        title="No se encontró el evento"
        text="Volvé e intentá entrar nuevamente."
        buttonText="Volver"
        onPress={() => router.back()}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#332047" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Image
            source={{ uri: obtenerImagen(evento.imagen) }}
            style={styles.eventImage}
          />

          <View style={styles.headerInfo}>
            <Text style={styles.eventTitle}>{evento.nombre}</Text>
            <Text style={styles.eventDate}>{formatearFechaLarga(evento.fecha)}</Text>
            <Text style={styles.eventLocation}>{obtenerUbicacionEvento()}</Text>

            <View style={styles.avatarRow}>
              {asistenciasFiltradas.slice(0, 3).map((asistencia, index) => (
                <View
                  key={asistencia._id}
                  style={[styles.smallAvatar, index > 0 && styles.avatarOverlap]}
                >
                  <Text style={styles.smallAvatarText}>
                    {obtenerInicial(asistencia.usuarioId?.nombre)}
                  </Text>
                </View>
              ))}

              <View style={styles.plusCircle}>
                <Plus size={13} color="#FFFFFF" />
              </View>

              <Text style={styles.moreText}>+{asistenciasFiltradas.length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabsCard}>
          <TouchableOpacity
            style={[styles.tab, tabActiva === "personas" && styles.tabActive]}
            onPress={() => setTabActiva("personas")}
          >
            <Text
              style={[
                styles.tabText,
                tabActiva === "personas" && styles.tabTextActive,
              ]}
            >
              Personas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, tabActiva === "publicaciones" && styles.tabActive]}
            onPress={() => setTabActiva("publicaciones")}
          >
            <Text
              style={[
                styles.tabText,
                tabActiva === "publicaciones" && styles.tabTextActive,
              ]}
            >
              Publicaciones
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, tabActiva === "info" && styles.tabActive]}
            onPress={() => setTabActiva("info")}
          >
            <Text
              style={[styles.tabText, tabActiva === "info" && styles.tabTextActive]}
            >
              Info
            </Text>
          </TouchableOpacity>
        </View>

        {tabActiva === "personas" && (
          <View style={styles.peopleList}>
            {asistenciasFiltradas.length === 0 ? (
              <EmptyState
                title="Todavía no hay otros interesados"
                text="Cuando otras personas toquen “Quiero ir”, van a aparecer en esta lista."
              />
            ) : (
              asistenciasFiltradas.map((asistencia) => {
                const usuario = asistencia.usuarioId;
                const receptorId = obtenerUsuarioId(usuario);
                const yaEsAmigo = esAmigo(receptorId);

                return (
                  <View key={asistencia._id} style={styles.personCard}>
                    <UserAvatar usuario={usuario} size={42} />

                    <View style={styles.personInfo}>
                      <Text style={styles.personName}>
                        {usuario?.nombre || "Usuario"}
                      </Text>

                      <Text style={styles.personSubtitle}>
                        {usuario?.email || "Sin email disponible"}
                      </Text>

                      <Text
                        style={[
                          styles.statusText,
                          yaEsAmigo && styles.friendStatusText,
                        ]}
                      >
                        {yaEsAmigo ? "Ya son conexión" : "Estado: interesado"}
                      </Text>
                    </View>

                    {yaEsAmigo ? (
                      <View style={styles.friendButton}>
                        <CheckCircle size={22} color="#12A150" />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.connectButton}
                        activeOpacity={0.85}
                        onPress={() => enviarSolicitudConexion(receptorId)}
                      >
                        <UserRound size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {tabActiva === "publicaciones" && (
          <EmptyState
            title="Todavía no hay publicaciones"
            text="En el próximo sprint se van a poder ver publicaciones y comentarios relacionados a este evento."
          />
        )}

        {tabActiva === "info" && (
          <View style={styles.infoCard}>
            <SectionHeader title="Información del evento" />

            <Text style={styles.infoLabel}>Descripción</Text>
            <Text style={styles.infoText}>
              {evento.descripcion || "Sin descripción cargada."}
            </Text>

            <Text style={styles.infoLabel}>Categoría</Text>
            <Text style={styles.infoText}>{evento.categoria || "Evento"}</Text>

            <Text style={styles.infoLabel}>Organizador</Text>
            <Text style={styles.infoText}>{evento.organizador || "eBA"}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F5FF",
  },
  container: {
    paddingHorizontal: 26,
    paddingTop: 58,
    paddingBottom: 60,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  header: {
    flexDirection: "row",
    marginBottom: 28,
  },
  eventImage: {
    width: 98,
    height: 78,
    borderRadius: 12,
    marginRight: 18,
  },
  headerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  eventTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#2D2934",
    marginBottom: 6,
  },
  eventDate: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2D2934",
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 13,
    color: "#6F6D7A",
    marginBottom: 10,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  smallAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#8B35E8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  smallAvatarText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  plusCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#8B35E8",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  moreText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#2D2934",
    fontWeight: "700",
  },
  tabsCard: {
    height: 46,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    padding: 4,
    marginBottom: 28,
  },
  tab: {
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: "#8B35E8",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2D2934",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  peopleList: {
    paddingBottom: 20,
  },
  personCard: {
    minHeight: 72,
    borderRadius: 34,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 14,
    fontWeight: "900",
    color: "#2D2934",
    marginBottom: 3,
  },
  personSubtitle: {
    fontSize: 12,
    color: "#8D8A99",
    marginBottom: 3,
  },
  statusText: {
    fontSize: 11,
    color: "#7528F0",
    fontWeight: "700",
  },
  friendStatusText: {
    color: "#12A150",
  },
  connectButton: {
    width: 54,
    height: 38,
    borderRadius: 20,
    backgroundColor: "#B484F2",
    alignItems: "center",
    justifyContent: "center",
  },
  friendButton: {
    width: 54,
    height: 38,
    borderRadius: 20,
    backgroundColor: "#ECFDF3",
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: "#7528F0",
    marginTop: 10,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#6F6D7A",
    lineHeight: 21,
  },
});