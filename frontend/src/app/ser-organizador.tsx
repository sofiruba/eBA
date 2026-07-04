import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ArrowLeft, Camera, IdCard, Clock3, CheckCircle2, XCircle } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

import { API_URL } from "../config/api";
import LoadingScreen from "../components/LoadingScreen";
import { SolicitudOrganizador } from "../types/SolicitudOrganizador";

const DOCUMENTO_MAX_BASE64_LENGTH = 1000000;

const comprimirFotoDocumento = async (uri: string) => {
  const intentos = [
    { width: 900, compress: 0.6 },
    { width: 700, compress: 0.5 },
    { width: 500, compress: 0.4 },
  ];

  let ultimaImagen = "";

  for (const intento of intentos) {
    const resultado = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: intento.width } }],
      {
        compress: intento.compress,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    if (!resultado.base64) continue;

    ultimaImagen = `data:image/jpeg;base64,${resultado.base64}`;

    if (ultimaImagen.length <= DOCUMENTO_MAX_BASE64_LENGTH) {
      return ultimaImagen;
    }
  }

  if (!ultimaImagen || ultimaImagen.length > DOCUMENTO_MAX_BASE64_LENGTH) {
    throw new Error("La imagen sigue siendo muy pesada");
  }

  return ultimaImagen;
};

export default function SerOrganizadorScreen() {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 900;
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [foto, setFoto] = useState<string>("");
  const [solicitud, setSolicitud] = useState<SolicitudOrganizador | null>(null);
  const [loading, setLoading] = useState(true);
  const [procesandoImagen, setProcesandoImagen] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      iniciar();
    }, [])
  );

  const iniciar = async () => {
    try {
      setLoading(true);

      const usuarioGuardado = await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado) {
        router.replace("/login" as any);
        return;
      }

      const usuario = JSON.parse(usuarioGuardado);
      const id = usuario.id || usuario._id;

      if (usuario.esOrganizador) {
        alert("Ya sos organizador.");
        router.back();
        return;
      }

      setUsuarioId(id);

      const response = await fetch(`${API_URL}/api/solicitudes-organizador/usuario/${id}`);
      const data = await response.json();

      if (response.ok) {
        setSolicitud(data.solicitud || null);
      }
    } catch (error) {
      console.log("Error iniciando pantalla ser-organizador:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const elegirFoto = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permiso.granted) {
        alert("Necesitamos permiso para acceder a tus fotos.");
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
        base64: false,
      });

      if (resultado.canceled || !resultado.assets?.[0]?.uri) return;

      setProcesandoImagen(true);

      const imagenComprimida = await comprimirFotoDocumento(resultado.assets[0].uri);
      setFoto(imagenComprimida);
    } catch (error) {
      console.log("Error eligiendo foto del documento:", error);
      alert("No se pudo procesar la imagen. Probá con otra foto.");
    } finally {
      setProcesandoImagen(false);
    }
  };

  const enviarSolicitud = async () => {
    if (!usuarioId) return;

    if (!foto) {
      alert("Adjuntá una foto de tu documento antes de enviar.");
      return;
    }

    try {
      setEnviando(true);

      const response = await fetch(`${API_URL}/api/solicitudes-organizador`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId,
          fotoDocumento: foto,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo enviar la solicitud.");
        return;
      }

      setSolicitud(data.solicitud);
      setFoto("");
      alert("Solicitud enviada. Un manager la va a revisar pronto.");
    } catch (error) {
      console.log("Error enviando solicitud de organizador:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return <LoadingScreen text="Cargando..." />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.container,
          isDesktopWeb && styles.webContainer,
        ]}
      >
        <View style={[styles.card, isDesktopWeb && styles.webCard]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#332047" />
          </TouchableOpacity>

          <View style={styles.headerRow}>
            <IdCard size={22} color="#7528F0" />
            <Text style={styles.title}>Convertite en organizador</Text>
          </View>

          <Text style={styles.subtitle}>
            Para poder crear eventos necesitamos validar tu identidad. Sacale
            una foto clara a tu documento (DNI, libreta o pasaporte) y un
            manager de eBA la va a revisar.
          </Text>

          {solicitud?.estado === "pendiente" ? (
            <View style={[styles.estadoCard, styles.estadoPendiente]}>
              <Clock3 size={22} color="#B7791F" />
              <Text style={styles.estadoTitulo}>Solicitud en revisión</Text>
              <Text style={styles.estadoTexto}>
                Ya enviaste tu documento. Te vamos a avisar apenas un manager la
                revise.
              </Text>
            </View>
          ) : (
            <>
              {solicitud?.estado === "rechazado" && (
                <View style={[styles.estadoCard, styles.estadoRechazado]}>
                  <XCircle size={22} color="#E53935" />
                  <Text style={styles.estadoTitulo}>Solicitud rechazada</Text>
                  <Text style={styles.estadoTexto}>
                    {solicitud.motivoRechazo ||
                      "No pudimos validar tu documento. Probá enviarlo de nuevo."}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.fotoBox}
                activeOpacity={0.85}
                onPress={elegirFoto}
                disabled={procesandoImagen}
              >
                {procesandoImagen ? (
                  <ActivityIndicator color="#7528F0" />
                ) : foto ? (
                  <Image source={{ uri: foto }} style={styles.fotoPreview} />
                ) : (
                  <View style={styles.fotoPlaceholder}>
                    <Camera size={28} color="#7528F0" />
                    <Text style={styles.fotoPlaceholderText}>
                      Tocá para sacar o elegir una foto del documento
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.enviarButton,
                  (!foto || enviando) && styles.enviarButtonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={enviarSolicitud}
                disabled={!foto || enviando}
              >
                {enviando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.enviarButtonText}>Enviar solicitud</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F5FF",
  },
  container: {
    paddingHorizontal: 26,
    paddingTop: 58,
    paddingBottom: 60,
  },
  webContainer: {
    paddingHorizontal: 34,
    paddingTop: 48,
    paddingBottom: 48,
    alignItems: "center",
  },
  card: {
    width: "100%",
  },
  webCard: {
    maxWidth: 620,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E8E2F8",
    padding: 28,
    boxShadow: "0px 18px 42px rgba(65,34,114,0.1)" as any,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E2F8",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#332047",
  },
  subtitle: {
    fontSize: 14,
    color: "#8D8A99",
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 22,
  },
  estadoCard: {
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    marginBottom: 20,
  },
  estadoPendiente: {
    backgroundColor: "#FFF7E6",
  },
  estadoRechazado: {
    backgroundColor: "#FFF1F2",
  },
  estadoTitulo: {
    fontSize: 16,
    fontWeight: "900",
    color: "#332047",
    marginTop: 8,
    marginBottom: 4,
  },
  estadoTexto: {
    fontSize: 13,
    color: "#6F6D7A",
    textAlign: "center",
    lineHeight: 19,
  },
  fotoBox: {
    height: 220,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E8E2F8",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 20,
  },
  fotoPreview: {
    width: "100%",
    height: "100%",
  },
  fotoPlaceholder: {
    alignItems: "center",
    paddingHorizontal: 30,
    gap: 8,
  },
  fotoPlaceholderText: {
    fontSize: 13,
    color: "#7528F0",
    fontWeight: "700",
    textAlign: "center",
  },
  enviarButton: {
    height: 52,
    borderRadius: 18,
    backgroundColor: "#7528F0",
    alignItems: "center",
    justifyContent: "center",
  },
  enviarButtonDisabled: {
    opacity: 0.5,
  },
  enviarButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});
