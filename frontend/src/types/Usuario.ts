export type Usuario = {
  _id?: string;
  id?: string;
  nombre?: string;
  email?: string;
  edad?: number;
  intereses?: string[];
  fotoPerfil?: string;
  bio?: string;
  instagram?: string;
  ubicacionAproximada?: {
    ciudad?: string;
    pais?: string;
  };
};