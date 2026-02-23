/**
 * Genera un código de recuperación único de 6 caracteres alfanuméricos
 * Formato: ABC123 (3 letras + 3 números para fácil lectura)
 */
export function generateRecoveryCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Sin I, O para evitar confusión con 1, 0
  const numbers = '0123456789';

  let code = '';

  // 3 letras
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // 3 números
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  return code;
}

/**
 * Formatea un código para mostrarlo de forma más legible
 * Ejemplo: ABC123 → ABC-123
 */
export function formatRecoveryCode(code: string): string {
  if (code.length === 6) {
    return `${code.slice(0, 3)}-${code.slice(3)}`;
  }
  return code;
}

/**
 * Normaliza un código introducido por el usuario
 * Elimina espacios, guiones y convierte a mayúsculas
 */
export function normalizeRecoveryCode(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}
