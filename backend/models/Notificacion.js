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
      enum: ["comentario", "conexion", "evento", "sistema", "chat"],
      required: true,
    },
    entidadTipo: {
      type: String,
      enum: [
        "chat",
        "publicacion",
        "comentario",
        "solicitud",
        "conexion",
        "evento",
        "usuario",
        "sistema",
      ],
    },
    entidadId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
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

notificacionSchema.index({ usuarioId: 1, createdAt: -1 });
notificacionSchema.index({ usuarioId: 1, leida: 1 });

module.exports = mongoose.model(
  "Notificacion",
  notificacionSchema,
  "notificaciones"
);
