# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

HapeMerka es una plataforma de intercambio de ropa y accesorios de las Fiestas de Cartagineses y Romanos.

Estado actual: demo funcional en Vue 3 + Vite + TypeScript + Vue Router. No hay store (Pinia), linter ni tests configurados; si se añaden, actualizar esta sección.

## Comandos

- Gestor de paquetes: **Bun**. Usar `bun install` / `bun add` / `bun run <script>`, no npm ni yarn.
- `bun dev` — servidor de desarrollo de Vite (incluye `vite-plugin-vue-devtools`).
- `bun run build` — type-check (`vue-tsc --build`) y build de producción en paralelo.
- `bun run type-check` — solo comprobación de tipos.
- `bun run preview` — sirve el build de producción.

## Arquitectura

- `src/domain/prenda.ts` — fuente única del modelo de dominio: secciones, categorías (`CATEGORIA_INFO` asocia cada una a su `TipoMedida`), estados y la unión discriminada `Medidas`. Los slugs (`nino`, `munequeras`…) van sin tildes; las etiquetas visibles salen de `SECCION_LABEL` / `CATEGORIA_INFO`. El color (`COLORES`, campo opcional `color` de `Prenda`) solo se pide en las categorías con `conColor` en `CATEGORIA_INFO` (de momento, túnica). Para añadir una categoría basta con tocar este archivo (y el formulario si es un tipo de medida nuevo).
- `src/data/` — capa de datos con tres repositorios (`authRepository`, `prendasRepository`, `usuariosRepository`). Los componentes los importan solo desde `@/data`; las interfaces son asíncronas para que la migración a Supabase consista en cambiar las implementaciones en `src/data/index.ts`. Las actuales (`localStorage*`) usan las claves `hapemerka:prendas`, `hapemerka:usuarios` y `hapemerka:sesion`.
- Datos de ejemplo: `src/data/localStorageDemoSeed.ts` siembra (una vez por navegador, marcado con `hapemerka:demo`) 24 cuentas de miembros con contraseña `demo123` y ~140 prendas generadas con un PRNG con semilla, publicadas por esas cuentas y por el admin. Se llama desde `src/data/index.ts` antes de crear los repositorios; `VITE_DEMO_DATOS=false` lo desactiva. `LoginView` muestra una cuenta de prueba (`CUENTA_DEMO`: Aníbal / `demo123`) con un botón que rellena el formulario, salvo con los datos desactivados. Para regenerarlos, borrar `hapemerka:demo`, `hapemerka:prendas` y `hapemerka:usuarios`.
- Orden del listado: también en `src/domain/prenda.ts` (`camposOrden`, `ordenarPrendas`, `parsearOrden`…). Los campos disponibles dependen del `TipoMedida` de la categoría (ancho/largo, largo, número o talla, esta última en el orden de `TALLAS_CASCO`), más fecha y estado; sin categoría solo fecha y estado. Se ordena en el cliente sobre lo que devuelve el repositorio.
- Rutas (`src/router/index.ts`): `/:seccion` (solo acepta los slugs de `SECCIONES`) con el filtro de categoría en la query `?categoria=` y el orden en `?orden=<campo>-<asc|desc>` (se omite si es el de por defecto, «más recientes»), `/publicar` (acepta `?seccion=` y `?categoria=` para preseleccionar), `/login` y `/admin/usuarios`. Un `beforeEach` global espera a `esperarSesion()` y exige sesión salvo en rutas con `meta.publica`; `meta.soloAdmin` restringe al admin. Sin sesión se redirige a `/login?redirect=…`.
- Login y sesión: `useSesion` (`src/composables/`) expone el `usuario` actual (`{ id, nombre, esAdmin }` o `null`), `iniciarSesion` y `cerrarSesion`, apoyándose en `authRepository`. Los miembros entran con las cuentas que crea el admin; el administrador principal no es una cuenta guardada, sus credenciales son `VITE_ADMIN_USUARIO` / `VITE_ADMIN_PASSWORD` en `.env.local` (ver `.env.example`; Vite reinicia solo al cambiarlo) y su id es fijo (`ADMIN_ID` en `src/data/adminDemo.ts`). Una sesión cuya cuenta se ha borrado deja de ser válida al recargar.
- Permisos: al publicar se guarda `publicadaPor` = id del usuario. La regla de borrado es `puedeBorrar` en el dominio (quien publicó o el admin). En el demo todo se comprueba en el cliente, así que no es seguridad real; con Supabase la regla deberá imponerse también con RLS.
- Cuentas de usuario (`src/domain/usuario.ts`): nombre único (sin distinguir mayúsculas ni tildes, y distinto del nombre del admin) y contraseña (mín. 6). En el demo se guardan con hash SHA-256 + salt y la contraseña nunca sale de `localStorageUsuariosRepository`. Con Supabase: crear/borrar cuentas debe hacerse desde una Edge Function (requiere la clave de servicio) y, como Supabase Auth identifica por email, habrá que asociar cada nombre a un email.
- Marca: nombre, lema y logo del grupo salen de `src/config/marca.ts`, configurables con `VITE_MARCA_NOMBRE`, `VITE_MARCA_LEMA` y `VITE_MARCA_LOGO` en `.env.local`. El logo por defecto es el provisional `public/logo.svg`; `main.ts` lo usa también como favicon y título de la pestaña.
- Tema: los colores son variables CSS en `src/styles/main.css` (`:root` claro, `:root[data-theme='dark']` oscuro). Paleta provisional granate/oro/pergamino; los títulos usan `--font-display` (Cinzel, cargada desde Google Fonts en `index.html`). `useTheme` pone `data-theme` en `<html>` y guarda la preferencia en localStorage. Los componentes deben usar siempre `var(--color-*)`.
- **Mobile first:** casi todos los usuarios entran desde el móvil. Los estilos base son los del móvil y se amplían con `@media (min-width: 600px | 900px)`. En móvil la navegación es una barra de pestañas inferior fija (`AppHeader`: secciones + Publicar en el centro) y las acciones de usuario van en un menú; a partir de 900px se usa la cabecera de escritorio. Objetivos táctiles de al menos `--tap-min` (44px), campos de formulario con fuente ≥16px (si no, iOS hace zoom) y efectos `:hover` solo dentro de `@media (hover: hover)`. Se respetan las zonas seguras (`env(safe-area-inset-*)`, `viewport-fit=cover`) y `useTheme` sincroniza el `<meta name="theme-color">` con `--color-header-bg`.
- Alias `@/` → `src/` (configurado en `vite.config.ts` y `tsconfig.app.json`).
- `tsconfig.app.json` activa `noUncheckedIndexedAccess`: los accesos por índice a arrays/objetos devuelven `T | undefined`.

## Stack y decisiones técnicas

- Frontend en **Vue**.
- **Demo:** los datos se guardan en el almacenamiento del navegador (localStorage). Más adelante se migrará a **Supabase**, así que el acceso a datos debe quedar aislado en una capa propia para poder cambiar el backend sin tocar los componentes.
- **Login:** en el demo, con nombre y contraseña contra las cuentas guardadas en localStorage; se migrará a Supabase Auth.
- **Tema:** modo oscuro y modo claro. La paleta de colores aún no está definida, así que conviene usar variables/tokens de color en vez de colores fijos.

## Modelo de dominio

**Secciones:** Hombre, Mujer, Niño, Niña.

**Campos comunes a todas las prendas:**
- Estado: `Casi nuevo` | `Bueno` | `Regular`
- Contacto: la persona con la que hay que hablar, solo nombre
- Comentario: texto libre opcional (máx. 500 caracteres)

**Medidas según la categoría:**

| Categoría | Medidas |
|---|---|
| Túnica | Ancho y largo (cm) + color |
| Coraza, Pechera, Muñequeras | Ancho y largo (cm) |
| Escudo | Ancho y largo (cm) |
| Armamento | Largo (cm) |
| Cinturón | Largo (cm) |
| Botas | Número |
| Cascos | Talla: `S` \| `M` \| `L` \| `XL` |

## Funcionalidades

- Iniciar sesión con nombre y contraseña; sin sesión no se puede usar la app.
- Publicar prendas con los campos de su categoría (ver tabla).
- Filtro de prendas por categoría dentro de cada sección.
- Borrar prendas: solo la persona que la publicó y el administrador principal del grupo.
- Panel de administración de usuarios: alta (nombre y contraseña), listado y baja.
