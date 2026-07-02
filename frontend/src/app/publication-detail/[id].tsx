import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  MessageCircle,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
 
import { API_URL } from "../../config/api";
import LoadingScreen from "../../components/LoadingScreen";
import EmptyState from "../../components/EmptyState";
import ProfileAvatarLink from "../../components/ProfileAvatarLink";
import CommentThread from "../../components/comments/CommentThread";
import useAutoRefresh from "../../hooks/useAutoRefresh";
 
import { Usuario } from "../../types/Usuario";
import { Publicacion, Comentario } from "../../types/Social";
import { Evento } from "../../types/Evento";
import { getCached, invalidateCachedByPrefix, removeCached, setCached } from "../../utils/cache";
import { eventoYaPaso } from "../../utils/eventHelpers";
 
export default function PublicationDetailScreen() {
  const { id } = useLocalSearchParams();
 
  const [publicacion, setPublicacion] = useState<Publicacion | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [usuarioActualId, setUsuarioActualId] = useState<string | null>(null);
  const [bloqueadosIds, setBloqueadosIds] = useState<string[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
 
  const [editandoPublicacion, setEditandoPublicacion] = useState(false);
  const [textoPublicacionEditada, setTextoPublicacionEditada] = useState("");
  const [guardandoPublicacion, setGuardandoPublicacion] = useState(false);
  const [eliminandoPublicacion, setEliminandoPublicacion] = useState(false);
 
  useEffect(() => {
    iniciarPantalla();
  }, [id]);
 
  const iniciarPantalla = async () => {
    try {
      setLoading(true);
 
      const usuarioGuardado = await AsyncStorage.getItem("usuario");
 
      if (!usuarioGuardado) {
        router.replace("/login" as any);
        return;
      }
 
      const usuario = JSON.parse(usuarioGuardado);
      const idUsuario = usuario.id || usuario._id;
 
      setUsuarioActual(usuario);
      setUsuarioActualId(idUsuario);
 
      const publicacionCacheada = getCached<Publicacion>(
        `publicacion:${String(id)}`
      );
      const comentariosCacheados = getCached<Comentario[]>(
        `comentarios:publicacion:${String(id)}`
      );
 
      if (publicacionCacheada) {
        setPublicacion(publicacionCacheada);
        setTextoPublicacionEditada(publicacionCacheada.contenido || "");
        setComentarios(comentariosCacheados || []);
        setLoading(false);
      }
 
      await Promise.all([
        cargarPublicacion(idUsuario),
        cargarComentarios(idUsuario),
        cargarBloqueos(idUsuario),
      ]);
    } catch (error) {
      console.log("Error al iniciar detalle publicación:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };
 
  const cargarPublicacion = async (idUsuario = usuarioActualId) => {
    try {
      const query = idUsuario ? `?usuarioId=${idUsuario}` : "";
      const response = await fetch(`${API_URL}/api/publicaciones/${id}${query}`);
      const data = await response.json();
 
      if (!response.ok) {
        alert(data.error || "No se pudo traer la publicación.");
        return;
      }
 
      setPublicacion(data.publicacion);
      setTextoPublicacionEditada(data.publicacion?.contenido || "");
      setCached(`publicacion:${String(id)}`, data.publicacion);
    } catch (error) {
      console.log("Error al cargar publicación:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };
 
  const cargarComentarios = async (idUsuario = usuarioActualId) => {
    try {
      const query = idUsuario ? `?usuarioId=${idUsuario}` : "";
      const response = await fetch(
        `${API_URL}/api/comentarios/publicacion/${id}${query}`
      );
      const data = await response.json();
 
      if (!response.ok) {
        console.log("Error comentarios:", data);
        return;
      }
 
      setComentarios(data.comentarios || []);
      setCached(`comentarios:publicacion:${String(id)}`, data.comentarios || []);
    } catch (error) {
      console.log("Error al cargar comentarios:", error);
    }
  };
 
  const cargarBloqueos = async (idUsuario: string) => {
    try {
      const response = await fetch(`${API_URL}/api/bloqueos/usuario/${idUsuario}`);
      const data = await response.json();
 
      if (!response.ok) {
        console.log("Error al traer bloqueos:", data);
        return;
      }
 
      const ids = (data.bloqueos || [])
        .map((bloqueo: { bloqueadoId: Usuario | string }) =>
          obtenerIdUsuario(bloqueo.bloqueadoId)
        )
        .filter(Boolean) as string[];
 
      setBloqueadosIds(ids);
    } catch (error) {
      console.log("Error al cargar bloqueos:", error);
    }
  };
 
  useAutoRefresh(
    useCallback(() => cargarComentarios(), [id]),
    30000,
    !loading
  );
 
  const obtenerUsuarioSeguro = (usuario?: Usuario | string | null) => {
    if (!usuario || typeof usuario === "string") return null;
    return usuario;
  };
 
  const obtenerEventoSeguro = (evento?: Evento | string | null) => {
    if (!evento || typeof evento === "string") return null;
    return evento;
  };
 
  const obtenerIdUsuario = (usuario?: Usuario | string | null) => {
    if (!usuario) return null;
    if (typeof usuario === "string") return usuario;
    return usuario.id || usuario._id || null;
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
 
  const crearComentario = async () => {
    try {
      if (!nuevoComentario.trim()) {
        alert("Escribí un comentario.");
        return;
      }
 
      if (!usuarioActualId || !id) {
        alert("No se pudo identificar usuario o publicación.");
        return;
      }
 
      const response = await fetch(`${API_URL}/api/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicacionId: String(id),
          usuarioId: usuarioActualId,
          contenido: nuevoComentario.trim(),
        }),
      });
 
      const data = await response.json();
 
      if (!response.ok) {
        alert(data.error || "No se pudo comentar.");
        return;
      }
 
      const comentarioNuevo: Comentario = {
        ...data.comentario,
        usuarioId:
          usuarioActual ||
          ({ _id: usuarioActualId, nombre: "Yo" } as Usuario),
        comentarioPadreId: null,
        createdAt: data.comentario.createdAt || new Date().toISOString(),
      };
 
      setComentarios((prev) => [...prev, comentarioNuevo]);
      removeCached(`comentarios:publicacion:${String(id)}`);
      setNuevoComentario("");
    } catch (error) {
      console.log("Error al comentar:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };
 
  const crearRespuesta = async (comentarioPadreId: string) => {
    try {
      const contenido = respuestas[comentarioPadreId];
 
      if (!contenido || !contenido.trim()) {
        alert("Escribí una respuesta.");
        return;
      }
 
      if (!usuarioActualId || !id) {
        alert("No se pudo identificar usuario o publicación.");
        return;
      }
 
      const response = await fetch(`${API_URL}/api/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicacionId: String(id),
          usuarioId: usuarioActualId,
          comentarioPadreId,
          contenido: contenido.trim(),
        }),
      });
 
      const data = await response.json();
 
      if (!response.ok) {
        alert(data.error || "No se pudo responder.");
        return;
      }
 
      const respuestaNueva: Comentario = {
        ...data.comentario,
        usuarioId:
          usuarioActual ||
          ({ _id: usuarioActualId, nombre: "Yo" } as Usuario),
        comentarioPadreId,
        createdAt: data.comentario.createdAt || new Date().toISOString(),
      };
 
      setComentarios((prev) => [...prev, respuestaNueva]);
      removeCached(`comentarios:publicacion:${String(id)}`);
      setRespuestas((prev) => ({ ...prev, [comentarioPadreId]: "" }));
    } catch (error) {
      console.log("Error al responder:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };
 
  const editarPublicacion = async () => {
    try {
      if (!publicacion || !usuarioActualId) return;
 
      if (!textoPublicacionEditada.trim()) {
        alert("La publicación no puede quedar vacía.");
        return;
      }
 
      setGuardandoPublicacion(true);
 
      const response = await fetch(`${API_URL}/api/publicaciones/${publicacion._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: usuarioActualId,
          contenido: textoPublicacionEditada.trim(),
        }),
      });
 
      const data = await response.json();
 
      if (!response.ok) {
        alert(data.error || "No se pudo editar la publicación.");
        return;
      }
 
      setPublicacion(data.publicacion);
      setTextoPublicacionEditada(data.publicacion?.contenido || "");
      setEditandoPublicacion(false);
      removeCached(`publicacion:${publicacion._id}`);
    } catch (error) {
      console.log("Error editando publicación:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setGuardandoPublicacion(false);
    }
  };
 
  const eliminarPublicacion = async () => {
    try {
      if (!publicacion || !usuarioActualId) return;
 
      setEliminandoPublicacion(true);
 
      const response = await fetch(`${API_URL}/api/publicaciones/${publicacion._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId: usuarioActualId }),
      });
 
      const data = await response.json();
 
      if (!response.ok) {
        alert(data.error || "No se pudo eliminar la publicación.");
        return;
      }
 
      alert("Publicación eliminada correctamente.");
      removeCached(`publicacion:${publicacion._id}`);
      removeCached(`comentarios:publicacion:${publicacion._id}`);
      invalidateCachedByPrefix("publicaciones:evento:");
      router.back();
    } catch (error) {
      console.log("Error eliminando publicación:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setEliminandoPublicacion(false);
    }
  };
 
  const editarComentario = async (comentarioId: string, contenido: string) => {
    try {
      if (!usuarioActualId) return;
 
      if (!contenido.trim()) {
        alert("El comentario no puede quedar vacío.");
        return;
      }
 
      const response = await fetch(`${API_URL}/api/comentarios/${comentarioId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: usuarioActualId,
          contenido: contenido.trim(),
        }),
      });
 
      const data = await response.json();
 
      if (!response.ok) {
        alert(data.error || "No se pudo editar el comentario.");
        return;
      }
 
      setComentarios((prev) =>
        prev.map((comentario) =>
          comentario._id === comentarioId
            ? {
                ...comentario,
                contenido: data.comentario?.contenido || contenido.trim(),
                updatedAt: data.comentario?.updatedAt || new Date().toISOString(),
              }
            : comentario
        )
      );
      removeCached(`comentarios:publicacion:${String(id)}`);
    } catch (error) {
      console.log("Error editando comentario:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };
 
  const eliminarComentario = async (comentarioId: string) => {
    try {
      if (!usuarioActualId) return;
 
      const response = await fetch(`${API_URL}/api/comentarios/${comentarioId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId: usuarioActualId }),
      });
 
      const data = await response.json();
 
      if (!response.ok) {
        alert(data.error || "No se pudo eliminar el comentario.");
        return;
      }
 
      setComentarios((prev) =>
        prev.filter((comentario) => {
          const padre = comentario.comentarioPadreId as any;
          return comentario._id !== comentarioId && padre !== comentarioId;
        })
      );
      removeCached(`comentarios:publicacion:${String(id)}`);
    } catch (error) {
      console.log("Error eliminando comentario:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };
 
  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "";
    return new Date(fecha).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
 
  const comentariosVisibles = comentarios.filter((comentario) => {
    const autorId = obtenerIdUsuario(comentario.usuarioId);
    return !autorId || !bloqueadosIds.includes(autorId);
  });
 
  const comentariosPrincipales = comentariosVisibles.filter((comentario) => {
    const padre = comentario.comentarioPadreId as any;
    return !padre;
  });
 
  if (loading) {
    return <LoadingScreen text="Cargando publicación..." />;
  }
 
  if (!publicacion) {
    return (
      <EmptyState
        title="No se encontró la publicación"
        text="Volvé e intentá entrar nuevamente."
        buttonText="Volver"
        onPress={() => router.back()}
      />
    );
  }
 
  const usuarioPublicacion = obtenerUsuarioSeguro(publicacion.usuarioId);
  const eventoPublicacion = obtenerEventoSeguro(publicacion.eventoId);
  const idAutorPublicacion = obtenerIdUsuario(publicacion.usuarioId);
  const autorBloqueado = !!idAutorPublicacion && bloqueadosIds.includes(idAutorPublicacion);
  const esMiPublicacion = !!usuarioActualId && idAutorPublicacion === usuarioActualId;
  const eventoTerminado = eventoYaPaso(eventoPublicacion?.fecha);
 
  if (autorBloqueado) {
    return (
      <EmptyState
        title="Publicación no disponible"
        text="Esta publicación pertenece a una persona bloqueada."
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
 
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <ProfileAvatarLink usuario={usuarioPublicacion} size={46} />
 
            <View style={styles.postUserInfo}>
              <Text style={styles.postUserName}>
                {usuarioPublicacion?.nombre || "Usuario eliminado"}
              </Text>
              <Text style={styles.postUsername}>
                @{usuarioPublicacion?.nombreUsuario || "usuario_eliminado"}
              </Text>
              <Text style={styles.postDate}>
                {formatearFecha(publicacion.createdAt)}
              </Text>
            </View>
 
            {esMiPublicacion && !editandoPublicacion && (
              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  activeOpacity={0.85}
                  onPress={() => {
                    setTextoPublicacionEditada(publicacion.contenido);
                    setEditandoPublicacion(true);
                  }}
                >
                  <Pencil size={17} color="#7528F0" />
                </TouchableOpacity>
 
                <TouchableOpacity
                  style={styles.deleteActionButton}
                  activeOpacity={0.85}
                  disabled={eliminandoPublicacion}
                  onPress={() =>
                    confirmarAccion(
                      "Eliminar publicación",
                      "¿Estás seguro de que querés eliminar esta publicación? También se eliminarán sus comentarios.",
                      eliminarPublicacion
                    )
                  }
                >
                  <Trash2 size={17} color="#E53935" />
                </TouchableOpacity>
              </View>
            )}
 
            {!esMiPublicacion && !!usuarioActual?.esManager && (
              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.deleteActionButton}
                  activeOpacity={0.85}
                  disabled={eliminandoPublicacion}
                  onPress={() =>
                    confirmarAccion(
                      "Eliminar publicación",
                      "¿Estás seguro de que querés eliminar esta publicación? También se eliminarán sus comentarios.",
                      eliminarPublicacion
                    )
                  }
                >
                  <Trash2 size={17} color="#E53935" />
                </TouchableOpacity>
              </View>
            )}
          </View>
 
          {editandoPublicacion ? (
            <View style={styles.editPostBox}>
              <TextInput
                style={styles.editPostInput}
                value={textoPublicacionEditada}
                onChangeText={setTextoPublicacionEditada}
                multiline
                placeholder="Editar publicación..."
                placeholderTextColor="#A7A7B0"
              />
 
              <View style={styles.editPostActions}>
                <TouchableOpacity
                  style={styles.cancelEditButton}
                  activeOpacity={0.85}
                  disabled={guardandoPublicacion}
                  onPress={() => {
                    setEditandoPublicacion(false);
                    setTextoPublicacionEditada(publicacion.contenido);
                  }}
                >
                  <X size={16} color="#8D8A99" />
                  <Text style={styles.cancelEditText}>Cancelar</Text>
                </TouchableOpacity>
 
                <TouchableOpacity
                  style={styles.saveEditButton}
                  activeOpacity={0.85}
                  disabled={guardandoPublicacion}
                  onPress={editarPublicacion}
                >
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.saveEditText}>
                    {guardandoPublicacion ? "Guardando..." : "Guardar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.postContent}>{publicacion.contenido}</Text>
          )}
 
          {eventoPublicacion?.nombre && (
            <TouchableOpacity
              style={styles.eventTag}
              activeOpacity={0.85}
              onPress={() =>
                router.push(`/event-detail/${eventoPublicacion._id}` as any)
              }
            >
              <Text style={styles.eventTagText}>
                Evento: {eventoPublicacion.nombre}
              </Text>
            </TouchableOpacity>
          )}
        </View>
 
        <Text style={styles.sectionTitle}>Comentarios</Text>
 
        {eventoTerminado ? (
          <View style={styles.comentariosBloqueadosCard}>
            <Text style={styles.comentariosBloqueadosTexto}>
              Este evento ya finalizó. No se puede comentar en publicaciones de eventos pasados.
            </Text>
          </View>
        ) : (
          <View style={styles.mainCommentBox}>
            <ProfileAvatarLink
              usuario={
                usuarioActual ||
                ({ _id: usuarioActualId || "", nombre: "Yo" } as Usuario)
              }
              size={36}
              fallbackToProfile
            />
 
            <TextInput
              style={styles.mainCommentInput}
              placeholder="Escribí un comentario..."
              placeholderTextColor="#A7A7B0"
              value={nuevoComentario}
              onChangeText={setNuevoComentario}
              multiline
            />
 
            <TouchableOpacity
              style={[
                styles.sendButton,
                !nuevoComentario.trim() && styles.sendButtonDisabled,
              ]}
              onPress={crearComentario}
              disabled={!nuevoComentario.trim()}
            >
              <Text style={styles.sendButtonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        )}
 
        {comentariosPrincipales.length === 0 ? (
          <View style={styles.emptyCommentsCard}>
            <MessageCircle size={34} color="#8B35E8" />
            <Text style={styles.emptyCommentsTitle}>
              Todavía no hay comentarios
            </Text>
            <Text style={styles.emptyCommentsText}>
              Sé la primera persona en responder esta publicación.
            </Text>
          </View>
        ) : (
          comentariosPrincipales.map((comentario) => (
            <CommentThread
              key={comentario._id}
              comentario={comentario}
              comentarios={comentariosVisibles}
              usuarioActualId={usuarioActualId}
              respuestasTexto={respuestas}
              onChangeRespuesta={(comentarioId, texto) =>
                setRespuestas((prev) => ({ ...prev, [comentarioId]: texto }))
              }
              onEnviarRespuesta={crearRespuesta}
              onEditarComentario={editarComentario}
              onEliminarComentario={(comentarioId) =>
                confirmarAccion(
                  "Eliminar comentario",
                  "¿Estás seguro de que querés eliminar este comentario?",
                  () => eliminarComentario(comentarioId)
                )
              }
              puedeAdministrar={!!usuarioActual?.esManager}
            />
          ))
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
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 20,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  postUserInfo: {
    marginLeft: 12,
    flex: 1,
  },
  postUserName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#332047",
    marginBottom: 3,
  },
  postUsername: {
    fontSize: 12,
    color: "#8B35E8",
    fontWeight: "800",
    marginBottom: 3,
  },
  postDate: {
    fontSize: 12,
    color: "#8D8A99",
    fontWeight: "700",
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "#F1ECFF",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteActionButton: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "#FFF1F2",
    alignItems: "center",
    justifyContent: "center",
  },
  postContent: {
    fontSize: 18,
    color: "#332047",
    lineHeight: 27,
    marginBottom: 16,
  },
  editPostBox: {
    marginBottom: 16,
  },
  editPostInput: {
    minHeight: 90,
    backgroundColor: "#F7F5FF",
    borderRadius: 18,
    padding: 14,
    fontSize: 16,
    color: "#332047",
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#E0D9F4",
    outlineStyle: "none" as any,
  },
  editPostActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 10,
  },
  cancelEditButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F6FB",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  cancelEditText: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: "800",
    color: "#8D8A99",
  },
  saveEditButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B35E8",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  saveEditText: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  eventTag: {
    alignSelf: "flex-start",
    backgroundColor: "#F1ECFF",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  eventTagText: {
    color: "#7528F0",
    fontSize: 12,
    fontWeight: "900",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#332047",
    marginBottom: 12,
  },
  comentariosBloqueadosCard: {
    backgroundColor: "#FFF8EC",
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFE0A0",
    alignItems: "center",
  },
  comentariosBloqueadosTexto: {
    fontSize: 13,
    color: "#A07800",
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 19,
  },
  mainCommentBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0D9F4",
  },
  mainCommentInput: {
    flex: 1,
    minHeight: 44,
    marginLeft: 10,
    marginRight: 8,
    fontSize: 14,
    color: "#332047",
    textAlignVertical: "top",
    outlineStyle: "none" as any,
  },
  sendButton: {
    backgroundColor: "#8B35E8",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  emptyCommentsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  emptyCommentsTitle: {
    marginTop: 10,
    fontSize: 16,
    color: "#332047",
    fontWeight: "900",
  },
  emptyCommentsText: {
    marginTop: 6,
    fontSize: 13,
    color: "#8D8A99",
    textAlign: "center",
    lineHeight: 19,
  },
});