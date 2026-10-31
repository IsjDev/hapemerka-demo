<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { prendasRepository } from '@/data'
import { useSesion } from '@/composables/useSesion'
import {
  CATEGORIAS,
  CATEGORIA_INFO,
  COLORES,
  ESTADOS,
  SECCIONES,
  SECCION_LABEL,
  TALLAS_CASCO,
  isCategoria,
  isSeccion,
  tieneColor,
  type Categoria,
  type Color,
  type Estado,
  type Medidas,
  type Seccion,
  type TallaCasco,
} from '@/domain/prenda'

const route = useRoute()
const router = useRouter()
const { usuario } = useSesion()

const MAX_COMENTARIO = 500

// v-model.number deja '' cuando el campo está vacío.
type NumeroCampo = number | ''

const form = reactive({
  seccion: (isSeccion(route.query.seccion) ? route.query.seccion : 'hombre') as Seccion,
  categoria: (isCategoria(route.query.categoria) ? route.query.categoria : '') as Categoria | '',
  estado: '' as Estado | '',
  // Por defecto, quien publica; se puede cambiar si el contacto es otra persona.
  contacto: usuario.value?.nombre ?? '',
  comentario: '',
  ancho: '' as NumeroCampo,
  largo: '' as NumeroCampo,
  numero: '' as NumeroCampo,
  talla: '' as TallaCasco | '',
  color: '' as Color | '',
})

const errores = ref<Partial<Record<keyof typeof form, string>>>({})
const errorGuardar = ref<string | null>(null)
const guardando = ref(false)

// El error de un campo desaparece en cuanto se modifica.
watch(
  () => ({ ...form }),
  (nuevo, anterior) => {
    for (const campo of Object.keys(nuevo) as (keyof typeof form)[]) {
      if (nuevo[campo] !== anterior[campo]) delete errores.value[campo]
    }
  },
)

const tipoMedida = computed(() => (form.categoria ? CATEGORIA_INFO[form.categoria].medida : null))
const pideColor = computed(() => !!form.categoria && tieneColor(form.categoria))

function esPositivo(valor: NumeroCampo): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0
}

/** Devuelve las medidas de la categoría elegida, o null si falta algún dato (rellena `errores`). */
function construirMedidas(): Medidas | null {
  const e = errores.value
  switch (tipoMedida.value) {
    case 'anchoLargo':
      if (!esPositivo(form.ancho)) e.ancho = 'Indica el ancho en cm.'
      if (!esPositivo(form.largo)) e.largo = 'Indica el largo en cm.'
      return esPositivo(form.ancho) && esPositivo(form.largo)
        ? { tipo: 'anchoLargo', ancho: form.ancho, largo: form.largo }
        : null
    case 'largo':
      if (!esPositivo(form.largo)) e.largo = 'Indica el largo en cm.'
      return esPositivo(form.largo) ? { tipo: 'largo', largo: form.largo } : null
    case 'numero':
      if (!esPositivo(form.numero)) e.numero = 'Indica el número.'
      return esPositivo(form.numero) ? { tipo: 'numero', numero: form.numero } : null
    case 'talla':
      if (!form.talla) e.talla = 'Elige una talla.'
      return form.talla ? { tipo: 'talla', talla: form.talla } : null
    case null:
      return null
  }
}

async function publicar() {
  errores.value = {}
  errorGuardar.value = null

  if (!form.categoria) errores.value.categoria = 'Elige una categoría.'
  if (!form.estado) errores.value.estado = 'Elige el estado.'
  const contacto = form.contacto.trim()
  if (!contacto) errores.value.contacto = 'Indica el nombre de contacto.'
  const medidas = construirMedidas()
  if (pideColor.value && !form.color) errores.value.color = 'Elige el color.'

  if (!form.categoria || !form.estado || !contacto || !medidas) return
  if (pideColor.value && !form.color) return
  if (!usuario.value) {
    errorGuardar.value = 'Tu sesión ha caducado. Vuelve a iniciar sesión.'
    return
  }

  const comentario = form.comentario.trim().slice(0, MAX_COMENTARIO)

  guardando.value = true
  try {
    await prendasRepository.create({
      seccion: form.seccion,
      categoria: form.categoria,
      estado: form.estado,
      contacto,
      medidas,
      ...(pideColor.value && form.color ? { color: form.color } : {}),
      ...(comentario ? { comentario } : {}),
      publicadaPor: usuario.value.id,
    })
    await router.push({
      name: 'seccion',
      params: { seccion: form.seccion },
      query: { categoria: form.categoria },
    })
  } catch {
    errorGuardar.value = 'No se ha podido guardar la prenda. Inténtalo de nuevo.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <section class="publicar">
    <h1 class="title">Publicar prenda</h1>

    <form class="form" novalidate @submit.prevent="publicar">
      <div class="field">
        <label for="seccion">Sección</label>
        <select id="seccion" v-model="form.seccion">
          <option v-for="s in SECCIONES" :key="s" :value="s">{{ SECCION_LABEL[s] }}</option>
        </select>
      </div>

      <div class="field">
        <label for="categoria">Categoría</label>
        <select id="categoria" v-model="form.categoria" :aria-invalid="!!errores.categoria">
          <option value="" disabled>Elige una categoría</option>
          <option v-for="c in CATEGORIAS" :key="c" :value="c">{{ CATEGORIA_INFO[c].label }}</option>
        </select>
        <p v-if="errores.categoria" class="error">{{ errores.categoria }}</p>
      </div>

      <div v-if="tipoMedida === 'anchoLargo'" class="row">
        <div class="field">
          <label for="ancho">Ancho (cm)</label>
          <input id="ancho" v-model.number="form.ancho" type="number" min="1" step="0.5" inputmode="decimal" :aria-invalid="!!errores.ancho" />
          <p v-if="errores.ancho" class="error">{{ errores.ancho }}</p>
        </div>
        <div class="field">
          <label for="largo">Largo (cm)</label>
          <input id="largo" v-model.number="form.largo" type="number" min="1" step="0.5" inputmode="decimal" :aria-invalid="!!errores.largo" />
          <p v-if="errores.largo" class="error">{{ errores.largo }}</p>
        </div>
      </div>

      <div v-else-if="tipoMedida === 'largo'" class="field">
        <label for="largo">Largo (cm)</label>
        <input id="largo" v-model.number="form.largo" type="number" min="1" step="0.5" inputmode="decimal" :aria-invalid="!!errores.largo" />
        <p v-if="errores.largo" class="error">{{ errores.largo }}</p>
      </div>

      <div v-else-if="tipoMedida === 'numero'" class="field">
        <label for="numero">Número</label>
        <input id="numero" v-model.number="form.numero" type="number" min="1" step="0.5" inputmode="decimal" :aria-invalid="!!errores.numero" />
        <p v-if="errores.numero" class="error">{{ errores.numero }}</p>
      </div>

      <fieldset v-else-if="tipoMedida === 'talla'" class="field">
        <legend>Talla</legend>
        <div class="options">
          <label v-for="t in TALLAS_CASCO" :key="t" class="option">
            <input v-model="form.talla" type="radio" name="talla" :value="t" />
            {{ t }}
          </label>
        </div>
        <p v-if="errores.talla" class="error">{{ errores.talla }}</p>
      </fieldset>

      <div v-if="pideColor" class="field">
        <label for="color">Color</label>
        <select id="color" v-model="form.color" :aria-invalid="!!errores.color">
          <option value="" disabled>Elige un color</option>
          <option v-for="c in COLORES" :key="c" :value="c">{{ c }}</option>
        </select>
        <p v-if="errores.color" class="error">{{ errores.color }}</p>
      </div>

      <fieldset class="field">
        <legend>Estado</legend>
        <div class="options options--apiladas">
          <label v-for="e in ESTADOS" :key="e" class="option">
            <input v-model="form.estado" type="radio" name="estado" :value="e" />
            {{ e }}
          </label>
        </div>
        <p v-if="errores.estado" class="error">{{ errores.estado }}</p>
      </fieldset>

      <div class="field">
        <label for="contacto">Contacto</label>
        <input id="contacto" v-model="form.contacto" type="text" placeholder="Nombre" autocomplete="given-name" autocapitalize="words" :aria-invalid="!!errores.contacto" />
        <p v-if="errores.contacto" class="error">{{ errores.contacto }}</p>
      </div>

      <div class="field">
        <label for="comentario">Comentario <span class="opcional">(opcional)</span></label>
        <textarea
          id="comentario"
          v-model="form.comentario"
          rows="3"
          :maxlength="MAX_COMENTARIO"
          placeholder="Detalles, defectos, dónde recogerla…"
        ></textarea>
        <p class="hint">{{ form.comentario.length }}/{{ MAX_COMENTARIO }}</p>
      </div>

      <p v-if="errorGuardar" class="error">{{ errorGuardar }}</p>

      <div>
        <button type="submit" class="btn btn--primary submit" :disabled="guardando">
          {{ guardando ? 'Publicando…' : 'Publicar' }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.publicar {
  max-width: 560px;
}

.title {
  margin: 0 0 16px;
  font-size: 1.5rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

label,
legend {
  padding: 0;
  font-weight: 600;
  font-size: 0.95rem;
}

input[type='text'],
input[type='number'],
select,
textarea {
  width: 100%;
  min-height: var(--tap-min);
  padding: 9px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text);
  font: inherit;
}

textarea {
  resize: vertical;
}

.opcional {
  color: var(--color-text-muted);
  font-weight: 400;
}

.hint {
  margin: 0;
  align-self: flex-end;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

[aria-invalid='true'] {
  border-color: var(--color-danger);
}

.options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option {
  display: inline-flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: var(--tap-min);
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-weight: 400;
  cursor: pointer;
}

.options--apiladas {
  flex-direction: column;
}

.options--apiladas .option {
  justify-content: flex-start;
}

.option:has(input:checked) {
  border-color: var(--color-primary);
  background: var(--color-surface-muted);
}

.option input {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
  margin: 0;
}

.error {
  margin: 0;
  color: var(--color-danger);
  font-size: 0.85rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: progress;
}

.submit {
  width: 100%;
  min-height: 48px;
}

@media (min-width: 600px) {
  .title {
    margin-bottom: 20px;
    font-size: 1.75rem;
  }

  .form {
    padding: 20px;
  }

  .options--apiladas {
    flex-direction: row;
  }

  .option {
    flex: none;
  }

  .submit {
    width: auto;
    min-height: var(--tap-min);
  }
}
</style>
