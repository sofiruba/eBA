import { Usuario } from "./Usuario";

export type Publicacion = {
  _id: string;
  usuarioId: Usuario;
  eventoId: any;
  contenido: string;
  imagen?: string;
  createdAt: string;
};

export type Comentario = {
  _id: string;
  publicacionId: string;
  usuarioId: Usuario;
  comentarioPadreId?: string | { _id: string } | null;
  contenido: string;
  createdAt: string;
};