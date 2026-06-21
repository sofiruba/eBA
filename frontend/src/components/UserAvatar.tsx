import { View, Text, Image, StyleSheet } from "react-native";
import { Usuario } from "../types/Usuario";

type UserAvatarProps = {
  usuario?: Usuario | null;
  size?: number;
};

export default function UserAvatar({ usuario, size = 42 }: UserAvatarProps) {
  const obtenerInicial = () => {
    if (!usuario?.nombre) return "?";
    return usuario.nombre.trim().charAt(0).toUpperCase();
  };

  const avatarTextSize = Math.max(14, Math.round(size * 0.42));

  const fotoPerfil = usuario?.fotoPerfilMini || usuario?.fotoPerfil;

  if (fotoPerfil) {
    return (
      <Image
        source={{ uri: fotoPerfil }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          marginRight: 14,
        }}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatarFallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: avatarTextSize }]}>
        {obtenerInicial()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarFallback: {
    backgroundColor: "#8B35E8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
});
