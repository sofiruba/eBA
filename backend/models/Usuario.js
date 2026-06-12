const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    contrasenia: {
      type: String,
      required: true,
    },
    edad: {
      type: Number,
    },
    ubicacionAproximada: {
      type: Object,
    },
    bio: {
      type: String,
    },
    instagram: {
      type: String,
    },
    fotoPerfil: {
      type: String,
    },
    intereses: {
      type: [String],
      default: [],
    },
    emailVerificado: {
      type: Boolean,
      default: false,
    },
    codigoVerificacion: {
      type: String,
    },
    codigoVerificacionExpira: {
      type: Date,
    },
    codigoResetPassword: {
      type: String,
    },
    codigoResetPasswordExpira: {
      type: Date,
    },
    esOrganizador: {
      type: Boolean,
      default: false,
    },
    nombreUsuario: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

usuarioSchema.pre("save", async function () {
  if (!this.isModified("contrasenia")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.contrasenia = await bcrypt.hash(this.contrasenia, salt);
});

usuarioSchema.methods.compararContrasenia = async function (contraseniaIngresada) {
  return await bcrypt.compare(contraseniaIngresada, this.contrasenia);
};

module.exports = mongoose.model("Usuario", usuarioSchema, "usuarios");