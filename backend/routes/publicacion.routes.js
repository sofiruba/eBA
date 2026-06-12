const express = require("express");
const router = express.Router();

const Publicacion = require("../models/Publicacion");
const Comentario = require("../models/Comentario");

// Crear publicación
router.post("/", async (req, res) => {
  try {
    const publicacion = new Publicacion(req.body);
    await publicacion.save();

    res.status(201).json({
      message: "Publicación creada correctamente",
      publicacion,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al crear publicación",
      detalle: error.message,
    });
  }
});

// Obtener todas las publicaciones
router.get("/", async (req, res) => {
  try {
    const publicaciones = await Publicacion.find()
      .populate("usuarioId", "nombre email")
      .populate("eventoId", "nombre fecha categoria")
      .sort({ createdAt: -1 });

    res.json({
      message: "Publicaciones obtenidas correctamente",
      publicaciones,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener publicaciones",
      detalle: error.message,
    });
  }
});

// Obtener publicaciones de un evento
router.get("/evento/:eventoId", async (req, res) => {
  try {
    const publicaciones = await Publicacion.find({
      eventoId: req.params.eventoId,
    })
      .populate("usuarioId", "nombre email");

    res.json({
      message: "Publicaciones del evento obtenidas correctamente",
      publicaciones,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener publicaciones",
      detalle: error.message,
    });
  }
});
// Obtener publicación por id
router.get("/:id", async (req, res) => {
  try {
    const publicacion = await Publicacion.findById(req.params.id)
      .populate("usuarioId", "nombre email fotoPerfil intereses bio")
      .populate("eventoId", "nombre fecha categoria imagen ubicacion organizador");

    if (!publicacion) {
      return res.status(404).json({
        error: "Publicación no encontrada",
      });
    }

    res.json({
      message: "Publicación obtenida correctamente",
      publicacion,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener publicación",
      detalle: error.message,
    });
  }
});
// Eliminar publicación
router.delete("/:id", async (req, res) => {
  try {
    const publicacion = await Publicacion.findByIdAndDelete(req.params.id);

    if (!publicacion) {
      return res.status(404).json({
        error: "Publicación no encontrada",
      });
    }

    // Eliminar todos los comentarios asociados
    await Comentario.deleteMany({
      publicacionId: req.params.id,
    });

    res.json({
      message: "Publicación y comentarios eliminados correctamente",
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al eliminar publicación",
      detalle: error.message,
    });
  }
});

// Editar publicación
router.put("/:id", async (req, res) => {
  try {
    const publicacion = await Publicacion.findByIdAndUpdate(
      req.params.id,
      {
        contenido: req.body.contenido,
        imagen: req.body.imagen,
      },
      { new: true }
    );

    if (!publicacion) {
      return res.status(404).json({
        error: "Publicación no encontrada",
      });
    }

    res.json({
      message: "Publicación actualizada correctamente",
      publicacion,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar publicación",
      detalle: error.message,
    });
  }
});


module.exports = router;