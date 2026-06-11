const mongoose = require("mongoose");

const logActividadSchema = new mongoose.Schema(
  {
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    accion: {
      type: String,
      required: true,
    },
    detalle: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "LogActividad",
  logActividadSchema,
  "logsActividad"
);