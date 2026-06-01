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
  },
  {
    timestamps: true,
    collection: "conexiones",
  }
);

module.exports = mongoose.model("Conexion", conexionSchema);