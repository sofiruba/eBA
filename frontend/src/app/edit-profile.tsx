import { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Camera } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

import { API_URL } from "../config/api";
import UserAvatar from "../components/UserAvatar";
import { Usuario } from "../types/Usuario";

export default function EditProfileScreen() {
    const [usuarioId, setUsuarioId] = useState("");
    const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);

    const [nombre, setNombre] = useState("");
    const [edad, setEdad] = useState("");
    const [ubicacionAproximada, setUbicacionAproximada] = useState("");
    const [bio, setBio] = useState("");
    const [instagram, setInstagram] = useState("");
    const [fotoPerfil, setFotoPerfil] = useState("");
    const [nombreUsuario, setNombreUsuario] = useState("");

    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        cargarUsuario();
    }, []);

    const cargarUsuario = async () => {
        try {
            const usuarioGuardado = await AsyncStorage.getItem("usuario");

            if (!usuarioGuardado) {
                router.replace("/login" as any);
                return;
            }

            const usuario = JSON.parse(usuarioGuardado);
            const id = usuario.id || usuario._id;

            if (!id) {
                alert("No se pudo identificar el usuario.");
                router.replace("/login" as any);
                return;
            }

            setUsuarioId(id);

            const response = await fetch(`${API_URL}/api/usuarios/${id}`);
            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "No se pudo cargar el perfil.");
                return;
            }

            const usuarioCompleto = data.usuario;

            setUsuarioActual(usuarioCompleto);
            setNombre(usuarioCompleto.nombre || "");
            setNombreUsuario(usuarioCompleto.nombreUsuario || "");
            setEdad(usuarioCompleto.edad ? String(usuarioCompleto.edad) : "");
            setUbicacionAproximada(usuarioCompleto.ubicacionAproximada || "");
            setBio(usuarioCompleto.bio || "");
            setInstagram(usuarioCompleto.instagram || "");
            setFotoPerfil(usuarioCompleto.fotoPerfil || "");
        } catch (error) {
            console.log("Error al cargar usuario:", error);
            alert("No se pudo conectar con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    const elegirFoto = async () => {
        try {
            const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permiso.granted) {
                alert("Necesitás permitir el acceso a tus fotos.");
                return;
            }

            const resultado = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.2,
                base64: true,
            });

            if (resultado.canceled) return;

            const imagen = resultado.assets[0];

            if (!imagen.base64) {
                alert("No se pudo cargar la imagen.");
                return;
            }

            const fotoBase64 = `data:image/jpeg;base64,${imagen.base64}`;
            setFotoPerfil(fotoBase64);
        } catch (error) {
            console.log("Error al elegir foto:", error);
            alert("No se pudo seleccionar la foto.");
        }
    };

    const guardarCambios = async () => {
        try {
            if (!nombre.trim()) {
                alert("El nombre no puede estar vacío.");
                return;
            }

            setGuardando(true);

            const response = await fetch(`${API_URL}/api/usuarios/${usuarioId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nombre: nombre.trim(),
                    nombreUsuario: nombreUsuario.trim(),
                    edad: edad ? Number(edad) : undefined,
                    ubicacionAproximada: ubicacionAproximada.trim(),
                    bio: bio.trim(),
                    instagram: instagram.trim(),
                    fotoPerfil,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "No se pudo actualizar el perfil.");
                return;
            }

            await AsyncStorage.setItem("usuario", JSON.stringify(data.usuario));

            alert("Perfil actualizado correctamente.");
            router.back();
        } catch (error) {
            console.log("Error al guardar perfil:", error);
            alert("No se pudo conectar con el servidor.");
        } finally {
            setGuardando(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingScreen}>
                <ActivityIndicator size="large" color="#8B35E8" />
                <Text style={styles.loadingText}>Cargando perfil...</Text>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.container}
            >
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={22} color="#332047" />
                </TouchableOpacity>

                <Text style={styles.title}>Editar perfil</Text>

                <Text style={styles.subtitle}>
                    Actualizá tus datos para que otros usuarios te conozcan mejor.
                </Text>

                <View style={styles.photoSection}>
                    <TouchableOpacity activeOpacity={0.85} onPress={elegirFoto}>
                        {fotoPerfil ? (
                            <Image source={{ uri: fotoPerfil }} style={styles.profileImage} />
                        ) : (
                            <UserAvatar
                                usuario={
                                    usuarioActual ||
                                    ({
                                        nombre: nombre || "Usuario",
                                    } as Usuario)
                                }
                                size={96}
                            />
                        )}

                        <View style={styles.cameraButton}>
                            <Camera size={18} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.photoText}>Cambiar foto</Text>
                </View>

                <View style={styles.formCard}>
                    <Text style={styles.label}>Nombre</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Tu nombre"
                        placeholderTextColor="#A7A7B0"
                        value={nombre}
                        onChangeText={setNombre}
                    />
                    <Text style={styles.label}>Nombre de usuario</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="@usuario"
                        placeholderTextColor="#A7A7B0"
                        value={nombreUsuario}
                        onChangeText={setNombreUsuario}
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Edad</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Tu edad"
                        placeholderTextColor="#A7A7B0"
                        value={edad}
                        onChangeText={setEdad}
                        keyboardType="numeric"
                    />

                    <Text style={styles.label}>Ubicación aproximada</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: Palermo, CABA"
                        placeholderTextColor="#A7A7B0"
                        value={ubicacionAproximada}
                        onChangeText={setUbicacionAproximada}
                    />

                    <Text style={styles.label}>Instagram</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="@usuario"
                        placeholderTextColor="#A7A7B0"
                        value={instagram}
                        onChangeText={setInstagram}
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Bio</Text>
                    <TextInput
                        style={[styles.input, styles.bioInput]}
                        placeholder="Contá algo sobre vos..."
                        placeholderTextColor="#A7A7B0"
                        value={bio}
                        onChangeText={setBio}
                        multiline
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, guardando && styles.saveButtonDisabled]}
                    activeOpacity={0.85}
                    onPress={guardarCambios}
                    disabled={guardando}
                >
                    <Text style={styles.saveButtonText}>
                        {guardando ? "Guardando..." : "Guardar cambios"}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#F7F5FF",
    },
    loadingScreen: {
        flex: 1,
        backgroundColor: "#F7F5FF",
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        marginTop: 12,
        color: "#8D8A99",
        fontSize: 14,
        fontWeight: "700",
    },
    container: {
        paddingHorizontal: 26,
        paddingTop: 58,
        paddingBottom: 60,
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
    },
    title: {
        fontSize: 30,
        fontWeight: "900",
        color: "#332047",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: "#8D8A99",
        lineHeight: 21,
        marginBottom: 28,
    },
    photoSection: {
        alignItems: "center",
        marginBottom: 28,
    },
    profileImage: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: "#E6D9FF",
    },
    cameraButton: {
        position: "absolute",
        right: -2,
        bottom: -2,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "#8B35E8",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: "#F7F5FF",
    },
    photoText: {
        marginTop: 10,
        color: "#8B35E8",
        fontSize: 13,
        fontWeight: "900",
    },
    formCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 26,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
        marginBottom: 22,
    },
    label: {
        fontSize: 13,
        fontWeight: "900",
        color: "#332047",
        marginBottom: 8,
        marginTop: 8,
    },
    input: {
        height: 48,
        borderRadius: 18,
        backgroundColor: "#F7F5FF",
        borderWidth: 1,
        borderColor: "#E0D9F4",
        paddingHorizontal: 14,
        fontSize: 14,
        color: "#332047",
        marginBottom: 10,
        outlineStyle: "none" as any,
    },
    bioInput: {
        minHeight: 96,
        paddingTop: 12,
        textAlignVertical: "top",
    },
    saveButton: {
        height: 54,
        borderRadius: 24,
        backgroundColor: "#8B35E8",
        alignItems: "center",
        justifyContent: "center",
    },
    saveButtonDisabled: {
        opacity: 0.55,
    },
    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "900",
    },
});