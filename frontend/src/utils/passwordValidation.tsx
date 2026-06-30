// Reglas de validación de contraseña usadas en registro y cambio de contraseña.
// Se valida solo en el frontend: si la contraseña no es válida, nunca llega a pedirse al backend.

export const CONTRASENIA_LONGITUD_MINIMA = 6;

// Ejemplo que se muestra como placeholder en los campos de contraseña.
export const CONTRASENIA_EJEMPLO = "Eba2026!";

const TIENE_LETRA = /[a-zA-Z]/;
const TIENE_CARACTER_ESPECIAL = /[^a-zA-Z0-9]/;

/**
 * Valida una contraseña según las reglas de eBA:
 * - Al menos 6 caracteres.
 * - Al menos una letra.
 * - Al menos un carácter especial (cualquier símbolo que no sea letra ni número, ej: -, =, ¡, !, @).
 *
 * Devuelve un mensaje de error explicando qué falta, o null si la contraseña es válida.
 */
export function validarContrasenia(contrasenia: string): string | null {
  if (!contrasenia.trim()) {
    return "Ingresá una contraseña.";
  }

  const tieneLongitud = contrasenia.length >= CONTRASENIA_LONGITUD_MINIMA;
  const tieneLetra = TIENE_LETRA.test(contrasenia);
  const tieneCaracterEspecial = TIENE_CARACTER_ESPECIAL.test(contrasenia);

  if (tieneLongitud && tieneLetra && tieneCaracterEspecial) {
    return null;
  }

  const faltantes: string[] = [];

  if (!tieneLongitud) {
    faltantes.push(`tener al menos ${CONTRASENIA_LONGITUD_MINIMA} caracteres`);
  }

  if (!tieneLetra) {
    faltantes.push("incluir al menos una letra");
  }

  if (!tieneCaracterEspecial) {
    faltantes.push("incluir al menos un carácter especial (por ejemplo: -, =, ¡, !, @)");
  }

  return `La contraseña debe ${faltantes.join(", ")}.`;
}