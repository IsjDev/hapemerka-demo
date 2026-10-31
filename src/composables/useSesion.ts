import { readonly, ref } from 'vue'
import { authRepository } from '@/data'
import type { Usuario } from '@/domain/prenda'

// Estado compartido por toda la app. `null` = sin sesión.
const usuario = ref<Usuario | null>(null)

const cargada = authRepository
  .sesionActual()
  .then((u) => {
    usuario.value = u
  })
  .catch(() => {
    usuario.value = null
  })

/** Resuelve cuando se ha recuperado la sesión guardada (lo espera el router antes de navegar). */
export function esperarSesion(): Promise<void> {
  return cargada
}

export function useSesion() {
  /** Devuelve false si el nombre o la contraseña no son correctos. */
  async function iniciarSesion(nombre: string, password: string): Promise<boolean> {
    usuario.value = await authRepository.login(nombre, password)
    return usuario.value !== null
  }

  async function cerrarSesion() {
    await authRepository.logout()
    usuario.value = null
  }

  return { usuario: readonly(usuario), iniciarSesion, cerrarSesion }
}
