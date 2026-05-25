import { View, Text, StyleSheet } from "react-native";
import BottomNav from "../components/BottomNav";

export default function ProfileScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.subtitle}>
          Acá mas pronto vas a poder ver y editar tu información personal, tus intereses y tus eventos guardados.
        </Text>
      </View>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F6FB",
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 80,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#332047",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#8D8A99",
    lineHeight: 22,
  },
});