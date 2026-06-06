const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
    conexionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conexion",
      required: true,
    },
    participantes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        required: true,
      },
    ],
    estado: {
      type: String,
      enum: ["activo", "cerrado", "archivado"],
      default: "activo",
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", ChatSchema);
