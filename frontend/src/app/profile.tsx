import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { API_URL } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  LogOut,
  Mail,
  Calendar,
  Heart,
  Pencil,
  MapPin,
  AtSign,
  Settings,
  Trash2,
  ShieldOff,
  Unlock,
  Bookmark,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  X,
  ShieldCheck,
  IdCard,
} from "lucide-react-native";

import BottomNav from "../components/BottomNav";
import LoadingScreen from "../components/LoadingScreen";
import UserAvatar from "../components/UserAvatar";
import SectionHeader from "../components/SectionHeader";
import EventListCard from "../components/EventListCard";
import PublicationPreviewCard from "../components/publications/PublicationPreviewCard";

import { Usuario } from "../types/Usuario";
import { Asistencia } from "../types/Asistencia";
import { Evento } from "../types/Evento";
import { Publicacion } from "../types/Social";
import { eventoYaPaso } from "../utils/eventHelpers";
import { invalidateEventCaches, invalidateSocialCaches } from "../utils/cache";

type Bloqueo = {
  _id: string;
  bloqueadoId: Usuario;
};

type Favorito = {
  _id: string;
  eventoId: Evento;
};

type PerfilTab = "asistidos" | "guardados" | "publicaciones";

export default function ProfileScreen() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarConfiguracion, setMostrarConfiguracion] = useState(false);
  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] =
    useState(false);
  const [eliminandoCuenta, setEliminandoCuenta] = useState(false);
  const [tabActiva, setTabActiva] = useState<PerfilTab>("asistidos");
  const [esManagerActual, setEsManagerActual] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarUsuario();
    }, [])
  );

  const cargarUsuario = async () => {
    try {
      setLoading(true);

      const usuarioGuardado = await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado) {
        router.replace("/login" as any);
        return;
      }

      const usuarioParseado = JSON.parse(usuarioGuardado);
      const usuarioId = usuarioParseado.id || usuarioParseado._id;

      setUsuario(usuarioParseado);
      setEsManagerActual(!!usuarioParseado.esManager);

      if (usuarioId) {
        try {
          const responseResumen = await fetch(
            `${API_URL}/api/usuarios/perfil-resumen/${usuarioId}`
          );
          const dataResumen = await responseResumen.json();

          if (responseResumen.ok) {
            setUsuario(dataResumen.usuario || usuarioParseado);
            setEsManagerActual(
              !!(dataResumen.usuario?.esManager ?? usuarioParseado.esManager)
            );
            setAsistencias(dataResumen.asistencias || []);
            setFavoritos(dataResumen.favoritos || []);
            setPublicaciones(dataResumen.publicaciones || []);
            setBloqueos(dataResumen.bloqueos || []);
            return;
          }
        } catch (errorResumen) {
          console.log("Error usando resumen de perfil:", errorResumen);
        }

        const [
          responseAsistencias,
          responseFavoritos,
          responsePublicaciones,
          responseBloqueos,
        ] = await Promise.all([
          fetch(`${API_URL}/api/asistencias/usuario/${usuarioId}`),
          fetch(`${API_URL}/api/favoritos/usuario/${usuarioId}`),
          fetch(`${API_URL}/api/publicaciones/usuario/${usuarioId}`),
          fetch(`${API_URL}/api/bloqueos/usuario/${usuarioId}`),
        ]);

        const dataAsistencias = await responseAsistencias.json();

        if (responseAsistencias.ok) {
          setAsistencias(dataAsistencias.asistencias || []);
        }

        const dataFavoritos = await responseFavoritos.json();

        if (responseFavoritos.ok) {
          setFavoritos(dataFavoritos.favoritos || []);
        }

        const dataPublicaciones = await responsePublicaciones.json();

        if (responsePublicaciones.ok) {
          setPublicaciones(dataPublicaciones.publicaciones || []);
        }

        const dataBloqueos = await responseBloqueos.json();

        if (responseBloqueos.ok) {
          setBloqueos(dataBloqueos.bloqueos || []);
        }
      }
    } catch (error) {
      console.log("Error al cargar usuario:", error);
      router.replace("/login" as any);
    } finally {
      setLoading(false);
    }
  };

  const irAEditarPerfil = () => {
    router.push("/edit-profile" as any);
  };

  const cerrarSesion = async () => {
    await AsyncStorage.removeItem("usuario");
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("favoritos");

    router.replace("/login" as any);
  };

  const abrirConfirmacionEliminar = () => {
    setMostrarConfirmacionEliminar(true);
  };

  const cerrarConfirmacionEliminar = () => {
    if (eliminandoCuenta) return;
    setMostrarConfirmacionEliminar(false);
  };

  const eliminarCuenta = async () => {
    try {
      setEliminandoCuenta(true);

      const usuarioGuardado = await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado && !usuario) {
        router.replace("/login" as any);
        return;
      }

      const usuarioActual = usuarioGuardado ? JSON.parse(usuarioGuardado) : usuario;
      const usuarioId = usuarioActual?.id || usuarioActual?._id;

      if (!usuarioId) {
        console.log("No se pudo encontrar el usuario para eliminar");
        setMostrarConfirmacionEliminar(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/usuarios/${usuarioId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("Error eliminando cuenta:", data);
        setMostrarConfirmacionEliminar(false);
        return;
      }

      await AsyncStorage.removeItem("usuario");
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("favoritos");

      setUsuario(null);
      setMostrarConfirmacionEliminar(false);

      router.replace("/login" as any);
    } catch (error) {
      console.log("Error al eliminar cuenta:", error);
      setMostrarConfirmacionEliminar(false);
    } finally {
      setEliminandoCuenta(false);
    }
  };

  const obtenerUsuarioId = (item?: Usuario | null) => {
    return item?.id || item?._id || null;
  };

  const desbloquearUsuario = async (bloqueo: Bloqueo) => {
    try {
      const bloqueadorId = obtenerUsuarioId(usuario);
      const bloqueadoId = obtenerUsuarioId(bloqueo.bloqueadoId);

      if (!bloqueadorId || !bloqueadoId) return;

      const response = await fetch(
        `${API_URL}/api/bloqueos/${bloqueadorId}/${bloqueadoId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo desbloquear al usuario.");
        return;
      }

      invalidateSocialCaches(bloqueadorId);
      await cargarUsuario();
    } catch (error) {
      console.log("Error desbloqueando usuario:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  const irAEvento = (eventoId?: string) => {
    if (!eventoId) return;
    router.push(`/event-people/${eventoId}` as any);
  };

  const obtenerTextoEstado = (estado?: string) => {
    if (estado === "confirmado") return "Confirmado";
    if (estado === "cancelado") return "Cancelado";
    return "Interesado";
  };

  const obtenerEstadoEvento = (evento: Evento, estado?: string) => {
    if (eventoYaPaso(evento.fecha)) return "Evento finalizado";
    return obtenerTextoEstado(estado);
  };

  const sacarFavorito = async (favoritoId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/favoritos/${favoritoId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo sacar de guardados.");
        return;
      }

      setFavoritos((prev) => prev.filter((favorito) => favorito._id !== favoritoId));
      invalidateEventCaches(null, obtenerUsuarioId(usuario));
    } catch (error) {
      console.log("Error eliminando favorito:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  const sacarDeMisEventos = async (asistenciaId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/asistencias/${asistenciaId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo sacar el evento de interesados.");
        return;
      }

      setAsistencias((prev) =>
        prev.filter((asistencia) => asistencia._id !== asistenciaId)
      );
      invalidateEventCaches(null, obtenerUsuarioId(usuario));
    } catch (error) {
      console.log("Error eliminando asistencia:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  const eventosActivos = asistencias.filter(
    (asistencia) => asistencia.estado !== "cancelado"
  );

  if (loading) {
    return <LoadingScreen text="Cargando perfil..." />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View style={styles.profileHero}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroLogo}>eBA</Text>

            <TouchableOpacity
              style={styles.heroIconButton}
              activeOpacity={0.85}
              onPress={irAEditarPerfil}
            >
              <Pencil size={18} color="#6D28E8" />
            </TouchableOpacity>
          </View>

          <UserAvatar usuario={usuario || undefined} size={104} />

          <Text style={styles.heroName}>
            {usuario?.nombre || "Usuario"}
            {usuario?.edad ? `, ${usuario.edad}` : ""}
          </Text>

          <Text style={styles.heroUsername}>
            @{usuario?.nombreUsuario || "usuario"}
          </Text>

          <Text style={styles.heroBio}>
            {usuario?.bio || "Apasionada por los eventos y las buenas conexiones."}
          </Text>

          <TouchableOpacity
            style={styles.heroEditButton}
            activeOpacity={0.85}
            onPress={irAEditarPerfil}
          >
            <Text style={styles.heroEditButtonText}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        {!esManagerActual && (
          <>
            <View style={styles.profileStats}>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatNumber}>{eventosActivos.length}</Text>
                <Text style={styles.profileStatLabel}>asistidos</Text>
              </View>

              <View style={styles.profileStatDivider} />

              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatNumber}>{favoritos.length}</Text>
                <Text style={styles.profileStatLabel}>guardados</Text>
              </View>

              <View style={styles.profileStatDivider} />

              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatNumber}>{publicaciones.length}</Text>
                <Text style={styles.profileStatLabel}>publis</Text>
              </View>
            </View>

            <View style={styles.profileTabs}>
              <TouchableOpacity
                style={[styles.profileTab, tabActiva === "asistidos" && styles.profileTabActive]}
                activeOpacity={0.85}
                onPress={() => setTabActiva("asistidos")}
              >
                <Calendar size={15} color={tabActiva === "asistidos" ? "#FFFFFF" : "#6D28E8"} />
                <Text
                  style={[
                    styles.profileTabText,
                    tabActiva === "asistidos" && styles.profileTabTextActive,
                  ]}
                >
                  Asistidos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.profileTab, tabActiva === "guardados" && styles.profileTabActive]}
                activeOpacity={0.85}
                onPress={() => setTabActiva("guardados")}
              >
                <Bookmark size={15} color={tabActiva === "guardados" ? "#FFFFFF" : "#6D28E8"} />
                <Text
                  style={[
                    styles.profileTabText,
                    tabActiva === "guardados" && styles.profileTabTextActive,
                  ]}
                >
                  Guardados
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.profileTab,
                  tabActiva === "publicaciones" && styles.profileTabActive,
                ]}
                activeOpacity={0.85}
                onPress={() => setTabActiva("publicaciones")}
              >
                <MessageSquare
                  size={15}
                  color={tabActiva === "publicaciones" ? "#FFFFFF" : "#6D28E8"}
                />
                <Text
                  style={[
                    styles.profileTabText,
                    tabActiva === "publicaciones" && styles.profileTabTextActive,
                  ]}
                >
                  Publicaciones
                </Text>
              </TouchableOpacity>
            </View>

            {tabActiva === "asistidos" && (
              <View style={styles.eventsBlock}>
                {eventosActivos.length === 0 ? (
                  <Text style={styles.emptyText}>
                    Todavía no marcaste eventos con “Quiero ir”.
                  </Text>
                ) : (
                  eventosActivos.slice(0, 4).map((asistencia) => {
                    const evento = asistencia.eventoId as Evento;

                    if (!evento) return null;

                    return (
                      <EventListCard
                        key={asistencia._id}
                        evento={evento}
                        status={obtenerEstadoEvento(evento, asistencia.estado)}
                        showRemove
                        removeLabel="Sacar de asistidos"
                        onRemovePress={() => sacarDeMisEventos(asistencia._id)}
                        onPress={() => irAEvento(evento._id)}
                      />
                    );
                  })
                )}
              </View>
            )}

            {tabActiva === "guardados" && (
              <View style={styles.eventsBlock}>
                {favoritos.length === 0 ? (
                  <Text style={styles.emptyText}>
                    Todavía no guardaste eventos. Tocá el corazón en Explorar.
                  </Text>
                ) : (
                  favoritos.map((favorito) => {
                    const evento = favorito.eventoId as Evento;

                    if (!evento) return null;

                    return (
                      <EventListCard
                        key={favorito._id}
                        evento={evento}
                        status={
                          eventoYaPaso(evento.fecha) ? "Evento finalizado" : "Guardado"
                        }
                        showRemove
                        onRemovePress={() => sacarFavorito(favorito._id)}
                        onPress={() => irAEvento(evento._id)}
                      />
                    );
                  })
                )}
              </View>
            )}

            {tabActiva === "publicaciones" && (
              <View style={styles.eventsBlock}>
                {publicaciones.length === 0 ? (
                  <Text style={styles.emptyText}>
                    Todavía no hiciste publicaciones en eventos.
                  </Text>
                ) : (
                  publicaciones.map((publicacion) => (
                    <PublicationPreviewCard
                      key={publicacion._id}
                      publicacion={publicacion}
                      comentariosCount={publicacion.comentariosCount || 0}
                      onPress={() =>
                        router.push(`/publication-detail/${publicacion._id}` as any)
                      }
                    />
                  ))
                )}
              </View>
            )}

            <View style={styles.infoCard}>
              <SectionHeader title="Tus intereses" />

              {usuario?.intereses && usuario.intereses.length > 0 ? (
                <View style={styles.chipsContainer}>
                  {usuario.intereses.map((interes) => (
                    <View key={interes} style={styles.chip}>
                      <Heart size={13} color="#7528F0" fill="#7528F0" />
                      <Text style={styles.chipText}>{interes}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>
                  Todavía no tenés intereses cargados.
                </Text>
              )}
            </View>
          </>
        )}

        {usuario?.esManager && (
          <TouchableOpacity
            style={styles.managerButton}
            activeOpacity={0.85}
            onPress={() => router.push("/manager" as any)}
          >
            <ShieldCheck size={20} color="#FFFFFF" />
            <Text style={styles.managerButtonText}>
              Verificar eventos (manager)
            </Text>
          </TouchableOpacity>
        )}

        {!esManagerActual && usuario?.esOrganizador && (
  <TouchableOpacity
    style={styles.organizadorButton}
    activeOpacity={0.85}
    onPress={() => router.push("/mis-eventos" as any)}
  >
    <IdCard size={20} color="#7528F0" />
    <Text style={styles.organizadorButtonText}>Mis eventos</Text>
  </TouchableOpacity>
)}
        {!esManagerActual && (
          <View style={styles.settingsContainer}>
            <TouchableOpacity
              style={styles.settingsButton}
              activeOpacity={0.85}
              onPress={() => setMostrarConfiguracion(!mostrarConfiguracion)}
            >
              <View style={styles.settingsLeft}>
                <Settings size={20} color="#7528F0" />
                <Text style={styles.settingsText}>Configuración</Text>
              </View>

              {mostrarConfiguracion ? (
                <ChevronUp size={20} color="#7528F0" />
              ) : (
                <ChevronDown size={20} color="#7528F0" />
              )}
            </TouchableOpacity>

            {mostrarConfiguracion && (
              <View style={styles.settingsDropdown}>
                <View style={styles.blockedHeader}>
                  <ShieldOff size={18} color="#7528F0" />
                  <Text style={styles.blockedTitle}>Personas bloqueadas</Text>
                </View>

                {bloqueos.length === 0 ? (
                  <Text style={styles.blockedEmpty}>
                    No tenés usuarios bloqueados.
                  </Text>
                ) : (
                  bloqueos.map((bloqueo) => (
                    <View key={bloqueo._id} style={styles.blockedRow}>
                      <View style={styles.blockedAvatar}>
                        <Text style={styles.blockedAvatarText}>
                          {(bloqueo.bloqueadoId?.nombre || "U").charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.blockedInfo}>
                        <Text style={styles.blockedName}>
                          {bloqueo.bloqueadoId?.nombre || "Usuario"}
                        </Text>
                        <Text style={styles.blockedDetail}>
                          {bloqueo.bloqueadoId?.email || "Bloqueado"}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.unblockButton}
                        activeOpacity={0.85}
                        onPress={() => desbloquearUsuario(bloqueo)}
                      >
                        <Unlock size={16} color="#7528F0" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}

                <TouchableOpacity
                  style={styles.deleteAccountButton}
                  activeOpacity={0.85}
                  onPress={abrirConfirmacionEliminar}
                  disabled={eliminandoCuenta}
                >
                  <Trash2 size={18} color="#E53935" />
                  <Text style={styles.deleteAccountText}>Eliminar cuenta</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.85}
          onPress={cerrarSesion}
        >
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={mostrarConfirmacionEliminar}
        transparent
        animationType="fade"
        onRequestClose={cerrarConfirmacionEliminar}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              activeOpacity={0.85}
              onPress={cerrarConfirmacionEliminar}
              disabled={eliminandoCuenta}
            >
              <X size={20} color="#8D8A99" />
            </TouchableOpacity>

            <View style={styles.modalIconBox}>
              <Trash2 size={28} color="#E53935" />
            </View>

            <Text style={styles.modalTitle}>Eliminar cuenta</Text>

            <Text style={styles.modalText}>
              ¿Estás seguro de que querés eliminar tu cuenta? Esta acción no se
              puede deshacer.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                activeOpacity={0.85}
                onPress={cerrarConfirmacionEliminar}
                disabled={eliminandoCuenta}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmDeleteButton,
                  eliminandoCuenta && styles.confirmDeleteButtonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={eliminarCuenta}
                disabled={eliminandoCuenta}
              >
                <Text style={styles.confirmDeleteButtonText}>
                  {eliminandoCuenta ? "Eliminando..." : "Sí, eliminar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F6FB",
  },
  container: {
    paddingHorizontal: 22,
    paddingTop: 58,
    paddingBottom: 150,
  },
  profileHero: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    padding: 18,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E8E2F8",
  },
  heroTopRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  heroLogo: {
    color: "#6D28E8",
    fontSize: 30,
    fontWeight: "900",
  },
  heroIconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F1ECFF",
    alignItems: "center",
    justifyContent: "center",
  },
  heroName: {
    marginTop: 12,
    fontSize: 23,
    fontWeight: "900",
    color: "#332047",
    textAlign: "center",
  },
  heroUsername: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "800",
    color: "#6D28E8",
  },
  heroBio: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    color: "#7B7785",
    textAlign: "center",
  },
  heroEditButton: {
    height: 36,
    borderRadius: 14,
    backgroundColor: "#6D28E8",
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  heroEditButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  profileStats: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8E2F8",
    marginBottom: 14,
  },
  profileStatItem: {
    flex: 1,
    alignItems: "center",
  },
  profileStatNumber: {
    fontSize: 20,
    fontWeight: "900",
    color: "#332047",
  },
  profileStatLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "800",
    color: "#8D8A99",
  },
  profileStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#EEEAF7",
  },
  profileTabs: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E2F8",
    padding: 4,
    flexDirection: "row",
    marginBottom: 14,
  },
  profileTab: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  profileTabActive: {
    backgroundColor: "#6D28E8",
  },
  profileTabText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "900",
    color: "#6D28E8",
  },
  profileTabTextActive: {
    color: "#FFFFFF",
  },
  eventsBlock: {
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#332047",
  },
  editButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#F1ECFF",
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  name: {
    fontSize: 26,
    fontWeight: "800",
    color: "#332047",
    marginTop: 12,
    textAlign: "center",
  },
  username: {
    fontSize: 14,
    color: "#7528F0",
    fontWeight: "800",
    marginTop: 4,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: "#7B7785",
    textAlign: "center",
    lineHeight: 21,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F1ECFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  infoTextBox: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: "#8D8A99",
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D2934",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1ECFF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: "#7528F0",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 6,
    textTransform: "capitalize",
  },
  emptyText: {
    fontSize: 14,
    color: "#8D8A99",
    lineHeight: 21,
  },
  managerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#7528F0",
    borderRadius: 18,
    paddingVertical: 15,
    marginBottom: 18,
  },
  managerButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  organizadorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F1ECFF",
    borderRadius: 18,
    paddingVertical: 15,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E0D9F4",
  },
  organizadorButtonText: {
    color: "#7528F0",
    fontSize: 14,
    fontWeight: "900",
  },
  settingsContainer: {
    marginTop: 4,
    marginBottom: 18,
  },
  settingsButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E0D9F4",
  },
  settingsLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsText: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "800",
    color: "#332047",
  },
  settingsDropdown: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E8E2F8",
  },
  blockedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  blockedTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "900",
    color: "#332047",
  },
  blockedEmpty: {
    color: "#8D8A99",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
  },
  blockedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1ECFF",
  },
  blockedAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1ECFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  blockedAvatarText: {
    color: "#7528F0",
    fontSize: 14,
    fontWeight: "900",
  },
  blockedInfo: {
    flex: 1,
  },
  blockedName: {
    fontSize: 14,
    fontWeight: "900",
    color: "#2D2934",
  },
  blockedDetail: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: "#8D8A99",
  },
  unblockButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1ECFF",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  deleteAccountText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "800",
    color: "#E53935",
  },
  logoutButton: {
    height: 54,
    borderRadius: 18,
    backgroundColor: "#FFF1F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
  },
  modalCloseButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F4F6FB",
    alignItems: "center",
    justifyContent: "center",
  },
  modalIconBox: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#FFF1F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#332047",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: "#7B7785",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 22,
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F1ECFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#7528F0",
    fontSize: 14,
    fontWeight: "900",
  },
  confirmDeleteButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  confirmDeleteButtonDisabled: {
    opacity: 0.65,
  },
  confirmDeleteButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});