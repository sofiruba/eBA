import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { EyeOff } from "lucide-react-native";

export default function RegisterScreen() {
  const params = useLocalSearchParams();

  let intereses: string[] = [];

  try {
    intereses = params.intereses
      ? JSON.parse(params.intereses as string)
      : [];
  } catch (error) {
    intereses = [];
  }

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [edad, setEdad] = useState("");
  const [ciudad, setCiudad] = useState("Buenos Aires");
  const [pais, setPais] = useState("Argentina");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState("");

  const handleRegister = () => {
    console.log("TOQUÉ CREAR CUENTA");

    if (intereses.length === 0) {
      console.log("No hay intereses");
      alert("Tenés que seleccionar al menos un interés.");
      return;
    }

    if (!nombre.trim()) {
      console.log("Falta nombre");
      alert("Ingresá tu nombre.");
      return;
    }

    if (!email.trim()) {
      console.log("Falta email");
      alert("Ingresá tu email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      console.log("Email inválido");
      alert("Ingresá un email válido.");
      return;
    }

    if (!contrasenia.trim()) {
      console.log("Falta contraseña");
      alert("Ingresá una contraseña.");
      return;
    }

    if (contrasenia.length < 6) {
      console.log("Contraseña corta");
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (!edad.trim()) {
      console.log("Falta edad");
      alert("Ingresá tu edad.");
      return;
    }

    const edadNumerica = Number(edad);

    if (isNaN(edadNumerica) || edadNumerica < 13 || edadNumerica > 100) {
      console.log("Edad inválida");
      alert("Ingresá una edad válida.");
      return;
    }

    if (!ciudad.trim()) {
      console.log("Falta ciudad");
      alert("Ingresá tu ciudad.");
      return;
    }

    if (!pais.trim()) {
      console.log("Falta país");
      alert("Ingresá tu país.");
      return;
    }

    if (!bio.trim()) {
      console.log("Falta bio");
      alert("Ingresá una breve bio.");
      return;
    }

    if (!instagram.trim()) {
      console.log("Falta Instagram");
      alert("Ingresá tu Instagram.");
      return;
    }

    if (!instagram.trim().startsWith("@")) {
      console.log("Instagram inválido");
      alert("El Instagram debe empezar con @.");
      return;
    }

    const nuevoUsuario = {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      edad: edadNumerica,
      ubicacionAproximada: {
        ciudad: ciudad.trim(),
        pais: pais.trim(),
      },
      bio: bio.trim(),
      instagram: instagram.trim(),
      fotoPerfil: fotoPerfil.trim() || "https://imageurl.com/profile.jpg",
      intereses,
      contrasenia,
    };

    console.log("Usuario a registrar:", nuevoUsuario);

    /*
      Cuando conectemos el backend real:

      fetch("http://localhost:3000/api/usuarios/registro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nuevoUsuario),
      });
    */

    alert("Usuario creado correctamente.");
    router.replace("/home" as any);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <Image
          source={{ uri: "https://i.imgur.com/Oi6Zc3K.png" }}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>
          Registrate <Text style={styles.dark}>a eBA</Text>
        </Text>

        <Text style={styles.subtitle}>
          Último paso para empezar a conectar.
        </Text>

        <View style={styles.selectedBox}>
          <Text style={styles.selectedTitle}>Intereses elegidos</Text>

          <Text style={styles.selectedText}>
            {intereses.length > 0
              ? intereses.join(", ")
              : "No seleccionaste intereses"}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/register-interests" as any)}
          >
            <Text style={styles.editInterests}>Editar intereses</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            placeholder="Natalia Favre"
            placeholderTextColor="#A8A5B3"
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="natalia@gmail.com"
            placeholderTextColor="#A8A5B3"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Contraseña</Text>

          <View style={styles.passwordBox}>
            <TextInput
              placeholder="Creá una contraseña"
              placeholderTextColor="#A8A5B3"
              secureTextEntry
              style={styles.passwordInput}
              value={contrasenia}
              onChangeText={setContrasenia}
            />
            <EyeOff size={18} color="#A8A5B3" />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Edad</Text>
          <TextInput
            placeholder="21"
            placeholderTextColor="#A8A5B3"
            style={styles.input}
            value={edad}
            onChangeText={setEdad}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.halfField]}>
            <Text style={styles.label}>Ciudad</Text>
            <TextInput
              placeholder="Buenos Aires"
              placeholderTextColor="#A8A5B3"
              style={styles.input}
              value={ciudad}
              onChangeText={setCiudad}
            />
          </View>

          <View style={[styles.field, styles.halfFieldLast]}>
            <Text style={styles.label}>País</Text>
            <TextInput
              placeholder="Argentina"
              placeholderTextColor="#A8A5B3"
              style={styles.input}
              value={pais}
              onChangeText={setPais}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            placeholder="Me gusta salir a recitales y eventos techno"
            placeholderTextColor="#A8A5B3"
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Instagram</Text>
          <TextInput
            placeholder="@natifavre"
            placeholderTextColor="#A8A5B3"
            style={styles.input}
            value={instagram}
            onChangeText={setInstagram}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Foto de perfil URL</Text>
          <TextInput
            placeholder="https://imageurl.com/profile.jpg"
            placeholderTextColor="#A8A5B3"
            style={styles.input}
            value={fotoPerfil}
            onChangeText={setFotoPerfil}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={handleRegister}
        >
          <Text style={styles.primaryButtonText}>Crear cuenta</Text>
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.smallText}>¿Ya tenés cuenta? </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/login" as any)}
          >
            <Text style={styles.loginLink}>Iniciá sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F5FF",
  },
  container: {
    paddingHorizontal: 34,
    paddingTop: 52,
    paddingBottom: 70,
  },
  logo: {
    width: 120,
    height: 80,
    alignSelf: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 27,
    fontWeight: "800",
    color: "#4DA7FF",
    textAlign: "center",
    marginBottom: 8,
  },
  dark: {
    color: "#332047",
  },
  subtitle: {
    fontSize: 13,
    color: "#8D8A99",
    textAlign: "center",
    marginBottom: 22,
  },
  selectedBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#E2DDF0",
  },
  selectedTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#332047",
    marginBottom: 5,
  },
  selectedText: {
    fontSize: 13,
    color: "#8D8A99",
    lineHeight: 19,
    marginBottom: 8,
  },
  editInterests: {
    color: "#7528F0",
    fontSize: 13,
    fontWeight: "800",
  },
  field: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2D2934",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8D5E2",
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#332047",
    backgroundColor: "#FAFAFF",
    outlineStyle: "none" as any,
  },
  passwordBox: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8D5E2",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFF",
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: "#332047",
    outlineStyle: "none" as any,
  },
  row: {
    flexDirection: "row",
    width: "100%",
  },
  halfField: {
    flex: 1,
    marginRight: 10,
  },
  halfFieldLast: {
    flex: 1,
    marginRight: 0,
  },
  bioInput: {
    height: 86,
    paddingTop: 14,
    textAlignVertical: "top",
  },
  primaryButton: {
    width: "100%",
    height: 54,
    borderRadius: 12,
    backgroundColor: "#7528F0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 18,
    zIndex: 20,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  smallText: {
    color: "#9A98A6",
    fontSize: 13,
  },
  loginLink: {
    color: "#7528F0",
    fontSize: 13,
    fontWeight: "800",
  },
});