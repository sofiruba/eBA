const Evento = require("../models/Evento");

async function actualizarEventosVencidos() {
  await Evento.updateMany(
    {
      fecha: { $lt: new Date() },
      activo: true,
    },
    {
      activo: false,
    }
  );
}

module.exports = actualizarEventosVencidos;