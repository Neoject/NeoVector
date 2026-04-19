import { createRouter, createWebHistory } from 'vue-router';
import { getAuth, checkUserAuth } from '../components/auth';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: () => import('../Main.vue'),
        },
        {
            path: '/product',
            component: () => import('../Product.vue')
        },
        {
            path: '/admin',
            component: () => import('../AdminLayout.vue'),
            meta: { requiresAdmin: true },
            children: [
                { path: '', name: 'admin-dashboard', component: () => import('../admin/Main.vue') },
                { path: 'products', name: 'admin-products', component: () => import('../admin/Products.vue') },
                { path: 'orders', name: 'admin-orders', component: () => import('../admin/Orders.vue') },
                { path: 'pages', name: 'admin-pages', component: () => import('../admin/Pages.vue') },
                { path: 'settings', name: 'admin-settings', component: () => import('../admin/Settings.vue') },
                { path: 'users', name: 'admin-users', component: () => import('../admin/Users.vue') },
                { path: 'analytics', name: 'admin-analytics', component: () => import('../admin/Analytics.vue') },
                { path: 'options', name: 'admin-options', component: () => import('../admin/Options.vue') },
                { path: 'profile', name: 'admin-profile', component: () => import('../admin/Profile.vue') },
                { path: 'messages', name: 'admin-messages', component: () => import('../admin/Mail.vue') },
                { path: 'messages/:id', name: 'admin-message', component: () => import('../admin/Mail.vue') },
                { path: 'messages/:id/reply', name: 'admin-message-reply', component: () => import('../admin/Mail.vue') },
            ],
        },
        {
            path: '/admin/login',
            component: () => import('../AdminLogin.vue'),
        },
        {
            path: '/:slug',
            component: () => import('../Page.vue'),
        },
    ],
});

router.beforeEach(async (to) => {
    const requiresAdmin = to.matched.some((r) => r.meta.requiresAdmin);
    if (!requiresAdmin) return true;

    const auth = getAuth();

    if (!auth.authenticated) {
        const me = await checkUserAuth();
        if (!me.authenticated || me.role !== 'admin') {
            return '/admin/login';
        }
    } else if (auth.role !== 'admin') {
        return '/admin/login';
    }

    return true;
});

export default router;