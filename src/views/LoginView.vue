<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSesion } from '@/composables/useSesion'
import { MARCA } from '@/config/marca'
import { CUENTA_DEMO } from '@/data'

const route = useRoute()
const router = useRouter()
const { iniciarSesion } = useSesion()

const form = reactive({ nombre: '', password: '' })
const error = ref<string | null>(null)
const entrando = ref(false)

function usarCuentaDemo() {
  if (!CUENTA_DEMO) return
  form.nombre = CUENTA_DEMO.nombre
  form.password = CUENTA_DEMO.password
  error.value = null
}

async function entrar() {
  error.value = null
  if (!form.nombre.trim() || !form.password) {
    error.value = 'Escribe tu nombre y tu contraseña.'
    return
  }

  entrando.value = true
  try {
    if (!(await iniciarSesion(form.nombre.trim(), form.password))) {
      error.value = 'Nombre o contraseña incorrectos.'
      form.password = ''
      return
    }
    // Solo se aceptan rutas internas, para no redirigir fuera de la app.
    const destino = route.query.redirect
    await router.replace(typeof destino === 'string' && destino.startsWith('/') ? destino : '/')
  } catch {
    error.value = 'No se ha podido iniciar sesión. Inténtalo de nuevo.'
  } finally {
    entrando.value = false
  }
}
</script>

<template>
  <section class="login">
    <form class="form" novalidate @submit.prevent="entrar">
      <div class="marca">
        <img :src="MARCA.logo" alt="" class="marca__logo" width="96" height="96" />
        <p class="marca__nombre">{{ MARCA.nombre }}</p>
        <p class="marca__lema">{{ MARCA.lema }}</p>
      </div>
      <h1 class="title">Iniciar sesión</h1>
      <p class="intro">Usa el nombre y la contraseña que te ha dado el administrador del grupo.</p>

      <div class="field">
        <label for="login-nombre">Nombre</label>
        <input
          id="login-nombre"
          v-model="form.nombre"
          type="text"
          autocomplete="username"
          autocapitalize="none"
          spellcheck="false"
          enterkeyhint="next"
          autofocus
        />
      </div>

      <div class="field">
        <label for="login-password">Contraseña</label>
        <input
          id="login-password"
          v-model="form.password"
          type="password"
          autocomplete="current-password"
          enterkeyhint="go"
        />
      </div>

      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <button type="submit" class="btn btn--primary submit" :disabled="entrando">
        {{ entrando ? 'Entrando…' : 'Entrar' }}
      </button>

      <aside v-if="CUENTA_DEMO" class="demo">
        <p class="demo__titulo">Cuenta de prueba</p>
        <p class="demo__dato">
          Nombre: <strong>{{ CUENTA_DEMO.nombre }}</strong>
        </p>
        <p class="demo__dato">
          Contraseña: <strong>{{ CUENTA_DEMO.password }}</strong>
        </p>
        <button type="button" class="btn btn--ghost demo__usar" @click="usarCuentaDemo">
          Usar esta cuenta
        </button>
      </aside>
    </form>
  </section>
</template>

<style scoped>
.login {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 380px;
  padding: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: 4px solid var(--color-primary);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.marca {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
  text-align: center;
}

.marca__logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 6px;
}

.marca__nombre {
  margin: 0;
  color: var(--color-primary);
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.marca__lema {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.title {
  margin: 0;
  font-size: 1.3rem;
}

.intro {
  margin: -8px 0 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
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
  min-height: var(--tap-min);
  padding: 9px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text);
  font: inherit;
}

.error {
  margin: 0;
  color: var(--color-danger);
  font-size: 0.9rem;
}

.submit {
  min-height: 48px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: progress;
}

.demo {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: var(--color-surface-muted);
  border-radius: var(--radius);
  font-size: 0.9rem;
}

.demo__titulo {
  margin: 0;
  font-weight: 600;
}

.demo__dato {
  margin: 0;
  color: var(--color-text-muted);
}

.demo__dato strong {
  color: var(--color-text);
}

.demo__usar {
  min-height: var(--tap-min);
  margin-top: 8px;
}

@media (min-width: 600px) {
  .login {
    padding-top: 24px;
  }

  .form {
    padding: 24px;
  }

  .marca__logo {
    width: 96px;
    height: 96px;
  }
}
</style>
