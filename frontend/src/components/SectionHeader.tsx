import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type SectionHeaderProps = {
  title: string;
  actionText?: string;
  onPress?: () => void;
};

export default function SectionHeader({
  title,
  actionText,
  onPress,
}: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {actionText && onPress && (
        <TouchableOpacity onPress={onPress}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#2D2934",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#7528F0",
  },
});