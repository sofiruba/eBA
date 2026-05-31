import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LogOut, Mail, Calendar, Heart, Pencil } from "lucide-react-native";

import BottomNav from "../components/BottomNav";

type Usuario = {
  id?: string;
  _id?: string;
  nombre?: string;
  email?: string;
  edad?: number;
  intereses?: string[];
  bio?: string;
  instagram?: string;
  fotoPerfil?: string;
};

export default function ProfileScreen() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const usuarioGuardado = await AsyncStorage.getItem("usuario");

        if (!usuarioGuardado) {
          router.replace("/login" as any);
          return;
        }

        const usuarioParseado = JSON.parse(usuarioGuardado);
        console.log("Usuario en perfil:", usuarioParseado);

        setUsuario(usuarioParseado);
      } catch (error) {
        console.log("Error al cargar usuario:", error);
        router.replace("/login" as any);
      } finally {
        setLoading(false);
      }
    };

    cargarUsuario();
  }, []);

  const cerrarSesion = async () => {
    await AsyncStorage.removeItem("usuario");
    await AsyncStorage.removeItem("token");
    router.replace("/login" as any);
  };

  const obtenerInicial = () => {
    if (!usuario?.nombre) return "U";
    return usuario.nombre.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#7528F0" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi perfil</Text>

          <TouchableOpacity style={styles.editButton} activeOpacity={0.85}>
            <Pencil size={18} color="#7528F0" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          {usuario?.fotoPerfil ? (
            <Image
              source={{ uri: usuario.fotoPerfil }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>{obtenerInicial()}</Text>
            </View>
          )}

          <Text style={styles.name}>
            {usuario?.nombre || "Usuario"}
            {usuario?.edad ? `, ${usuario.edad}` : ""}
          </Text>

          <Text style={styles.bio}>
            {usuario?.bio ||
              "Todavía no agregaste una bio. Más adelante vas a poder editar tu perfil."}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Información personal</Text>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Mail size={20} color="#7528F0" />
            </View>

            <View style={styles.infoTextBox}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>
                {usuario?.email || "Sin email cargado"}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Calendar size={20} color="#7528F0" />
            </View>

            <View style={styles.infoTextBox}>
              <Text style={styles.infoLabel}>Edad</Text>
              <Text style={styles.infoValue}>
                {usuario?.edad ? `${usuario.edad} años` : "Sin edad cargada"}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            

            <View style={styles.infoTextBox}>
              <Text style={styles.infoLabel}>Instagram</Text>
              <Text style={styles.infoValue}>
                {usuario?.instagram || "No agregado"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Tus intereses</Text>

          {usuario?.intereses && usuario.intereses.length > 0 ? (
            <View style={styles.chipsContainer}>
              {usuario.intereses.map((interes) => (
                <View key={interes} style={styles.chip}>
                  <Heart size={13} color="#7528F0" fill="#7528F0" />
                  <Text style={styles.chipText}>{interes}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>
              Todavía no tenés intereses cargados.
            </Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Actividad</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Eventos</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Favoritos</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Conexiones</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.85}
          onPress={cerrarSesion}
        >
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
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
  loadingScreen: {
    flex: 1,
    backgroundColor: "#F4F6FB",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#6F6D7A",
    fontWeight: "600",
  },
  container: {
    paddingHorizontal: 28,
    paddingTop: 70,
    paddingBottom: 130,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#332047",
  },
  editButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#F1ECFF",
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    marginBottom: 16,
  },
  avatarFallback: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#7528F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarLetter: {
    fontSize: 44,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  name: {
    fontSize: 26,
    fontWeight: "800",
    color: "#332047",
    marginBottom: 8,
    textAlign: "center",
  },
  bio: {
    fontSize: 14,
    color: "#7B7785",
    textAlign: "center",
    lineHeight: 21,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#332047",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F1ECFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  infoTextBox: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: "#8D8A99",
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D2934",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1ECFF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: "#7528F0",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 6,
    textTransform: "capitalize",
  },
  emptyText: {
    fontSize: 14,
    color: "#8D8A99",
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "900",
    color: "#7528F0",
  },
  statLabel: {
    fontSize: 12,
    color: "#8D8A99",
    marginTop: 4,
  },
  logoutButton: {
    height: 54,
    borderRadius: 18,
    backgroundColor: "#FFF1F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 8,
  },
});