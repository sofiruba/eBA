import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  Clock,
  Check,
  X,
  Users,
  MessageCircle,
  ShieldOff,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../config/api";
import BottomNav from "../components/BottomNav";
import Logo from "../components/Logo";
import LoadingScreen from "../components/LoadingScreen";
import EmptyState from "../components/EmptyState";
import ProfileAvatarLink from "../components/ProfileAvatarLink";
import SectionHeader from "../components/SectionHeader";
import useAutoRefresh from "../hooks/useAutoRefresh";
import { invalidateSocialCaches } from "../utils/cache";

import { Usuario } from "../types/Usuario";

type Conexion = {
  _id: string;
  usuario1: Usuario;
  usuario2: Usuario;
};

type Solicitud = {
  _id: string;
  usuariosolicitante: Usuario;
  usuarioreceptor: Usuario;
  estado: string;
};

type Bloqueo = {
  bloqueadoId: Usuario | string;
};

type SugerenciaConexion = {
  usuario: Usuario;
  conexionesEnComun: number;
};

export default function ConnectionsScreen() {
  const [usuarioActualId, setUsuarioActualId] = useState<string | null>(null);
  const [conexiones, setConexiones] = useState<Conexion[]>([]);
  const [solicitudesRecibidas, setSolicitudesRecibidas] = useState<Solicitud[]>([]);
  const [solicitudesEnviadas, setSolicitudesEnviadas] = useState<Solicitud[]>([]);
  const [sugerencias, setSugerencias] = useState<SugerenciaConexion[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarTodasConexiones, setMostrarTodasConexiones] = useState(false);
  const [mostrarTodasSugerencias, setMostrarTodasSugerencias] = useState(false);

  const conexionesVisibles = mostrarTodasConexiones
    ? conexiones
    : conexiones.slice(0, 3);
  const sugerenciasVisibles = mostrarTodasSugerencias
    ? sugerencias
    : sugerencias.slice(0, 3);

  useFocusEffect(
  useCallback(() => {
    cargarDatos();
  }, [])
);

  const cargarDatos = async (silencioso = false) => {
    try {
      if (!silencioso) {
        setLoading(true);
      }

      const usuarioGuardado = await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado) {
        router.replace("/login" as any);
        return;
      }

      const usuario = JSON.parse(usuarioGuardado);
      const idUsuario = usuario.id || usuario._id;

      if (!idUsuario) {
        alert("No se encontró el usuario logueado.");
        router.replace("/login" as any);
        return;
      }

      setUsuarioActualId(idUsuario);

      try {
        const responseResumen = await fetch(
          `${API_URL}/api/conexiones/resumen/${idUsuario}`
        );
        const dataResumen = await responseResumen.json();

        if (responseResumen.ok) {
          const idsBloqueados = (dataResumen.bloqueos || [])
            .map((bloqueo: Bloqueo) => obtenerIdUsuario(bloqueo.bloqueadoId))
            .filter(Boolean) as string[];
          const conexionesObtenidas = Array.isArray(dataResumen.conexiones)
            ? dataResumen.conexiones
            : [];
          const solicitudesFiltradas = (dataResumen.solicitudes || []).filter(
            (solicitud: Solicitud) => {
              const solicitanteId = obtenerIdUsuario(solicitud.usuariosolicitante);
              const receptorId = obtenerIdUsuario(solicitud.usuarioreceptor);
              const otroId =
                solicitanteId === idUsuario ? receptorId : solicitanteId;

              return !otroId || !idsBloqueados.includes(otroId);
            }
          );

          setConexiones(
            conexionesObtenidas.filter((conexion: Conexion) => {
              const otroId = obtenerIdUsuario(
                obtenerOtroUsuarioDesdeId(conexion, idUsuario)
              );
              return !otroId || !idsBloqueados.includes(otroId);
            })
          );
          setSolicitudesRecibidas(
            solicitudesFiltradas.filter(
              (solicitud: Solicitud) =>
                obtenerIdUsuario(solicitud.usuarioreceptor) === idUsuario
            )
          );
          setSolicitudesEnviadas(
            solicitudesFiltradas.filter(
              (solicitud: Solicitud) =>
                obtenerIdUsuario(solicitud.usuariosolicitante) === idUsuario
            )
          );
          setSugerencias(dataResumen.sugerencias || []);
          return;
        }
      } catch (errorResumen) {
        console.log("Error usando resumen de conexiones:", errorResumen);
      }

      const [responseConexiones, responseSugerencias, responseBloqueos] =
        await Promise.all([
        fetch(`${API_URL}/api/conexiones/usuario/${idUsuario}`),
        fetch(`${API_URL}/api/conexiones/sugerencias/${idUsuario}`),
        fetch(`${API_URL}/api/bloqueos/usuario/${idUsuario}`),
      ]);

      let idsBloqueados: string[] = [];

      if (responseBloqueos.ok) {
        const dataBloqueos = await responseBloqueos.json();
        idsBloqueados = (dataBloqueos.bloqueos || [])
          .map((bloqueo: Bloqueo) => obtenerIdUsuario(bloqueo.bloqueadoId))
          .filter(Boolean) as string[];
      }

      const dataConexiones = await responseConexiones.json();

      if (!responseConexiones.ok) {
        setConexiones([]);
      } else {
        const conexionesObtenidas = Array.isArray(dataConexiones)
          ? dataConexiones
          : [];

        setConexiones(
          conexionesObtenidas.filter((conexion: Conexion) => {
            const otroId = obtenerIdUsuario(
              obtenerOtroUsuarioDesdeId(conexion, idUsuario)
            );
            return !otroId || !idsBloqueados.includes(otroId);
          })
        );
      }

      const responseSolicitudes = await fetch(
        `${API_URL}/api/solicitudes-conexion/pendientes/${idUsuario}`
      );

      const dataSolicitudes = await responseSolicitudes.json();

      if (!responseSolicitudes.ok) {
        setSolicitudesRecibidas([]);
        setSolicitudesEnviadas([]);
      } else {
        const solicitudesFiltradas = (dataSolicitudes.solicitudes || []).filter(
          (solicitud: Solicitud) => {
            const solicitanteId = obtenerIdUsuario(solicitud.usuariosolicitante);
            const receptorId = obtenerIdUsuario(solicitud.usuarioreceptor);
            const otroId =
              solicitanteId === idUsuario ? receptorId : solicitanteId;

            return !otroId || !idsBloqueados.includes(otroId);
          }
        );

        setSolicitudesRecibidas(
          solicitudesFiltradas.filter(
            (solicitud: Solicitud) =>
              obtenerIdUsuario(solicitud.usuarioreceptor) === idUsuario
          )
        );

        setSolicitudesEnviadas(
          solicitudesFiltradas.filter(
            (solicitud: Solicitud) =>
              obtenerIdUsuario(solicitud.usuariosolicitante) === idUsuario
          )
        );
      }

      if (responseSugerencias.ok) {
        const dataSugerencias = await responseSugerencias.json();
        setSugerencias(dataSugerencias.sugerencias || []);
      } else {
        setSugerencias([]);
      }
    } catch (error) {
      console.log("Error al cargar conexiones:", error);
      if (!silencioso) {
        alert("No se pudo conectar con el servidor.");
      }
    } finally {
      if (!silencioso) {
        setLoading(false);
      }
    }
  };

  useAutoRefresh(
    useCallback(() => cargarDatos(true), []),
    60000,
    !loading
  );

  const aceptarSolicitud = async (solicitudId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/solicitudes-conexion/${solicitudId}/aceptar`,
        {
          method: "PUT",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.mensaje || "No se pudo aceptar la solicitud.");
        return;
      }

      invalidateSocialCaches(usuarioActualId);
      await cargarDatos();
    } catch (error) {
      console.log("Error al aceptar solicitud:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  const rechazarSolicitud = async (solicitudId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/solicitudes-conexion/${solicitudId}/rechazar`,
        {
          method: "PUT",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.mensaje || "No se pudo rechazar la solicitud.");
        return;
      }

      invalidateSocialCaches(usuarioActualId);
      await cargarDatos();
    } catch (error) {
      console.log("Error al rechazar solicitud:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  const enviarSolicitudSugerida = async (usuarioReceptorId?: string) => {
    try {
      if (!usuarioActualId || !usuarioReceptorId) return;

      const response = await fetch(`${API_URL}/api/solicitudes-conexion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuariosolicitante: usuarioActualId,
          usuarioreceptor: usuarioReceptorId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.mensaje || "No se pudo enviar la solicitud.");
        return;
      }

      invalidateSocialCaches(usuarioActualId);
      await cargarDatos(true);
    } catch (error) {
      console.log("Error enviando solicitud sugerida:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  const cancelarSolicitud = async (solicitudId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/solicitudes-conexion/${solicitudId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.mensaje || "No se pudo cancelar la solicitud.");
        return;
      }

      invalidateSocialCaches(usuarioActualId);
      await cargarDatos(true);
    } catch (error) {
      console.log("Error cancelando solicitud:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  const abrirChat = async (conexion: Conexion) => {
    try {
      if (!usuarioActualId) return;

      const usuarioConexion = obtenerOtroUsuario(conexion);
      const usuarioConexionId = obtenerIdUsuario(usuarioConexion);

      if (!usuarioConexionId) {
        alert("No se pudo identificar la conexión.");
        return;
      }

      const responseExistente = await fetch(
        `${API_URL}/api/chats/entre/${usuarioActualId}/${usuarioConexionId}`
      );

      if (responseExistente.ok) {
        const dataExistente = await responseExistente.json();
        router.push(`/chat/${dataExistente.chat._id}` as any);
        return;
      }

      const response = await fetch(`${API_URL}/api/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conexionId: conexion._id,
          participantes: [usuarioActualId, usuarioConexionId],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo abrir el chat.");
        return;
      }

      router.push(`/chat/${data.chat._id}` as any);
    } catch (error) {
      console.log("Error al abrir chat:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  const bloquearConexion = async (conexion: Conexion) => {
    try {
      if (!usuarioActualId) return;

      const usuarioConexion = obtenerOtroUsuario(conexion);
      const usuarioConexionId = obtenerIdUsuario(usuarioConexion);

      if (!usuarioConexionId) {
        alert("No se pudo identificar la conexión.");
        return;
      }

      const response = await fetch(`${API_URL}/api/bloqueos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bloqueadorId: usuarioActualId,
          bloqueadoId: usuarioConexionId,
          motivo: "Bloqueado desde conexiones",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo bloquear al usuario.");
        return;
      }

      invalidateSocialCaches(usuarioActualId);
      await cargarDatos(true);
    } catch (error) {
      console.log("Error bloqueando conexión:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  const obtenerIdUsuario = (usuario?: Usuario | string | null) => {
    if (!usuario) return null;
    if (typeof usuario === "string") return usuario;
    return usuario._id || usuario.id || null;
  };

  const obtenerOtroUsuarioDesdeId = (conexion: Conexion, idUsuario: string) => {
    const usuario1Id = obtenerIdUsuario(conexion.usuario1);

    if (usuario1Id === idUsuario) {
      return conexion.usuario2;
    }

    return conexion.usuario1;
  };

  const obtenerOtroUsuario = (conexion: Conexion) => {
    if (!usuarioActualId) return conexion.usuario1;
    return obtenerOtroUsuarioDesdeId(conexion, usuarioActualId);
  };

  const obtenerUbicacion = (usuario?: Usuario) => {
    const ubicacion = usuario?.ubicacionAproximada as
      | string
      | { ciudad?: string }
      | undefined;

    if (!ubicacion) return "Ubicación no cargada";
    if (typeof ubicacion === "string") return ubicacion || "";

    return ubicacion.ciudad || "Ubicación no cargada";
  };

  const obtenerIntereses = (usuario?: Usuario) => {
    if (usuario?.intereses && usuario.intereses.length > 0) {
      return usuario.intereses.slice(0, 2);
    }

    return ["eventos"];
  };

  if (loading) {
    return <LoadingScreen text="Cargando conexiones..." />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <Logo size="medium" centered={false} />

        <Text style={styles.title}>Conexiones</Text>

        <Text style={styles.subtitle}>
          Personas con las que conectaste para compartir eventos.
        </Text>

        <TouchableOpacity
          style={styles.chatsShortcut}
          activeOpacity={0.85}
          onPress={() => router.push("/chats" as any)}
        >
          <MessageCircle size={19} color="#7528F0" />
          <Text style={styles.chatsShortcutText}>Ver chats</Text>
        </TouchableOpacity>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{conexiones.length}</Text>
            <Text style={styles.summaryLabel}>Conectadas</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {solicitudesRecibidas.length}
            </Text>
            <Text style={styles.summaryLabel}>Recibidas</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {conexiones.length +
                solicitudesRecibidas.length +
                solicitudesEnviadas.length}
            </Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
        </View>

        <SectionHeader title="Solicitudes recibidas" />

        {solicitudesRecibidas.length === 0 ? (
          <View style={styles.emptyMiniCard}>
            <Clock size={22} color="#8B35E8" />
            <Text style={styles.emptyMiniText}>
              No tenés solicitudes pendientes.
            </Text>
          </View>
        ) : (
          solicitudesRecibidas.map((solicitud) => {
            const usuarioSolicitante = solicitud.usuariosolicitante;

            return (
              <View key={solicitud._id} style={styles.requestCard}>
                <ProfileAvatarLink usuario={usuarioSolicitante} size={54} />

                <View style={styles.userInfo}>
                  <Text style={styles.name}>
                    {usuarioSolicitante?.nombre || "Usuario"}
                  </Text>

                  <Text style={styles.detail}>
                    {obtenerUbicacion(usuarioSolicitante)}
                  </Text>

                  <Text style={styles.eventText}>Quiere conectar con vos</Text>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    activeOpacity={0.85}
                    onPress={() => aceptarSolicitud(solicitud._id)}
                  >
                    <Check size={19} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rejectButton}
                    activeOpacity={0.85}
                    onPress={() => rechazarSolicitud(solicitud._id)}
                  >
                    <X size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <SectionHeader title="Solicitudes enviadas" />

        {solicitudesEnviadas.length === 0 ? (
          <View style={styles.emptyMiniCard}>
            <Send size={22} color="#8B35E8" />
            <Text style={styles.emptyMiniText}>
              Las solicitudes que mandes van a aparecer acá.
            </Text>
          </View>
        ) : (
          solicitudesEnviadas.map((solicitud) => {
            const usuarioReceptor = solicitud.usuarioreceptor;

            return (
              <View key={solicitud._id} style={styles.requestCard}>
                <ProfileAvatarLink usuario={usuarioReceptor} size={54} />

                <View style={styles.userInfo}>
                  <Text style={styles.name}>
                    {usuarioReceptor?.nombre || "Usuario"}
                  </Text>

                  <Text style={styles.detail}>
                    {obtenerUbicacion(usuarioReceptor)}
                  </Text>

                  <Text style={styles.eventText}>
                    Solicitud enviada, esperando respuesta
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.cancelRequestButton}
                  activeOpacity={0.85}
                  onPress={() => cancelarSolicitud(solicitud._id)}
                >
                  <X size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            );
          })
        )}

        <View style={styles.sectionHeaderRow}>
          <SectionHeader title={`Mis conexiones (${conexiones.length})`} />
        </View>

        {conexiones.length === 0 ? (
          <EmptyState
            icon={<Users size={48} color="#B484F2" />}
            title="Todavía no tenés conexiones"
            text="Cuando aceptes solicitudes o conectes con personas sugeridas, van a aparecer acá."
          />
        ) : (
          <>
          {conexionesVisibles.map((conexion) => {
            const usuarioConexion = obtenerOtroUsuario(conexion);
            const intereses = obtenerIntereses(usuarioConexion);

            return (
              <View key={conexion._id} style={styles.connectionCard}>
                <ProfileAvatarLink usuario={usuarioConexion} size={54} />

                <View style={styles.userInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>
                      {usuarioConexion?.nombre || "Usuario"}
                    </Text>

                    <View style={styles.statusAccepted}>
                      <Text style={styles.statusAcceptedText}>Activa</Text>
                    </View>
                  </View>

                  <Text style={styles.detail}>
                    {obtenerUbicacion(usuarioConexion)}
                  </Text>

                  <View style={styles.chipsRow}>
                    {intereses.map((interes) => (
                      <View key={interes} style={styles.chip}>
                        <Text style={styles.chipText}>{interes}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.messageButton}
                  activeOpacity={0.85}
                  onPress={() => abrirChat(conexion)}
                >
                  <MessageCircle size={20} color="#7528F0" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.blockSmallButton}
                  activeOpacity={0.85}
                  onPress={() => bloquearConexion(conexion)}
                >
                  <ShieldOff size={18} color="#E53935" />
                </TouchableOpacity>
              </View>
            );
          })}

          {conexiones.length > 3 && (
            <TouchableOpacity
              style={styles.expandButton}
              activeOpacity={0.85}
              onPress={() => setMostrarTodasConexiones((prev) => !prev)}
            >
              <Text style={styles.expandButtonText}>
                {mostrarTodasConexiones
                  ? "Ver menos"
                  : `Ver ${conexiones.length - 3} más`}
              </Text>
              {mostrarTodasConexiones ? (
                <ChevronUp size={18} color="#7528F0" />
              ) : (
                <ChevronDown size={18} color="#7528F0" />
              )}
            </TouchableOpacity>
          )}
          </>
        )}

        <SectionHeader title="Sugerencias para vos" />

        {sugerencias.length === 0 ? (
          <View style={styles.emptyMiniCard}>
            <Users size={22} color="#8B35E8" />
            <Text style={styles.emptyMiniText}>
              No encontramos sugerencias nuevas por ahora.
            </Text>
          </View>
        ) : (
          <>
          {sugerenciasVisibles.map((sugerencia) => {
            const usuarioSugerido = sugerencia.usuario;
            const usuarioSugeridoId = obtenerIdUsuario(usuarioSugerido);

            return (
              <View key={usuarioSugeridoId} style={styles.connectionCard}>
                <ProfileAvatarLink usuario={usuarioSugerido} size={54} />

                <View style={styles.userInfo}>
                  <Text style={styles.name}>
                    {usuarioSugerido?.nombre || "Usuario"}
                  </Text>

                  <Text style={styles.detail}>
                    {obtenerUbicacion(usuarioSugerido)}
                  </Text>

                  <Text style={styles.eventText}>
                    {sugerencia.conexionesEnComun}{" "}
                    {sugerencia.conexionesEnComun === 1
                      ? "conexión en común"
                      : "conexiones en común"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.acceptButton}
                  activeOpacity={0.85}
                  onPress={() => enviarSolicitudSugerida(usuarioSugeridoId || undefined)}
                >
                  <Check size={19} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            );
          })}

          {sugerencias.length > 3 && (
            <TouchableOpacity
              style={styles.expandButton}
              activeOpacity={0.85}
              onPress={() => setMostrarTodasSugerencias((prev) => !prev)}
            >
              <Text style={styles.expandButtonText}>
                {mostrarTodasSugerencias
                  ? "Ver menos"
                  : `Ver ${sugerencias.length - 3} más`}
              </Text>
              {mostrarTodasSugerencias ? (
                <ChevronUp size={18} color="#7528F0" />
              ) : (
                <ChevronDown size={18} color="#7528F0" />
              )}
            </TouchableOpacity>
          )}
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
    marginBottom: 14,
  },
  chatsShortcut: {
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0D9F4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  chatsShortcutText: {
    marginLeft: 8,
    color: "#7528F0",
    fontSize: 14,
    fontWeight: "900",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: "900",
    color: "#7528F0",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#8D8A99",
    fontWeight: "700",
  },
  summaryDivider: {
    width: 1,
    height: 38,
    backgroundColor: "#EEEAF7",
  },
  emptyMiniCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  emptyMiniText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#8D8A99",
    fontWeight: "700",
  },
  sectionHeaderRow: {
    marginBottom: -2,
  },
  requestCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  connectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: "900",
    color: "#2D2934",
    flex: 1,
  },
  detail: {
    fontSize: 12,
    color: "#8D8A99",
    marginBottom: 4,
  },
  eventText: {
    fontSize: 12,
    color: "#5F5C68",
    fontWeight: "600",
    marginBottom: 7,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  acceptButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#8B35E8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  rejectButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF1F2",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelRequestButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF1F2",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  statusAccepted: {
    backgroundColor: "#ECFDF3",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusAcceptedText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#12A150",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    backgroundColor: "#F1ECFF",
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#7528F0",
  },
  messageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1ECFF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  blockSmallButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF1F2",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  expandButton: {
    height: 44,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0D9F4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -4,
    marginBottom: 24,
  },
  expandButtonText: {
    color: "#7528F0",
    fontSize: 13,
    fontWeight: "900",
    marginRight: 6,
  },
});
