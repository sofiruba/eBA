require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const usuarioRoutes = require("./routes/usuario.routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Atlas conectado correctamente");
  })
  .catch((error) => {
    console.error("Error conectando a MongoDB:", error.message);
  });

app.get("/", (req, res) => {
  res.json({
    message: "API de eBA funcionando con MongoDB",
  });
});

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

// RUTAS
app.use("/api/usuarios", usuarioRoutes);

// 404 SIEMPRE AL FINAL
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
  });
});

app.listen(PORT, () => {
  console.log(`Servidor Express escuchando en http://localhost:${PORT}`);
});