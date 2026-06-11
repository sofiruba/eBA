const express = require("express");
const router = express.Router();

const Reporte = require("../models/Reporte");

// Crear reporte
router.post("/", async (req, res) => {
  try {
    const { usuarioId, eventoId, tipo, mensaje } = req.body;

    if (!usuarioId || !eventoId || !tipo || !mensaje) {
      return res.status(400).json({
        error: "Faltan datos obligatorios",
        detalle: "usuarioId, eventoId, tipo y mensaje son requeridos",
      });
    }

    const reporte = new Reporte({
      usuarioId,
      eventoId,
      tipo,
      mensaje,
    });

    await reporte.save();

    res.status(201).json({
      message: "Reporte creado correctamente",
      reporte,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al crear reporte",
      detalle: error.message,
    });
  }
});

// Obtener todos los reportes
router.get("/", async (req, res) => {
  try {
    const reportes = await Reporte.find()
      .populate("usuarioId", "nombre email")
      .populate("eventoId", "nombre fecha categoria");

    res.json({
      message: "Reportes obtenidos correctamente",
      reportes,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener reportes",
      detalle: error.message,
    });
  }
});

// Obtener reportes de un usuario
router.get("/usuario/:usuarioId", async (req, res) => {
  try {
    const reportes = await Reporte.find({
      usuarioId: req.params.usuarioId,
    }).populate(
      "eventoId",
      "nombre descripcion fecha categoria imagen ubicacion organizador"
    );

    res.json({
      message: "Reportes del usuario obtenidos correctamente",
      reportes,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener reportes del usuario",
      detalle: error.message,
    });
  }
});

// Obtener reportes de un evento
router.get("/evento/:eventoId", async (req, res) => {
  try {
    const reportes = await Reporte.find({
      eventoId: req.params.eventoId,
    }).populate("usuarioId", "nombre email");

    res.json({
      message: "Reportes del evento obtenidos correctamente",
      reportes,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener reportes del evento",
      detalle: error.message,
    });
  }
});

// Actualizar estado del reporte
router.put("/:id", async (req, res) => {
  try {
    const reporte = await Reporte.findByIdAndUpdate(
      req.params.id,
      { estado: req.body.estado },
      { new: true }
    );

    if (!reporte) {
      return res.status(404).json({
        error: "Reporte no encontrado",
      });
    }

    res.json({
      message: "Estado del reporte actualizado correctamente",
      reporte,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar reporte",
      detalle: error.message,
    });
  }
});

// Eliminar reporte
router.delete("/:id", async (req, res) => {
  try {
    const reporte = await Reporte.findByIdAndDelete(req.params.id);

    if (!reporte) {
      return res.status(404).json({
        error: "Reporte no encontrado",
      });
    }

    res.json({
      message: "Reporte eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al eliminar reporte",
      detalle: error.message,
    });
  }
});

module.exports = router;