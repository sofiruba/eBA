const express = require("express");
const router = express.Router();

const Evento = require("../models/Evento");

// Obtener todos los eventos
router.get("/", async (req, res) => {
  try {
    const eventos = await Evento.find().sort({ fecha: 1 });

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

// Obtener eventos promocionados
router.get("/promocionados", async (req, res) => {
  try {
    const eventos = await Evento.find({ esPromocionado: true }).sort({ fecha: 1 });

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

// Obtener eventos por categoría
router.get("/categoria/:categoria", async (req, res) => {
  try {
    const eventos = await Evento.find({
      categoria: req.params.categoria,
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
    const texto = req.params.texto;

    const eventos = await Evento.find({
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

// Obtener evento por ID
router.get("/:id", async (req, res) => {
  try {
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