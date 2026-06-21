const express = require("express");
const router = express.Router();
const Mensaje = require("../models/Mensaje");
const Chat = require("../models/Chat");
const Notificacion = require("../models/Notificacion");
const Usuario = require("../models/Usuario");

const editarMensaje = async (req, res) => {
  try {
    const { usuarioId, contenido } = req.body;
    const mensajeId = req.params.id || req.body.mensajeId;

    if (!mensajeId) {
      return res.status(400).json({ error: "mensajeId es obligatorio" });
    }

    if (!usuarioId || !contenido?.trim()) {
      return res.status(400).json({
        error: "usuarioId y contenido son obligatorios",
      });
    }

    const mensaje = await Mensaje.findById(mensajeId);

    if (!mensaje) {
      return res.status(404).json({ error: "Mensaje no encontrado" });
    }

    if (mensaje.eliminado) {
      return res.status(400).json({
        error: "No se puede editar un mensaje eliminado",
      });
    }

    if (String(mensaje.usuarioEmisorId) !== String(usuarioId)) {
      return res.status(403).json({
        error: "No tenés permiso para editar este mensaje",
      });
    }

    mensaje.contenido = contenido.trim();
    await mensaje.save();

    return res.json({ message: "Mensaje actualizado correctamente", mensaje });
  } catch (error) {
    return res.status(500).json({
      error: "Error al actualizar mensaje",
      detalle: error.message,
    });
  }
};

const eliminarMensaje = async (req, res) => {
  try {
    const { usuarioId } = req.body;
    const mensajeId = req.params.id || req.body.mensajeId;

    if (!mensajeId) {
      return res.status(400).json({ error: "mensajeId es obligatorio" });
    }

    if (!usuarioId) {
      return res.status(400).json({ error: "usuarioId es obligatorio" });
    }

    const mensaje = await Mensaje.findById(mensajeId);

    if (!mensaje) return res.status(404).json({ error: "Mensaje no encontrado" });

    if (String(mensaje.usuarioEmisorId) !== String(usuarioId)) {
      return res.status(403).json({
        error: "No tenés permiso para eliminar este mensaje",
      });
    }

    mensaje.eliminado = true;
    mensaje.contenido = "Mensaje eliminado";
    mensaje.eliminadoEn = new Date();
    await mensaje.save();

    return res.json({ message: "Mensaje eliminado correctamente", mensaje });
  } catch (error) {
    return res.status(500).json({
      error: "Error al eliminar mensaje",
      detalle: error.message,
    });
  }
};

// Crear un mensaje
router.post("/", async (req, res) => {
  try {
    if (req.body.accion === "editar") {
      return editarMensaje(req, res);
    }

    if (req.body.accion === "eliminar") {
      return eliminarMensaje(req, res);
    }

    const mensaje = new Mensaje(req.body);
    await mensaje.save();
    const mensajeRespuesta = await Mensaje.findById(mensaje._id).populate({
      path: "mensajePadreId",
      select: "contenido usuarioEmisorId eliminado",
      populate: {
        path: "usuarioEmisorId",
        select: "nombre nombreUsuario",
      },
    });

    const chat = await Chat.findById(mensaje.chatId);

    if (chat) {
      chat.updatedAt = new Date();
      await chat.save();

      const emisor = await Usuario.findById(mensaje.usuarioEmisorId).select(
        "nombre nombreUsuario"
      );
      const nombreEmisor = emisor?.nombre || emisor?.nombreUsuario || "Alguien";
      const contenido = mensaje.contenido.trim();
      const preview =
        contenido.length > 80 ? `${contenido.slice(0, 77)}...` : contenido;
      const esChatGrupal = chat.participantes.length > 2;

      const destinatarios = [
        ...new Set(
          chat.participantes
            .map((participanteId) => String(participanteId))
            .filter(
              (participanteId) =>
                participanteId !== String(mensaje.usuarioEmisorId)
            )
        ),
      ];

      const textoNotificacion = esChatGrupal
        ? `${nombreEmisor} mandó un mensaje en el grupo: ${preview}`
        : `${nombreEmisor} te mandó un mensaje: ${preview}`;

      await Promise.all(
        destinatarios.map((usuarioId) =>
          Notificacion.create({
            usuarioId,
            mensaje: textoNotificacion,
            tipo: "chat",
            entidadTipo: "chat",
            entidadId: chat._id,
            actorId: mensaje.usuarioEmisorId,
          })
        )
      );
    }

    res.status(201).json({
      message: "Mensaje creado correctamente",
      mensaje: mensajeRespuesta || mensaje,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al crear mensaje", detalle: error.message });
  }
});

// Obtener mensajes de un chat
router.get("/chat/:chatId", async (req, res) => {
  try {
    const mensajes = await Mensaje.find({ chatId: req.params.chatId })
      .populate("usuarioEmisorId", "nombre nombreUsuario email")
      .populate({
        path: "mensajePadreId",
        select: "contenido usuarioEmisorId eliminado",
        populate: {
          path: "usuarioEmisorId",
          select: "nombre nombreUsuario",
        },
      })
      .sort({ fechaEnvio: 1 })
      .lean(); // orden cronológico
    res.json({ message: "Mensajes obtenidos correctamente", mensajes });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener mensajes", detalle: error.message });
  }
});

// Marcar mensaje como leído
router.put("/:id/leido", async (req, res) => {
  try {
    const mensaje = await Mensaje.findByIdAndUpdate(
      req.params.id,
      { leido: true },
      { new: true }
    );
    if (!mensaje) return res.status(404).json({ error: "Mensaje no encontrado" });
    res.json({ message: "Mensaje marcado como leído", mensaje });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar mensaje", detalle: error.message });
  }
});

// Editar mensaje
router.post("/editar/:id", editarMensaje);
router.put("/editar/:id", editarMensaje);
router.put("/:id", editarMensaje);
router.patch("/:id", editarMensaje);
router.post("/:id/editar", editarMensaje);

// Eliminar mensaje
router.post("/eliminar/:id", eliminarMensaje);
router.delete("/eliminar/:id", eliminarMensaje);
router.delete("/:id", eliminarMensaje);
router.post("/:id/eliminar", eliminarMensaje);

module.exports = router;
