const mongoose = require("mongoose");

const pagoSchema = new mongoose.Schema(
  {
    organizadorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    eventoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Evento",
      required: true,
    },
    planPromocionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlanPromocion",
      required: true,
    },
    metodoPago: {
      type: String,
      required: true,
    },
    monto: {
      type: Number,
      required: true,
    },
    estado: {
      type: String,
      enum: ["pendiente", "aprobado", "rechazado"],
      default: "pendiente",
    },
    fechaPago: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Pago",
  pagoSchema,
  "pagos"
);