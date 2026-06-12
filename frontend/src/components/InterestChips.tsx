import { Text, TouchableOpacity, StyleSheet } from "react-native";

import { Interes } from "../types/Interes";

type Props = {
  intereses: Interes[];
  seleccionado?: string;
  seleccionados?: string[];
  onPress: (slug: string) => void;
  variant?: "register" | "explore" | "home";
};

export default function InterestChips({
  intereses,
  seleccionado,
  seleccionados = [],
  onPress,
  variant = "explore",
}: Props) {
  return (
    <>
      {intereses.map((interes) => {
        const activo =
          seleccionado === interes.slug || seleccionados.includes(interes.slug);

        return (
          <TouchableOpacity
            key={interes.slug}
            style={[
              styles.chip,
              variant === "register" && styles.chipRegister,
              activo && styles.chipActive,
            ]}
            activeOpacity={0.85}
            onPress={() => onPress(interes.slug)}
          >
            <Text
              style={[
                styles.text,
                variant === "register" && styles.textRegister,
                activo && styles.textActive,
              ]}
            >
              {interes.nombre}
            </Text>
          </TouchableOpacity>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCCBFF",
    marginRight: 12,
    marginBottom: 10,
  },
  chipRegister: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
    borderColor: "#D8D5E2",
    marginRight: 10,
    marginBottom: 12,
  },
  chipActive: {
    backgroundColor: "#7528F0",
    borderColor: "#7528F0",
  },
  text: {
    color: "#7528F0",
    fontSize: 15,
    fontWeight: "800",
  },
  textRegister: {
    color: "#8D8A99",
    fontSize: 14,
    fontWeight: "700",
  },
  textActive: {
    color: "#FFFFFF",
  },
});