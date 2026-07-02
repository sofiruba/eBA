import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../config/api";
import { Usuario } from "../types/Usuario";

// AsyncStorage guarda el usuario tal cual quedó en el último login. Si algo
// cambia del lado del servidor (por ejemplo: un manager te aprueba como
// organizador), ese cambio no llega solo al dato guardado en el celular.
// Esta función pide el usuario actualizado al backend y refresca el caché
// local, para que pantallas como el BottomNav o "Mis eventos" no laburen
// con datos viejos.
export const obtenerUsuarioActualizado = async (): Promise<Usuario | null> => {
  const usuarioGuardado = await AsyncStorage.getItem("usuario");

  if (!usuarioGuardado) return null;

  let usuarioLocal: Usuario;

  try {
    usuarioLocal = JSON.parse(usuarioGuardado);
  } catch (error) {
    return null;
  }

  const usuarioId = usuarioLocal.id || usuarioLocal._id;

  if (!usuarioId) return usuarioLocal;

  try {
    const response = await fetch(`${API_URL}/api/usuarios/${usuarioId}`);
    const data = await response.json();

    if (!response.ok || !data.usuario) return usuarioLocal;

    const usuarioActualizado: Usuario = {
      ...usuarioLocal,
      ...data.usuario,
      id: usuarioId,
    };

    await AsyncStorage.setItem("usuario", JSON.stringify(usuarioActualizado));

    return usuarioActualizado;
  } catch (error) {
    // Sin conexión o el server no respondió: seguimos con lo que había guardado.
    return usuarioLocal;
  }
};