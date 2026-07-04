import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, usePathname } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CalendarDays,
  Home,
  IdCard,
  LogOut,
  MessageCircle,
  PlusCircle,
  ShieldCheck,
  User,
  Users,
} from "lucide-react-native";

import Logo from "./Logo";
import { Usuario } from "../types/Usuario";
import { obtenerUsuarioActualizado } from "../utils/usuario";

const NAV_ITEMS_USUARIO = [
  {
    label: "Home",
    route: "/home",
    icon: Home,
    matches: ["/home", "/explore", "/event-detail", "/event-people"],
  },
  {
    label: "Chats",
    route: "/chats",
    icon: MessageCircle,
    matches: ["/chats", "/chat"],
  },
  {
    label: "Conexiones",
    route: "/connections",
    icon: Users,
    matches: ["/connections", "/user-profile"],
  },
  {
    label: "eBA Organizadores",
    route: "/ser-organizador",
    icon: IdCard,
    matches: ["/ser-organizador"],
  },
  {
    label: "Perfil",
    route: "/profile",
    icon: User,
    matches: ["/profile", "/edit-profile", "/favorites", "/notifications"],
  },
];

const NAV_ITEMS_ORGANIZADOR = [
  {
    label: "Home",
    route: "/home",
    icon: Home,
    matches: ["/home", "/explore", "/event-detail", "/event-people"],
  },
  {
    label: "Chats",
    route: "/chats",
    icon: MessageCircle,
    matches: ["/chats", "/chat"],
  },
  {
    label: "Conexiones",
    route: "/connections",
    icon: Users,
    matches: ["/connections", "/user-profile"],
  },
  {
    label: "Mis eventos",
    route: "/mis-eventos",
    icon: CalendarDays,
    matches: ["/mis-eventos", "/crear-evento"],
  },
  {
    label: "Perfil",
    route: "/profile",
    icon: User,
    matches: ["/profile", "/edit-profile", "/favorites", "/notifications"],
  },
];

const NAV_ITEMS_MANAGER = [
  {
    label: "Home",
    route: "/home",
    icon: Home,
    matches: ["/home", "/explore", "/event-detail", "/event-people"],
  },
  {
    label: "Crear evento",
    route: "/crear-evento",
    icon: PlusCircle,
    matches: ["/crear-evento"],
  },
  {
    label: "Verificación",
    route: "/manager",
    icon: ShieldCheck,
    matches: ["/manager"],
  },
  {
    label: "Organizadores",
    route: "/manager/organizadores",
    icon: IdCard,
    matches: ["/manager/organizadores"],
  },
  {
    label: "Perfil",
    route: "/profile",
    icon: User,
    matches: ["/profile", "/edit-profile", "/favorites", "/notifications"],
  },
];

export default function DesktopNav() {
  const pathname = usePathname();
  const [esManager, setEsManager] = useState(false);
  const [esOrganizador, setEsOrganizador] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);

  useEffect(() => {
    obtenerUsuarioActualizado().then((usuario) => {
      if (!usuario) return;

      setUsuarioActual(usuario);
      setEsManager(!!usuario.esManager);
      setEsOrganizador(!!usuario.esOrganizador);
    });
  }, [pathname]);

  const cerrarSesion = async () => {
    await AsyncStorage.removeItem("usuario");
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("favoritos");
    router.replace("/login" as any);
  };

  const items = esManager
    ? NAV_ITEMS_MANAGER
    : esOrganizador
    ? NAV_ITEMS_ORGANIZADOR
    : NAV_ITEMS_USUARIO;

  const rutaActiva = items.reduce(
    (mejor, item) => {
      const match = item.matches.find(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      );

      if (match && match.length > mejor.length) return item.route;
      return mejor;
    },
    ""
  );

  return (
    <View style={styles.sidebar}>
      <View>
        <View style={styles.logoBox}>
          <Logo size="medium" centered={false} />
        </View>

        <View style={styles.items}>
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.route === rutaActiva;

            return (
              <TouchableOpacity
                key={item.route}
                style={[styles.item, active && styles.itemActive]}
                activeOpacity={0.85}
                onPress={() => router.push(item.route as any)}
              >
                <Icon
                  size={22}
                  color={active ? "#6D28E8" : "#5E586E"}
                  fill={active && item.route === "/home" ? "#6D28E8" : "transparent"}
                />
                <Text style={[styles.label, active && styles.labelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.profilePanel}>
        <TouchableOpacity
          style={styles.profileRow}
          activeOpacity={0.85}
          onPress={() => router.push("/profile" as any)}
        >
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {(usuarioActual?.nombre || "U").charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.profileTextBox}>
            <Text style={styles.profileName} numberOfLines={1}>
              {usuarioActual?.nombre || "Usuario"}
            </Text>
            <Text style={styles.profileUser} numberOfLines={1}>
              @{usuarioActual?.nombreUsuario || "perfil"}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.85}
          onPress={cerrarSesion}
        >
          <LogOut size={16} color="#E53935" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 230,
    minHeight: "100vh" as any,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingTop: 24,
    paddingBottom: 24,
    zIndex: 50,
    position: "sticky" as any,
    top: 0,
    justifyContent: "space-between",
  },
  logoBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8E2F8",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 2,
    marginBottom: 12,
  },
  items: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E8E2F8",
    padding: 10,
    gap: 6,
  },
  item: {
    minHeight: 48,
    borderRadius: 15,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  itemActive: {
    backgroundColor: "#F1ECFF",
  },
  label: {
    marginLeft: 10,
    fontSize: 13,
    fontWeight: "800",
    color: "#5E586E",
  },
  labelActive: {
    color: "#332047",
    fontWeight: "900",
  },
  profilePanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E8E2F8",
    padding: 10,
  },
  profileRow: {
    minHeight: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  profileAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#6D28E8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  profileAvatarText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  profileTextBox: {
    flex: 1,
  },
  profileName: {
    color: "#332047",
    fontSize: 13,
    fontWeight: "900",
  },
  profileUser: {
    marginTop: 2,
    color: "#8D8A99",
    fontSize: 11,
    fontWeight: "800",
  },
  logoutButton: {
    minHeight: 38,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF3F5",
    marginTop: 8,
  },
  logoutText: {
    color: "#E53935",
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 6,
  },
});
