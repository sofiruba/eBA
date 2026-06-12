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
    activo: {
      type: Boolean,
      default: true,
    },
    esPromocionado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Evento", eventoSchema, "eventos");