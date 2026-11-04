import {
  COLORES,
  TALLAS_CASCO,
  tieneColor,
  type Categoria,
  type Estado,
  type Medidas,
  type Prenda,
  type Seccion,
} from '@/domain/prenda'
import { normalizarNombre } from '@/domain/usuario'
import { ADMIN_ID, esNombreAdmin } from './adminDemo'
import type { CuentaGuardada } from './localStorageUsuariosRepository'

/*
 * Datos de ejemplo del demo: cuentas de miembros y prendas publicadas por ellas,
 * para ver cómo interactúan (quién puede borrar qué, filtros, orden…).
 * Se siembran una sola vez por navegador (clave `hapemerka:demo`); si se borran
 * prendas o cuentas no vuelven a aparecer. Para regenerarlos, borrar esa clave
 * junto con `hapemerka:prendas` y `hapemerka:usuarios`. Se desactiva con VITE_DEMO_DATOS=false.
 *
 * Todas las cuentas de ejemplo tienen la contraseña `demo123`.
 */

const SEMBRADO_KEY = 'hapemerka:demo'
const PRENDAS_KEY = 'hapemerka:prendas'
const USUARIOS_KEY = 'hapemerka:usuarios'

const PASSWORD_DEMO = 'demo123'

// Cuenta de prueba que se muestra en el login; `null` si los datos de ejemplo están desactivados.
export const CUENTA_DEMO =
  import.meta.env.VITE_DEMO_DATOS === 'false' ? null : { nombre: 'Aníbal', password: PASSWORD_DEMO }

// Hash precalculado de `demo123` con este salt (mismo esquema que localStorageUsuariosRepository),
// para poder sembrar de forma síncrona antes de que se recupere la sesión.
const SALT_DEMO = '6861706564656d6f73656d696c6c6131'
const HASH_DEMO = '7c66c3410fcbd225b6f08212471720347296d64494e81d5ba52f3e8ce7441156'

const NOMBRES = [
  'Aníbal',
  'Asdrúbal',
  'Amílcar',
  'Escipión',
  'Lucía',
  'Marta',
  'Carmen',
  'Paco',
  'Pepe',
  'Toñi',
  'Josefa',
  'Ginés',
  'Fulgencio',
  'Encarna',
  'Andrés',
  'Rocío',
  'Javi',
  'Laura',
  'Sergio',
  'Nuria',
  'Diego',
  'Elena',
  'Raúl',
  'Inma',
]

// Personas de contacto que no tienen cuenta (familiares, el sastre de la tropa…).
const CONTACTOS_EXTRA = ['Mari Carmen', 'Juan el sastre', 'Chelo', 'Tía Pura', 'Manolo']

const COMENTARIOS: Record<Categoria | 'general', string[]> = {
  general: [
    'Se puede ver en el campamento cualquier tarde.',
    'Lo cambio por algo de talla más grande.',
    'Recogida en el barrio de la Concepción.',
    'Escribidme por el grupo de la tropa.',
    'Usado solo un año.',
    'Tiene algún roce pero se ve bien desfilando.',
  ],
  tunica: [
    'Lavada y planchada, lista para el desfile.',
    'Le falta el ribete del bajo, se cose en un rato.',
    'Tela de lino, fresquita para septiembre.',
    'Con bordado dorado en el cuello.',
  ],
  coraza: ['De cuero, con hebillas nuevas.', 'Una correa está algo gastada.'],
  pechera: ['Las placas están todas, ninguna suelta.', 'Pintada a mano.'],
  munequeras: ['Van por pareja.', 'De cuero repujado.'],
  escudo: ['Con el emblema de la tropa pintado.', 'Pesa poco, ideal para el desfile largo.'],
  armamento: ['Espada de madera, sin filo.', 'Lanza desmontable en dos piezas.', 'Incluye vaina.'],
  cinturon: ['Hebilla de latón.', 'Tiene agujeros de sobra para ajustarlo.'],
  botas: ['Sandalia romana de tiras.', 'Suela cambiada el año pasado.', 'Algo de desgaste en la punta.'],
  cascos: ['Con penacho rojo.', 'Le falta el acolchado interior.', 'Casco de legionario, metálico.'],
}

// Más túnicas que armas: es lo que más se intercambia.
const PESO_CATEGORIA: Record<Categoria, number> = {
  tunica: 6,
  coraza: 2,
  pechera: 2,
  munequeras: 2,
  escudo: 2,
  armamento: 3,
  cinturon: 3,
  botas: 3,
  cascos: 3,
}
const PESO_SECCION: Record<Seccion, number> = { hombre: 4, mujer: 3, nino: 2, nina: 2 }
const PESO_ESTADO: Record<Estado, number> = { 'Casi nuevo': 2, Bueno: 4, Regular: 2 }

const TOTAL_PRENDAS = 140

/** PRNG con semilla (mulberry32): los mismos datos en todos los navegadores. */
function crearAzar(semilla: number) {
  let a = semilla
  const siguiente = () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const entero = (min: number, max: number) => min + Math.floor(siguiente() * (max - min + 1))
  const elegir = <T>(lista: readonly T[]): T => lista[Math.floor(siguiente() * lista.length)] as T
  const ponderado = <K extends string>(pesos: Record<K, number>): K => {
    const entradas = Object.entries(pesos) as [K, number][]
    let r = siguiente() * entradas.reduce((s, [, p]) => s + p, 0)
    for (const [k, p] of entradas) {
      r -= p
      if (r < 0) return k
    }
    return entradas[0]![0]
  }
  return { siguiente, entero, elegir, ponderado }
}

type Azar = ReturnType<typeof crearAzar>

function medidasPara(categoria: Categoria, seccion: Seccion, azar: Azar): Medidas {
  const infantil = seccion === 'nino' || seccion === 'nina'
  const { entero } = azar
  const anchoLargo = (a: [number, number], l: [number, number]): Medidas => ({
    tipo: 'anchoLargo',
    ancho: entero(...a),
    largo: entero(...l),
  })

  switch (categoria) {
    case 'tunica':
      if (infantil) return anchoLargo([30, 45], [55, 90])
      return seccion === 'mujer' ? anchoLargo([42, 58], [100, 140]) : anchoLargo([50, 66], [90, 120])
    case 'coraza':
      return infantil ? anchoLargo([30, 40], [35, 45]) : anchoLargo([44, 60], [48, 66])
    case 'pechera':
      return infantil ? anchoLargo([26, 36], [25, 35]) : anchoLargo([38, 52], [35, 50])
    case 'munequeras':
      return infantil ? anchoLargo([6, 10], [10, 16]) : anchoLargo([8, 15], [15, 25])
    case 'escudo':
      return infantil ? anchoLargo([30, 45], [40, 60]) : anchoLargo([50, 80], [60, 110])
    case 'armamento':
      return { tipo: 'largo', largo: infantil ? entero(40, 90) : entero(60, 200) }
    case 'cinturon':
      return { tipo: 'largo', largo: infantil ? entero(55, 80) : entero(80, 130) }
    case 'botas': {
      const [min, max] = infantil ? [24, 36] : seccion === 'mujer' ? [35, 41] : [39, 46]
      return { tipo: 'numero', numero: entero(min, max) }
    }
    case 'cascos':
      return {
        tipo: 'talla',
        talla: infantil ? azar.elegir(TALLAS_CASCO.slice(0, 2)) : azar.elegir(TALLAS_CASCO.slice(1)),
      }
  }
}

function generarCuentas(existentes: CuentaGuardada[], ahora: number): CuentaGuardada[] {
  const usados = new Set(existentes.map((c) => normalizarNombre(c.nombre)))
  return NOMBRES.filter((n) => !esNombreAdmin(n) && !usados.has(normalizarNombre(n))).map(
    (nombre, i) => ({
      id: `demo-${normalizarNombre(nombre)}`,
      nombre,
      // Altas escalonadas en los últimos meses.
      creadaEn: new Date(ahora - (120 - i * 4) * 86_400_000).toISOString(),
      salt: SALT_DEMO,
      passwordHash: HASH_DEMO,
    }),
  )
}

function generarPrendas(cuentas: CuentaGuardada[], ahora: number): Prenda[] {
  const azar = crearAzar(2026)
  // Unos pocos miembros publican mucho y la mayoría poco, como en la realidad.
  const publicadores = [
    ...cuentas.flatMap((c, i) => Array<{ id: string; nombre: string }>(i < 5 ? 4 : 1).fill(c)),
    ...Array(3).fill({ id: ADMIN_ID, nombre: import.meta.env.VITE_ADMIN_USUARIO || 'admin' }),
  ]

  return Array.from({ length: TOTAL_PRENDAS }, (_, i): Prenda => {
    const seccion = azar.ponderado(PESO_SECCION)
    const categoria = azar.ponderado(PESO_CATEGORIA)
    const autor = azar.elegir(publicadores)
    const contacto = azar.siguiente() < 0.15 ? azar.elegir(CONTACTOS_EXTRA) : autor.nombre
    const comentarios = [...COMENTARIOS[categoria], ...COMENTARIOS.general]
    const hace = Math.floor(azar.siguiente() * 75 * 86_400_000)

    return {
      id: `demo-prenda-${String(i + 1).padStart(3, '0')}`,
      seccion,
      categoria,
      estado: azar.ponderado(PESO_ESTADO),
      contacto,
      medidas: medidasPara(categoria, seccion, azar),
      ...(tieneColor(categoria) ? { color: azar.elegir(COLORES) } : {}),
      ...(azar.siguiente() < 0.6 ? { comentario: azar.elegir(comentarios) } : {}),
      publicadaPor: autor.id,
      creadaEn: new Date(ahora - hace).toISOString(),
    }
  })
}

function leerLista<T>(key: string): T[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(data) ? (data as T[]) : []
  } catch {
    return []
  }
}

/** Añade los datos de ejemplo la primera vez; conserva lo que ya hubiera guardado. */
export function sembrarDatosDemo(): void {
  if (import.meta.env.VITE_DEMO_DATOS === 'false') return
  try {
    if (localStorage.getItem(SEMBRADO_KEY)) return

    const ahora = Date.now()
    const existentes = leerLista<CuentaGuardada>(USUARIOS_KEY)
    const nuevas = generarCuentas(existentes, ahora)
    const prendas = generarPrendas(nuevas, ahora)

    localStorage.setItem(USUARIOS_KEY, JSON.stringify([...existentes, ...nuevas]))
    localStorage.setItem(PRENDAS_KEY, JSON.stringify([...leerLista<Prenda>(PRENDAS_KEY), ...prendas]))
    localStorage.setItem(SEMBRADO_KEY, new Date(ahora).toISOString())
  } catch {
    // Sin localStorage no hay demo que sembrar.
  }
}
