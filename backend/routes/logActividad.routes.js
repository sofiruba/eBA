const express = require("express");
const router = express.Router();

const LogActividad = require("../models/LogActividad");

// Crear actividad
router.post("/", async (req, res) => {
  try {
    const { usuarioId, accion, detalle } = req.body;

    const actividad = new LogActividad({
      usuarioId,
      accion,
      detalle,
    });

    await actividad.save();

    res.status(201).json({
      message: "Actividad registrada correctamente",
      actividad,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al registrar actividad",
      detalle: error.message,
    });
  }
});

// Obtener todas las actividades
router.get("/", async (req, res) => {
  try {
    const actividades = await LogActividad.find()
      .populate("usuarioId", "nombre email")
      .sort({ createdAt: -1 });

    res.json({
      message: "Actividades obtenidas correctamente",
      actividades,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener actividades",
      detalle: error.message,
    });
  }
});

// Obtener actividades de un usuario
router.get("/usuario/:usuarioId", async (req, res) => {
  try {
    const actividades = await LogActividad.find({
      usuarioId: req.params.usuarioId,
    })
      .populate("usuarioId", "nombre email")
      .sort({ createdAt: -1 });

    res.json({
      message: "Actividades del usuario obtenidas correctamente",
      actividades,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener actividades del usuario",
      detalle: error.message,
    });
  }
});

// Obtener actividad por ID
router.get("/:id", async (req, res) => {
  try {
    const actividad = await LogActividad.findById(req.params.id)
      .populate("usuarioId", "nombre email");

    if (!actividad) {
      return res.status(404).json({
        error: "Actividad no encontrada",
      });
    }

    res.json({
      message: "Actividad obtenida correctamente",
      actividad,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener actividad",
      detalle: error.message,
    });
  }
});

// Eliminar actividad
router.delete("/:id", async (req, res) => {
  try {
    const actividad = await LogActividad.findByIdAndDelete(
      req.params.id
    );

    if (!actividad) {
      return res.status(404).json({
        error: "Actividad no encontrada",
      });
    }

    res.json({
      message: "Actividad eliminada correctamente",
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al eliminar actividad",
      detalle: error.message,
    });
  }
});

module.exports = router;