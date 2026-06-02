import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

type LoadingScreenProps = {
  text?: string;
};

export default function LoadingScreen({
  text = "Cargando...",
}: LoadingScreenProps) {
  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator size="large" color="#7528F0" />
      <Text style={styles.loadingText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: "#F7F5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#6F6D7A",
    fontWeight: "600",
  },
});