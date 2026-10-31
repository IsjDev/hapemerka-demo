import { normalizarNombre, type CuentaUsuario } from '@/domain/usuario'
import { NombreDuplicadoError, type UsuariosRepository } from './usuariosRepository'
import { esNombreAdmin } from './adminDemo'

const STORAGE_KEY = 'hapemerka:usuarios'

interface CuentaGuardada extends CuentaUsuario {
  salt: string
  passwordHash: string
}

function leer(): CuentaGuardada[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data: unknown = JSON.parse(raw)
    return Array.isArray(data) ? (data as CuentaGuardada[]) : []
  } catch {
    return []
  }
}

function guardar(cuentas: CuentaGuardada[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cuentas))
}

function aHex(buffer: ArrayBuffer | Uint8Array): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('')
}

// Solo para no guardar la contraseña en claro en el demo; Supabase Auth hará su propio hash.
async function hashPassword(password: string, salt: string): Promise<string> {
  const datos = new TextEncoder().encode(`${salt}:${password}`)
  return aHex(await crypto.subtle.digest('SHA-256', datos))
}

function publica({ id, nombre, creadaEn }: CuentaGuardada): CuentaUsuario {
  return { id, nombre, creadaEn }
}

// Usadas por localStorageAuthRepository: solo esta implementación conoce cómo se guardan las contraseñas.

export async function verificarCredenciales(
  nombre: string,
  password: string,
): Promise<CuentaUsuario | null> {
  const clave = normalizarNombre(nombre)
  const cuenta = leer().find((c) => normalizarNombre(c.nombre) === clave)
  if (!cuenta) return null
  const hash = await hashPassword(password, cuenta.salt)
  return hash === cuenta.passwordHash ? publica(cuenta) : null
}

export function buscarCuenta(id: string): CuentaUsuario | null {
  const cuenta = leer().find((c) => c.id === id)
  return cuenta ? publica(cuenta) : null
}

export function createLocalStorageUsuariosRepository(): UsuariosRepository {
  return {
    async list() {
      return leer()
        .map(publica)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    },

    async create({ nombre, password }) {
      const cuentas = leer()
      const clave = normalizarNombre(nombre)
      if (esNombreAdmin(nombre) || cuentas.some((c) => normalizarNombre(c.nombre) === clave)) {
        throw new NombreDuplicadoError(nombre)
      }

      const salt = aHex(crypto.getRandomValues(new Uint8Array(16)))
      const cuenta: CuentaGuardada = {
        id: crypto.randomUUID(),
        nombre: nombre.trim(),
        creadaEn: new Date().toISOString(),
        salt,
        passwordHash: await hashPassword(password, salt),
      }
      guardar([...cuentas, cuenta])
      return publica(cuenta)
    },

    async remove(id) {
      guardar(leer().filter((c) => c.id !== id))
    },
  }
}
