const express = require("express");
const router = express.Router();

const SolicitudConexion = require("../models/SolicitudConexion");
const Conexion = require("../models/Conexion");


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
    const conexionExistente = await Conexion.findOne({
      $or: [
        {
          usuario1: usuariosolicitante,
          usuario2: usuarioreceptor,
        },
        {
          usuario1: usuarioreceptor,
          usuario2: usuariosolicitante,
        },
      ],
    });

    if (conexionExistente) {
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
    });

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

    await Conexion.create({
      usuario1: solicitud.usuariosolicitante,
      usuario2: solicitud.usuarioreceptor,
    });

    solicitud.estado = "aceptada";

    await solicitud.save();

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

    const solicitudes = await SolicitudConexion.find({
      usuarioreceptor: usuarioId,
      estado: "pendiente",
    })
      .populate("usuariosolicitante")
      .populate("usuarioreceptor");

    res.json({
      mensaje: "Solicitudes obtenidas correctamente",
      solicitudes,
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

    const solicitudes = await SolicitudConexion.find({
      estado: "pendiente",
      $or: [
        { usuariosolicitante: usuarioId },
        { usuarioreceptor: usuarioId },
      ],
    })
      .populate("usuariosolicitante")
      .populate("usuarioreceptor");

    res.json({
      mensaje: "Solicitudes pendientes obtenidas correctamente",
      solicitudes,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al obtener solicitudes pendientes",
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

    const solicitudes = await SolicitudConexion.find({
      estado: "pendiente",
      $or: [
        { usuariosolicitante: usuarioId },
        { usuarioreceptor: usuarioId },
      ],
    })
      .populate("usuariosolicitante")
      .populate("usuarioreceptor");

    res.json({
      mensaje: "Solicitudes pendientes obtenidas correctamente",
      solicitudes,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al obtener solicitudes pendientes",
    });
  }
});

module.exports = router;