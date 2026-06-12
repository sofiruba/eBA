const mongoose = require("mongoose");

const interesSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    icono: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interes", interesSchema, "intereses");