import { Evento } from "./Evento";
import { Usuario } from "./Usuario";

export type Asistencia = {
  _id: string;
  usuarioId: Usuario | string;
  eventoId: Evento;
  estado: string;
  createdAt?: string;
};