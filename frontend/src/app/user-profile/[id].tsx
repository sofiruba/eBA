import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  AtSign,
  CheckCircle,
  Clock3,
  Heart,
  MapPin,
  MessageCircle,
  ShieldOff,
  UserPlus,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../../config/api";
import LoadingScreen from "../../components/LoadingScreen";
import UserAvatar from "../../components/UserAvatar";
import { Usuario } from "../../types/Usuario";
import { invalidateSocialCaches } from "../../utils/cache";

type Conexion = {
  _id: string;
  usuario1: Usuario;
  usuario2: Usuario;
};

type SolicitudConexion = {
  _id: string;
  usuariosolicitante: Usuario;
  usuarioreceptor: Usuario;
  estado: string;
};

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [usuarioActualId, setUsuarioActualId] = useState<string | null>(null);
  const [conexion, setConexion] = useState<Conexion | null>(null);
  const [solicitudPendiente, setSolicitudPendiente] = useState(false);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarPerfil();
    }, [id])
  );

  const cargarPerfil = async () => {
    try {
      setLoading(true);

      const usuarioGuardado = await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado) {
        router.replace("/login" as any);
        return;
      }

      const usuarioActual = JSON.parse(usuarioGuardado);
      const idUsuarioActual = usuarioActual.id || usuarioActual._id;

      if (!idUsuarioActual || !id) {
        router.replace("/login" as any);
        return;
      }

      setUsuarioActualId(idUsuarioActual);

      const responseUsuario = await fetch(`${API_URL}/api/usuarios/${id}`);
      const dataUsuario = await responseUsuario.json();

      if (!responseUsuario.ok) {
        alert(dataUsuario.error || "No se pudo cargar el perfil.");
        return;
      }

      setUsuario(dataUsuario.usuario);

      const responseConexiones = await fetch(
        `${API_URL}/api/conexiones/usuario/${idUsuarioActual}`
      );
      const dataConexiones = await responseConexiones.json();

      if (responseConexiones.ok) {
        const conexionEncontrada = (dataConexiones || []).find(
          (item: Conexion) => {
            const usuario1Id = obtenerUsuarioId(item.usuario1);
            const usuario2Id = obtenerUsuarioId(item.usuario2);
            return usuario1Id === String(id) || usuario2Id === String(id);
          }
        );

        setConexion(conexionEncontrada || null);
      }

      const responseSolicitudes = await fetch(
        `${API_URL}/api/solicitudes-conexion/pendientes/${idUsuarioActual}`
      );
      const dataSolicitudes = await responseSolicitudes.json();

      if (responseSolicitudes.ok) {
        const pendiente = (dataSolicitudes.solicitudes || []).some(
          (solicitud: SolicitudConexion) => {
            const solicitanteId = obtenerUsuarioId(solicitud.usuariosolicitante);
            const receptorId = obtenerUsuarioId(solicitud.usuarioreceptor);
            return solicitanteId === String(id) || receptorId === String(id);
          }
        );

        setSolicitudPendiente(pendiente);
      }
    } catch (error) {
      console.log("Error cargando perfil público:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const obtenerUsuarioId = (usuario?: Usuario | string | null) => {
    if (!usuario) return null;
    if (typeof usuario === "string") return usuario;
    return usuario.id || usuario._id || null;
  };

  const enviarSolicitudConexion = async () => {
    try {
      if (!usuarioActualId || !id) return;

      setProcesando(true);

      const response = await fetch(`${API_URL}/api/solicitudes-conexion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuariosolicitante: usuarioActualId,
          usuarioreceptor: String(id),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.mensaje || "No se pudo enviar la solicitud.");
        return;
      }

      setSolicitudPendiente(true);
      invalidateSocialCaches(usuarioActualId);
      alert("Solicitud enviada correctamente.");
    } catch (error) {
      console.log("Error enviando solicitud:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setProcesando(false);
    }
  };

  const abrirChat = async () => {
    try {
      if (!usuarioActualId || !id || !conexion) return;

      setProcesando(true);

      const responseExistente = await fetch(
        `${API_URL}/api/chats/entre/${usuarioActualId}/${String(id)}`
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
          participantes: [usuarioActualId, String(id)],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo abrir el chat.");
        return;
      }

      router.push(`/chat/${data.chat._id}` as any);
    } catch (error) {
      console.log("Error abriendo chat:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setProcesando(false);
    }
  };

  const bloquearUsuario = async () => {
    try {
      if (!usuarioActualId || !id) return;

      setProcesando(true);

      const response = await fetch(`${API_URL}/api/bloqueos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bloqueadorId: usuarioActualId,
          bloqueadoId: String(id),
          motivo: "Bloqueado desde perfil",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo bloquear al usuario.");
        return;
      }

      alert("Usuario bloqueado correctamente.");
      invalidateSocialCaches(usuarioActualId);
      router.replace("/connections" as any);
    } catch (error) {
      console.log("Error bloqueando usuario:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setProcesando(false);
    }
  };

  if (loading) {
    return <LoadingScreen text="Cargando perfil..." />;
  }

  if (!usuario) {
    return (
      <View style={styles.screen}>
        <Text style={styles.notFound}>No se encontró el usuario.</Text>
      </View>
    );
  }

  const esMiPerfil = usuarioActualId === String(id);

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#332047" />
        </TouchableOpacity>

        <View style={styles.profileCard}>
          <UserAvatar usuario={usuario} size={112} />

          <Text style={styles.name}>
            {usuario.nombre || "Usuario"}
            {usuario.edad ? `, ${usuario.edad}` : ""}
          </Text>

          <Text style={styles.username}>
            @{usuario.nombreUsuario || "usuario"}
          </Text>

          <Text style={styles.bio}>
            {usuario.bio || "Todavía no agregó una bio."}
          </Text>

          {!esMiPerfil && (
            <View style={styles.actionsRow}>
              {conexion ? (
                <TouchableOpacity
                  style={styles.primaryButton}
                  activeOpacity={0.85}
                  disabled={procesando}
                  onPress={abrirChat}
                >
                  <MessageCircle size={18} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Abrir chat</Text>
                </TouchableOpacity>
              ) : solicitudPendiente ? (
                <View style={styles.pendingButton}>
                  <Clock3 size={18} color="#7528F0" />
                  <Text style={styles.pendingButtonText}>Pendiente</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.primaryButton}
                  activeOpacity={0.85}
                  disabled={procesando}
                  onPress={enviarSolicitudConexion}
                >
                  <UserPlus size={18} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Conectar</Text>
                </TouchableOpacity>
              )}

              {conexion && (
                <View style={styles.connectedPill}>
                  <CheckCircle size={16} color="#12A150" />
                  <Text style={styles.connectedPillText}>Conectados</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.blockButton}
                activeOpacity={0.85}
                disabled={procesando}
                onPress={bloquearUsuario}
              >
                <ShieldOff size={17} color="#E53935" />
                <Text style={styles.blockButtonText}>Bloquear</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <MapPin size={19} color="#7528F0" />
            </View>

            <View style={styles.infoTextBox}>
              <Text style={styles.infoLabel}>Ubicación</Text>
              <Text style={styles.infoValue}>
                {usuario.ubicacionAproximada || "Sin ubicación cargada"}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <AtSign size={19} color="#7528F0" />
            </View>

            <View style={styles.infoTextBox}>
              <Text style={styles.infoLabel}>Instagram</Text>
              <Text style={styles.infoValue}>
                {usuario.instagram || "No agregado"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Intereses</Text>

          {usuario.intereses && usuario.intereses.length > 0 ? (
            <View style={styles.chipsContainer}>
              {usuario.intereses.map((interes) => (
                <View key={interes} style={styles.chip}>
                  <Heart size={13} color="#7528F0" fill="#7528F0" />
                  <Text style={styles.chipText}>{interes}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No tiene intereses cargados.</Text>
          )}
        </View>
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
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  notFound: {
    marginTop: 90,
    textAlign: "center",
    color: "#332047",
    fontWeight: "900",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 22,
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  name: {
    marginTop: 14,
    fontSize: 25,
    fontWeight: "900",
    color: "#332047",
    textAlign: "center",
  },
  username: {
    marginTop: 4,
    fontSize: 14,
    color: "#8B35E8",
    fontWeight: "800",
  },
  bio: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 21,
    color: "#6F6D7A",
    textAlign: "center",
  },
  actionsRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  primaryButton: {
    height: 46,
    borderRadius: 23,
    backgroundColor: "#7528F0",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    marginLeft: 8,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  pendingButton: {
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F1ECFF",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  pendingButtonText: {
    marginLeft: 8,
    color: "#7528F0",
    fontSize: 14,
    fontWeight: "900",
  },
  connectedPill: {
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ECFDF3",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  connectedPillText: {
    marginLeft: 6,
    color: "#12A150",
    fontSize: 12,
    fontWeight: "900",
  },
  blockButton: {
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF1F2",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  blockButtonText: {
    marginLeft: 7,
    color: "#E53935",
    fontSize: 13,
    fontWeight: "900",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#F1ECFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoTextBox: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#8D8A99",
    fontWeight: "800",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: "#332047",
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 18,
    color: "#332047",
    fontWeight: "900",
    marginBottom: 14,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1ECFF",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#7528F0",
    fontWeight: "900",
  },
  emptyText: {
    color: "#8D8A99",
    fontSize: 14,
    fontWeight: "700",
  },
});
