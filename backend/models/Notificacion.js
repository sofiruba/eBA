const mongoose = require("mongoose");

const notificacionSchema = new mongoose.Schema(
  {
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    mensaje: {
      type: String,
      required: true,
    },
    tipo: {
      type: String,
      enum: ["comentario", "conexion", "evento", "sistema"],
      required: true,
    },
    leida: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Notificacion",
  notificacionSchema,
  "notificaciones"
);