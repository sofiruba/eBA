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
      .populate("usuarioId", "nombre nombreUsuario email fotoPerfil intereses bio")
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
      .populate("usuarioId", "nombre nombreUsuario email fotoPerfil intereses bio");

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
      .populate("usuarioId", "nombre nombreUsuario email fotoPerfil intereses bio")
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

// PUT /api/publicaciones/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioId, contenido } = req.body;

    if (!usuarioId || !contenido) {
      return res.status(400).json({
        error: "usuarioId y contenido son obligatorios",
      });
    }

    const publicacion = await Publicacion.findById(id);

    if (!publicacion) {
      return res.status(404).json({
        error: "Publicación no encontrada",
      });
    }

    if (publicacion.usuarioId.toString() !== usuarioId.toString()) {
      return res.status(403).json({
        error: "No tenés permiso para editar esta publicación",
      });
    }

    publicacion.contenido = contenido.trim();

    await publicacion.save();

    const publicacionActualizada = await Publicacion.findById(id)
      .populate("usuarioId", "nombre nombreUsuario email fotoPerfil intereses bio")
      .populate("eventoId");

    return res.json({
      message: "Publicación actualizada correctamente",
      publicacion: publicacionActualizada,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al actualizar publicación",
      detalle: error.message,
    });
  }
});

// DELETE /api/publicaciones/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioId } = req.body;

    if (!usuarioId) {
      return res.status(400).json({
        error: "usuarioId es obligatorio",
      });
    }

    const publicacion = await Publicacion.findById(id);

    if (!publicacion) {
      return res.status(404).json({
        error: "Publicación no encontrada",
      });
    }

    if (publicacion.usuarioId.toString() !== usuarioId.toString()) {
      return res.status(403).json({
        error: "No tenés permiso para eliminar esta publicación",
      });
    }

    await Comentario.deleteMany({
      publicacionId: id,
    });

    await Publicacion.findByIdAndDelete(id);

    return res.json({
      message: "Publicación eliminada correctamente",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al eliminar publicación",
      detalle: error.message,
    });
  }
});

module.exports = router;