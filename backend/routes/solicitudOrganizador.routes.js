const express = require("express");
const mongoose = require("mongoose");

const SolicitudOrganizador = require("../models/SolicitudOrganizador");
const Usuario = require("../models/Usuario");

const router = express.Router();

const DOCUMENTO_MAX_BASE64_LENGTH = 1200000;

const armarSolicitudRespuesta = (solicitud) => ({
  id: solicitud._id,
  usuarioId: solicitud.usuarioId,
  fotoDocumento: solicitud.fotoDocumento,
  estado: solicitud.estado,
  motivoRechazo: solicitud.motivoRechazo || "",
  managerId: solicitud.managerId,
  createdAt: solicitud.createdAt,
  revisadoEn: solicitud.revisadoEn,
});

// POST /api/solicitudes-organizador
// Un usuario pide convertirse en organizador, mandando una foto del documento.
router.post("/", async (req, res) => {
  try {
    const { usuarioId, fotoDocumento } = req.body;

    if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
      return res.status(400).json({ error: "Falta el id del usuario o es inválido" });
    }

    if (!fotoDocumento) {
      return res.status(400).json({
        error: "Tenés que adjuntar una foto del documento",
      });
    }

    if (fotoDocumento.length > DOCUMENTO_MAX_BASE64_LENGTH) {
      return res.status(400).json({
        error: "La imagen es demasiado pesada, probá con una más liviana",
      });
    }

    const usuario = await Usuario.findById(usuarioId);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (usuario.esOrganizador) {
      return res.status(400).json({
        error: "Este usuario ya es organizador",
      });
    }

    const solicitudPendiente = await SolicitudOrganizador.findOne({
      usuarioId,
      estado: "pendiente",
    });

    if (solicitudPendiente) {
      return res.status(400).json({
        error: "Ya tenés una solicitud pendiente de revisión",
        solicitud: armarSolicitudRespuesta(solicitudPendiente),
      });
    }

    const nuevaSolicitud = new SolicitudOrganizador({
      usuarioId,
      fotoDocumento,
      estado: "pendiente",
    });

    await nuevaSolicitud.save();

    return res.status(201).json({
      message: "Solicitud enviada correctamente. Un manager la va a revisar.",
      solicitud: armarSolicitudRespuesta(nuevaSolicitud),
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al enviar la solicitud",
      detalle: error.message,
    });
  }
});

// GET /api/solicitudes-organizador/usuario/:usuarioId
// Devuelve la última solicitud del usuario (para mostrar el estado en su perfil).
router.get("/usuario/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
      return res.status(400).json({ error: "Id de usuario inválido" });
    }

    const solicitud = await SolicitudOrganizador.findOne({ usuarioId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      message: "Solicitud obtenida correctamente",
      solicitud: solicitud || null,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al obtener la solicitud",
      detalle: error.message,
    });
  }
});

// GET /api/solicitudes-organizador/manager/todas?estado=pendiente
// Lista de solicitudes para que el manager las revise.
router.get("/manager/todas", async (req, res) => {
  try {
    const { estado } = req.query;
    const filtro = {};

    if (estado && ["pendiente", "aprobado", "rechazado"].includes(estado)) {
      filtro.estado = estado;
    }

    const solicitudes = await SolicitudOrganizador.find(filtro)
      .populate("usuarioId", "nombre nombreUsuario email fotoPerfilMini")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      message: "Solicitudes obtenidas correctamente",
      solicitudes,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al obtener las solicitudes",
      detalle: error.message,
    });
  }
});

// PATCH /api/solicitudes-organizador/:id/estado
// El manager aprueba o rechaza la solicitud.
router.patch("/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, motivoRechazo, managerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Id de solicitud inválido" });
    }

    if (!["aprobado", "rechazado"].includes(estado)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    if (!managerId || !mongoose.Types.ObjectId.isValid(managerId)) {
      return res.status(400).json({ error: "Falta el id del manager" });
    }

    const manager = await Usuario.findById(managerId);

    if (!manager || !manager.esManager) {
      return res.status(403).json({
        error: "Solo un manager puede revisar solicitudes de organizador",
      });
    }

    if (estado === "rechazado" && !motivoRechazo) {
      return res.status(400).json({
        error: "Tenés que indicar el motivo del rechazo",
      });
    }

    const solicitud = await SolicitudOrganizador.findById(id);

    if (!solicitud) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    solicitud.estado = estado;
    solicitud.motivoRechazo = estado === "rechazado" ? motivoRechazo : "";
    solicitud.managerId = managerId;
    solicitud.revisadoEn = new Date();

    await solicitud.save();

    if (estado === "aprobado") {
      await Usuario.findByIdAndUpdate(solicitud.usuarioId, {
        esOrganizador: true,
      });
    }

    return res.json({
      message:
        estado === "aprobado"
          ? "Solicitud aprobada. El usuario ya es organizador."
          : "Solicitud rechazada.",
      solicitud: armarSolicitudRespuesta(solicitud),
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al actualizar la solicitud",
      detalle: error.message,
    });
  }
});

module.exports = router;