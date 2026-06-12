require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

/*
  Carga segura de rutas:
  Si una ruta rompe por passport, imports, modelo, etc.,
  no se cae todo el backend. La marca como "NO CARGÓ".
*/
const rutasEstado = {};

const cargarRuta = (nombre, path) => {
  try {
    const ruta = require(path);

    console.log(`Ruta cargada OK: ${nombre}`);

    rutasEstado[nombre] = {
      estado: "OK",
      error: null,
    };

    return ruta;
  } catch (error) {
    console.error(`ERROR cargando ruta ${nombre}:`);
    console.error(error.message);
    console.error(error.stack);

    rutasEstado[nombre] = {
      estado: "NO CARGÓ",
      error: error.message,
    };

    return null;
  }
};

// Rutas
const usuarioRoutes = cargarRuta("usuarios", "./routes/usuario.routes");
const eventoRoutes = cargarRuta("eventos", "./routes/evento.routes");
const asistenciaRoutes = cargarRuta("asistencias", "./routes/asistencia.routes");

const solicitudconexionRoutes = cargarRuta(
  "solicitudesConexion",
  "./routes/solicitudconexion.routes"
);

const conexionRoutes = cargarRuta("conexiones", "./routes/conexion.routes");

const publicacionRoutes = cargarRuta(
  "publicaciones",
  "./routes/publicacion.routes"
);

const comentarioRoutes = cargarRuta("comentarios", "./routes/comentario.routes");
const chatRoutes = cargarRuta("chats", "./routes/chat.routes");
const mensajeRoutes = cargarRuta("mensajes", "./routes/mensaje.routes");
const favoritoRoutes = cargarRuta("favoritos", "./routes/favorito.routes");
const reporteRoutes = cargarRuta("reportes", "./routes/reportes.routes");

const logActividadRoutes = cargarRuta(
  "logsActividad",
  "./routes/logActividad.routes"
);

const planPromocionRoutes = cargarRuta(
  "planesPromocion",
  "./routes/planPromocion.routes"
);

const notificacionRoutes = cargarRuta(
  "notificaciones",
  "./routes/notificacion.routes"
);

const pagoRoutes = cargarRuta("pagos", "./routes/pago.routes");

const promocionEventoRoutes = cargarRuta(
  "promocionesEvento",
  "./routes/promocionEvento.routes"
);

const interesRoutes = cargarRuta("intereses", "./routes/interes.routes");

// Middlewares
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

// Logs de entorno
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("MONGO_URI cargada:", process.env.MONGO_URI ? "Sí" : "No");
console.log("EMAIL_USER cargado:", process.env.EMAIL_USER ? "Sí" : "No");
console.log("EMAIL_PASS cargado:", process.env.EMAIL_PASS ? "Sí" : "No");

// Mongo
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

// Favicons para que no molesten
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

app.get("/favicon.png", (req, res) => {
  res.status(204).end();
});

// Rutas básicas
app.get("/", (req, res) => {
  res.json({
    message: "API de eBA funcionando",
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

// Debug para saber qué rutas cargaron
app.get("/debug-routes", (req, res) => {
  res.json({
    message: "Estado de carga de rutas",
    rutas: rutasEstado,
  });
});

// Debug para saber si Vercel tiene variables
app.get("/debug-env", (req, res) => {
  res.json({
    message: "Estado de variables de entorno",
    mongo: process.env.MONGO_URI ? "OK" : "FALTA",
    emailUser: process.env.EMAIL_USER ? "OK" : "FALTA",
    emailPass: process.env.EMAIL_PASS ? "OK" : "FALTA",
    googleClientId: process.env.GOOGLE_CLIENT_ID ? "OK" : "FALTA",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? "OK" : "FALTA",
    googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL ? "OK" : "FALTA",
    nodeEnv: process.env.NODE_ENV,
  });
});

// Montar rutas solo si cargaron bien
if (usuarioRoutes) app.use("/api/usuarios", usuarioRoutes);
if (eventoRoutes) app.use("/api/eventos", eventoRoutes);
if (asistenciaRoutes) app.use("/api/asistencias", asistenciaRoutes);

if (solicitudconexionRoutes) {
  app.use("/api/solicitudes-conexion", solicitudconexionRoutes);
}

if (conexionRoutes) app.use("/api/conexiones", conexionRoutes);
if (publicacionRoutes) app.use("/api/publicaciones", publicacionRoutes);
if (comentarioRoutes) app.use("/api/comentarios", comentarioRoutes);
if (chatRoutes) app.use("/api/chats", chatRoutes);
if (mensajeRoutes) app.use("/api/mensajes", mensajeRoutes);
if (reporteRoutes) app.use("/api/reportes", reporteRoutes);
if (favoritoRoutes) app.use("/api/favoritos", favoritoRoutes);
if (logActividadRoutes) app.use("/api/logs-actividad", logActividadRoutes);
if (planPromocionRoutes) app.use("/api/planes-promocion", planPromocionRoutes);
if (notificacionRoutes) app.use("/api/notificaciones", notificacionRoutes);
if (pagoRoutes) app.use("/api/pagos", pagoRoutes);

if (promocionEventoRoutes) {
  app.use("/api/promociones-evento", promocionEventoRoutes);
}

if (interesRoutes) app.use("/api/intereses", interesRoutes);

// Manejo de errores internos
app.use((err, req, res, next) => {
  console.error("Error interno del servidor:");
  console.error(err.message);
  console.error(err.stack);

  res.status(500).json({
    error: "Error interno del servidor",
    detalle: err.message,
  });
});

// 404 final
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    ruta: req.originalUrl,
  });
});

// Local sí escucha puerto, Vercel no
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor Express escuchando en http://0.0.0.0:${PORT}`);
  });
}

module.exports = app;