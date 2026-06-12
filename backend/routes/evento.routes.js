const express = require("express");
const router = express.Router();
const Evento = require("../models/Evento");
const Conexion = require("../models/Conexion");
const Notificacion = require("../models/Notificacion");
const Usuario = require("../models/Usuario");
const actualizarEventosVencidos = require("../utils/actualizarEventos");



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
    const eventos = await Evento.find({ esPromocionado: true }).sort({ fecha: 1 });

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

    // Obtener organizador
    const organizador = await Usuario.findById(
      nuevoEvento.organizadorId
    );

    if (organizador) {
      // Buscar conexiones del organizador
      const conexiones = await Conexion.find({
        $or: [
          { usuario1Id: organizador._id },
          { usuario2Id: organizador._id },
        ],
      });

      // Crear notificaciones
      for (const conexion of conexiones) {
        const usuarioNotificar =
          conexion.usuario1Id.toString() === organizador._id.toString()
            ? conexion.usuario2Id
            : conexion.usuario1Id;

        await Notificacion.create({
          usuarioId: usuarioNotificar,
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