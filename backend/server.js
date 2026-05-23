require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para leer JSON
app.use(express.json());

// Conexión a MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Atlas conectado correctamente");
  })
  .catch((error) => {
    console.error("Error conectando a MongoDB:", error.message);
  });

// Ruta principal para probar
app.get("/", (req, res) => {
  res.json({
    message: "API de eBA funcionando con MongoDB",
  });
});

// Ruta para probar conexión con Mongo
app.get("/test-mongo", async (req, res) => {
  try {
    const estado = mongoose.connection.readyState;

    res.json({
      message: "Test de MongoDB",
      connected: estado === 1,
      readyState: estado,
      database: mongoose.connection.name,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error probando MongoDB",
      detail: error.message,
    });
  }
});

// Acá después vamos a importar rutas
// const userRoutes = require("./routes/user.routes");
// const eventRoutes = require("./routes/events.routes");
// const attendanceRoutes = require("./routes/attendance.routes");

// app.use("/api/users", userRoutes);
// app.use("/api/events", eventRoutes);
// app.use("/api/attendances", attendanceRoutes);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor Express escuchando en http://localhost:${PORT}`);
});