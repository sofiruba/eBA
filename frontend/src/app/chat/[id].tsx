import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Check,
  MessageCircle,
  Pencil,
  Send,
  Shield,
  Trash2,
  X,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../../config/api";
import LoadingScreen from "../../components/LoadingScreen";
import ProfileAvatarLink from "../../components/ProfileAvatarLink";
import useAutoRefresh from "../../hooks/useAutoRefresh";
import { Usuario } from "../../types/Usuario";

type Chat = {
  _id: string;
  participantes: Usuario[];
};

type Mensaje = {
  _id: string;
  chatId: string;
  usuarioEmisorId: Usuario | string;
  mensajePadreId?: Mensaje | string | null;
  contenido: string;
  fechaEnvio?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();

  const [chat, setChat] = useState<Chat | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [usuarioActualId, setUsuarioActualId] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensajeSeleccionadoId, setMensajeSeleccionadoId] = useState<string | null>(null);
  const [mensajeEditandoId, setMensajeEditandoId] = useState<string | null>(null);
  const [textoEditado, setTextoEditado] = useState("");
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [mensajeRespondiendo, setMensajeRespondiendo] = useState<Mensaje | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  const scrollAlFinal = (animado = true) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: animado });
    });
  };

  useFocusEffect(
    useCallback(() => {
      iniciarChat();
    }, [id])
  );

  const iniciarChat = async () => {
    try {
      setLoading(true);

      const usuarioGuardado = await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado) {
        router.replace("/login" as any);
        return;
      }

      const usuario = JSON.parse(usuarioGuardado);
      const idUsuario = usuario.id || usuario._id;

      if (!idUsuario || !id) {
        router.replace("/login" as any);
        return;
      }

      setUsuarioActualId(idUsuario);

      const [responseChat, responseMensajes] = await Promise.all([
        fetch(`${API_URL}/api/chats/${id}`),
        fetch(`${API_URL}/api/mensajes/chat/${id}`),
      ]);

      const dataChat = await responseChat.json();
      const dataMensajes = await responseMensajes.json();

      if (!responseChat.ok) {
        alert(dataChat.error || "No se pudo cargar el chat.");
        return;
      }

      setChat(dataChat.chat);

      if (responseMensajes.ok) {
        setMensajes(dataMensajes.mensajes || []);
        scrollAlFinal(false);
      }
    } catch (error) {
      console.log("Error iniciando chat:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const cargarMensajes = async (chatId: string) => {
    const response = await fetch(`${API_URL}/api/mensajes/chat/${chatId}`);
    const data = await response.json();

    if (response.ok) {
      setMensajes(data.mensajes || []);
      scrollAlFinal(true);
    }
  };

  useEffect(() => {
    scrollAlFinal(true);
  }, [mensajes.length]);

  useAutoRefresh(
    useCallback(() => {
      if (!id) return;
      return cargarMensajes(String(id));
    }, [id]),
    5000,
    !loading
  );

  const obtenerUsuarioId = (usuario?: Usuario | string | null) => {
    if (!usuario) return null;
    if (typeof usuario === "string") return usuario;
    return usuario.id || usuario._id || null;
  };

  const obtenerOtroUsuario = () => {
    return chat?.participantes.find((participante) => {
      const participanteId = participante._id || participante.id;
      return participanteId !== usuarioActualId;
    });
  };

  const enviarMensaje = async () => {
    try {
      if (!texto.trim() || !usuarioActualId || !id) return;

      setEnviando(true);

      const response = await fetch(`${API_URL}/api/mensajes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: String(id),
          usuarioEmisorId: usuarioActualId,
          mensajePadreId: mensajeRespondiendo?._id || null,
          contenido: texto.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo enviar el mensaje.");
        return;
      }

      setMensajes((prev) => [
        ...prev,
        {
          ...data.mensaje,
          usuarioEmisorId: usuarioActualId,
          mensajePadreId: mensajeRespondiendo || data.mensaje.mensajePadreId || null,
          fechaEnvio: data.mensaje.fechaEnvio || new Date().toISOString(),
        },
      ]);
      setTexto("");
      setMensajeRespondiendo(null);
      scrollAlFinal(true);
    } catch (error) {
      console.log("Error enviando mensaje:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  };

  const confirmarAccion = (
    titulo: string,
    mensaje: string,
    accion: () => void
  ) => {
    if (Platform.OS === "web") {
      const confirmado = window.confirm(`${titulo}\n\n${mensaje}`);
      if (confirmado) accion();
      return;
    }

    Alert.alert(titulo, mensaje, [
      { text: "Cancelar", style: "cancel" },
      { text: "Sí", style: "destructive", onPress: accion },
    ]);
  };

  const iniciarEdicionMensaje = (mensaje: Mensaje) => {
    setMensajeEditandoId(mensaje._id);
    setTextoEditado(mensaje.contenido);
    setMensajeSeleccionadoId(null);
  };

  const iniciarRespuestaMensaje = (mensaje: Mensaje) => {
    setMensajeRespondiendo(mensaje);
    setMensajeSeleccionadoId(null);
    setMensajeEditandoId(null);
  };

  const cancelarEdicionMensaje = () => {
    setMensajeEditandoId(null);
    setTextoEditado("");
  };

  const guardarEdicionMensaje = async (mensajeId: string) => {
    try {
      if (!usuarioActualId || !textoEditado.trim()) {
        alert("El mensaje no puede quedar vacío.");
        return;
      }

      setGuardandoEdicion(true);

      const response = await fetch(`${API_URL}/api/mensajes/${mensajeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId: usuarioActualId,
          contenido: textoEditado.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo editar el mensaje.");
        return;
      }

      setMensajes((prev) =>
        prev.map((mensaje) =>
          mensaje._id === mensajeId
            ? {
                ...mensaje,
                contenido: data.mensaje?.contenido || textoEditado.trim(),
                updatedAt: data.mensaje?.updatedAt || new Date().toISOString(),
              }
            : mensaje
        )
      );
      cancelarEdicionMensaje();
    } catch (error) {
      console.log("Error editando mensaje:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const eliminarMensaje = async (mensajeId: string) => {
    try {
      if (!usuarioActualId) return;

      const response = await fetch(`${API_URL}/api/mensajes/${mensajeId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId: usuarioActualId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo eliminar el mensaje.");
        return;
      }

      setMensajes((prev) => prev.filter((mensaje) => mensaje._id !== mensajeId));
      setMensajeSeleccionadoId(null);
      if (mensajeEditandoId === mensajeId) cancelarEdicionMensaje();
    } catch (error) {
      console.log("Error eliminando mensaje:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  const formatearHora = (fecha?: string) => {
    if (!fecha) return "";

    return new Date(fecha).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const obtenerNombreUsuarioMensaje = (usuario?: Usuario | string | null) => {
    if (!usuario || typeof usuario === "string") return "Alguien";
    return usuario.nombre || usuario.nombreUsuario || "Alguien";
  };

  const obtenerMensajeRespondido = (mensaje: Mensaje) => {
    const padre = mensaje.mensajePadreId;

    if (!padre) return null;
    if (typeof padre === "object") return padre;

    return mensajes.find((item) => item._id === padre) || null;
  };

  const obtenerPreviewMensaje = (contenido?: string) => {
    if (!contenido) return "Mensaje";
    return contenido.length > 64 ? `${contenido.slice(0, 61)}...` : contenido;
  };

  if (loading) {
    return <LoadingScreen text="Cargando chat..." />;
  }

  const otroUsuario = obtenerOtroUsuario();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#332047" />
        </TouchableOpacity>

        <View style={styles.headerAvatarBox}>
          <ProfileAvatarLink usuario={otroUsuario} size={44} />
          <View style={styles.headerOnlineDot} />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.title}>{otroUsuario?.nombre || "Chat"}</Text>
          <Text style={styles.subtitle}>Conexión activa · respondé cuando quieras</Text>
        </View>

        <View style={styles.secureIcon}>
          <Shield size={18} color="#6D28E8" />
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContainer}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollAlFinal(true)}
      >
        {mensajes.map((mensaje) => {
          const emisorId = obtenerUsuarioId(mensaje.usuarioEmisorId);
          const esMio = emisorId === usuarioActualId;
          const mensajeRespondido = obtenerMensajeRespondido(mensaje);

          return (
            <View
              key={mensaje._id}
              style={[styles.messageRow, esMio && styles.messageRowMine]}
            >
              <TouchableOpacity
                activeOpacity={esMio ? 0.82 : 1}
                onPress={() =>
                  setMensajeSeleccionadoId((actual) =>
                    actual === mensaje._id ? null : mensaje._id
                  )
                }
                style={[
                  styles.messageBubble,
                  esMio && styles.messageMine,
                  mensajeSeleccionadoId === mensaje._id && styles.messageSelected,
                ]}
              >
                {mensajeEditandoId === mensaje._id ? (
                  <View style={styles.editMessageBox}>
                    <TextInput
                      style={styles.editMessageInput}
                      value={textoEditado}
                      onChangeText={setTextoEditado}
                      multiline
                      autoFocus
                      placeholder="Editar mensaje..."
                      placeholderTextColor="rgba(255,255,255,0.72)"
                    />

                    <View style={styles.editMessageActions}>
                      <TouchableOpacity
                        style={styles.messageActionButton}
                        activeOpacity={0.85}
                        disabled={guardandoEdicion}
                        onPress={cancelarEdicionMensaje}
                      >
                        <X size={14} color="#FFFFFF" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.messageActionButton}
                        activeOpacity={0.85}
                        disabled={guardandoEdicion || !textoEditado.trim()}
                        onPress={() => guardarEdicionMensaje(mensaje._id)}
                      >
                        <Check size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    {mensajeRespondido && (
                      <View
                        style={[
                          styles.replyPreview,
                          esMio && styles.replyPreviewMine,
                        ]}
                      >
                        <Text
                          style={[
                            styles.replyPreviewName,
                            esMio && styles.replyPreviewNameMine,
                          ]}
                        >
                          {obtenerNombreUsuarioMensaje(
                            mensajeRespondido.usuarioEmisorId
                          )}
                        </Text>
                        <Text
                          style={[
                            styles.replyPreviewText,
                            esMio && styles.replyPreviewTextMine,
                          ]}
                          numberOfLines={2}
                        >
                          {obtenerPreviewMensaje(mensajeRespondido.contenido)}
                        </Text>
                      </View>
                    )}

                    <Text style={[styles.messageText, esMio && styles.messageTextMine]}>
                      {mensaje.contenido}
                    </Text>

                    <Text style={[styles.messageTime, esMio && styles.messageTimeMine]}>
                      {mensaje.updatedAt && mensaje.updatedAt !== mensaje.createdAt
                        ? "Editado · "
                        : ""}
                      {formatearHora(mensaje.fechaEnvio || mensaje.createdAt)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {mensajeSeleccionadoId === mensaje._id && !mensajeEditandoId && (
                <View style={styles.messageActions}>
                  <TouchableOpacity
                    style={styles.messageActionPill}
                    activeOpacity={0.85}
                    onPress={() => iniciarRespuestaMensaje(mensaje)}
                  >
                    <MessageCircle size={14} color="#6D28E8" />
                    <Text style={styles.messageActionText}>Responder</Text>
                  </TouchableOpacity>

                  {esMio && (
                    <TouchableOpacity
                      style={styles.messageActionPill}
                      activeOpacity={0.85}
                      onPress={() => iniciarEdicionMensaje(mensaje)}
                    >
                      <Pencil size={14} color="#6D28E8" />
                      <Text style={styles.messageActionText}>Editar</Text>
                    </TouchableOpacity>
                  )}

                  {esMio && (
                    <TouchableOpacity
                      style={[styles.messageActionPill, styles.messageDeletePill]}
                      activeOpacity={0.85}
                      onPress={() =>
                        confirmarAccion(
                          "Eliminar mensaje",
                          "¿Querés eliminar este mensaje?",
                          () => eliminarMensaje(mensaje._id)
                        )
                      }
                    >
                      <Trash2 size={14} color="#E53935" />
                      <Text style={[styles.messageActionText, styles.messageDeleteText]}>
                        Eliminar
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {mensajeRespondiendo && (
        <View style={styles.replyingBar}>
          <View style={styles.replyingIndicator} />
          <View style={styles.replyingTextBox}>
            <Text style={styles.replyingTitle}>
              Respondiendo a{" "}
              {obtenerNombreUsuarioMensaje(mensajeRespondiendo.usuarioEmisorId)}
            </Text>
            <Text style={styles.replyingText} numberOfLines={1}>
              {obtenerPreviewMensaje(mensajeRespondiendo.contenido)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.replyingCloseButton}
            activeOpacity={0.85}
            onPress={() => setMensajeRespondiendo(null)}
          >
            <X size={16} color="#6F6D7A" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputBar}>
        <View style={styles.inputShell}>
          <TextInput
            style={styles.input}
            placeholder="Escribí un mensaje..."
            placeholderTextColor="#A7A7B0"
            value={texto}
            onChangeText={setTexto}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.sendButton, (!texto.trim() || enviando) && styles.sendDisabled]}
          activeOpacity={0.85}
          disabled={!texto.trim() || enviando}
          onPress={enviarMensaje}
        >
          <Send size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F6FB",
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 58,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerAvatarBox: {
    position: "relative",
    marginRight: 10,
  },
  headerOnlineDot: {
    position: "absolute",
    right: 12,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#12A150",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "900",
    color: "#332047",
  },
  subtitle: {
    fontSize: 12,
    color: "#12A150",
    fontWeight: "800",
    marginTop: 2,
  },
  secureIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#F1ECFF",
    alignItems: "center",
    justifyContent: "center",
  },
  messagesContainer: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 22,
  },
  messageRow: {
    marginBottom: 12,
  },
  messageRowMine: {
    alignItems: "flex-end",
  },
  messageBubble: {
    alignSelf: "flex-start",
    maxWidth: "82%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderTopLeftRadius: 6,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "#ECE8F4",
  },
  messageMine: {
    alignSelf: "flex-end",
    backgroundColor: "#6D28E8",
    borderColor: "#6D28E8",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 6,
  },
  messageSelected: {
    shadowColor: "#332047",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    color: "#332047",
    lineHeight: 21,
  },
  messageTextMine: {
    color: "#FFFFFF",
  },
  messageTime: {
    fontSize: 10,
    color: "#8D8A99",
    fontWeight: "700",
    marginTop: 5,
    alignSelf: "flex-end",
  },
  messageTimeMine: {
    color: "rgba(255,255,255,0.75)",
  },
  replyPreview: {
    backgroundColor: "#F4F2FA",
    borderLeftWidth: 3,
    borderLeftColor: "#8B35E8",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
  },
  replyPreviewMine: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderLeftColor: "#FFFFFF",
  },
  replyPreviewName: {
    fontSize: 11,
    fontWeight: "900",
    color: "#6D28E8",
    marginBottom: 2,
  },
  replyPreviewNameMine: {
    color: "#FFFFFF",
  },
  replyPreviewText: {
    fontSize: 12,
    color: "#6F6D7A",
    lineHeight: 16,
  },
  replyPreviewTextMine: {
    color: "rgba(255,255,255,0.82)",
  },
  messageActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 6,
  },
  messageActionPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#E8E1F6",
    gap: 5,
  },
  messageDeletePill: {
    borderColor: "#FFD8DD",
    backgroundColor: "#FFF3F5",
  },
  messageActionText: {
    fontSize: 12,
    color: "#6D28E8",
    fontWeight: "900",
  },
  messageDeleteText: {
    color: "#E53935",
  },
  editMessageBox: {
    minWidth: 190,
  },
  editMessageInput: {
    minHeight: 44,
    maxHeight: 112,
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 21,
    padding: 0,
    textAlignVertical: "top",
    outlineStyle: "none" as any,
  },
  editMessageActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  messageActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  replyingBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEAF7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  replyingIndicator: {
    width: 3,
    height: 38,
    borderRadius: 2,
    backgroundColor: "#8B35E8",
    marginRight: 10,
  },
  replyingTextBox: {
    flex: 1,
  },
  replyingTitle: {
    fontSize: 12,
    color: "#6D28E8",
    fontWeight: "900",
    marginBottom: 2,
  },
  replyingText: {
    fontSize: 13,
    color: "#6F6D7A",
  },
  replyingCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#EEEAF7",
  },
  inputShell: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: "#F4F2FA",
    borderWidth: 1,
    borderColor: "#E0D9F4",
    paddingHorizontal: 2,
  },
  input: {
    maxHeight: 110,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#332047",
    textAlignVertical: "top",
    outlineStyle: "none" as any,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#6D28E8",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  sendDisabled: {
    opacity: 0.45,
  },
});
