const express = require("express");
const router = express.Router();

const Bloqueo = require("../models/Bloqueo");
const Conexion = require("../models/Conexion");
const Chat = require("../models/Chat");
const SolicitudConexion = require("../models/SolicitudConexion");

const filtroParConexion = (usuarioA, usuarioB) => ({
  $or: [
    { usuario1: usuarioA, usuario2: usuarioB },
    { usuario1: usuarioB, usuario2: usuarioA },
    { usuario1Id: usuarioA, usuario2Id: usuarioB },
    { usuario1Id: usuarioB, usuario2Id: usuarioA },
  ],
});

const filtroParSolicitud = (usuarioA, usuarioB, estado) => ({
  ...(estado ? { estado } : {}),
  $or: [
    { usuariosolicitante: usuarioA, usuarioreceptor: usuarioB },
    { usuariosolicitante: usuarioB, usuarioreceptor: usuarioA },
  ],
});

const filtroChatPrivado = (usuarioA, usuarioB) => ({
  tipo: "privado",
  participantes: {
    $all: [usuarioA, usuarioB],
    $size: 2,
  },
});


// Crear bloqueo
router.post("/", async (req, res) => {
  try {

    const {
      bloqueadorId,
      bloqueadoId,
      motivo,
    } = req.body;

    if (bloqueadorId === bloqueadoId) {
      return res.status(400).json({
        error: "No podés bloquearte a vos mismo",
      });
    }

    const existe = await Bloqueo.findOne({
      bloqueadorId,
      bloqueadoId,
    });

    if (existe) {
      return res.status(400).json({
        error: "Ese usuario ya está bloqueado",
      });
    }

    const bloqueo = await Bloqueo.create({
      bloqueadorId,
      bloqueadoId,
      motivo,
    });

    const [conexionesEliminadas, solicitudesEliminadas, chatsArchivados] =
      await Promise.all([
        Conexion.deleteMany(filtroParConexion(bloqueadorId, bloqueadoId)),
        SolicitudConexion.deleteMany(
          filtroParSolicitud(bloqueadorId, bloqueadoId, "pendiente")
        ),
        Chat.updateMany(
          filtroChatPrivado(bloqueadorId, bloqueadoId),
          { $set: { estado: "archivado" } }
        ),
      ]);

    res.status(201).json({
      message:
        "Usuario bloqueado correctamente",
      bloqueo,
      conexionesEliminadas: conexionesEliminadas.deletedCount,
      solicitudesEliminadas: solicitudesEliminadas.deletedCount,
      chatsArchivados: chatsArchivados.modifiedCount,
    });

  } catch (error) {
    res.status(500).json({
      error: "Error al bloquear usuario",
      detalle: error.message,
    });
  }
});


// Obtener usuarios bloqueados por un usuario
router.get("/usuario/:usuarioId", async (req, res) => {
  try {

    const bloqueos = await Bloqueo.find({
      bloqueadorId: req.params.usuarioId,
    }).populate(
      "bloqueadoId",
      "nombre email nombreUsuario fotoPerfilMini"
    ).lean();

    res.json({
      message: "Bloqueos obtenidos correctamente",
      bloqueos,
    });

  } catch (error) {
    res.status(500).json({
      error: "Error al obtener bloqueos",
      detalle: error.message,
    });
  }
});


// Verificar bloqueo
router.get(
  "/verificar/:bloqueadorId/:bloqueadoId",
  async (req, res) => {
    try {

      const bloqueo = await Bloqueo.findOne({
        bloqueadorId: req.params.bloqueadorId,
        bloqueadoId: req.params.bloqueadoId,
      });

      res.json({
        bloqueado: !!bloqueo,
      });

    } catch (error) {
      res.status(500).json({
        error: "Error al verificar bloqueo",
        detalle: error.message,
      });
    }
  }
);


// Desbloquear usuario
router.delete(
  "/:bloqueadorId/:bloqueadoId",
  async (req, res) => {
    try {

      const bloqueo = await Bloqueo.findOneAndDelete({
        bloqueadorId: req.params.bloqueadorId,
        bloqueadoId: req.params.bloqueadoId,
      });

      if (!bloqueo) {
        return res.status(404).json({
          error: "Bloqueo no encontrado",
        });
      }

      const bloqueoRestante = await Bloqueo.findOne({
        $or: [
          {
            bloqueadorId: req.params.bloqueadorId,
            bloqueadoId: req.params.bloqueadoId,
          },
          {
            bloqueadorId: req.params.bloqueadoId,
            bloqueadoId: req.params.bloqueadorId,
          },
        ],
      });

      let conexion = null;
      let chat = null;

      if (!bloqueoRestante) {
        const solicitudAceptada = await SolicitudConexion.findOne(
          filtroParSolicitud(
            req.params.bloqueadorId,
            req.params.bloqueadoId,
            "aceptada"
          )
        ).lean();

        const chatArchivado = await Chat.findOne(
          filtroChatPrivado(req.params.bloqueadorId, req.params.bloqueadoId)
        );

        conexion = await Conexion.findOne(
          filtroParConexion(req.params.bloqueadorId, req.params.bloqueadoId)
        );

        const debeRestaurarRelacion = !!solicitudAceptada || !!chatArchivado;

        if (!conexion && debeRestaurarRelacion) {
          conexion = await Conexion.create({
            usuario1: req.params.bloqueadorId,
            usuario2: req.params.bloqueadoId,
          });
        }

        chat = chatArchivado;

        if (chat) {
          chat.estado = "activo";
          if (conexion && !chat.conexionId) {
            chat.conexionId = conexion._id;
          }
          await chat.save();
        } else if (conexion && debeRestaurarRelacion) {
          chat = await Chat.create({
            conexionId: conexion._id,
            participantes: [req.params.bloqueadorId, req.params.bloqueadoId],
          });
        }
      }

      res.json({
        message: "Usuario desbloqueado correctamente",
        conexionRestaurada: !!conexion,
        chatRestaurado: !!chat,
      });

    } catch (error) {
      res.status(500).json({
        error: "Error al desbloquear usuario",
        detalle: error.message,
      });
    }
  }
);

module.exports = router;
