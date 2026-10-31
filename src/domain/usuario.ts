// Cuentas de usuario que da de alta el administrador. Serán las credenciales del futuro login.

export const MIN_PASSWORD = 6 // mínimo por defecto de Supabase Auth

/** Datos públicos de una cuenta: la contraseña nunca sale de la capa de datos. */
export interface CuentaUsuario {
  id: string
  nombre: string
  /** Fecha ISO 8601. */
  creadaEn: string
}

export interface NuevaCuenta {
  nombre: string
  password: string
}

/** Para comparar nombres sin distinguir mayúsculas, tildes ni espacios sobrantes. */
export function normalizarNombre(nombre: string): string {
  return nombre
    .trim()
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}
