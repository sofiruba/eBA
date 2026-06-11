const mongoose = require("mongoose");

const reporteSchema = new mongoose.Schema(
  {
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    eventoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Evento",
      required: true,
    },
    tipo: {
      type: String,
      required: true,
    },
    mensaje: {
      type: String,
      required: true,
    },
    estado: {
      type: String,
      enum: ["pendiente", "revisado", "rechazado"],
      default: "pendiente",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Reporte",
  reporteSchema,
  "reportes"
);