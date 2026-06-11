const express = require("express");
const router = express.Router();

const Notificacion = require("../models/Notificacion");

// Crear notificación
router.post("/", async (req, res) => {
  try {
    const { usuarioId, mensaje, tipo } = req.body;

    const notificacion = new Notificacion({
      usuarioId,
      mensaje,
      tipo,
    });

    await notificacion.save();

    res.status(201).json({
      message: "Notificación creada correctamente",
      notificacion,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al crear notificación",
      detalle: error.message,
    });
  }
});

// Obtener todas las notificaciones
router.get("/", async (req, res) => {
  try {
    const notificaciones = await Notificacion.find()
      .populate("usuarioId", "nombre email")
      .sort({ createdAt: -1 });

    res.json({
      message: "Notificaciones obtenidas correctamente",
      notificaciones,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener notificaciones",
      detalle: error.message,
    });
  }
});

// Obtener notificaciones de un usuario
router.get("/usuario/:usuarioId", async (req, res) => {
  try {
    const notificaciones = await Notificacion.find({
      usuarioId: req.params.usuarioId,
    })
      .sort({ createdAt: -1 });

    res.json({
      message: "Notificaciones obtenidas correctamente",
      notificaciones,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener notificaciones",
      detalle: error.message,
    });
  }
});

// Obtener una notificación por ID
router.get("/:id", async (req, res) => {
  try {
    const notificacion = await Notificacion.findById(req.params.id)
      .populate("usuarioId", "nombre email");

    if (!notificacion) {
      return res.status(404).json({
        error: "Notificación no encontrada",
      });
    }

    res.json({
      message: "Notificación obtenida correctamente",
      notificacion,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener notificación",
      detalle: error.message,
    });
  }
});

// Marcar como leída
router.put("/:id/leida", async (req, res) => {
  try {
    const notificacion = await Notificacion.findByIdAndUpdate(
      req.params.id,
      { leida: true },
      { new: true }
    );

    if (!notificacion) {
      return res.status(404).json({
        error: "Notificación no encontrada",
      });
    }

    res.json({
      message: "Notificación marcada como leída",
      notificacion,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar notificación",
      detalle: error.message,
    });
  }
});

// Eliminar notificación
router.delete("/:id", async (req, res) => {
  try {
    const notificacion = await Notificacion.findByIdAndDelete(
      req.params.id
    );

    if (!notificacion) {
      return res.status(404).json({
        error: "Notificación no encontrada",
      });
    }

    res.json({
      message: "Notificación eliminada correctamente",
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al eliminar notificación",
      detalle: error.message,
    });
  }
});

module.exports = router;