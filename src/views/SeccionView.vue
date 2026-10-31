<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { prendasRepository } from '@/data'
import { useSesion } from '@/composables/useSesion'
import {
  CATEGORIAS,
  CATEGORIA_INFO,
  SECCION_LABEL,
  isCategoria,
  opcionesOrden,
  ordenLabel,
  ordenarPrendas,
  parsearOrden,
  puedeBorrar,
  serializarOrden,
  type Categoria,
  type Prenda,
  type Seccion,
} from '@/domain/prenda'
import PrendaCard from '@/components/PrendaCard.vue'

const route = useRoute()
const router = useRouter()
const { usuario } = useSesion()

// La ruta solo acepta secciones válidas (ver router).
const seccion = computed(() => route.params.seccion as Seccion)

// El filtro vive en la URL (?categoria=...) para poder compartir el enlace.
const categoria = computed<Categoria | null>(() => {
  const valor = route.query.categoria
  return isCategoria(valor) ? valor : null
})

// El orden también va en la URL (?orden=largo-asc). Las opciones dependen de la
// categoría: en túnicas se ordena por ancho/largo, en botas por número, etc.
const orden = computed(() => parsearOrden(route.query.orden, categoria.value))
const opciones = computed(() => opcionesOrden(categoria.value))

const prendas = ref<Prenda[]>([])
const prendasOrdenadas = computed(() => ordenarPrendas(prendas.value, orden.value))
const cargando = ref(true)
const error = ref<string | null>(null)

watch(
  [seccion, categoria],
  async ([s, c]) => {
    cargando.value = true
    error.value = null
    try {
      prendas.value = await prendasRepository.list({ seccion: s, categoria: c ?? undefined })
    } catch {
      error.value = 'No se han podido cargar las prendas.'
    } finally {
      cargando.value = false
    }
  },
  { immediate: true },
)

function actualizarQuery(c: Categoria | null, ordenValor: string) {
  // Se omite el orden por defecto, o el que no exista en la nueva categoría, para no ensuciar la URL.
  const valido = serializarOrden(parsearOrden(ordenValor, c))
  const porDefecto = serializarOrden(parsearOrden(undefined, c))
  router.replace({
    query: {
      ...(c ? { categoria: c } : {}),
      ...(valido !== porDefecto ? { orden: valido } : {}),
    },
  })
}

function seleccionarCategoria(c: Categoria | null) {
  actualizarQuery(c, serializarOrden(orden.value))
}

function seleccionarOrden(event: Event) {
  actualizarQuery(categoria.value, (event.target as HTMLSelectElement).value)
}

const borrandoId = ref<string | null>(null)

async function borrar(prenda: Prenda) {
  if (!usuario.value || !puedeBorrar(prenda, usuario.value)) return
  const nombre = CATEGORIA_INFO[prenda.categoria].label.toLowerCase()
  if (!window.confirm(`¿Borrar esta prenda (${nombre})? No se puede deshacer.`)) return

  borrandoId.value = prenda.id
  error.value = null
  try {
    await prendasRepository.remove(prenda.id)
    prendas.value = prendas.value.filter((p) => p.id !== prenda.id)
  } catch {
    error.value = 'No se ha podido borrar la prenda.'
  } finally {
    borrandoId.value = null
  }
}
</script>

<template>
  <section>
    <div class="cabecera">
      <h1 class="title">{{ SECCION_LABEL[seccion] }}</h1>
      <p v-if="!cargando && !error" class="contador">
        {{ prendas.length }} {{ prendas.length === 1 ? 'prenda' : 'prendas' }}
      </p>
    </div>

    <div class="filtros" role="group" aria-label="Filtrar por categoría">
      <button
        type="button"
        class="chip"
        :aria-pressed="categoria === null"
        @click="seleccionarCategoria(null)"
      >
        Todas
      </button>
      <button
        v-for="c in CATEGORIAS"
        :key="c"
        type="button"
        class="chip"
        :aria-pressed="categoria === c"
        @click="seleccionarCategoria(c)"
      >
        {{ CATEGORIA_INFO[c].label }}
      </button>
    </div>

    <div class="toolbar">
      <label class="orden">
        <span class="orden__label">Ordenar por</span>
        <select :value="serializarOrden(orden)" @change="seleccionarOrden">
          <option v-for="o in opciones" :key="serializarOrden(o)" :value="serializarOrden(o)">
            {{ ordenLabel(o) }}
          </option>
        </select>
      </label>
      <p v-if="!categoria" class="toolbar__hint">
        Elige una categoría para ordenar por medidas.
      </p>
    </div>

    <p v-if="cargando" class="estado">Cargando…</p>
    <p v-else-if="error" class="estado estado--error">{{ error }}</p>
    <div v-else-if="prendas.length === 0" class="vacio">
      <p>
        No hay prendas
        <template v-if="categoria"> de {{ CATEGORIA_INFO[categoria].label.toLowerCase() }}</template>
        en esta sección todavía.
      </p>
      <RouterLink
        :to="{ name: 'publicar', query: { seccion, ...(categoria ? { categoria } : {}) } }"
        class="btn btn--primary"
      >
        Publicar una prenda
      </RouterLink>
    </div>
    <ul v-else class="grid">
      <li v-for="prenda in prendasOrdenadas" :key="prenda.id">
        <PrendaCard
          :prenda="prenda"
          :puede-borrar="!!usuario && puedeBorrar(prenda, usuario)"
          :borrando="borrandoId === prenda.id"
          @borrar="borrar(prenda)"
        />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.cabecera {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

.title {
  margin: 0;
  font-size: 1.6rem;
  color: var(--color-primary);
}

.contador {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  margin-bottom: 20px;
}

.orden {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 8px;
}

.orden__label {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  white-space: nowrap;
}

.orden select {
  flex: 1;
  min-width: 0;
  min-height: var(--tap-min);
  padding: 7px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text);
  /* 16px como mínimo: con menos, iOS hace zoom al tocar el campo. */
  font: inherit;
  cursor: pointer;
}

.toolbar__hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-style: italic;
}

/* Los filtros saltan de línea cuando no caben, para que todas las categorías queden a la vista. */
.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.chip {
  flex: none;
  min-height: var(--tap-min);
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 0.95rem;
  white-space: nowrap;
  cursor: pointer;
}

@media (hover: hover) {
  .chip:hover {
    background: var(--color-surface-muted);
    border-color: var(--color-accent);
  }
}

.chip[aria-pressed='true'] {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-on-primary);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.estado {
  color: var(--color-text-muted);
}

.estado--error {
  color: var(--color-danger);
}

.vacio {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  padding: 20px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius);
  color: var(--color-text-muted);
}

.vacio p {
  margin: 0;
}

@media (min-width: 600px) {
  .orden {
    flex: none;
  }

  .vacio {
    align-items: flex-start;
    padding: 24px;
  }
}

@media (min-width: 900px) {
  .title {
    font-size: 2rem;
  }

  .grid {
    gap: 16px;
  }
}
</style>
