import type { Prenda } from '@/domain/prenda'
import type { PrendasRepository } from './prendasRepository'

const STORAGE_KEY = 'hapemerka:prendas'

function leer(): Prenda[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data: unknown = JSON.parse(raw)
    return Array.isArray(data) ? (data as Prenda[]) : []
  } catch {
    return []
  }
}

function guardar(prendas: Prenda[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prendas))
}

export function createLocalStoragePrendasRepository(): PrendasRepository {
  return {
    async list(filtro = {}) {
      return leer()
        .filter(
          (p) =>
            (!filtro.seccion || p.seccion === filtro.seccion) &&
            (!filtro.categoria || p.categoria === filtro.categoria),
        )
        .sort((a, b) => b.creadaEn.localeCompare(a.creadaEn))
    },

    async create(nueva) {
      const prenda: Prenda = {
        ...nueva,
        id: crypto.randomUUID(),
        creadaEn: new Date().toISOString(),
      }
      guardar([...leer(), prenda])
      return prenda
    },

    async remove(id) {
      guardar(leer().filter((p) => p.id !== id))
    },
  }
}
