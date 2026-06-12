import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MessageCircle } from "lucide-react-native";
import UserAvatar from "../UserAvatar";
import { Publicacion } from "../../types/Social";

type Props = {
  publicacion: Publicacion;
  comentariosCount?: number;
  onPress: () => void;
};

export default function PublicationPreviewCard({
  publicacion,
  comentariosCount = 0,
  onPress,
}: Props) {
  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "";

    return new Date(fecha).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={onPress}>
      <View style={styles.header}>
        <UserAvatar usuario={publicacion.usuarioId} size={38} />

        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {publicacion.usuarioId?.nombre || "Usuario"}
          </Text>

          <Text style={styles.username}>
            @{publicacion.usuarioId?.nombreUsuario || "usuario"}
          </Text>

          <Text style={styles.date}>{formatearFecha(publicacion.createdAt)}</Text>
        </View>
      </View>

      <Text style={styles.content} numberOfLines={3}>
        {publicacion.contenido}
      </Text>

      <View style={styles.footer}>
        <MessageCircle size={16} color="#8B35E8" />
        <Text style={styles.footerText}>
          {comentariosCount}{" "}
          {comentariosCount === 1 ? "comentario" : "comentarios"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  userInfo: {
    marginLeft: 10,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "900",
    color: "#2D2934",
  },
  username: {
    fontSize: 12,
    color: "#8B35E8",
    fontWeight: "800",
    marginTop: 2,
  },
  date: {
    fontSize: 11,
    color: "#8D8A99",
    fontWeight: "700",
    marginTop: 2,
  },
  content: {
    fontSize: 14,
    color: "#332047",
    lineHeight: 21,
    marginBottom: 14,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0ECFA",
    paddingTop: 12,
  },
  footerText: {
    marginLeft: 6,
    color: "#8B35E8",
    fontSize: 12,
    fontWeight: "900",
  },
});