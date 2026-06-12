const express = require("express");
const Usuario = require("../models/Usuario");
const enviarEmail = require("../utils/email");

const router = express.Router();

const generarCodigo = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const normalizarNombreUsuario = (valor) => {
  if (!valor) return "";

  return valor
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace("@", "")
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._]/g, "");
};

const generarNombreUsuarioUnico = async (base, usuarioIdIgnorado = null) => {
  let nombreUsuarioBase = normalizarNombreUsuario(base);

  if (!nombreUsuarioBase) {
    nombreUsuarioBase = `usuario${Date.now()}`;
  }

  let nombreUsuarioFinal = nombreUsuarioBase;
  let contador = 1;

  while (true) {
    const filtro = {
      nombreUsuario: nombreUsuarioFinal,
    };

    if (usuarioIdIgnorado) {
      filtro._id = { $ne: usuarioIdIgnorado };
    }

    const existe = await Usuario.findOne(filtro);

    if (!existe) {
      return nombreUsuarioFinal;
    }

    contador++;
    nombreUsuarioFinal = `${nombreUsuarioBase}.${contador}`;
  }
};

const armarUsuarioRespuesta = (usuario) => {
  return {
    id: usuario._id,
    nombre: usuario.nombre,
    nombreUsuario: usuario.nombreUsuario,
    email: usuario.email,
    edad: usuario.edad,
    ubicacionAproximada: usuario.ubicacionAproximada,
    bio: usuario.bio,
    instagram: usuario.instagram,
    fotoPerfil: usuario.fotoPerfil,
    intereses: usuario.intereses,
    emailVerificado: usuario.emailVerificado,
    esOrganizador: usuario.esOrganizador,
  };
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
      nombreUsuario,
      email,
      contrasenia,
      edad,
      ubicacionAproximada,
      bio,
      instagram,
      fotoPerfil,
      intereses,
      esOrganizador,
    } = req.body;

    if (!nombre || !email || !contrasenia) {
      return res.status(400).json({
        error: "Nombre, email y contraseña son obligatorios",
      });
    }

    const emailNormalizado = email.toLowerCase().trim();

    const usuarioExistentePorEmail = await Usuario.findOne({
      email: emailNormalizado,
    });

    if (usuarioExistentePorEmail) {
      return res.status(400).json({
        error: "Ya existe un usuario con ese email",
      });
    }

    let nombreUsuarioFinal;

    if (nombreUsuario) {
      nombreUsuarioFinal = normalizarNombreUsuario(nombreUsuario);

      if (!nombreUsuarioFinal) {
        return res.status(400).json({
          error:
            "El nombre de usuario solo puede tener letras, números, punto o guion bajo",
        });
      }

      const usuarioExistentePorNombre = await Usuario.findOne({
        nombreUsuario: nombreUsuarioFinal,
      });

      if (usuarioExistentePorNombre) {
        return res.status(400).json({
          error: "Ese nombre de usuario ya está en uso",
        });
      }
    } else {
      nombreUsuarioFinal = await generarNombreUsuarioUnico(nombre);
    }

    const codigo = generarCodigo();

    const nuevoUsuario = new Usuario({
      nombre,
      nombreUsuario: nombreUsuarioFinal,
      email: emailNormalizado,
      contrasenia,
      edad,
      ubicacionAproximada,
      bio,
      instagram,
      fotoPerfil,
      intereses,
      esOrganizador: esOrganizador || false,
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
      message:
        "Usuario registrado correctamente. Revisá tu email para verificar la cuenta.",
      usuario: armarUsuarioRespuesta(nuevoUsuario),
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
      email: email.toLowerCase().trim(),
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

    if (!usuario.nombreUsuario) {
      usuario.nombreUsuario = await generarNombreUsuarioUnico(usuario.nombre);
    }

    await usuario.save();

    return res.json({
      message: "Email verificado correctamente",
      usuario: armarUsuarioRespuesta(usuario),
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

    const usuario = await Usuario.findOne({
      email: email.toLowerCase().trim(),
    });

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

    if (!usuario.nombreUsuario) {
      usuario.nombreUsuario = await generarNombreUsuarioUnico(usuario.nombre);
      await usuario.save();
    }

    return res.json({
      message: "Login correcto",
      usuario: armarUsuarioRespuesta(usuario),
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

    const usuario = await Usuario.findOne({
      email: email.toLowerCase().trim(),
    });

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
      email: email.toLowerCase().trim(),
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

// PUT /api/usuarios/:id
router.put("/:id", async (req, res) => {
  try {
    const {
      nombre,
      nombreUsuario,
      edad,
      ubicacionAproximada,
      bio,
      instagram,
      fotoPerfil,
      intereses,
    } = req.body;

    const datosActualizados = {};

    if (nombre !== undefined) {
      datosActualizados.nombre = nombre;
    }

    if (nombreUsuario !== undefined) {
      const nombreUsuarioNormalizado = normalizarNombreUsuario(nombreUsuario);

      if (!nombreUsuarioNormalizado) {
        return res.status(400).json({
          error:
            "El nombre de usuario solo puede tener letras, números, punto o guion bajo",
        });
      }

      const usuarioConEseNombre = await Usuario.findOne({
        nombreUsuario: nombreUsuarioNormalizado,
        _id: { $ne: req.params.id },
      });

      if (usuarioConEseNombre) {
        return res.status(400).json({
          error: "Ese nombre de usuario ya está en uso",
        });
      }

      datosActualizados.nombreUsuario = nombreUsuarioNormalizado;
    }

    if (edad !== undefined) datosActualizados.edad = edad;

    if (ubicacionAproximada !== undefined) {
      datosActualizados.ubicacionAproximada = ubicacionAproximada;
    }

    if (bio !== undefined) datosActualizados.bio = bio;
    if (instagram !== undefined) datosActualizados.instagram = instagram;
    if (fotoPerfil !== undefined) datosActualizados.fotoPerfil = fotoPerfil;
    if (intereses !== undefined) datosActualizados.intereses = intereses;

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      datosActualizados,
      {
        new: true,
        runValidators: true,
      }
    ).select("-contrasenia");

    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    return res.json({
      message: "Perfil actualizado correctamente",
      usuario: armarUsuarioRespuesta(usuario),
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al actualizar perfil",
      detalle: error.message,
    });
  }
});

// PUT /api/usuarios/:id/organizador
router.put("/:id/organizador", async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      {
        esOrganizador: true,
      },
      {
        new: true,
      }
    ).select("-contrasenia");

    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    return res.json({
      message: "Usuario convertido en organizador correctamente",
      usuario,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al actualizar usuario",
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

    if (!usuario.nombreUsuario) {
      usuario.nombreUsuario = await generarNombreUsuarioUnico(usuario.nombre);
      await usuario.save();
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