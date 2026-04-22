import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

const savedTheme = window.localStorage.getItem('theme')
const useDark = savedTheme ? savedTheme === 'dark' : true
document.documentElement.classList.toggle('dark-theme', useDark)

const ready = async (maxAttempts = 30, delayMs = 1000) => {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
            const response = await fetch('/api/health', { cache: 'no-store', credentials: 'include' });
            if (response.ok) return true;
        } catch (_error) {

        }

        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    return false;
};

document.addEventListener('DOMContentLoaded', async () => {
    if (import.meta.env.PROD) {
        await ready();
    }

    const app = createApp(App);
    app.use(router);
    app.mount('#app');
});