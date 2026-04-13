import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';

document.body.style.overflow = 'hidden';

const ready = async (code) => {
    code
};

document.addEventListener('DOMContentLoaded', async () => {
    await ready(async () => {
        for (let attempt = 0; attempt < 30; attempt += 1) {
            try {
                const response = await fetch('/api/health', {cache: 'no-store', credentials: 'include'});

                if (response.ok) {
                    return true;
                }
            } catch (_error) {
                console.log('not ready');
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        return false;
    });

    const app = createApp(App);
    app.use(router);
    app.mount('#app');

    setTimeout(() => {
        const loader = document.querySelector('#load_box');
        document.body.style.overflow = 'auto';
        if (loader) loader.style.display = 'none';
    }, 500);
});