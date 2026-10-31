<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { SECCIONES, SECCION_LABEL, isSeccion } from '@/domain/prenda'
import { useSesion } from '@/composables/useSesion'
import { useTheme } from '@/composables/useTheme'
import { MARCA } from '@/config/marca'

const route = useRoute()
const router = useRouter()
const { theme, toggleTheme } = useTheme()
const { usuario, cerrarSesion } = useSesion()

// Si estamos en una sección, el formulario de publicar la trae preseleccionada.
const publicarTo = computed(() => {
  const seccion = route.params.seccion
  return { name: 'publicar', query: isSeccion(seccion) ? { seccion } : {} }
})

// En la barra inferior del móvil, Publicar va en el centro, entre las secciones.
const mitad = Math.ceil(SECCIONES.length / 2)
const seccionesIzquierda = SECCIONES.slice(0, mitad)
const seccionesDerecha = SECCIONES.slice(mitad)

// Menú de usuario del móvil (en escritorio estas acciones van en la cabecera).
const menuAbierto = ref(false)
watch(
  () => route.fullPath,
  () => {
    menuAbierto.value = false
  },
)

function cerrarConEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') menuAbierto.value = false
}
onMounted(() => document.addEventListener('keydown', cerrarConEscape))
onBeforeUnmount(() => document.removeEventListener('keydown', cerrarConEscape))

async function salir() {
  menuAbierto.value = false
  await cerrarSesion()
  await router.replace({ name: 'login' })
}
</script>

<template>
  <header class="header">
    <div class="container header__inner">
      <RouterLink to="/" class="brand">
        <img :src="MARCA.logo" alt="" class="brand__logo" width="44" height="44" />
        <span class="brand__texto">
          <span class="brand__nombre">{{ MARCA.nombre }}</span>
          <span class="brand__lema">{{ MARCA.lema }}</span>
        </span>
      </RouterLink>

      <nav v-if="usuario" class="nav solo-escritorio" aria-label="Secciones">
        <RouterLink
          v-for="seccion in SECCIONES"
          :key="seccion"
          :to="{ name: 'seccion', params: { seccion } }"
          class="nav__link"
        >
          {{ SECCION_LABEL[seccion] }}
        </RouterLink>
      </nav>

      <div class="actions">
        <template v-if="usuario">
          <RouterLink :to="publicarTo" class="btn btn--accent solo-escritorio">+ Publicar</RouterLink>
          <RouterLink
            v-if="usuario.esAdmin"
            :to="{ name: 'usuarios' }"
            class="btn btn--ghost solo-escritorio"
          >
            Usuarios
          </RouterLink>
        </template>
        <button
          type="button"
          class="btn btn--ghost btn--icono"
          :aria-label="theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
          :title="theme === 'dark' ? 'Modo claro' : 'Modo oscuro'"
          @click="toggleTheme"
        >
          <svg v-if="theme === 'dark'" viewBox="0 0 24 24" class="icono" aria-hidden="true">
            <circle cx="12" cy="12" r="4.5" />
            <path
              d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"
            />
          </svg>
          <svg v-else viewBox="0 0 24 24" class="icono" aria-hidden="true">
            <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
          </svg>
        </button>
        <div v-if="usuario" class="sesion solo-escritorio">
          <span class="sesion__nombre">
            {{ usuario.nombre }}<template v-if="usuario.esAdmin"> (admin)</template>
          </span>
          <button type="button" class="btn btn--ghost" @click="salir">Salir</button>
        </div>
        <button
          v-if="usuario"
          type="button"
          class="btn btn--ghost btn--icono solo-movil"
          aria-label="Menú"
          aria-controls="menu-usuario"
          :aria-expanded="menuAbierto"
          @click="menuAbierto = !menuAbierto"
        >
          <svg viewBox="0 0 24 24" class="icono" aria-hidden="true">
            <path v-if="menuAbierto" d="M6 6l12 12M18 6 6 18" />
            <path v-else d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="usuario && menuAbierto" id="menu-usuario" class="menu solo-movil">
      <div class="container menu__inner">
        <p class="menu__usuario">
          Sesión de <strong>{{ usuario.nombre }}</strong
          ><template v-if="usuario.esAdmin"> (admin)</template>
        </p>
        <RouterLink v-if="usuario.esAdmin" :to="{ name: 'usuarios' }" class="menu__item">
          Usuarios
        </RouterLink>
        <button type="button" class="menu__item" @click="salir">Salir</button>
      </div>
    </div>
  </header>

  <div v-if="menuAbierto" class="backdrop solo-movil" @click="menuAbierto = false"></div>

  <nav v-if="usuario" class="tabbar solo-movil" aria-label="Secciones">
    <RouterLink
      v-for="seccion in seccionesIzquierda"
      :key="seccion"
      :to="{ name: 'seccion', params: { seccion } }"
      class="tab"
    >
      {{ SECCION_LABEL[seccion] }}
    </RouterLink>
    <RouterLink :to="publicarTo" class="tab tab--publicar">
      <span class="tab__mas" aria-hidden="true">+</span>
      Publicar
    </RouterLink>
    <RouterLink
      v-for="seccion in seccionesDerecha"
      :key="seccion"
      :to="{ name: 'seccion', params: { seccion } }"
      class="tab"
    >
      {{ SECCION_LABEL[seccion] }}
    </RouterLink>
  </nav>
</template>

<style scoped>
.header {
  position: relative;
  z-index: 20;
  padding-top: env(safe-area-inset-top);
  background: var(--color-header-bg);
  color: var(--color-header-text);
  border-bottom: 3px solid var(--color-accent);
  box-shadow: var(--shadow);
}

.header__inner {
  display: flex;
  align-items: center;
  gap: 10px 24px;
  padding-top: 8px;
  padding-bottom: 8px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  text-decoration: none;
}

.brand__logo {
  flex: none;
  width: 40px;
  height: 40px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 35%));
}

.brand__texto {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.15;
}

.brand__nombre {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.brand__lema {
  font-size: 0.72rem;
  opacity: 0.75;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav {
  display: flex;
  gap: 4px;
}

.nav__link {
  padding: 6px 12px;
  border-bottom: 2px solid transparent;
  border-radius: var(--radius) var(--radius) 0 0;
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.03em;
  text-decoration: none;
  opacity: 0.75;
}

.nav__link:hover {
  opacity: 1;
  background: rgb(255 255 255 / 8%);
}

.nav__link.router-link-active {
  opacity: 1;
  border-bottom-color: var(--color-accent);
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.header .btn--ghost {
  border-color: rgb(255 255 255 / 25%);
  color: inherit;
}

.header .btn--ghost:hover {
  background: rgb(255 255 255 / 10%);
}

.btn--icono {
  width: var(--tap-min);
  padding: 0;
}

.icono {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.btn--accent {
  background: var(--color-accent);
  color: var(--color-on-accent);
}

.btn--accent:hover {
  filter: brightness(1.08);
}

.sesion {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sesion__nombre {
  font-size: 0.9rem;
  opacity: 0.8;
}

/* Menú desplegable bajo la cabecera (solo móvil). */
.menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 3px;
  background: var(--color-header-bg);
  border-bottom: 3px solid var(--color-accent);
  box-shadow: var(--shadow-hover);
}

.menu__inner {
  display: flex;
  flex-direction: column;
  padding-top: 4px;
  padding-bottom: 8px;
}

.menu__usuario {
  margin: 0;
  padding: 10px 0;
  font-size: 0.9rem;
  opacity: 0.8;
}

.menu__item {
  display: flex;
  align-items: center;
  min-height: var(--tap-min);
  padding: 0;
  border: 0;
  border-top: 1px solid rgb(255 255 255 / 15%);
  background: none;
  color: inherit;
  font: inherit;
  font-weight: 600;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 10;
  background: rgb(0 0 0 / 35%);
}

/* Barra de pestañas inferior (solo móvil). */
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: stretch;
  height: calc(var(--tabbar-h) + env(safe-area-inset-bottom));
  padding: 0 env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  background: var(--color-header-bg);
  color: var(--color-header-text);
  border-top: 3px solid var(--color-accent);
  box-shadow: 0 -2px 12px rgb(0 0 0 / 18%);
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  border-top: 3px solid transparent;
  margin-top: -3px;
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-decoration: none;
  opacity: 0.7;
}

.tab.router-link-active {
  opacity: 1;
  border-top-color: var(--color-header-text);
}

.tab--publicar {
  opacity: 1;
  color: var(--color-accent);
  font-size: 0.75rem;
}

.tab--publicar.router-link-active {
  border-top-color: transparent;
}

.tab__mas {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-family: var(--font-sans);
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
}

.solo-escritorio {
  display: none;
}

@media (min-width: 900px) {
  .header__inner {
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .brand__logo {
    width: 44px;
    height: 44px;
  }

  .brand__nombre {
    font-size: 1.3rem;
  }

  .solo-escritorio {
    display: flex;
  }

  .solo-movil {
    display: none;
  }
}
</style>
