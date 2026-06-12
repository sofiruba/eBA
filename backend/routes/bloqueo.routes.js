const express = require("express");
const router = express.Router();

const Bloqueo = require("../models/Bloqueo");
const Conexion = require("../models/Conexion");


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

    // Eliminar conexión si existe
    await Conexion.deleteMany({
      $or: [
        {
          usuario1Id: bloqueadorId,
          usuario2Id: bloqueadoId,
        },
        {
          usuario1Id: bloqueadoId,
          usuario2Id: bloqueadorId,
        },
      ],
    });

    res.status(201).json({
      message:
        "Usuario bloqueado correctamente y conexión eliminada",
      bloqueo,
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
      "nombre email fotoPerfil"
    );

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

      res.json({
        message: "Usuario desbloqueado correctamente",
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