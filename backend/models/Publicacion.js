const mongoose = require("mongoose");

const publicacionSchema = new mongoose.Schema(
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
    contenido: {
      type: String,
      required: true,
      trim: true,
    },
    imagen: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

publicacionSchema.index({ usuarioId: 1, createdAt: -1 });
publicacionSchema.index({ eventoId: 1, createdAt: -1 });

module.exports = mongoose.model(
  "Publicacion",
  publicacionSchema,
  "publicaciones"
);
