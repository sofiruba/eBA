const mongoose = require("mongoose");

const MensajeSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    usuarioEmisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    mensajePadreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mensaje",
      default: null,
    },
    contenido: {
      type: String,
      required: true,
      trim: true,
    },
    fechaEnvio: {
      type: Date,
      default: Date.now,
    },
    leido: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mensaje", MensajeSchema);
