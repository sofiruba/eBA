const mongoose = require("mongoose");

const solicitudConexionSchema = new mongoose.Schema(
  {
    usuariosolicitante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    usuarioreceptor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    estado: {
      type: String,
      enum: ["pendiente", "aceptada", "rechazada"],
      default: "pendiente",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "solicitudconexiones",
  }
);

module.exports = mongoose.model(
  "SolicitudConexion", solicitudConexionSchema
);