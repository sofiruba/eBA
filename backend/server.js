require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const usuarioRoutes = require("./routes/usuario.routes");
const eventoRoutes = require("./routes/evento.routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use((req, res, next) => {
  console.log("Request recibida:", req.method, req.url);
  next();
});

console.log("MONGO_URI cargada:", process.env.MONGO_URI ? "Sí" : "No");
console.log(
  "Base detectada:",
  process.env.MONGO_URI?.split(".net/")[1]?.split("?")[0]
);

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("MongoDB Atlas conectado correctamente");
  })
  .catch((error) => {
    console.error("Error conectando a MongoDB:");
    console.error(error.message);
  });

app.get("/", (req, res) => {
  res.json({
    message: "API de eBA funcionando con MongoDB",
  });
});

app.get("/ping", (req, res) => {
  console.log("Entró a /ping");
  res.json({
    message: "pong",
  });
});

app.get("/test-mongo", (req, res) => {
  res.json({
    message: "Test de MongoDB",
    connected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    database: mongoose.connection.name,
  });
});

app.use("/api/usuarios", usuarioRoutes);
app.use("/api/eventos", eventoRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor Express escuchando en http://0.0.0.0:${PORT}`);
});