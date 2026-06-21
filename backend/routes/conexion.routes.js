const express = require("express");

const Conexion = require("../models/Conexion");
const Bloqueo = require("../models/Bloqueo");
const SolicitudConexion = require("../models/SolicitudConexion");
const Usuario = require("../models/Usuario");

const router = express.Router();
const obtenerLimit = (req, defecto = 10, maximo = 50) => {
  const valor = Number(req.query.limit);
  if (!Number.isFinite(valor) || valor <= 0) return defecto;
  return Math.min(Math.floor(valor), maximo);
};

const filtroConexionesUsuario = (usuarioId) => ({
  $or: [
    { usuario1: usuarioId },
    { usuario2: usuarioId },
    { usuario1Id: usuarioId },
    { usuario2Id: usuarioId },
  ],
});

const poblarUsuariosConexion = (query) =>
  query
    .populate("usuario1")
    .populate("usuario2")
    .populate("usuario1Id")
    .populate("usuario2Id");

const obtenerIdConexion = (usuario) => {
  if (!usuario) return null;
  return String(usuario._id || usuario.id || usuario);
};

const claveParUsuarios = (usuarioA, usuarioB) =>
  [String(usuarioA), String(usuarioB)].sort().join(":");

const camposUsuarioConexion =
  "nombre nombreUsuario email fotoPerfilMini intereses bio ubicacionAproximada";

const crearUsuarioMinimo = (usuarioId) => ({
  _id: usuarioId,
  nombre: "Usuario",
  nombreUsuario: "usuario",
});

const armarConexion = (conexion, usuariosPorId = new Map()) => {
  const usuario1Id = obtenerIdConexion(conexion.usuario1 || conexion.usuario1Id);
  const usuario2Id = obtenerIdConexion(conexion.usuario2 || conexion.usuario2Id);

  if (!usuario1Id || !usuario2Id) return null;

  return {
    _id: conexion._id,
    usuario1: usuariosPorId.get(usuario1Id) || crearUsuarioMinimo(usuario1Id),
    usuario2: usuariosPorId.get(usuario2Id) || crearUsuarioMinimo(usuario2Id),
    createdAt: conexion.createdAt,
    updatedAt: conexion.updatedAt,
  };
};

const obtenerOtroIdConexion = (conexion, usuarioId) => {
  const usuario1Id = obtenerIdConexion(conexion.usuario1);
  const usuario2Id = obtenerIdConexion(conexion.usuario2);

  return usuario1Id === usuarioId ? usuario2Id : usuario1Id;
};

const obtenerOtroIdSolicitud = (solicitud, usuarioId) => {
  const solicitanteId = obtenerIdConexion(solicitud.usuariosolicitante);
  const receptorId = obtenerIdConexion(solicitud.usuarioreceptor);

  return solicitanteId === usuarioId ? receptorId : solicitanteId;
};

const armarSolicitudes = async (solicitudes) => {
  const idsUsuarios = [
    ...new Set(
      solicitudes
        .flatMap((solicitud) => [
          obtenerIdConexion(solicitud.usuariosolicitante),
          obtenerIdConexion(solicitud.usuarioreceptor),
        ])
        .filter(Boolean)
    ),
  ];

  const usuarios = await Usuario.find({ _id: { $in: idsUsuarios } })
    .select(camposUsuarioConexion)
    .lean();

  const usuariosPorId = new Map(
    usuarios.map((usuario) => [String(usuario._id), usuario])
  );

  return solicitudes.map((solicitud) => {
    const solicitanteId = obtenerIdConexion(solicitud.usuariosolicitante);
    const receptorId = obtenerIdConexion(solicitud.usuarioreceptor);

    return {
      ...solicitud,
      usuariosolicitante:
        usuariosPorId.get(solicitanteId) || crearUsuarioMinimo(solicitanteId),
      usuarioreceptor:
        usuariosPorId.get(receptorId) || crearUsuarioMinimo(receptorId),
    };
  });
};

const obtenerConexionesCompletas = async (usuarioId, limit = 10) => {
  const [conexionesGuardadas, solicitudesAceptadas] = await Promise.all([
    Conexion.find(filtroConexionesUsuario(usuarioId))
      .select("_id usuario1 usuario2 usuario1Id usuario2Id createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .lean(),
    SolicitudConexion.find({
      estado: "aceptada",
      $or: [{ usuariosolicitante: usuarioId }, { usuarioreceptor: usuarioId }],
    })
      .select("_id usuariosolicitante usuarioreceptor createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .lean(),
  ]);

  const conexionesPorPar = new Map();

  conexionesGuardadas.forEach((conexion) => {
    const usuario1Id = obtenerIdConexion(conexion.usuario1 || conexion.usuario1Id);
    const usuario2Id = obtenerIdConexion(conexion.usuario2 || conexion.usuario2Id);

    if (!usuario1Id || !usuario2Id) return;

    conexionesPorPar.set(claveParUsuarios(usuario1Id, usuario2Id), conexion);
  });

  solicitudesAceptadas.forEach((solicitud) => {
    const usuario1Id = obtenerIdConexion(solicitud.usuariosolicitante);
    const usuario2Id = obtenerIdConexion(solicitud.usuarioreceptor);

    if (!usuario1Id || !usuario2Id) return;

    const clave = claveParUsuarios(usuario1Id, usuario2Id);

    if (!conexionesPorPar.has(clave)) {
      conexionesPorPar.set(clave, {
        _id: solicitud._id,
        usuario1: solicitud.usuariosolicitante,
        usuario2: solicitud.usuarioreceptor,
        createdAt: solicitud.createdAt,
        updatedAt: solicitud.updatedAt,
      });
    }
  });

  const conexionesOrdenadas = Array.from(conexionesPorPar.values())
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0).getTime() -
        new Date(a.updatedAt || a.createdAt || 0).getTime()
    )
    .slice(0, limit);

  const idsUsuarios = [
    ...new Set(
      conexionesOrdenadas
        .flatMap((conexion) => [
          obtenerIdConexion(conexion.usuario1 || conexion.usuario1Id),
          obtenerIdConexion(conexion.usuario2 || conexion.usuario2Id),
        ])
        .filter(Boolean)
    ),
  ];

  const usuarios = await Usuario.find({ _id: { $in: idsUsuarios } })
    .select(camposUsuarioConexion)
    .lean();

  const usuariosPorId = new Map(
    usuarios.map((usuario) => [String(usuario._id), usuario])
  );

  return conexionesOrdenadas
    .map((conexion) => armarConexion(conexion, usuariosPorId))
    .filter(Boolean);
};

const obtenerSugerencias = async (usuarioId, limit) => {
  const conexiones = await Conexion.find(filtroConexionesUsuario(usuarioId))
    .select("usuario1 usuario2 usuario1Id usuario2Id")
    .lean();

  const idsConexionesDirectas = conexiones.map((conexion) => {
    const usuario1Id = obtenerIdConexion(conexion.usuario1 || conexion.usuario1Id);
    const usuario2Id = obtenerIdConexion(conexion.usuario2 || conexion.usuario2Id);
    return usuario1Id === usuarioId ? usuario2Id : usuario1Id;
  }).filter(Boolean);

  if (idsConexionesDirectas.length === 0) return [];

  const [conexionesSegundoGrado, solicitudesPendientes, bloqueos] =
    await Promise.all([
      Conexion.find({
        $or: [
          { usuario1: { $in: idsConexionesDirectas } },
          { usuario2: { $in: idsConexionesDirectas } },
          { usuario1Id: { $in: idsConexionesDirectas } },
          { usuario2Id: { $in: idsConexionesDirectas } },
        ],
      })
        .select("usuario1 usuario2 usuario1Id usuario2Id")
        .lean(),
      SolicitudConexion.find({
        estado: "pendiente",
        $or: [{ usuariosolicitante: usuarioId }, { usuarioreceptor: usuarioId }],
      })
        .select("usuariosolicitante usuarioreceptor")
        .lean(),
      Bloqueo.find({
        $or: [{ bloqueadorId: usuarioId }, { bloqueadoId: usuarioId }],
      })
        .select("bloqueadorId bloqueadoId")
        .lean(),
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
    const usuario1Id = obtenerIdConexion(conexion.usuario1 || conexion.usuario1Id);
    const usuario2Id = obtenerIdConexion(conexion.usuario2 || conexion.usuario2Id);
    const candidatoId = idsConexionesDirectas.includes(usuario1Id)
      ? usuario2Id
      : usuario1Id;

    if (idsExcluir.has(candidatoId)) return;

    conteos.set(candidatoId, (conteos.get(candidatoId) || 0) + 1);
  });

  const idsSugerencias = Array.from(conteos.keys()).slice(0, limit);

  const usuarios = await Usuario.find({
    _id: { $in: idsSugerencias },
  })
    .select(camposUsuarioConexion)
    .lean();

  return usuarios
    .map((usuario) => ({
      usuario,
      conexionesEnComun: conteos.get(String(usuario._id)) || 1,
    }))
    .sort((a, b) => b.conexionesEnComun - a.conexionesEnComun);
};

router.get("/resumen/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const limit = obtenerLimit(req, 10, 50);

    const [conexiones, bloqueos, solicitudesPendientes] =
      await Promise.all([
        obtenerConexionesCompletas(usuarioId, limit),
        Bloqueo.find({
          $or: [{ bloqueadorId: usuarioId }, { bloqueadoId: usuarioId }],
        })
          .select("bloqueadorId bloqueadoId")
          .lean(),
        SolicitudConexion.find({
          estado: "pendiente",
          $or: [
            { usuariosolicitante: usuarioId },
            { usuarioreceptor: usuarioId },
          ],
        })
          .select("usuariosolicitante usuarioreceptor estado createdAt updatedAt")
          .lean(),
      ]);
    const idsBloqueados = new Set(
      bloqueos.flatMap((bloqueo) => [
        String(bloqueo.bloqueadorId),
        String(bloqueo.bloqueadoId),
      ])
    );
    idsBloqueados.delete(usuarioId);

    const conexionesVisibles = conexiones.filter((conexion) => {
      const otroId = obtenerOtroIdConexion(conexion, usuarioId);
      return !otroId || !idsBloqueados.has(otroId);
    });

    const solicitudesVisibles = solicitudesPendientes.filter((solicitud) => {
      const otroId = obtenerOtroIdSolicitud(solicitud, usuarioId);
      return !otroId || !idsBloqueados.has(otroId);
    });
    const solicitudes = await armarSolicitudes(solicitudesVisibles);

    return res.json({
      message: "Resumen de conexiones obtenido correctamente",
      conexiones: conexionesVisibles,
      sugerencias: [],
      bloqueos: bloqueos.filter(
        (bloqueo) => String(bloqueo.bloqueadorId) === usuarioId
      ),
      solicitudes,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al obtener resumen de conexiones",
      detalle: error.message,
    });
  }
});

/*
GET /api/conexiones/usuario/:usuarioId
Obtener conexiones de un usuario
*/
router.get("/usuario/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const limit = obtenerLimit(req, 10, 50);

    const conexiones = await obtenerConexionesCompletas(usuarioId, limit);

    res.json(conexiones);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al obtener conexiones",
      detalle: error.message,
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
    const limit = obtenerLimit(req, 10, 30);
    const sugerencias = await obtenerSugerencias(usuarioId, limit);

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
    const limit = obtenerLimit(req, 50, 200);
    const conexiones = await poblarUsuariosConexion(Conexion.find())
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    const idsUsuarios = [
      ...new Set(
        conexiones.flatMap((conexion) => [
          obtenerIdConexion(conexion.usuario1 || conexion.usuario1Id),
          obtenerIdConexion(conexion.usuario2 || conexion.usuario2Id),
        ])
      ),
    ].filter(Boolean);
    const usuarios = await Usuario.find({ _id: { $in: idsUsuarios } })
      .select(camposUsuarioConexion)
      .lean();
    const usuariosPorId = new Map(
      usuarios.map((usuario) => [String(usuario._id), usuario])
    );

    res.json(
      conexiones
        .map((conexion) => armarConexion(conexion, usuariosPorId))
        .filter(Boolean)
    );
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al obtener conexiones",
      detalle: error.message,
    });
  }
});

module.exports = router;
