const express = require("express");

const Conexion = require("../models/Conexion");
const Bloqueo = require("../models/Bloqueo");
const SolicitudConexion = require("../models/SolicitudConexion");
const Usuario = require("../models/Usuario");

const router = express.Router();

/*
GET /api/conexiones/usuario/:usuarioId
Obtener conexiones de un usuario
*/
router.get("/usuario/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const conexiones = await Conexion.find({
      $or: [
        { usuario1: usuarioId },
        { usuario2: usuarioId },
      ],
    })
      .populate("usuario1")
      .populate("usuario2");

    res.json(conexiones);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al obtener conexiones",
    });
  }
});

/*
GET /api/conexiones/sugerencias/:usuarioId
Sugiere conexiones de tus conexiones.
*/
router.get("/sugerencias/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const conexiones = await Conexion.find({
      $or: [{ usuario1: usuarioId }, { usuario2: usuarioId }],
    });

    const idsConexionesDirectas = conexiones.map((conexion) => {
      const usuario1Id = String(conexion.usuario1);
      const usuario2Id = String(conexion.usuario2);
      return usuario1Id === usuarioId ? usuario2Id : usuario1Id;
    });

    if (idsConexionesDirectas.length === 0) {
      return res.json({
        message: "Sugerencias obtenidas correctamente",
        sugerencias: [],
      });
    }

    const [conexionesSegundoGrado, solicitudesPendientes, bloqueos] =
      await Promise.all([
        Conexion.find({
          $or: [
            { usuario1: { $in: idsConexionesDirectas } },
            { usuario2: { $in: idsConexionesDirectas } },
          ],
        }),
        SolicitudConexion.find({
          estado: "pendiente",
          $or: [{ usuariosolicitante: usuarioId }, { usuarioreceptor: usuarioId }],
        }),
        Bloqueo.find({
          $or: [{ bloqueadorId: usuarioId }, { bloqueadoId: usuarioId }],
        }),
      ]);

    const idsExcluir = new Set([
      usuarioId,
      ...idsConexionesDirectas,
      ...solicitudesPendientes.flatMap((solicitud) => [
        String(solicitud.usuariosolicitante),
        String(solicitud.usuarioreceptor),
      ]),
      ...bloqueos.flatMap((bloqueo) => [
        String(bloqueo.bloqueadorId),
        String(bloqueo.bloqueadoId),
      ]),
    ]);

    const conteos = new Map();

    conexionesSegundoGrado.forEach((conexion) => {
      const usuario1Id = String(conexion.usuario1);
      const usuario2Id = String(conexion.usuario2);
      const candidatoId = idsConexionesDirectas.includes(usuario1Id)
        ? usuario2Id
        : usuario1Id;

      if (idsExcluir.has(candidatoId)) return;

      conteos.set(candidatoId, (conteos.get(candidatoId) || 0) + 1);
    });

    const idsSugerencias = Array.from(conteos.keys()).slice(0, 12);

    const usuarios = await Usuario.find({
      _id: { $in: idsSugerencias },
    }).select("nombre nombreUsuario email fotoPerfil intereses bio ubicacionAproximada");

    const sugerencias = usuarios
      .map((usuario) => ({
        usuario,
        conexionesEnComun: conteos.get(String(usuario._id)) || 1,
      }))
      .sort((a, b) => b.conexionesEnComun - a.conexionesEnComun);

    res.json({
      message: "Sugerencias obtenidas correctamente",
      sugerencias,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al obtener sugerencias",
    });
  }
});

/*
GET /api/conexiones
 Obtener todas las conexiones esta es para testing se puede borrar sin drama
*/
router.get("/", async (req, res) => {
  try {
    const conexiones = await Conexion.find()
      .populate("usuario1")
      .populate("usuario2");

    res.json(conexiones);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al obtener conexiones",
    });
  }
});

module.exports = router;
