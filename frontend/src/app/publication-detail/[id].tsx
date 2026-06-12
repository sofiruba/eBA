import { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, MessageCircle } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../../config/api";
import LoadingScreen from "../../components/LoadingScreen";
import EmptyState from "../../components/EmptyState";
import UserAvatar from "../../components/UserAvatar";
import CommentThread from "../../components/comments/CommentThread";

import { Usuario } from "../../types/Usuario";
import { Publicacion, Comentario } from "../../types/Social";

export default function PublicationDetailScreen() {
    const { id } = useLocalSearchParams();

    const [publicacion, setPublicacion] = useState<Publicacion | null>(null);
    const [comentarios, setComentarios] = useState<Comentario[]>([]);
    const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
    const [usuarioActualId, setUsuarioActualId] = useState<string | null>(null);
    const [nuevoComentario, setNuevoComentario] = useState("");
    const [respuestas, setRespuestas] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        iniciarPantalla();
    }, [id]);

    const iniciarPantalla = async () => {
        try {
            const usuarioGuardado = await AsyncStorage.getItem("usuario");

            if (!usuarioGuardado) {
                router.replace("/login" as any);
                return;
            }

            const usuario = JSON.parse(usuarioGuardado);
            const idUsuario = usuario.id || usuario._id;

            setUsuarioActual(usuario);
            setUsuarioActualId(idUsuario);

            await cargarPublicacion();
            await cargarComentarios();
        } catch (error) {
            console.log("Error al iniciar detalle publicación:", error);
            alert("No se pudo conectar con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    const cargarPublicacion = async () => {
        try {
            const response = await fetch(`${API_URL}/api/publicaciones/${id}`);
            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "No se pudo traer la publicación.");
                return;
            }

            setPublicacion(data.publicacion);
        } catch (error) {
            console.log("Error al cargar publicación:", error);
            alert("No se pudo conectar con el servidor.");
        }
    };

    const cargarComentarios = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/comentarios/publicacion/${id}`
            );

            const data = await response.json();

            if (!response.ok) {
                console.log("Error comentarios:", data);
                return;
            }

            setComentarios(data.comentarios || []);
        } catch (error) {
            console.log("Error al cargar comentarios:", error);
        }
    };

    const crearComentario = async () => {
        try {
            if (!nuevoComentario.trim()) {
                alert("Escribí un comentario.");
                return;
            }

            if (!usuarioActualId || !id) {
                alert("No se pudo identificar usuario o publicación.");
                return;
            }

            const response = await fetch(`${API_URL}/api/comentarios`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    publicacionId: String(id),
                    usuarioId: usuarioActualId,
                    contenido: nuevoComentario.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "No se pudo comentar.");
                return;
            }

            const comentarioNuevo: Comentario = {
                ...data.comentario,
                usuarioId:
                    usuarioActual ||
                    ({
                        _id: usuarioActualId,
                        nombre: "Yo",
                    } as Usuario),
                comentarioPadreId: null,
                createdAt: data.comentario.createdAt || new Date().toISOString(),
            };

            setComentarios((prev) => [...prev, comentarioNuevo]);
            setNuevoComentario("");
        } catch (error) {
            console.log("Error al comentar:", error);
            alert("No se pudo conectar con el servidor.");
        }
    };

    const crearRespuesta = async (comentarioPadreId: string) => {
        try {
            const contenido = respuestas[comentarioPadreId];

            if (!contenido || !contenido.trim()) {
                alert("Escribí una respuesta.");
                return;
            }

            if (!usuarioActualId || !id) {
                alert("No se pudo identificar usuario o publicación.");
                return;
            }

            const response = await fetch(`${API_URL}/api/comentarios`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    publicacionId: String(id),
                    usuarioId: usuarioActualId,
                    comentarioPadreId,
                    contenido: contenido.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "No se pudo responder.");
                return;
            }

            const respuestaNueva: Comentario = {
                ...data.comentario,
                usuarioId:
                    usuarioActual ||
                    ({
                        _id: usuarioActualId,
                        nombre: "Yo",
                    } as Usuario),
                comentarioPadreId,
                createdAt: data.comentario.createdAt || new Date().toISOString(),
            };

            setComentarios((prev) => [...prev, respuestaNueva]);

            setRespuestas((prev) => ({
                ...prev,
                [comentarioPadreId]: "",
            }));
        } catch (error) {
            console.log("Error al responder:", error);
            alert("No se pudo conectar con el servidor.");
        }
    };

    const formatearFecha = (fecha?: string) => {
        if (!fecha) return "";

        return new Date(fecha).toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const comentariosPrincipales = comentarios.filter((comentario) => {
        const padre = comentario.comentarioPadreId as any;
        return !padre;
    });

    if (loading) {
        return <LoadingScreen text="Cargando publicación..." />;
    }

    if (!publicacion) {
        return (
            <EmptyState
                title="No se encontró la publicación"
                text="Volvé e intentá entrar nuevamente."
                buttonText="Volver"
                onPress={() => router.back()}
            />
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

                <View style={styles.postCard}>
                    <View style={styles.postHeader}>
                        <UserAvatar usuario={publicacion.usuarioId} size={46} />

                        <View style={styles.postUserInfo}>
                            <Text style={styles.postUserName}>
                                {publicacion.usuarioId?.nombre || "Usuario"}
                            </Text>

                            <Text style={styles.postDate}>
                                {formatearFecha(publicacion.createdAt)}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.postContent}>{publicacion.contenido}</Text>

                    {publicacion.eventoId?.nombre && (
                        <TouchableOpacity
                            style={styles.eventTag}
                            activeOpacity={0.85}
                            onPress={() =>
                                router.push(`/event-detail/${publicacion.eventoId._id}` as any)
                            }
                        >
                            <Text style={styles.eventTagText}>
                                Evento: {publicacion.eventoId.nombre}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={styles.sectionTitle}>Comentarios</Text>

                <View style={styles.mainCommentBox}>
                    <UserAvatar
                        usuario={
                            usuarioActual ||
                            ({
                                _id: usuarioActualId || "",
                                nombre: "Yo",
                            } as Usuario)
                        }
                        size={36}
                    />

                    <TextInput
                        style={styles.mainCommentInput}
                        placeholder="Escribí un comentario..."
                        placeholderTextColor="#A7A7B0"
                        value={nuevoComentario}
                        onChangeText={setNuevoComentario}
                        multiline
                    />

                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            !nuevoComentario.trim() && styles.sendButtonDisabled,
                        ]}
                        onPress={crearComentario}
                        disabled={!nuevoComentario.trim()}
                    >
                        <Text style={styles.sendButtonText}>Enviar</Text>
                    </TouchableOpacity>
                </View>

                {comentariosPrincipales.length === 0 ? (
                    <View style={styles.emptyCommentsCard}>
                        <MessageCircle size={34} color="#8B35E8" />

                        <Text style={styles.emptyCommentsTitle}>
                            Todavía no hay comentarios
                        </Text>

                        <Text style={styles.emptyCommentsText}>
                            Sé la primera persona en responder esta publicación.
                        </Text>
                    </View>
                ) : (
                    comentariosPrincipales.map((comentario) => (
                        <CommentThread
                            key={comentario._id}
                            comentario={comentario}
                            comentarios={comentarios}
                            respuestasTexto={respuestas}
                            onChangeRespuesta={(comentarioId, texto) =>
                                setRespuestas((prev) => ({
                                    ...prev,
                                    [comentarioId]: texto,
                                }))
                            }
                            onEnviarRespuesta={crearRespuesta}
                        />
                    ))
                )}
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
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
    },
    postCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 26,
        padding: 20,
        marginBottom: 22,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
    },
    postHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
    },
    postUserInfo: {
        marginLeft: 12,
        flex: 1,
    },
    postUserName: {
        fontSize: 15,
        fontWeight: "900",
        color: "#332047",
        marginBottom: 3,
    },
    postDate: {
        fontSize: 12,
        color: "#8D8A99",
        fontWeight: "700",
    },
    postContent: {
        fontSize: 18,
        color: "#332047",
        lineHeight: 27,
        marginBottom: 16,
    },
    eventTag: {
        alignSelf: "flex-start",
        backgroundColor: "#F1ECFF",
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    eventTagText: {
        color: "#7528F0",
        fontSize: 12,
        fontWeight: "900",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "900",
        color: "#332047",
        marginBottom: 12,
    },
    mainCommentBox: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 14,
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#E0D9F4",
    },
    mainCommentInput: {
        flex: 1,
        minHeight: 44,
        marginLeft: 10,
        marginRight: 8,
        fontSize: 14,
        color: "#332047",
        textAlignVertical: "top",
        outlineStyle: "none" as any,
    },
    sendButton: {
        backgroundColor: "#8B35E8",
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 9,
    },
    sendButtonDisabled: {
        opacity: 0.45,
    },
    sendButtonText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "900",
    },
    emptyCommentsCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 22,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
    },
    emptyCommentsTitle: {
        fontSize: 16,
        fontWeight: "900",
        color: "#332047",
        marginTop: 10,
        marginBottom: 6,
    },
    emptyCommentsText: {
        fontSize: 13,
        color: "#8D8A99",
        textAlign: "center",
        lineHeight: 19,
    },
});