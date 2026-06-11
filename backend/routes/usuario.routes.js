const express = require("express");
const Usuario = require("../models/Usuario");
const enviarEmail = require("../utils/email");

const router = express.Router();

const generarCodigo = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// GET /api/usuarios
router.get("/", async (req, res) => {
  try {
    const usuarios = await Usuario.find().select("-contrasenia");

    return res.json({
      message: "Usuarios obtenidos correctamente",
      usuarios,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al obtener usuarios",
      detalle: error.message,
    });
  }
});

// POST /api/usuarios/registro
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

    const codigo = generarCodigo();

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
      emailVerificado: false,
      codigoVerificacion: codigo,
      codigoVerificacionExpira: new Date(Date.now() + 15 * 60 * 1000),
    });

    await nuevoUsuario.save();

    console.log("Código de verificación generado:", codigo);

    await enviarEmail({
      para: nuevoUsuario.email,
      asunto: "Código de verificación - eBA",
      texto: `Hola ${nuevoUsuario.nombre}, tu código de verificación para eBA es: ${codigo}. Este código vence en 15 minutos.`,
    });

    return res.status(201).json({
      message: "Usuario registrado correctamente. Revisá tu email para verificar la cuenta.",
      usuario: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        edad: nuevoUsuario.edad,
        intereses: nuevoUsuario.intereses,
        emailVerificado: nuevoUsuario.emailVerificado,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al registrar usuario",
      detalle: error.message,
    });
  }
});

// POST /api/usuarios/verificar-email
router.post("/verificar-email", async (req, res) => {
  try {
    const { email, codigo } = req.body;

    if (!email || !codigo) {
      return res.status(400).json({
        error: "Email y código son obligatorios",
      });
    }

    const usuario = await Usuario.findOne({
      email,
      codigoVerificacion: codigo,
      codigoVerificacionExpira: { $gt: new Date() },
    });

    if (!usuario) {
      return res.status(400).json({
        error: "Código inválido o vencido",
      });
    }

    usuario.emailVerificado = true;
    usuario.codigoVerificacion = undefined;
    usuario.codigoVerificacionExpira = undefined;

    await usuario.save();

    return res.json({
      message: "Email verificado correctamente",
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        emailVerificado: usuario.emailVerificado,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al verificar email",
      detalle: error.message,
    });
  }
});

// POST /api/usuarios/login
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
      return res.status(401).json({
        error: "Email o contraseña incorrectos",
      });
    }

    const contraseniaCorrecta = await usuario.compararContrasenia(contrasenia);

    if (!contraseniaCorrecta) {
      return res.status(401).json({
        error: "Email o contraseña incorrectos",
      });
    }

    if (!usuario.emailVerificado) {
      return res.status(403).json({
        error: "Tenés que verificar tu email antes de iniciar sesión",
      });
    }

    return res.json({
      message: "Login correcto",
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        edad: usuario.edad,
        ubicacionAproximada: usuario.ubicacionAproximada,
        bio: usuario.bio,
        instagram: usuario.instagram,
        fotoPerfil: usuario.fotoPerfil,
        intereses: usuario.intereses,
        emailVerificado: usuario.emailVerificado,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al iniciar sesión",
      detalle: error.message,
    });
  }
});

// POST /api/usuarios/recuperar-contrasenia
router.post("/recuperar-contrasenia", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "El email es obligatorio",
      });
    }

    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      return res.status(404).json({
        error: "No existe un usuario con ese email",
      });
    }

    const codigo = generarCodigo();

    usuario.codigoResetPassword = codigo;
    usuario.codigoResetPasswordExpira = new Date(Date.now() + 15 * 60 * 1000);

    await usuario.save();

    console.log("Código de recuperación generado:", codigo);

    await enviarEmail({
      para: usuario.email,
      asunto: "Recuperación de contraseña - eBA",
      texto: `Hola ${usuario.nombre}, tu código para cambiar la contraseña en eBA es: ${codigo}. Este código vence en 15 minutos.`,
    });

    return res.json({
      message: "Código de recuperación enviado al email",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al recuperar contraseña",
      detalle: error.message,
    });
  }
});

// POST /api/usuarios/cambiar-contrasenia
router.post("/cambiar-contrasenia", async (req, res) => {
  try {
    const { email, codigo, nuevaContrasenia } = req.body;

    if (!email || !codigo || !nuevaContrasenia) {
      return res.status(400).json({
        error: "Email, código y nueva contraseña son obligatorios",
      });
    }

    const usuario = await Usuario.findOne({
      email,
      codigoResetPassword: codigo,
      codigoResetPasswordExpira: { $gt: new Date() },
    });

    if (!usuario) {
      return res.status(400).json({
        error: "Código inválido o vencido",
      });
    }

    usuario.contrasenia = nuevaContrasenia;
    usuario.codigoResetPassword = undefined;
    usuario.codigoResetPasswordExpira = undefined;

    await usuario.save();

    return res.json({
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al cambiar contraseña",
      detalle: error.message,
    });
  }
});

// GET /api/usuarios/:id
router.get("/:id", async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select("-contrasenia");

    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    return res.json({
      message: "Usuario obtenido correctamente",
      usuario,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al obtener usuario",
      detalle: error.message,
    });
  }
});

module.exports = router;