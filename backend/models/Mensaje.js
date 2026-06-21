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
    eliminado: {
      type: Boolean,
      default: false,
    },
    eliminadoEn: {
      type: Date,
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

MensajeSchema.index({ chatId: 1, fechaEnvio: 1 });

module.exports = mongoose.model("Mensaje", MensajeSchema);
