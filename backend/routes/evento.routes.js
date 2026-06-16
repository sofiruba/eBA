const express = require("express");
const router = express.Router();

const Evento = require("../models/Evento");
const Conexion = require("../models/Conexion");
const Notificacion = require("../models/Notificacion");
const Usuario = require("../models/Usuario");
const actualizarEventosVencidos = require("../utils/actualizarEventos");

const safeRequire = (ruta) => {
  try {
    return require(ruta);
  } catch (error) {
    console.log(`Modelo no disponible ${ruta}:`, error.message);
    return null;
  }
};

const Asistencia = safeRequire("../models/Asistencia");
const Publicacion = safeRequire("../models/Publicacion");
const Comentario = safeRequire("../models/Comentario");
const Favorito = safeRequire("../models/Favorito");
const PromocionEvento = safeRequire("../models/PromocionEvento");
const Pago = safeRequire("../models/Pago");
const Plan = safeRequire("../models/Plan");
const Reporte = safeRequire("../models/Reporte");
const LogActividad = safeRequire("../models/LogActividad");

const eliminarSiExiste = async (Modelo, filtro) => {
  if (!Modelo) {
    return { deletedCount: 0 };
  }

  return await Modelo.deleteMany(filtro);
};

// Obtener todos los eventos
router.get("/", async (req, res) => {
  try {
    await actualizarEventosVencidos();

    const eventos = await Evento.find().sort({ fecha: 1 });

    res.json({
      message: "Eventos obtenidos correctamente",
      eventos,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener eventos",
      detalle: error.message,
    });
  }
});

// Obtener eventos activos
router.get("/activos", async (req, res) => {
  try {
    await actualizarEventosVencidos();

    const eventos = await Evento.find({
      activo: true,
    }).sort({ fecha: 1 });

    res.json({
      message: "Eventos activos obtenidos correctamente",
      eventos,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener eventos activos",
      detalle: error.message,
    });
  }
});

// Obtener eventos promocionados
router.get("/promocionados", async (req, res) => {
  try {
    await actualizarEventosVencidos();

    const eventos = await Evento.find({
      esPromocionado: true,
    }).sort({ fecha: 1 });

    res.json({
      message: "Eventos promocionados obtenidos correctamente",
      eventos,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener eventos promocionados",
      detalle: error.message,
    });
  }
});

// Obtener eventos promocionados activos
router.get("/promocionados-activos", async (req, res) => {
  try {
    await actualizarEventosVencidos();

    const eventos = await Evento.find({
      esPromocionado: true,
      activo: true,
    }).sort({ fecha: 1 });

    res.json({
      message: "Eventos promocionados activos obtenidos correctamente",
      eventos,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener eventos promocionados activos",
      detalle: error.message,
    });
  }
});

// Crear evento
router.post("/", async (req, res) => {
  try {
    const nuevoEvento = new Evento(req.body);

    await nuevoEvento.save();

    const organizador = await Usuario.findById(nuevoEvento.organizadorId);

    if (organizador) {
      const conexiones = await Conexion.find({
        $or: [
          { usuario1Id: organizador._id },
          { usuario2Id: organizador._id },
        ],
      });

      for (const conexion of conexiones) {
        const usuarioNotificar =
          conexion.usuario1Id.toString() === organizador._id.toString()
            ? conexion.usuario2Id
            : conexion.usuario1Id;

        await Notificacion.create({
          usuarioId: usuarioNotificar,
          eventoId: nuevoEvento._id,
          mensaje: `${organizador.nombre} creó un nuevo evento: ${nuevoEvento.nombre}`,
          tipo: "evento",
          leida: false,
        });
      }
    }

    res.status(201).json({
      message: "Evento creado correctamente",
      evento: nuevoEvento,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al crear evento",
      detalle: error.message,
    });
  }
});

// Obtener eventos por categoría
router.get("/categoria/:categoria", async (req, res) => {
  try {
    await actualizarEventosVencidos();

    const eventos = await Evento.find({
      categoria: req.params.categoria,
    }).sort({ fecha: 1 });

    res.json({
      message: "Eventos por categoría obtenidos correctamente",
      eventos,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener eventos por categoría",
      detalle: error.message,
    });
  }
});

// Buscar eventos por texto
router.get("/buscar/:texto", async (req, res) => {
  try {
    await actualizarEventosVencidos();

    const texto = req.params.texto;

    const eventos = await Evento.find({
      $or: [
        { nombre: { $regex: texto, $options: "i" } },
        { descripcion: { $regex: texto, $options: "i" } },
        { categoria: { $regex: texto, $options: "i" } },
      ],
    }).sort({ fecha: 1 });

    res.json({
      message: "Búsqueda realizada correctamente",
      eventos,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al buscar eventos",
      detalle: error.message,
    });
  }
});

// GET /api/eventos/recomendados/:usuarioId
router.get("/recomendados/:usuarioId", async (req, res) => {
  try {
    await actualizarEventosVencidos();

    const { usuarioId } = req.params;

    const usuario = await Usuario.findById(usuarioId);

    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    const interesesUsuario = usuario.intereses || [];

    const eventos = await Evento.find({
      categoria: { $in: interesesUsuario },
      fecha: { $gte: new Date() },
    }).sort({ fecha: 1 });

    return res.json({
      message: "Eventos recomendados obtenidos correctamente",
      interesesUsuario,
      eventos,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al obtener eventos recomendados",
      detalle: error.message,
    });
  }
});

// DELETE /api/eventos/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const evento = await Evento.findById(id);

    if (!evento) {
      return res.status(404).json({
        error: "Evento no encontrado",
      });
    }

    const idsEvento = [id, evento._id];

    const publicacionesDelEvento = Publicacion
      ? await Publicacion.find({
          $or: [
            { eventoId: { $in: idsEvento } },
            { evento: { $in: idsEvento } },
          ],
        }).select("_id")
      : [];

    const idsPublicaciones = publicacionesDelEvento.map((publicacion) =>
      publicacion._id.toString()
    );

    const idsPublicacionesConObjectId = publicacionesDelEvento.map(
      (publicacion) => publicacion._id
    );

    const comentariosEliminados = await eliminarSiExiste(Comentario, {
      $or: [
        { publicacionId: { $in: idsPublicaciones } },
        { publicacionId: { $in: idsPublicacionesConObjectId } },
        { publicacion: { $in: idsPublicaciones } },
        { publicacion: { $in: idsPublicacionesConObjectId } },
        { eventoId: { $in: idsEvento } },
        { evento: { $in: idsEvento } },
      ],
    });

    const publicacionesEliminadas = await eliminarSiExiste(Publicacion, {
      $or: [
        { eventoId: { $in: idsEvento } },
        { evento: { $in: idsEvento } },
      ],
    });

    const asistenciasEliminadas = await eliminarSiExiste(Asistencia, {
      $or: [
        { eventoId: { $in: idsEvento } },
        { evento: { $in: idsEvento } },
        { eventoAsistidoId: { $in: idsEvento } },
      ],
    });

    const favoritosEliminados = await eliminarSiExiste(Favorito, {
      $or: [
        { eventoId: { $in: idsEvento } },
        { evento: { $in: idsEvento } },
      ],
    });

    const promocionesEliminadas = await eliminarSiExiste(PromocionEvento, {
      $or: [
        { eventoId: { $in: idsEvento } },
        { evento: { $in: idsEvento } },
      ],
    });

    const pagosEliminados = await eliminarSiExiste(Pago, {
      $or: [
        { eventoId: { $in: idsEvento } },
        { evento: { $in: idsEvento } },
        { referenciaId: { $in: idsEvento } },
      ],
    });

    const planesEliminados = await eliminarSiExiste(Plan, {
      $or: [
        { eventoId: { $in: idsEvento } },
        { evento: { $in: idsEvento } },
      ],
    });

    const notificacionesEliminadas = await eliminarSiExiste(Notificacion, {
      $or: [
        { eventoId: { $in: idsEvento } },
        { evento: { $in: idsEvento } },
      ],
    });

    const reportesEliminados = await eliminarSiExiste(Reporte, {
      $or: [
        { eventoId: { $in: idsEvento } },
        { evento: { $in: idsEvento } },
        { entidadId: { $in: idsEvento } },
      ],
    });

    const logsEliminados = await eliminarSiExiste(LogActividad, {
      $or: [
        { eventoId: { $in: idsEvento } },
        { evento: { $in: idsEvento } },
        { entidadId: { $in: idsEvento } },
      ],
    });

    await Evento.findByIdAndDelete(id);

    return res.json({
      message: "Evento eliminado correctamente en cascada",
      eventoEliminado: {
        id: evento._id,
        nombre: evento.nombre,
      },
      detalle: {
        asistenciasEliminadas: asistenciasEliminadas.deletedCount,
        publicacionesEliminadas: publicacionesEliminadas.deletedCount,
        comentariosEliminados: comentariosEliminados.deletedCount,
        favoritosEliminados: favoritosEliminados.deletedCount,
        promocionesEliminadas: promocionesEliminadas.deletedCount,
        pagosEliminados: pagosEliminados.deletedCount,
        planesEliminados: planesEliminados.deletedCount,
        notificacionesEliminadas: notificacionesEliminadas.deletedCount,
        reportesEliminados: reportesEliminados.deletedCount,
        logsEliminados: logsEliminados.deletedCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al eliminar evento",
      detalle: error.message,
    });
  }
});

// Obtener evento por ID
router.get("/:id", async (req, res) => {
  try {
    await actualizarEventosVencidos();

    const evento = await Evento.findById(req.params.id);

    if (!evento) {
      return res.status(404).json({
        error: "Evento no encontrado",
      });
    }

    res.json({
      message: "Evento encontrado",
      evento,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al buscar evento",
      detalle: error.message,
    });
  }
});

module.exports = router;