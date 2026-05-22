const events = require("../data/mockEvents");

const getEvents = (req, res) => {
  res.json(events);
};

const getEventById = (req, res) => {
  const eventId = Number(req.params.id);
  const event = events.find((event) => event.id === eventId);

  if (!event) {
    return res.status(404).json({ message: "Evento no encontrado" });
  }

  res.json(event);
};

const getEventUsers = (req, res) => {
  const eventId = Number(req.params.id);
  const event = events.find((event) => event.id === eventId);

  if (!event) {
    return res.status(404).json({ message: "Evento no encontrado" });
  }

  res.json(event.users);
};

module.exports = {
  getEvents,
  getEventById,
  getEventUsers
};