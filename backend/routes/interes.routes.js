const express = require("express");
const Interes = require("../models/Interes");

const router = express.Router();

// GET /api/intereses
router.get("/", async (req, res) => {
  try {
    const intereses = await Interes.find().sort({ nombre: 1 });

    return res.json({
      message: "Intereses obtenidos correctamente",
      intereses,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al obtener intereses",
      detalle: error.message,
    });
  }
});

module.exports = router;