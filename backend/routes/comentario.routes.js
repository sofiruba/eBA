const express = require("express");
const router = express.Router();

const Comentario = require("../models/Comentario");

// Crear comentario o respuesta
router.post("/", async (req, res) => {
  try {
    const { publicacionId, usuarioId, contenido, comentarioPadreId } = req.body;

    if (!publicacionId || !usuarioId || !contenido) {
      return res.status(400).json({
        error: "publicacionId, usuarioId y contenido son obligatorios",
      });
    }

    const comentario = new Comentario({
      publicacionId,
      usuarioId,
      contenido,
      comentarioPadreId: comentarioPadreId || null,
    });

    await comentario.save();

    const comentarioPopulado = await Comentario.findById(comentario._id)
      .populate("usuarioId", "nombre nombreUsuario email fotoPerfil intereses bio")
      .populate("comentarioPadreId");

    res.status(201).json({
      message: comentarioPadreId
        ? "Respuesta creada correctamente"
        : "Comentario creado correctamente",
      comentario: comentarioPopulado,
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
      .populate("usuarioId", "nombre nombreUsuario email fotoPerfil intereses bio")
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

// Eliminar comentario y sus respuestas
router.delete("/:id", async (req, res) => {
  try {
    const comentario = await Comentario.findByIdAndDelete(req.params.id);

    if (!comentario) {
      return res.status(404).json({
        error: "Comentario no encontrado",
      });
    }

    await Comentario.deleteMany({
      comentarioPadreId: req.params.id,
    });

    res.json({
      message: "Comentario y respuestas eliminados correctamente",
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
    ).populate("usuarioId", "nombre nombreUsuario email fotoPerfil intereses bio");

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