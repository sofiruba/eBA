import { API_URL } from "../config/api";
import { Ubicacion } from "../types/Evento";

export const obtenerImagen = (imagen?: string) => {
  if (!imagen || imagen.trim() === "") {
    return "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1000";
  }

  if (imagen.startsWith("http")) {
    return imagen;
  }

  return `${API_URL}${imagen}`;
};

export const formatearFecha = (fecha?: string) => {
  if (!fecha) return "Fecha a confirmar";

  const fechaDate = new Date(fecha);

  if (isNaN(fechaDate.getTime())) {
    return fecha;
  }

  return fechaDate.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatearFechaLarga = (fecha?: string) => {
  if (!fecha) return "Fecha a confirmar";

  const fechaDate = new Date(fecha);

  if (isNaN(fechaDate.getTime())) {
    return fecha;
  }

  return fechaDate.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const obtenerUbicacion = (ubicacion?: Ubicacion) => {
  if (!ubicacion) return "Ubicación a confirmar";

  if (ubicacion.barrio && ubicacion.ciudad) {
    return `${ubicacion.barrio}, ${ubicacion.ciudad}`;
  }

  if (ubicacion.ciudad) return ubicacion.ciudad;
  if (ubicacion.direccion) return ubicacion.direccion;

  return "Ubicación a confirmar";
};