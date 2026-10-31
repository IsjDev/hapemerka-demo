// Identidad visual del grupo que usa la app. Cada despliegue puede cambiarla desde
// `.env.local` (ver `.env.example`) sin tocar el código; si no, se usan estos valores.

export const MARCA = {
  nombre: import.meta.env.VITE_MARCA_NOMBRE || 'HapeMerka',
  lema: import.meta.env.VITE_MARCA_LEMA || 'Intercambio de vestuario',
  /** Ruta o URL del logo (SVG o PNG cuadrado). Por defecto, `public/logo.svg`. */
  logo: import.meta.env.VITE_MARCA_LOGO || `${import.meta.env.BASE_URL}logo.svg`,
}
