const PromocionEvento = require("../models/PromocionEvento");

async function actualizarPromocionesVencidas() {

  await PromocionEvento.updateMany(
    {
      fechaFin: { $lt: new Date() },
      estado: "activa",
    },
    {
      estado: "inactiva",
    }
  );

}

module.exports = actualizarPromocionesVencidas;