const express = require("express");
const router = express.Router();

const Asistencia = require("../models/Asistencia");
const Evento = require("../models/Evento");

const eventoFinalizado = (evento) => {
  if (!evento?.fecha) return false;
  return new Date(evento.fecha).getTime() < Date.now() || evento.activo === false;
};

// Registrar asistencia a un evento
// Registrar asistencia a un evento
router.post("/", async (req, res) => {
  try {
    const { usuarioId, eventoId, estado } = req.body;

    if (!usuarioId || !eventoId) {
      return res.status(400).json({
        error: "Faltan datos obligatorios",
        detalle: "usuarioId y eventoId son requeridos",
      });
    }

    const evento = await Evento.findById(eventoId).select("fecha activo");

    if (!evento) {
      return res.status(404).json({
        error: "Evento no encontrado",
      });
    }

    if (eventoFinalizado(evento)) {
      return res.status(400).json({
        error: "No podés marcar Quiero ir en un evento finalizado",
      });
    }

    const asistenciaExistente = await Asistencia.findOne({
      usuarioId,
      eventoId,
    });

    if (asistenciaExistente) {
      return res.json({
        message: "El usuario ya estaba registrado en este evento",
        yaExiste: true,
        asistencia: asistenciaExistente,
      });
    }

    const asistencia = new Asistencia({
      usuarioId,
      eventoId,
      estado: estado || "interesado",
    });

    await asistencia.save();

    res.status(201).json({
      message: "Asistencia registrada correctamente",
      yaExiste: false,
      asistencia,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al registrar asistencia",
      detalle: error.message,
    });
  }
});

// Obtener todas las asistencias
router.get("/", async (req, res) => {
  try {
    const asistencias = await Asistencia.find()
      .populate("usuarioId", "nombre email")
      .populate("eventoId", "nombre fecha categoria");

    res.json({
      message: "Asistencias obtenidas correctamente",
      asistencias,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener asistencias",
      detalle: error.message,
    });
  }
});

// Obtener asistencias por usuario
router.get("/usuario/:usuarioId", async (req, res) => {
  try {
    const asistencias = await Asistencia.find({
      usuarioId: req.params.usuarioId,
    }).populate(
      "eventoId",
      "nombre descripcion fecha categoria imagen ubicacion organizador esPromocionado"
    );

    res.json({
      message: "Asistencias del usuario obtenidas correctamente",
      asistencias,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener asistencias del usuario",
      detalle: error.message,
    });
  }
});

// Obtener asistencias por evento
router.get("/evento/:eventoId", async (req, res) => {
  try {
    const asistencias = await Asistencia.find({ eventoId: req.params.eventoId })
      .populate(
        "usuarioId",
        "nombre nombreUsuario email fotoPerfilMini intereses bio ubicacionAproximada"
      )
      .lean();

    res.json({
      message: "Asistencias del evento obtenidas correctamente",
      asistencias,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener asistencias del evento",
      detalle: error.message,
    });
  }
});

// Actualizar estado de asistencia
router.put("/:id", async (req, res) => {
  try {
    const asistencia = await Asistencia.findByIdAndUpdate(
      req.params.id,
      { estado: req.body.estado },
      { returnDocument: "after" }
    );

    if (!asistencia) {
      return res.status(404).json({ error: "Asistencia no encontrada" });
    }

    res.json({
      message: "Estado de asistencia actualizado correctamente",
      asistencia,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar asistencia",
      detalle: error.message,
    });
  }
});

// Eliminar asistencia
router.delete("/:id", async (req, res) => {
  try {
    const asistencia = await Asistencia.findByIdAndDelete(req.params.id);

    if (!asistencia) {
      return res.status(404).json({ error: "Asistencia no encontrada" });
    }

    res.json({
      message: "Asistencia eliminada correctamente",
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al eliminar asistencia",
      detalle: error.message,
    });
  }
});

module.exports = router;
