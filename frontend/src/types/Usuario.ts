export type Usuario = {
  _id?: string;
  id?: string;
  nombre: string;
  nombreUsuario?: string;
  email?: string;
  edad?: number;
  ubicacionAproximada?: string;
  bio?: string;
  instagram?: string;
  fotoPerfil?: string;
  intereses?: string[];
  emailVerificado?: boolean;
  esOrganizador?: boolean;
};