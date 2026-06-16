import { Usuario } from "./Usuario";
import { Evento } from "./Evento";

export type Publicacion = {
  _id: string;
  usuarioId?: Usuario | string | null;
  eventoId?: Evento | string | null;
  contenido: string;
  imagen?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Comentario = {
  _id: string;
  publicacionId: string;
  usuarioId?: Usuario | string | null;
  comentarioPadreId?: string | null;
  contenido: string;
  createdAt?: string;
  updatedAt?: string;
};