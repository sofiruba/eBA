const express = require("express");
const router = express.Router();

const Pago = require("../models/Pago");

// Registrar pago
router.post("/", async (req, res) => {
  try {
    const {
      organizadorId,
      eventoId,
      planPromocionId,
      metodoPago,
      monto,
      estado,
    } = req.body;

    const pago = new Pago({
      organizadorId,
      eventoId,
      planPromocionId,
      metodoPago,
      monto,
      estado,
    });

    await pago.save();

    res.status(201).json({
      message: "Pago registrado correctamente",
      pago,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al registrar pago",
      detalle: error.message,
    });
  }
});

// Obtener todos los pagos
router.get("/", async (req, res) => {
  try {
    const pagos = await Pago.find()
      .populate("organizadorId", "nombre email")
      .populate("eventoId", "nombre fecha")
      .populate("planPromocionId", "nombre precioDia");

    res.json({
      message: "Pagos obtenidos correctamente",
      pagos,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener pagos",
      detalle: error.message,
    });
  }
});

// Obtener pago por ID
router.get("/:id", async (req, res) => {
  try {
    const pago = await Pago.findById(req.params.id)
      .populate("organizadorId", "nombre email")
      .populate("eventoId", "nombre fecha")
      .populate("planPromocionId", "nombre precioDia");

    if (!pago) {
      return res.status(404).json({
        error: "Pago no encontrado",
      });
    }

    res.json({
      message: "Pago obtenido correctamente",
      pago,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener pago",
      detalle: error.message,
    });
  }
});

// Obtener pagos de un organizador
router.get("/organizador/:organizadorId", async (req, res) => {
  try {
    const pagos = await Pago.find({
      organizadorId: req.params.organizadorId,
    })
      .populate("eventoId", "nombre fecha")
      .populate("planPromocionId", "nombre precioDia");

    res.json({
      message: "Pagos obtenidos correctamente",
      pagos,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener pagos",
      detalle: error.message,
    });
  }
});

// Actualizar estado de pago
router.put("/:id", async (req, res) => {
  try {
    const pago = await Pago.findByIdAndUpdate(
      req.params.id,
      {
        estado: req.body.estado,
      },
      {
        returnDocument: "after",
      }
    );

    if (!pago) {
      return res.status(404).json({
        error: "Pago no encontrado",
      });
    }

    res.json({
      message: "Pago actualizado correctamente",
      pago,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar pago",
      detalle: error.message,
    });
  }
});

// Eliminar pago
router.delete("/:id", async (req, res) => {
  try {
    const pago = await Pago.findByIdAndDelete(req.params.id);

    if (!pago) {
      return res.status(404).json({
        error: "Pago no encontrado",
      });
    }

    res.json({
      message: "Pago eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al eliminar pago",
      detalle: error.message,
    });
  }
});

module.exports = router;