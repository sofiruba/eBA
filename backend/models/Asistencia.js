const mongoose = require("mongoose");

const asistenciaSchema = new mongoose.Schema(
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
    estado: {
      type: String,
      enum: ["interesado", "confirmado", "cancelado"],
      default: "interesado",
    },
  },
  {
    timestamps: true,
  }
);

// Evita que un mismo usuario se registre dos veces al mismo evento
asistenciaSchema.index({ usuarioId: 1, eventoId: 1 }, { unique: true });
asistenciaSchema.index({ usuarioId: 1, updatedAt: -1 });
asistenciaSchema.index({ eventoId: 1, updatedAt: -1 });

module.exports = mongoose.model("Asistencia", asistenciaSchema);
