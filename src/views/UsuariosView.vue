<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { NombreDuplicadoError, usuariosRepository } from '@/data'
import { useSesion } from '@/composables/useSesion'
import { MIN_PASSWORD, type CuentaUsuario } from '@/domain/usuario'

const router = useRouter()
const { usuario } = useSesion()

// Si el admin cierra sesión estando aquí, se le saca del panel.
watch(
  () => usuario.value?.esAdmin,
  (esAdmin) => {
    if (!esAdmin) router.replace('/')
  },
)

const usuarios = ref<CuentaUsuario[]>([])
const cargando = ref(true)
const errorLista = ref<string | null>(null)

async function cargar() {
  cargando.value = true
  errorLista.value = null
  try {
    usuarios.value = await usuariosRepository.list()
  } catch {
    errorLista.value = 'No se han podido cargar los usuarios.'
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

const form = reactive({ nombre: '', password: '' })
const mostrarPassword = ref(false)
const errores = ref<{ nombre?: string; password?: string }>({})
const errorGuardar = ref<string | null>(null)
const guardando = ref(false)
const creado = ref<string | null>(null)

// El error de un campo desaparece en cuanto se modifica.
watch(
  () => form.nombre,
  () => delete errores.value.nombre,
)
watch(
  () => form.password,
  () => delete errores.value.password,
)

async function crear() {
  errores.value = {}
  errorGuardar.value = null
  creado.value = null

  const nombre = form.nombre.trim()
  if (!nombre) errores.value.nombre = 'Indica el nombre.'
  if (form.password.length < MIN_PASSWORD) {
    errores.value.password = `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`
  }
  if (errores.value.nombre || errores.value.password) return

  guardando.value = true
  try {
    const cuenta = await usuariosRepository.create({ nombre, password: form.password })
    creado.value = cuenta.nombre
    form.nombre = ''
    form.password = ''
    await cargar()
  } catch (e) {
    if (e instanceof NombreDuplicadoError) errores.value.nombre = e.message
    else errorGuardar.value = 'No se ha podido crear el usuario.'
  } finally {
    guardando.value = false
  }
}

const borrandoId = ref<string | null>(null)

async function borrar(cuenta: CuentaUsuario) {
  if (!window.confirm(`¿Borrar el usuario "${cuenta.nombre}"? No se puede deshacer.`)) return

  borrandoId.value = cuenta.id
  errorLista.value = null
  try {
    await usuariosRepository.remove(cuenta.id)
    usuarios.value = usuarios.value.filter((u) => u.id !== cuenta.id)
  } catch {
    errorLista.value = 'No se ha podido borrar el usuario.'
  } finally {
    borrandoId.value = null
  }
}

const formatoFecha = new Intl.DateTimeFormat('es', { dateStyle: 'medium' })
</script>

<template>
  <section class="usuarios">
    <h1 class="title">Usuarios</h1>
    <p class="intro">
      Da de alta a los miembros del grupo. Entrarán en HapeMerka con este nombre y contraseña.
    </p>

    <form class="panel form" novalidate @submit.prevent="crear">
      <h2 class="subtitle">Añadir usuario</h2>

      <div class="field">
        <label for="nombre">Nombre</label>
        <input
          id="nombre"
          v-model="form.nombre"
          type="text"
          autocomplete="off"
          autocapitalize="words"
          spellcheck="false"
          :aria-invalid="!!errores.nombre"
        />
        <p v-if="errores.nombre" class="error">{{ errores.nombre }}</p>
      </div>

      <div class="field">
        <label for="password">Contraseña</label>
        <div class="password">
          <input
            id="password"
            v-model="form.password"
            :type="mostrarPassword ? 'text' : 'password'"
            autocomplete="new-password"
            autocapitalize="none"
            spellcheck="false"
            :aria-invalid="!!errores.password"
          />
          <button
            type="button"
            class="btn btn--ghost"
            :aria-pressed="mostrarPassword"
            @click="mostrarPassword = !mostrarPassword"
          >
            {{ mostrarPassword ? 'Ocultar' : 'Mostrar' }}
          </button>
        </div>
        <p v-if="errores.password" class="error">{{ errores.password }}</p>
        <p v-else class="hint">Mínimo {{ MIN_PASSWORD }} caracteres.</p>
      </div>

      <p v-if="errorGuardar" class="error">{{ errorGuardar }}</p>
      <p v-if="creado" class="ok" role="status">Usuario «{{ creado }}» creado.</p>

      <div>
        <button type="submit" class="btn btn--primary submit" :disabled="guardando">
          {{ guardando ? 'Creando…' : 'Añadir usuario' }}
        </button>
      </div>
    </form>

    <div class="panel">
      <h2 class="subtitle">
        Usuarios dados de alta <span v-if="!cargando" class="count">({{ usuarios.length }})</span>
      </h2>

      <p v-if="errorLista" class="error">{{ errorLista }}</p>
      <p v-if="cargando" class="muted">Cargando…</p>
      <p v-else-if="usuarios.length === 0" class="muted">Todavía no hay usuarios.</p>
      <ul v-else class="lista">
        <li v-for="cuenta in usuarios" :key="cuenta.id" class="lista__item">
          <div>
            <strong>{{ cuenta.nombre }}</strong>
            <span class="muted fecha">Alta: {{ formatoFecha.format(new Date(cuenta.creadaEn)) }}</span>
          </div>
          <button
            type="button"
            class="btn btn--danger"
            :disabled="borrandoId === cuenta.id"
            @click="borrar(cuenta)"
          >
            {{ borrandoId === cuenta.id ? 'Borrando…' : 'Borrar' }}
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.usuarios {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 560px;
}

.title {
  margin: 0;
  font-size: 1.5rem;
}

.intro {
  margin: -12px 0 0;
  color: var(--color-text-muted);
}

.subtitle {
  margin: 0;
  font-size: 1.15rem;
}

.count {
  color: var(--color-text-muted);
  font-weight: 400;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-weight: 600;
  font-size: 0.95rem;
}

input {
  width: 100%;
  min-width: 0;
  min-height: var(--tap-min);
  padding: 9px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text);
  font: inherit;
}

input[aria-invalid='true'] {
  border-color: var(--color-danger);
}

.password {
  display: flex;
  gap: 8px;
}

.error,
.ok,
.hint {
  margin: 0;
  font-size: 0.85rem;
}

.error {
  color: var(--color-danger);
}

.hint,
.muted {
  color: var(--color-text-muted);
}

.ok {
  color: var(--color-text);
  font-weight: 600;
}

.muted {
  margin: 0;
}

.lista {
  margin: 0;
  padding: 0;
  list-style: none;
}

.lista__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--color-border);
}

.lista__item:first-child {
  border-top: 0;
  padding-top: 0;
}

.fecha {
  display: block;
  font-size: 0.8rem;
}

.btn--danger {
  padding: 4px 10px;
  background: transparent;
  border-color: var(--color-danger);
  color: var(--color-danger);
  font-size: 0.85rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: progress;
}

.lista__item > div {
  min-width: 0;
  overflow-wrap: anywhere;
}

.lista__item .btn--danger {
  flex: none;
}

.submit {
  width: 100%;
}

@media (min-width: 600px) {
  .title {
    font-size: 1.75rem;
  }

  .panel {
    padding: 20px;
  }

  .submit {
    width: auto;
  }
}
</style>
