import { createApp } from 'vue'
import App from './App.vue'

import { Values, Modal, Auth, Category, ProductForm, Service } from './components'

const app = createApp(App)

app.mixin(Values)
app.mixin(Modal)
app.mixin(Auth)
app.mixin(Category)
app.mixin(ProductForm)
app.mixin(Service)

document.body.style.overflow = 'hidden'

setTimeout(() => {
  app.mount('#app')
}, 500)

setTimeout(() => {
  const loader = document.querySelector('#load_box')
  document.body.style.overflow = 'auto'
  if (loader) loader.style.display = 'none'
}, 1500)
