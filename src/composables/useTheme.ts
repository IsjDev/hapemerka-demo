import { readonly, ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'hapemerka:theme'

function temaInicial(): Theme {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY)
    if (guardado === 'light' || guardado === 'dark') return guardado
  } catch {
    // Sin acceso a localStorage: se usa la preferencia del sistema.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Estado compartido por toda la app.
const theme = ref<Theme>(temaInicial())

watch(
  theme,
  (valor) => {
    document.documentElement.dataset.theme = valor
    // La barra del navegador del móvil toma el color de la cabecera. Se espera a un
    // frame porque al arrancar las hojas de estilo aún pueden no estar aplicadas.
    requestAnimationFrame(() => {
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-header-bg')
        .trim()
      if (color) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
    })
    try {
      localStorage.setItem(STORAGE_KEY, valor)
    } catch {
      // No se puede guardar la preferencia; el tema sigue funcionando en esta sesión.
    }
  },
  { immediate: true },
)

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme: readonly(theme), toggleTheme }
}
