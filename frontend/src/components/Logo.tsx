import { View, Text, Image, StyleSheet } from "react-native";

type LogoProps = {
  showText?: boolean;
  centered?: boolean;
  size?: "small" | "medium" | "large";
};

export default function Logo({
  showText = true,
  centered = true,
  size = "medium",
}: LogoProps) {
  const logoSize = {
    small: 38,
    medium: 48,
    large: 64,
  }[size];

  const textSize = {
    small: 24,
    medium: 30,
    large: 38,
  }[size];

  return (
    <View style={[styles.container, centered && styles.centered]}>
      <Image
        source={require("../../assets/images/logoeba.png")}
        style={{
          width: logoSize,
          height: logoSize,
          marginRight: showText ? 10 : 0,
        }}
        resizeMode="contain"
      />

      {showText && (
        <Text style={[styles.text, { fontSize: textSize }]}>eBA</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },
  centered: {
    alignSelf: "center",
  },
  text: {
    fontWeight: "900",
    color: "#27025e",
    letterSpacing: 0.5,
  },
});
