const express = require("express");
const mongoose = require("mongoose");
const Usuario = require("../models/Usuario");
const enviarEmail = require("../utils/email");
const passport = require("../utils/passport");

const router = express.Router();

const safeRequire = (ruta) => {
  try {
    return require(ruta);
  } catch (error) {
    console.log(`Modelo no disponible ${ruta}:`, error.message);
    return null;
  }
};

const Asistencia = safeRequire("../models/Asistencia");
const SolicitudConexion = safeRequire("../models/SolicitudConexion");
const Conexion = safeRequire("../models/Conexion");
const Favorito = safeRequire("../models/Favorito");
const Reporte = safeRequire("../models/Reporte");
const Notificacion = safeRequire("../models/Notificacion");
const LogActividad = safeRequire("../models/LogActividad");
const Bloqueo = safeRequire("../models/Bloqueo");
const Chat = safeRequire("../models/Chat");
const Mensaje = safeRequire("../models/Mensaje");
const Publicacion = safeRequire("../models/Publicacion");
const Comentario = safeRequire("../models/Comentario");

const generarCodigo = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const FOTO_PERFIL_MAX_LENGTH = 750000;
const FOTO_PERFIL_MINI_MAX_LENGTH = 180000;

const normalizarNombreUsuario = (valor) => {
  if (!valor) return "";

  return valor
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/^@+/, "")
    .replace(/[\s-]+/g, ".")
    .replace(/[^a-z0-9._]+/g, ".")
    .replace(/[._]{2,}/g, ".")
    .replace(/^[._]+|[._]+$/g, "");
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

const generarSugerenciasNombreUsuario = async (base, usuarioIdIgnorado = null) => {
  const baseNormalizada = normalizarNombreUsuario(base) || `usuario${Date.now()}`;
  const sugerencias = [];
  let contador = 1;

  while (sugerencias.length < 4 && contador < 100) {
    const candidato =
      contador === 1
        ? `${baseNormalizada}.${Math.floor(10 + Math.random() * 90)}`
        : `${baseNormalizada}.${contador}`;
    const filtro = { nombreUsuario: candidato };

    if (usuarioIdIgnorado) {
      filtro._id = { $ne: usuarioIdIgnorado };
    }

    const existe = await Usuario.findOne(filtro);

    if (!existe && !sugerencias.includes(candidato)) {
      sugerencias.push(candidato);
    }

    contador += 1;
  }

  return sugerencias;
};

const armarUsuarioRespuesta = (usuario, opciones = {}) => {
  const { incluirFotoPerfil = true } = opciones;

  return {
    id: usuario._id,
    nombre: usuario.nombre,
    nombreUsuario: usuario.nombreUsuario,
    email: usuario.email,
    edad: usuario.edad,
    ubicacionAproximada: usuario.ubicacionAproximada,
    bio: usuario.bio,
    instagram: usuario.instagram,
    fotoPerfil: incluirFotoPerfil
      ? usuario.fotoPerfilMini || usuario.fotoPerfil || ""
      : "",
    fotoPerfilMini: usuario.fotoPerfilMini || "",
    intereses: usuario.intereses,
    emailVerificado: usuario.emailVerificado,
    esOrganizador: usuario.esOrganizador,
  };
};

const esErrorNombreUsuarioDuplicado = (error) =>
  error?.code === 11000 && error?.keyPattern?.nombreUsuario;

const eliminarSiExiste = async (Modelo, filtro) => {
  if (!Modelo) {
    return { deletedCount: 0 };
  }

  return await Modelo.deleteMany(filtro);
};

const crearFiltroPorCampos = (campos, ids) => {
  return {
    $or: campos.map((campo) => ({
      [campo]: { $in: ids },
    })),
  };
};

/* =========================
   GOOGLE AUTH
========================= */

// GET /api/usuarios/auth/google
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// GET /api/usuarios/nombre-usuario/disponible?nombreUsuario=...
router.get("/nombre-usuario/disponible", async (req, res) => {
  try {
    const { nombreUsuario, usuarioId } = req.query;
    const nombreUsuarioNormalizado = normalizarNombreUsuario(String(nombreUsuario || ""));

    if (!nombreUsuarioNormalizado) {
      return res.status(400).json({
        disponible: false,
        error: "Escribí al menos una palabra para tu nombre de usuario",
      });
    }

    const filtro = { nombreUsuario: nombreUsuarioNormalizado };

    if (usuarioId) {
      filtro._id = { $ne: usuarioId };
    }

    const usuarioExistente = await Usuario.findOne(filtro);
    const disponible = !usuarioExistente;

    return res.json({
      nombreUsuario: nombreUsuarioNormalizado,
      disponible,
      sugerencias: disponible
        ? []
        : await generarSugerenciasNombreUsuario(nombreUsuarioNormalizado, usuarioId),
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al verificar nombre de usuario",
      detalle: error.message,
    });
  }
});

// GET /api/usuarios/auth/google/callback
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "eba://auth?error=true",
    session: false,
  }),
  async (req, res) => {
    try {
      const usuario = req.user;

      if (!usuario.nombreUsuario) {
        usuario.nombreUsuario = await generarNombreUsuarioUnico(usuario.nombre);
        await usuario.save();
      }

      return res.redirect(`eba://auth?usuarioId=${usuario._id}`);
    } catch (error) {
      return res.redirect("eba://auth?error=true");
    }
  }
);

// POST /api/usuarios/auth/google/token
router.post("/auth/google/token", async (req, res) => {
  try {
    const { token } = req.body;

    console.log("Login con Google recibido");

    if (!token) {
      return res.status(400).json({
        error: "Token vacío",
      });
    }

    const googleRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const perfil = await googleRes.json();

    if (!googleRes.ok || !perfil.email) {
      return res.status(401).json({
        error: "Token inválido",
        detalle: perfil,
      });
    }

    const emailGoogle = perfil.email.toLowerCase().trim();

    let usuario = await Usuario.findOne({
      $or: [{ googleId: perfil.sub }, { email: emailGoogle }],
    });

    let esNuevo = false;

    if (usuario) {
      if (!usuario.googleId) {
        usuario.googleId = perfil.sub;
      }

      usuario.emailVerificado = true;

      if (!usuario.nombreUsuario) {
        usuario.nombreUsuario = await generarNombreUsuarioUnico(
          usuario.nombre || perfil.name || emailGoogle.split("@")[0],
          usuario._id
        );
      }

      if (usuario.fotoPerfil?.includes("googleusercontent.com")) {
        usuario.fotoPerfil = "";
      }

      if (!usuario.contrasenia) {
        usuario.contrasenia = `google-${perfil.sub}-${Date.now()}`;
      }

      await usuario.save();
    } else {
      esNuevo = true;

      const nombreGoogle = perfil.name || emailGoogle.split("@")[0];
      const nombreUsuarioFinal = await generarNombreUsuarioUnico(nombreGoogle);

      usuario = new Usuario({
        googleId: perfil.sub,
        nombre: nombreGoogle,
        nombreUsuario: nombreUsuarioFinal,
        email: emailGoogle,
        contrasenia: `google-${perfil.sub}-${Date.now()}`,
        fotoPerfil: "",
        emailVerificado: true,
        esOrganizador: false,
        intereses: [],
      });

      await usuario.save();
    }

    return res.json({
      message: "Login con Google correcto",
      usuario: armarUsuarioRespuesta(usuario),
      esNuevo,
    });
  } catch (error) {
    console.error("Error Google token:", error);

    return res.status(500).json({
      error: "Error al iniciar sesión con Google",
      detalle: error.message,
    });
  }
});

/* =========================
   USUARIOS
========================= */

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
      fotoPerfilMini,
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
          error: "Escribí al menos una palabra para tu nombre de usuario",
        });
      }

      const usuarioExistentePorNombre = await Usuario.findOne({
        nombreUsuario: nombreUsuarioFinal,
      });

      if (usuarioExistentePorNombre) {
        return res.status(400).json({
          error: "Ese nombre de usuario ya está en uso",
          sugerencias: await generarSugerenciasNombreUsuario(nombreUsuarioFinal),
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
      fotoPerfilMini,
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
    if (esErrorNombreUsuarioDuplicado(error)) {
      return res.status(400).json({
        error: "Ese nombre de usuario ya está en uso",
        sugerencias: await generarSugerenciasNombreUsuario(req.body.nombreUsuario),
      });
    }

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
    }).select("-fotoPerfil");

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

// POST /api/usuarios/reenviar-codigo-verificacion
router.post("/reenviar-codigo-verificacion", async (req, res) => {
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

    if (usuario.emailVerificado) {
      return res.status(400).json({
        error: "Este email ya está verificado",
      });
    }

    if (!usuario.nombreUsuario) {
      usuario.nombreUsuario = await generarNombreUsuarioUnico(usuario.nombre);
    }

    const codigo = generarCodigo();

    usuario.codigoVerificacion = codigo;
    usuario.codigoVerificacionExpira = new Date(Date.now() + 15 * 60 * 1000);

    await usuario.save();

    console.log("Nuevo código de verificación generado:", codigo);

    await enviarEmail({
      para: usuario.email,
      asunto: "Nuevo código de verificación - eBA",
      texto: `Hola ${usuario.nombre}, tu nuevo código de verificación para eBA es: ${codigo}. Este código vence en 15 minutos.`,
    });

    return res.json({
      message: "Código reenviado correctamente. Revisá tu email.",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al reenviar código de verificación",
      detalle: error.message,
    });
  }
});

// GET /api/usuarios/test-email/enviar
router.get("/test-email/enviar", async (req, res) => {
  try {
    await enviarEmail({
      para: process.env.EMAIL_USER,
      asunto: "Test email eBA",
      texto: "Si llegó este mail, Nodemailer funciona correctamente.",
    });

    return res.json({
      message: "Email de prueba enviado correctamente",
    });
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo enviar el email de prueba",
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
      fotoPerfilMini,
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
    if (fotoPerfil !== undefined) {
      if (
        typeof fotoPerfilMini === "string" &&
        fotoPerfilMini.startsWith("data:image") &&
        fotoPerfilMini.length > FOTO_PERFIL_MINI_MAX_LENGTH
      ) {
        return res.status(413).json({
          error: "La foto de perfil es demasiado grande. Probá con otra imagen.",
        });
      }

      if (
        typeof fotoPerfil === "string" &&
        fotoPerfil.startsWith("data:image") &&
        fotoPerfil.length > FOTO_PERFIL_MAX_LENGTH
      ) {
        if (!fotoPerfilMini) {
          return res.status(413).json({
            error: "La foto de perfil es demasiado grande. Probá con otra imagen.",
          });
        }

        datosActualizados.fotoPerfil = fotoPerfilMini;
        datosActualizados.fotoPerfilMini = fotoPerfilMini;
      } else {
        datosActualizados.fotoPerfil = fotoPerfil;
        datosActualizados.fotoPerfilMini = fotoPerfilMini || fotoPerfil;
      }
    } else if (fotoPerfilMini !== undefined) {
      datosActualizados.fotoPerfilMini = fotoPerfilMini;
    }
    if (intereses !== undefined) datosActualizados.intereses = intereses;

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      datosActualizados,
      {
        returnDocument: "after",
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
    if (esErrorNombreUsuarioDuplicado(error)) {
      return res.status(400).json({
        error: "Ese nombre de usuario ya está en uso",
      });
    }

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
        returnDocument: "after",
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

// DELETE /api/usuarios/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findById(id);

    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    const ids = [id];

    if (mongoose.Types.ObjectId.isValid(id)) {
      ids.push(new mongoose.Types.ObjectId(id));
    }

    const asistenciasEliminadas = await eliminarSiExiste(
      Asistencia,
      crearFiltroPorCampos(
        [
          "usuarioId",
          "usuario",
          "userId",
          "usuarioAsistenteId",
          "asistenteId",
          "interesadoId",
          "participanteId",
          "usuarioInteresadoId",
          "usuario._id",
          "usuario.id",
        ],
        ids
      )
    );

    const favoritosEliminados = await eliminarSiExiste(
      Favorito,
      crearFiltroPorCampos(
        ["usuarioId", "usuario", "userId", "usuario._id", "usuario.id"],
        ids
      )
    );

    const solicitudesEliminadas = await eliminarSiExiste(
      SolicitudConexion,
      crearFiltroPorCampos(
        [
          "emisorId",
          "receptorId",
          "emisor",
          "receptor",
          "solicitanteId",
          "solicitadoId",
          "solicitante",
          "solicitado",
          "usuarioEmisorId",
          "usuarioReceptorId",
          "usuarioSolicitanteId",
          "usuarioSolicitadoId",
          "usuarioOrigenId",
          "usuarioDestinoId",
          "deUsuarioId",
          "paraUsuarioId",
          "desdeUsuarioId",
          "haciaUsuarioId",
          "origenId",
          "destinoId",
          "from",
          "to",
          "fromUser",
          "toUser",
        ],
        ids
      )
    );

    const conexionesEliminadas = await eliminarSiExiste(
      Conexion,
      crearFiltroPorCampos(
        [
          "usuarioAId",
          "usuarioBId",
          "usuarioA",
          "usuarioB",
          "usuario1Id",
          "usuario2Id",
          "usuario1",
          "usuario2",
          "usuarioId1",
          "usuarioId2",
          "usuarioUnoId",
          "usuarioDosId",
          "usuarios",
          "participantes",
        ],
        ids
      )
    );

    const notificacionesEliminadas = await eliminarSiExiste(
      Notificacion,
      crearFiltroPorCampos(
        [
          "usuarioId",
          "usuario",
          "emisorId",
          "receptorId",
          "emisor",
          "receptor",
          "usuarioDestinoId",
          "usuarioOrigenId",
          "destinatarioId",
          "remitenteId",
          "destinatario",
          "remitente",
        ],
        ids
      )
    );

    const reportesEliminados = await eliminarSiExiste(
      Reporte,
      crearFiltroPorCampos(
        [
          "usuarioId",
          "usuario",
          "reportanteId",
          "reportadoId",
          "reportante",
          "reportado",
          "usuarioReportadoId",
          "usuarioReportanteId",
        ],
        ids
      )
    );

    const logsEliminados = await eliminarSiExiste(
      LogActividad,
      crearFiltroPorCampos(["usuarioId", "usuario", "userId"], ids)
    );

    const bloqueosEliminados = await eliminarSiExiste(
      Bloqueo,
      crearFiltroPorCampos(
        [
          "bloqueadorId",
          "bloqueadoId",
          "bloqueador",
          "bloqueado",
          "usuarioBloqueadorId",
          "usuarioBloqueadoId",
          "usuarioId",
        ],
        ids
      )
    );

    const chatsEliminados = await eliminarSiExiste(
      Chat,
      crearFiltroPorCampos(
        [
          "participantes",
          "usuarios",
          "usuarioAId",
          "usuarioBId",
          "usuarioA",
          "usuarioB",
        ],
        ids
      )
    );

    const mensajesEliminados = await eliminarSiExiste(
      Mensaje,
      crearFiltroPorCampos(
        [
          "usuarioId",
          "usuario",
          "emisorId",
          "receptorId",
          "emisor",
          "receptor",
          "remitenteId",
          "destinatarioId",
          "remitente",
          "destinatario",
          "autorId",
          "autor",
        ],
        ids
      )
    );

    await Usuario.findByIdAndDelete(id);

    return res.json({
      message: "Usuario eliminado correctamente",
      aclaracion:
        "Se eliminaron relaciones del usuario. Las publicaciones y comentarios quedan como historial para mostrarse como Usuario eliminado.",
      detalle: {
        asistenciasEliminadas: asistenciasEliminadas.deletedCount,
        favoritosEliminados: favoritosEliminados.deletedCount,
        solicitudesEliminadas: solicitudesEliminadas.deletedCount,
        conexionesEliminadas: conexionesEliminadas.deletedCount,
        notificacionesEliminadas: notificacionesEliminadas.deletedCount,
        reportesEliminados: reportesEliminados.deletedCount,
        logsEliminados: logsEliminados.deletedCount,
        bloqueosEliminados: bloqueosEliminados.deletedCount,
        chatsEliminados: chatsEliminados.deletedCount,
        mensajesEliminados: mensajesEliminados.deletedCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al eliminar usuario",
      detalle: error.message,
    });
  }
});

// GET /api/usuarios/perfil-resumen/:usuarioId
router.get("/perfil-resumen/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const usuario = await Usuario.findById(usuarioId)
      .select(
        "nombre email edad ubicacionAproximada bio instagram fotoPerfilMini intereses emailVerificado esOrganizador nombreUsuario createdAt updatedAt"
      )
      .lean();

    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    const [asistencias, favoritos, publicaciones, bloqueos] =
      await Promise.all([
        Asistencia
          ? Asistencia.find({ usuarioId })
              .populate(
                "eventoId",
                "nombre descripcion fecha categoria imagen ubicacion organizador esPromocionado"
              )
              .sort({ updatedAt: -1 })
              .limit(10)
              .lean()
          : [],
        Favorito
          ? Favorito.find({ usuarioId })
              .populate(
                "eventoId",
                "nombre descripcion fecha categoria imagen ubicacion organizador esPromocionado"
              )
              .sort({ updatedAt: -1 })
              .limit(10)
              .lean()
          : [],
        Publicacion
          ? Publicacion.find({ usuarioId })
              .populate("usuarioId", "nombre nombreUsuario email fotoPerfilMini intereses bio")
              .populate("eventoId", "nombre fecha categoria imagen ubicacion organizador")
              .sort({ createdAt: -1 })
              .limit(10)
              .lean()
          : [],
        Bloqueo
          ? Bloqueo.find({ bloqueadorId: usuarioId })
              .populate("bloqueadoId", "nombre email nombreUsuario fotoPerfilMini")
              .sort({ updatedAt: -1 })
              .lean()
          : [],
      ]);

    let publicacionesConConteo = publicaciones;

    if (Comentario && publicaciones.length > 0) {
      const publicacionesIds = publicaciones.map((publicacion) => publicacion._id);
      const comentariosPorPublicacion = await Comentario.aggregate([
        {
          $match: {
            publicacionId: { $in: publicacionesIds },
          },
        },
        {
          $group: {
            _id: "$publicacionId",
            total: { $sum: 1 },
          },
        },
      ]);

      const conteos = new Map(
        comentariosPorPublicacion.map((comentario) => [
          String(comentario._id),
          comentario.total,
        ])
      );

      publicacionesConConteo = publicaciones.map((publicacion) => ({
        ...publicacion,
        comentariosCount: conteos.get(String(publicacion._id)) || 0,
      }));
    }

    return res.json({
      message: "Resumen de perfil obtenido correctamente",
      usuario,
      asistencias,
      favoritos,
      publicaciones: publicacionesConConteo,
      bloqueos,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al obtener resumen de perfil",
      detalle: error.message,
    });
  }
});

// GET /api/usuarios/:id
router.get("/:id", async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select(
      "-contrasenia -fotoPerfil"
    );

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
      usuario: armarUsuarioRespuesta(usuario),
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al obtener usuario",
      detalle: error.message,
    });
  }
});

module.exports = router;
