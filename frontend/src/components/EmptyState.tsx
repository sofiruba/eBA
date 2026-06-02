import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  text: string;
  buttonText?: string;
  onPress?: () => void;
};

export default function EmptyState({
  icon,
  title,
  text,
  buttonText,
  onPress,
}: EmptyStateProps) {
  return (
    <View style={styles.emptyCard}>
      {icon && <View style={styles.emptyIconCircle}>{icon}</View>}

      <Text style={styles.emptyTitle}>{title}</Text>

      <Text style={styles.emptyText}>{text}</Text>

      {buttonText && onPress && (
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={onPress}
        >
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 26,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    marginBottom: 24,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F1ECFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#332047",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#8D8A99",
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 22,
  },
  button: {
    backgroundColor: "#7528F0",
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 18,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});