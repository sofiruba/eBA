import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from "react-native";
import Logo from "../components/Logo";
import { router } from "expo-router";
export default function WelcomeScreen() {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 900;

  if (isDesktopWeb) {
    return (
      <View style={styles.webScreen}>
        <View style={styles.webShell}>
          <View style={styles.webHeader}>
            <Logo size="medium" centered={false} showText={true} />
            <TouchableOpacity
              style={styles.webHeaderButton}
              activeOpacity={0.85}
              onPress={() => router.push("/login" as any)}
            >
              <Text style={styles.webHeaderButtonText}>Entrar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.webMain}>
            <View style={styles.webCopy}>
              <Text style={styles.webTitle}>
                Conectá con personas y viví experiencias
              </Text>
              <Text style={styles.webSubtitle}>
                Descubrí eventos, conocé gente con tus mismos intereses y
                seguí la conversación desde cualquier lugar.
              </Text>

              <View style={styles.webActions}>
                <TouchableOpacity
                  style={styles.webPrimaryButton}
                  activeOpacity={0.85}
                  onPress={() => router.push("/register-interests" as any)}
                >
                  <Text style={styles.webPrimaryButtonText}>Crear cuenta</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.webSecondaryButton}
                  activeOpacity={0.85}
                  onPress={() => router.push("/login" as any)}
                >
                  <Text style={styles.webSecondaryButtonText}>Iniciar sesión</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.webVisual}>
              <Image
                source={require("../../assets/images/mascotaseba.png")}
                style={styles.webCharacters}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
       <Logo size="large" centered={true} showText={true} />

        <Image
          source={require("../../assets/images/mascotaseba.png")}
          style={styles.characters}
          showText="contain"
        />

        <Text style={styles.title}>
          Conectá con personas{"\n"}y viví experiencias
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/login" as any)}
        >
          <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/register-interests" as any)}>
          <Text style={styles.link}>Crear cuenta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    width: "100%",
    paddingHorizontal: 32,
    alignItems: "center",
    alignSelf: "center",
    maxWidth: 430,
  },
  logo: {
    width: 120,
    height: 80,
    marginBottom: 34,
  },
  characters: {
    width: 260,
    height: 180,
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#332047",
    textAlign: "center",
    lineHeight: 31,
    marginBottom: 30,
  },
  primaryButton: {
    width: "100%",
    height: 54,
    borderRadius: 12,
    backgroundColor: "#7528F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  link: {
    fontSize: 15,
    color: "#3A2451",
    textDecorationLine: "underline",
  },
  webScreen: {
    flex: 1,
    minHeight: "100vh" as any,
    backgroundColor: "#F4F2FA",
    paddingHorizontal: 40,
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  webShell: {
    width: "100%",
    maxWidth: 1120,
    minHeight: 640,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E8E2F8",
    padding: 34,
    boxShadow: "0px 24px 70px rgba(65,34,114,0.14)" as any,
  },
  webHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  webHeaderButton: {
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: "#F4F2FA",
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  webHeaderButtonText: {
    color: "#332047",
    fontSize: 14,
    fontWeight: "900",
  },
  webMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 44,
    paddingTop: 38,
  },
  webCopy: {
    flex: 1,
    maxWidth: 560,
  },
  webTitle: {
    fontSize: 46,
    lineHeight: 52,
    fontWeight: "900",
    color: "#241832",
  },
  webSubtitle: {
    marginTop: 18,
    maxWidth: 500,
    fontSize: 17,
    lineHeight: 26,
    color: "#6F6A7E",
    fontWeight: "700",
  },
  webActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 30,
  },
  webPrimaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#6D28E8",
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  webPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  webSecondaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#F4F2FA",
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  webSecondaryButtonText: {
    color: "#332047",
    fontSize: 15,
    fontWeight: "900",
  },
  webVisual: {
    width: 340,
    minHeight: 340,
    borderRadius: 26,
    backgroundColor: "#F7F5FF",
    borderWidth: 1,
    borderColor: "#E8E2F8",
    alignItems: "center",
    justifyContent: "center",
    padding: 26,
  },
  webCharacters: {
    width: 300,
    height: 240,
  },
});
