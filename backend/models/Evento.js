const mongoose = require("mongoose");

const eventoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    fecha: {
      type: Date,
      required: true,
    },
    ubicacion: {
      type: Object,
      required: true,
    },
    categoria: {
      type: String,
      required: true,
    },
    imagen: {
      type: String,
    },
    organizador: {
      type: String,
      required: true,
    },
    organizadorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
    activo: {
      type: Boolean,
      default: true,
    },
    esPromocionado: {
      type: Boolean,
      default: false,
    },
    estado: {
      type: String,
      enum: ["pendiente", "aprobado", "rechazado"],
      default: "pendiente",
    },
    motivoRechazo: {
      type: String,
    },
    verificadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
    verificadoEn: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

eventoSchema.index({ fecha: 1 });
eventoSchema.index({ activo: 1, fecha: 1 });
eventoSchema.index({ esPromocionado: 1, activo: 1, fecha: 1 });
eventoSchema.index({ categoria: 1, fecha: 1 });
eventoSchema.index({ estado: 1, fecha: 1 });
eventoSchema.index({ organizadorId: 1, createdAt: -1 });

module.exports = mongoose.model("Evento", eventoSchema, "eventos");