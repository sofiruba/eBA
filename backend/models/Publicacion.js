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

module.exports = mongoose.model(
  "Publicacion",
  publicacionSchema,
  "publicaciones"
);