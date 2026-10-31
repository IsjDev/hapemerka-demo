<script setup lang="ts">
import { computed } from 'vue'
import { CATEGORIA_INFO, type Estado, type Medidas, type Prenda } from '@/domain/prenda'

const props = defineProps<{ prenda: Prenda; puedeBorrar: boolean; borrando?: boolean }>()
defineEmits<{ borrar: [] }>()

// Cada medida en su propia pastilla para que se lean de un vistazo al comparar.
function medidasEnPartes(medidas: Medidas): { etiqueta: string; valor: string }[] {
  switch (medidas.tipo) {
    case 'anchoLargo':
      return [
        { etiqueta: 'Ancho', valor: `${medidas.ancho} cm` },
        { etiqueta: 'Largo', valor: `${medidas.largo} cm` },
      ]
    case 'largo':
      return [{ etiqueta: 'Largo', valor: `${medidas.largo} cm` }]
    case 'numero':
      return [{ etiqueta: 'Número', valor: String(medidas.numero) }]
    case 'talla':
      return [{ etiqueta: 'Talla', valor: medidas.talla }]
  }
}

const ESTADO_CLASE: Record<Estado, string> = {
  'Casi nuevo': 'badge--nuevo',
  Bueno: 'badge--bueno',
  Regular: 'badge--regular',
}

const medidas = computed(() => medidasEnPartes(props.prenda.medidas))
const fecha = computed(() =>
  new Date(props.prenda.creadaEn).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
)
</script>

<template>
  <article class="card">
    <header class="card__header">
      <h3 class="card__title">{{ CATEGORIA_INFO[prenda.categoria].label }}</h3>
      <span class="badge" :class="ESTADO_CLASE[prenda.estado]">{{ prenda.estado }}</span>
    </header>
    <dl class="medidas">
      <div v-for="m in medidas" :key="m.etiqueta" class="medida">
        <dt>{{ m.etiqueta }}</dt>
        <dd>{{ m.valor }}</dd>
      </div>
    </dl>
    <p v-if="prenda.comentario" class="card__comentario">{{ prenda.comentario }}</p>
    <footer class="card__footer">
      <p class="card__contacto">
        Contacto: <strong>{{ prenda.contacto }}</strong>
        <span class="card__fecha"> · {{ fecha }}</span>
      </p>
      <button
        v-if="puedeBorrar"
        type="button"
        class="btn btn--danger"
        :disabled="borrando"
        @click="$emit('borrar')"
      >
        {{ borrando ? 'Borrando…' : 'Borrar' }}
      </button>
    </footer>
  </article>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: 4px solid var(--color-primary);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

/* Solo con ratón: en táctil el hover se queda «pegado» tras tocar. */
@media (hover: hover) {
  .card:hover {
    box-shadow: var(--shadow-hover);
    transform: translateY(-2px);
  }
}

.card__header,
.card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card__footer {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px dashed var(--color-border);
}

.card__title {
  margin: 0;
  font-size: 1.1rem;
}

.medidas {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
}

.medida {
  display: flex;
  flex-direction: column;
  min-width: 72px;
  padding: 6px 10px;
  background: var(--color-surface-muted);
  border-left: 3px solid var(--color-accent);
  border-radius: 6px;
}

.medida dt {
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.medida dd {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.card__contacto,
.card__comentario {
  margin: 0;
}

.card__comentario {
  font-size: 0.9rem;
  font-style: italic;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.card__contacto {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.card__contacto strong {
  color: var(--color-text);
}

.card__fecha {
  font-size: 0.8rem;
}

.badge {
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge--nuevo {
  background: color-mix(in srgb, var(--color-success) 16%, transparent);
  color: var(--color-success);
}

.badge--bueno {
  background: color-mix(in srgb, var(--color-accent) 18%, transparent);
  color: color-mix(in srgb, var(--color-accent) 55%, var(--color-text));
}

.badge--regular {
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.btn--danger {
  flex: none;
  padding: 4px 14px;
  background: transparent;
  border-color: var(--color-danger);
  color: var(--color-danger);
  font-size: 0.85rem;
}

.btn--danger:disabled {
  opacity: 0.6;
  cursor: progress;
}
</style>
