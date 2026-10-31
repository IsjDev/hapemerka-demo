import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { MARCA } from './config/marca'
import './styles/main.css'

// El título y el favicon siguen a la marca configurada.
document.title = MARCA.nombre
document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.setAttribute('href', MARCA.logo)

createApp(App).use(router).mount('#app')
