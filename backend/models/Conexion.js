const mongoose = require("mongoose");

const conexionSchema = new mongoose.Schema(
  {
    usuario1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    usuario2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    usuario1Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
    usuario2Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
  },
  {
    timestamps: true,
    collection: "conexiones",
  }
);

conexionSchema.index({ usuario1: 1, updatedAt: -1 });
conexionSchema.index({ usuario2: 1, updatedAt: -1 });
conexionSchema.index({ usuario1Id: 1, updatedAt: -1 });
conexionSchema.index({ usuario2Id: 1, updatedAt: -1 });

module.exports = mongoose.model("Conexion", conexionSchema);
