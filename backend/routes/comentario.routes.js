const express = require("express");
const router = express.Router();

const Comentario = require("../models/Comentario");
const Notificacion = require("../models/Notificacion");
const Publicacion = require("../models/Publicacion");
const Usuario = require("../models/Usuario");
const Bloqueo = require("../models/Bloqueo");

const camposUsuarioComentario = "nombre nombreUsuario email fotoPerfilMini intereses bio";

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

const autorEstaBloqueado = (item, idsBloqueados) => {
  const autorId = String(item.usuarioId?._id || item.usuarioId?.id || item.usuarioId);
  return idsBloqueados.has(autorId);
};

// Crear comentario o respuesta
router.post("/", async (req, res) => {
  try {
    const { publicacionId, usuarioId, contenido, comentarioPadreId } = req.body;

    if (!publicacionId || !usuarioId || !contenido) {
      return res.status(400).json({
        error: "publicacionId, usuarioId y contenido son obligatorios",
      });
    }

    const publicacion = await Publicacion.findById(publicacionId).select(
      "usuarioId contenido"
    );

    if (!publicacion) {
      return res.status(404).json({
        error: "Publicación no encontrada",
      });
    }

    const bloqueoEntreUsuarios = await Bloqueo.findOne({
      $or: [
        { bloqueadorId: usuarioId, bloqueadoId: publicacion.usuarioId },
        { bloqueadorId: publicacion.usuarioId, bloqueadoId: usuarioId },
      ],
    }).lean();

    if (bloqueoEntreUsuarios) {
      return res.status(403).json({
        error: "No podés comentar esta publicación.",
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
      .populate("usuarioId", camposUsuarioComentario)
      .populate("comentarioPadreId");

    const usuarioComentador = await Usuario.findById(usuarioId).select(
      "nombre nombreUsuario"
    );
    const nombreComentador =
      usuarioComentador?.nombre || usuarioComentador?.nombreUsuario || "Alguien";

    const notificaciones = [];

    if (String(publicacion.usuarioId) !== String(usuarioId)) {
      notificaciones.push({
        usuarioId: publicacion.usuarioId,
        mensaje: comentarioPadreId
          ? `${nombreComentador} respondió en tu publicación.`
          : `${nombreComentador} comentó tu publicación.`,
        tipo: "comentario",
        entidadTipo: "publicacion",
        entidadId: publicacion._id,
        actorId: usuarioId,
      });
    }

    if (comentarioPadreId) {
      const comentarioPadre = await Comentario.findById(comentarioPadreId).select(
        "usuarioId publicacionId"
      );

      if (
        comentarioPadre &&
        String(comentarioPadre.usuarioId) !== String(usuarioId) &&
        String(comentarioPadre.usuarioId) !== String(publicacion?.usuarioId)
      ) {
        notificaciones.push({
          usuarioId: comentarioPadre.usuarioId,
          mensaje: `${nombreComentador} respondió tu comentario.`,
          tipo: "comentario",
          entidadTipo: "publicacion",
          entidadId: comentarioPadre.publicacionId,
          actorId: usuarioId,
        });
      }
    }

    if (notificaciones.length > 0) {
      await Notificacion.insertMany(notificaciones);
    }

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
      .populate("usuarioId", camposUsuarioComentario)
      .sort({ createdAt: 1 })
      .lean();
    const idsBloqueados = await obtenerIdsBloqueados(req.query.usuarioId);

    res.json({
      message: "Comentarios obtenidos correctamente",
      comentarios: comentarios.filter(
        (comentario) => !autorEstaBloqueado(comentario, idsBloqueados)
      ),
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
      { returnDocument: "after" }
    ).populate("usuarioId", camposUsuarioComentario);

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
// PUT /api/comentarios/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioId, contenido } = req.body;

    if (!usuarioId || !contenido) {
      return res.status(400).json({
        error: "usuarioId y contenido son obligatorios",
      });
    }

    const comentario = await Comentario.findById(id);

    if (!comentario) {
      return res.status(404).json({
        error: "Comentario no encontrado",
      });
    }

    if (comentario.usuarioId.toString() !== usuarioId.toString()) {
      return res.status(403).json({
        error: "No tenés permiso para editar este comentario",
      });
    }

    comentario.contenido = contenido.trim();

    await comentario.save();

    const comentarioActualizado = await Comentario.findById(id).populate(
      "usuarioId",
      camposUsuarioComentario
    );

    return res.json({
      message: "Comentario actualizado correctamente",
      comentario: comentarioActualizado,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al actualizar comentario",
      detalle: error.message,
    });
  }
});

// DELETE /api/comentarios/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioId } = req.body;

    if (!usuarioId) {
      return res.status(400).json({
        error: "usuarioId es obligatorio",
      });
    }

    const comentario = await Comentario.findById(id);

    if (!comentario) {
      return res.status(404).json({
        error: "Comentario no encontrado",
      });
    }

    if (comentario.usuarioId.toString() !== usuarioId.toString()) {
      return res.status(403).json({
        error: "No tenés permiso para eliminar este comentario",
      });
    }

    await Comentario.deleteMany({
      $or: [{ _id: id }, { comentarioPadreId: id }],
    });

    return res.json({
      message: "Comentario eliminado correctamente",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al eliminar comentario",
      detalle: error.message,
    });
  }
});
module.exports = router;
