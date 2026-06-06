const express = require("express");
const router = express.Router();
const Mensaje = require("../models/Mensaje");

// Crear un mensaje
router.post("/", async (req, res) => {
  try {
    const mensaje = new Mensaje(req.body);
    await mensaje.save();
    res.status(201).json({ message: "Mensaje creado correctamente", mensaje });
  } catch (error) {
    res.status(500).json({ error: "Error al crear mensaje", detalle: error.message });
  }
});

// Obtener mensajes de un chat
router.get("/chat/:chatId", async (req, res) => {
  try {
    const mensajes = await Mensaje.find({ chatId: req.params.chatId })
      .populate("usuarioEmisorId", "nombre email")
      .sort({ fechaEnvio: 1 }); // orden cronológico
    res.json({ message: "Mensajes obtenidos correctamente", mensajes });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener mensajes", detalle: error.message });
  }
});

// Marcar mensaje como leído
router.put("/:id/leido", async (req, res) => {
  try {
    const mensaje = await Mensaje.findByIdAndUpdate(
      req.params.id,
      { leido: true },
      { new: true }
    );
    if (!mensaje) return res.status(404).json({ error: "Mensaje no encontrado" });
    res.json({ message: "Mensaje marcado como leído", mensaje });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar mensaje", detalle: error.message });
  }
});

// Eliminar mensaje
router.delete("/:id", async (req, res) => {
  try {
    const mensaje = await Mensaje.findByIdAndDelete(req.params.id);
    if (!mensaje) return res.status(404).json({ error: "Mensaje no encontrado" });
    res.json({ message: "Mensaje eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar mensaje", detalle: error.message });
  }
});

module.exports = router;
