import type { Usuario } from '@/domain/prenda'

/**
 * Autenticación. Con Supabase se implementará con `supabase.auth`
 * (signInWithPassword / signOut / getSession).
 */
export interface AuthRepository {
  /** Devuelve el usuario si las credenciales son correctas, o null si no. */
  login(nombre: string, password: string): Promise<Usuario | null>
  logout(): Promise<void>
  /** Sesión guardada, o null si no hay o ya no es válida (p. ej. la cuenta se borró). */
  sesionActual(): Promise<Usuario | null>
}
