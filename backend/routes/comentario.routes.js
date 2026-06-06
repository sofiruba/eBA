const express = require("express");
const router = express.Router();

const Comentario = require("../models/Comentario");

// Crear comentario
router.post("/", async (req, res) => {
  try {
    const comentario = new Comentario(req.body);
    await comentario.save();

    res.status(201).json({
      message: "Comentario creado correctamente",
      comentario,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al crear comentario",
      detalle: error.message,
    });
  }
});

// Obtener comentarios de una publicación
router.get("/publicacion/:publicacionId", async (req, res) => {
  try {
    const comentarios = await Comentario.find({
      publicacionId: req.params.publicacionId,
    })
      .populate("usuarioId", "nombre email")
      .sort({ createdAt: 1 });

    res.json({
      message: "Comentarios obtenidos correctamente",
      comentarios,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener comentarios",
      detalle: error.message,
    });
  }
});

// Eliminar comentario
router.delete("/:id", async (req, res) => {
  try {
    const comentario = await Comentario.findByIdAndDelete(req.params.id);

    if (!comentario) {
      return res.status(404).json({
        error: "Comentario no encontrado",
      });
    }

    res.json({
      message: "Comentario eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al eliminar comentario",
      detalle: error.message,
    });
  }
});

// Editar comentario
router.put("/:id", async (req, res) => {
  try {
    const comentario = await Comentario.findByIdAndUpdate(
      req.params.id,
      {
        contenido: req.body.contenido,
      },
      { new: true }
    );

    if (!comentario) {
      return res.status(404).json({
        error: "Comentario no encontrado",
      });
    }

    res.json({
      message: "Comentario actualizado correctamente",
      comentario,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar comentario",
      detalle: error.message,
    });
  }
});

module.exports = router;