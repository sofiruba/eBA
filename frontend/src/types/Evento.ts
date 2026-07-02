export type Ubicacion = {
  ciudad?: string;
  barrio?: string;
  direccion?: string;
};

export type EstadoEvento = "pendiente" | "aprobado" | "rechazado";

export type Evento = {
  _id: string;
  nombre: string;
  descripcion?: string;
  fecha?: string;
  ubicacion?: Ubicacion;
  categoria?: string;
  imagen?: string;
  organizador?: string;
  organizadorId?: string;
  esPromocionado?: boolean;
  activo?: boolean;
  estado?: EstadoEvento;
  motivoRechazo?: string;
  createdAt?: string;
};