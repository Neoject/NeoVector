const NV = {
    hostname: 'window.location.hostname',
    ready: (callback) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    },
    loadCart() {
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
    },
    addToCart(product, event) {
        const cart = this.loadCart();

        const options = product.options || [];
        const optionKey = this.buildOptionKey(options);

        const existingItem = cart.find(item => {
            const itemOptionKey = item.optionKey || this.buildOptionKey(item.options || []);
            return item.id === product.id && itemOptionKey === optionKey;
        });

        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            const cartProduct = {
                ...product,
                price: product.price_sale || product.price,
                options: options,
                optionKey: optionKey,
                quantity: 1
            };
            cart.push(cartProduct);
        }

        this.saveCart(cart);

        window.dispatchEvent(new CustomEvent('cartUpdated'));
    },
    saveCart(cartItems) {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    },
    loadWishlist() {
        const savedWishlist = localStorage.getItem('wishlist');
        return savedWishlist ? JSON.parse(savedWishlist) : [];
    },

    saveWishlist(wishlist) {
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    },
    async loadProductOptions() {
        try {
            const basePath = this.getBasePath ? this.getBasePath() : '/';
            const response = await fetch(basePath + 'api.php?action=product_options', {
                credentials: 'same-origin'
            });

            if (response.ok) {
                const data = await response.json();
                return Array.isArray(data) ? data : [];
            }
            return [];
        } catch (error) {
            console.error('Error loading product options:', error);
            return [];
        }
    },
    async loadProducts() {
        try {
            const basePath = this.getBasePath ? this.getBasePath() : '/';
            const response = await fetch(basePath + 'api.php?action=products', {
                credentials: 'same-origin'
            });

            if (response.ok) {
                const data = await response.json();
                return Array.isArray(data) ? data : [];
            }

            return [];
        } catch (error) {
            console.error('Error loading products:', error);
            return [];
        }
    },
    normalizeMediaUrl(url) {
        if (!url) return '';

        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
            return url;
        }

        const basePath = this.getBasePath ? this.getBasePath() : '/';
        return basePath + url;
    },
    getBasePath() {
        const path = window.location.pathname;
        const parts = path.split('/');

        if (parts.includes('nv')) {
            const index = parts.indexOf('nv');
            return '/' + parts.slice(1, index + 1).join('/') + '/';
        }

        return '/';
    },
    buildOptionKey(options) {
        if (!options || !Array.isArray(options) || options.length === 0) {
            return '';
        }

        return options
            .map(opt => `${opt.slug || opt.name}:${opt.value}`)
            .sort()
            .join('|');
    },
    getCartItemsCount(cartItems) {
        if (!cartItems || !Array.isArray(cartItems)) {
            return 0;
        }

        return cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
    },
    getWishlistCount(wishlist) {
        return wishlist ? wishlist.length : 0;
    },
    getApiUrl() {
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
    },
    getAuth() {
        try {
            const auth = localStorage.getItem('global_auth');
            return auth ? JSON.parse(auth) : { authenticated: false, role: null, username: null };
        } catch (e) {
            return { authenticated: false, role: null, username: null };
        }
    },
    setAuth(authData) {
        localStorage.setItem('global_auth', JSON.stringify(authData));
    },
    clearAuth() {
        localStorage.removeItem('global_auth');
    },
    isAuthenticated() {
        const auth = this.getAuth();
        return auth.authenticated === true;
    },
    isAdmin() {
        const auth = this.getAuth();
        return auth.authenticated === true && auth.role === 'admin';
    },
    getUserRole() {
        const auth = this.getAuth();
        return auth.role;
    },
    getUsername() {
        const auth = this.getAuth();
        return auth.username;
    },
    async checkUserAuth() {
        try {
            const apiUrl = this.getApiUrl();
            const response = await fetch(apiUrl + '?action=user', { credentials: 'same-origin' });

            if (response.ok) {
                const me = await response.json();
                this.setAuth(me);
                return me;
            } else {
                this.clearAuth();
                return { authenticated: false, role: null, username: null };
            }
        } catch (e) {
            this.clearAuth();
            return { authenticated: false, role: null, username: null };
        }
    },
    async login(username, password, remember = false) {
        try {
            const apiUrl = this.getApiUrl();
            const form = new FormData();

            form.append('action', 'login');
            form.append('username', username);
            form.append('password', password);

            if (remember) {
                form.append('remember', '1');
            }

            const response = await fetch(apiUrl, {
                method: 'POST',
                body: form,
                credentials: 'same-origin'
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const userInfo = await this.checkUserAuth();
                this.setAuth(userInfo);
                return { success: true, role: userInfo.role, username: userInfo.username };
            } else {
                return { success: false, error: data.error || 'Login failed' };
            }
        } catch (e) {
            return { success: false, error: 'Network error' };
        }
    },
    async register(username, password, role = 'user') {
        try {
            const apiUrl = this.getApiUrl();
            const form = new FormData();

            form.append('action', 'register');
            form.append('username', username);
            form.append('password', password);
            form.append('role', role);

            const response = await fetch(apiUrl, {
                method: 'POST',
                body: form,
                credentials: 'same-origin'
            });

            const data = await response.json();

            if (response.ok && data.success) {
                return { success: true };
            }

            return { success: false, error: data.error || 'Registration failed' };
        } catch (e) {
            return { success: false, error: 'Network error' };
        }
    },
    async logout() {
        try {
            const apiUrl = this.getApiUrl();
            const form = new FormData();

            form.append('action', 'logout');

            await fetch(apiUrl, { method: 'POST', body: form, credentials: 'same-origin' });
        } catch (e) {
            console.log('Logout error:', e);
        }

        document.querySelector('.overlay.active')?.classList.remove('active');
        this.clearAuth();
    },
    async getPaymentToken(orderForm, cartItems, cartTotal) {
        const payload = {
            orderForm,
            cartItems,
            cartTotal,
        };

        const apiUrl = this.getApiUrl ? this.getApiUrl() : '/api.php';

        const response = await fetch(apiUrl + '?action=payment', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            return await response.json();
        } else {
            const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
            console.error('Payment token error:', response.status, response.statusText, errorData);
            return null;
        }
    },
    payment(orderData, onSuccess) {
        if (!orderData) {
            console.error('No order data provided for payment');
            return;
        }

        if (!orderData.orderForm) {
            console.error('Order form data is missing');
            alert('Ошибка: данные формы заказа отсутствуют');
            return;
        }

        if (!orderData.orderForm.customer_email || !orderData.orderForm.customer_email.trim()) {
            console.error('Customer email is required for online payment');
            alert('Email обязателен для онлайн-оплаты');
            return;
        }

        if (!orderData.cartItems || !Array.isArray(orderData.cartItems) || orderData.cartItems.length === 0) {
            console.error('Cart items are missing or empty');
            alert('Ошибка: корзина пуста');
            return;
        }

        if (!orderData.cartTotal || orderData.cartTotal <= 0) {
            console.error('Cart total is invalid:', orderData.cartTotal);
            alert('Ошибка: некорректная сумма заказа');
            return;
        }

        this.getPaymentToken(orderData.orderForm, orderData.cartItems, orderData.cartTotal).then(r => {
            if (r && r.checkout) {
                const redirectUrl = r.checkout.redirect_url;
                const token = r.checkout.token;

                const params = {
                    checkout_url: "https://checkout.bepaid.by",
                    fromWebview: true,
                    checkout: {
                        iframe: true,
                        test: true,
                        transaction_type: "payment"
                    },
                    token: token,
                    closeWidget: function(status) {
                        // возможные значения status
                        // successful - операция успешна
                        // failed - операция не успешна
                        // pending - ожидаем результат/подтверждение операции
                        // redirected - пользователь отправлен на внешнюю платежную систему
                        // error - ошибка (в параметрах/сети и тд)
                        // null - виджет закрыли без запуска оплаты
                        console.log(status);
                        console.debug('close widget callback');

                        if (status === 'successful' && typeof onSuccess === 'function') {
                            onSuccess(status);
                        }
                    }
                };

                new BeGateway(params).createWidget();
            } else {
                console.error('Payment token response is invalid', r);
                const errorMsg = r && r.error ? r.error : 'Не удалось получить токен платежа. Проверьте данные и попробуйте снова.';
                alert(errorMsg);
            }
        }).catch(error => {
            console.error('Payment token request failed:', error);
            alert('Ошибка при запросе токена платежа. Попробуйте позже.');
        });
    },
    async loadParams() {
        try {
            const basePath = this.getBasePath ? this.getBasePath() : '/';
            const response = await fetch(basePath + 'api.php?action=get_params', {
                credentials: 'same-origin'
            });

            if (response.ok) {
                const data = await response.json();

                const ok = (data && typeof data === 'object' && data.success === undefined) ? true : !!data?.success;
                if (!ok) return;

                this.title = data.title || '';
                this.description = data.description || '';
                this.imageMetaTags = data.image_meta_tags || '';
                this.pickupAddress = data.pickup_address ? 'Адрес магазина: ' + data.pickup_address : '';
                this.workHours = data.work_hours ? 'Время работы: ' + data.work_hours : '';
                this.storePhone = data.store_phone ? 'Мобильный телефон: ' + data.store_phone : '';
                this.deliveryBel = data.delivery_bel || '';
                this.deliveryRus = data.delivery_rus || '';
            }
        } catch (error) {
            console.error('Error loading params:', error);
        }
    },
    notifyPolicyReject() {
        Toastify({
            text: "В случае несогласия оформить доставку товара не предоставится возможным.",
            duration: 3000,
            newWindow: true,
            gravity: "bottom", // `top` or `bottom`
            position: "center", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
                background: "var(--background)",
            },
            onClick: function(){} // Callback after click
        }).showToast();
    },
    showCookieConsent() {
        const consent = localStorage.getItem('cookieConsent');

        if (consent) return;

        const container = document.createElement('div');
        container.classList.add('cookie-container')

        const text = document.createElement('div');
        text.innerHTML = 'Наш сайт использует файлы cookie для улучшения пользовательского опыта. <br>' +
            'Нажав «Принять», вы даете согласие на обработку файлов cookie.';

        const buttons = document.createElement('div');
        buttons.classList.add('btns-container');

        const acceptBtn = document.createElement('button');
        acceptBtn.classList.add('btn');
        acceptBtn.textContent = 'Принять';
        acceptBtn.style.cursor = 'pointer';

        const declineBtn = document.createElement('button');
        declineBtn.classList.add('btn');
        declineBtn.textContent = 'Отклонить';
        declineBtn.style.cursor = 'pointer';

        buttons.appendChild(acceptBtn);
        buttons.appendChild(declineBtn);

        container.appendChild(text);
        container.appendChild(buttons);

        const toast = Toastify({
            node: container,
            duration: -1,
            gravity: 'bottom',
            position: 'center',
            close: false,
            stopOnFocus: true,
            style: {
                color: "var(--text-main)",
                background: "var(--background)",
                cursor: "auto"
            },
        });

        acceptBtn.onclick = () => {
            localStorage.setItem('cookieConsent', 'accepted');
            toast.hideToast();
        };

        declineBtn.onclick = () => {
            localStorage.setItem('cookieConsent', 'declined');
            toast.hideToast();
        };

        toast.showToast();
    }
};

if (typeof window !== 'undefined') {
    window.NV = NV;
}

NV.ready(() => {
    NV.showCookieConsent();

    AOS.init({
        duration: 800,
        once: true,
        offset: 100,
        easing: 'ease-out-quart'
    });
});