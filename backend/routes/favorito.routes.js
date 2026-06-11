const express = require("express");
const router = express.Router();

const Favorito = require("../models/Favorito");

// Agregar evento a favoritos
router.post("/", async (req, res) => {
  try {
    const { usuarioId, eventoId } = req.body;

    const favoritoExistente = await Favorito.findOne({
      usuarioId,
      eventoId,
    });

    if (favoritoExistente) {
      return res.status(400).json({
        error: "El evento ya está en favoritos",
      });
    }

    const favorito = new Favorito({
      usuarioId,
      eventoId,
    });

    await favorito.save();

    res.status(201).json({
      message: "Evento agregado a favoritos",
      favorito,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al agregar favorito",
      detalle: error.message,
    });
  }
});

// Obtener todos los favoritos
router.get("/", async (req, res) => {
  try {
    const favoritos = await Favorito.find()
      .populate("usuarioId", "nombre email")
      .populate("eventoId", "nombre fecha categoria");

    res.json({
      message: "Favoritos obtenidos correctamente",
      favoritos,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener favoritos",
      detalle: error.message,
    });
  }
});

// Obtener favoritos de un usuario
router.get("/usuario/:usuarioId", async (req, res) => {
  try {
    const favoritos = await Favorito.find({
      usuarioId: req.params.usuarioId,
    }).populate(
      "eventoId",
      "nombre descripcion fecha categoria imagen"
    );

    res.json({
      message: "Favoritos obtenidos correctamente",
      favoritos,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener favoritos del usuario",
      detalle: error.message,
    });
  }
});

// Eliminar favorito
router.delete("/:id", async (req, res) => {
  try {
    const favorito = await Favorito.findByIdAndDelete(
      req.params.id
    );

    if (!favorito) {
      return res.status(404).json({
        error: "Favorito no encontrado",
      });
    }

    res.json({
      message: "Favorito eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al eliminar favorito",
      detalle: error.message,
    });
  }
});

module.exports = router;