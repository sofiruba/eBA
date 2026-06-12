import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  LogOut,
  Mail,
  Calendar,
  Heart,
  Pencil,
  MapPin,
  AtSign,
} from "lucide-react-native";

import BottomNav from "../components/BottomNav";
import Logo from "../components/Logo";
import LoadingScreen from "../components/LoadingScreen";
import UserAvatar from "../components/UserAvatar";
import SectionHeader from "../components/SectionHeader";

import { Usuario } from "../types/Usuario";

export default function ProfileScreen() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargarUsuario();
    }, [])
  );

  const cargarUsuario = async () => {
    try {
      const usuarioGuardado = await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado) {
        router.replace("/login" as any);
        return;
      }

      const usuarioParseado = JSON.parse(usuarioGuardado);
      setUsuario(usuarioParseado);
    } catch (error) {
      console.log("Error al cargar usuario:", error);
      router.replace("/login" as any);
    } finally {
      setLoading(false);
    }
  };

  const irAEditarPerfil = () => {
    router.push("/edit-profile" as any);
  };

  const cerrarSesion = async () => {
    await AsyncStorage.removeItem("usuario");
    await AsyncStorage.removeItem("token");
    router.replace("/login" as any);
  };

  if (loading) {
    return <LoadingScreen text="Cargando perfil..." />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <Logo size="medium" />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi perfil</Text>

          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.85}
            onPress={irAEditarPerfil}
          >
            <Pencil size={18} color="#7528F0" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <UserAvatar usuario={usuario || undefined} size={112} />

          <Text style={styles.name}>
            {usuario?.nombre || "Usuario"}
            {usuario?.edad ? `, ${usuario.edad}` : ""}
          </Text>

          <Text style={styles.username}>
            @{usuario?.nombreUsuario || "usuario"}
          </Text>

          <Text style={styles.bio}>
            {usuario?.bio || "Todavía no agregaste una bio."}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <SectionHeader title="Información personal" />

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <AtSign size={20} color="#7528F0" />
            </View>

            <View style={styles.infoTextBox}>
              <Text style={styles.infoLabel}>Nombre de usuario</Text>
              <Text style={styles.infoValue}>
                @{usuario?.nombreUsuario || "usuario"}
              </Text>
            </View>
          </View>

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
            <View style={styles.iconBox}>
              <MapPin size={20} color="#7528F0" />
            </View>

            <View style={styles.infoTextBox}>
              <Text style={styles.infoLabel}>Ubicación</Text>
              <Text style={styles.infoValue}>
                {usuario?.ubicacionAproximada || "Sin ubicación cargada"}
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
          <SectionHeader title="Tus intereses" />

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
  name: {
    fontSize: 26,
    fontWeight: "800",
    color: "#332047",
    marginTop: 12,
    textAlign: "center",
  },
  username: {
    fontSize: 14,
    color: "#7528F0",
    fontWeight: "800",
    marginTop: 4,
    marginBottom: 8,
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