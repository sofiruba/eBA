import { View, StyleSheet, TouchableOpacity } from "react-native";
import { router, usePathname } from "expo-router";
import { Home, Search, Heart, Users, User } from "lucide-react-native";

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (route: string) => pathname === route;

  return (
    <View style={styles.navbar}>
      <TouchableOpacity onPress={() => router.replace("/home" as any)}>
        <Home
          size={21}
          color={isActive("/home") ? "#7B2DF0" : "#B8B8C2"}
          fill={isActive("/home") ? "#7B2DF0" : "transparent"}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/explore" as any)}>
        <Search
          size={21}
          color={isActive("/explore") ? "#7B2DF0" : "#B8B8C2"}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/favorites" as any)}>
        <Heart
          size={21}
          color={isActive("/favorites") ? "#7B2DF0" : "#B8B8C2"}
          fill={isActive("/favorites") ? "#7B2DF0" : "transparent"}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/connections" as any)}>
        <Users
          size={21}
          color={isActive("/connections") ? "#7B2DF0" : "#B8B8C2"}
          fill={isActive("/connections") ? "#7B2DF0" : "transparent"}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/profile" as any)}>
        <User
          size={21}
          color={isActive("/profile") ? "#7B2DF0" : "#B8B8C2"}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    position: "absolute",
    bottom: 28,
    left: 24,
    right: 24,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.92)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    boxShadow: "0px 8px 25px rgba(0,0,0,0.08)" as any,
  },
});