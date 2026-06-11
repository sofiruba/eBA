const express = require("express");
const router = express.Router();

const PromocionEvento = require("../models/PromocionEvento");

// Crear promoción
router.post("/", async (req, res) => {
  try {
    const {
      eventoId,
      organizadorId,
      planPromocionId,
      fechaInicio,
      fechaFin,
    } = req.body;

    const promocion = new PromocionEvento({
      eventoId,
      organizadorId,
      planPromocionId,
      fechaInicio,
      fechaFin,
    });

    await promocion.save();

    res.status(201).json({
      message: "Promoción creada correctamente",
      promocion,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al crear promoción",
      detalle: error.message,
    });
  }
});

// Obtener todas las promociones
router.get("/", async (req, res) => {
  try {
    const promociones = await PromocionEvento.find()
      .populate("eventoId", "nombre fecha categoria")
      .populate("organizadorId", "nombre email")
      .populate("planPromocionId", "nombre precioDia");

    res.json({
      message: "Promociones obtenidas correctamente",
      promociones,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener promociones",
      detalle: error.message,
    });
  }
});

// Obtener promoción por ID
router.get("/:id", async (req, res) => {
  try {
    const promocion = await PromocionEvento.findById(req.params.id)
      .populate("eventoId", "nombre fecha categoria")
      .populate("organizadorId", "nombre email")
      .populate("planPromocionId", "nombre precioDia");

    if (!promocion) {
      return res.status(404).json({
        error: "Promoción no encontrada",
      });
    }

    res.json({
      message: "Promoción obtenida correctamente",
      promocion,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener promoción",
      detalle: error.message,
    });
  }
});

// Obtener promociones de un evento
router.get("/evento/:eventoId", async (req, res) => {
  try {
    const promociones = await PromocionEvento.find({
      eventoId: req.params.eventoId,
    }).populate("planPromocionId", "nombre precioDia");

    res.json({
      message: "Promociones del evento obtenidas correctamente",
      promociones,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener promociones",
      detalle: error.message,
    });
  }
});

// Obtener promociones de un organizador
router.get("/organizador/:organizadorId", async (req, res) => {
  try {
    const promociones = await PromocionEvento.find({
      organizadorId: req.params.organizadorId,
    })
      .populate("eventoId", "nombre fecha")
      .populate("planPromocionId", "nombre precioDia");

    res.json({
      message: "Promociones obtenidas correctamente",
      promociones,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener promociones",
      detalle: error.message,
    });
  }
});

// Actualizar promoción
router.put("/:id", async (req, res) => {
  try {
    const promocion = await PromocionEvento.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!promocion) {
      return res.status(404).json({
        error: "Promoción no encontrada",
      });
    }

    res.json({
      message: "Promoción actualizada correctamente",
      promocion,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar promoción",
      detalle: error.message,
    });
  }
});

// Eliminar promoción
router.delete("/:id", async (req, res) => {
  try {
    const promocion = await PromocionEvento.findByIdAndDelete(
      req.params.id
    );

    if (!promocion) {
      return res.status(404).json({
        error: "Promoción no encontrada",
      });
    }

    res.json({
      message: "Promoción eliminada correctamente",
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al eliminar promoción",
      detalle: error.message,
    });
  }
});

module.exports = router;