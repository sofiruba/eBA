const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const Mensaje = require("../models/Mensaje");
const Evento = require("../models/Evento");
const Conexion = require("../models/Conexion");
const Bloqueo = require("../models/Bloqueo");
const SolicitudConexion = require("../models/SolicitudConexion");
const Usuario = require("../models/Usuario");
const obtenerLimit = (req, defecto = 20, maximo = 100) => {
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

const camposUsuarioConexion =
  "nombre nombreUsuario email intereses bio ubicacionAproximada";
const camposParticipanteChat = "nombre nombreUsuario email";

const poblarUsuariosConexion = (query) =>
  query
    .populate("usuario1", camposUsuarioConexion)
    .populate("usuario2", camposUsuarioConexion)
    .populate("usuario1Id", camposUsuarioConexion)
    .populate("usuario2Id", camposUsuarioConexion);

const normalizarConexion = (conexion) => {
  if (!conexion) return conexion;

  const conexionNormalizada = { ...conexion };
  conexionNormalizada.usuario1 = conexion.usuario1 || conexion.usuario1Id;
  conexionNormalizada.usuario2 = conexion.usuario2 || conexion.usuario2Id;

  delete conexionNormalizada.usuario1Id;
  delete conexionNormalizada.usuario2Id;

  return conexionNormalizada;
};

const obtenerIdConexion = (usuario) => {
  if (!usuario) return null;
  return String(usuario._id || usuario.id || usuario);
};

const claveParUsuarios = (usuarioA, usuarioB) =>
  [String(usuarioA), String(usuarioB)].sort().join(":");

const filtroChatPrivado = (usuario1Id, usuario2Id) => ({
  tipo: "privado",
  participantes: { $all: [usuario1Id, usuario2Id], $size: 2 },
});

const existeBloqueoEntre = async (usuario1Id, usuario2Id) => {
  const bloqueo = await Bloqueo.findOne({
    $or: [
      { bloqueadorId: usuario1Id, bloqueadoId: usuario2Id },
      { bloqueadorId: usuario2Id, bloqueadoId: usuario1Id },
    ],
  })
    .select("_id")
    .lean();

  return !!bloqueo;
};

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

const obtenerConexionesCompletas = async (usuarioId, limit = 50) => {
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

const unirseAChatEvento = async (req, res) => {
  try {
    const eventoId = req.params.eventoId || req.body.eventoId;
    const { usuarioId } = req.body;

    if (!eventoId) {
      return res.status(400).json({ error: "eventoId es obligatorio" });
    }

    if (!usuarioId) {
      return res.status(400).json({ error: "usuarioId es obligatorio" });
    }

    const evento = await Evento.findById(eventoId).select("nombre");

    if (!evento) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    let chat = await Chat.findOne({ tipo: "evento", eventoId });

    if (!chat) {
      chat = await Chat.create({
        tipo: "evento",
        eventoId,
        nombre: evento.nombre,
        participantes: [usuarioId],
      });
    } else if (!chat.participantes.some((id) => String(id) === String(usuarioId))) {
      chat.participantes.push(usuarioId);
      await chat.save();
    }

    const chatPopulado = await Chat.findById(chat._id)
      .populate("participantes", camposParticipanteChat)
      .populate("eventoId", "nombre fecha");

    return res.json({
      message: "Chat grupal del evento listo",
      chat: chatPopulado,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al unirse al chat del evento",
      detalle: error.message,
    });
  }
};

router.post("/", async (req, res) => {
  try {
    if (req.body.accion === "unirse-evento" || req.body.eventoId) {
      return unirseAChatEvento(req, res);
    }

    const { conexionId, participantes } = req.body;

    if (!Array.isArray(participantes) || participantes.length === 0) {
      return res.status(400).json({
        error: "participantes es obligatorio para crear un chat privado",
      });
    }

    const chatExistente = await Chat.findOne({
      participantes: { $all: participantes, $size: participantes.length },
      tipo: "privado",
    });

    if (chatExistente) {
      const [usuario1Id, usuario2Id] = participantes;
      const bloqueado = await existeBloqueoEntre(usuario1Id, usuario2Id);

      if (bloqueado) {
        return res.status(403).json({
          error: "No se puede abrir este chat porque hay un bloqueo activo",
        });
      }

      if (chatExistente.estado !== "activo") {
        chatExistente.estado = "activo";
        if (conexionId && !chatExistente.conexionId) {
          chatExistente.conexionId = conexionId;
        }
        await chatExistente.save();
      }

      return res.json({
        message: "Chat existente obtenido correctamente",
        chat: chatExistente,
      });
    }

    const chat = new Chat({ conexionId, participantes });
    await chat.save();

    return res.status(201).json({ message: "Chat creado correctamente", chat });
  } catch (error) {
    return res.status(500).json({ error: "Error al crear chat", detalle: error.message });
  }
});

router.post("/evento/:eventoId/unirse", unirseAChatEvento);

router.get("/evento/:eventoId", async (req, res) => {
  try {
    const chat = await Chat.findOne({
      tipo: "evento",
      eventoId: req.params.eventoId,
    })
      .populate("participantes", camposParticipanteChat)
      .populate("eventoId", "nombre fecha");

    if (!chat) return res.status(404).json({ error: "Chat no encontrado" });

    return res.json({ message: "Chat obtenido correctamente", chat });
  } catch (error) {
    return res.status(500).json({
      error: "Error al obtener chat del evento",
      detalle: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const limit = obtenerLimit(req, 20, 100);
    const chats = await Chat.find()
      .populate("participantes", camposParticipanteChat)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();
    res.json({ message: "Chats obtenidos correctamente", chats });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener chats", detalle: error.message });
  }
});

router.get("/resumen/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const limit = obtenerLimit(req, 20, 100);

    const [chats, conexiones, bloqueos] = await Promise.all([
      Chat.find({
        participantes: usuarioId,
        estado: "activo",
      })
        .populate("participantes", camposParticipanteChat)
        .populate("conexionId")
        .populate("eventoId", "nombre fecha")
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean(),
      obtenerConexionesCompletas(usuarioId, 50),
      Bloqueo.find({
        $or: [{ bloqueadorId: usuarioId }, { bloqueadoId: usuarioId }],
      })
        .select("bloqueadorId bloqueadoId")
        .lean(),
    ]);

    const idsBloqueados = new Set(
      bloqueos
        .flatMap((bloqueo) => [
          String(bloqueo.bloqueadorId),
          String(bloqueo.bloqueadoId),
        ])
        .filter((id) => id !== usuarioId)
    );
    const chatsVisibles = chats.filter((chat) => {
      if (chat.tipo === "evento") return true;
      return !(chat.participantes || []).some((participante) =>
        idsBloqueados.has(obtenerIdConexion(participante))
      );
    });
    const conexionesVisibles = conexiones.filter((conexion) => {
      const usuario1Id = obtenerIdConexion(conexion.usuario1);
      const usuario2Id = obtenerIdConexion(conexion.usuario2);
      const otroId = usuario1Id === usuarioId ? usuario2Id : usuario1Id;
      return !idsBloqueados.has(otroId);
    });

    return res.json({
      message: "Resumen de chats obtenido correctamente",
      chats: chatsVisibles,
      conexiones: conexionesVisibles,
      bloqueos: bloqueos.filter(
        (bloqueo) => String(bloqueo.bloqueadorId) === usuarioId
      ),
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al obtener resumen de chats",
      detalle: error.message,
    });
  }
});

router.get("/usuario/:usuarioId", async (req, res) => {
  try {
    const limit = obtenerLimit(req, 20, 100);
    const chats = await Chat.find({
      participantes: req.params.usuarioId,
      estado: "activo",
    })
      .populate("participantes", camposParticipanteChat)
      .populate("conexionId")
      .populate("eventoId", "nombre fecha")
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    res.json({ message: "Chats obtenidos correctamente", chats });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener chats", detalle: error.message });
  }
});

router.get("/entre/:usuario1Id/:usuario2Id", async (req, res) => {
  try {
    const { usuario1Id, usuario2Id } = req.params;

    const bloqueado = await existeBloqueoEntre(usuario1Id, usuario2Id);

    if (bloqueado) {
      return res.status(403).json({
        error: "No se puede abrir este chat porque hay un bloqueo activo",
      });
    }

    const chat = await Chat.findOne(filtroChatPrivado(usuario1Id, usuario2Id))
      .populate("participantes", camposParticipanteChat)
      .populate("conexionId");

    if (!chat) return res.status(404).json({ error: "Chat no encontrado" });

    if (chat.estado !== "activo") {
      chat.estado = "activo";
      await chat.save();
    }

    res.json({ message: "Chat obtenido correctamente", chat });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener chat", detalle: error.message });
  }
});

router.post("/:id/salir", async (req, res) => {
  try {
    const { usuarioId } = req.body;

    if (!usuarioId) {
      return res.status(400).json({ error: "usuarioId es obligatorio" });
    }

    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ error: "Chat no encontrado" });

    const estabaEnElChat = chat.participantes.some(
      (id) => String(id) === String(usuarioId)
    );

    if (!estabaEnElChat) {
      return res.json({ message: "Ya no formabas parte del grupo" });
    }

    const chatActualizado = await Chat.findByIdAndUpdate(
      req.params.id,
      { $pull: { participantes: usuarioId } },
      { new: true }
    );

    if (!chatActualizado) {
      return res.status(404).json({ error: "Chat no encontrado" });
    }

    if (chatActualizado.participantes.length === 0) {
      await Mensaje.deleteMany({ chatId: chat._id });
      await Chat.findByIdAndDelete(chat._id);
      return res.json({ message: "Chat eliminado por no tener participantes" });
    }

    return res.json({ message: "Saliste del grupo correctamente" });
  } catch (error) {
    return res.status(500).json({ error: "Error al salir del grupo", detalle: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate("participantes", camposParticipanteChat)
      .populate("conexionId");
    if (!chat) return res.status(404).json({ error: "Chat no encontrado" });
    res.json({ message: "Chat obtenido correctamente", chat });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener chat", detalle: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ error: "Chat no encontrado" });
    }

    await Mensaje.deleteMany({ chatId: chat._id });
    await Chat.findByIdAndDelete(chat._id);

    res.json({ message: "Chat y mensajes eliminados correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar chat", detalle: error.message });
  }
});

module.exports = router;
