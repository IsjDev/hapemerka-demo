<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { useSesion } from '@/composables/useSesion'

const { usuario } = useSesion()
</script>

<template>
  <AppHeader />
  <main class="container main" :class="{ 'main--con-tabbar': usuario }">
    <RouterView />
  </main>
</template>

<style scoped>
.main {
  padding-top: 16px;
  padding-bottom: 32px;
}

/* En el móvil la barra de pestañas inferior es fija: se deja hueco para que no tape el contenido. */
.main--con-tabbar {
  padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom) + 24px);
}

@media (min-width: 900px) {
  .main,
  .main--con-tabbar {
    padding-top: 24px;
    padding-bottom: 48px;
  }
}
</style>
