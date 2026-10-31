// Modelo de dominio: secciones, categorías, estados y medidas de las prendas.

export const SECCIONES = ['hombre', 'mujer', 'nino', 'nina'] as const
export type Seccion = (typeof SECCIONES)[number]

export const SECCION_LABEL: Record<Seccion, string> = {
  hombre: 'Hombre',
  mujer: 'Mujer',
  nino: 'Niño',
  nina: 'Niña',
}

export const ESTADOS = ['Casi nuevo', 'Bueno', 'Regular'] as const
export type Estado = (typeof ESTADOS)[number]

export const TALLAS_CASCO = ['S', 'M', 'L', 'XL'] as const
export type TallaCasco = (typeof TALLAS_CASCO)[number]

/** Qué medidas se piden según la categoría. */
export type TipoMedida = 'anchoLargo' | 'largo' | 'numero' | 'talla'

export const CATEGORIAS = [
  'tunica',
  'coraza',
  'pechera',
  'munequeras',
  'escudo',
  'armamento',
  'cinturon',
  'botas',
  'cascos',
] as const
export type Categoria = (typeof CATEGORIAS)[number]

export const CATEGORIA_INFO: Record<Categoria, { label: string; medida: TipoMedida }> = {
  tunica: { label: 'Túnica', medida: 'anchoLargo' },
  coraza: { label: 'Coraza', medida: 'anchoLargo' },
  pechera: { label: 'Pechera', medida: 'anchoLargo' },
  munequeras: { label: 'Muñequeras', medida: 'anchoLargo' },
  escudo: { label: 'Escudo', medida: 'anchoLargo' },
  armamento: { label: 'Armamento', medida: 'largo' },
  cinturon: { label: 'Cinturón', medida: 'largo' },
  botas: { label: 'Botas', medida: 'numero' },
  cascos: { label: 'Cascos', medida: 'talla' },
}

/** Medidas en cm, salvo `numero` (de calzado) y `talla`. */
export type Medidas =
  | { tipo: 'anchoLargo'; ancho: number; largo: number }
  | { tipo: 'largo'; largo: number }
  | { tipo: 'numero'; numero: number }
  | { tipo: 'talla'; talla: TallaCasco }

export interface Prenda {
  id: string
  seccion: Seccion
  categoria: Categoria
  estado: Estado
  /** Nombre de la persona con la que hay que hablar. */
  contacto: string
  medidas: Medidas
  comentario?: string
  /** Id del usuario que la publicó. */
  publicadaPor: string
  /** Fecha ISO 8601. */
  creadaEn: string
}

/** Usuario con la sesión iniciada. */
export interface Usuario {
  id: string
  nombre: string
  esAdmin: boolean
}

/** Solo pueden borrar una prenda quien la publicó y el administrador principal. */
export function puedeBorrar(prenda: Prenda, usuario: Usuario): boolean {
  return usuario.esAdmin || prenda.publicadaPor === usuario.id
}

export type NuevaPrenda = Omit<Prenda, 'id' | 'creadaEn'>

export function isSeccion(value: unknown): value is Seccion {
  return (SECCIONES as readonly unknown[]).includes(value)
}

export function isCategoria(value: unknown): value is Categoria {
  return (CATEGORIAS as readonly unknown[]).includes(value)
}

export function formatMedidas(medidas: Medidas): string {
  switch (medidas.tipo) {
    case 'anchoLargo':
      return `Ancho ${medidas.ancho} cm · Largo ${medidas.largo} cm`
    case 'largo':
      return `Largo ${medidas.largo} cm`
    case 'numero':
      return `Nº ${medidas.numero}`
    case 'talla':
      return `Talla ${medidas.talla}`
  }
}

// --- Orden del listado ---

/** Campos por los que se puede ordenar; las medidas disponibles dependen de la categoría. */
export type CampoOrden = 'fecha' | 'estado' | 'ancho' | 'largo' | 'numero' | 'talla'
export type DireccionOrden = 'asc' | 'desc'

export interface Orden {
  campo: CampoOrden
  direccion: DireccionOrden
}

export const ORDEN_POR_DEFECTO: Orden = { campo: 'fecha', direccion: 'desc' }

const CAMPOS_MEDIDA: Record<TipoMedida, CampoOrden[]> = {
  anchoLargo: ['ancho', 'largo'],
  largo: ['largo'],
  numero: ['numero'],
  talla: ['talla'],
}

/**
 * Campos de orden disponibles. Sin categoría se mezclan tipos de medida distintos,
 * así que solo se ofrece ordenar por fecha y estado.
 */
export function camposOrden(categoria: Categoria | null): CampoOrden[] {
  const medidas = categoria ? CAMPOS_MEDIDA[CATEGORIA_INFO[categoria].medida] : []
  return [...medidas, 'fecha', 'estado']
}

const CAMPO_LABEL: Record<CampoOrden, string> = {
  fecha: 'Fecha',
  estado: 'Estado',
  ancho: 'Ancho',
  largo: 'Largo',
  numero: 'Número',
  talla: 'Talla',
}

export function ordenLabel({ campo, direccion }: Orden): string {
  if (campo === 'fecha') return direccion === 'desc' ? 'Más recientes' : 'Más antiguas'
  if (campo === 'estado') return direccion === 'asc' ? 'Mejor estado primero' : 'Peor estado primero'
  return `${CAMPO_LABEL[campo]}: ${direccion === 'asc' ? 'de menor a mayor' : 'de mayor a menor'}`
}

/** Opciones de orden para el selector (todas las combinaciones campo/dirección). */
export function opcionesOrden(categoria: Categoria | null): Orden[] {
  return camposOrden(categoria).flatMap((campo): Orden[] => {
    // En fecha se muestra primero «más recientes»; en el resto, de menor a mayor.
    const direcciones: DireccionOrden[] = campo === 'fecha' ? ['desc', 'asc'] : ['asc', 'desc']
    return direcciones.map((direccion) => ({ campo, direccion }))
  })
}

/** Formato en la URL: `?orden=largo-asc`. */
export function serializarOrden({ campo, direccion }: Orden): string {
  return `${campo}-${direccion}`
}

/** Devuelve el orden por defecto si el valor no es válido para la categoría. */
export function parsearOrden(valor: unknown, categoria: Categoria | null): Orden {
  if (typeof valor !== 'string') return ORDEN_POR_DEFECTO
  const [campo, direccion] = valor.split('-')
  const valido =
    (direccion === 'asc' || direccion === 'desc') &&
    (camposOrden(categoria) as string[]).includes(campo ?? '')
  return valido ? { campo: campo as CampoOrden, direccion } : ORDEN_POR_DEFECTO
}

function valorOrden(prenda: Prenda, campo: CampoOrden): number | string | undefined {
  const m = prenda.medidas
  switch (campo) {
    case 'fecha':
      return prenda.creadaEn
    case 'estado':
      return ESTADOS.indexOf(prenda.estado)
    case 'ancho':
      return m.tipo === 'anchoLargo' ? m.ancho : undefined
    case 'largo':
      return m.tipo === 'anchoLargo' || m.tipo === 'largo' ? m.largo : undefined
    case 'numero':
      return m.tipo === 'numero' ? m.numero : undefined
    case 'talla':
      return m.tipo === 'talla' ? TALLAS_CASCO.indexOf(m.talla) : undefined
  }
}

/**
 * Devuelve una copia ordenada. Las prendas sin el valor pedido van al final y
 * los empates se resuelven por fecha (más recientes primero).
 */
export function ordenarPrendas(prendas: readonly Prenda[], orden: Orden): Prenda[] {
  const signo = orden.direccion === 'asc' ? 1 : -1
  return [...prendas].sort((a, b) => {
    const va = valorOrden(a, orden.campo)
    const vb = valorOrden(b, orden.campo)
    if (va === undefined || vb === undefined) {
      if (va !== vb) return va === undefined ? 1 : -1
    } else if (va !== vb) {
      return (va < vb ? -1 : 1) * signo
    }
    return b.creadaEn.localeCompare(a.creadaEn)
  })
}
