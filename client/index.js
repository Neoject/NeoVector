import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';
// import AOS from "aos";
// import 'aos/dist/aos.css';
// import { gsap } from "gsap";


document.body.style.overflow = 'hidden';

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

    setTimeout(() => {
        const loader = document.querySelector('#load_box');
        document.body.style.overflow = 'auto';
        if (loader) loader.style.display = 'none';
    }, 500);
});