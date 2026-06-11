const mongoose = require("mongoose");

const planPromocionSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
    },
    precioDia: {
      type: Number,
      required: true,
    },
    descripcion: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "PlanPromocion",
  planPromocionSchema,
  "planesPromocion"
);