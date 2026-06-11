const mongoose = require("mongoose");

const promocionEventoSchema = new mongoose.Schema(
  {
    eventoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Evento",
      required: true,
    },
    organizadorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    planPromocionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlanPromocion",
      required: true,
    },
    fechaInicio: {
      type: Date,
      required: true,
    },
    fechaFin: {
      type: Date,
      required: true,
    },
    activa: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "PromocionEvento",
  promocionEventoSchema,
  "promocionesEventos"
);