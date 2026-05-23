const express = require("express");
const router = express.Router();

const Usuario = require("../models/Usuario");

// Ruta de prueba
router.get("/", async (req, res) => {
  try {
    const usuarios = await Usuario.find().select("-contrasenia");

    res.json({
      message: "Usuarios obtenidos correctamente",
      usuarios,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener usuarios",
      detalle: error.message,
    });
  }
});

// Registrar usuario
router.post("/registro", async (req, res) => {
  try {
    const {
      nombre,
      email,
      contrasenia,
      edad,
      ubicacionAproximada,
      bio,
      instagram,
      fotoPerfil,
      intereses,
    } = req.body;

    if (!nombre || !email || !contrasenia) {
      return res.status(400).json({
        error: "Nombre, email y contraseña son obligatorios",
      });
    }

    const usuarioExistente = await Usuario.findOne({ email });

    if (usuarioExistente) {
      return res.status(400).json({
        error: "Ya existe un usuario con ese email",
      });
    }

    const nuevoUsuario = new Usuario({
      nombre,
      email,
      contrasenia,
      edad,
      ubicacionAproximada,
      bio,
      instagram,
      fotoPerfil,
      intereses,
    });

    await nuevoUsuario.save();

    res.status(201).json({
      message: "Usuario registrado correctamente",
      usuario: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        edad: nuevoUsuario.edad,
        intereses: nuevoUsuario.intereses,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al registrar usuario",
      detalle: error.message,
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, contrasenia } = req.body;

    if (!email || !contrasenia) {
      return res.status(400).json({
        error: "Email y contraseña son obligatorios",
      });
    }

    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    const contraseniaCorrecta = await usuario.compararContrasenia(contrasenia);

    if (!contraseniaCorrecta) {
      return res.status(401).json({
        error: "Contraseña incorrecta",
      });
    }

    res.json({
      message: "Login correcto",
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        edad: usuario.edad,
        intereses: usuario.intereses,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al iniciar sesión",
      detalle: error.message,
    });
  }
});

// Buscar usuario por ID
router.get("/:id", async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select("-contrasenia");

    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    res.json({
      message: "Usuario encontrado",
      usuario,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al buscar usuario",
      detalle: error.message,
    });
  }
});

module.exports = router;