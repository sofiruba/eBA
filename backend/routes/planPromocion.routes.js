const express = require("express");
const router = express.Router();

const PlanPromocion = require("../models/PlanPromocion");

// Crear plan
router.post("/", async (req, res) => {
  try {
    const { nombre, precioDia, descripcion } = req.body;

    const plan = new PlanPromocion({
      nombre,
      precioDia,
      descripcion,
    });

    await plan.save();

    res.status(201).json({
      message: "Plan creado correctamente",
      plan,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al crear plan",
      detalle: error.message,
    });
  }
});

// Obtener todos los planes
router.get("/", async (req, res) => {
  try {
    const planes = await PlanPromocion.find();

    res.json({
      message: "Planes obtenidos correctamente",
      planes,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener planes",
      detalle: error.message,
    });
  }
});

// Obtener plan por ID
router.get("/:id", async (req, res) => {
  try {
    const plan = await PlanPromocion.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        error: "Plan no encontrado",
      });
    }

    res.json({
      message: "Plan obtenido correctamente",
      plan,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener plan",
      detalle: error.message,
    });
  }
});

// Actualizar plan
router.put("/:id", async (req, res) => {
  try {
    const plan = await PlanPromocion.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({
        error: "Plan no encontrado",
      });
    }

    res.json({
      message: "Plan actualizado correctamente",
      plan,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar plan",
      detalle: error.message,
    });
  }
});

// Eliminar plan
router.delete("/:id", async (req, res) => {
  try {
    const plan = await PlanPromocion.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({
        error: "Plan no encontrado",
      });
    }

    res.json({
      message: "Plan eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al eliminar plan",
      detalle: error.message,
    });
  }
});

module.exports = router;