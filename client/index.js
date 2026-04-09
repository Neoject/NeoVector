import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';

document.body.style.overflow = 'hidden';

document.addEventListener('DOMContentLoaded', () => {
    const app = createApp(App);
    app.use(router);
    app.mount('#app');

    setTimeout(() => {
        const loader = document.querySelector('#load_box');
        document.body.style.overflow = 'auto';
        if (loader) loader.style.display = 'none';
    }, 500);
});