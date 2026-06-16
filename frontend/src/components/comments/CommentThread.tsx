import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { MessageCircle, Pencil, Trash2, Check, X } from "lucide-react-native";

import UserAvatar from "../UserAvatar";
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
    <View style={styles.threadContainer}>
      <View style={styles.commentCard}>
        <View style={styles.commentHeader}>
          <UserAvatar usuario={usuarioComentario} size={34} />

          <View style={styles.commentUserInfo}>
            <Text style={styles.commentUserName}>
              {usuarioComentario?.nombre || "Usuario eliminado"}
            </Text>

            <Text style={styles.commentUsername}>
              @{usuarioComentario?.nombreUsuario || "usuario_eliminado"}
            </Text>

            <Text style={styles.commentDate}>
              {formatearFecha(comentario.createdAt)}
            </Text>
          </View>

          {esMiComentario && !editando && (
            <View style={styles.commentActions}>
              <TouchableOpacity
                style={styles.commentActionButton}
                activeOpacity={0.85}
                onPress={() => {
                  setTextoEditado(comentario.contenido || "");
                  setEditando(true);
                }}
              >
                <Pencil size={14} color="#7528F0" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.commentDeleteButton}
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
          <Text style={styles.commentText}>{comentario.contenido}</Text>
        )}

        {!editando && !!usuarioComentario && (
          <TouchableOpacity
            style={styles.replyButton}
            activeOpacity={0.85}
            onPress={() => setMostrarRespuesta(!mostrarRespuesta)}
          >
            <MessageCircle size={14} color="#8B35E8" />
            <Text style={styles.replyButtonText}>
              {mostrarRespuesta ? "Cancelar respuesta" : "Responder"}
            </Text>
          </TouchableOpacity>
        )}

        {mostrarRespuesta && (
          <View style={styles.replyInputBox}>
            <TextInput
              style={styles.replyInput}
              placeholder="Escribí una respuesta..."
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
      </View>

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
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  threadContainer: {
    marginBottom: 12,
  },
  commentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  commentUserInfo: {
    marginLeft: 10,
    flex: 1,
  },
  commentUserName: {
    fontSize: 13,
    fontWeight: "900",
    color: "#2D2934",
  },
  commentUsername: {
    fontSize: 11,
    color: "#8B35E8",
    fontWeight: "800",
    marginTop: 2,
  },
  commentDate: {
    fontSize: 10,
    color: "#8D8A99",
    fontWeight: "700",
    marginTop: 2,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  commentActionButton: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: "#F1ECFF",
    alignItems: "center",
    justifyContent: "center",
  },
  commentDeleteButton: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: "#FFF1F2",
    alignItems: "center",
    justifyContent: "center",
  },
  commentText: {
    fontSize: 14,
    color: "#332047",
    lineHeight: 20,
  },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    alignSelf: "flex-start",
  },
  replyButtonText: {
    marginLeft: 5,
    color: "#8B35E8",
    fontSize: 12,
    fontWeight: "900",
  },
  replyInputBox: {
    marginTop: 12,
    backgroundColor: "#F7F5FF",
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E0D9F4",
  },
  replyInput: {
    minHeight: 38,
    fontSize: 13,
    color: "#332047",
    textAlignVertical: "top",
    outlineStyle: "none" as any,
  },
  replySendButton: {
    alignSelf: "flex-end",
    marginTop: 8,
    backgroundColor: "#8B35E8",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
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
    marginLeft: 26,
    marginTop: 10,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: "#E0D9F4",
  },
  editCommentBox: {
    marginTop: 4,
  },
  editCommentInput: {
    minHeight: 58,
    backgroundColor: "#F7F5FF",
    borderRadius: 16,
    padding: 10,
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