import { createLocalStorageAuthRepository } from './localStorageAuthRepository'
import { sembrarDatosDemo } from './localStorageDemoSeed'
import { createLocalStoragePrendasRepository } from './localStoragePrendasRepository'
import { createLocalStorageUsuariosRepository } from './localStorageUsuariosRepository'
import type { AuthRepository } from './authRepository'
import type { PrendasRepository } from './prendasRepository'
import type { UsuariosRepository } from './usuariosRepository'

export type { AuthRepository } from './authRepository'
export type { FiltroPrendas, PrendasRepository } from './prendasRepository'
export { NombreDuplicadoError, type UsuariosRepository } from './usuariosRepository'

// Datos de ejemplo del demo; se siembran antes de que nadie lea los repositorios. Desaparece con Supabase.
sembrarDatosDemo()

// Único punto donde se elige el backend. Para migrar a Supabase, sustituir estas implementaciones.
export const authRepository: AuthRepository = createLocalStorageAuthRepository()
export const prendasRepository: PrendasRepository = createLocalStoragePrendasRepository()
export const usuariosRepository: UsuariosRepository = createLocalStorageUsuariosRepository()
