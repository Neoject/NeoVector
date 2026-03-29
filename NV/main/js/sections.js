NV.ready(() => {
    const Data = {
        data() {
            return {
                auth: NV.getAuth(),
            }
        },
        methods: {

        }
    }

    const Props = {
        mixins: [Data],
        data() {
            return {
                userMenuOpen: false,
                mobileMenuOpen: false,
                orderModalOpen: false,
                title: '',
                description: '',
                imageMetaTags: '',
                pickupAddress: '',
                workHours: '',
                storePhone: '',
                deliveryBel: '',
                deliveryRus: '',
                wishlist: [],
                cartItems: [],
                headerNavigation: {
                    main: [],
                    other: []
                },
                isMobile: false,
                isMobileDevice: false,
                currentOrderProduct: null,
                defaultVirtualPageTitleSuffix: '',
                virtualPageNotFoundDocumentTitle: 'Страница не найдена',
                virtualPageLoadErrorDocumentTitle: 'Ошибка загрузки',
            }
        },
        mounted() {
            this.loadParams().then(r => null);
            this.checkVirtualPage().then(r => null);

            if (window.history && window.history.replaceState) {
                const basePath = this.getBasePath();
                const path = this.getRelativePathFromBase();

                if (!path || path === '' || path === 'index.php') {
                    window.history.replaceState({ page: null }, '', basePath);
                } else if (!path.startsWith('product') && !path.startsWith('admin') && !path.startsWith('api.php') && !path.startsWith('assets')) {
                    const slug = path.split('/').pop();

                    if (slug) {
                        window.history.replaceState({ page: slug }, '', basePath + slug);
                    }
                }
            }
        },
        methods: {
            async loadParams() {
                try {
                    await NV.loadParams();

                    this.title = NV.title || 'eee';
                    this.description = NV.description || '';
                    this.imageMetaTags = NV.imageMetaTags || '';
                    this.pickupAddress = NV.pickupAddress || '';
                    this.workHours = NV.workHours || '';
                    this.storePhone = NV.storePhone || '';
                    this.deliveryBel = NV.deliveryBel || '';
                    this.deliveryRus = NV.deliveryRus || '';
                } catch (error) {
                    console.error('Error loading params:', error);
                }
            },
            click(event, button) {
                const target = button.target || button.link;

                if (button.linkType === 'page') {
                    event.preventDefault();

                    if (!target || target === '') {
                        this.goHome({ updateHistory: true, scrollToTop: true });
                        return;
                    }

                    const normalizedTarget = target.startsWith('/') ? target.substring(1) : target;

                    this.openVirtualPage(normalizedTarget, { updateHistory: true, scrollToTop: true }).then((page) => {
                        if (!page) {
                            this.virtualPageError = 'Страница не найдена';
                            document.title = this.virtualPageNotFoundDocumentTitle;
                        }
                    }).catch(() => {
                        this.virtualPageError = 'Ошибка загрузки страницы';
                        document.title = this.virtualPageLoadErrorDocumentTitle;
                    });
                } else if (button.linkType === 'section') {
                    event.preventDefault();
                    this.smoothScrollTo(target);
                }
            },
            getBasePath() {
                try {
                    const scriptEl = document.querySelector('script[src*="script.js"]');
                    if (scriptEl && scriptEl.src) {
                        const url = new URL(scriptEl.src, window.location.origin);
                        const pathname = url.pathname || '/';
                        const idx = pathname.lastIndexOf('/');
                        if (idx >= 0) {
                            const basePath = pathname.substring(0, idx + 1);
                            if (window.location.pathname.startsWith(basePath)) {
                                return basePath;
                            }
                        }
                    }
                } catch (e) {
                    console.warn(e);
                }

                let path = window.location.pathname;
                if (path.endsWith('/') && path.length > 1) {
                    path = path.slice(0, -1);
                }

                if (path !== '/' && path !== '') {
                    const parts = path.split('/').filter(p => p);
                    if (parts.length > 0) {
                        const lastPart = parts[parts.length - 1];
                        if (lastPart.includes('.php') || lastPart === 'product' || lastPart === 'admin' || lastPart === 'index.php') {
                            if (parts.length > 1) {
                                return '/' + parts.slice(0, -1).join('/') + '/';
                            }
                            return '/';
                        }
                        if (parts.length > 1) {
                            return '/' + parts.slice(0, -1).join('/') + '/';
                        }
                    }
                }

                return '/';
            },
            normalizeMediaUrl(path) {
                if (!path || typeof path !== 'string') {
                    return '';
                }

                let p = path.trim();
                if (!p) {
                    return '';
                }

                if (/^https?:\/\//i.test(p)) {
                    return p;
                }

                const basePath = this.getBasePath();
                const baseNoTrailing = basePath === '/' ? '' : basePath.slice(0, -1);

                if (basePath !== '/' && p.startsWith(basePath)) {
                    return p;
                }

                if (baseNoTrailing && p.startsWith(baseNoTrailing + '/')) {
                    return p;
                }

                if (p.startsWith('../')) {
                    p = p.substring(3);
                }

                if (p.startsWith('/')) {
                    return baseNoTrailing + p;
                }

                return basePath + p;
            },
            formatVirtualPageDocumentTitle(page) {
                if (!page) {
                    return '';
                }
                if (page.meta_title) {
                    return page.meta_title;
                }
                if (page.title) {
                    return page.title + (this.defaultVirtualPageTitleSuffix || '');
                }
                return '';
            },
            getLink(button) {
                if (!button) {
                    return '#';
                }

                if (button.linkType === 'page') {
                    const slug = button.link || button.target;

                    if (!slug || slug === '') {
                        return this.getBasePath();
                    }

                    const basePath = this.getBasePath();
                    const normalizedSlug = slug.startsWith('/') ? slug.substring(1) : slug;

                    return basePath + normalizedSlug;
                } else if (button.linkType === 'section') {
                    const target = button.link || button.target;
                    return '#' + target;
                } else if (button.linkType === 'url') {
                    return button.link || button.target;
                }

                return '#';
            },
            async openVirtualPage(slug, options = {}) {
                const { updateHistory = true, scrollToTop = true } = options;
                const nSlug = (slug || '').replace(/^\//, '').replace(/\/$/, '');
                const normalizedSlug = nSlug.replace(/^nv\//, '').replace(/^nv$/, '');

                if (!normalizedSlug) {
                    if (this.goHome) {
                        this.goHome({ updateHistory, scrollToTop });
                    }
                    return null;
                }

                try {
                    const page = await this.loadVirtualPage(normalizedSlug);

                    if (!page) {
                        this.currentVirtualPage = null;
                        this.virtualPageError = 'Страница не найдена';
                        return null;
                    }

                    this.currentVirtualPage = page;
                    this.virtualPageError = null;
                    this.currentProduct = null;

                    if (page.navigation_buttons && Array.isArray(page.navigation_buttons)) {
                        this.headerNavigation.other = page.navigation_buttons;
                    } else if (this.headerNavigation) {
                        this.headerNavigation.other = [];
                    }

                    document.title = this.formatVirtualPageDocumentTitle(page);

                    if (scrollToTop) {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }

                    const basePath = this.getBasePath ? this.getBasePath() : this.getBasePath();

                    if (updateHistory && window.history && window.history.pushState) {
                        window.history.pushState({ page: normalizedSlug }, '', basePath + normalizedSlug);
                    }

                    this.$nextTick(() => this.$forceUpdate);

                    return page;
                } catch (error) {
                    console.error('Error opening page:', error);
                    this.currentVirtualPage = null;
                    this.virtualPageError = 'Ошибка загрузки страницы';
                    return null;
                }
            },
            getRelativePathFromBase() {
                const basePath = this.getBasePath();
                let pathname = window.location.pathname || '/';

                if (basePath !== '/' && pathname.startsWith(basePath)) {
                    pathname = pathname.slice(basePath.length);
                } else if (pathname.startsWith('/')) {
                    pathname = pathname.substring(1);
                }

                pathname = pathname.replace(/^\/+/, '').replace(/\/+$/, '');

                return pathname;
            },
            normalizeVirtualSlug(slug) {
                const nSlug = (slug || '').replace(/^\//, '').replace(/\/$/, '');
                if (!nSlug) return '';
                return nSlug.replace(/^nv\//, '').replace(/^nv$/, '');
            },
            async checkVirtualPage() {
                const path = this.getRelativePathFromBase();
                if (!path || path === '' || path === 'index.php') return;
                if (path.startsWith('product') || path.startsWith('admin') || path.startsWith('api.php') || path.startsWith('assets')) return;

                const slug = path.split('/').filter(Boolean).join('/') || path.split('/').pop();
                const normalizedSlug = (slug || '').replace(/^nv\//, '').replace(/^nv$/, '');
                if (!normalizedSlug) return;

                const page = await this.loadVirtualPage(normalizedSlug);
                if (page) {
                    this.currentVirtualPage = page;
                    this.virtualPageError = null;
                    this.currentProduct = null;
                    this.headerNavigation.other = page.navigation_buttons && Array.isArray(page.navigation_buttons) ? page.navigation_buttons : [];
                    document.title = this.formatVirtualPageDocumentTitle(page);
                    this.$nextTick(() => this.$forceUpdate());
                    return;
                }

                this.currentVirtualPage = null;
                this.currentProduct = null;
                this.virtualPageError = 'Страница не найдена';
                document.title = this.virtualPageNotFoundDocumentTitle;
                this.$nextTick(() => this.$forceUpdate());
            },
            async loadVirtualPage(slug) {
                try {
                    const basePath = this.getBasePath();
                    const apiUrl = basePath + 'api.php?action=page&slug=' + encodeURIComponent(slug);
                    const response = await fetch(apiUrl, { credentials: 'same-origin' });

                    if (response.ok) {
                        const page = await response.json();
                        if (page && !page.error) {
                            return page;
                        }
                        return null;
                    } else if (response.status === 404) {
                        return null;
                    } else {
                        const errorData = await response.json().catch(() => ({}));
                        console.error('Error loading virtual page:', errorData.error || 'Unknown error');
                        return null;
                    }
                } catch (error) {
                    console.error('Error loading virtual page:', error);
                    return null;
                }
            },
            closeOtherMenus() {
                this.mobileMenuOpen = false;
                this.cartOpen = false;
                this.favoritesOpen = false;
            },
            smoothScrollTo(targetId) {
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            },
            getHeroBackgroundStyle(block) {
                if (!block || !block.settings || !block.settings.backgroundImage) {
                    return {};
                }

                const backgroundPosition = block.settings.backgroundPosition || 'center';
                const backgroundSize = block.settings.backgroundSize || 'cover';

                return {
                    '--hero-bg-image': 'url(' + block.settings.backgroundImage + ')',
                    '--hero-bg-position': backgroundPosition,
                    '--hero-bg-size': backgroundSize,
                    backgroundImage: 'url(' + block.settings.backgroundImage + ')',
                    backgroundPosition: backgroundPosition,
                    backgroundSize: backgroundSize,
                    backgroundRepeat: 'no-repeat'
                };
            },
            getFeatureIcon(index) {
                const icons = ['fas fa-gem', 'fas fa-tools', 'fas fa-award', 'fas fa-heart', 'fas fa-star', 'fas fa-shield-alt'];
                return icons[index] || 'fas fa-check';
            },
            hasSocialLinks(socialLinks) {
                return socialLinks && Object.values(socialLinks).some(link => link && link.trim() !== '');
            },
            removeFromCart(cartItem) {
                if (confirm('Вы действительно хотите удалить' + cartItem.name + 'из корзины?')) {
                    this.cartItems = this.cartItems.filter(item => item !== cartItem);
                    this.saveCart();
                    if (this.cartItems.length === 0 && this.orderModalOpen) {
                        this.closeOrderModal();
                    }
                }
            },
            showOverlay() {
                const overlay = document.querySelector('.overlay');

                if (overlay.classList.contains('active')) {
                    return;
                } else {
                    overlay.classList.add('active');
                }
            },
            hideOverlay() {
                const overlay = document.querySelector('.overlay');

                if (!overlay.classList.contains('active')) {
                    return;
                } else {
                    overlay.classList.remove('active');
                }
            },
            toggleMobileMenu() {
                this.mobileMenuOpen = !this.mobileMenuOpen;
            },
            closeMobileMenu() {
                this.mobileMenuOpen = false;
            },
        }
    }

    const Modal = {
        mixins: [Data],
        template: `
          <teleport to="body">
            <template v-if="isOpen" @click="zIndex = 1000">
              <div class="modal-window"
                   ref="window"
                   :style="elementStyle"
                   @mouseup="stopDrag"
                   @mouse-leave="stopDrag"
                   @mousemove="onDrag"
              >
                <div v-if="showControls"
                     class="modal-window-controls"
                     ref="draggableElement"
                     @mousedown="startDrag"
                >
                  <span class="modal-window-title">{{ this.windowTitle }}</span>
                  <span class="modal-window-close-btn" @click="closeWindow">×</span>
                </div>
                <div v-if="showHeader" class="modal-window-header">
                  <span class="modal-window-title">{{ this.windowTitle }}</span>
                  <span class="modal-window-close-btn" v-if="allowClose" @click="closeWindow">
                    <i class="fas fa-times"></i>
                  </span>
                </div>
                <div class="modal-window-content" :style="{ 'max-height': (height - 26) + 'px' }">
                  <slot></slot>
                </div>
              </div>
            </template>
          </teleport>
        `,
        data() {
            return {
                isDragging: false,
                zIndex: 1000,
                startX: 0,
                startY: 0,
                offsetX: window.innerWidth / 2,
                offsetY: window.innerHeight / 3,
                width: 0,
                height: 0,
                showControls: false
            }
        },
        props: {
            windowTitle: {
                type: String,
                default: ''
            },
            isOpen: {
                type: Boolean,
                default: false
            },
            allowClose: {
                type: Boolean,
                default: false
            },
            showHeader: {
                type: Boolean,
                default: false
            },
            showControls: {
                type: Boolean,
                default: false
            },
            params: {
                type: Object,
                default: { }
            }
        },
        mounted() {
            document.addEventListener('mouseup', () => { this.stopDrag() });
            document.addEventListener('mousemove', (e) => { this.onDrag(e) });

            document.addEventListener('click', this.handleClickOutside);

            if (this.params['width']) {
                this.width = this.params['width'];
            }

            if (this.params['height']) {
                this.height = this.params['height'];
            }
        },
        beforeUnmount() {
            document.removeEventListener('click', this.handleClickOutside);
        },
        computed: {
            elementStyle() {
                return {
                    position: 'fixed',
                    left: this.offsetX + 'px',
                    top: this.offsetY + 'px',
                    userSelect: 'none',
                    width: this.width ? this.width + 'px' : '',
                    height: this.height ? this.height + 'px' : '',
                    zIndex: this.zIndex
                };
            },
        },
        methods: {
            startDrag(event) {
                this.isDragging = true;
                this.startX = event.clientX - this.offsetX;
                this.startY = event.clientY - this.offsetY;
            },
            computed: {
                elementStyle() {
                    return {
                        position: 'absolute',
                        left: this.offsetX + 'px',
                        top: this.offsetY + 'px',
                        userSelect: 'none',
                        width: this.width ? this.width + 'px' : '',
                        height: this.height ? this.height + 'px' : '',
                        zIndex: this.zIndex
                    };
                },
            },
            onDrag(event) {
                if (this.isDragging) {
                    this.offsetX = event.clientX - this.startX;
                    this.offsetY = event.clientY - this.startY;

                    if (this.offsetX <= 0) {
                        this.offsetX = 0;
                    }

                    if (this.offsetY <= 0) {
                        this.offsetY = 0;
                    }
                }
            },
            stopDrag() {
                this.isDragging = false;
            },
            closeWindow() {
                this.$emit('close');
            },
            handleClickOutside() {
                if (this.$refs.window && !this.$refs.window.contains(event.target)) {
                    this.zIndex = 999;
                } else {
                    this.zIndex = 1000;
                }
            }
        }
    }

    const Cart = {
        template: `
        
        `,
        data() {
            return {

            }
        },
        methods: {

        }
    }

    const Login = {
        mixins: [Data, Props],
        components: {
            modal: Modal
        },
        template: `
          <modal
              :is-open="showLogin"
              :window-title="'Вход'"
              :allow-close="true"
              :show-header="true"
          >
            <div class="form-group">
              <label>Логин</label>
              <input v-model.trim="loginData.username" type="text" placeholder="Введите логин">
            </div>
            <div class="form-group">
              <label>Пароль</label>
              <input v-model="loginData.password" type="password" placeholder="Введите пароль">
            </div>
            <div class="form-group" style="display:flex;align-items:center;gap:8px;">
              <input id="remember-me" v-model="loginData.remember" type="checkbox" style="width:auto;">
              <label for="remember-me" style="margin:0;">Запомнить меня</label>
            </div>
            <p v-if="loginError" class="error-message">{{ loginError }}</p>
            <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px;">
              <button class="btn btn-outline" @click="closeLogin">Отмена</button>
              <button class="btn btn-primary" :disabled="loginLoading" @click="doLogin">
                {{ loginLoading ? 'Входим...' : 'Войти' }}
              </button>
            </div>
            <p style="margin-top:14px;">
              Нет аккаунта?
              <a href="#" @click.prevent="goToRegister">Зарегистрироваться</a>
            </p>
          </modal>
        `,
        data() {
            return {
                showLogin: false,
                loginData: {
                    username: '',
                    password: '',
                    remember: false
                },
                loginLoading: false,
                loginError: '',
            }
        },
        methods: {
            async doLogin() {
                this.loginError = '';
                this.loginLoading = true;
                try {
                    const result = await NV.login(
                        this.loginData.username,
                        this.loginData.password,
                        this.loginData.remember
                    );

                    if (result.success) {
                        this.auth = await NV.checkUserAuth();

                        if (this.loginData.remember) {
                            localStorage.setItem('remember_username', this.loginData.username);
                        } else {
                            localStorage.removeItem('remember_username');
                        }
                        this.closeLogin();
                    } else {
                        this.loginError = result.error || 'Ошибка входа';
                    }
                } catch (err) {
                    this.loginError = err.message || 'Ошибка входа';
                }

                this.loginLoading = false;
                window.location.reload();
            },
            openLogin() {
                this.loginError = '';
                this.$root.$refs.authRegister?.closeRegister?.();
                this.showLogin = true;
                this.userMenuOpen = false;
                this.closeMobileMenu();
            },
            goToRegister() {
                this.$root.$refs.authRegister?.openRegister?.();
            },
            closeLogin() {
                this.showLogin = false;
                this.loginData = { username: '', password: '', remember: false };
                this.loginError = '';
            },
        }
    }

    const Register = {
        mixins: [Data],
        components: {
            modal: Modal
        },
        template: `
            <modal
                :is-open="showRegister"
                :window-title="'Регистрация'"
                :allow-close="true"
                :show-header="true"
            >
              <div class="form-group">
                <label>Логин</label>
                <input v-model.trim="registerData.username" type="text" placeholder="Придумайте логин">
              </div>
              <div class="form-group">
                <label>Пароль</label>
                <input v-model="registerData.password" type="password" placeholder="Минимум 6 символов">
              </div>
              <div class="form-group">
                <label>Подтвердите пароль</label>
                <input v-model="registerData.confirmPassword" type="password" placeholder="Повторите пароль">
              </div>
              <p v-if="registerError" class="error-message">{{ registerError }}</p>
              <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px;">
                <button class="btn btn-outline" @click="closeRegister">Отмена</button>
                <button class="btn btn-primary" :disabled="registerLoading" @click="doRegister">
                  {{ registerLoading ? 'Регистрируем...' : 'Зарегистрироваться' }}
                </button>
              </div>
              <p style="margin-top:14px;">
                Уже есть аккаунт?
                <a href="#" @click.prevent="goToLogin">Войти</a>
              </p>
            </modal>
        `,
        data() {
            return {
                showRegister: false,
                registerData: {
                    username: '',
                    password: '',
                    confirmPassword: ''
                },
                registerLoading: false,
                registerError: '',
            }
        },
        methods: {
            openRegister() {
                this.registerError = '';
                this.$root.$refs.authLogin?.closeLogin?.();
                this.showRegister = true;
                this.userMenuOpen = false;
                this.closeMobileMenu();
            },
            goToLogin() {
                this.$root.$refs.authLogin?.openLogin?.();
            },
            closeRegister() {
                this.showRegister = false;
                this.registerData = { username: '', password: '', confirmPassword: '' };
                this.registerError = '';
            },
            async doRegister() {
                this.registerError = '';

                const username = (this.registerData.username || '').trim();
                const password = this.registerData.password || '';
                const confirmPassword = this.registerData.confirmPassword || '';

                if (!username || !password) {
                    this.registerError = 'Введите логин и пароль';
                    return;
                }
                if (password.length < 6) {
                    this.registerError = 'Пароль должен быть не короче 6 символов';
                    return;
                }
                if (password !== confirmPassword) {
                    this.registerError = 'Пароли не совпадают';
                    return;
                }

                this.registerLoading = true;
                try {
                    const result = await NV.register(username, password, 'user');

                    if (!result.success) {
                        this.registerError = result.error || 'Ошибка регистрации';
                        return;
                    }

                    const loginResult = await NV.login(username, password, false);
                    if (loginResult.success) {
                        this.auth = await NV.checkUserAuth();
                        this.closeRegister();
                    } else {
                        this.closeRegister();
                        const loginRef = this.$root.$refs.authLogin;

                        if (loginRef) {
                            loginRef.loginData.username = username;
                            loginRef.loginError = 'Регистрация успешна. Войдите в аккаунт.';
                            loginRef.openLogin();
                        }
                    }
                } catch (err) {
                    this.registerError = err.message || 'Ошибка регистрации';
                } finally {
                    this.registerLoading = false;
                    window.location.reload();
                }
            },
        }
    }

    const Order = {
        mixins: [Data, Props],
        template: `
          <div class="order-modal" @click.self="closeOrderModal">
            <div class="order-modal-content">
              <div class="order-header">
                <h3>Оформление заказа</h3>
                <button class="close-icon" @click.stop.prevent="closeOrderModal()">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="order-content">
                <div class="order-summary">
                  <h4>Ваш заказ</h4>
                  <div class="order-items">
                    <div v-if="currentOrderProduct" class="order-item">
                      <img
                          :src="currentOrderProduct.image.startsWith('/') ? currentOrderProduct.image : '/' + currentOrderProduct.image"
                          :alt="currentOrderProduct.name" class="order-item-img"
                          loading="lazy" decoding="async">
                      <div class="order-item-details">
                        <h5>{{ currentOrderProduct.name }}</h5>
                        <template v-if="currentOrderProduct.options && currentOrderProduct.options.length">
                          <p v-for="option in currentOrderProduct.options"
                             :key="'order-product-option-' + option.slug">
                            {{ option.name }}: {{ option.value }}
                          </p>
                        </template>
                        <p>{{ currentOrderProduct.material }}</p>
                        <div class="order-item-quantity">
                          <span>
                            Количество:
                            <button type="button" class="qty-btn"
                                    @click="decreaseCurrentOrderQuantity">−</button>
                            <strong>{{ currentOrderProduct.quantity }}</strong>
                            <button type="button" class="qty-btn"
                                    @click="increaseCurrentOrderQuantity">+</button>
                          </span>
                          <span class="order-item-price">{{
                              currentOrderProduct.price *
                              currentOrderProduct.quantity
                            }} руб.</span>
                        </div>
                      </div>
                    </div>
                    <div v-else v-for="item in cartItems" :key="item.id + '-' + (item.optionKey || item.hand || '')"
                         class="order-item">
                      <img :src="item.image.startsWith('/') ? item.image : '/' + item.image" :alt="item.name"
                           class="order-item-img" loading="lazy" decoding="async">
                      <div class="order-item-details">
                        <div class="cart-item-title-content">
                          <h5>{{ item.name }}</h5>
                          <span @click="removeFromCart(item)" class="remove-item-btn"><i
                              class="fa-solid fa-xmark"></i></span>
                        </div>
                        <template v-if="item.options && item.options.length">
                          <p v-for="option in item.options" :key="'order-cart-option-' + tem.id + '-' + option.slug">
                            {{ option.name }}: {{ option.value }}
                          </p>
                        </template>
                        <p>{{ item.material }}</p>
                        <div class="order-item-quantity">
                          <span>
                            Количество:
                            <button type="button" class="qty-btn" @click="decreaseQuantity(item)">−</button>
                            <strong>{{ item.quantity }}</strong>
                            <button type="button" class="qty-btn" @click="increaseQuantity(item)">+</button>
                          </span>
                          <span class="order-item-price">{{ item.price * item.quantity }} руб.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="order-total">
                    <span>
                        Итого:
                      {{
                        (currentOrderProduct ? currentOrderProduct.price * currentOrderProduct.quantity : cartTotal)
                        +
                        (orderForm.delivery_type === 'delivery'
                                ? (
                                    orderForm.delivery_city && orderForm.delivery_city.includes('Беларусь')
                                        ? deliveryBel
                                        : (orderForm.delivery_city ? deliveryRus : 0)
                                )
                                : 0
                        )
                      }} руб.
                    </span>
                  </div>
                </div>
                <form @submit.prevent="submitOrder" class="order-form">
                  <div class="form-section">
                    <h4>Контактная информация</h4>
                    <div class="form-group">
                      <label for="customer_name">Имя *</label>
                      <input type="text" id="customer_name" v-model="orderForm.customer_name"
                             @input="fieldErrors.customer_name = ''" required>
                      <div v-if="fieldErrors.customer_name" class="field-tooltip">{{ fieldErrors.customer_name }}</div>
                    </div>
                    <div class="form-group">
                      <label for="customer_phone">Телефон *</label>
                      <input type="tel" id="customer_phone" v-model="orderForm.customer_phone"
                             @input="fieldErrors.customer_phone = ''" required>
                      <div v-if="fieldErrors.customer_phone" class="field-tooltip">{{ fieldErrors.customer_phone }}
                      </div>
                    </div>
                    <div class="form-group">
                      <label for="customer_email">
                        Email<span v-if="orderForm.payment_type === 'online'"> *</span>
                      </label>
                      <input
                          type="email"
                          id="customer_email"
                          v-model="orderForm.customer_email"
                          :required="orderForm.payment_type === 'online'"
                      >
                    </div>
                  </div>
                  <div class="form-section">
                    <h4>Способ получения</h4>
                    <div class="delivery-options">
                      <label class="delivery-option">
                        <input type="radio" v-model="orderForm.delivery_type" value="pickup"
                               @change="onDeliveryTypeChange">
                        <div class="delivery-option-content">
                          <i class="fas fa-store"></i>
                          <div>
                            <span class="delivery-option-title">Самовывоз</span>
                            <span class="delivery-option-description">Забрать в магазине</span>
                          </div>
                        </div>
                      </label>
                      <label class="delivery-option">
                        <input type="radio" v-model="orderForm.delivery_type" value="delivery"
                               @change="onDeliveryTypeChange" :disabled="deliveryAvailable ? false : true">
                        <div class="delivery-option-content">
                          <i class="fas fa-truck"></i>
                          <div>
                            <span class="delivery-option-title">Доставка</span>
                            <span class="delivery-option-description">Доставка по адресу</span>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                  <div v-if="orderForm.delivery_type === 'delivery'" class="form-section delivery-details">
                    <h4>Детали доставки</h4>
                    <div class="form-group autocomplete">
                      <label for="delivery_city">Город *</label>
                      <div>
                        <input type="text" id="delivery_city" v-model="orderForm.delivery_city" @input="onCityInput"
                               @blur="onCityBlur" autocomplete="off" placeholder="Введите свой город"
                               :class="{ 'invalid': deliveryCityError || fieldErrors.delivery_city }">
                        <span class="clear-input fas fa-x" @click="clearInput('city')"></span>
                      </div>
                      <p class="input-hint">Укажите свой город</p>
                      <div v-if="citySearchLoading" class="autocomplete-status">Ищем города...</div>
                      <div v-else-if="orderForm.delivery_city && !citySuggestions.length && !deliveryCityValid"
                           class="autocomplete-status warning">
                        Город не найден
                      </div>
                      <ul v-if="citySuggestions.length" class="autocomplete-list">
                        <li v-for="city in citySuggestions" :key="city.place_id"
                            @mousedown.prevent="selectCity(city)">
                          <span>{{ city.label }}</span>
                          <small v-if="city.region">{{ city.region }}</small>
                        </li>
                      </ul>
                      <p v-if="deliveryCityError" class="input-error">{{ deliveryCityError }}</p>
                      <div v-if="fieldErrors.delivery_city" class="field-tooltip">{{ fieldErrors.delivery_city }}</div>
                    </div>
                    <div class="form-group autocomplete">
                      <label for="delivery_street">Улица *</label>
                      <div>
                        <input type="text" id="delivery_street" v-model="orderForm.delivery_street"
                               @input="onStreetInput" @blur="onStreetBlur" :disabled="!deliveryCityValid"
                               autocomplete="off" placeholder="Введите улицу"
                               :class="{ 'invalid': deliveryStreetError || fieldErrors.delivery_street }">
                        <span class="clear-input fas fa-x" @click="clearInput('street')"></span>
                      </div>
                      <p class="input-hint">Сначала выберите город, затем улицу</p>
                      <div v-if="streetSearchLoading" class="autocomplete-status">Ищем улицы...</div>
                      <div v-else-if="orderForm.delivery_street && !streetSuggestions.length && !deliveryStreetValid"
                           class="autocomplete-status warning">
                        Улица не найдена
                      </div>
                      <ul v-if="streetSuggestions.length" class="autocomplete-list">
                        <li v-for="street in streetSuggestions" :key="street.place_id"
                            @mousedown.prevent="selectStreet(street)">
                          <span>{{ street.label }}</span>
                        </li>
                      </ul>
                      <p v-if="deliveryStreetError" class="input-error">{{ deliveryStreetError }}</p>
                      <div v-if="fieldErrors.delivery_street" class="field-tooltip">{{ fieldErrors.delivery_street }}
                      </div>
                    </div>
                    <div class="form-group">
                      <label for="delivery_building">Дом / квартира *</label>
                      <input type="text" id="delivery_building" v-model="orderForm.delivery_building"
                             @input="fieldErrors.delivery_building = ''" placeholder="Например: д. 10, кв. 15" required>
                      <div v-if="fieldErrors.delivery_building" class="field-tooltip">
                        {{ fieldErrors.delivery_building }}
                      </div>
                    </div>
                    <div class="delivery-address-preview" v-if="deliveryAddressPreview">
                      <strong>Адрес доставки:</strong>
                      <span>{{ deliveryAddressPreview }}</span>
                    </div>
                    <div class="form-row">
                      <div class="form-group">
                        <label for="delivery_date">Дата доставки</label>
                        <input type="date" id="delivery_date" v-model="orderForm.delivery_date" :min="today">
                      </div>
                      <div class="form-group">
                        <label for="delivery_time">Время доставки</label>
                        <input type="time" id="delivery_time" v-model="orderForm.delivery_time">
                      </div>
                    </div>
                    <span>
                        Стоимость доставки:
                        <span id="delivery_price">
                           {{
                            orderForm.delivery_city ? orderForm.delivery_city.includes('Беларусь')
                                    ? deliveryBel
                                    : (orderForm.delivery_city ? deliveryRus : 0)
                                : 0
                          }}
                        </span> руб.
                    </span>
                  </div>
                  <div v-if="orderForm.delivery_type === 'pickup'" class="form-section pickup-details">
                    <h4>Информация о самовывозе</h4>
                    <div class="pickup-info">
                      <p id="pickup_address"><i class="fas fa-map-marker-alt"></i></p>
                      <p id="work_hours"><i class="fas fa-clock"></i></p>
                      <p id="store_phone"><i class="fas fa-phone"></i></p>
                    </div>
                  </div>
                  <div class="form-section">
                    <h4>Способ оплаты</h4>
                    <div class="payment-options">
                      <label class="payment-option">
                        <input type="radio" v-model="orderForm.payment_type" value="cash">
                        <div class="payment-option-content">
                          <i class="fa-solid fa-wallet"></i>
                          <div>
                            <span class="payment-option-title">Наличными</span>
                            <span class="payment-option-description">При получении</span>
                          </div>
                        </div>
                      </label>
                      <label class="payment-option">
                        <input type="radio" v-model="orderForm.payment_type" value="online">
                        <div class="payment-option-content">
                          <i class="fa-solid fa-credit-card"></i>
                          <div>
                            <span class="payment-option-title">Онлайн</span>
                            <span class="payment-option-description">оплата картой</span>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                  <div class="form-section">
                    <h4>Дополнительно</h4>
                    <div class="form-group">
                      <label for="order_notes">Комментарий к заказу</label>
                      <textarea id="order_notes"
                                v-model="orderForm.notes"
                                rows="3"
                                placeholder="Дополнительные пожелания..."
                      >
                      </textarea>
                    </div>
                  </div>
                  <div class="form-section">
                    <div class="form-group checkbox-form">
                      <input id="privacy-policy-yes" type="checkbox" v-model="policyYes" @change="policyChange('yes')">
                      <label class="checkbox-label" for="privacy-policy-yes">
                        Согласен с
                        <a href="/policy" target="_blank">политикой обработки персональных данных</a>
                      </label>
                      <div v-if="fieldErrors.policy" class="field-tooltip">{{ fieldErrors.policy }}</div>
                    </div>
                    <div class="form-group checkbox-form">
                      <input id="privacy-policy-no" type="checkbox" v-model="policyNo" @change="policyChange('no')">
                      <label class="checkbox-label" for="privacy-policy-no">
                        Не согласен с политикой обработки персональных данных
                      </label>
                    </div>
                  </div>
                  <div v-if="orderError" class="error-message">{{ orderError }}</div>
                  <div v-if="orderSuccess" class="success-message">{{ orderSuccess }}</div>
                  <div class="order-actions">
                    <button type="button" class="btn btn-secondary" @click.stop.prevent="closeOrderModal()">Отмена</button>
                    <button v-if="orderForm.payment_type === 'online'"
                            type="button"
                            class="btn btn-primary"
                            @click="handleOnlinePayment"
                            :disabled="orderLoading || (!policyYes && !policyNo)"
                    >
                      {{ orderLoading ? 'Оформляем заказ...' : 'Оформить заказ' }}
                    </button>
                    <button v-else type="submit"
                            class="btn btn-primary"
                            :disabled="orderLoading || (!policyYes && !policyNo)"
                    >
                      {{ orderLoading ? 'Оформляем заказ...' : 'Оформить заказ' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        `,
        data() {
            return {
                currentOrderProduct: null,
                orderForm: {
                    customer_name: '',
                    customer_phone: '',
                    customer_email: '',
                    delivery_type: 'pickup',
                    delivery_city: '',
                    delivery_street: '',
                    delivery_building: '',
                    delivery_date: '',
                    delivery_time: '',
                    delivery_price: 0,
                    payment_type: 'cash',
                    notes: ''
                },
                fieldErrors: {
                    customer_name: '',
                    customer_phone: '',
                    delivery_city: '',
                    delivery_street: '',
                    delivery_building: '',
                    policy: ''
                },
                dadataToken: '7c958262d9f01a263e77984b8ee106c01816709a',
                citySuggestions: [],
                streetSuggestions: [],
                citySearchLoading: false,
                streetSearchLoading: false,
                citySearchTimeout: null,
                streetSearchTimeout: null,
                citySearchAbortController: null,
                streetSearchAbortController: null,
                deliveryCityValid: false,
                deliveryStreetValid: false,
                selectedCityData: null,
                selectedStreetData: null,
                deliveryCityError: '',
                deliveryStreetError: '',
                orderLoading: false,
                orderError: '',
                orderSuccess: '',
                policyYes: false,
                policyNo: false,
                deliveryAvailable: true,
                pickupAddress: '',
                workHours: '',
                storePhone: '',
                deliveryBel: '',
                deliveryRus: '',
            }
        },
        watch: {
            orderModalOpen(newVal) {
                if (newVal) {
                    this.$nextTick(() => {
                        this.fillPickupParams();
                    });
                }
            }
        },
        methods: {
            policy() {
                return !!this.policyYes && !this.policyNo;
            },
            deliveryAddressPreview() {
                if (this.orderForm.delivery_type !== 'delivery') {
                    return '';
                }
                return this.buildDeliveryAddress();
            },
            openOrderModal() {
                const hasCurrentProduct = !!this.currentOrderProduct;
                const hasCartItems = Array.isArray(this.cartItems) && this.cartItems.length > 0;

                if (!hasCurrentProduct && !hasCartItems) {
                    alert('Корзина пуста');
                    return;
                }

                this.orderModalOpen = true;
                this.closeCart();
                this.orderError = '';
                this.orderSuccess = '';
            },
            closeOrderModal() {
                this.orderModalOpen = false;
                this.orderError = '';
                this.orderSuccess = '';
                this.currentOrderProduct = null;
                this.$emit('close');
                this.selectingHandProductId = null;
            },
            increaseCurrentOrderQuantity() {
                if (!this.currentOrderProduct) return;
                const currentQty = Number(this.currentOrderProduct.quantity || 1) || 1;
                this.currentOrderProduct.quantity = currentQty + 1;
            },
            decreaseCurrentOrderQuantity() {
                if (!this.currentOrderProduct) return;
                const currentQty = Number(this.currentOrderProduct.quantity || 1) || 1;
                if (currentQty <= 1) {
                    return;
                }
                this.currentOrderProduct.quantity = currentQty - 1;
            },
            handleProductCardClick(event, product) {
                if (this.isMobile) {
                    const isButtonClick = event.target.closest('button') !== null;

                    if (!isButtonClick) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }
            },
            onCityInput() {
                this.deliveryCityError = '';
                this.fieldErrors.delivery_city = '';
                this.deliveryCityValid = false;
                this.selectedCityData = null;
                this.resetStreetData();

                const query = (this.orderForm.delivery_city || '').trim();

                if (this.citySearchTimeout) clearTimeout(this.citySearchTimeout);

                if (!query || query.length < 2) {
                    this.citySuggestions = [];
                    return;
                }

                this.citySearchTimeout = setTimeout(() => {
                    this.searchCity(query).then(r => null);
                }, 300);
            },
            onCityBlur() {
                if (!this.orderForm.delivery_city.trim()) {
                    this.deliveryCityError = 'Укажите город доставки';
                    this.citySuggestions = [];
                    return;
                }
                if (!this.deliveryCityValid) {
                    this.deliveryCityError = 'Выберите город из списка';
                }
                this.citySuggestions = [];
            },
            async searchCity(query) {
                if (!this.dadataToken) {
                    console.warn('Dadata token is missing. Cannot perform city search.');
                    return;
                }

                if (!query || query.trim().length < 2) {
                    this.citySuggestions = [];
                    return;
                }

                this.citySearchLoading = true;

                try {
                    const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': 'Token' + this.dadataToken
                        },
                        body: JSON.stringify({
                            query: query,
                            count: 10,
                            locations: [
                                { country: 'Беларусь' },
                                { country_iso_code: 'BY' }
                            ],
                            restrict_value: true,
                            from_bound: { value: 'city' },
                            to_bound: { value: 'city' }
                        })
                    });

                    const result = await response.json()

                    this.citySuggestions = Array.isArray(result?.suggestions)
                        ? result.suggestions.map(s => ({
                            label: s.value,
                            value: s.value,
                            data: s.data,
                            raw: s
                        }))
                        : [];

                    if (!result.suggestions.length) {
                        const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'Authorization': 'Token' + this.dadataToken
                            },
                            body: JSON.stringify({
                                query: query,
                                count: 10,
                                locations: [
                                    { country: 'Россия' },
                                    { country_iso_code: 'RU' }
                                ],
                                restrict_value: true,
                                from_bound: { value: 'city' },
                                to_bound: { value: 'city' }
                            })
                        });

                        const result = await response.json()

                        this.citySuggestions = Array.isArray(result?.suggestions)
                            ? result.suggestions.map(s => ({
                                label: s.value,
                                value: s.value,
                                data: s.data,
                                raw: s
                            }))
                            : [];
                    }
                } catch (err) {
                    console.error('Dadata city error:', err);
                    this.deliveryCityError = 'Ошибка поиска городов. Попробуйте позже.';
                } finally {
                    this.citySearchLoading = false;
                }
            },
            formatCitySuggestion(place) {
                if (!place || !place.address) {
                    return null;
                }

                const label = this.normalizeCityName(place.address);

                if (!label) {
                    return null;
                }
                return {
                    place_id: place.place_id,
                    label,
                    region: place.address.state || place.address.region || place.address.county || '',
                    raw: place
                };
            },
            selectCity(city) {
                if (!city) return;

                this.orderForm.delivery_city = city.label;
                this.deliveryCityValid = true;
                this.selectedCityData = city.data;  // тут вся инфа: kladr_id, fias_id, region, etc.
                this.deliveryCityError = '';
                this.citySuggestions = [];
                this.resetStreetData();
                // this.orderForm.delivery_postcode = city.data.postal_code || '';
            },
            onStreetInput() {
                this.deliveryStreetError = '';
                this.fieldErrors.delivery_street = '';
                this.deliveryStreetValid = false;

                const query = (this.orderForm.delivery_street || '').trim();

                if (this.streetSearchTimeout) clearTimeout(this.streetSearchTimeout);

                if (!query || query.length < 2) {
                    this.streetSuggestions = [];
                    return;
                }

                this.streetSearchTimeout = setTimeout(() => {
                    this.searchStreet(query);
                }, 300);
            },
            onStreetBlur() {
                if (!this.orderForm.delivery_street.trim()) {
                    this.deliveryStreetError = 'Укажите улицу доставки';
                    this.streetSuggestions = [];
                    return;
                }
                if (!this.deliveryStreetValid) {
                    this.deliveryStreetError = 'Выберите улицу из списка';
                }
                this.streetSuggestions = [];
            },
            async searchStreet(query) {
                if (!this.dadataToken) {
                    console.warn('Dadata token is missing. Cannot perform street search.');
                    this.streetSuggestions = [];
                    return;
                }

                if (!this.selectedCityData) {
                    this.streetSuggestions = [];
                    return;
                }

                if (!query || query.trim().length < 2) {
                    this.streetSuggestions = [];
                    return;
                }

                this.streetSearchLoading = true;

                try {
                    const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': 'Token' + this.dadataToken
                        },
                        body: JSON.stringify({
                            query: query,
                            count: 15,
                            locations: [
                                {
                                    country: 'Беларусь',
                                    region_fias_id: this.selectedCityData.region_fias_id,
                                    area_fias_id: this.selectedCityData.area_fias_id || null,
                                    city_fias_id: this.selectedCityData.city_fias_id || null,
                                    settlement_fias_id: this.selectedCityData.settlement_fias_id || null
                                }
                            ],
                            restrict_value: true,
                            from_bound: { value: 'street' },
                            to_bound: { value: 'street' }
                        })
                    });

                    const result = await response.json();

                    this.streetSuggestions = Array.isArray(result?.suggestions)
                        ? result.suggestions.map(s => ({
                            label: s.value,
                            value: s.value,
                            data: s.data,
                            raw: s
                        }))
                        : [];

                    if (!result.suggestions.length) {
                        const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'Authorization': 'Token' + this.dadataToken
                            },
                            body: JSON.stringify({
                                query: query,
                                count: 15,
                                locations: [
                                    {
                                        country: 'Россия',
                                        region_fias_id: this.selectedCityData.region_fias_id,
                                        area_fias_id: this.selectedCityData.area_fias_id || null,
                                        city_fias_id: this.selectedCityData.city_fias_id || null,
                                        settlement_fias_id: this.selectedCityData.settlement_fias_id || null
                                    }
                                ],
                                restrict_value: true,
                                from_bound: { value: 'street' },
                                to_bound: { value: 'street' }
                            })
                        });

                        const result = await response.json();

                        this.streetSuggestions = Array.isArray(result?.suggestions)
                            ? result.suggestions.map(s => ({
                                label: s.value,
                                value: s.value,
                                data: s.data,
                                raw: s
                            }))
                            : [];
                    }
                } catch (err) {
                    console.error('Dadata street error:', err);
                    this.deliveryStreetError = 'Ошибка поиска улиц.';
                } finally {
                    this.streetSearchLoading = false;
                }
            },
            formatStreetSuggestion(place) {
                if (!place || !place.address) {
                    return null;
                }
                const label = this.normalizeStreetName(place.address);
                if (!label) {
                    return null;
                }
                return {
                    place_id: place.place_id,
                    label,
                    raw: place
                };
            },
            selectStreet(street) {
                if (!street) return;

                this.orderForm.delivery_street = street.label.replace(/^ул\.?\s+/i, '');
                this.deliveryStreetValid = true;
                this.selectedStreetData = street.data;
                this.deliveryStreetError = '';
                this.streetSuggestions = [];
            },
            resetStreetData() {
                this.orderForm.delivery_street = '';
                this.deliveryStreetValid = false;
                this.selectedStreetData = null;
                this.streetSuggestions = [];
                this.orderForm.delivery_building = '';
                this.deliveryStreetError = '';
            },
            normalizeCityName(address) {
                if (!address) {
                    return '';
                }
                return address.city || address.town || address.village || address.hamlet || address.municipality || address.state || '';
            },
            normalizeStreetName(address) {
                if (!address) {
                    return '';
                }
                return address.road || address.residential || address.pedestrian || address.footway || address.cycleway || address.path || '';
            },
            buildDeliveryAddress() {
                if (this.orderForm.delivery_type !== 'delivery') {
                    return '';
                }
                const parts = [];
                if (this.orderForm.delivery_city) {
                    parts.push(this.orderForm.delivery_city);
                }
                if (this.orderForm.delivery_street) {
                    parts.push('ул.' + this.orderForm.delivery_street);
                }
                if (this.orderForm.delivery_building) {
                    parts.push(this.orderForm.delivery_building);
                }
                return parts.join(', ');
            },
            onDeliveryTypeChange() {
                if (this.orderForm.delivery_type === 'pickup') {
                    this.orderForm.delivery_city = '';
                    this.orderForm.delivery_street = '';
                    this.orderForm.delivery_building = '';
                    this.orderForm.delivery_date = '';
                    this.orderForm.delivery_time = '';
                    this.deliveryCityValid = false;
                    this.deliveryStreetValid = false;
                    this.selectedCityData = null;
                    this.selectedStreetData = null;
                    this.citySuggestions = [];
                    this.streetSuggestions = [];
                    this.deliveryCityError = '';
                    this.deliveryStreetError = '';
                }
            },
            async submitOrder() {
                this.orderLoading = true;
                this.orderError = '';
                this.orderSuccess = '';

                try {
                    const email = (this.orderForm.customer_email || '').trim();
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                    if (!this.orderForm.customer_name.trim()) {
                        this.orderLoading = false;
                        this.scrollToField('customer_name', 'Имя обязательно для заполнения');
                        return;
                    }
                    if (!this.orderForm.customer_phone.trim()) {
                        this.orderLoading = false;
                        this.scrollToField('customer_phone', 'Телефон обязателен для заполнения');
                        return;
                    }
                    if (!this.validatePhoneFormat(this.orderForm.customer_phone.trim())) {
                        this.orderLoading = false;
                        this.scrollToField('customer_phone', 'Введите корректный номер телефона. Формат: +375 (XX) XXX-XX-XX или 8 (0XX) XXX-XX-XX');
                        return;
                    }
                    if (this.orderForm.payment_type === 'online') {
                        if (!email) {
                            this.orderLoading = false;
                            this.scrollToField('customer_email', 'Email обязателен для онлайн-оплаты');
                            return;
                        }
                        if (!emailRegex.test(email)) {
                            this.orderLoading = false;
                            this.scrollToField('customer_email', 'Введите корректный email');
                            return;
                        }
                    }
                    if (this.orderForm.delivery_type === 'delivery') {
                        if (!this.deliveryCityValid || !this.orderForm.delivery_city.trim()) {
                            throw new Error('Выберите существующий город Беларуси из списка');
                        }
                        if (!this.deliveryStreetValid || !this.orderForm.delivery_street.trim()) {
                            throw new Error('Выберите улицу в выбранном городе');
                        }
                        if (!this.orderForm.delivery_building.trim()) {
                            throw new Error('Укажите номер дома или квартиры');
                        }
                    }

                    const deliveryAddress = this.orderForm.delivery_type === 'delivery'
                        ? this.buildDeliveryAddress()
                        : '';

                    const orderData = {
                        action: 'create_order',
                        customer_name: this.orderForm.customer_name.trim(),
                        customer_phone: this.orderForm.customer_phone.trim(),
                        customer_email: email,
                        delivery_type: this.orderForm.delivery_type,
                        delivery_address: deliveryAddress,
                        delivery_date: this.orderForm.delivery_date,
                        delivery_time: this.orderForm.delivery_time,
                        payment_type: this.orderForm.payment_type || 'cash',
                        order_items: JSON.stringify(this.currentOrderProduct ? [this.currentOrderProduct] : this.cartItems),
                        total_amount: this.currentOrderProduct ? this.currentOrderProduct.price * this.currentOrderProduct.quantity : this.cartTotal,
                        notes: this.orderForm.notes.trim()
                    };

                    const formData = new FormData();
                    Object.keys(orderData).forEach(key => {
                        formData.append(key, orderData[key]);
                    });

                    const response = await fetch('api.php', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });

                    const result = await response.json();

                    if (result.success) {
                        this.orderSuccess = 'Ващ заказ успешно оформлен!';

                        if (!this.currentOrderProduct) {
                            this.cartItems = [];
                            this.saveCart();
                        }

                        this.orderForm = {
                            customer_name: '',
                            customer_phone: '',
                            customer_email: '',
                            delivery_type: 'pickup',
                            delivery_city: '',
                            delivery_street: '',
                            delivery_building: '',
                            delivery_date: '',
                            delivery_time: '',
                            payment_type: 'cash',
                            notes: ''
                        };
                        this.deliveryCityValid = false;
                        this.deliveryStreetValid = false;
                        this.selectedCityData = null;
                        this.selectedStreetData = null;
                        this.citySuggestions = [];
                        this.streetSuggestions = [];
                        this.deliveryCityError = '';
                        this.deliveryStreetError = '';
                        this.hand = null;
                        this.showHandSelector = false;
                        this.resetOptionSelectionState();
                        this.selectingHandProductId = null;

                        setTimeout(() => {
                            this.closeOrderModal();
                        }, 3000);
                    } else {
                        this.orderError = result.error || 'Ошибка при оформлении заказа';
                    }
                } catch (error) {
                    this.orderError = error.message || 'Произошла ошибка при оформлении заказа';
                }

                this.orderLoading = false;
            },
            clearFieldErrors() {
                this.fieldErrors = {
                    customer_name: '',
                    customer_phone: '',
                    delivery_city: '',
                    delivery_street: '',
                    delivery_building: '',
                    policy: ''
                };
            },
            scrollToField(fieldId, errorMessage) {
                this.$nextTick(() => {
                    const field = document.getElementById(fieldId);

                    if (field) {
                        if (field.type === 'checkbox') {
                            const formGroup = field.closest('.form-group');

                            if (formGroup) {
                                formGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        } else {
                            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            field.focus();
                        }
                        const errorKey = fieldId === 'privacy-policy' ? 'policy' : fieldId;
                        this.fieldErrors[errorKey] = errorMessage;

                        setTimeout(() => {
                            if (this.fieldErrors[errorKey] === errorMessage) {
                                this.fieldErrors[errorKey] = '';
                            }
                        }, 5000);
                    }
                });
            },
            validatePhoneFormat(phone) {
                if (!phone || !phone.trim()) {
                    return false;
                }

                const cleaned = phone.replace(/[\s\-\(\)]/g, '');

                if (/^\+375\d{9}$/.test(cleaned)) {
                    return true;
                }

                if (/^375\d{9}$/.test(cleaned)) {
                    return true;
                }

                if (/^8\d{9}$/.test(cleaned)) {
                    return true;
                }

                return /^0\d{9}$/.test(cleaned);


            },
            validateOrderForm() {
                this.clearFieldErrors();
                this.orderError = '';

                const email = (this.orderForm.customer_email || '').trim();
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!this.orderForm.customer_name.trim()) {
                    this.scrollToField('customer_name', 'Имя обязательно для заполнения');
                    return false;
                }

                if (!this.orderForm.customer_phone.trim()) {
                    this.scrollToField('customer_phone', 'Телефон обязателен для заполнения');
                    return false;
                }

                if (!this.validatePhoneFormat(this.orderForm.customer_phone.trim())) {
                    this.scrollToField('customer_phone', 'Введите корректный номер телефона. Формат: +375 (XX) XXX-XX-XX или 8 (0XX) XXX-XX-XX');
                    return false;
                }

                if (this.orderForm.payment_type === 'online') {
                    if (!email) {
                        this.scrollToField('customer_email', 'Email обязателен для онлайн-оплаты');
                        return false;
                    }

                    if (!emailRegex.test(email)) {
                        this.scrollToField('customer_email', 'Введите корректный email');
                        return false;
                    }
                }

                if (this.orderForm.delivery_type === 'delivery') {
                    if (!this.deliveryCityValid || !this.orderForm.delivery_city.trim()) {
                        this.scrollToField('delivery_city', 'Выберите существующий город Беларуси из списка');
                        return false;
                    }

                    if (!this.deliveryStreetValid || !this.orderForm.delivery_street.trim()) {
                        this.scrollToField('delivery_street', 'Выберите улицу в выбранном городе');
                        return false;
                    }

                    if (!this.orderForm.delivery_building.trim()) {
                        this.scrollToField('delivery_building', 'Укажите номер дома или квартиры');
                        return false;
                    }
                }

                if (!this.policy) {
                    this.scrollToField('privacy-policy', 'Необходимо согласие с политикой обработки персональных данных');
                    return false;
                }

                return true;
            },
            handleOnlinePayment() {
                if (this.validateOrderForm()) {
                    this.orderForm.delivery_price = this.currentOrderProduct
                        ? this.orderForm.delivery_type === 'delivery'
                            ? this.orderForm.delivery_city && this.orderForm.delivery_city.includes('Беларусь')
                                ? this.deliveryBel
                                : this.orderForm.delivery_city
                                    ? this.deliveryRus
                                    : 0
                            : 0
                        : 0;

                    const orderData = {
                        orderForm: { ...this.orderForm },
                        cartItems: this.currentOrderProduct ? [this.currentOrderProduct] : [...this.cartItems],
                        cartTotal: (this.currentOrderProduct
                            ? (this.currentOrderProduct.price * this.currentOrderProduct.quantity)
                            : this.cartTotal) + this.orderForm.delivery_price,
                        currentOrderProduct: this.currentOrderProduct
                    };

                    NV.payment(orderData, async () => {
                        try {
                            await this.submitOrder();
                        } finally {
                            this.closeOrderModal();
                        }
                    });
                }
            },
            orderProduct(product, event) {
                if (this.isMobile && event) {
                    event.stopPropagation();
                }

                this.currentOrderProduct = {
                    ...product,
                    options: this.selectedProductOptions.map(option => ({ ...option })),
                    optionKey: this.buildOptionKey(this.selectedProductOptions),
                    quantity: 1
                };
                this.openOrderModal();
            },
            policyChange(value) {
                this.fieldErrors.policy = '';

                if (value === 'yes') {
                    this.policyNo = false;
                    this.deliveryAvailable = true;
                } else if (value === 'no') {
                    this.policyNotify();
                    this.orderForm.delivery_type = 'pickup';
                    this.policyYes = false;
                    this.deliveryAvailable = false;
                }
            },
            policyNotify() {
                NV.notifyPolicyReject();
            },
        }
    }

    const Options = {
        mixins: [Data, Order],
        data() {
            return {
                productOptions: [],
                showOptionSelector: false,
                optionSelectionIndex: 0,
                selectedProductOptions: [],
            }
        },
        mounted() {
            this.loadProductOptions().then(r => null);
        },
        methods: {
            async startOptionSelection(product, action, point, event) {
                if (event) {
                    event.stopPropagation();
                }

                this.resetOptionSelectionState();
                this.showOverlay();

                if (point === 'buyNow') {
                    this.buyNowPressed = true;
                } else if (point === 'addToCart') {
                    this.addToCartPressed = true;
                }

                this.selectingHandProductId = product.id;

                this.selectingHandAction = action; // 'buy' | 'cart'

                if (typeof this.loadProductOptions === 'function') {
                    await this.loadProductOptions();
                } else {
                    this.productOptions = [];
                }

                if (this.productOptions.length > 0) {
                    this.showOptionSelector = true;
                } else if (typeof this.finishOptionSelection === 'function') {
                    this.finishOptionSelection(product);
                }
            },
            resetOptionSelectionState() {
                this.selectedProductOptions = [];
                this.optionSelectionIndex = 0;
                this.showOptionSelector = false;
            },
            cancelOptionSelection() {
                this.resetOptionSelectionState();
                this.selectingHandProductId = null;
                this.selectingHandAction = null;
                this.buyNowPressed = false;
                this.addToCartPressed = false;
                this.hideOverlay();
            },
            normalizeOptionTypes(types) {
                return types
                    .map((type, index) => {
                        const name = (type.name || '').trim() || 'Опция' + index + 1;
                        const slug = type.slug || this.slugifyOptionName(name) || 'option-' + index;
                        const values = Array.isArray(type.values)
                            ? type.values
                                .map(value => (value !== null && value !== undefined ? String(value).trim() : ''))
                                .filter(Boolean)
                            : [];
                        return {
                            id: type.id || null,
                            name,
                            slug,
                            values
                        };
                    })
                    .filter(type => type.values.length);
            },
            slugifyOptionName(name) {
                if (!name) {
                    return '';
                }
                return name
                    .toString()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-zA-Z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '')
                    .toLowerCase();
            },
            async loadProductOptions() {
                try {
                    let response;
                    const selectedProduct = this.selectingHandProduct();
                    const typeId = selectedProduct ? selectedProduct.product_type_id : null;
                    const query = typeId ? 'api.php?action=product_options&type_id=' + encodeURIComponent(typeId) : 'api.php?action=product_options';

                    if (typeof fetch !== 'undefined') {
                        response = await fetch(query, { credentials: 'same-origin' });
                    } else {
                        response = await this.fetchWithXHR(query);
                    }

                    if (response && response.ok) {
                        const data = await response.json();
                        const options = Array.isArray(data.options) ? data.options : [];
                        this.productOptions = this.normalizeOptionTypes(options);
                    } else {
                        console.warn('Failed to load product options, using defaults');
                    }
                } catch (error) {
                    console.error('Error loading product options:', error);
                }
            },
            currentOptionType() {
                if (!this.productOptions || !this.productOptions.length) {
                    return null;
                }

                return this.productOptions[this.optionSelectionIndex] || null;
            },
            selectingHandProduct() {
                if (!this.selectingHandProductId) return null;
                return this.products.find(p => p.id === this.selectingHandProductId) || null;
            },
            chooseOptionValue(product, value) {
                const optionType = this.currentOptionType();
                if (!optionType) {
                    return;
                }
                this.selectedProductOptions.push({
                    name: optionType.name || 'Опция ' + this.optionSelectionIndex + 1,
                    value
                });
                this.optionSelectionIndex += 1;

                if (this.optionSelectionIndex >= this.productOptions.length) {
                    this.showOptionSelector = false;
                    this.finishOptionSelection(product);
                }
            },
            finishOptionSelection(product) {
                const optionsSnapshot = this.selectedProductOptions.map(option => ({ ...option }));
                const optionKey = this.buildOptionKey(optionsSnapshot);
                if (this.selectingHandAction === 'buy') {
                    this.$emit('open-order', {
                        ...product,
                        price: product.price_sale || product.price,
                        options: optionsSnapshot,
                        optionKey,
                        quantity: 1
                    });
                } else if (this.selectingHandAction === 'cart') {
                    this.addToCartInternal(product, optionsSnapshot);

                    if (this.selectingFromFavorites) {
                        this.localWishlist = this.localWishlist.filter(id => id !== product.id);
                        this.saveWishlist();
                        this.closeFavorites();
                        this.toCart();
                        this.selectingFromFavorites = false;
                    }
                }

                this.selectingHandProductId = null;
                this.selectingHandAction = null;
                this.buyNowPressed = false;
                this.addToCartPressed = false;
                this.resetOptionSelectionState();
                this.hideOverlay();
            },
            finishProductOptionSelection() {
                if (!this.product) return;
                const optionsSnapshot = this.selectedProductOptions.map(option => ({ ...option }));
                const optionKey = this.buildOptionKey(optionsSnapshot);
                if (this.selectingHandAction === 'buy') {
                    this.currentOrderProduct = {
                        ...this.product,
                        price: this.product.price_sale || this.product.price,
                        options: optionsSnapshot,
                        optionKey,
                        quantity: this.productQuantity
                    };
                    this.openOrderModal();
                } else if (this.selectingHandAction === 'cart') {
                    this.addProductToCartInternal(optionsSnapshot);
                }
                this.showOptionSelector = false;
                this.selectingHandAction = null;
                this.selectedProductOptions = [];
                this.optionSelectionIndex = 0;
            },
            chooseProductOptionValue(value) {
                const option = this.currentOptionType;

                if (!option) {
                    return;
                }

                this.selectedProductOptions.push({
                    name: option.name || 'Опция ' + this.optionSelectionIndex + 1,
                    value
                });

                this.optionSelectionIndex += 1;

                if (this.optionSelectionIndex >= this.productOptions.length) {
                    this.showOptionSelector = false;
                    this.$nextTick(() => {
                        this.finishProductOptionSelection();
                    });
                }
            },
        }
    }

    const Hero = {
        mixins: [Data, Props],
        template: `
      <section v-if="block" id="home" class="hero" :style="getHeroBackgroundStyle(block)">
        <div class="hero-content">
          <h1 :class="{ 'animated': isInView('hero-title-' + block.id), 'hidden': !isInView('hero-title-' + block.id) }"
              :id="'hero-title-' + block.id">{{ block.settings.mainTitle }}
          </h1>
          <p class="tagline"
             :class="{ 'animated': isInView('hero-tagline-' + block.id), 'hidden': !isInView('hero-tagline-' + block.id) }"
             :id="'hero-tagline-' + block.id" style="transition-delay: 0.2s">{{
              block.settings.subtitle ||
              ''
            }}</p>
          <p class="description"
             :class="{ 'animated': isInView('hero-description-' + block.id), 'hidden': !isInView('hero-description-' + block.id) }"
             :id="'hero-description-' + block.id" style="transition-delay: 0.4s">{{ block.settings.description }}</p>
          <div class="hero-buttons"
               :class="{ 'animated': isInView('hero-buttons-' + block.id), 'hidden': !isInView('hero-buttons-' + block.id) }"
               :id="'hero-buttons-' + block.id" style="transition-delay: 0.6s">
            <a href="#" @click="navClick($event, 'products')" class="btn">{{ block.settings.buttonA }}</a>
            <a href="#" @click="navClick($event, 'features')" class="btn btn-outline">{{ block.settings.buttonB }}</a>
          </div>
        </div>
      </section>
    `,
        props: {
            block: {
                type: Object,
                default: {
                    id: 0,
                    type: '',
                    settings: ''
                }
            },
            isInView: Function,
            navClick: Function,
        },
    }

    const Products = {
        mixins: [Data, Props, Options],
        emits: ['update:cart-items', 'update:wishlist', 'open-cart', 'open-favorites', 'close-favorites', 'open-order', 'start-option-selection'],
        template: `
          <section v-if="block && block.type === 'products'" id="products">
            <div class="container">
              <h2 class="section-title scroll-animate"
                  :class="{ 'animated': isInView('products-title-' + block.id), 'hidden': !isInView('products-title-' + block.id) }"
                  :id="'products-title-' + block.id">{{ block.settings.sectionTitle || 'Наша коллекция' }}</h2>
              <div v-if="block.content" class="products-description scroll-animate"
                   :class="{ 'animated': isInView('products-description-' + block.id), 'hidden': !isInView('products-description-' + block.id) }"
                   :id="'products-description-' + block.id" v-html="block.content"></div>
              <div class="filters scroll-animate"
                   :class="{ 'animated': isInView('products-filters-' + block.id), 'hidden': !isInView('products-filters-' + block.id) }"
                   :id="'products-filters-' + block.id" style="transition-delay: 0.2s">
                <button class="filter-btn" :class="{ 'active': activeFilter === 'all' }"
                        @click="setFilter('all')">
                  Все
                </button>
                <button v-for="category in categories" :key="category.id" class="filter-btn"
                        :class="{ 'active': activeFilter === category.id }" @click="setFilter(category.id)">
                  {{ category.name }}
                </button>
              </div>
              <div class="products-grid">
                <template v-for="product in filteredProducts" :key="product.id">
                  <div v-if="product.visibility" class="product-card" :id="'product-' + product.id">
                    <div class="product-img-container" :class="{ 'narrow-image': isNarrowImage(product) }"
                         :style="imageContainerStyle(product)" :ref="'img-container-' + product.id"
                         @touchstart="touchStart(product, $event)"
                         @touchmove="touchMove(product, $event)"
                         @touchend="touchEnd(product, $event)"
                         @mousedown="mouseDown(product, $event)"
                         @mousemove="mouseMove(product, $event)"
                         @mouseup="mouseUp(product, $event)"
                         @mouseleave="mouseLeave(product, $event)">
                      <a class="product-link"
                         :href="getBasePath() + 'product/?id=' + encodeURIComponent(product.id)">
                        <div v-if="isImageLoading(product)" class="image-loading-indicator">
                          <div class="loading-spinner"></div>
                        </div>
                        <img v-if="!isVideo(getImage(product))"
                             :src="getImage(product)" :alt="imageMetaTags" class="product-img"
                             :class="{ 'loading': isImageLoading(product) }" loading="lazy" decoding="async"
                             @loadstart="onImageLoadStart($event, product)"
                             @load="onImageLoad($event, product)" @error="onImageError"
                             :ref="'img-' + product.id">
                        <video v-else :src="getImage(product)" class="product-img"
                               :class="{ 'loading': isImageLoading(product) }" muted loop playsinline autoplay
                               @loadstart="onVideoLoadStart($event, product)"
                               @loadeddata="onVideoLoadedData($event, product)"
                               @error="onVideoError($event, product)"></video>
                      </a>
                      <div v-if="hasMultipleImages(product)" class="product-image-nav">
                        <button class="product-image-nav-btn product-image-nav-prev"
                                @click.stop.prevent="prevProductImage(product, $event)"
                                aria-label="Предыдущее изображение">
                          <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="product-image-nav-btn product-image-nav-next"
                                @click.stop.prevent="nextProductImage(product, $event)"
                                aria-label="Следующее изображение">
                          <i class="fas fa-chevron-right"></i>
                        </button>
                        <div class="product-image-dots">
                      <span v-for="(img, index) in getAllProductImages(product)" :key="index"
                            class="product-image-dot"
                            :class="{ 'active': getProductImageIndex(product) === index }"
                            @click.stop.prevent="setProductImageIndex(product, index)"
                            :aria-label="'Изображение' + index + 1"></span>
                        </div>
                      </div>
                    </div>
                    <div class="product-info">
                      <a class="product-title"
                         :href="getBasePath() + 'product/?id=' + encodeURIComponent(product.id)">{{
                          product.name
                        }}</a>
                      <div class="product-details">
                        <p class="product-material">{{ product.material }}</p>
                        <p class="product-price">
                                                <span v-if="product.price_sale" class="price-old">{{ product.price }}
                                                  руб.</span>
                          <span v-if="product.price_sale" class="price-sale">{{ product.price_sale }}
                            руб.</span>
                          <span v-else>{{ product.price }} руб.</span>
                        </p>
                      </div>
                      <div class="product-actions">
                        <button class="add-to-cart"
                                @click="startOptionSelection(product, 'buy', 'buyNow', $event)">
                          Купить сейчас
                        </button>
                        <div class="product-order-favorite">
                          <template v-if="isMobile">
                            <table>
                              <template v-if="isProductInCart(product.id)">
                                <tr>
                                  <td>
                                    <button class="add-to-cart" @click="toggleCart">
                                      В корзине
                                    </button>
                                  </td>
                                </tr>
                                <tr>
                                  <td>
                                    <button class="add-to-cart"
                                            @click="startOptionSelection(product, 'cart', 'addToCart', $event)">
                                      + в корзину
                                    </button>
                                  </td>
                                  <td>
                                    <button class="wishlist"
                                            :class="{ 'active': isInWishlist(product.id) }"
                                            @click="toggleWishlist(product.id, $event)">
                                      <i class="fas fa-heart"></i>
                                    </button>
                                  </td>
                                </tr>
                              </template>
                              <template v-else>
                                <tr>
                                </tr>
                                <tr>
                                  <td>
                                    <button class="add-to-cart"
                                            @click="startOptionSelection(product, 'cart', 'addToCart', $event)">
                                      В корзину
                                    </button>
                                  </td>
                                  <td>
                                    <button class="wishlist"
                                            :class="{ 'active': isInWishlist(product.id) }"
                                            @click="toggleWishlist(product.id, $event)">
                                      <i class="fas fa-heart"></i>
                                    </button>
                                  </td>
                                </tr>
                              </template>
                            </table>
                          </template>
                          <template v-else>
                            <template v-if="isProductInCart(product.id)">
                              <button class="add-to-cart" @click="toggleCart">
                                В корзине
                              </button>
                              <button class="add-to-cart"
                                      @click="startOptionSelection(product, 'cart', 'addToCart', $event)"
                                      :style="isMobileDevice ? '' : 'margin-left: 10px'">
                                + в корзину
                              </button>
                              <button class="wishlist" :class="{ 'active': isInWishlist(product.id) }"
                                      @click="toggleWishlist(product.id, $event)">
                                <i class="fas fa-heart"></i>
                              </button>
                            </template>
                            <template v-else>
                              <button class="add-to-cart"
                                      @click="startOptionSelection(product, 'cart', 'addToCart', $event)">
                                В корзину
                              </button>
                              <button class="wishlist" :class="{ 'active': isInWishlist(product.id) }"
                                      @click="toggleWishlist(product.id, $event)">
                                <i class="fas fa-heart"></i>
                              </button>
                            </template>
                          </template>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
              <div v-if="showOptionSelector && currentOptionType()" class="option-selector-modal"
                   @click.self="cancelOptionSelection">
                <div class="option-selector-content">
                  <div class="option-selector-header">
                    <h3>Выберите {{ currentOptionType() ? currentOptionType().name : 'опцию' }}</h3>
                    <button type="button" class="close-icon" @click="cancelOptionSelection">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                  <div class="option-selector-body">
                    <p class="option-selector-question">{{ currentOptionType().name }}</p>
                    <div class="option-values">
                      <button v-for="value in currentOptionType().values"
                              :key="value"
                              type="button"
                              class="option-value-btn"
                              @click="chooseOptionValue(selectingHandProduct(), value)">
                        {{ value }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        `,
        data() {
            return {
                activeFilter: 'all',
                imageInfo: { },
                imageLoadingStates: { },
                productImageIndices: { },
                productImageNavigating: { },
                productImageTouchStart: { },
                productImageMouseStart: { },
                localCartItems: [],
                localWishlist: [],
                hand: null,
                productQuantity: 1,
                buyNowPressed: false,
                addToCartPressed: false,
            }
        },
        props: {
            block: {
                type: Object,
                default: {
                    id: 0,
                    type: '',
                    settings: ''
                }
            },
            products: {
                type: Array,
                default: []
            },
            categories: {
                type: Array,
                default: () => []
            },
            imageMetaTags: {
                type: String,
                default: ''
            },
            isMobile: {
                type: Boolean,
                default: false
            },
            elementStates: {
                type: Object,
                default: { }
            },
            cartItems: {
                type: Object,
                default: { }
            },
            wishlist: {
                type: Object,
                default: { }
            },
            isInView: Function,
            isVideo: Function,
            getCurrentProductImage: Function,
        },
        computed: {
            filteredProducts() {
                if (this.activeFilter === 'all') {
                    return this.products;
                }

                return this.products.filter(product => product.category === this.activeFilter);
            },
            isCurrentProductInWishlist() {
                if (!this.currentProduct) return false;
                return this.wishlist.includes(this.currentProduct.id);
            },
            isCurrentProductInCart() {
                if (!this.currentProduct) return false;
                return this.cartItems.some(item => item.id === this.currentProduct.id);
            }
        },
        watch: {
            filteredProducts: {
                handler() {
                    this.$nextTick(() => {
                        this.checkLoadedImages();
                        this.showAllProductCards();
                        this.initProductImageNavigation();
                    });
                },
                deep: true
            },
            activeFilter: {
                handler() {
                    this.$nextTick(() => {
                        this.showAllProductCards();
                    });
                }
            },
            cartItems: {
                handler(value) {
                    if (Array.isArray(value)) {
                        this.localCartItems = [...value];
                    }
                },
                deep: true
            },
            wishlist: {
                handler(value) {
                    if (Array.isArray(value)) {
                        this.localWishlist = [...value];
                    }
                },
                deep: true
            },
        },
        mounted() {
            this.localCartItems = Array.isArray(this.cartItems) ? [...this.cartItems] : this.getStoredCart();
            this.localWishlist = Array.isArray(this.wishlist) ? [...this.wishlist] : this.getStoredWishlist();
            this.initProductLinkHandlers();

            this.$nextTick(() => {
                this.checkLoadedImages();
            });
        },
        methods: {
            toggleCurrentProductWishlist() {
                if (!this.currentProduct) return;
                if (this.isCurrentProductInWishlist) {
                    this.wishlist = this.wishlist.filter(id => id !== this.currentProduct.id);
                } else {
                    this.wishlist.push(this.currentProduct.id);
                }
                this.saveWishlist();
            },
            getImage(product) {
                try {
                    if (!this.getCurrentProductImage) return '';
                    return this.getCurrentProductImage.call(this, product) ?? '';
                } catch (e) {
                    return '';
                }
            },
            getAllProductImages(product) {
                if (!product) return [];
                const images = [];

                const main = this.normalizeMediaUrl(product.image);
                if (main) {
                    images.push(main);
                }

                if (Array.isArray(product.additional_images)) {
                    images.push(
                        ...product.additional_images
                            .map((img) => this.normalizeMediaUrl(img))
                            .filter(Boolean)
                    );
                }

                if (Array.isArray(product.additional_videos)) {
                    images.push(
                        ...product.additional_videos
                            .map((vid) => this.normalizeMediaUrl(vid))
                            .filter(Boolean)
                    );
                }

                return images;
            },
            getProductImageIndex(product) {
                if (!product) return 0;
                return this.productImageIndices[product.id] || 0;
            },
            setProductImageIndex(product, index) {
                if (!product) return;

                if (this.productImageNavigating[product.id]) return;
                this.productImageNavigating[product.id] = true;

                const allImages = this.getAllProductImages(product);

                if (index >= 0 && index < allImages.length) {
                    this.imageLoadingStates[product.id] = true;

                    this.productImageIndices[product.id] = index;
                    this.$nextTick(() => {
                        this.updateImageContainerStyle(product);
                        setTimeout(() => {
                            delete this.productImageNavigating[product.id];
                        }, 100);
                    });
                } else {
                    delete this.productImageNavigating[product.id];
                }
            },
            hasMultipleImages(product) {
                if (!product) return false;
                const allImages = this.getAllProductImages(product);
                return allImages.length > 1;
            },
            prevProductImage(product, event) {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                }
                if (!product) return;

                if (this.productImageNavigating[product.id]) return;
                this.productImageNavigating[product.id] = true;

                const allImages = this.getAllProductImages(product);

                if (allImages.length <= 1) {
                    delete this.productImageNavigating[product.id];
                    return;
                }

                this.imageLoadingStates[product.id] = true;

                const currentIndex = this.productImageIndices[product.id] || 0;
                this.productImageIndices[product.id] = currentIndex === 0 ? allImages.length - 1 : currentIndex - 1;
                this.$nextTick(() => {
                    this.updateImageContainerStyle(product);
                    setTimeout(() => {
                        delete this.productImageNavigating[product.id];
                    }, 100);
                });
            },
            nextProductImage(product, event) {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                }
                if (!product) return;

                if (this.productImageNavigating[product.id]) return;
                this.productImageNavigating[product.id] = true;

                const allImages = this.getAllProductImages(product);

                if (allImages.length <= 1) {
                    delete this.productImageNavigating[product.id];
                    return;
                }

                this.imageLoadingStates[product.id] = true;

                const currentIndex = this.productImageIndices[product.id] || 0;

                this.productImageIndices[product.id] = (currentIndex + 1) % allImages.length;

                this.$nextTick(() => {
                    this.updateImageContainerStyle(product);
                    setTimeout(() => {
                        delete this.productImageNavigating[product.id];
                    }, 100);
                });
            },
            checkImageAspectRatio(img, container, product, imageUrl = null) {
                if (!img || !container || !product) return;

                const imgWidth = img.naturalWidth || img.width;
                const imgHeight = img.naturalHeight || img.height;

                if (!imgWidth || !imgHeight) return;

                const aspectRatio = imgWidth / imgHeight;
                const isNarrow = aspectRatio < 0.8;
                const currentImage = imageUrl || this.getImage(product);

                if (isNarrow) {
                    this.imageInfo[product.id] = {
                        isNarrow: true,
                        imageUrl: currentImage
                    };

                    container.style.setProperty('--bg-image', 'url(' + currentImage +')');
                } else {
                    this.imageInfo[product.id] = {
                        isNarrow: false
                    };
                }
            },
            initProductLinkHandlers() {
                this.$nextTick(() => {
                    const productLinks = document.querySelectorAll('.product-link, .product-title');

                    productLinks.forEach(link => {
                        const href = link.getAttribute('href');

                        if (href && (href.includes('/product/') || href.includes('product/?id='))) {
                            link.addEventListener('click', (event) => {
                                const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
                                sessionStorage.setItem('mainPageScrollPosition', scrollPosition.toString());
                            });
                        }
                    });
                });
            },
            isProductInCart(id) {
                const items = Array.isArray(this.localCartItems) && this.localCartItems.length
                    ? this.localCartItems
                    : this.getStoredCart();
                const item = items.find(el => el && el.id === id);
                return !!item;
            },
            toggleCart() {
                this.$emit('open-cart');
            },
            closeFavorites() {
                this.$emit('close-favorites');
            },
            isInWishlist(productId) {
                const list = Array.isArray(this.localWishlist) && this.localWishlist.length
                    ? this.localWishlist
                    : this.getStoredWishlist();
                return list.includes(productId);
            },
            toggleWishlist(productId, event) {
                if (this.isMobile && event) {
                    event.stopPropagation();
                }

                const currentWishlist = Array.isArray(this.localWishlist)
                    ? [...this.localWishlist]
                    : this.getStoredWishlist();

                if (currentWishlist.includes(productId)) {
                    this.localWishlist = currentWishlist.filter(id => id !== productId);
                } else {
                    currentWishlist.push(productId);
                    this.localWishlist = currentWishlist;
                }

                this.saveWishlist();
            },
            showAllProductCards() {
                document.querySelectorAll('.product-card').forEach(el => {
                    el.classList.remove('hidden');
                    el.classList.add('animated');
                    const elementId = el.id || this.generateElementId(el);
                    this.elementStates[elementId] = 'animated';
                });
            },
            initProductImageNavigation() {
                this.$nextTick(() => {
                    document.querySelectorAll('.product-img-container').forEach(container => {
                        const hasNav = container.querySelector('.product-image-nav');
                        const link = container.querySelector('.product-link');

                        if (hasNav && link) {
                            link.style.pointerEvents = 'auto';
                        }
                    });
                });
            },
            setFilter(id) {
                this.activeFilter = id;

                this.$nextTick(() => {
                    this.showAllProductCards();
                });
            },
            isImageLoading(product) {
                if (!product || !product.id) return false;
                return this.imageLoadingStates[product.id] === true;
            },
            onImageLoad(event, product) {
                const img = event.target;
                const container = img.closest('.product-img-container');
                if (!container || !product) return;

                if (product && product.id) {
                    this.imageLoadingStates[product.id] = false;
                }

                const currentImage = this.getImage(product);
                this.checkImageAspectRatio(img, container, product, currentImage);
            },
            onImageError(event) {
                console.warn('Failed to load image:', event.target.src);

                const img = event.target;
                const container = img.closest('.product-img-container');

                if (container) {
                    const productCard = container.closest('.product-card');

                    if (productCard) {
                        const productId = productCard.id.replace('product-', '');

                        if (productId) {
                            this.imageLoadingStates[productId] = false;
                        }
                    }
                }
            },
            isNarrowImage(product) {
                if (!product || !product.id) return false;
                return this.imageInfo?.[product.id]?.isNarrow === true;
            },
            imageContainerStyle(product) {
                if (!product || !this.isNarrowImage(product)) {
                    return {};
                }

                const currentImage = this.getImage(product);

                return {
                    background: 'url(' + currentImage + ')'
                };
            },
            checkLoadedImages() {
                this.$nextTick(() => {
                    const list = Array.isArray(this.filteredProducts) ? this.filteredProducts : [];
                    list.forEach(product => {
                        if (!product) return;
                        if (!product.id) return;

                        const currentImage = this.getImage(product);
                        const imgRef = this.$refs['img' + product.id];
                        let imgElement = null;

                        if (Array.isArray(imgRef)) {
                            imgElement = imgRef[0];
                        } else if (imgRef) {
                            imgElement = imgRef;
                        }

                        if (imgElement && imgElement.complete && imgElement.naturalWidth) {
                            this.imageLoadingStates[product.id] = false;
                            const container = imgElement.closest('.product-img-container');
                            this.checkImageAspectRatio(imgElement, container, product, currentImage);
                        } else if (!this.isVideo(currentImage)) {
                            this.imageLoadingStates[product.id] = true;
                        }
                    });
                });
            },
            touchStart(product, event) {
                if (!product || !this.hasMultipleImages(product)) return;

                if (event.target.closest('.product-image-nav-btn') || event.target.closest('.product-image-dot')) {
                    return;
                }

                this.productImageTouchStart[product.id] = {
                    x: event.touches[0].clientX,
                    y: event.touches[0].clientY,
                    time: Date.now(),
                    moved: false
                };
            },
            touchMove(product, event) {
                if (!product || !this.hasMultipleImages(product)) return;
                const touchStart = this.productImageTouchStart[product.id];
                if (!touchStart) return;

                const currentX = event.touches[0].clientX;
                const currentY = event.touches[0].clientY;
                const diffX = Math.abs(currentX - touchStart.x);
                const diffY = Math.abs(currentY - touchStart.y);

                if (diffX > 5 || diffY > 5) {
                    touchStart.moved = true;
                }

                if (diffX > diffY && diffX > 10) {
                    event.preventDefault();
                }
            },
            touchEnd(product, event) {
                if (!product || !this.hasMultipleImages(product)) return;
                const touchStart = this.productImageTouchStart[product.id];
                if (!touchStart) {
                    return;
                }

                if (!touchStart.moved) {
                    delete this.productImageTouchStart[product.id];
                    return;
                }

                const touchEnd = {
                    x: event.changedTouches[0].clientX,
                    y: event.changedTouches[0].clientY
                };

                const diffX = touchStart.x - touchEnd.x;
                const diffY = Math.abs(touchStart.y - touchEnd.y);
                const timeDiff = Date.now() - touchStart.time;

                if (Math.abs(diffX) > 50 && Math.abs(diffX) > diffY && timeDiff < 500) {
                    event.preventDefault();
                    event.stopPropagation();

                    if (diffX > 0) {
                        this.nextProductImage(product, event);
                    } else {
                        this.prevProductImage(product, event);
                    }
                }

                delete this.productImageTouchStart[product.id];
            },
            mouseDown(product, event) {
                if (!product || !this.hasMultipleImages(product)) return;

                if (event.button !== 0) return;

                if (event.target.closest('.product-image-nav-btn') || event.target.closest('.product-image-dot')) {
                    return;
                }

                event.preventDefault();

                this.productImageMouseStart[product.id] = {
                    x: event.clientX,
                    y: event.clientY,
                    time: Date.now(),
                    moved: false
                };
            },
            mouseMove(product, event) {
                if (!product || !this.hasMultipleImages(product)) return;
                const mouseStart = this.productImageMouseStart[product.id];
                if (!mouseStart) return;

                const currentX = event.clientX;
                const currentY = event.clientY;
                const diffX = Math.abs(currentX - mouseStart.x);
                const diffY = Math.abs(currentY - mouseStart.y);

                if (diffX > 5 || diffY > 5) {
                    mouseStart.moved = true;
                }

                if (diffX > diffY && diffX > 10) {
                    event.preventDefault();
                }
            },
            mouseUp(product, event) {
                if (!product || !this.hasMultipleImages(product)) return;
                const mouseStart = this.productImageMouseStart[product.id];
                if (!mouseStart) {
                    return;
                }

                if (event.button !== 0) {
                    delete this.productImageMouseStart[product.id];
                    return;
                }

                if (!mouseStart.moved) {
                    delete this.productImageMouseStart[product.id];
                    return;
                }

                const mouseEnd = {
                    x: event.clientX,
                    y: event.clientY
                };

                const diffX = mouseStart.x - mouseEnd.x;
                const diffY = Math.abs(mouseStart.y - mouseEnd.y);
                const timeDiff = Date.now() - mouseStart.time;

                if (Math.abs(diffX) > 50 && Math.abs(diffX) > diffY && timeDiff < 500) {
                    event.preventDefault();
                    event.stopPropagation();

                    if (diffX > 0) {
                        this.nextProductImage(product, event);
                    } else {
                        this.prevProductImage(product, event);
                    }
                }

                delete this.productImageMouseStart[product.id];
            },
            mouseLeave(product, event) {
                if (this.productImageMouseStart[product.id]) {
                    delete this.productImageMouseStart[product.id];
                }
            },
            onImageLoadStart(event, product) {
                if (product && product.id) {
                    const img = event.target;
                    if (!img.complete || !img.naturalWidth) {
                        this.imageLoadingStates[product.id] = true;
                    }
                }
            },
            onVideoLoadStart(event, product) {
                if (product && product.id) {
                    const video = event.target;
                    if (video.readyState < 2) {
                        this.imageLoadingStates[product.id] = true;
                    }
                }
            },
            onVideoLoadedData(event, product) {
                if (product && product.id) {
                    this.imageLoadingStates[product.id] = false;
                }
            },
            onVideoError(event, product) {
                console.warn('Failed to load video:', event.target.src);
                if (product && product.id) {
                    this.imageLoadingStates[product.id] = false;
                }
            },
            getStoredCart() {
                try {
                    const saved = localStorage.getItem('cart');
                    const parsed = saved ? JSON.parse(saved) : [];
                    return Array.isArray(parsed) ? parsed : [];
                } catch (error) {
                    return [];
                }
            },
            getStoredWishlist() {
                try {
                    const saved = localStorage.getItem('wishlist');
                    const parsed = saved ? JSON.parse(saved) : [];
                    return Array.isArray(parsed) ? parsed : [];
                } catch (error) {
                    return [];
                }
            },
            buildOptionKey(options = []) {
                if (!Array.isArray(options) || options.length === 0) {
                    return '';
                }
                return options
                    .map(option => option.slug || option.name || option.value)
                    .join('|');
            },
            saveCart() {
                const items = Array.isArray(this.localCartItems) ? this.localCartItems : this.getStoredCart();
                localStorage.setItem('cart', JSON.stringify(items));
                this.$emit('update:cart-items', [...items]);
            },
            saveWishlist() {
                const list = Array.isArray(this.localWishlist) ? this.localWishlist : this.getStoredWishlist();
                localStorage.setItem('wishlist', JSON.stringify(list));
                this.$emit('update:wishlist', [...list]);
            },
            addToCartInternal(product, options = []) {
                const currentCart = Array.isArray(this.localCartItems) ? [...this.localCartItems] : this.getStoredCart();
                const optionKey = this.buildOptionKey(options);
                const existingItem = currentCart.find(item =>
                    item &&
                    item.id === product.id &&
                    (item.optionKey || this.buildOptionKey(item.options || [])) === optionKey
                );

                if (existingItem) {
                    existingItem.quantity = (existingItem.quantity || 0) + 1;
                } else {
                    currentCart.push({
                        ...product,
                        price: product.price_sale || product.price,
                        options,
                        optionKey,
                        quantity: 1
                    });
                }

                this.localCartItems = currentCart;
                this.saveCart();
                this.hideOverlay();
            },
            toCart() {
                this.$emit('close-favorites');
                this.$emit('open-cart');
                this.hideOverlay();
            },
            cancelProductAddToCart() {
                this.hideOverlay();
                this.showOptionSelector = false;
                this.selectingHandAction = null;
                this.selectingHandProductId = null;
                this.selectedProductOptions = [];
                this.optionSelectionIndex = 0;
                this.buyNowPressed = false;
                this.addToCartPressed = false;
                this.selectingFromFavorites = false;
            },
        }
    }

    const Projects = {
        mixins: [Props],
        template: `
          <section id="projects" class="projects">
            <div class="container">
              <h2 class="section-title">Мои проекты</h2>
              <div class="projects-grid">
                <div
                    v-for="(p, index) in projects"
                    :key="p.id"
                    class="project-card"
                    @click="openProject($event, index)"
                >
                  <div class="project-image">
                    <div class="project-placeholder"><span>{{ p.icon }}</span></div>
                  </div>
                  <div class="project-content">
                    <h3>{{ p.title }}</h3>
                    <p>{{ p.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <template v-if="projectModalOpen">
            <teleport to="body">
              <div class="project-modal-root">
                <div class="project-modal-backdrop" ref="backdrop" @click="closeProject"></div>
                <div class="project-modal" ref="modal" @click.stop>
                  <button type="button" class="close-icon project-modal-close" aria-label="Закрыть" @click="closeProject">
                    <i class="fas fa-times"></i>
                  </button>
                  <h3>{{ project.title }}</h3>
                  <p>{{ project.description }}</p>
                  <div v-if="project.tech && project.tech.length" class="project-tech">
                    <span v-for="t in project.tech" :key="t" class="tech-tag">{{ t }}</span>
                  </div>
                  <div class="project-links">
                    <a v-if="project.github" :href="project.github" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">GitHub</a>
                    <a v-if="project.github2" :href="project.github2" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">{{ project.github2_title || 'GitHub' }}</a>
                    <a v-if="project.demo" :href="project.demo" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Демо</a>
                    <a v-if="project.site" :href="project.site" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Сайт</a>
                  </div>
                </div>
              </div>
            </teleport>
          </template>
        `,
        data() {
            return {
                projects: [
                    {
                        id: 1,
                        title: 'Shelfer',
                        description: 'Десктопное приложение для планировки товарной выкладки',
                        tech: ['Vue.js', 'Vite', 'JavaScript', 'Electron', 'Typescript', 'Node.js'],
                        icon: '🎨',
                        github: 'https://github.com/Neoject/shelfer',
                        demo: 'https://ubers.site/shelfer/'
                    },
                    {
                        id: 2,
                        title: 'Aeternum',
                        description: 'Полнофункциональный интернет-магазин с корзиной покупок и системой заказов',
                        tech: ['Vue.js', 'php'],
                        icon: '🛒',
                        site: 'https://aeternum.by'
                    },
                    {
                        id: 3,
                        title: 'Media Rocket',
                        description: 'Приложение для передачи файлов между ПК и смартфоном на Android',
                        tech: ['Kotlin', 'Vue.js', 'Electron', 'TypeScript'],
                        icon: '📊',
                        github: 'https://github.com/Neoject/media-rocket',
                        github2: 'https://github.com/Neoject/mediarocket-desktop',
                        github2_title: 'Media Rocket desktop'
                    },
                    {
                        id: 4,
                        title: 'ModCare',
                        description: 'Сайт для медицинской консультации с помощью ИИ',
                        tech: ['Node.js', 'Vue', 'JavaScript'],
                        icon: '🏥',
                        github: 'https://github.com/Neoject/modcure',
                        demo: 'https://modcare.site/'
                    }
                ],
                projectModalOpen: false,
                project: {},
                clickPoint: { x: 0, y: 0 }
            };
        },
        methods: {
            openProject(e, i) {
                this.clickPoint = { x: e.clientX, y: e.clientY };
                this.project = this.projects[i];
                this.projectModalOpen = true;

                this.$nextTick(() => {
                    const modal = this.$refs.modal;
                    const backdrop = this.$refs.backdrop;
                    if (!modal) return;

                    const g = window.gsap;
                    if (!g) return;

                    const rect = modal.getBoundingClientRect();
                    const originX = this.clickPoint.x - rect.left;
                    const originY = this.clickPoint.y - rect.top;

                    if (backdrop) {
                        g.set(backdrop, { opacity: 0 });
                        g.to(backdrop, { opacity: 1, duration: 0.25 });
                    }
                    g.set(modal, { transformOrigin: `${originX}px ${originY}px`, scale: 0.3, rotation: -10, opacity: 0 });
                    g.to(modal, { scale: 1, rotation: 0, opacity: 1, duration: 0.45, ease: "back.out(1.7)" });
                });
            },
            closeProject() {
                const modal = this.$refs.modal;
                const backdrop = this.$refs.backdrop;
                if (!modal) {
                    this.projectModalOpen = false;
                    this.project = {};
                    return;
                }

                const g = window.gsap;
                if (!g) {
                    this.projectModalOpen = false;
                    this.project = {};
                    return;
                }

                const rect = modal.getBoundingClientRect();
                const originX = this.clickPoint.x - rect.left;
                const originY = this.clickPoint.y - rect.top;

                g.set(modal, { transformOrigin: `${originX}px ${originY}px` });
                if (backdrop) {
                    g.to(backdrop, { opacity: 0, duration: 0.25 });
                }
                g.to(modal, {
                    scale: 0.3,
                    rotation: 10,
                    opacity: 0,
                    duration: 0.3,
                    ease: "power2.in",
                    onComplete: () => {
                        this.projectModalOpen = false;
                        this.project = {};
                    }
                });
            }
        }
    }

    const Features = {
        mixins: [Data],
        template: `
        <section v-if="block && block.type === 'features'" id="features">
            <div class="container">
                <h2 class="section-title scroll-animate"
                    :class="{ 'animated': isInView('features-title-' + block.id), 'hidden': !isInView('features-title-' + block.id) }"
                    :id="'features-title-' + block.id">{{ block.settings.sectionTitle
                    }}</h2>
                <div class="features-grid">
                    <div v-for="(feature, featureIndex) in block.settings.features" :key="featureIndex"
                         class="feature-card"
                         :class="{ 'animated': isInView('feature-' + block.id + '-' + featureIndex), 'hidden': !isInView('feature-' + block.id + '-' + featureIndex) }"
                         :id="'feature-' + block.id + '-' + featureIndex">
                        <div class="feature-icon">
                            <i :class="feature.icon"></i>
                        </div>
                        <h3 class="feature-title">{{ feature.title }}</h3>
                        <p class="feature-description">{{ feature.description }}</p>
                    </div>
                </div>
            </div>
        </section>
    `,
        props: {
            block: {
                type: Object,
                default: {
                    id: 0,
                    type: '',
                    settings: ''
                }
            },
            isInView: Function,
        }
    }

    const Buttons = {
        mixins: [Data, Props],
        template: `
      <section v-if="block && block.type === 'buttons' && block.settings.buttons && block.settings.buttons.length > 0" id="buttons-block">
        <div class="container">
          <h2 v-if="block.settings.sectionTitle" class="section-title scroll-animate"
              :class="{ 'animated': isInView('buttons-title-' + block.id), 'hidden': !isInView('buttons-title-' + block.id) }"
              :id="'buttons-title-' + block.id">{{ block.settings.sectionTitle }}</h2>
          <div class="buttons-container scroll-animate"
               :class="{ 'animated': isInView('buttons-container-' + block.id), 'hidden': !isInView('buttons-container-' + block.id) }"
               :id="'buttons-container-' + block.id">
            <a v-for="(button, index) in block.settings.buttons" :key="index" :href="getLink(button)"
               @click="click($event, button)" class="btn"
               :class="getClass(button.style)">
              {{ button.text }}
            </a>
          </div>
        </div>
      </section>
    `,
        props: {
            block: {
                type: Object,
                default: {
                    id: 0,
                    type: '',
                    settings: ''
                }
            },
            isInView: Function,
        },
        methods: {
            getClass(style) {
                const classes = {
                    'primary': 'btn-primary',
                    'secondary': 'btn-secondary',
                    'outline': 'btn-outline'
                };
                return classes[style] || 'btn-primary';
            }
        }
    }

    const HistoryBlock = {
        mixins: [Data],
        template: `
      <section v-if="block && block.type === 'history'" id="history">
        <div class="container">
          <h2 class="section-title scroll-animate"
              :class="{ 'animated': isInView('history-title-' + block.id), 'hidden': !isInView('history-title-' + block.id) }"
              :id="'history-title-' + block.id">{{ block.settings.sectionTitle || 'Наша история' }}</h2>
          <div class="history-content">
            <div class="history-timeline">
              <div v-for="(event, eventIndex) in block.settings.events" :key="eventIndex"
                   class="timeline-item scroll-animate"
                   :class="{ 'animated': isInView('timeline-' + block.id + '-' + eventIndex), 'hidden': !isInView('timeline-' + block.id + '-' + eventIndex) }"
                   :id="'timeline-' + block.id + '-' + eventIndex"
                   :style="'transition-delay: ' + (0.1 + eventIndex * 0.1) + 's'">
                <div class="timeline-year">{{ event.year }}</div>
                <div class="timeline-content">
                  <h3>{{ event.title }}</h3>
                  <p>{{ event.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `,
        props: {
            block: {
                type: Object,
                default: {
                    id: 0,
                    type: '',
                    settings: ''
                }
            },
            isInView: Function,
        }
    }

    const TextBlock = {
        mixins: [Data],
        template: `
      <section v-if="block && block.type === 'text'" class="text-block">
        <div class="container">
          <h2 v-if="block.settings.sectionTitle" class="section-title scroll-animate"
              :class="{ 'animated': isInView('text-title-' + block.id), 'hidden': !isInView('text-title-' + block.id) }"
              :id="'text-title-' + block.id">{{ block.settings.sectionTitle }}</h2>
          <div class="text-content scroll-animate"
               :class="{ 'animated': isInView('text-content-' + block.id), 'hidden': !isInView('text-content-' + block.id) }"
               :id="'text-content-' + block.id" v-html="block.content"></div>
        </div>
      </section>
    `,
        props: {
            block: {
                type: Object,
                default: {
                    id: 0,
                    type: '',
                    settings: ''
                }
            },
            isInView: Function,
        }
    }

    const Stats = {
        mixins: [Data],
        template: `
          <section v-if="block && block.type === 'stats'" id="stats">
            <div class="container">
              <h2 v-if="block.settings.sectionTitle" class="section-title scroll-animate"
                  :class="{ 'animated': isInView('stats-title-' + block.id), 'hidden': !isInView('stats-title-' + block.id) }"
                  :id="'stats-title-' + block.id">{{ block.settings.sectionTitle }}</h2>
              <div v-if="block.settings.stats && block.settings.stats.length > 0" class="stats-grid">
                <div v-for="(stat, statIndex) in block.settings.stats" :key="statIndex"
                     class="stat-item scroll-animate"
                     :class="{ 'animated': isInView('stat-' + block.id + '-' + statIndex), 'hidden': !isInView('stat-' + block.id + '-' + statIndex) }"
                     :id="'stat-' + block.id + '-' + statIndex"
                     :style="'transition-delay: ' + (0.1 + statIndex * 0.1) + 's'">
                  <div class="stat-number">{{ stat.number }}</div>
                  <div class="stat-label">{{ stat.label }}</div>
                </div>
              </div>
              <div v-else class="empty-stats">
                <p>Нет данных для отображения</p>
              </div>
            </div>
          </section>
        `,
        props: {
            block: {
                type: Object,
                default: {
                    id: 0,
                    type: '',
                    settings: ''
                }
            },
            isInView: Function,
        }
    }

    const Contact = {
        mixins: [Data],
        template: `
          <section v-if="block && block.type === 'contact'" id="contact">
            <div class="container">
              <h2 v-if="block.settings.sectionTitle" class="section-title scroll-animate"
                  :class="{ 'animated': isInView('contact-title-' + block.id), 'hidden': !isInView('contact-title-' + block.id) }"
                  :id="'contact-title-' + block.id">{{ block.settings.sectionTitle }}</h2>
              <div class="contact-info">
                <div class="contact-details-card scroll-animate"
                     :class="{ 'animated': isInView('contact-panel-' + block.id), 'hidden': !isInView('contact-panel-' + block.id) }"
                     :id="'contact-panel-' + block.id">
                  <div class="contact-details">
                    <div v-if="block.settings.email" class="contact-item" :id="'contact-email-' + block.id">
                      <i class="fas fa-envelope"></i>
                      <a :href="'mailto:' + block.settings.email">{{ block.settings.email }}</a>
                    </div>
                    <div v-if="block.settings.phone" class="contact-item" :id="'contact-phone-' + block.id">
                      <i class="fas fa-phone"></i>
                      <a :href="'tel:' + block.settings.phone">{{ block.settings.phone }}</a>
                    </div>
                    <div v-if="block.settings.address" class="contact-item"
                         :id="'contact-address-' + block.id">
                      <i class="fas fa-map-marker-alt"></i>
                      <span>{{ block.settings.address }}</span>
                    </div>
                  </div>
                  <div v-if="links(block.settings.socialLinks)"
                       class="social-links contact-social-links">
                    <a v-if="block.settings.socialLinks.instagram"
                       :href="block.settings.socialLinks.instagram" target="_blank" class="social-link"
                       aria-label="Instagram">
                      <i class="fab fa-instagram"></i>
                    </a>
                    <a v-if="block.settings.socialLinks.tiktok" :href="block.settings.socialLinks.tiktok"
                       target="_blank" class="social-link" aria-label="TikTok">
                      <i class="fab fa-tiktok"></i>
                    </a>
                    <a v-if="block.settings.socialLinks.telegram"
                       :href="block.settings.socialLinks.telegram" target="_blank" class="social-link"
                       aria-label="Telegram">
                      <i class="fab fa-telegram"></i>
                    </a>
                  </div>
                </div>
                <div class="contact-form-card scroll-animate"
                     :class="{ 'animated': isInView('contact-form-' + block.id), 'hidden': !isInView('contact-form-' + block.id) }"
                     :id="'contact-form-' + block.id">
                  <h3>Напишите нам</h3>
                  <p>Оставьте имя, email и короткое сообщение, и мы свяжемся с вами в ближайшее время.</p>
                  <form class="contact-form" @submit.prevent="submit">
                    <div class="form-group">
                      <label for="contact-name">Ваше имя *</label>
                      <input
                          id="contact-name"
                          type="text"
                          class="form-control"
                          v-model.trim="contactForm.name"
                          required
                          :disabled="contactLoading"
                          autocomplete="name"
                          placeholder="Иван Иванов">
                    </div>
                    <div class="form-group">
                      <label for="contact-email">Ваш email *</label>
                      <input
                          id="contact-email"
                          type="email"
                          class="form-control"
                          v-model.trim="contactForm.email"
                          required
                          :disabled="contactLoading"
                          autocomplete="email"
                          placeholder="name@example.com">
                    </div>
                    <div class="form-group">
                      <label for="contact-message">Сообщение *</label>
                      <textarea
                          id="contact-message"
                          class="form-control"
                          rows="4"
                          v-model.trim="contactForm.message"
                          required
                          :disabled="contactLoading"></textarea>
                    </div>
                    <div class="contact-form-status" aria-live="polite">
                      <span v-if="contactError" class="error-message">{{ contactError }}</span>
                      <span v-else-if="contactSuccess" class="success-message">{{ contactSuccess }}</span>
                    </div>
                    <button type="submit" class="btn btn-primary" :disabled="contactLoading">
                      {{ contactLoading ? 'Отправляем...' : 'Отправить сообщение' }}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        `,
        props: {
            block: {
                type: Object,
                default: {
                    id: 0,
                    type: '',
                    settings: ''
                }
            },
            isInView: Function,
        },
        data() {
            return {
                contactLoading: false,
                contactError: '',
                contactSuccess: '',
                contactForm: {
                    name: '',
                    email: '',
                    message: ''
                },
            }
        },
        methods: {
            links(e) {
                return e && Object.values(e).some(link => link && link.trim() !== '');
            },
            async submit() {
                if (this.contactLoading) {
                    return;
                }

                this.contactError = '';
                this.contactSuccess = '';

                const name = (this.contactForm.name || '').trim();
                const email = (this.contactForm.email || '').trim();
                const message = (this.contactForm.message || '').trim();

                if (!name || !email || !message) {
                    this.contactError = 'Пожалуйста, заполните имя, email и сообщение';
                    return;
                }

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    this.contactError = 'Введите корректный email';
                    return;
                }

                if (name.length > 200) {
                    this.contactError = 'Имя слишком длинное';
                    return;
                }

                if (message.length < 10) {
                    this.contactError = 'Сообщение должно содержать не менее 10 символов';
                    return;
                }

                if (message.length > 2000) {
                    this.contactError = 'Сообщение слишком длинное';
                    return;
                }

                this.contactLoading = true;

                try {
                    const payload = new FormData();
                    payload.append('action', 'contact_form');
                    payload.append('name', name);
                    payload.append('email', email);
                    payload.append('message', message);

                    const response = await fetch('api.php', {
                        method: 'POST',
                        body: payload,
                        credentials: 'same-origin'
                    });

                    const result = await response.json();

                    if (!response.ok || !result.success) {
                        throw new Error(result.error || 'Не удалось отправить сообщение');
                    }

                    this.contactSuccess = result.message || 'Сообщение отправлено. Мы скоро свяжемся с вами!';
                    this.contactForm = { name: '', email: '', message: '' };
                } catch (error) {
                    this.contactError = error.message || 'Не удалось отправить сообщение';
                } finally {
                    this.contactLoading = false;
                }
            },
        }
    }

    const Actual = {
        mixins: [Data, Props],
        template: `
          <section v-if="block && block.settings.promotions && block.settings.promotions.length > 0" id="actual">
            <div class="container">
              <h2 v-if="block.settings.sectionTitle" class="section-title scroll-animate"
                  :class="{ 'animated': isInView('actual-title-' + block.id), 'hidden': !isInView('actual-title-' + block.id) }"
                  :id="'actual-title-' + block.id">{{ block.settings.sectionTitle }}</h2>
              <div class="actual-grid">
                <article v-for="(promo, promoIndex) in block.settings.promotions" :key="promoIndex"
                         class="actual-card scroll-animate"
                         :class="{ 'animated': isInView('actual-' + block.id + '-' + promoIndex), 'hidden': !isInView('actual-' + block.id + '-' + promoIndex) }"
                         :id="'actual-' + block.id + '-' + promoIndex">
                  <div v-if="promo.image" class="actual-card-image">
                    <img :src="promo.image" :alt="promo.title">
                  </div>
                  <div class="actual-card-inner">
                    <div class="actual-badge">
                      <i class="fas fa-tags"></i>
                      <span>Акция</span>
                    </div>
                    <h3 class="actual-card-title">{{ promo.title }}</h3>
                    <p v-if="promo.description" class="actual-card-description">{{ promo.description }}</p>
                    <div class="product-promo-list">
                      <a v-for="(link, idx) in (Array.isArray(promo.links) ? promo.links : Object.values(promo.links || {}))"
                         :key="idx" :href="link.link" class="product-promo-item">
                        <div class="product-promo-image">
                          <img v-if="link.data?.image" :src="'/' + link.data.image" :alt="link.title || link.name">
                          <div v-else class="product-promo-placeholder">
                            <i class="fas fa-image"></i>
                          </div>
                        </div>
                        <div class="product-promo-content">
                          <h4 class="product-promo-title">{{ link.title || link.name }}</h4>
                          <p v-if="link.description" class="product-promo-description">{{ link.description }}</p>
                          <div class="product-price-promo">
                            <p class="product-promo price" :class="link.data.price_sale ? 'price-old' : ''">{{ link.data.price }} руб.</p>
                            <h4 class="product-promo price-sale" v-if="link.data.price_sale">{{ link.data.price_sale }} руб.</h4>
                          </div>
                        </div>
                        <i class="product-promo-arrow fas fa-arrow-right"></i>
                      </a>
                    </div>
                    <a v-if="promo.link" :href="getActualLink(promo)" class="actual-card-link"
                       @click="actualLinkClick($event, promo)">
                      {{ promo.linkText || 'Подробнее' }}
                      <i class="fas fa-arrow-right"></i>
                    </a>
                  </div>
                </article>
              </div>
            </div>
          </section>
        `,
        props: {
            block: {
                type: Object,
                default: {
                    id: 0,
                    type: '',
                    settings: ''
                }
            },
            isInView: Function,
        },
        methods: {
            getActualLink(promo) {
                if (!promo || !promo.link) return '#';
                return this.getLink({ linkType: promo.linkType || 'url', link: promo.link, target: promo.link });
            },
            actualLinkClick(event, promo) {
                if (!promo || !promo.link) return;
                this.click(event, { linkType: promo.linkType || 'url', link: promo.link, target: promo.link });
            },
        }
    }

    const InfoButtons = {
        mixins: [Data, Props],
        template: `
          <section v-if="block && block.type === 'info_buttons' && block.is_active && block.settings.buttons && block.settings.buttons.length > 0" id="info-buttons">
            <div class="info-buttons-container">
              <h2 v-if="block.settings.sectionTitle" class="section-title" :id="'info-buttons-title-' + block.id">
                {{ block.settings.sectionTitle }}</h2>
              <div class="buttons-container" :id="'info-buttons-container-' + block.id">
                <a v-for="(button, index) in block.settings.buttons" :key="index" :href="getLink(button)"
                   @click="click($event, button)" class="btn btn-secondary">
                  {{ button.text }}
                </a>
              </div>
            </div>
          </section>
        `,
        props: {
            block: {
                type: Object,
                default: {
                    id: 0,
                    type: '',
                    settings: ''
                }
            },
            isInView: Function,
        }
    }

    const FooterBlock = {
        mixins: [Data, Props],
        template: `
          <section id="footer">
            <footer>
                <div class="container" style="flex: 1">
                  <div v-if="block.settings.paysystems" class="paysystems">
                    <ul>
                      <li><img src="NV/main/styles/images/bepaid.png"></li>
                      <li><img src="NV/main/styles/images/erip.svg"></li>
                    </ul>
                    <ul>
                      <li><img src="NV/main/styles/images/visa.png"></li>
                      <li><img src="NV/main/styles/images/mastercard.png"></li>
                      <li><img src="NV/main/styles/images/belkart.png"></li>
                      <li><img src="NV/main/styles/images/apple-pay.webp"></li>
                      <li><img src="NV/main/styles/images/samsung-pay.png"></li>
                      <li><img src="NV/main/styles/images/google-pay.webp"></li>
                    </ul>
                  </div>
                  <div class="footer-content"
                       :class="{ 'animated': isInView('footer-content-' + block.id) }"
                       id="'footer-content-' + footerBlock.id" 
                       v-html="block.content"
                  >
                  </div>
                  <div class="footer-copyright">
                    <div class="copyright-block">
                      Copyright © 2025, {{ title }} — Все права защищены
                    </div>
                  </div>
              </div>
            </footer>
          </section>
        `,
        props: {
            block: {
                type: Object,
                default: {
                    id: 0,
                    type: '',
                    settings: ''
                }
            },
            isInView: Function,
        },
        data() {
            return {
                title: NV.title
            }
        }
    }

    window.Props = Props;
    window.Modal = Modal;
    window.Login = Login;
    window.Register = Register;
    window.Order = Order;
    window.Options = Options;
    window.Hero = Hero;
    window.Actual = Actual;
    window.Products = Products;
    window.Projects = Projects;
    window.Features = Features;
    window.Buttons = Buttons;
    window.HistoryBlock = HistoryBlock;
    window.TextBlock = TextBlock;
    window.Stats = Stats;
    window.Contact = Contact;
    window.InfoButtons = InfoButtons;
    window.FooterBlock = FooterBlock;
})