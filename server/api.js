const BASE = '/api';

function req(path, options = {}) {
    return fetch(`${BASE}${path}`, {
        credentials: 'include',
        headers: options.body instanceof FormData
            ? undefined
            : { 'Content-Type': 'application/json' },
        ...options,
    });
}

const get = (path) => req(path);
const post = (path, body) => req(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) });
const put = (path, body) => req(path, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) });
const del = (path, body) => req(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined });

export const api = {
    me: () => get('/me'),
    logout: () => post('/logout'),
    register: (u, p, role) => post('/register', { username: u, password: p, role }),
    login: (u, p, rem) => post('/login', { username: u, password: p, remember: rem }),
    getProfile: () => get('/profile'),
    updateProfile: (username) => put('/profile', { username }),
    changePassword: (current_password, new_password, confirm_password) =>
        post('/change-password', { current_password, new_password, confirm_password }),
    setTitle: (title) => post('/set-title', { title }),
    getUsers: () => get('/users'),
    getProducts: () => get('/products'),
    getProduct: (id) => get(`/products/${id}`),
    addProduct: (fd) => post('/products', fd),
    updateProduct: (id, fd) => put(`/products/${id}`, fd),
    deleteProduct: (id) => del(`/products/${id}`),
    saveProductsOrder: (ids) => post('/save-products-order', { products_order: ids }),
    uploadMedia: (fd) => post('/upload-media', fd),
    addProductImages: (fd) => post('/add-product-images', fd),
    deleteProductImage: (body) => del('/delete-product-image', body),
    generateDescription: (name) => post('/generate-description', { name }),
    changeVisibility: (id, vis) => post('/product-visibility', { id, visibility: vis }),
    getCategories: () => get('/categories'),
    addCategory: (body) => post('/categories', body),
    updateCategory: (id, body) => put(`/categories/${id}`, body),
    deleteCategory: (id) => del(`/categories/${id}`),
    saveCategoriesOrder: (ids) => post('/save-categories-order', { categories_order: ids }),
    getOrders: () => get('/orders'),
    updateOrderStatus: (id, status) => post('/update-order-status', { order_id: id, status }),
    updatePaymentStatus: (id, status) => post('/update-payment-status', { order_id: id, payment_status: status }),
    deleteOrder: (id) => del('/orders', { order_id: id }),
    getPages: () => get('/pages'),
    getPageBySlug: (slug) => get(`/pages/${slug}`),
    addPage: (body) => post('/pages', body),
    updatePage: (id, body) => put(`/pages/${id}`, body),
    deletePage: (id) => del(`/pages/${id}`),
    getPageBlocks: () => get('/page-blocks'),
    addPageBlock: (body) => post('/page-blocks', body),
    updatePageBlock: (id, body) => put(`/page-blocks/${id}`, body),
    deletePageBlock: (id) => del(`/page-blocks/${id}`),
    saveBlocksOrder: (order) => post('/save-blocks-order', { blocks_order: order }),
    getHomeContent: () => get('/home-content'),
    saveHomeContent: (body) => post('/save-home-content', body),
    getParams: () => get('/params'),
    saveParams: (body) => post('/save-params', body),
    uploadLogo: (fd) => post('/upload-logo', fd),
    deleteLogo: () => del('/delete-logo'),
    uploadBackground: (fd) => post('/upload-background', fd),
    getThemeColors: () => get('/theme-colors'),
    saveColors: (colors) => post('/save-colors', { colors }),
    resetColors: () => post('/reset-colors'),
    sendContact: (name, email, message) => post('/contact', { name, email, message }),
    getMessages: () => get('/messages'),
    deleteMessage: (id) => del(`/messages/${id}`),
    getReplies: (message_id) => get(`/message-replies?message_id=${message_id}`),
    sendReply: (body) => post('/send-reply', body),
    getAnalytics: (period) => get(`/analytics?period=${period}`),
    getProductOptions: (type_id) => get(`/product-options${type_id ? `?type_id=${type_id}` : ''}`),
    saveProductOptions: (body) => post('/save-product-options', body),
    getProductTypes: () => get('/product-types'),
    saveProductTypes: (body) => post('/save-product-types', body),
};