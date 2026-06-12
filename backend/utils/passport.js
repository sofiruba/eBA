const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Usuario = require("../models/Usuario");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/usuarios/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Buscar si ya existe el usuario por googleId o email
        let usuario = await Usuario.findOne({
          $or: [
            { googleId: profile.id },
            { email: profile.emails[0].value }
          ]
        });

        if (usuario) {
          // Si existe pero se registró con email, vincular la cuenta de Google
          if (!usuario.googleId) {
            usuario.googleId = profile.id;
            usuario.emailVerificado = true; // Google ya verificó el email
            await usuario.save();
          }
          return done(null, usuario);
        }

        // Crear nuevo usuario con Google
        usuario = new Usuario({
          googleId: profile.id,
          nombre: profile.displayName,
          email: profile.emails[0].value,
          fotoPerfil: profile.photos[0]?.value,
          emailVerificado: true, // Google garantiza el email
          esOrganizador: false,
        });

        await usuario.save();
        return done(null, usuario);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serializar/deserializar para la sesión
passport.serializeUser((usuario, done) => {
  done(null, usuario._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const usuario = await Usuario.findById(id).select("-contrasenia");
    done(null, usuario);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;