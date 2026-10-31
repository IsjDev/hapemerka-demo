import { normalizarNombre } from '@/domain/usuario'

/*
 * El administrador principal del demo no es una cuenta guardada:
 * sus credenciales vienen de VITE_ADMIN_USUARIO / VITE_ADMIN_PASSWORD (.env.local).
 */

export const ADMIN_ID = 'admin'

export function esNombreAdmin(nombre: string): boolean {
  const admin = import.meta.env.VITE_ADMIN_USUARIO
  return !!admin && normalizarNombre(nombre) === normalizarNombre(admin)
}
