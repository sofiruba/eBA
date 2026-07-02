import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Check, MessageCircle, Pencil, Trash2, X } from "lucide-react-native";
 
import ProfileAvatarLink from "../ProfileAvatarLink";
import ProfileTextLink from "../ProfileTextLink";
import { Comentario } from "../../types/Social";
import { Usuario } from "../../types/Usuario";
 
type Props = {
  comentario: Comentario;
  comentarios: Comentario[];
  usuarioActualId?: string | null;
  respuestasTexto: Record<string, string>;
  onChangeRespuesta: (comentarioId: string, texto: string) => void;
  onEnviarRespuesta: (comentarioPadreId: string) => void;
  onEditarComentario: (comentarioId: string, contenido: string) => void;
  onEliminarComentario: (comentarioId: string) => void;
  puedeAdministrar?: boolean;
  depth?: number;
};
 
export default function CommentThread({
  comentario,
  comentarios,
  usuarioActualId,
  respuestasTexto,
  onChangeRespuesta,
  onEnviarRespuesta,
  onEditarComentario,
  onEliminarComentario,
  puedeAdministrar = false,
  depth = 0,
}: Props) {
  const [mostrarRespuesta, setMostrarRespuesta] = useState(false);
  const [editando, setEditando] = useState(false);
  const [textoEditado, setTextoEditado] = useState(comentario.contenido || "");
 
  const obtenerUsuarioSeguro = (usuario?: Usuario | string | null) => {
    if (!usuario || typeof usuario === "string") return null;
    return usuario;
  };
 
  const obtenerUsuarioId = (usuario?: Usuario | string | null) => {
    if (!usuario) return null;
    if (typeof usuario === "string") return usuario;
    return usuario.id || usuario._id || null;
  };
 
  const usuarioComentario = obtenerUsuarioSeguro(comentario.usuarioId);
  const idAutorComentario = obtenerUsuarioId(comentario.usuarioId);
  const esMiComentario =
    !!usuarioActualId && !!idAutorComentario && usuarioActualId === idAutorComentario;
 
  const respuestas = comentarios.filter((item) => {
    const padre = item.comentarioPadreId as any;
    return padre === comentario._id;
  });
 
  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "";
 
    return new Date(fecha).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
 
  // Renderiza el texto del comentario resaltando cada @mención en violeta.
  const renderContenido = (texto: string) => {
    const partes = texto.split(/(@[a-zA-Z0-9_]+)/g);
    return (
      <Text style={styles.commentText}>
        {partes.map((parte, index) =>
          parte.startsWith("@") ? (
            <Text key={index} style={styles.mention}>
              {parte}
            </Text>
          ) : (
            parte
          )
        )}
      </Text>
    );
  };
 
  const guardarEdicion = () => {
    if (!textoEditado.trim()) {
      alert("El comentario no puede quedar vacío.");
      return;
    }
 
    onEditarComentario(comentario._id, textoEditado.trim());
    setEditando(false);
  };
 
  const cancelarEdicion = () => {
    setTextoEditado(comentario.contenido || "");
    setEditando(false);
  };
 
  return (
    <View style={[styles.threadContainer, depth > 0 && styles.replyThread]}>
      <View style={styles.avatarColumn}>
        <ProfileAvatarLink usuario={comentario.usuarioId} size={depth > 0 ? 32 : 40} />
        {respuestas.length > 0 && <View style={styles.threadLine} />}
      </View>
 
      <View style={styles.contentColumn}>
        <View style={styles.commentBubble}>
          <View style={styles.commentHeader}>
            <View style={styles.commentUserInfo}>
              <ProfileTextLink usuario={comentario.usuarioId}>
                <Text style={styles.commentUserName}>
                  {usuarioComentario?.nombre || "Usuario eliminado"}
                </Text>
              </ProfileTextLink>
 
              <ProfileTextLink usuario={comentario.usuarioId}>
                <Text style={styles.commentMeta}>
                  @{usuarioComentario?.nombreUsuario || "usuario_eliminado"} ·{" "}
                  {formatearFecha(comentario.createdAt)}
                </Text>
              </ProfileTextLink>
            </View>
 
            {esMiComentario && !editando && (
              <View style={styles.commentActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  activeOpacity={0.85}
                  onPress={() => {
                    setTextoEditado(comentario.contenido || "");
                    setEditando(true);
                  }}
                >
                  <Pencil size={14} color="#7528F0" />
                </TouchableOpacity>
 
                <TouchableOpacity
                  style={[styles.iconButton, styles.deleteButton]}
                  activeOpacity={0.85}
                  onPress={() => onEliminarComentario(comentario._id)}
                >
                  <Trash2 size={14} color="#E53935" />
                </TouchableOpacity>
              </View>
            )}
 
            {!esMiComentario && puedeAdministrar && !editando && (
              <View style={styles.commentActions}>
                <TouchableOpacity
                  style={[styles.iconButton, styles.deleteButton]}
                  activeOpacity={0.85}
                  onPress={() => onEliminarComentario(comentario._id)}
                >
                  <Trash2 size={14} color="#E53935" />
                </TouchableOpacity>
              </View>
            )}
          </View>
 
          {editando ? (
            <View style={styles.editCommentBox}>
              <TextInput
                style={styles.editCommentInput}
                value={textoEditado}
                onChangeText={setTextoEditado}
                multiline
                placeholder="Editar comentario..."
                placeholderTextColor="#A7A7B0"
              />
 
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelEditButton}
                  activeOpacity={0.85}
                  onPress={cancelarEdicion}
                >
                  <X size={14} color="#8D8A99" />
                  <Text style={styles.cancelEditText}>Cancelar</Text>
                </TouchableOpacity>
 
                <TouchableOpacity
                  style={styles.saveEditButton}
                  activeOpacity={0.85}
                  onPress={guardarEdicion}
                >
                  <Check size={14} color="#FFFFFF" />
                  <Text style={styles.saveEditText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            renderContenido(comentario.contenido || "")
          )}
 
          {!editando && !!usuarioComentario && (
            <TouchableOpacity
              style={styles.replyButton}
              activeOpacity={0.85}
              onPress={() => setMostrarRespuesta(!mostrarRespuesta)}
            >
              <MessageCircle size={15} color="#6F6D7A" />
              <Text style={styles.replyButtonText}>
                {mostrarRespuesta ? "Cancelar" : "Responder"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
 
        {mostrarRespuesta && (
          <View style={styles.replyInputBox}>
            <TextInput
              style={styles.replyInput}
              placeholder="Responder en el hilo..."
              placeholderTextColor="#A7A7B0"
              value={respuestasTexto[comentario._id] || ""}
              onChangeText={(texto) => onChangeRespuesta(comentario._id, texto)}
              multiline
            />
 
            <TouchableOpacity
              style={[
                styles.replySendButton,
                !(respuestasTexto[comentario._id] || "").trim() &&
                  styles.replySendButtonDisabled,
              ]}
              activeOpacity={0.85}
              disabled={!(respuestasTexto[comentario._id] || "").trim()}
              onPress={() => {
                onEnviarRespuesta(comentario._id);
                setMostrarRespuesta(false);
              }}
            >
              <Text style={styles.replySendButtonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        )}
 
        {respuestas.length > 0 && (
          <View style={styles.repliesContainer}>
            {respuestas.map((respuesta) => (
              <CommentThread
                key={respuesta._id}
                comentario={respuesta}
                comentarios={comentarios}
                usuarioActualId={usuarioActualId}
                respuestasTexto={respuestasTexto}
                onChangeRespuesta={onChangeRespuesta}
                onEnviarRespuesta={onEnviarRespuesta}
                onEditarComentario={onEditarComentario}
                onEliminarComentario={onEliminarComentario}
                puedeAdministrar={puedeAdministrar}
                depth={depth + 1}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
 
const styles = StyleSheet.create({
  threadContainer: {
    flexDirection: "row",
    marginBottom: 18,
  },
  replyThread: {
    marginBottom: 14,
  },
  avatarColumn: {
    width: 44,
    alignItems: "center",
  },
  threadLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#E6DFF6",
    marginTop: 8,
    borderRadius: 2,
  },
  contentColumn: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  commentUserInfo: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: "900",
    color: "#2D2934",
    marginBottom: 2,
  },
  commentMeta: {
    fontSize: 11,
    color: "#8D8A99",
    fontWeight: "700",
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F1ECFF",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    backgroundColor: "#FFF1F2",
  },
  commentText: {
    fontSize: 15,
    color: "#332047",
    lineHeight: 22,
  },
  mention: {
    color: "#8B35E8",
    fontWeight: "700",
  },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    alignSelf: "flex-start",
  },
  replyButtonText: {
    marginLeft: 6,
    color: "#6F6D7A",
    fontSize: 12,
    fontWeight: "900",
  },
  replyInputBox: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E0D9F4",
  },
  replyInput: {
    minHeight: 42,
    fontSize: 14,
    color: "#332047",
    textAlignVertical: "top",
    outlineStyle: "none" as any,
  },
  replySendButton: {
    alignSelf: "flex-end",
    marginTop: 8,
    backgroundColor: "#8B35E8",
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  replySendButtonDisabled: {
    opacity: 0.45,
  },
  replySendButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  repliesContainer: {
    marginTop: 12,
  },
  editCommentBox: {
    marginTop: 4,
  },
  editCommentInput: {
    minHeight: 62,
    backgroundColor: "#F7F5FF",
    borderRadius: 16,
    padding: 11,
    fontSize: 14,
    color: "#332047",
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#E0D9F4",
    outlineStyle: "none" as any,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    gap: 8,
  },
  cancelEditButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F6FB",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  cancelEditText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "800",
    color: "#8D8A99",
  },
  saveEditButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B35E8",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  saveEditText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
 