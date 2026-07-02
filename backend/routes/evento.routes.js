const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Evento = require("../models/Evento");
const Conexion = require("../models/Conexion");
const Notificacion = require("../models/Notificacion");
const Usuario = require("../models/Usuario");
const actualizarEventosVencidos = require("../utils/actualizarEventos");

const safeRequire = (ruta) => {
  try {
    return require(ruta);
  } catch (error) {
    console.log(`Modelo no disponible ${ruta}:`, error.message);
    return null;
  }
};

const Asistencia = safeRequire("../models/Asistencia");
const Publicacion = safeRequire("../models/Publicacion");
const Comentario = safeRequire("../models/Comentario");
const Favorito = safeRequire("../models/Favorito");
const Bloqueo = safeRequire("../models/Bloqueo");
const SolicitudConexion = safeRequire("../models/SolicitudConexion");
const PromocionEvento = safeRequire("../models/PromocionEvento");
const Pago = safeRequire("../models/Pago");
const Plan = safeRequire("../models/Plan");
const Reporte = safeRequire("../models/Reporte");
const LogActividad = safeRequire("../models/LogActividad");

const eliminarSiExiste = async (Modelo, filtro) => {
  if (!Modelo) {
    return { deletedCount: 0 };
  }

  return await Modelo.deleteMany(filtro);
};

// Un manager puede gestionar cualquier evento. Un organizador solo los suyos.
// Si no mandan solicitanteId (llamadas viejas del panel de manager), se deja pasar
// para no romper flujos existentes.
const verificarPermisoSobreEvento = async (evento, solicitanteId) => {
  if (!solicitanteId) {
    return { permitido: true };
  }

  if (!mongoose.Types.ObjectId.isValid(solicitanteId)) {
    return { permitido: false, status: 400, error: "Id de usuario inválido" };
  }

  const solicitante = await Usuario.findById(solicitanteId);

  if (!solicitante) {
    return { permitido: false, status: 404, error: "Usuario no encontrado" };
  }

  if (solicitante.esManager) {
    return { permitido: true };
  }

  if (
    evento.organizadorId &&
    evento.organizadorId.toString() === String(solicitanteId)
  ) {
    return { permitido: true };
  }

  return {
    permitido: false,
    status: 403,
    error: "No tenés permiso para modificar este evento",
  };
};

const filtroConexionesUsuario = (usuarioId) => ({
  $or: [
    { usuario1: usuarioId },
    { usuario2: usuarioId },
    { usuario1Id: usuarioId },
    { usuario2Id: usuarioId },
  ],
});

const camposUsuarioConexion =
  "nombre nombreUsuario email fotoPerfilMini intereses bio ubicacionAproximada";

const poblarUsuariosConexion = (query) =>
  query
    .populate("usuario1", camposUsuarioConexion)
    .populate("usuario2", camposUsuarioConexion)
    .populate("usuario1Id", camposUsuarioConexion)
    .populate("usuario2Id", camposUsuarioConexion);

const normalizarConexion = (conexion) => {
  if (!conexion) return conexion;

  const conexionNormalizada = { ...conexion };
  conexionNormalizada.usuario1 = conexion.usuario1 || conexion.usuario1Id;
  conexionNormalizada.usuario2 = conexion.usuario2 || conexion.usuario2Id;

  delete conexionNormalizada.usuario1Id;
  delete conexionNormalizada.usuario2Id;

  return conexionNormalizada;
};

// Obtener todos los eventos (solo aprobados, de cara al público)
router.get("/", async (req, res) => {
  try {
    await actualizarEventosVencidos();

    const eventos = await Evento.find({ estado: "aprobado" }).sort({ fecha: 1 });

    res.json({
      message: "Eventos obtenidos correctamente",
      eventos,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener eventos",
      detalle: error.message,
    });
  }
});

// Obtener eventos activos
router.get("/activos", async (req, res) => {
  try {
    await actualizarEventosVencidos();

    const eventos = await Evento.find({
      activo: true,
      estado: "aprobado",
    }).sort({ fecha: 1 });

    res.json({
      message: "Eventos activos obtenidos correctamente",
      eventos,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener eventos activos",
      detalle: error.message,
    });
  }
});

// Obtener eventos promocionados
router.get("/promocionados", async (req, res) => {
  try {
    await actualizarEventosVencidos();

    const eventos = await Evento.find({
      esPromocionado: true,
      activo: true,
      estado: "aprobado",
      fecha: { $gte: new Date() },
    }).sort({ fecha: 1 });

    res.json({
      message: "Eventos promocionados obtenidos correctamente",
      eventos,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener eventos promocionados",
      detalle: error.message,
    });
  }
});

// Obtener eventos promocionados activos
router.get("/promocionados-activos", async (req, res) => {
  try {
    await actualizarEventosVencidos();

    const eventos = await Evento.find({
      esPromocionado: true,
      activo: true,
      estado: "aprobado",
    }).sort({ fecha: 1 });

    res.json({
      message: "Eventos promocionados activos obtenidos correctamente",
      eventos,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener eventos promocionados activos",
      detalle: error.message,
    });
  }
});

// ===== VISTAS DE MANAGER (verificación de eventos) =====

// GET /api/eventos/pendientes -> cola de eventos a verificar
router.get("/pendientes", async (req, res) => {
  try {
    const eventos = await Evento.find({ estado: "pendiente" }).sort({
      createdAt: 1,
    });

    res.json({
      message: "Eventos pendientes obtenidos correctamente",
      eventos,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener eventos pendientes",
      detalle: error.message,
    });
  }
});

// GET /api/eventos/manager/todos -> todos los eventos sin importar estado (panel manager)
router.get("/manager/todos", async (req, res) => {
  try {
    const { estado } = req.query;

    const filtro = estado ? { estado } : {};

    const eventos = await Evento.find(filtro).sort({ createdAt: -1 });

    res.json({
      message: "Eventos obtenidos correctamente",
      eventos,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener eventos",
      detalle: error.message,
    });
  }
});

// PATCH /api/eventos/:id/estado -> el manager aprueba o rechaza un evento
router.patch("/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, motivoRechazo, managerId } = req.body;

    if (!["aprobado", "rechazado", "pendiente"].includes(estado)) {
      return res.status(400).json({
        error: "Estado inválido. Debe ser aprobado, rechazado o pendiente",
      });
    }

    if (managerId) {
      const manager = await Usuario.findById(managerId);

      if (!manager || !manager.esManager) {
        return res.status(403).json({
          error: "El usuario no tiene permisos de manager",
        });
      }
    }

    const evento = await Evento.findById(id);

    if (!evento) {
      return res.status(404).json({
        error: "Evento no encontrado",
      });
    }

    evento.estado = estado;
    evento.motivoRechazo = estado === "rechazado" ? motivoRechazo || "" : "";
    evento.verificadoPor = managerId || evento.verificadoPor;
    evento.verificadoEn = new Date();

    await evento.save();

    if (evento.organizadorId && (estado === "aprobado" || estado === "rechazado")) {
      await Notificacion.create({
        usuarioId: evento.organizadorId,
        mensaje:
          estado === "aprobado"
            ? `¡Tu evento "${evento.nombre}" fue aprobado y ya está publicado!`
            : `Tu evento "${evento.nombre}" fue rechazado. Motivo: ${
                evento.motivoRechazo || "sin especificar"
              }`,
        tipo: "evento",
        entidadTipo: "evento",
        entidadId: evento._id,
        actorId: managerId || undefined,
      });

      if (estado === "aprobado") {
        const organizador = await Usuario.findById(evento.organizadorId);

        if (organizador) {
          const conexiones = await Conexion.find({
            $or: [
              { usuario1Id: organizador._id },
              { usuario2Id: organizador._id },
            ],
          });

          for (const conexion of conexiones) {
            const usuarioNotificar =
              conexion.usuario1Id.toString() === organizador._id.toString()
                ? conexion.usuario2Id
                : conexion.usuario1Id;

            await Notificacion.create({
              usuarioId: usuarioNotificar,
              mensaje: `${organizador.nombre} creó un nuevo evento: ${evento.nombre}`,
              tipo: "evento",
              entidadTipo: "evento",
              entidadId: evento._id,
              actorId: organizador._id,
            });
          }
        }
      }
    }

    res.json({
      message: `Evento ${estado} correctamente`,
      evento,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar el estado del evento",
      detalle: error.message,
    });
  }
});

// Crear evento
router.post("/", async (req, res) => {
  try {
    const datosEvento = { ...req.body };

    if (datosEvento.organizadorId) {
      if (!mongoose.Types.ObjectId.isValid(datosEvento.organizadorId)) {
        return res.status(400).json({ error: "Id de organizador inválido" });
      }

      const organizadorSolicitante = await Usuario.findById(
        datosEvento.organizadorId
      );

      if (!organizadorSolicitante || !organizadorSolicitante.esOrganizador) {
        return res.status(403).json({
          error: "Solo un organizador verificado puede crear eventos",
        });
      }

      // Todo evento creado por un organizador entra a revisión, sin importar
      // qué estado mande el cliente.
      datosEvento.estado = "pendiente";
      datosEvento.motivoRechazo = "";
      datosEvento.verificadoPor = undefined;
      datosEvento.verificadoEn = undefined;
    }

    const nuevoEvento = new Evento(datosEvento);

    await nuevoEvento.save();

    // Si ya nace aprobado (evento cargado directamente por un manager), se
    // avisa a las conexiones del organizador. Si nace pendiente, se avisa
    // recién cuando un manager lo apruebe.
    if (nuevoEvento.organizadorId && nuevoEvento.estado === "aprobado") {
      const organizador = await Usuario.findById(nuevoEvento.organizadorId);

      if (organizador) {
        const conexiones = await Conexion.find({
          $or: [
            { usuario1Id: organizador._id },
            { usuario2Id: organizador._id },
          ],
        });

        for (const conexion of conexiones) {
          const usuarioNotificar =
            conexion.usuario1Id.toString() === organizador._id.toString()
              ? conexion.usuario2Id
              : conexion.usuario1Id;

          await Notificacion.create({
            usuarioId: usuarioNotificar,
            mensaje: `${organizador.nombre} creó un nuevo evento: ${nuevoEvento.nombre}`,
            tipo: "evento",
            entidadTipo: "evento",
            entidadId: nuevoEvento._id,
            actorId: organizador._id,
          });
        }
      }
    }

    res.status(201).json({
      message:
        nuevoEvento.estado === "pendiente"
          ? "Evento enviado. Un manager lo va a revisar antes de publicarlo."
          : "Evento creado correctamente",
      evento: nuevoEvento,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al crear evento",
      detalle: error.message,
    });
  }
});

// Obtener eventos por categoría
router.get("/categoria/:categoria", async (req, res) => {
  try {
    await actualizarEventosVencidos();

    const eventos = await Evento.find({
      categoria: req.params.categoria,
      estado: "aprobado",
    }).sort({ fecha: 1 });

    res.json({
      message: "Eventos por categoría obtenidos correctamente",
      eventos,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener eventos por categoría",
      detalle: error.message,
    });
  }
});

// Buscar eventos por texto
router.get("/buscar/:texto", async (req, res) => {
  try {
    await actualizarEventosVencidos();

    const texto = req.params.texto;

    const eventos = await Evento.find({
      estado: "aprobado",
      $or: [
        { nombre: { $regex: texto, $options: "i" } },
        { descripcion: { $regex: texto, $options: "i" } },
        { categoria: { $regex: texto, $options: "i" } },
      ],
    }).sort({ fecha: 1 });

    res.json({
      message: "Búsqueda realizada correctamente",
      eventos,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al buscar eventos",
      detalle: error.message,
    });
  }
});

// GET /api/eventos/recomendados/:usuarioId
router.get("/recomendados/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const usuario = await Usuario.findById(usuarioId).select("intereses").lean();

    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    const interesesUsuario = usuario.intereses || [];

    const eventos = await Evento.find({
      categoria: { $in: interesesUsuario },
      fecha: { $gte: new Date() },
      estado: "aprobado",
    }).sort({ fecha: 1 });

    return res.json({
      message: "Eventos recomendados obtenidos correctamente",
      interesesUsuario,
      eventos,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al obtener eventos recomendados",
      detalle: error.message,
    });
  }
});

// GET /api/eventos/resumen/:eventoId/usuario/:usuarioId
router.get("/resumen/:eventoId/usuario/:usuarioId", async (req, res) => {
  try {
    const { eventoId, usuarioId } = req.params;

    const [evento, asistencias, conexiones, solicitudes, bloqueos] =
      await Promise.all([
        Evento.findById(eventoId).lean(),
        Asistencia
          ? Asistencia.find({ eventoId })
              .populate(
                "usuarioId",
                "nombre nombreUsuario email fotoPerfilMini intereses bio ubicacionAproximada"
              )
              .lean()
          : [],
        poblarUsuariosConexion(Conexion.find(filtroConexionesUsuario(usuarioId)))
          .sort({ updatedAt: -1 })
          .lean(),
        SolicitudConexion
          ? SolicitudConexion.find({
              estado: "pendiente",
              $or: [
                { usuariosolicitante: usuarioId },
                { usuarioreceptor: usuarioId },
              ],
            })
              .select("usuariosolicitante usuarioreceptor estado createdAt updatedAt")
              .lean()
          : [],
        Bloqueo
          ? Bloqueo.find({ bloqueadorId: usuarioId })
              .select("bloqueadoId")
              .lean()
          : [],
      ]);

    if (!evento) {
      return res.status(404).json({
        error: "Evento no encontrado",
      });
    }

    return res.json({
      message: "Resumen de evento obtenido correctamente",
      evento,
      asistencias,
      conexiones: conexiones.map(normalizarConexion),
      solicitudes,
      bloqueos,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al obtener resumen de evento",
      detalle: error.message,
    });
  }
});

// GET /api/eventos/organizador/:organizadorId -> todos los eventos propios (cualquier estado)
router.get("/organizador/:organizadorId", async (req, res) => {
  try {
    const { organizadorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(organizadorId)) {
      return res.status(400).json({ error: "Id de organizador inválido" });
    }

    const eventos = await Evento.find({ organizadorId }).sort({
      createdAt: -1,
    });

    res.json({
      message: "Eventos obtenidos correctamente",
      eventos,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener tus eventos",
      detalle: error.message,
    });
  }
});

// PUT /api/eventos/:id -> editar evento (usado por el manager y por el organizador)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { solicitanteId } = req.body;
    const camposEditables = [
      "nombre",
      "descripcion",
      "fecha",
      "ubicacion",
      "categoria",
      "imagen",
      "organizador",
      "activo",
      "esPromocionado",
    ];

    const eventoActual = await Evento.findById(id);

    if (!eventoActual) {
      return res.status(404).json({
        error: "Evento no encontrado",
      });
    }

    const permiso = await verificarPermisoSobreEvento(
      eventoActual,
      solicitanteId
    );

    if (!permiso.permitido) {
      return res.status(permiso.status).json({ error: permiso.error });
    }

    const cambios = {};
    camposEditables.forEach((campo) => {
      if (req.body[campo] !== undefined) {
        cambios[campo] = req.body[campo];
      }
    });

    // Si un organizador (no manager) edita un evento que ya fue revisado,
    // vuelve a quedar pendiente para que el manager lo revise de nuevo.
    if (
      solicitanteId &&
      eventoActual.organizadorId &&
      eventoActual.organizadorId.toString() === String(solicitanteId) &&
      eventoActual.estado !== "pendiente"
    ) {
      cambios.estado = "pendiente";
      cambios.motivoRechazo = "";
      cambios.verificadoPor = null;
      cambios.verificadoEn = null;
    }

    const evento = await Evento.findByIdAndUpdate(id, cambios, {
      new: true,
      runValidators: true,
    });

    if (!evento) {
      return res.status(404).json({
        error: "Evento no encontrado",
      });
    }

    res.json({
      message: "Evento actualizado correctamente",
      evento,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar evento",
      detalle: error.message,
    });
  }
});

// DELETE /api/eventos/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const solicitanteId = req.body?.solicitanteId || req.query?.solicitanteId;

    const evento = await Evento.findById(id);

    if (!evento) {
      return res.status(404).json({
        error: "Evento no encontrado",
      });
    }

    const permiso = await verificarPermisoSobreEvento(evento, solicitanteId);

    if (!permiso.permitido) {
      return res.status(permiso.status).json({ error: permiso.error });
    }

    const idsEvento = [id, evento._id];

    const publicacionesDelEvento = Publicacion
      ? await Publicacion.find({
          $or: [
            { eventoId: { $in: idsEvento } },
            { evento: { $in: idsEvento } },
          ],
        }).select("_id")
      : [];

    const idsPublicaciones = publicacionesDelEvento.map((publicacion) =>
      publicacion._id.toString()
    );

    const idsPublicacionesConObjectId = publicacionesDelEvento.map(
      (publicacion) => publicacion._id
    );

    const comentariosEliminados = await eliminarSiExiste(Comentario, {
      $or: [
        { publicacionId: { $in: idsPublicaciones } },
        { publicacionId: { $in: idsPublicacionesConObjectId } },
        { publicacion: { $in: idsPublicaciones } },
        { publicacion: { $in: idsPublicacionesConObjectId } },
        { eventoId: { $in: idsEvento } },
        { evento: { $in: idsEvento } },
      ],
    });

    const publicacionesEliminadas = await eliminarSiExiste(Publicacion, {
      $or: [
        { eventoId: { $in: idsEvento } },
        { evento: { $in: idsEvento } },
      ],
    });

    const asistenciasEliminadas = await eliminarSiExiste(Asistencia, {
      $or: [
        { eventoId: { $in: idsEvento } },
        { evento: { $in: idsEvento } },
        { eventoAsistidoId: { $in: idsEvento } },
      ],
    });

    const favoritosEliminados = await eliminarSiExiste(Favorito, {
      $or: [
        { eventoId: { $in: idsEvento } },
        { evento: { $in: idsEvento } },
      ],
    });

    const promocionesEliminadas = await eliminarSiExiste(PromocionEvento, {
      $or: [
        { eventoId: { $in: idsEvento } },
        { evento: { $in: idsEvento } },
      ],
    });

    const pagosEliminados = await eliminarSiExiste(Pago, {
      $or: [
        { eventoId: { $in: idsEvento } },
        { evento: { $in: idsEvento } },
        { referenciaId: { $in: idsEvento } },
      ],
    });

    const planesEliminados = await eliminarSiExiste(Plan, {
      $or: [
        { eventoId: { $in: idsEvento } },
        { evento: { $in: idsEvento } },
      ],
    });

    const notificacionesEliminadas = await eliminarSiExiste(Notificacion, {
      $or: [
        { eventoId: { $in: idsEvento } },
        { evento: { $in: idsEvento } },
      ],
    });

    const reportesEliminados = await eliminarSiExiste(Reporte, {
      $or: [
        { eventoId: { $in: idsEvento } },
        { evento: { $in: idsEvento } },
        { entidadId: { $in: idsEvento } },
      ],
    });

    const logsEliminados = await eliminarSiExiste(LogActividad, {
      $or: [
        { eventoId: { $in: idsEvento } },
        { evento: { $in: idsEvento } },
        { entidadId: { $in: idsEvento } },
      ],
    });

    await Evento.findByIdAndDelete(id);

    return res.json({
      message: "Evento eliminado correctamente en cascada",
      eventoEliminado: {
        id: evento._id,
        nombre: evento.nombre,
      },
      detalle: {
        asistenciasEliminadas: asistenciasEliminadas.deletedCount,
        publicacionesEliminadas: publicacionesEliminadas.deletedCount,
        comentariosEliminados: comentariosEliminados.deletedCount,
        favoritosEliminados: favoritosEliminados.deletedCount,
        promocionesEliminadas: promocionesEliminadas.deletedCount,
        pagosEliminados: pagosEliminados.deletedCount,
        planesEliminados: planesEliminados.deletedCount,
        notificacionesEliminadas: notificacionesEliminadas.deletedCount,
        reportesEliminados: reportesEliminados.deletedCount,
        logsEliminados: logsEliminados.deletedCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al eliminar evento",
      detalle: error.message,
    });
  }
});

// Obtener evento por ID
router.get("/:id", async (req, res) => {
  try {
    await actualizarEventosVencidos();

    const evento = await Evento.findById(req.params.id);

    if (!evento) {
      return res.status(404).json({
        error: "Evento no encontrado",
      });
    }

    res.json({
      message: "Evento encontrado",
      evento,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al buscar evento",
      detalle: error.message,
    });
  }
});

module.exports = router;