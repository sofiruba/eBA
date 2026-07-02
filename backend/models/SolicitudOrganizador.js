const mongoose = require("mongoose");

const solicitudOrganizadorSchema = new mongoose.Schema(
  {
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    fotoDocumento: {
      type: String,
      required: true,
    },
    estado: {
      type: String,
      enum: ["pendiente", "aprobado", "rechazado"],
      default: "pendiente",
    },
    motivoRechazo: {
      type: String,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
    revisadoEn: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "SolicitudOrganizador",
  solicitudOrganizadorSchema,
  "solicitudesorganizador"
);