const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
    conexionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conexion",
      required: false,
    },
    eventoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Evento",
      index: true,
    },
    nombre: {
      type: String,
    },
    tipo: {
      type: String,
      enum: ["privado", "evento"],
      default: "privado",
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

ChatSchema.index({ participantes: 1, estado: 1, updatedAt: -1 });
ChatSchema.index({ tipo: 1, eventoId: 1 });

module.exports = mongoose.model("Chat", ChatSchema);
