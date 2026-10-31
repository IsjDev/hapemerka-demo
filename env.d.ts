/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Credenciales del administrador principal en el demo (antes de Supabase). */
  readonly VITE_ADMIN_USUARIO?: string
  readonly VITE_ADMIN_PASSWORD?: string
  /** Identidad visual del grupo (ver `src/config/marca.ts`). */
  readonly VITE_MARCA_NOMBRE?: string
  readonly VITE_MARCA_LEMA?: string
  readonly VITE_MARCA_LOGO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
