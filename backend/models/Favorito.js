const mongoose = require("mongoose");

const favoritoSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

favoritoSchema.index({ usuarioId: 1, updatedAt: -1 });
favoritoSchema.index({ eventoId: 1 });

module.exports = mongoose.model(
  "Favorito",
  favoritoSchema,
  "favoritos"
);
