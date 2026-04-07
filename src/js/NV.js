export function loadCart() {
    const savedCart = localStorage.getItem('cart');

    if (!savedCart) {
        return [];
    }

    try {
        const parsed = JSON.parse(savedCart);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Failed to parse cart from storage:', error);
        return [];
    }
}

export function getApiUrl() {
    try {
        const pathname = window.location.pathname.replace(/\/$/, '') || '/';
        if (pathname.endsWith('/admin')) {
            const base = pathname.slice(0, -'/admin'.length);
            return `${base === '' ? '' : base}/api.php`;
        }
        const nvAdmin = pathname.indexOf('/NV/admin');
        if (nvAdmin !== -1) {
            const base = pathname.slice(0, nvAdmin);
            return `${base === '' ? '' : base}/api.php`;
        }
    } catch (e) {
        console.error(e);
    }

    try {
        const scriptEl = document.querySelector('script[src*="script.js"]');

        if (scriptEl && scriptEl.src) {
            const url = new URL(scriptEl.src, window.location.origin);
            const pathSegments = url.pathname.split('/').filter(s => s);

            if (pathSegments.includes('src') && pathSegments.includes('scripts')) {
                return '/api.php';
            }

            const basePath = '../'.repeat(2);
            return basePath + 'api.php';
        }
    } catch (e) {
        console.error(e);
    }

    return '/api.php';
}