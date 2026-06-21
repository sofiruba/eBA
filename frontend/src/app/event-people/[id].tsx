import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  MessageCircle,
  Plus,
  Search,
  UserPlus,
  Clock3,
  Users,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../../config/api";
import LoadingScreen from "../../components/LoadingScreen";
import EmptyState from "../../components/EmptyState";
import ProfileAvatarLink from "../../components/ProfileAvatarLink";
import SectionHeader from "../../components/SectionHeader";
import BottomNav from "../../components/BottomNav";
import useAutoRefresh from "../../hooks/useAutoRefresh";

import CreatePublicationModal from "../../components/publications/CreatePublicationModal";
import PublicationPreviewCard from "../../components/publications/PublicationPreviewCard";

import { Evento } from "../../types/Evento";
import { Usuario } from "../../types/Usuario";
import { Publicacion, Comentario } from "../../types/Social";

import {
  eventoYaPaso,
  obtenerImagen,
  formatearFechaLarga,
} from "../../utils/eventHelpers";
import { getCached, invalidateSocialCaches, setCached } from "../../utils/cache";

type Asistencia = {
  _id: string;
  usuarioId: Usuario;
  eventoId: string;
  estado: string;
};

type Conexion = {
  _id: string;
  usuario1: Usuario;
  usuario2: Usuario;
};

type SolicitudConexion = {
  _id: string;
  usuariosolicitante: Usuario;
  usuarioreceptor: Usuario;
  estado: string;
};

export default function EventPeopleScreen() {
  const { id, returnToHome } = useLocalSearchParams();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [conexiones, setConexiones] = useState<Conexion[]>([]);
  const [conexionesIds, setConexionesIds] = useState<string[]>([]);
  const [solicitudesPendientesIds, setSolicitudesPendientesIds] = useState<
    string[]
  >([]);
  const [bloqueadosIds, setBloqueadosIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingPersonas, setLoadingPersonas] = useState(true);
  const [usuarioActualId, setUsuarioActualId] = useState<string | null>(null);
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);

  const [tabActiva, setTabActiva] = useState<
    "personas" | "publicaciones" | "chat"
  >("personas");

  const [busquedaPersonas, setBusquedaPersonas] = useState("");

  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [comentariosPorPublicacion, setComentariosPorPublicacion] = useState<
    Record<string, Comentario[]>
  >({});
  const [nuevaPublicacion, setNuevaPublicacion] = useState("");
  const [loadingPublicaciones, setLoadingPublicaciones] = useState(false);
  const [modalPublicacionVisible, setModalPublicacionVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      iniciarPantalla();
    }, [id])
  );

  const iniciarPantalla = async (silencioso = false) => {
    try {
      const eventoId = id ? String(id) : null;
      const eventoCacheado = eventoId
        ? getCached<Evento>(`evento:${eventoId}`)
        : null;

      if (!silencioso) {
        setLoading(!eventoCacheado);
        setLoadingPersonas(true);

        if (eventoCacheado) {
          setEvento(eventoCacheado);
        }
      }

      const usuarioGuardado = await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado) {
        router.replace("/login" as any);
        return;
      }

      const usuario = JSON.parse(usuarioGuardado);
      const idUsuario = usuario.id || usuario._id;

      if (!idUsuario) {
        alert("No se encontró el usuario logueado.");
        router.replace("/login" as any);
        return;
      }

      setUsuarioActualId(idUsuario);
      setUsuarioActual(usuario);

      if (!eventoId) {
        alert("No se encontró el evento.");
        return;
      }

      const asistenciasCacheadas = getCached<Asistencia[]>(
        `asistencias:evento:${eventoId}`
      );
      const conexionesCacheadas = getCached<Conexion[]>(
        `conexiones:usuario:${idUsuario}`
      );
      const solicitudesPendientesCacheadas = getCached<string[]>(
        `solicitudes-pendientes:usuario:${idUsuario}`
      );

      if (!silencioso) {
        if (asistenciasCacheadas) {
          setAsistencias(asistenciasCacheadas);
          setLoadingPersonas(false);
        }

        if (conexionesCacheadas) {
          setConexiones(conexionesCacheadas);
          setConexionesIds(obtenerIdsConexiones(conexionesCacheadas, idUsuario));
        }

        if (solicitudesPendientesCacheadas) {
          setSolicitudesPendientesIds(solicitudesPendientesCacheadas);
        }
      }

      try {
        const responseResumen = await fetch(
          `${API_URL}/api/eventos/resumen/${eventoId}/usuario/${idUsuario}`
        );
        const dataResumen = await responseResumen.json();

        if (responseResumen.ok) {
          const eventoObtenido = dataResumen.evento;
          const asistenciasObtenidas = dataResumen.asistencias || [];
          const conexionesObtenidas = dataResumen.conexiones || [];
          const idsPendientes = (dataResumen.solicitudes || []).map(
            (solicitud: SolicitudConexion) => {
              const solicitanteId = obtenerUsuarioId(solicitud.usuariosolicitante);
              const receptorId = obtenerUsuarioId(solicitud.usuarioreceptor);

              if (solicitanteId === idUsuario) {
                return receptorId;
              }

              return solicitanteId;
            }
          );
          const idsPendientesFiltrados = idsPendientes.filter(Boolean);
          const idsBloqueados = (dataResumen.bloqueos || [])
            .map((bloqueo: { bloqueadoId: Usuario | string }) =>
              obtenerUsuarioId(bloqueo.bloqueadoId)
            )
            .filter(Boolean) as string[];

          setEvento(eventoObtenido);
          setAsistencias(asistenciasObtenidas);
          setConexiones(conexionesObtenidas);
          setConexionesIds(obtenerIdsConexiones(conexionesObtenidas, idUsuario));
          setSolicitudesPendientesIds(idsPendientesFiltrados);
          setBloqueadosIds(idsBloqueados);

          setCached(`evento:${eventoId}`, eventoObtenido);
          setCached(`asistencias:evento:${eventoId}`, asistenciasObtenidas);
          setCached(`conexiones:usuario:${idUsuario}`, conexionesObtenidas);
          setCached(
            `solicitudes-pendientes:usuario:${idUsuario}`,
            idsPendientesFiltrados
          );

          if (!silencioso) {
            setLoading(false);
            setLoadingPersonas(false);
          }

          cargarPublicaciones(eventoId, silencioso);
          return;
        }
      } catch (errorResumen) {
        console.log("Error usando resumen de evento:", errorResumen);
      }

      const responseEventoPromise = fetch(`${API_URL}/api/eventos/${eventoId}`);
      const responseAsistenciasPromise = fetch(
        `${API_URL}/api/asistencias/evento/${eventoId}`
      );
      const responseConexionesPromise = fetch(
        `${API_URL}/api/conexiones/usuario/${idUsuario}`
      );
      const responseSolicitudesPromise = fetch(
        `${API_URL}/api/solicitudes-conexion/pendientes/${idUsuario}`
      );
      const responseBloqueosPromise = fetch(
        `${API_URL}/api/bloqueos/usuario/${idUsuario}`
      );

      const cargarAsistenciasRequest = responseAsistenciasPromise
        .then(async (responseAsistencias) => {
          const dataAsistencias = await responseAsistencias.json();

          if (!responseAsistencias.ok) {
            if (!silencioso) {
              alert(
                dataAsistencias.message ||
                  dataAsistencias.error ||
                  "Error al traer personas interesadas."
              );
            }
            return;
          }

          setAsistencias(dataAsistencias.asistencias || []);
          setCached(
            `asistencias:evento:${eventoId}`,
            dataAsistencias.asistencias || []
          );

          if (!silencioso) {
            setLoadingPersonas(false);
          }
        })
        .catch((error) => {
          console.log("Error cargando asistencias:", error);
          if (!silencioso) {
            setLoadingPersonas(false);
          }
        });

      const cargarConexionesRequest = responseConexionesPromise
        .then(async (responseConexiones) => {
          const dataConexiones = await responseConexiones.json();

          if (responseConexiones.ok) {
            const conexionesObtenidas = dataConexiones || [];
            setConexiones(conexionesObtenidas);
            setCached(`conexiones:usuario:${idUsuario}`, conexionesObtenidas);
            setConexionesIds(
              obtenerIdsConexiones(conexionesObtenidas, idUsuario)
            );
          }
        })
        .catch((error) => {
          console.log("Error cargando conexiones:", error);
        });

      const cargarSolicitudesRequest = responseSolicitudesPromise
        .then(async (responseSolicitudes) => {
          const dataSolicitudes = await responseSolicitudes.json();

          if (responseSolicitudes.ok) {
            const idsPendientes = (dataSolicitudes.solicitudes || []).map(
              (solicitud: SolicitudConexion) => {
                const solicitanteId = obtenerUsuarioId(
                  solicitud.usuariosolicitante
                );
                const receptorId = obtenerUsuarioId(solicitud.usuarioreceptor);

                if (solicitanteId === idUsuario) {
                  return receptorId;
                }

                return solicitanteId;
              }
            );

            const idsPendientesFiltrados = idsPendientes.filter(Boolean);
            setSolicitudesPendientesIds(idsPendientesFiltrados);
            setCached(
              `solicitudes-pendientes:usuario:${idUsuario}`,
              idsPendientesFiltrados
            );
          }
        })
        .catch((error) => {
          console.log("Error cargando solicitudes:", error);
        });

      const cargarBloqueosRequest = responseBloqueosPromise
        .then(async (responseBloqueos) => {
          const dataBloqueos = await responseBloqueos.json();

          if (responseBloqueos.ok) {
            const ids = (dataBloqueos.bloqueos || [])
              .map((bloqueo: { bloqueadoId: Usuario | string }) =>
                obtenerUsuarioId(bloqueo.bloqueadoId)
              )
              .filter(Boolean) as string[];

            setBloqueadosIds(ids);
          }
        })
        .catch((error) => {
          console.log("Error cargando bloqueos:", error);
        });

      const responseEvento = await responseEventoPromise;
      const dataEvento = await responseEvento.json();

      if (!responseEvento.ok) {
        if (!silencioso) {
          alert(dataEvento.message || dataEvento.error || "Error al traer evento.");
        }
        return;
      }

      const eventoObtenido = dataEvento.evento || dataEvento;
      setEvento(eventoObtenido);
      setCached(`evento:${eventoId}`, eventoObtenido);

      if (!silencioso) {
        setLoading(false);
      }

      await Promise.all([
        cargarAsistenciasRequest,
        cargarConexionesRequest,
        cargarSolicitudesRequest,
        cargarBloqueosRequest,
      ]);

      cargarPublicaciones(eventoId, silencioso);
    } catch (error) {
      console.log("Error en pantalla de personas:", error);
      if (!silencioso) {
        alert("No se pudo conectar con el servidor.");
      }
    } finally {
      if (!silencioso) {
        setLoading(false);
        setLoadingPersonas(false);
      }
    }
  };

  const cargarPublicaciones = async (eventoId: string, silencioso = false) => {
    try {
      const publicacionesCacheadas = getCached<Publicacion[]>(
        `publicaciones:evento:${eventoId}`
      );
      if (!silencioso && publicacionesCacheadas) {
        setPublicaciones(publicacionesCacheadas);
        setLoadingPublicaciones(false);
      }

      if (!silencioso) {
        setLoadingPublicaciones(!publicacionesCacheadas);
      }

      const query = usuarioActualId ? `?usuarioId=${usuarioActualId}` : "";
      const response = await fetch(
        `${API_URL}/api/publicaciones/evento/${eventoId}${query}`
      );

      const data = await response.json();

      if (!response.ok) {
        console.log("Error al traer publicaciones:", data);
        return;
      }

      const publicacionesObtenidas = data.publicaciones || [];
      setPublicaciones(publicacionesObtenidas);
      setCached(`publicaciones:evento:${eventoId}`, publicacionesObtenidas);

      if (!silencioso) {
        setLoadingPublicaciones(false);
      }
    } catch (error) {
      console.log("Error cargando publicaciones:", error);
    } finally {
      if (!silencioso && !getCached<Publicacion[]>(`publicaciones:evento:${eventoId}`)) {
        setLoadingPublicaciones(false);
      }
    }
  };

  const refrescarPersonasYConexiones = async () => {
    try {
      if (!id || !usuarioActualId) return;

      try {
        const responseResumen = await fetch(
          `${API_URL}/api/eventos/resumen/${String(id)}/usuario/${usuarioActualId}`
        );
        const dataResumen = await responseResumen.json();

        if (responseResumen.ok) {
          const asistenciasObtenidas = dataResumen.asistencias || [];
          const conexionesObtenidas = dataResumen.conexiones || [];
          const idsPendientes = (dataResumen.solicitudes || []).map(
            (solicitud: SolicitudConexion) => {
              const solicitanteId = obtenerUsuarioId(solicitud.usuariosolicitante);
              const receptorId = obtenerUsuarioId(solicitud.usuarioreceptor);

              if (solicitanteId === usuarioActualId) {
                return receptorId;
              }

              return solicitanteId;
            }
          );
          const idsPendientesFiltrados = idsPendientes.filter(Boolean);
          const idsBloqueados = (dataResumen.bloqueos || [])
            .map((bloqueo: { bloqueadoId: Usuario | string }) =>
              obtenerUsuarioId(bloqueo.bloqueadoId)
            )
            .filter(Boolean) as string[];

          if (dataResumen.evento) {
            setEvento(dataResumen.evento);
            setCached(`evento:${String(id)}`, dataResumen.evento);
          }

          setAsistencias(asistenciasObtenidas);
          setCached(`asistencias:evento:${String(id)}`, asistenciasObtenidas);

          setConexiones(conexionesObtenidas);
          setCached(`conexiones:usuario:${usuarioActualId}`, conexionesObtenidas);
          setConexionesIds(
            obtenerIdsConexiones(conexionesObtenidas, usuarioActualId)
          );

          setSolicitudesPendientesIds(idsPendientesFiltrados);
          setCached(
            `solicitudes-pendientes:usuario:${usuarioActualId}`,
            idsPendientesFiltrados
          );
          setBloqueadosIds(idsBloqueados);
          return;
        }
      } catch (errorResumen) {
        console.log("Error refrescando resumen de evento:", errorResumen);
      }

      const [
        responseAsistencias,
        responseConexiones,
        responseSolicitudes,
      ] = await Promise.all([
        fetch(`${API_URL}/api/asistencias/evento/${id}`),
        fetch(`${API_URL}/api/conexiones/usuario/${usuarioActualId}`),
        fetch(`${API_URL}/api/solicitudes-conexion/pendientes/${usuarioActualId}`),
      ]);

      const dataAsistencias = await responseAsistencias.json();

      if (responseAsistencias.ok) {
        setAsistencias(dataAsistencias.asistencias || []);
        setCached(`asistencias:evento:${id}`, dataAsistencias.asistencias || []);
      }

      const dataConexiones = await responseConexiones.json();

      if (responseConexiones.ok) {
        const conexionesObtenidas = dataConexiones || [];
        setConexiones(conexionesObtenidas);
        setCached(`conexiones:usuario:${usuarioActualId}`, conexionesObtenidas);
        setConexionesIds(
          obtenerIdsConexiones(conexionesObtenidas, usuarioActualId)
        );
      }

      const dataSolicitudes = await responseSolicitudes.json();

      if (responseSolicitudes.ok) {
        const idsPendientes = (dataSolicitudes.solicitudes || []).map(
          (solicitud: SolicitudConexion) => {
            const solicitanteId = obtenerUsuarioId(solicitud.usuariosolicitante);
            const receptorId = obtenerUsuarioId(solicitud.usuarioreceptor);

            if (solicitanteId === usuarioActualId) {
              return receptorId;
            }

            return solicitanteId;
          }
        );

        setSolicitudesPendientesIds(idsPendientes.filter(Boolean));
        setCached(
          `solicitudes-pendientes:usuario:${usuarioActualId}`,
          idsPendientes.filter(Boolean)
        );
      }
    } catch (error) {
      console.log("Error refrescando personas:", error);
    }
  };

  useAutoRefresh(
    useCallback(() => refrescarPersonasYConexiones(), [id, usuarioActualId]),
    60000,
    !loading
  );

  const crearPublicacion = async () => {
    try {
      if (eventoYaPaso(evento?.fecha)) {
        alert("No se pueden agregar publicaciones a un evento finalizado.");
        return;
      }

      if (!nuevaPublicacion.trim()) {
        alert("Escribí algo para publicar.");
        return;
      }

      if (!usuarioActualId || !id) {
        alert("No se pudo identificar usuario o evento.");
        return;
      }

      const response = await fetch(`${API_URL}/api/publicaciones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId: usuarioActualId,
          eventoId: String(id),
          contenido: nuevaPublicacion.trim(),
          imagen: "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo crear la publicación.");
        return;
      }

      const publicacionNueva: Publicacion = {
        ...data.publicacion,
        comentariosCount: 0,
        usuarioId:
          usuarioActual ||
          ({
            _id: usuarioActualId,
            nombre: "Yo",
          } as Usuario),
        createdAt: data.publicacion.createdAt || new Date().toISOString(),
      };

      setPublicaciones((prev) => {
        const publicacionesActualizadas = [publicacionNueva, ...prev];
        setCached(`publicaciones:evento:${String(id)}`, publicacionesActualizadas);
        return publicacionesActualizadas;
      });

      setComentariosPorPublicacion((prev) => ({
        ...prev,
        [publicacionNueva._id]: [],
      }));

      setNuevaPublicacion("");
      setModalPublicacionVisible(false);
    } catch (error) {
      console.log("Error al crear publicación:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  const abrirPerfilUsuario = (usuarioId?: string | null) => {
    if (!usuarioId) return;
    router.push(`/user-profile/${usuarioId}` as any);
  };

  const volver = () => {
    if (returnToHome === "1") {
      router.replace("/home" as any);
      return;
    }

    router.back();
  };

  const obtenerConexionConUsuario = (usuarioId?: string | null) => {
    if (!usuarioId) return null;

    return (
      conexiones.find((conexion) => {
        const usuario1Id = obtenerUsuarioId(conexion.usuario1);
        const usuario2Id = obtenerUsuarioId(conexion.usuario2);

        return usuario1Id === usuarioId || usuario2Id === usuarioId;
      }) || null
    );
  };

  const abrirChat = async (
    conexion: Conexion,
    usuarioConexionId?: string | null
  ) => {
    try {
      if (!usuarioActualId || !usuarioConexionId) return;

      const responseExistente = await fetch(
        `${API_URL}/api/chats/entre/${usuarioActualId}/${usuarioConexionId}`
      );

      if (responseExistente.ok) {
        const dataExistente = await responseExistente.json();
        router.push(`/chat/${dataExistente.chat._id}` as any);
        return;
      }

      const response = await fetch(`${API_URL}/api/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conexionId: conexion._id,
          participantes: [usuarioActualId, usuarioConexionId],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo abrir el chat.");
        return;
      }

      router.push(`/chat/${data.chat._id}` as any);
    } catch (error) {
      console.log("Error abriendo chat:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

 const abrirChatGrupalEvento = async () => {
  try {
    if (!id || !usuarioActualId) {
      alert("No se pudo identificar usuario o evento.");
      return;
    }

    const response = await fetch(`${API_URL}/api/chats/evento/${String(id)}/unirse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usuarioId: usuarioActualId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || data.detalle || "No se pudo abrir el chat grupal.");
      return;
    }

    router.push(`/chat/${data.chat._id}` as any);
  } catch (error) {
    console.log("Error abriendo chat grupal:", error);
    alert("No se pudo conectar con el servidor.");
  }
};

  const enviarSolicitudConexion = async (usuarioReceptorId?: string | null) => {
    try {
      const usuarioGuardado = await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado) {
        router.replace("/login" as any);
        return;
      }

      const usuario = JSON.parse(usuarioGuardado);
      const usuarioSolicitanteId = usuario.id || usuario._id;

      if (!usuarioSolicitanteId || !usuarioReceptorId) {
        alert("No se pudo identificar a los usuarios.");
        return;
      }

      if (usuarioSolicitanteId === usuarioReceptorId) {
        alert("No podés conectarte con vos mismo.");
        return;
      }

      const response = await fetch(`${API_URL}/api/solicitudes-conexion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuariosolicitante: usuarioSolicitanteId,
          usuarioreceptor: usuarioReceptorId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.mensaje || "No se pudo enviar la solicitud.");
        return;
      }

      setSolicitudesPendientesIds((prev) => {
        if (prev.includes(usuarioReceptorId)) {
          return prev;
        }

        return [...prev, usuarioReceptorId];
      });

      invalidateSocialCaches(usuarioSolicitanteId);
      alert("Solicitud enviada correctamente.");
    } catch (error) {
      console.log("Error al enviar solicitud:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  const obtenerInicial = (nombre?: string) => {
    if (!nombre) return "U";
    return nombre.charAt(0).toUpperCase();
  };

  const obtenerUsuarioId = (usuario?: Usuario | string | null) => {
    if (!usuario) return null;
    if (typeof usuario === "string") return usuario;
    return usuario._id || usuario.id;
  };

  const obtenerIdsConexiones = (
    conexionesObtenidas: Conexion[],
    idUsuario: string
  ) => {
    return conexionesObtenidas
      .map((conexion) => {
        const usuario1Id = obtenerUsuarioId(conexion.usuario1);
        const usuario2Id = obtenerUsuarioId(conexion.usuario2);

        if (usuario1Id === idUsuario) {
          return usuario2Id;
        }

        return usuario1Id;
      })
      .filter(Boolean) as string[];
  };

  const esAmigo = (usuarioId?: string | null) => {
    if (!usuarioId) return false;
    return conexionesIds.includes(usuarioId);
  };

  const tieneSolicitudPendiente = (usuarioId?: string | null) => {
    if (!usuarioId) return false;
    return solicitudesPendientesIds.includes(usuarioId);
  };

  const obtenerUbicacionEvento = () => {
    if (!evento?.ubicacion) return "Ubicación a confirmar";

    if (evento.ubicacion.barrio) return evento.ubicacion.barrio;
    if (evento.ubicacion.ciudad) return evento.ubicacion.ciudad;
    if (evento.ubicacion.direccion) return evento.ubicacion.direccion;

    return "Ubicación a confirmar";
  };

  const asistenciasFiltradas = asistencias.filter((asistencia) => {
    const idUsuario = obtenerUsuarioId(asistencia.usuarioId);
    return idUsuario !== usuarioActualId && !bloqueadosIds.includes(idUsuario || "");
  });

  const personasFiltradas = asistenciasFiltradas.filter((asistencia) => {
    const usuario = asistencia.usuarioId;
    const texto = busquedaPersonas.toLowerCase().trim();

    if (!texto) return true;

    const nombre = usuario?.nombre?.toLowerCase() || "";
    const nombreUsuario = usuario?.nombreUsuario?.toLowerCase() || "";
    const email = usuario?.email?.toLowerCase() || "";
    const bio = usuario?.bio?.toLowerCase() || "";
    const intereses = usuario?.intereses?.join(" ").toLowerCase() || "";

    return (
      nombre.includes(texto) ||
      nombreUsuario.includes(texto) ||
      email.includes(texto) ||
      bio.includes(texto) ||
      intereses.includes(texto)
    );
  });

  if (loading) {
    return <LoadingScreen text="Cargando personas..." />;
  }

  if (!evento) {
    return (
      <EmptyState
        title="No se encontró el evento"
        text="Volvé e intentá entrar nuevamente."
        buttonText="Volver"
        onPress={() => router.back()}
      />
    );
  }

  const eventoFinalizado = eventoYaPaso(evento.fecha);

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <TouchableOpacity style={styles.backButton} onPress={volver}>
          <ArrowLeft size={22} color="#332047" />
        </TouchableOpacity>

        <View style={styles.headerCard}>
          <Image
            source={{ uri: obtenerImagen(evento.imagen) }}
            style={styles.eventImage}
          />

          <View style={styles.headerInfo}>
            <Text style={styles.eventTitle}>{evento.nombre}</Text>

            <Text style={styles.eventDate}>
              {formatearFechaLarga(evento.fecha)}
            </Text>

            <Text style={styles.eventLocation}>{obtenerUbicacionEvento()}</Text>

            <View style={styles.avatarRow}>
              {asistenciasFiltradas.slice(0, 5).map((asistencia, index) => (
                <TouchableOpacity
                  key={asistencia._id}
                  style={[styles.smallAvatar, index > 0 && styles.avatarOverlap]}
                  activeOpacity={0.85}
                  onPress={() =>
                    abrirPerfilUsuario(obtenerUsuarioId(asistencia.usuarioId))
                  }
                >
                  <Text style={styles.smallAvatarText}>
                    {obtenerInicial(asistencia.usuarioId?.nombre)}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={styles.plusCircle}>
                <Plus size={13} color="#FFFFFF" />
              </View>

              <Text style={styles.moreText}>
                +{asistenciasFiltradas.length} personas
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <View style={styles.quickActionCard}>
            <Users size={20} color="#6D28E8" />
            <Text style={styles.quickActionNumber}>
              {asistenciasFiltradas.length}
            </Text>
            <Text style={styles.quickActionLabel}>van</Text>
          </View>

          <View style={styles.quickActionCard}>
            <MessageCircle size={20} color="#6D28E8" />
            <Text style={styles.quickActionNumber}>{publicaciones.length}</Text>
            <Text style={styles.quickActionLabel}>posts</Text>
          </View>

          <TouchableOpacity
            style={styles.quickActionCard}
            activeOpacity={0.85}
            onPress={abrirChatGrupalEvento}  
          >
            <MessageCircle size={20} color="#6D28E8" />
            <Text style={styles.quickActionNumber}>Chat</Text>
            <Text style={styles.quickActionLabel}>grupal</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabsCard}>
          <TouchableOpacity
            style={[styles.tab, tabActiva === "personas" && styles.tabActive]}
            onPress={() => setTabActiva("personas")}
          >
            <Text
              style={[
                styles.tabText,
                tabActiva === "personas" && styles.tabTextActive,
              ]}
            >
              Personas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, tabActiva === "publicaciones" && styles.tabActive]}
            onPress={() => setTabActiva("publicaciones")}
          >
            <Text
              style={[
                styles.tabText,
                tabActiva === "publicaciones" && styles.tabTextActive,
              ]}
            >
              Publicaciones
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, tabActiva === "chat" && styles.tabActive]}
            onPress={() => setTabActiva("chat")}
          >
            <Text
              style={[styles.tabText, tabActiva === "chat" && styles.tabTextActive]}
            >
              Chat grupal
            </Text>
          </TouchableOpacity>
        </View>

        {tabActiva === "personas" && (
          <View style={styles.peopleList}>
            <View style={styles.peopleSectionHeader}>
              <View>
                <Text style={styles.peopleSectionTitle}>Personas que van</Text>
                <Text style={styles.peopleSectionSubtitle}>
                  {personasFiltradas.length} perfiles para conocer antes del evento
                </Text>
              </View>

              <TouchableOpacity
                style={styles.groupChatShortcut}
                activeOpacity={0.85}
                onPress={abrirChatGrupalEvento}
              >
                <MessageCircle size={18} color="#6D28E8" />
              </TouchableOpacity>
            </View>

            <View style={styles.peopleSearchBox}>
              <Search size={18} color="#8B35E8" />
              <TextInput
                style={styles.peopleSearchInput}
                placeholder="Buscar personas por nombre o intereses..."
                placeholderTextColor="#A7A7B0"
                value={busquedaPersonas}
                onChangeText={setBusquedaPersonas}
              />
            </View>

            {loadingPersonas && asistenciasFiltradas.length === 0 ? (
              <View style={styles.peopleLoadingCard}>
                <Text style={styles.peopleLoadingText}>
                  Cargando asistencias...
                </Text>
              </View>
            ) : asistenciasFiltradas.length === 0 ? (
              <EmptyState
                title="Todavía no hay otros interesados"
                text="Cuando otras personas toquen “Quiero ir”, van a aparecer en esta lista."
              />
            ) : personasFiltradas.length === 0 ? (
              <EmptyState
                title="No encontramos personas"
                text="Probá buscar otro nombre, email o interés."
              />
            ) : (
              personasFiltradas.map((asistencia) => {
                const usuario = asistencia.usuarioId;
                const receptorId = obtenerUsuarioId(usuario);
                const yaEsAmigo = esAmigo(receptorId);
                const solicitudPendiente = tieneSolicitudPendiente(receptorId);
                const conexion = obtenerConexionConUsuario(receptorId);
                const intereses = usuario?.intereses?.slice(0, 3) || [];
                return (
                  <View key={asistencia._id} style={styles.personCard}>
                    <View style={styles.personAvatarWrap}>
                      <ProfileAvatarLink usuario={usuario} size={48} />
                    </View>

                    <TouchableOpacity
                      style={styles.personInfo}
                      activeOpacity={0.85}
                      onPress={() => abrirPerfilUsuario(receptorId)}
                    >
                      <Text style={styles.personName}>
                        {usuario?.nombre || "Usuario"}
                      </Text>

                      <Text style={styles.personSubtitle}>
                        @{usuario?.nombreUsuario || "usuario"}
                      </Text>

                      {intereses.length > 0 && (
                        <View style={styles.personChips}>
                          {intereses.slice(0, 2).map((interes) => (
                            <View key={interes} style={styles.personChip}>
                              <Text style={styles.personChipText}>{interes}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {(yaEsAmigo || solicitudPendiente) && (
                        <Text style={styles.statusText}>
                          {yaEsAmigo ? "Ya son conexión" : "Solicitud pendiente"}
                        </Text>
                      )}
                    </TouchableOpacity>

                    {yaEsAmigo ? (
                      <TouchableOpacity
                        style={[styles.personActionButton, styles.friendButton]}
                        activeOpacity={0.85}
                        onPress={() => conexion && abrirChat(conexion, receptorId)}
                      >
                        <MessageCircle size={17} color="#12A150" />
                      </TouchableOpacity>
                    ) : solicitudPendiente ? (
                      <View style={[styles.personActionButton, styles.pendingButton]}>
                        <Clock3 size={17} color="#8B35E8" />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.personActionButton, styles.connectButton]}
                        activeOpacity={0.85}
                        onPress={() => enviarSolicitudConexion(receptorId)}
                      >
                        <UserPlus size={17} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {tabActiva === "publicaciones" && (
          <View style={styles.publicacionesContainer}>
            <TouchableOpacity
              style={[
                styles.openPostButton,
                eventoFinalizado && styles.openPostButtonDisabled,
              ]}
              activeOpacity={0.85}
              disabled={eventoFinalizado}
              onPress={() => setModalPublicacionVisible(true)}
            >
              <Plus size={20} color={eventoFinalizado ? "#8D8A99" : "#FFFFFF"} />
              <Text
                style={[
                  styles.openPostButtonText,
                  eventoFinalizado && styles.openPostButtonTextDisabled,
                ]}
              >
                {eventoFinalizado ? "Evento finalizado" : "Crear publicación"}
              </Text>
            </TouchableOpacity>

            {eventoFinalizado && (
              <Text style={styles.finishedEventText}>
                Este evento ya finalizó. Podés leer las publicaciones, pero no crear nuevas.
              </Text>
            )}

            {loadingPublicaciones ? (
              <Text style={styles.loadingPublicacionesText}>
                Cargando publicaciones...
              </Text>
            ) : publicaciones.length === 0 ? (
              <EmptyState
                title="Todavía no hay publicaciones"
                text="Sé la primera persona en publicar algo sobre este evento."
              />
            ) : (
              publicaciones
                .filter((publicacion) => {
                  const autorId = obtenerUsuarioId(publicacion.usuarioId as any);
                  return !autorId || !bloqueadosIds.includes(autorId);
                })
                .map((publicacion) => {
                const comentarios = comentariosPorPublicacion[publicacion._id] || [];

                return (
                  <PublicationPreviewCard
                    key={publicacion._id}
                    publicacion={publicacion}
                    comentariosCount={
                      publicacion.comentariosCount ?? comentarios.length
                    }
                    onPress={() =>
                      router.push(`/publication-detail/${publicacion._id}` as any)
                    }
                  />
                );
              })
            )}
          </View>
        )}

        {tabActiva === "chat" && (
          <View style={styles.infoCard}>
            <SectionHeader title="Chat grupal" />

            <View style={styles.groupChatHero}>
              <MessageCircle size={26} color="#FFFFFF" />
            </View>

            <Text style={styles.chatTitle}>Coordiná con quienes van</Text>

            <Text style={styles.infoText}>
              Este grupo es del evento {evento.nombre}. Al unirte vas a poder
              ver participantes y escribir como en un grupo.
            </Text>

            <TouchableOpacity
              style={styles.openChatButton}
              activeOpacity={0.85}
              onPress={abrirChatGrupalEvento}
            >
              <Text style={styles.openChatButtonText}>Unirme al grupo</Text>
            </TouchableOpacity>

            <Text style={styles.infoLabel}>Descripción</Text>
            <Text style={styles.infoText}>
              {evento.descripcion || "Sin descripción cargada."}
            </Text>

            <Text style={styles.infoLabel}>Categoría</Text>
            <Text style={styles.infoText}>{evento.categoria || "Evento"}</Text>

            <Text style={styles.infoLabel}>Organizador</Text>
            <Text style={styles.infoText}>{evento.organizador || "eBA"}</Text>
          </View>
        )}
      </ScrollView>

      <CreatePublicationModal
        visible={modalPublicacionVisible}
        usuarioActual={usuarioActual}
        texto={nuevaPublicacion}
        onChangeTexto={setNuevaPublicacion}
        onClose={() => {
          setModalPublicacionVisible(false);
          setNuevaPublicacion("");
        }}
        onPublish={crearPublicacion}
      />

      <BottomNav />
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
    paddingBottom: 140,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  headerCard: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E8E2F8",
  },
  eventImage: {
    width: 104,
    height: 96,
    borderRadius: 18,
    marginRight: 18,
  },
  headerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#2D2934",
    marginBottom: 6,
  },
  eventDate: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2D2934",
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 13,
    color: "#6F6D7A",
    marginBottom: 10,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  smallAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#8B35E8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  smallAvatarText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  plusCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#8B35E8",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  moreText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#2D2934",
    fontWeight: "700",
  },
  quickActions: {
    flexDirection: "row",
    marginBottom: 18,
  },
  quickActionCard: {
    flex: 1,
    minHeight: 76,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E2F8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  quickActionNumber: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: "900",
    color: "#2D2934",
  },
  quickActionLabel: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: "800",
    color: "#8D8A99",
  },
  tabsCard: {
    height: 46,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    padding: 4,
    marginBottom: 28,
  },
  tab: {
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: "#8B35E8",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2D2934",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },

  peopleList: {
    paddingBottom: 20,
  },
  peopleSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  peopleSectionTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#2D2934",
  },
  peopleSectionSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: "#8D8A99",
  },
  groupChatShortcut: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#F1ECFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E1D6FA",
  },
  peopleLoadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  peopleLoadingText: {
    color: "#8D8A99",
    fontSize: 14,
    fontWeight: "800",
  },
  peopleSearchBox: {
    height: 44,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0D9F4",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  peopleSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#332047",
    outlineStyle: "none" as any,
  },
  personCard: {
    minHeight: 82,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ECE7F5",
    shadowColor: "#3A245A",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 1,
  },
  personAvatarWrap: {
    alignSelf: "flex-start",
  },
  personInfo: {
    flex: 1,
    marginLeft: 4,
    paddingRight: 6,
  },
  personName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#2D2934",
    marginBottom: 2,
  },
  personSubtitle: {
    fontSize: 12,
    color: "#8D8A99",
    fontWeight: "700",
    marginBottom: 7,
  },
  personChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  personChip: {
    backgroundColor: "#F1ECFF",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 4,
  },
  personChipText: {
    fontSize: 10,
    color: "#7528F0",
    fontWeight: "900",
  },
  statusText: {
    fontSize: 11,
    color: "#6F6D7A",
    fontWeight: "800",
    lineHeight: 15,
  },
  personActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  connectButton: {
    backgroundColor: "#6D28E8",
  },
  friendButton: {
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#C9F3DA",
  },
  pendingButton: {
    backgroundColor: "#F1ECFF",
    borderWidth: 1,
    borderColor: "#E1D6FA",
  },

  publicacionesContainer: {
    paddingBottom: 24,
  },
  openPostButton: {
    height: 50,
    borderRadius: 24,
    backgroundColor: "#8B35E8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  openPostButtonDisabled: {
    backgroundColor: "#ECE8F4",
    marginBottom: 8,
  },
  openPostButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 8,
  },
  openPostButtonTextDisabled: {
    color: "#8D8A99",
  },
  finishedEventText: {
    color: "#8D8A99",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginBottom: 18,
    textAlign: "center",
  },
  loadingPublicacionesText: {
    textAlign: "center",
    color: "#8D8A99",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  groupChatHero: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#6D28E8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#2D2934",
    marginBottom: 8,
  },
  openChatButton: {
    height: 48,
    borderRadius: 18,
    backgroundColor: "#6D28E8",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 10,
  },
  openChatButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: "#7528F0",
    marginTop: 10,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#6F6D7A",
    lineHeight: 21,
  },
});
