import type { Usuario } from '@/domain/prenda'
import { ADMIN_ID, esNombreAdmin } from './adminDemo'
import type { AuthRepository } from './authRepository'
import { buscarCuenta, verificarCredenciales } from './localStorageUsuariosRepository'

const SESION_KEY = 'hapemerka:sesion'

function leerSesion(): Usuario | null {
  try {
    const raw = localStorage.getItem(SESION_KEY)
    return raw ? (JSON.parse(raw) as Usuario) : null
  } catch {
    return null
  }
}

function guardarSesion(usuario: Usuario | null): void {
  try {
    if (usuario) localStorage.setItem(SESION_KEY, JSON.stringify(usuario))
    else localStorage.removeItem(SESION_KEY)
  } catch {
    // Sin localStorage la sesión solo dura hasta recargar.
  }
}

export function createLocalStorageAuthRepository(): AuthRepository {
  return {
    async login(nombre, password) {
      let usuario: Usuario | null = null

      if (esNombreAdmin(nombre)) {
        const passwordAdmin = import.meta.env.VITE_ADMIN_PASSWORD
        if (passwordAdmin && password === passwordAdmin) {
          usuario = { id: ADMIN_ID, nombre: import.meta.env.VITE_ADMIN_USUARIO ?? nombre, esAdmin: true }
        }
      } else {
        const cuenta = await verificarCredenciales(nombre, password)
        if (cuenta) usuario = { id: cuenta.id, nombre: cuenta.nombre, esAdmin: false }
      }

      guardarSesion(usuario)
      return usuario
    },

    async logout() {
      guardarSesion(null)
    },

    async sesionActual() {
      const sesion = leerSesion()
      if (!sesion) return null
      const valida = sesion.esAdmin ? sesion.id === ADMIN_ID : !!buscarCuenta(sesion.id)
      if (!valida) {
        guardarSesion(null)
        return null
      }
      return sesion
    },
  }
}
