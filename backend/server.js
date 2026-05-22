const express = require("express");
const cors = require("cors");
require("dotenv").config();

const eventRoutes = require("./routes/events.routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API de eBA funcionando correctamente" });
});

app.use("/events", eventRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});