import { createRouter, createWebHistory } from 'vue-router'
import { SECCIONES } from '@/domain/prenda'
import { esperarSesion, useSesion } from '@/composables/useSesion'
import SeccionView from '@/views/SeccionView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    /** Accesible sin sesión. */
    publica?: boolean
    /** Solo el administrador principal. */
    soloAdmin?: boolean
  }
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: { name: 'seccion', params: { seccion: 'hombre' } } },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { publica: true },
    },
    {
      path: `/:seccion(${SECCIONES.join('|')})`,
      name: 'seccion',
      component: SeccionView,
    },
    {
      path: '/publicar',
      name: 'publicar',
      component: () => import('@/views/PublicarView.vue'),
    },
    {
      path: '/admin/usuarios',
      name: 'usuarios',
      component: () => import('@/views/UsuariosView.vue'),
      meta: { soloAdmin: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  await esperarSesion()
  const { usuario } = useSesion()

  if (to.meta.publica) return to.name === 'login' && usuario.value ? '/' : true
  if (!usuario.value) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.soloAdmin && !usuario.value.esAdmin) return '/'
  return true
})
