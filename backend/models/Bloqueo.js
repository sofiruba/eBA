const mongoose = require("mongoose");

const bloqueoSchema = new mongoose.Schema(
  {
    bloqueadorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    bloqueadoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    motivo: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

bloqueoSchema.index(
  {
    bloqueadorId: 1,
    bloqueadoId: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "Bloqueo",
  bloqueoSchema,
  "bloqueos"
);