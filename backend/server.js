require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const usuarioRoutes = require("./routes/usuario.routes");
const eventoRoutes = require("./routes/evento.routes");
const asistenciaRoutes = require("./routes/asistencia.routes");
const solicitudconexionRoutes = require("./routes/solicitudconexion.routes");
const conexionRoutes = require("./routes/conexion.routes");
const publicacionRoutes = require("./routes/publicacion.routes");
const comentarioRoutes = require("./routes/comentario.routes");
const chatRoutes = require("./routes/chat.routes");
const mensajeRoutes = require("./routes/mensaje.routes");
const favoritoRoutes = require("./routes/favorito.routes");
const reporteRoutes = require("./routes/reportes.routes");
const logActividadRoutes = require("./routes/logActividad.routes");
const planPromocionRoutes = require("./routes/planPromocion.routes");
const notificacionRoutes = require("./routes/notificacion.routes");
const pagoRoutes = require("./routes/pago.routes");
const promocionEventoRoutes = require("./routes/promocionEvento.routes");
const interesRoutes = require("./routes/interes.routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

app.use((req, res, next) => {
  console.log("Request recibida:", req.method, req.url);
  next();
});

console.log("MONGO_URI cargada:", process.env.MONGO_URI ? "Sí" : "No");

if (!process.env.MONGO_URI) {
  console.error("Falta MONGO_URI en variables de entorno");
} else {
  mongoose
    .connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
      console.log("MongoDB Atlas conectado correctamente");
      console.log("Base conectada:", mongoose.connection.name);
    })
    .catch((error) => {
      console.error("Error conectando a MongoDB:");
      console.error(error.message);
    });
}

app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

app.get("/", (req, res) => {
  res.json({
    message: "API de eBA funcionando con MongoDB",
    status: "ok",
  });
});

app.get("/ping", (req, res) => {
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
app.use("/api/asistencias", asistenciaRoutes);
app.use("/api/solicitudes-conexion", solicitudconexionRoutes);
app.use("/api/conexiones", conexionRoutes);
app.use("/api/publicaciones", publicacionRoutes);
app.use("/api/comentarios", comentarioRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/mensajes", mensajeRoutes);
app.use("/api/reportes", reporteRoutes);
app.use("/api/favoritos", favoritoRoutes);
app.use("/api/logs-actividad", logActividadRoutes);
app.use("/api/planes-promocion", planPromocionRoutes);
app.use("/api/notificaciones", notificacionRoutes);
app.use("/api/pagos", pagoRoutes);
app.use("/api/promociones-evento", promocionEventoRoutes);
app.use("/api/intereses", interesRoutes);

app.use((err, req, res, next) => {
  console.error("Error interno del servidor:");
  console.error(err);

  res.status(500).json({
    error: "Error interno del servidor",
    detalle: err.message,
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    ruta: req.originalUrl,
  });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor Express escuchando en http://0.0.0.0:${PORT}`);
  });
}

module.exports = app;