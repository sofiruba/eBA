const express = require("express");
const router = express.Router();

const Publicacion = require("../models/Publicacion");
const Comentario = require("../models/Comentario");
const Evento = require("../models/Evento");
const Bloqueo = require("../models/Bloqueo");

const camposUsuarioPublicacion = "nombre nombreUsuario email fotoPerfilMini intereses bio";

const eventoFinalizado = (evento) => {
  if (!evento?.fecha) return false;
  return new Date(evento.fecha).getTime() < Date.now() || evento.activo === false;
};
const obtenerLimit = (req, defecto = 10, maximo = 50) => {
  const valor = Number(req.query.limit);
  if (!Number.isFinite(valor) || valor <= 0) return defecto;
  return Math.min(Math.floor(valor), maximo);
};

const obtenerIdsBloqueados = async (usuarioId) => {
  if (!usuarioId) return new Set();

  const bloqueos = await Bloqueo.find({
    $or: [{ bloqueadorId: usuarioId }, { bloqueadoId: usuarioId }],
  })
    .select("bloqueadorId bloqueadoId")
    .lean();

  return new Set(
    bloqueos
      .flatMap((bloqueo) => [
        String(bloqueo.bloqueadorId),
        String(bloqueo.bloqueadoId),
      ])
      .filter((id) => id !== String(usuarioId))
  );
};

const filtrarPublicacionesBloqueadas = (publicaciones, idsBloqueados) => {
  if (!idsBloqueados.size) return publicaciones;

  return publicaciones.filter((publicacion) => {
    const autorId = String(
      publicacion.usuarioId?._id || publicacion.usuarioId?.id || publicacion.usuarioId
    );

    return !idsBloqueados.has(autorId);
  });
};

// Crear publicación
router.post("/", async (req, res) => {
  try {
    const { eventoId } = req.body;

    const evento = await Evento.findById(eventoId).select("fecha activo");

    if (!evento) {
      return res.status(404).json({
        error: "Evento no encontrado",
      });
    }

    if (eventoFinalizado(evento)) {
      return res.status(400).json({
        error: "No se pueden agregar publicaciones a un evento finalizado",
      });
    }

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
    const limit = obtenerLimit(req, 10, 50);
    const idsBloqueados = await obtenerIdsBloqueados(req.query.usuarioId);
    const publicaciones = await Publicacion.find()
      .populate("usuarioId", camposUsuarioPublicacion)
      .populate("eventoId", "nombre fecha categoria")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      message: "Publicaciones obtenidas correctamente",
      publicaciones: filtrarPublicacionesBloqueadas(publicaciones, idsBloqueados),
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
    const limit = obtenerLimit(req, 10, 50);
    const idsBloqueados = await obtenerIdsBloqueados(req.query.usuarioId);
    const publicaciones = await Publicacion.find({
      eventoId: req.params.eventoId,
    })
      .populate("usuarioId", camposUsuarioPublicacion)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    const publicacionesVisibles = filtrarPublicacionesBloqueadas(
      publicaciones,
      idsBloqueados
    );

    const publicacionesIds = publicacionesVisibles.map((publicacion) => publicacion._id);
    const comentariosPorPublicacion = await Comentario.aggregate([
      {
        $match: {
          publicacionId: { $in: publicacionesIds },
        },
      },
      {
        $group: {
          _id: "$publicacionId",
          total: { $sum: 1 },
        },
      },
    ]);

    const conteos = new Map(
      comentariosPorPublicacion.map((comentario) => [
        String(comentario._id),
        comentario.total,
      ])
    );

    const publicacionesConConteo = publicacionesVisibles.map((publicacion) => ({
      ...publicacion,
      comentariosCount: conteos.get(String(publicacion._id)) || 0,
    }));

    res.json({
      message: "Publicaciones del evento obtenidas correctamente",
      publicaciones: publicacionesConConteo,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener publicaciones",
      detalle: error.message,
    });
  }
});

// Obtener publicaciones de un usuario
router.get("/usuario/:usuarioId", async (req, res) => {
  try {
    const limit = obtenerLimit(req, 10, 50);
    const publicaciones = await Publicacion.find({
      usuarioId: req.params.usuarioId,
    })
      .populate("usuarioId", camposUsuarioPublicacion)
      .populate("eventoId", "nombre fecha categoria imagen ubicacion organizador")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const publicacionesIds = publicaciones.map((publicacion) => publicacion._id);
    const comentariosPorPublicacion = await Comentario.aggregate([
      {
        $match: {
          publicacionId: { $in: publicacionesIds },
        },
      },
      {
        $group: {
          _id: "$publicacionId",
          total: { $sum: 1 },
        },
      },
    ]);

    const conteos = new Map(
      comentariosPorPublicacion.map((comentario) => [
        String(comentario._id),
        comentario.total,
      ])
    );

    const publicacionesConConteo = publicaciones.map((publicacion) => ({
      ...publicacion,
      comentariosCount: conteos.get(String(publicacion._id)) || 0,
    }));

    res.json({
      message: "Publicaciones del usuario obtenidas correctamente",
      publicaciones: publicacionesConConteo,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener publicaciones del usuario",
      detalle: error.message,
    });
  }
});

// Obtener publicación por id
router.get("/:id", async (req, res) => {
  try {
    const publicacion = await Publicacion.findById(req.params.id)
      .populate("usuarioId", camposUsuarioPublicacion)
      .populate("eventoId", "nombre fecha categoria imagen ubicacion organizador");

    if (!publicacion) {
      return res.status(404).json({
        error: "Publicación no encontrada",
      });
    }

    const idsBloqueados = await obtenerIdsBloqueados(req.query.usuarioId);

    if (filtrarPublicacionesBloqueadas([publicacion], idsBloqueados).length === 0) {
      return res.status(403).json({
        error: "No podés ver esta publicación.",
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
      { returnDocument: "after" }
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
      .populate("usuarioId", "nombre nombreUsuario email fotoPerfilMini intereses bio")
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
