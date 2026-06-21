require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const rutasEstado = {};

let usuarioRoutes = null;
let eventoRoutes = null;
let asistenciaRoutes = null;
let solicitudconexionRoutes = null;
let conexionRoutes = null;
let publicacionRoutes = null;
let comentarioRoutes = null;
let chatRoutes = null;
let mensajeRoutes = null;
let favoritoRoutes = null;
let reporteRoutes = null;
let logActividadRoutes = null;
let planPromocionRoutes = null;
let notificacionRoutes = null;
let pagoRoutes = null;
let promocionEventoRoutes = null;
let interesRoutes = null;
let bloqueoRoutes = null;

// IMPORTANTE PARA VERCEL:
// los require tienen que ser literales, no con variables.

try {
  usuarioRoutes = require("./routes/usuario.routes");
  rutasEstado.usuarios = { estado: "OK", error: null };
} catch (error) {
  rutasEstado.usuarios = { estado: "NO CARGÓ", error: error.message };
  console.error("ERROR cargando usuarios:", error.message);
}

try {
  bloqueoRoutes = require("./routes/bloqueo.routes");
  rutasEstado.bloqueos = { estado: "OK", error: null };
} catch (error) {
  rutasEstado.bloqueos = { estado: "NO CARGÓ", error: error.message };
  console.error("ERROR cargando bloqueos:", error.message);
}

try {
  eventoRoutes = require("./routes/evento.routes");
  rutasEstado.eventos = { estado: "OK", error: null };
} catch (error) {
  rutasEstado.eventos = { estado: "NO CARGÓ", error: error.message };
  console.error("ERROR cargando eventos:", error.message);
}

try {
  asistenciaRoutes = require("./routes/asistencia.routes");
  rutasEstado.asistencias = { estado: "OK", error: null };
} catch (error) {
  rutasEstado.asistencias = { estado: "NO CARGÓ", error: error.message };
  console.error("ERROR cargando asistencias:", error.message);
}

try {
  solicitudconexionRoutes = require("./routes/solicitudconexion.routes");
  rutasEstado.solicitudesConexion = { estado: "OK", error: null };
} catch (error) {
  rutasEstado.solicitudesConexion = {
    estado: "NO CARGÓ",
    error: error.message,
  };
  console.error("ERROR cargando solicitudesConexion:", error.message);
}

try {
  conexionRoutes = require("./routes/conexion.routes");
  rutasEstado.conexiones = { estado: "OK", error: null };
} catch (error) {
  rutasEstado.conexiones = { estado: "NO CARGÓ", error: error.message };
  console.error("ERROR cargando conexiones:", error.message);
}

try {
  publicacionRoutes = require("./routes/publicacion.routes");
  rutasEstado.publicaciones = { estado: "OK", error: null };
} catch (error) {
  rutasEstado.publicaciones = { estado: "NO CARGÓ", error: error.message };
  console.error("ERROR cargando publicaciones:", error.message);
}

try {
  comentarioRoutes = require("./routes/comentario.routes");
  rutasEstado.comentarios = { estado: "OK", error: null };
} catch (error) {
  rutasEstado.comentarios = { estado: "NO CARGÓ", error: error.message };
  console.error("ERROR cargando comentarios:", error.message);
}

try {
  chatRoutes = require("./routes/chat.routes");
  rutasEstado.chats = { estado: "OK", error: null };
} catch (error) {
  rutasEstado.chats = { estado: "NO CARGÓ", error: error.message };
  console.error("ERROR cargando chats:", error.message);
}

try {
  mensajeRoutes = require("./routes/mensaje.routes");
  rutasEstado.mensajes = { estado: "OK", error: null };
} catch (error) {
  rutasEstado.mensajes = { estado: "NO CARGÓ", error: error.message };
  console.error("ERROR cargando mensajes:", error.message);
}

try {
  favoritoRoutes = require("./routes/favorito.routes");
  rutasEstado.favoritos = { estado: "OK", error: null };
} catch (error) {
  rutasEstado.favoritos = { estado: "NO CARGÓ", error: error.message };
  console.error("ERROR cargando favoritos:", error.message);
}

try {
  reporteRoutes = require("./routes/reportes.routes");
  rutasEstado.reportes = { estado: "OK", error: null };
} catch (error) {
  rutasEstado.reportes = { estado: "NO CARGÓ", error: error.message };
  console.error("ERROR cargando reportes:", error.message);
}

try {
  logActividadRoutes = require("./routes/logActividad.routes");
  rutasEstado.logsActividad = { estado: "OK", error: null };
} catch (error) {
  rutasEstado.logsActividad = { estado: "NO CARGÓ", error: error.message };
  console.error("ERROR cargando logsActividad:", error.message);
}

try {
  planPromocionRoutes = require("./routes/planPromocion.routes");
  rutasEstado.planesPromocion = { estado: "OK", error: null };
} catch (error) {
  rutasEstado.planesPromocion = {
    estado: "NO CARGÓ",
    error: error.message,
  };
  console.error("ERROR cargando planesPromocion:", error.message);
}

try {
  notificacionRoutes = require("./routes/notificacion.routes");
  rutasEstado.notificaciones = { estado: "OK", error: null };
} catch (error) {
  rutasEstado.notificaciones = { estado: "NO CARGÓ", error: error.message };
  console.error("ERROR cargando notificaciones:", error.message);
}

try {
  pagoRoutes = require("./routes/pago.routes");
  rutasEstado.pagos = { estado: "OK", error: null };
} catch (error) {
  rutasEstado.pagos = { estado: "NO CARGÓ", error: error.message };
  console.error("ERROR cargando pagos:", error.message);
}

try {
  promocionEventoRoutes = require("./routes/promocionEvento.routes");
  rutasEstado.promocionesEvento = { estado: "OK", error: null };
} catch (error) {
  rutasEstado.promocionesEvento = {
    estado: "NO CARGÓ",
    error: error.message,
  };
  console.error("ERROR cargando promocionesEvento:", error.message);
}

try {
  interesRoutes = require("./routes/interes.routes");
  rutasEstado.intereses = { estado: "OK", error: null };
} catch (error) {
  rutasEstado.intereses = { estado: "NO CARGÓ", error: error.message };
  console.error("ERROR cargando intereses:", error.message);
}

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
  const inicio = Date.now();

  res.on("finish", () => {
    const duracion = Date.now() - inicio;
    const limiteLento = Number(process.env.SLOW_REQUEST_MS || 1500);

    if (duracion >= limiteLento) {
      console.log(
        `Request lenta: ${req.method} ${req.originalUrl} ${res.statusCode} ${duracion}ms`
      );
      return;
    }

    if (process.env.DEBUG_HTTP === "true") {
      console.log("Request recibida:", req.method, req.originalUrl, res.statusCode);
    }
  });

  next();
});

// Logs de entorno
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("MONGO_URI cargada:", process.env.MONGO_URI ? "Sí" : "No");
console.log("EMAIL_USER cargado:", process.env.EMAIL_USER ? "Sí" : "No");
console.log("EMAIL_PASS cargado:", process.env.EMAIL_PASS ? "Sí" : "No");

// Mongo preparado para Vercel
let mongoPromise = null;

const conectarMongo = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("Falta MONGO_URI en variables de entorno");
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    if (!mongoPromise) {
      console.log("Intentando conectar a MongoDB Atlas...");

      mongoPromise = mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
        socketTimeoutMS: 12000,
        maxPoolSize: 10,
        autoIndex: false,
        autoCreate: false,
        bufferCommands: false,
      });
    }

    await mongoPromise;

    console.log("MongoDB Atlas conectado correctamente");
    console.log("Base conectada:", mongoose.connection.name);
  } catch (error) {
    console.error("Falló conexión a MongoDB:");
    console.error(error.message);

    mongoPromise = null;

    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error("Error al desconectar mongoose:");
      console.error(disconnectError.message);
    }

    throw error;
  }
};

conectarMongo().catch((error) => {
  console.error("Error conectando a MongoDB al iniciar:");
  console.error(error.message);
});

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

app.get("/test-mongo", async (req, res) => {
  try {
    await conectarMongo();

    res.json({
      message: "Test de MongoDB",
      connected: mongoose.connection.readyState === 1,
      readyState: mongoose.connection.readyState,
      database: mongoose.connection.name,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error conectando a MongoDB",
      connected: false,
      readyState: mongoose.connection.readyState,
      detalle: error.message,
    });
  }
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

// Antes de cualquier ruta /api, nos aseguramos de que Mongo esté conectado
app.use("/api", async (req, res, next) => {
  try {
    await conectarMongo();
    next();
  } catch (error) {
    console.error("Error conectando a Mongo desde /api:");
    console.error(error.message);

    return res.status(500).json({
      error: "No se pudo conectar a MongoDB",
      detalle: error.message,
    });
  }
});

// Montar rutas solo si cargaron bien
if (usuarioRoutes) app.use("/api/usuarios", usuarioRoutes);
if (bloqueoRoutes) app.use("/api/bloqueos", bloqueoRoutes);
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
