const express = require("express");
const router = express.Router();

const SolicitudConexion = require("../models/SolicitudConexion");
const Conexion = require("../models/Conexion");
const Notificacion = require("../models/Notificacion");
const Usuario = require("../models/Usuario");
const Chat = require("../models/Chat");

const camposUsuarioSolicitud =
  "nombre nombreUsuario email intereses bio ubicacionAproximada";

const obtenerIdUsuario = (usuario) => {
  if (!usuario) return null;
  return String(usuario._id || usuario.id || usuario);
};

const claveParUsuarios = (usuarioA, usuarioB) =>
  [String(usuarioA), String(usuarioB)].sort().join(":");

const obtenerParesConectados = async (usuarioId) => {
  const [conexiones, solicitudesAceptadas] = await Promise.all([
    Conexion.find({
      $or: [
        { usuario1: usuarioId },
        { usuario2: usuarioId },
        { usuario1Id: usuarioId },
        { usuario2Id: usuarioId },
      ],
    })
      .select("usuario1 usuario2 usuario1Id usuario2Id")
      .lean(),
    SolicitudConexion.find({
      estado: "aceptada",
      $or: [{ usuariosolicitante: usuarioId }, { usuarioreceptor: usuarioId }],
    })
      .select("usuariosolicitante usuarioreceptor")
      .lean(),
  ]);

  const pares = new Set();

  conexiones.forEach((conexion) => {
    const usuario1Id = obtenerIdUsuario(conexion.usuario1 || conexion.usuario1Id);
    const usuario2Id = obtenerIdUsuario(conexion.usuario2 || conexion.usuario2Id);

    if (usuario1Id && usuario2Id) {
      pares.add(claveParUsuarios(usuario1Id, usuario2Id));
    }
  });

  solicitudesAceptadas.forEach((solicitud) => {
    const solicitanteId = obtenerIdUsuario(solicitud.usuariosolicitante);
    const receptorId = obtenerIdUsuario(solicitud.usuarioreceptor);

    if (solicitanteId && receptorId) {
      pares.add(claveParUsuarios(solicitanteId, receptorId));
    }
  });

  return pares;
};

const ocultarSolicitudesDeConexionesExistentes = (solicitudes, paresConectados) =>
  solicitudes.filter((solicitud) => {
    const solicitanteId = obtenerIdUsuario(solicitud.usuariosolicitante);
    const receptorId = obtenerIdUsuario(solicitud.usuarioreceptor);

    if (!solicitanteId || !receptorId) return false;

    return !paresConectados.has(claveParUsuarios(solicitanteId, receptorId));
  });

/*
POST /api/solicitudes
Enviar solicitud de conexión   */
router.post("/", async (req, res) => {
  try {
    const { usuariosolicitante, usuarioreceptor } = req.body;

    if (!usuariosolicitante || !usuarioreceptor) {
      return res.status(400).json({
        mensaje: "Debe indicar ambos usuarios",
      });
    }

    if (usuariosolicitante === usuarioreceptor) {
      return res.status(400).json({
        mensaje: "No puedes conectarte contigo mismo",
      });
    }

    // Se comprueba si es que existe ya una conexion entre estos usuarios
    const filtroParUsuarios = {
      $or: [
        {
          usuario1: usuariosolicitante,
          usuario2: usuarioreceptor,
        },
        {
          usuario1: usuarioreceptor,
          usuario2: usuariosolicitante,
        },
        {
          usuario1Id: usuariosolicitante,
          usuario2Id: usuarioreceptor,
        },
        {
          usuario1Id: usuarioreceptor,
          usuario2Id: usuariosolicitante,
        },
      ],
    };

    const conexionExistente = await Conexion.findOne(filtroParUsuarios).lean();

    if (conexionExistente) {
      return res.status(409).json({
        mensaje: "Los usuarios ya están conectados",
      });
    }

    const solicitudAceptada = await SolicitudConexion.findOne({
      estado: "aceptada",
      $or: [
        {
          usuariosolicitante,
          usuarioreceptor,
        },
        {
          usuariosolicitante: usuarioreceptor,
          usuarioreceptor: usuariosolicitante,
        },
      ],
    }).lean();

    if (solicitudAceptada) {
      return res.status(409).json({
        mensaje: "Los usuarios ya están conectados",
      });
    }

    // tambien se busca si la solicitud se encuentra ya en el sistema, para evitar duplicacion de datos
    const solicitudExistente = await SolicitudConexion.findOne({
      estado: "pendiente",
      $or: [
        {
          usuariosolicitante,
          usuarioreceptor,
        },
        {
          usuariosolicitante: usuarioreceptor,
          usuarioreceptor: usuariosolicitante,
        },
      ],
    }).lean();

    if (solicitudExistente) {
      return res.status(409).json({
        mensaje: "Ya existe una solicitud pendiente",
      });
    }

    const solicitud = await SolicitudConexion.create({
      usuariosolicitante,
      usuarioreceptor,
      estado: "pendiente",
    });

    const solicitante = await Usuario.findById(usuariosolicitante).select(
      "nombre nombreUsuario"
    );
    const nombreSolicitante =
      solicitante?.nombre || solicitante?.nombreUsuario || "Alguien";

    await Notificacion.create({
      usuarioId: usuarioreceptor,
      mensaje: `${nombreSolicitante} te envió una solicitud de conexión.`,
      tipo: "conexion",
      entidadTipo: "solicitud",
      entidadId: solicitud._id,
      actorId: usuariosolicitante,
    });

    res.status(201).json(solicitud);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al crear solicitud",
    });
  }
});

/*
PUT /api/solicitudes/:id/aceptar
Un usuario receptor acepta la solicitud de conexión
*/
router.put("/:id/aceptar", async (req, res) => {
  try {
    const solicitud = await SolicitudConexion.findById(req.params.id);

    if (!solicitud) {
      return res.status(404).json({
        mensaje: "Solicitud no encontrada",
      });
    }

    if (solicitud.estado !== "pendiente") {
      return res.status(400).json({
        mensaje: "La solicitud ya fue procesada",
      });
    }

    const conexion = await Conexion.create({
      usuario1: solicitud.usuariosolicitante,
      usuario2: solicitud.usuarioreceptor,
    });

    const chatExistente = await Chat.findOne({
      tipo: "privado",
      participantes: {
        $all: [solicitud.usuariosolicitante, solicitud.usuarioreceptor],
        $size: 2,
      },
    });

    if (chatExistente && chatExistente.estado !== "activo") {
      chatExistente.estado = "activo";
      if (!chatExistente.conexionId) {
        chatExistente.conexionId = conexion._id;
      }
      await chatExistente.save();
    }

    solicitud.estado = "aceptada";

    await solicitud.save();

    const receptor = await Usuario.findById(solicitud.usuarioreceptor).select(
      "nombre nombreUsuario"
    );
    const nombreReceptor = receptor?.nombre || receptor?.nombreUsuario || "Alguien";

    await Notificacion.create({
      usuarioId: solicitud.usuariosolicitante,
      mensaje: `${nombreReceptor} aceptó tu solicitud de conexión.`,
      tipo: "conexion",
      entidadTipo: "conexion",
      entidadId: conexion._id,
      actorId: solicitud.usuarioreceptor,
    });

    res.json({
      mensaje: "Solicitud aceptada",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al aceptar solicitud",
    });
  }
});

/*
PUT /api/solicitudes/:id/rechazar

Un usuario receptor rechaza la solicitud de conexión
*/
router.put("/:id/rechazar", async (req, res) => {
  try {
    const solicitud = await SolicitudConexion.findById(req.params.id);

    if (!solicitud) {
      return res.status(404).json({
        mensaje: "Solicitud no encontrada",
      });
    }

    // aca se busca si existe la solicitud y la borra para liberrar espacio, si no la encuetra entonces no hay nada que borrar
    
    await SolicitudConexion.findByIdAndDelete(req.params.id);

    res.json({
      mensaje: "Solicitud rechazada y eliminada correctamente",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al rechazar solicitud",
    });
  }
});
/*
GET /api/solicitudes/usuario/:usuarioId
Obtener solicitudes pendientes recibidas por un usuario
*/
router.get("/usuario/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const [solicitudes, paresConectados] = await Promise.all([
      SolicitudConexion.find({
      usuarioreceptor: usuarioId,
      estado: "pendiente",
    })
      .populate("usuariosolicitante", camposUsuarioSolicitud)
      .populate("usuarioreceptor", camposUsuarioSolicitud)
        .lean(),
      obtenerParesConectados(usuarioId),
    ]);

    res.json({
      mensaje: "Solicitudes obtenidas correctamente",
      solicitudes: ocultarSolicitudesDeConexionesExistentes(
        solicitudes,
        paresConectados
      ),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al obtener solicitudes",
    });
  }
});

/*
GET /api/solicitudes-conexion/pendientes/:usuarioId
Obtener solicitudes pendientes enviadas o recibidas por un usuario
*/
router.get("/pendientes/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const [solicitudes, paresConectados] = await Promise.all([
      SolicitudConexion.find({
      estado: "pendiente",
      $or: [
        { usuariosolicitante: usuarioId },
        { usuarioreceptor: usuarioId },
      ],
    })
      .populate("usuariosolicitante", camposUsuarioSolicitud)
      .populate("usuarioreceptor", camposUsuarioSolicitud)
        .lean(),
      obtenerParesConectados(usuarioId),
    ]);

    res.json({
      mensaje: "Solicitudes pendientes obtenidas correctamente",
      solicitudes: ocultarSolicitudesDeConexionesExistentes(
        solicitudes,
        paresConectados
      ),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al obtener solicitudes pendientes",
    });
  }
});

/*
DELETE /api/solicitudes-conexion/:id
Cancelar una solicitud pendiente enviada
*/
router.delete("/:id", async (req, res) => {
  try {
    const solicitud = await SolicitudConexion.findById(req.params.id);

    if (!solicitud) {
      return res.status(404).json({
        mensaje: "Solicitud no encontrada",
      });
    }

    if (solicitud.estado !== "pendiente") {
      return res.status(400).json({
        mensaje: "La solicitud ya fue procesada",
      });
    }

    await SolicitudConexion.findByIdAndDelete(req.params.id);

    res.json({
      mensaje: "Solicitud cancelada correctamente",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al cancelar solicitud",
    });
  }
});

module.exports = router;
