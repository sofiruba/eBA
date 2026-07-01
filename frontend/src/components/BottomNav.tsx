import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router, usePathname } from "expo-router";
import {
  Home,
  MessageCircle,
  Users,
  User,
  PlusCircle,
  ShieldCheck,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    label: "Perfil",
    route: "/profile",
    icon: User,
    matches: ["/profile", "/edit-profile", "/favorites", "/notifications"],
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [esManager, setEsManager] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("usuario").then((usuarioGuardado) => {
      if (!usuarioGuardado) return;

      try {
        const usuario = JSON.parse(usuarioGuardado);
        setEsManager(!!usuario.esManager);
      } catch (error) {
        console.log("Error leyendo usuario en BottomNav:", error);
      }
    });
  }, [pathname]);

  const items = esManager ? NAV_ITEMS_MANAGER : NAV_ITEMS_USUARIO;

  const isActive = (matches: string[]) => {
    return matches.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  };

  return (
    <View style={styles.navbar}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.matches);

        return (
          <TouchableOpacity
            key={item.route}
            style={styles.navItem}
            activeOpacity={0.85}
            onPress={() => router.push(item.route as any)}
          >
            <Icon
              size={21}
              color={active ? "#6D28E8" : "#8F8B9C"}
              fill={active && item.route !== "/profile" ? "#6D28E8" : "transparent"}
            />
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    position: "absolute",
    bottom: 22,
    left: 18,
    right: 18,
    height: 70,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.96)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "#E8E2F8",
    boxShadow: "0px 12px 30px rgba(65,34,114,0.14)" as any,
  },
  navItem: {
    flex: 1,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "800",
    color: "#8F8B9C",
  },
  navLabelActive: {
    color: "#6D28E8",
  },
});