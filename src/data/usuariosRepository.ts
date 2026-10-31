import type { CuentaUsuario, NuevaCuenta } from '@/domain/usuario'

export class NombreDuplicadoError extends Error {
  constructor(nombre: string) {
    super(`Ya existe un usuario llamado "${nombre}".`)
    this.name = 'NombreDuplicadoError'
  }
}

/**
 * Gestión de cuentas por parte del administrador.
 * Con Supabase, `create` y `remove` necesitan la clave de servicio, así que tendrán que
 * pasar por una Edge Function; nunca deben llamar a la API de admin desde el navegador.
 */
export interface UsuariosRepository {
  list(): Promise<CuentaUsuario[]>
  /** Lanza `NombreDuplicadoError` si el nombre ya existe. */
  create(cuenta: NuevaCuenta): Promise<CuentaUsuario>
  remove(id: string): Promise<void>
}
