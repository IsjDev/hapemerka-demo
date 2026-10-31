import type { Categoria, NuevaPrenda, Prenda, Seccion } from '@/domain/prenda'

export interface FiltroPrendas {
  seccion?: Seccion
  categoria?: Categoria
}

/**
 * Contrato de acceso a datos. Los componentes solo dependen de esta interfaz,
 * así que cambiar localStorage por Supabase consiste en añadir otra implementación.
 * Los métodos son asíncronos aunque localStorage no lo sea, para que el cambio no afecte a quien los llama.
 */
export interface PrendasRepository {
  list(filtro?: FiltroPrendas): Promise<Prenda[]>
  create(prenda: NuevaPrenda): Promise<Prenda>
  /** Los permisos se comprueban con `puedeBorrar` antes de llamar; con Supabase también deberán imponerse en el servidor (RLS). */
  remove(id: string): Promise<void>
}
