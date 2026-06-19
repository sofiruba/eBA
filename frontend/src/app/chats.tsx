import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { MessageCircle, Search, SquarePen, Users, X } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../config/api";
import BottomNav from "../components/BottomNav";
import EmptyState from "../components/EmptyState";
import LoadingScreen from "../components/LoadingScreen";
import Logo from "../components/Logo";
import ProfileAvatarLink from "../components/ProfileAvatarLink";
import useAutoRefresh from "../hooks/useAutoRefresh";
import { Usuario } from "../types/Usuario";

type Chat = {
  _id: string;
  tipo?: "privado" | "evento";
  eventoId?: { _id: string; nombre: string } | string | null;
  nombre?: string;
  participantes: Usuario[];
  updatedAt?: string;
};

type Conexion = {
  _id: string;
  usuario1: Usuario;
  usuario2: Usuario;
};

type Bloqueo = {
  bloqueadoId: Usuario | string;
};

export default function ChatsScreen() {
  const [usuarioActualId, setUsuarioActualId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [conexiones, setConexiones] = useState<Conexion[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalNuevoChatVisible, setModalNuevoChatVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarChats();
    }, [])
  );

  const cargarChats = async (silencioso = false) => {
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
        router.replace("/login" as any);
        return;
      }

      setUsuarioActualId(idUsuario);

      const [response, responseConexiones, responseBloqueos] = await Promise.all([
        fetch(`${API_URL}/api/chats/usuario/${idUsuario}`),
        fetch(`${API_URL}/api/conexiones/usuario/${idUsuario}`),
        fetch(`${API_URL}/api/bloqueos/usuario/${idUsuario}`),
      ]);

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudieron cargar tus chats.");
        return;
      }

      let idsBloqueados: string[] = [];

      if (responseBloqueos.ok) {
        const dataBloqueos = await responseBloqueos.json();
        idsBloqueados = (dataBloqueos.bloqueos || [])
          .map((bloqueo: Bloqueo) => obtenerIdUsuario(bloqueo.bloqueadoId))
          .filter(Boolean) as string[];
      }

      const chatsVisibles = (data.chats || []).filter((chat: Chat) => {
        // Para chats grupales, siempre mostrar
        if (chat.tipo === "evento") return true;

        const otro = obtenerOtroUsuarioDesdeId(chat, idUsuario);
        const otroId = obtenerIdUsuario(otro);
        return !otroId || !idsBloqueados.includes(otroId);
      });

      // Eliminar duplicados por _id
      const chatsUnicos = chatsVisibles.filter(
        (chat: Chat, index: number, self: Chat[]) =>
          self.findIndex((c: Chat) => c._id === chat._id) === index
      );

      setChats(chatsUnicos);

      if (responseConexiones.ok) {
        const dataConexiones = await responseConexiones.json();
        const conexionesVisibles = (Array.isArray(dataConexiones)
          ? dataConexiones
          : []
        ).filter((conexion: Conexion) => {
          const otro = obtenerOtroUsuarioConexionDesdeId(conexion, idUsuario);
          const otroId = obtenerIdUsuario(otro);
          return !otroId || !idsBloqueados.includes(otroId);
        });

        setConexiones(conexionesVisibles);
      }
    } catch (error) {
      console.log("Error cargando chats:", error);
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
    useCallback(() => cargarChats(true), []),
    10000,
    !loading
  );

  const obtenerIdUsuario = (usuario?: Usuario | string | null) => {
    if (!usuario) return null;
    if (typeof usuario === "string") return usuario;
    return usuario._id || usuario.id || null;
  };

  const obtenerOtroUsuarioDesdeId = (chat: Chat, idUsuario: string) => {
    return chat.participantes.find((participante) => {
      const participanteId = obtenerIdUsuario(participante);
      return participanteId !== idUsuario;
    });
  };

  const obtenerOtroUsuario = (chat: Chat) => {
    if (!usuarioActualId) return undefined;
    return obtenerOtroUsuarioDesdeId(chat, usuarioActualId);
  };

  const obtenerOtroUsuarioConexionDesdeId = (
    conexion: Conexion,
    idUsuario: string
  ) => {
    const usuario1Id = obtenerIdUsuario(conexion.usuario1);
    return usuario1Id === idUsuario ? conexion.usuario2 : conexion.usuario1;
  };

  const obtenerOtroUsuarioConexion = (conexion: Conexion) => {
    if (!usuarioActualId) return conexion.usuario1;
    return obtenerOtroUsuarioConexionDesdeId(conexion, usuarioActualId);
  };

  const obtenerNombreChat = (chat: Chat) => {
    if (chat.tipo === "evento") {
      if (chat.nombre) return chat.nombre;
      if (chat.eventoId && typeof chat.eventoId === "object") {
        return chat.eventoId.nombre;
      }
      return "Chat grupal";
    }
    const usuario = obtenerOtroUsuario(chat);
    return usuario?.nombre || "Usuario";
  };

  const esChatGrupal = (chat: Chat) => {
    return chat.tipo === "evento" || (chat.participantes?.length || 0) > 2;
  };

  const abrirChatConConexion = async (conexion: Conexion) => {
    try {
      if (!usuarioActualId) return;

      const usuarioConexion = obtenerOtroUsuarioConexion(conexion);
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
        setModalNuevoChatVisible(false);
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

      setModalNuevoChatVisible(false);
      router.push(`/chat/${data.chat._id}` as any);
    } catch (error) {
      console.log("Error abriendo chat:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "";

    return new Date(fecha).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
    });
  };

  const chatsFiltrados = chats.filter((chat) => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return true;

    const nombre = obtenerNombreChat(chat).toLowerCase();

    if (nombre.includes(texto)) return true;

    // Para chats privados, buscar también por nombreUsuario y email
    if (!esChatGrupal(chat)) {
      const usuario = obtenerOtroUsuario(chat);
      return (
        usuario?.nombreUsuario?.toLowerCase().includes(texto) ||
        usuario?.email?.toLowerCase().includes(texto)
      );
    }

    return false;
  });

  if (loading) {
    return <LoadingScreen text="Cargando chats..." />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <Logo size="medium" />

          <TouchableOpacity
            style={styles.composeButton}
            activeOpacity={0.85}
            onPress={() => setModalNuevoChatVisible(true)}
          >
            <SquarePen size={20} color="#6D28E8" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Chats</Text>

        <View style={styles.searchBox}>
          <Search size={17} color="#8D8A99" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar chats"
            placeholderTextColor="#A7A7B0"
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>

        <Text style={styles.sectionLabel}>Mensajes directos</Text>

        {chats.length === 0 ? (
          <EmptyState
            icon={<MessageCircle size={52} color="#B484F2" />}
            title="Todavía no tenés chats"
            text="Elegí una conexión para empezar una conversación."
            buttonText={conexiones.length > 0 ? "Nuevo chat" : undefined}
            onPress={
              conexiones.length > 0
                ? () => setModalNuevoChatVisible(true)
                : undefined
            }
          />
        ) : chatsFiltrados.length === 0 ? (
          <EmptyState
            icon={<Search size={48} color="#B484F2" />}
            title="No encontramos chats"
            text="Probá buscar por nombre o usuario."
          />
        ) : (
          chatsFiltrados.map((chat) => {
            const grupal = esChatGrupal(chat);
            const usuario = grupal ? undefined : obtenerOtroUsuario(chat);
            const nombre = obtenerNombreChat(chat);

            return (
              <TouchableOpacity
                key={chat._id}
                style={styles.chatCard}
                activeOpacity={0.85}
                onPress={() => router.push(`/chat/${chat._id}` as any)}
              >
                <View style={styles.avatarBox}>
                  {grupal ? (
                    <View style={styles.groupAvatar}>
                      <Users size={24} color="#FFFFFF" />
                    </View>
                  ) : (
                    <ProfileAvatarLink usuario={usuario} size={52} />
                  )}
                  <View style={styles.onlineDot} />
                </View>

                <View style={styles.chatInfo}>
                  <Text style={styles.chatName}>{nombre}</Text>

                  <Text style={styles.chatPreview}>
                    {grupal
                      ? `${chat.participantes?.length || 0} participantes`
                      : "Tocá para seguir la charla"}
                  </Text>
                </View>

                <View style={styles.chatMeta}>
                  <Text style={styles.chatDate}>{formatearFecha(chat.updatedAt)}</Text>
                  <Text style={styles.chatArrow}>›</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={modalNuevoChatVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalNuevoChatVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo chat</Text>
              <TouchableOpacity
                style={styles.modalClose}
                activeOpacity={0.85}
                onPress={() => setModalNuevoChatVisible(false)}
              >
                <X size={19} color="#8D8A99" />
              </TouchableOpacity>
            </View>

            {conexiones.length === 0 ? (
              <Text style={styles.modalEmptyText}>
                Todavía no tenés conexiones disponibles para chatear.
              </Text>
            ) : (
              conexiones.map((conexion) => {
                const usuario = obtenerOtroUsuarioConexion(conexion);

                return (
                  <TouchableOpacity
                    key={conexion._id}
                    style={styles.connectionOption}
                    activeOpacity={0.85}
                    onPress={() => abrirChatConConexion(conexion)}
                  >
                    <ProfileAvatarLink usuario={usuario} size={46} disabled />

                    <View style={styles.connectionOptionText}>
                      <Text style={styles.connectionOptionName}>
                        {usuario?.nombre || "Usuario"}
                      </Text>
                      <Text style={styles.connectionOptionDetail}>
                        @{usuario?.nombreUsuario || "usuario"}
                      </Text>
                    </View>

                    <MessageCircle size={19} color="#6D28E8" />
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </Modal>

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
    paddingHorizontal: 24,
    paddingTop: 74,
    paddingBottom: 130,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  composeButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E2F8",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 31,
    fontWeight: "900",
    color: "#332047",
    marginBottom: 16,
  },
  searchBox: {
    height: 46,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E2F8",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 22,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#332047",
    fontSize: 14,
    fontWeight: "600",
    outlineStyle: "none" as any,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: "#332047",
    marginBottom: 12,
  },
  chatCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  avatarBox: {
    position: "relative",
    marginRight: 12,
  },
  groupAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#6D28E8",
    alignItems: "center",
    justifyContent: "center",
  },
  onlineDot: {
    position: "absolute",
    right: 12,
    bottom: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#12A150",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2D2934",
    marginBottom: 4,
  },
  chatPreview: {
    fontSize: 13,
    color: "#8D8A99",
    fontWeight: "700",
  },
  chatMeta: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  chatDate: {
    fontSize: 12,
    color: "#8D8A99",
    fontWeight: "800",
    marginBottom: 8,
  },
  chatArrow: {
    color: "#6D28E8",
    fontSize: 22,
    fontWeight: "900",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 34,
    maxHeight: "78%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#332047",
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F4F6FB",
    alignItems: "center",
    justifyContent: "center",
  },
  modalEmptyText: {
    color: "#8D8A99",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  connectionOption: {
    minHeight: 68,
    borderRadius: 20,
    backgroundColor: "#F8F7FF",
    borderWidth: 1,
    borderColor: "#E8E2F8",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  connectionOptionText: {
    flex: 1,
  },
  connectionOptionName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#2D2934",
  },
  connectionOptionDetail: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800",
    color: "#8D8A99",
  },
});
