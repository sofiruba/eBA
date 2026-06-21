const mongoose = require("mongoose");

const comentarioSchema = new mongoose.Schema(
  {
    publicacionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Publicacion",
      required: true,
    },
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    comentarioPadreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comentario",
      default: null,
    },
    contenido: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

comentarioSchema.index({ publicacionId: 1, createdAt: 1 });

module.exports = mongoose.model(
  "Comentario",
  comentarioSchema,
  "comentarios"
);
