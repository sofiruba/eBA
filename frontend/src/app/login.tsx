import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { EyeOff } from "lucide-react-native";

export default function LoginScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Image
          source={{ uri: "https://i.imgur.com/Oi6Zc3K.png" }}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>
          ¡Hola de <Text style={styles.highlight}>vuelta!</Text>
        </Text>

        <TextInput
          placeholder="Correo electrónico"
          placeholderTextColor="#A8A5B3"
          style={styles.input}
        />

        <View style={styles.passwordBox}>
          <TextInput
            placeholder="Contraseña"
            placeholderTextColor="#A8A5B3"
            secureTextEntry
            style={styles.passwordInput}
          />
          <EyeOff size={18} color="#A8A5B3" />
        </View>

        <TouchableOpacity>
          <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace("/home" as any)}
        >
          <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
        </TouchableOpacity>

        <View style={styles.registerRow}>
          <Text style={styles.smallText}>¿No tenés cuenta? </Text>
          <TouchableOpacity onPress={() => router.push("/register" as any)}>
            <Text style={styles.registerLink}>Registrate</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <Text style={styles.continueText}>O continuá con...</Text>

        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialText}>Apple</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F5FF",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 34,
    alignItems: "center",
  },
  logo: {
    width: 130,
    height: 90,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#332047",
    marginBottom: 42,
  },
  highlight: {
    color: "#8B35E8",
  },
  input: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8D5E2",
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#332047",
    marginBottom: 14,
    backgroundColor: "#FAFAFF",
    outlineStyle: "none" as any,
  },
  passwordBox: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8D5E2",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFF",
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: "#332047",
    outlineStyle: "none" as any,
  },
  forgot: {
    alignSelf: "flex-start",
    color: "#3A2451",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 28,
  },
  primaryButton: {
    width: "100%",
    height: 54,
    borderRadius: 12,
    backgroundColor: "#7528F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  registerRow: {
    flexDirection: "row",
    marginBottom: 26,
  },
  smallText: {
    color: "#9A98A6",
    fontSize: 13,
  },
  registerLink: {
    color: "#7528F0",
    fontSize: 13,
    fontWeight: "800",
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#D8C8FF",
    marginBottom: 22,
  },
  continueText: {
    color: "#A8A5B3",
    fontSize: 13,
    marginBottom: 18,
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
  },
  socialButton: {
    width: 120,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D8D5E2",
    alignItems: "center",
    justifyContent: "center",
  },
  socialText: {
    color: "#9A98A6",
    fontSize: 14,
  },
});