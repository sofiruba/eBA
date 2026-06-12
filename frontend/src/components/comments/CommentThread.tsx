import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import UserAvatar from "../UserAvatar";
import { Comentario } from "../../types/Social";

type Props = {
  comentario: Comentario;
  comentarios: Comentario[];
  respuestasTexto: Record<string, string>;
  onChangeRespuesta: (comentarioId: string, texto: string) => void;
  onEnviarRespuesta: (comentarioId: string) => void;
  profundidad?: number;
};

export default function CommentThread({
  comentario,
  comentarios,
  respuestasTexto,
  onChangeRespuesta,
  onEnviarRespuesta,
  profundidad = 0,
}: Props) {
  const [respondiendo, setRespondiendo] = useState(false);

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "";

    return new Date(fecha).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const obtenerIdPadre = (comentarioItem: Comentario) => {
    const padre = comentarioItem.comentarioPadreId as any;

    if (!padre) return null;
    if (typeof padre === "string") return padre;

    return padre._id;
  };

  const respuestasDelComentario = comentarios.filter(
    (item) => obtenerIdPadre(item) === comentario._id
  );

  const textoRespuesta = respuestasTexto[comentario._id] || "";

  return (
    <View style={[styles.thread, profundidad > 0 && styles.threadReply]}>
      <View style={[styles.commentCard, profundidad > 0 && styles.replyCard]}>
        <View style={styles.header}>
          <UserAvatar
            usuario={comentario.usuarioId}
            size={profundidad > 0 ? 30 : 36}
          />

          <View style={styles.info}>
            <Text style={styles.userName}>
              {comentario.usuarioId?.nombre || "Usuario"}
            </Text>

            <Text style={styles.username}>
              @{comentario.usuarioId?.nombreUsuario || "usuario"}
            </Text>

            <Text style={styles.date}>
              {formatearFecha(comentario.createdAt)}
            </Text>
          </View>
        </View>

        <Text style={styles.commentText}>{comentario.contenido}</Text>

        <TouchableOpacity onPress={() => setRespondiendo(!respondiendo)}>
          <Text style={styles.replyText}>
            {respondiendo ? "Cancelar" : "Responder"}
          </Text>
        </TouchableOpacity>

        {respondiendo && (
          <View style={styles.replyInputRow}>
            <TextInput
              style={styles.replyInput}
              placeholder={`Responder a @${
                comentario.usuarioId?.nombreUsuario || "usuario"
              }...`}
              placeholderTextColor="#A7A7B0"
              value={textoRespuesta}
              onChangeText={(texto) => onChangeRespuesta(comentario._id, texto)}
            />

            <TouchableOpacity
              style={[
                styles.replyButton,
                !textoRespuesta.trim() && styles.disabled,
              ]}
              onPress={() => {
                onEnviarRespuesta(comentario._id);
                setRespondiendo(false);
              }}
              disabled={!textoRespuesta.trim()}
            >
              <Text style={styles.replyButtonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {respuestasDelComentario.length > 0 && (
        <View style={styles.childrenContainer}>
          {respuestasDelComentario.map((respuesta) => (
            <CommentThread
              key={respuesta._id}
              comentario={respuesta}
              comentarios={comentarios}
              respuestasTexto={respuestasTexto}
              onChangeRespuesta={onChangeRespuesta}
              onEnviarRespuesta={onEnviarRespuesta}
              profundidad={profundidad + 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  thread: {
    marginBottom: 14,
  },
  threadReply: {
    marginTop: 8,
    marginLeft: 22,
  },
  commentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  replyCard: {
    borderColor: "#EFE8FF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  info: {
    marginLeft: 10,
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: "900",
    color: "#332047",
  },
  username: {
    fontSize: 11,
    color: "#8B35E8",
    fontWeight: "800",
    marginTop: 1,
  },
  date: {
    fontSize: 11,
    color: "#8D8A99",
    fontWeight: "700",
    marginTop: 1,
  },
  commentText: {
    fontSize: 14,
    color: "#332047",
    lineHeight: 20,
    marginBottom: 8,
  },
  replyText: {
    color: "#8B35E8",
    fontSize: 12,
    fontWeight: "900",
  },
  replyInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  replyInput: {
    flex: 1,
    height: 38,
    borderRadius: 18,
    backgroundColor: "#F7F5FF",
    borderWidth: 1,
    borderColor: "#E0D9F4",
    paddingHorizontal: 12,
    fontSize: 12,
    color: "#332047",
    marginRight: 8,
    outlineStyle: "none" as any,
  },
  replyButton: {
    height: 38,
    borderRadius: 18,
    backgroundColor: "#8B35E8",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.45,
  },
  replyButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  childrenContainer: {
    marginTop: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#E7D9FF",
    paddingLeft: 10,
  },
});