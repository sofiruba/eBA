export type Ubicacion = {
  ciudad?: string;
  barrio?: string;
  direccion?: string;
};

export type Evento = {
  _id: string;
  nombre: string;
  descripcion?: string;
  fecha?: string;
  ubicacion?: Ubicacion;
  categoria?: string;
  imagen?: string;
  organizador?: string;
  esPromocionado?: boolean;
};