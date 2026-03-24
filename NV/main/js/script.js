NV.ready(() => {
    setTimeout(() => {
        const { createApp } = Vue;

        const blockComponents = {
            hero: window.Hero,
            actual: window.Actual,
            products: window.Products,
            features: window.Features,
            buttons: window.Buttons,
            history: window.HistoryBlock,
            text: window.TextBlock,
            stats: window.Stats,
            contact: window.Contact,
            info_buttons: window.InfoButtons,
            footer: window.FooterBlock
        };

        createApp({
            mixins: [window.Props],
            components: {
                hero: window.Hero,
                actual: window.Actual,
                products: window.Products,
                features: window.Features,
                buttons: window.Buttons,
                history: window.HistoryBlock,
                text: window.TextBlock,
                stats: window.Stats,
                contact: window.Contact,
                info_buttons: window.InfoButtons,
                footer: window.FooterBlock
            },
            data() {
                return {
                    blockComponents: blockComponents,
                    auth: NV.getAuth(),
                    showLogin: false,
                    showRegister: false,
                    userMenuOpen: false,
                    loginData: { username: '', password: '', remember: false },
                    loginLoading: false,
                    loginError: '',
                    registerData: { username: '', password: '', confirmPassword: '' },
                    registerLoading: false,
                    registerError: '',
                    isScrolled: false,
                    mobileMenuOpen: false,
                    cartOpen: false,
                    favoritesOpen: false,
                    orderModalOpen: false,
                    buyNowPressed: false,
                    addToCartPressed: false,
                    hand: null,
                    productOptions: [],
                    selectedProductOptions: [],
                    optionSelectionIndex: 0,
                    showHandSelector: false,
                    showOptionSelector: false,
                    selectingHandProductId: null,
                    selectingHandAction: null,
                    selectingFromFavorites: false,
                    wishlist: [],
                    cartItems: [],
                    contactForm: {
                        name: '',
                        email: '',
                        message: ''
                    },
                    contactLoading: false,
                    contactError: '',
                    contactSuccess: '',
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
                    fieldErrors: {
                        customer_name: '',
                        customer_phone: '',
                        delivery_city: '',
                        delivery_street: '',
                        delivery_building: '',
                        policy: ''
                    },
                    currentOrderProduct: null,
                    touchStartX: 0,
                    touchEndX: 0,
                    touchStartY: 0,
                    touchEndY: 0,
                    page: 'main',
                    categories: [],
                    products: [],
                    animatedProducts: [],
                    features: [],
                    elementStates: {},
                    homeContent: {
                        features: [],
                        history: []
                    },
                    pageBlocks: [],
                    sortedPageBlocks: [],
                    currentVirtualPage: null,
                    virtualPageError: null,
                    headerNavigation: {
                        main: [],
                        other: []
                    },
                    imageInfo: {},
                    policyYes: false,
                    policyNo: false,
                    deliveryAvailable: true,
                    productImageIndices: {},
                    productImageTouchStart: {},
                    productImageMouseStart: {},
                    productImageNavigating: {},
                    imageLoadingStates: {},
                    currentProduct: null,
                    productLoading: false,
                    productError: null,
                    productQuantity: 1,
                    currentProductImageIndex: 0,
                    productSlideDirection: 'next',
                    contentView: false,
                    productMinSwipeDistance: 50,
                    imageMetaTags: '',
                    pickupAddress: '',
                    workHours: '',
                    storePhone: '',
                    deliveryBel: '',
                    deliveryRus: '',
                    defaultVirtualPageTitleSuffix: ' - ' + NV.title,
                    virtualPageNotFoundDocumentTitle: 'Страница не найдена - ' + NV.title,
                    virtualPageLoadErrorDocumentTitle: 'Ошибка - ' + NV.title,
                }
            },
            computed: {
                filteredBlocks() {
                    return (this.sortedPageBlocks || []).filter(Boolean);
                },
                policy() {
                    return !!this.policyYes && !this.policyNo;
                },
                cartTotal() {
                    if (!this.cartItems || !Array.isArray(this.cartItems)) {
                        return 0;
                    }
                    return this.cartItems.reduce((total, item) => {
                        return total + (item.price * item.quantity);
                    }, 0);
                },
                isMobile() {
                    return window.innerWidth <= 768;
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
                favoriteProducts() {
                    return this.products.filter(product => this.wishlist.includes(product.id));
                },
                formattedPageContent() {
                    if (!this.currentVirtualPage || !this.currentVirtualPage.content) {
                        return '';
                    }
                    let content = this.currentVirtualPage.content;

                    if (content.includes('<') && content.includes('>')) {
                        return content;
                    }

                    content = content.trim();

                    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

                    return paragraphs.map(p => {
                        const formatted = p.trim().replace(/\n/g, '<br>');
                        return `<p>${formatted}</p>`;
                    }).join('');
                },
                isMainPage() {
                    if (this.currentVirtualPage || this.currentProduct) {
                        return false;
                    }

                    let path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');

                    if (path.startsWith('nv/')) {
                        path = path.replace('nv/', '');
                    } else if (path === 'nv') {
                        path = '';
                    }

                    return !path || path === '' || path === 'index.php';
                },
                navigationButtons() {
                    if (this.isMainPage) {
                        const buttons = [];
                        if (this.hasBlockType('products')) {
                            buttons.push({ label: 'Товары', target: 'products', linkType: 'section' });
                        }
                        if (this.hasBlockType('features')) {
                            buttons.push({ label: 'Преимущества', target: 'features', linkType: 'section' });
                        }
                        if (this.hasBlockType('history')) {
                            buttons.push({ label: 'История', target: 'history', linkType: 'section' });
                        }
                        if (this.hasBlockType('contact')) {
                            buttons.push({ label: 'Контакты', target: 'contact', linkType: 'section' });
                        }
                        return buttons;
                    } else {
                        return this.headerNavigation.other || [];
                    }
                },
                deliveryAddressPreview() {
                    if (this.orderForm.delivery_type !== 'delivery') {
                        return '';
                    }
                    return this.buildDeliveryAddress();
                },
                today() {
                    return new Date().toISOString().split('T')[0];
                },
                allProductImages() {
                    if (!this.currentProduct) return [];
                    const images = [];

                    const main = this.normalizeMediaUrl(this.currentProduct.image);
                    if (main) {
                        images.push(main);
                    }

                    if (Array.isArray(this.currentProduct.additional_images)) {
                        images.push(
                            ...this.currentProduct.additional_images
                                .map((img) => this.normalizeMediaUrl(img))
                                .filter(Boolean)
                        );
                    }

                    return images;
                },
                allProductVideos() {
                    if (!this.currentProduct) return [];
                    if (!Array.isArray(this.currentProduct.additional_videos)) {
                        return [];
                    }

                    return this.currentProduct.additional_videos
                        .map((vid) => this.normalizeMediaUrl(vid))
                        .filter(Boolean);
                },
                allProductMedia() {
                    if (!this.currentProduct) return [];
                    const media = [];
                    media.push(...this.allProductImages);
                    media.push(...this.allProductVideos);
                    return media;
                },
                currentProductImage() {
                    if (!this.currentProduct || this.allProductMedia.length === 0) return '';
                    const image = this.allProductMedia[this.currentProductImageIndex] || this.allProductMedia[0] || '';
                    if (!image || image.trim() === '') return '';
                    return image;
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
                orderModalOpen(newVal) {
                    if (newVal) {
                        this.$nextTick(() => {
                            this.fillPickupParams();
                        });
                    }
                }
            },
            mounted() {
                this.init();
                this.initVideoAutoplay();

                window.addEventListener('cartUpdated', this.handleCartUpdated);
            },
            beforeUnmount() {
                window.removeEventListener('scroll', this.handleScroll);
                window.removeEventListener('resize', this.handleResize);
                window.removeEventListener('popstate', this.handlePopState);
                document.removeEventListener('touchstart', this.handleDocumentTouchStart);
                document.removeEventListener('touchmove', this.handleDocumentTouchMove);
                document.removeEventListener('touchend', this.handleDocumentTouchEnd);
                document.removeEventListener('mouseup', this.handleGlobalMouseUp);
                document.removeEventListener('mousemove', this.handleGlobalMouseMove);
                window.removeEventListener('cartUpdated', this.handleCartUpdated);
            },
            methods: {
                init() {
                    document.addEventListener('keydown', (e) => {
                        if (e.key === 'Escape') {
                            this.closeFavorites();
                            this.closeAllMenus();
                            this.closeCart();
                            this.closeLogin();
                            this.closeRegister();
                            this.closeOrderModal();
                            this.closeMobileMenu();
                            this.closeOtherMenus();
                        }

                        if (e.key === 'ArrowLeft' && this.contentView && this.currentProduct) {
                            this.previousProductImage();
                        }
                        if (e.key === 'ArrowRight' && this.contentView && this.currentProduct) {
                            this.nextProductDetailImage();
                        }
                    });

                    this.checkMe().then(r => null);

                    const savedUser = localStorage.getItem('remember_username');

                    if (savedUser) {
                        this.loginData.username = savedUser;
                        this.loginData.remember = true;
                    }

                    window.addEventListener('scroll', this.handleScroll);
                    window.addEventListener('resize', this.handleResize);
                    document.addEventListener('touchstart', this.handleDocumentTouchStart, { passive: false });
                    document.addEventListener('touchmove', this.handleDocumentTouchMove, { passive: false });
                    document.addEventListener('mouseup', this.handleGlobalMouseUp);
                    document.addEventListener('mousemove', this.handleGlobalMouseMove);
                    document.addEventListener('touchend', this.handleDocumentTouchEnd, { passive: false });

                    if (this.isMainPage) {
                        this.currentVirtualPage = null;
                        this.virtualPageError = null;
                    }

                    this.initScrollAnimations();
                    this.updateSortedPageBlocks();
                    this.loadProducts().then(r => null);
                    this.loadHomeContent().then(r => null);
                    this.loadCategories().then(r => null);
                    this.loadProductOptions().then(r => null);
                    this.loadPageBlocks().then(() => {
                        this.updateSortedPageBlocks();
                    });

                    this.loadCart();
                    this.loadWishlist();
                    this.initProductImageNavigation();
                    this.initProductLinkHandlers();
                    this.checkProductFromURL();

                    window.addEventListener('popstate', this.handlePopState);

                    document.addEventListener('click',e => {
                        if (e.target.classList.contains('active')) {
                            this.closeOrderModal();
                        }
                    });
                },
                getBlockProps(block) {
                    const base = {
                        block,
                        isInView: this.isInView
                    };

                    switch (block.type) {
                        case 'hero':
                            return {
                                ...base,
                                navClick: this.navClick
                            };

                        case 'products':
                            return {
                                ...base,
                                products: this.products,
                                categories: this.categories,
                                elementStates: this.elementStates,
                                cartItems: this.cartItems,
                                wishlist: this.wishlist,
                                imageMetaTags: this.imageMetaTags,
                                isMobile: this.isMobile,
                                isVideo: this.isVideo,
                                getCurrentProductImage: this.getCurrentProductImage,

                                'onUpdate:cartItems': e => this.cartItems = e,
                                'onUpdate:wishlist': e => this.wishlist = e,

                                onOpenCart: () => {
                                    this.closeFavorites();
                                    this.cartOpen = true;
                                },
                                onOpenFavorites: () => {
                                    this.closeCart();
                                    this.favoritesOpen = true;
                                },
                                onCloseFavorites: () => {
                                    this.favoritesOpen = false;
                                },
                                onOpenOrder: (orderProduct) => {
                                    if (orderProduct && typeof orderProduct === 'object' && orderProduct.id != null) {
                                        this.currentOrderProduct = orderProduct;
                                    }
                                    this.openOrderModal();
                                },
                            };

                        default:
                            return base;
                    }
                },
                async checkMe() {
                    try {
                        this.auth = await NV.checkUserAuth();
                    } catch (e) {
                        console.error('Auth error:', e);
                        this.auth = { authenticated: false, role: null, username: null };
                        localStorage.removeItem('global_auth');
                    }
                },
                openLogin() {
                    this.loginError = '';
                    this.showRegister = false;
                    this.showLogin = true;
                    this.userMenuOpen = false;
                    this.closeMobileMenu();
                },
                closeLogin() {
                    this.showLogin = false;
                    this.loginData = { username: '', password: '', remember: false };
                    this.loginError = '';
                },
                openRegister() {
                    this.registerError = '';
                    this.showLogin = false;
                    this.showRegister = true;
                    this.userMenuOpen = false;
                    this.closeMobileMenu();
                },
                closeRegister() {
                    this.showRegister = false;
                    this.registerData = { username: '', password: '', confirmPassword: '' };
                    this.registerError = '';
                },
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
                            this.showRegister = false;
                            this.openLogin();
                            this.loginData.username = username;
                            this.loginError = 'Регистрация успешна. Войдите в аккаунт.';
                        }
                    } catch (err) {
                        this.registerError = err.message || 'Ошибка регистрации';
                    } finally {
                        this.registerLoading = false;
                    }
                },
                async logout() {
                    await NV.logout();
                    this.auth = NV.getAuth();
                },
                handleScroll() {
                    this.isScrolled = window.scrollY > 50;
                    this.checkScrollAnimations();

                    if (this.userMenuOpen) {
                        this.positionUserMenu();
                    }
                },
                handleResize() {

                    if (this.userMenuOpen) {
                        this.positionUserMenu();
                    }
                },
                toggleMobileMenu() {
                    this.mobileMenuOpen = !this.mobileMenuOpen;
                },
                closeMobileMenu() {
                    this.mobileMenuOpen = false;
                },
                closeAllMenus() {
                    this.mobileMenuOpen = false;
                    this.cartOpen = false;
                    this.userMenuOpen = false;
                    this.favoritesOpen = false;
                    this.orderModalOpen = false;
                },
                toggleUserMenu() {
                    this.userMenuOpen = !this.userMenuOpen;
                    if (this.userMenuOpen) {
                        this.$nextTick(() => {
                            this.positionUserMenu();
                        });
                    }
                },
                positionUserMenu() {
                    const userMenu = document.querySelector('.user-menu');
                    const userMenuPopup = document.querySelector('.user-menu-popup');
                    if (userMenu && userMenuPopup) {
                        const rect = userMenu.getBoundingClientRect();

                        if (window.innerWidth <= 768) {
                            userMenuPopup.style.top = (rect.bottom + 8) + 'px';
                            userMenuPopup.style.left = '50%';
                            userMenuPopup.style.right = 'auto';
                            userMenuPopup.style.transform = 'translateX(-50%)';
                        } else {

                            userMenuPopup.style.top = (rect.bottom + 8) + 'px';
                            userMenuPopup.style.right = (window.innerWidth - rect.right) + 'px';
                            userMenuPopup.style.left = 'auto';
                            userMenuPopup.style.transform = 'none';
                        }
                    }
                },
                toggleFavorites() {
                    this.closeOtherMenus();

                    if (this.mobileMenuOpen) {
                        this.mobileMenuOpen = false;
                        setTimeout(() => {
                            this.favoritesOpen = true;
                        }, 300);
                    } else {
                        this.favoritesOpen = true;
                    }
                },
                closeFavorites() {
                    this.favoritesOpen = false;
                },
                toggleCart() {
                    if (this.mobileMenuOpen) {
                        this.mobileMenuOpen = false;
                        setTimeout(() => {
                            this.cartOpen = !this.cartOpen;
                        }, 300);
                    } else {
                        this.cartOpen = !this.cartOpen;
                    }
                },
                closeCart() {
                    this.cartOpen = false;
                },
                isInWishlist(productId) {
                    return this.wishlist.includes(productId);
                },
                toggleWishlist(productId, event) {
                    if (this.isMobile && event) {
                        event.stopPropagation();
                    }

                    if (this.isInWishlist(productId)) {
                        this.wishlist = this.wishlist.filter(id => id !== productId);
                    } else {
                        this.wishlist.push(productId);
                    }

                    this.saveWishlist();
                },
                async startOptionSelection(product, action, point, event) {
                    if (this.isMobile && event) {
                        event.stopPropagation();
                    }

                    this.resetOptionSelectionState();

                    if (point === 'buyNow') {
                        this.buyNowPressed = true;
                    } else if (point === 'addToCart') {
                        this.addToCartPressed = true;
                    }

                    this.selectingHandProductId = product.id;

                    this.selectingHandAction = action; // 'buy' | 'cart'

                    await this.loadProductOptions();

                    if (this.productOptions.length > 0) {
                        this.showOptionSelector = true;
                    } else {
                        this.finishOptionSelection(product);
                    }
                },
                chooseOptionValue(product, value) {
                    const optionType = this.currentOptionType;
                    if (!optionType) {
                        return;
                    }
                    const slug = optionType.slug || this.slugifyOptionName(optionType.name) || `option-${this.optionSelectionIndex}`;
                    this.selectedProductOptions.push({
                        slug,
                        name: optionType.name || `Опция ${this.optionSelectionIndex + 1}`,
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
                        this.currentOrderProduct = {
                            ...product,
                            options: optionsSnapshot,
                            optionKey,
                            quantity: 1
                        };
                        this.openOrderModal();
                    } else if (this.selectingHandAction === 'cart') {
                        this.addToCartInternal(product, optionsSnapshot);

                        if (this.selectingFromFavorites) {
                            this.wishlist = this.wishlist.filter(id => id !== product.id);
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
                },
                addToCartInternal(product, options = []) {
                    const optionKey = this.buildOptionKey(options);
                    const existingItem = this.cartItems.find(item =>
                        item.id === product.id &&
                        (item.optionKey || this.buildOptionKey(item.options || [])) === optionKey
                    );

                    if (existingItem) {
                        existingItem.quantity += 1;
                    } else {
                        const cartProduct = {
                            ...product,
                            price: product.price_sale || product.price,
                            options,
                            optionKey,
                            quantity: 1
                        };
                        this.cartItems.push(cartProduct);
                    }
                    this.saveCart();
                },
                saveCart() {
                    localStorage.setItem('cart', JSON.stringify(this.cartItems));
                },
                loadCart() {
                    const savedCart = localStorage.getItem('cart');

                    if (!savedCart) {
                        this.cartItems = [];
                        return;
                    }

                    try {
                        const parsed = JSON.parse(savedCart);
                        this.cartItems = Array.isArray(parsed) ? parsed.map(item => this.normalizeCartItem(item)) : [];
                    } catch (error) {
                        console.error('Failed to parse cart from storage:', error);
                        this.cartItems = [];
                    }
                },
                handleCartUpdated() {
                    this.loadCart();
                },
                saveWishlist() {
                    localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
                },
                loadWishlist() {
                    const savedWishlist = localStorage.getItem('wishlist');
                    this.wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
                },
                navClick(event, targetId) {
                    event.preventDefault();
                    this.closeAllMenus();

                    if (this.isMainPage) {
                        this.smoothScrollTo(targetId);
                        return;
                    }

                    const slug = targetId.toLowerCase().replace(/\s+/g, '-');

                    this.openVirtualPage(slug, { updateHistory: true, scrollToTop: true }).then((page) => {
                        if (!page) {
                            this.goHome({ updateHistory: true, scrollToTop: false });
                            this.$nextTick(() => {
                                this.smoothScrollTo(targetId);
                            });
                        }
                    }).catch(() => {
                        this.goHome({ updateHistory: true, scrollToTop: false });
                        this.$nextTick(() => {
                            this.smoothScrollTo(targetId);
                        });
                    });
                },
                checkProductFromURL() {
                    const urlParams = new URLSearchParams(window.location.search);
                    const productId = urlParams.get('product');
                    if (productId) {
                        this.loadProductFromURL(productId);
                    }
                },
                async loadProductFromURL(productId) {
                    if (!productId) return;

                    if (!this.products || this.products.length === 0) {
                        await this.loadProducts();
                    }

                    const product = this.products.find(p => p.id === productId);

                    if (product) {
                        this.openProductPage(product);
                    } else {
                        const basePath = this.getBasePath();
                        if (window.history && window.history.replaceState) {
                            window.history.replaceState({ type: 'main' }, '', basePath);
                        }
                    }
                },
                openProductDetail(product) {
                    if (!product || !product.id) return;
                    this.openProductPage(product);
                    const basePath = this.getBasePath();
                    const normalizedBasePath = basePath.endsWith('/') ? basePath : basePath + '/';
                    const url = new URL(window.location.href);
                    url.pathname = normalizedBasePath;
                    url.search = '?product=' + encodeURIComponent(product.id);
                    if (window.history && window.history.pushState) {
                        window.history.pushState({ productId: product.id, type: 'product' }, '', url.toString());
                    }
                },
                removeFromCart(cartItem) {
                    if (confirm(`Вы действительно хотите удалить ${cartItem.name} из корзины?`)) {
                        this.cartItems = this.cartItems.filter(item => item !== cartItem);
                        this.saveCart();
                        if (this.cartItems.length === 0 && this.orderModalOpen) {
                            this.closeOrderModal();
                        }
                    }
                },
                increaseQuantity(cartItem) {
                    if (cartItem) {
                        cartItem.quantity += 1;
                    }
                    this.saveCart();
                },
                decreaseQuantity(cartItem) {
                    if (cartItem && cartItem.quantity > 1) {
                        cartItem.quantity -= 1;
                    } else {
                        this.removeFromCart(cartItem);
                    }
                    this.saveCart();
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
                async submitContactForm() {
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
                handleProductCardClick(event, product) {
                    if (this.isMobile) {
                        const isButtonClick = event.target.closest('button') !== null;
                        if (!isButtonClick) {
                            event.preventDefault();
                            event.stopPropagation();
                            return;
                        }
                    }
                },
                handleTouchStart(e) {
                    this.touchStartX = e.changedTouches[0].screenX;
                    this.touchStartY = e.changedTouches[0].screenY;
                },
                handleTouchMove(e) {
                    e.preventDefault();
                },
                handleTouchEnd(e) {
                    this.touchEndX = e.changedTouches[0].screenX;
                    this.touchEndY = e.changedTouches[0].screenY;
                    this.handleSwipe();
                },
                handleFavoritesTouchStart(e) {
                    this.touchStartX = e.touches[0].clientX;
                    this.touchStartY = e.touches[0].clientY;
                },
                handleFavoritesTouchMove(e) {
                    if (e.target.closest('.favorites-content')) {
                        return;
                    }
                    e.preventDefault();
                },
                handleFavoritesTouchEnd(e) {
                    this.touchEndX = e.changedTouches[0].clientX;
                    this.touchEndY = e.changedTouches[0].clientY;
                    this.handleFavoritesSwipe();
                },
                handleFavoritesSwipe() {
                    const diffX = this.touchEndX - this.touchStartX;
                    const diffY = Math.abs(this.touchEndY - this.touchStartY);

                    if (diffX > 50 && diffY < 100) {
                        this.closeFavorites();
                    }
                },
                handleDocumentTouchStart(e) {
                    this.touchStartX = e.touches[0].clientX;
                    this.touchStartY = e.touches[0].clientY;
                },
                handleDocumentTouchMove(e) {
                    if (!this.mobileMenuOpen && this.touchStartX < 50) {
                        e.preventDefault();
                    }
                },
                handleDocumentTouchEnd(e) {
                    this.touchEndX = e.changedTouches[0].clientX;
                    this.touchEndY = e.changedTouches[0].clientY;

                    if (this.touchStartX < 50) {
                        this.handleDocumentSwipe();
                    }
                },
                handleSwipe() {
                    const diffX = this.touchStartX - this.touchEndX;
                    const diffY = Math.abs(this.touchStartY - this.touchEndY);

                    if (Math.abs(diffX) > 50 && diffY < 100) {
                        if (diffX > 0) {
                            this.closeMobileMenu();
                        }
                    }
                },
                handleDocumentSwipe() {
                    const diffX = this.touchEndX - this.touchStartX;
                    const diffY = Math.abs(this.touchEndY - this.touchStartY);

                    if (diffX > 50 && diffY < 100) {
                        this.mobileMenuOpen = true;
                    }
                },
                initScrollAnimations() {
                    document.querySelectorAll('.section-title, .tagline, .description, .hero-buttons, .filters, .form-group, .social-link, .copyright, .timeline-item, .stat-item').forEach(el => {
                        el.classList.add('scroll-animate');
                    });

                    this.showAllElementsOnLoad();

                    setTimeout(() => {
                        this.checkScrollAnimations();
                    }, 100);
                },
                showAllElementsOnLoad() {
                    document.querySelectorAll('.scroll-animate, .scroll-animate-left, .scroll-animate-right, .scroll-animate-scale, .product-card, .feature-card, .timeline-item, .stat-item').forEach(el => {
                        el.classList.remove('hidden');
                        el.classList.add('animated');
                        const elementId = el.id || this.generateElementId(el);
                        this.elementStates[elementId] = 'animated';
                    });
                },
                checkScrollAnimations() {
                    document.querySelectorAll('.scroll-animate, .scroll-animate-left, .scroll-animate-right, .scroll-animate-scale, .product-card, .feature-card, .timeline-item, .stat-item').forEach(el => {
                        this.checkIfElementInView(el);
                    });
                },
                checkIfElementInView(element) {
                    const elementTop = element.getBoundingClientRect().top;
                    const elementBottom = element.getBoundingClientRect().bottom;
                    const windowHeight = window.innerHeight;
                    const elementId = element.id || this.generateElementId(element);
                    const isProductCard = element.classList.contains('product-card');

                    if (elementTop < windowHeight * 0.9 && elementBottom > 0) {
                        if (!element.classList.contains('animated') || this.elementStates[elementId] === 'hidden') {
                            element.classList.remove('hidden');
                            element.classList.add('animated');
                            this.elementStates[elementId] = 'animated';
                        }
                    } else {
                        if (!isProductCard) {
                            if (element.classList.contains('animated') || this.elementStates[elementId] === 'animated') {
                                element.classList.remove('animated');
                                element.classList.add('hidden');
                                this.elementStates[elementId] = 'hidden';
                            }
                        }
                    }

                    if (elementId.includes('product-') && !this.animatedProducts.includes(elementId)) {
                        let container = element.querySelector('.product-img-container');
                        if (container) {
                            const enableHover = () => {return element.querySelector('h3')?.classList.add('product-title-hover');}
                            const disableHover = () => {return element.querySelector('h3')?.classList.remove('product-title-hover');}

                            container.removeEventListener('mouseover', enableHover);
                            container.addEventListener('mouseover', enableHover);

                            container.removeEventListener('mouseout', disableHover);
                            container.addEventListener('mouseout', disableHover);
                        }
                    }
                },
                isInView(id) {
                    return this.elementStates[id] === 'animated';
                },
                generateElementId(element) {
                    if (!element.id) {
                        element.id = 'element-' + Math.random().toString(36).substr(2, 9);
                    }
                    return element.id;
                },
                async loadProductOptions() {
                    try {
                        let response;
                        const typeId = this.selectingHandProduct ? this.selectingHandProduct.product_type_id : null;
                        const query = typeId ? `api.php?action=product_options&type_id=${encodeURIComponent(typeId)}` : 'api.php?action=product_options';

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
                async loadCategories() {
                    try {
                        let response;
                        if (typeof fetch !== 'undefined') {
                            response = await fetch('api.php?action=categories', { credentials: 'same-origin' });
                        } else {
                            response = await this.fetchWithXHR('api.php?action=categories');
                        }

                        if (response && response.ok) {
                            const data = await response.json();
                            if (Array.isArray(data) && data.length > 0) {
                                this.categories = data.map(cat => ({
                                    id: cat.slug || String(cat.id),
                                    name: cat.name,
                                    _id: cat.id,
                                    sort_order: cat.sort_order || 0
                                }));
                            } else {
                                console.warn('No categories in response, using default');
                                this.categories = [{ id: 'leather', name: 'Натуральная кожа' }];
                            }
                        } else {
                            console.warn('Failed to load categories, using default');
                            this.categories = [{ id: 'leather', name: 'Натуральная кожа' }];
                        }
                    } catch (error) {
                        console.error('Error loading categories:', error);
                        this.categories = [{ id: 'leather', name: 'Натуральная кожа' }];
                    }
                },
                async loadProducts() {
                    try {
                        let response;
                        if (typeof fetch !== 'undefined') {
                            response = await fetch('api.php?action=products', { credentials: 'same-origin' });
                        } else {
                            response = await this.fetchWithXHR('api.php?action=products');
                        }

                        if (response.ok) {
                            const incoming = await response.json();
                            const list = Array.isArray(incoming) ? incoming : [];
                            this.products = list
                                .filter(Boolean)
                                .map((product) => {
                                    const p = { ...product };
                                    p.image = this.normalizeMediaUrl(p.image);
                                    p.additional_images = Array.isArray(p.additional_images)
                                        ? p.additional_images.map((img) => this.normalizeMediaUrl(img)).filter(Boolean)
                                        : [];
                                    p.additional_videos = Array.isArray(p.additional_videos)
                                        ? p.additional_videos.map((vid) => this.normalizeMediaUrl(vid)).filter(Boolean)
                                        : [];
                                    return p;
                                });

                            this.products.forEach((product) => {
                                if (product && product.id) {
                                    this.imageLoadingStates[product.id] = true;
                                }
                            });

                            this.$nextTick(() => {
                                this.initProductLinkHandlers();
                            });
                        } else {
                            this.products = [];
                        }

                    } catch (error) {
                        console.error('Error loading products:', error);
                        this.products = [];
                    }
                },
                async loadHomeContent() {
                    try {
                        let response;

                        if (typeof fetch !== 'undefined') {
                            response = await fetch('api.php?action=home_content', { credentials: 'same-origin' });
                        } else {
                            response = await this.fetchWithXHR('api.php?action=home_content');
                        }

                        if (response.ok) {
                            const content = await response.json();

                            this.homeContent.features = content
                                .filter(item => item.section === 'features')
                                .map(item => ({
                                    icon: this.getFeatureIcon(item.sort_order),
                                    title: item.title,
                                    description: item.content
                                }));

                            this.homeContent.history = content
                                .filter(item => item.section === 'history')
                                .map(item => {
                                    const parts = item.content.split('\n');
                                    return {
                                        year: item.title,
                                        title: parts[0] || '',
                                        description: parts.slice(1).join('\n') || item.content
                                    };
                                });

                            if (this.homeContent.features.length === 0) {
                                this.homeContent.features = this.features;
                            }

                            if (this.homeContent.history.length === 0) {
                                this.homeContent.history = [];
                            }

                            this.features = this.homeContent.features;
                        } else {
                            console.error('No home content found, using defaults');
                        }

                    } catch (error) {
                        console.error('Error loading home content:', error);
                        this.homeContent.history = [];
                    }
                },
                hasProductsBlock() {
                    return this.pageBlocks.some(block => block.type === 'products');
                },
                goHome(options = {}) {
                    const { updateHistory = true, scrollToTop = true } = options;
                    this.currentVirtualPage = null;
                    this.virtualPageError = null;
                    this.currentProduct = null;
                    this.headerNavigation.other = [];
                    document.title = NV.title;

                    if (scrollToTop) {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }

                    const basePath = this.getBasePath();
                    if (updateHistory && window.history && window.history.pushState) {
                        window.history.pushState({ page: null }, '', basePath);
                    }

                    this.loadPageBlocks().then(() => {
                        this.updateSortedPageBlocks();
                    });
                },
                handlePopState(e) {
                    const state = e.state;

                    if (state && state.page) {
                        this.openVirtualPage(state.page, {updateHistory: false, scrollToTop: false}).then(r => null);
                    } else if (state && state.type === 'product' && state.productId) {
                        const product = this.products.find(p => p.id === state.productId);
                        if (product) this.openProductPage(product);
                    } else {
                        this.goHome({ updateHistory: false, scrollToTop: false });
                    }
                },
                getActualLink(promo) {
                    if (!promo || !promo.link) return '#';
                    return this.getLink({ linkType: promo.linkType || 'url', link: promo.link, target: promo.link });
                },
                handleActualLinkClick(event, promo) {
                    if (!promo || !promo.link) return;
                    this.handleButtonClick(event, { linkType: promo.linkType || 'url', link: promo.link, target: promo.link });
                },
                handleButtonClick(event, button) {
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
                handleNavButtonClick(event, button) {
                    if (button.linkType === 'page') {
                        event.preventDefault();
                        const target = button.target || button.link;

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
                        this.smoothScrollTo(button.target);
                    } else if (button.linkType === 'url') {
                        window.location.href = button.target;
                    }
                },
                getButtonClass(style) {
                    const classes = {
                        'primary': 'btn-primary',
                        'secondary': 'btn-secondary',
                        'outline': 'btn-outline'
                    };
                    return classes[style] || 'btn-primary';
                },
                updateSortedPageBlocks() {
                    if (!Array.isArray(this.pageBlocks)) {
                        this.sortedPageBlocks = [];
                        return;
                    }

                    const blocks = this.pageBlocks.filter(b => b.is_active).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

                    this.sortedPageBlocks = [...blocks];
                },
                async loadPageBlocks() {
                    try {
                        let response;
                        if (typeof fetch !== 'undefined') {
                            response = await fetch('api.php?action=page_blocks', { credentials: 'same-origin' });
                        } else {
                            response = await this.fetchWithXHR('api.php?action=page_blocks');
                        }

                        if (response.ok) {
                            this.pageBlocks = await response.json();
                            this.updateSortedPageBlocks();
                        } else {
                            this.pageBlocks = [];
                            this.updateSortedPageBlocks();
                        }
                    } catch (error) {
                        console.error('Error loading page blocks:', error);
                        this.pageBlocks = [];
                        this.updateSortedPageBlocks();
                    }
                },
                fetchWithXHR(url) {
                    return new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', url, true);
                        xhr.withCredentials = true;
                        xhr.onreadystatechange = function() {
                            if (xhr.readyState === 4) {
                                if (xhr.status >= 200 && xhr.status < 300) {
                                    resolve({
                                        ok: true,
                                        json: () => Promise.resolve(JSON.parse(xhr.responseText))
                                    });
                                } else {
                                    reject(new Error('Request failed'));
                                }
                            }
                        };
                        xhr.onerror = () => reject(new Error('Network error'));
                        xhr.send();
                    });
                },
                hasBlockType(type) {
                    return this.pageBlocks.some(block => block.type === type && block.is_active);
                },
                getNavigationButtons() {
                    return this.navigationButtons;
                },
                getProductById(productId) {
                    return this.products.find(product => product.id === productId);
                },
                isProductInCart(id) {
                    const item = this.cartItems.find(el => el.id === id);
                    return !!item;
                },
                toCart() {
                    this.closeFavorites();
                    setTimeout(() => {
                        this.toggleCart();
                    }, 200);
                },
                getCartItemsCount() {
                    let count = 0;
                    for (let p in this.cartItems) {
                        count += this.cartItems[p].quantity;
                    }
                    return count;
                },
                getWishlistCount() {
                    return this.wishlist.length;
                },
                fromWishlistToCart(productId, event) {
                    const product = this.products.find(p => p.id == productId);
                    if (product) {
                        NV.addToCart(product, event);
                        this.loadCart();
                        this.wishlist = this.wishlist.filter(id => id !== productId);
                        this.saveWishlist();
                        this.toCart();
                    }
                },
                addFromFavoritesToCart(product, event) {
                    if (!product) return;
                    this.selectingFromFavorites = true;
                    this.closeFavorites();
                    this.startOptionSelection(product, 'cart', 'addToCart', event);
                },
                openOrderModal() {
                    if (this.currentOrderProduct) {
                        this.orderModalOpen = true;
                        this.closeCart();
                        this.orderError = '';
                        this.orderSuccess = '';
                    } else if (this.cartItems.length === 0) {
                        alert('Корзина пуста');
                    } else {
                        this.orderModalOpen = true;
                        this.closeCart();
                        this.orderError = '';
                        this.orderSuccess = '';
                    }
                },
                fillPickupParams() {
                    const pickupAddressEl = document.getElementById('pickup_address');
                    const workHoursEl = document.getElementById('work_hours');
                    const storePhoneEl = document.getElementById('store_phone');

                    if (pickupAddressEl && NV.pickupAddress) {
                        pickupAddressEl.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${NV.pickupAddress}`;
                    }
                    if (workHoursEl && NV.workHours) {
                        workHoursEl.innerHTML = `<i class="fas fa-clock"></i> ${NV.workHours}`;
                    }
                    if (storePhoneEl && NV.storePhone) {
                        storePhoneEl.innerHTML = `<i class="fas fa-phone"></i> ${NV.storePhone}`;
                    }
                },
                closeOrderModal() {
                    this.orderModalOpen = false;
                    this.orderError = '';
                    this.orderSuccess = '';
                    this.currentOrderProduct = null;
                    this.resetOptionSelectionState();
                    this.selectingHandProductId = null;
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
                                'Authorization': `Token ${this.dadataToken}`
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
                                    'Authorization': `Token ${this.dadataToken}`
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
                                'Authorization': `Token ${this.dadataToken}`
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
                                    'Authorization': `Token ${this.dadataToken}`
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
                        parts.push(`ул. ${this.orderForm.delivery_street}`);
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
                getImageUrl(url) {
                    if (!url) return '';
                    return url;
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
                isVideo(url) {
                    if (!url || typeof url !== 'string') {
                        return false;
                    }
                    const u = url.toLowerCase();
                    return /\.(mp4|webm|ogg|m4v|mov|avi|flv)(\?|#|$)/i.test(u);
                },
                buildOptionKey(options = []) {
                    if (!options || !options.length) {
                        return '';
                    }
                    return options
                        .map(option => `${option.slug || option.name}:${option.value}`)
                        .join('|');
                },
                normalizeOptionTypes(types) {
                    return types
                        .map((type, index) => {
                            const name = (type.name || '').trim() || `Опция ${index + 1}`;
                            const slug = type.slug || this.slugifyOptionName(name) || `option-${index}`;
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
                getDefaultOptionTypes() {
                    return [
                    ];
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
                resetOptionSelectionState() {
                    this.selectedProductOptions = [];
                    this.optionSelectionIndex = 0;
                    this.showOptionSelector = false;
                    this.hand = null;
                },
                normalizeCartItem(item) {
                    const normalized = { ...item };
                    if (!Array.isArray(normalized.options)) {
                        const fallback = [];
                        if (normalized.size) {
                            fallback.push({ slug: 'sizes', name: 'Размер', value: normalized.size });
                        }
                        if (normalized.model) {
                            fallback.push({ slug: 'models', name: 'Модель', value: normalized.model });
                        }
                        normalized.options = fallback;
                    }
                    normalized.optionKey = normalized.optionKey || this.buildOptionKey(normalized.options);
                    if (normalized.image && typeof normalized.image === 'string') {
                        normalized.image = this.normalizeMediaUrl(normalized.image);
                    }
                    return normalized;
                },
                onImageLoad(event, product) {
                    const img = event.target;
                    const container = img.closest('.product-img-container');
                    if (!container || !product) return;

                    if (product && product.id) {
                        this.imageLoadingStates[product.id] = false;
                    }

                    const currentImage = this.getCurrentProductImage(product);
                    this.checkImageAspectRatio(img, container, product, currentImage);
                },
                checkImageAspectRatio(img, container, product, imageUrl = null) {
                    if (!img || !container || !product) return;

                    const imgWidth = img.naturalWidth || img.width;
                    const imgHeight = img.naturalHeight || img.height;

                    if (!imgWidth || !imgHeight) return;

                    const aspectRatio = imgWidth / imgHeight;
                    const isNarrow = aspectRatio < 0.8;
                    const currentImage = imageUrl || this.getCurrentProductImage(product);

                    if (isNarrow) {
                        this.imageInfo[product.id] = {
                            isNarrow: true,
                            imageUrl: currentImage
                        };

                        container.style.setProperty('--bg-image', `url(${currentImage})`);
                    } else {
                        this.imageInfo[product.id] = {
                            isNarrow: false
                        };
                    }
                },
                isNarrowImage(product) {
                    if (!product || !product.id) return false;
                    return this.imageInfo[product.id]?.isNarrow === true;
                },
                getImageContainerStyle(product) {
                    if (!product || !this.isNarrowImage(product)) {
                        return {};
                    }

                    const currentImage = this.getCurrentProductImage(product);

                    return {
                        'background': `url(${currentImage})`
                    };
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
                isImageLoading(product) {
                    if (!product || !product.id) return false;
                    return this.imageLoadingStates[product.id] === true;
                },
                initVideoAutoplay() {
                    this.$nextTick(() => {
                        const videos = document.querySelectorAll('video[autoplay]');

                        videos.forEach(video => {
                            const container = video.closest('.product-img-container');
                            if (container) {
                                const productCard = container.closest('.product-card');
                                if (productCard) {
                                    const productId = productCard.id.replace('product-', '');
                                    if (productId) {
                                        this.imageLoadingStates[productId] = true;
                                    }
                                }
                            }

                            video.addEventListener('loadeddata', () => {
                                const container = video.closest('.product-img-container');
                                if (container) {
                                    const productCard = container.closest('.product-card');
                                    if (productCard) {
                                        const productId = productCard.id.replace('product-', '');
                                        if (productId) {
                                            this.imageLoadingStates[productId] = false;
                                        }
                                    }
                                }
                            });

                            video.addEventListener('error', () => {
                                const container = video.closest('.product-img-container');
                                if (container) {
                                    const productCard = container.closest('.product-card');
                                    if (productCard) {
                                        const productId = productCard.id.replace('product-', '');
                                        if (productId) {
                                            this.imageLoadingStates[productId] = false;
                                        }
                                    }
                                }
                            });
                        });

                        if ('IntersectionObserver' in window) {
                            const observer = new IntersectionObserver((entries) => {
                                entries.forEach(entry => {
                                    if (entry.isIntersecting) {
                                        entry.target.play().catch(e => console.warn('prevented:', e));
                                    } else {
                                        entry.target.pause();
                                    }
                                });
                            }, { threshold: 0.1 });

                            videos.forEach(video => {
                                observer.observe(video);
                            });
                        } else {
                            videos.forEach(video => {
                                video.play().catch(e => console.warn('prevented:', e));
                            });
                        }
                    });
                },
                clearInput(field) {
                    if (field) {
                        let input = document.querySelector('#delivery_'+field);
                        if (input) {
                            input.value = '';
                            if (field === 'city') {
                                this.orderForm.delivery_city = '';
                                this.orderForm.delivery_street = '';
                                this.orderForm.delivery_building = '';
                            } else {
                                this.orderForm.delivery_street = '';
                                this.orderForm.delivery_building = '';
                            }
                        }
                    }
                },
                getProductImage(product) {
                    return product.image
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
                getCurrentProductImage(product) {
                    if (!product) return '';
                    const allImages = this.getAllProductImages(product);
                    if (allImages.length === 0) return '';

                    const currentIndex = this.productImageIndices[product.id] || 0;
                    return allImages[currentIndex] || allImages[0] || '';
                },
                getProductImageIndex(product) {
                    if (!product) return 0;
                    return this.productImageIndices[product.id] || 0;
                },
                hasMultipleImages(product) {
                    if (!product) return false;
                    const allImages = this.getAllProductImages(product);
                    return allImages.length > 1;
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
                    const nextIndex = (currentIndex + 1) % allImages.length;
                    this.productImageIndices[product.id] = nextIndex;
                    this.$nextTick(() => {
                        this.updateImageContainerStyle(product);
                        setTimeout(() => {
                            delete this.productImageNavigating[product.id];
                        }, 100);
                    });
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
                    const prevIndex = currentIndex === 0 ? allImages.length - 1 : currentIndex - 1;
                    this.productImageIndices[product.id] = prevIndex;
                    this.$nextTick(() => {
                        this.updateImageContainerStyle(product);
                        setTimeout(() => {
                            delete this.productImageNavigating[product.id];
                        }, 100);
                    });
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
                updateImageContainerStyle(product) {
                    if (!product) return;
                    this.$nextTick(() => {
                        const containerRef = this.$refs[`img-container-${product.id}`];
                        let container = null;

                        if (Array.isArray(containerRef)) {
                            container = containerRef[0];
                        } else if (containerRef) {
                            container = containerRef;
                        }

                        if (container && this.isNarrowImage(product)) {
                            const currentImage = this.getCurrentProductImage(product);
                            container.style.setProperty('--bg-image', `url(${currentImage})`);
                        }
                    });
                },
                handleProductImageTouchStart(product, event) {
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
                handleProductImageTouchMove(product, event) {
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
                handleProductImageTouchEnd(product, event) {
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
                handleProductImageMouseDown(product, event) {
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
                handleProductImageMouseMove(product, event) {
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
                handleProductImageMouseUp(product, event) {
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
                handleProductImageMouseLeave(product, event) {
                    if (this.productImageMouseStart[product.id]) {
                        delete this.productImageMouseStart[product.id];
                    }
                },
                handleGlobalMouseUp(event) {
                    Object.keys(this.productImageMouseStart).forEach(productId => {
                        delete this.productImageMouseStart[productId];
                    });
                },
                handleGlobalMouseMove(event) {

                },
                handleProductLinkClick(product, event) {
                    if (this.productImageTouchStart[product.id] || this.productImageMouseStart[product.id]) {
                        event.preventDefault();
                        event.stopPropagation();
                        return false;
                    }

                    const clickedElement = event.target;

                    if (clickedElement.closest('.product-image-nav-btn') ||
                        clickedElement.closest('.product-image-dot') ||
                        clickedElement.classList.contains('product-image-nav-btn') ||
                        clickedElement.classList.contains('product-image-dot') ||
                        clickedElement.closest('.product-image-nav')) {
                        event.preventDefault();
                        event.stopPropagation();
                        return false;
                    }

                    event.preventDefault();
                    event.stopPropagation();
                    this.openProductDetail(product);
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
                restoreScrollPosition() {
                    const savedPosition = sessionStorage.getItem('mainPageScrollPosition');

                    if (savedPosition === null || !this.isMainPage) {
                        return;
                    }

                    const referrer = document.referrer;

                    const isFromProductPage = referrer && (
                        referrer.includes('/product/') ||
                        referrer.includes('product/?id=') ||
                        referrer.includes('product/index.php')
                    );

                    if (isFromProductPage) {
                        const position = parseInt(savedPosition, 10);

                        if (!isNaN(position) && position >= 0) {
                            this.$nextTick(() => {
                                setTimeout(() => {
                                    window.scrollTo({
                                        top: position,
                                        behavior: 'auto'
                                    });
                                    sessionStorage.removeItem('mainPageScrollPosition');
                                }, 300);
                            });
                        } else {
                            sessionStorage.removeItem('mainPageScrollPosition');
                        }
                    } else if (savedPosition !== null) {
                        sessionStorage.removeItem('mainPageScrollPosition');
                    }
                },
                openProductPage(product) {
                    if (!product) return;
                    this.currentProduct = product;
                    this.productQuantity = 1;
                    this.productError = null;
                    this.resetOptionSelectionState();
                    this.currentVirtualPage = null;
                    this.$nextTick(() => {
                        const media = this.allProductMedia;
                        if (media.length > 0) {
                            this.currentProductImageIndex = 0;
                        } else {
                            this.currentProductImageIndex = 0;
                        }
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        if (this.currentProduct.meta_title) {
                            document.title = this.currentProduct.meta_title;
                        } else {
                            document.title = this.currentProduct.name + ' - ' + NV.title;
                        }
                        this.setupProductSwipeHandlers();
                    });
                },
                closeProductPage() {
                    this.currentProduct = null;
                    this.productQuantity = 1;
                    this.currentProductImageIndex = 0;
                    this.contentView = false;
                    this.resetOptionSelectionState();
                    document.title =  NV.title;

                    const basePath = this.getBasePath();
                    if (window.history && window.history.pushState) {
                        window.history.pushState({ type: 'main' }, '', basePath);
                    }
                },
                setCurrentProductImage(index) {
                    if (!this.currentProduct) return;
                    const media = this.allProductMedia;
                    if (media.length === 0) return;
                    if (index >= 0 && index < media.length) {
                        this.productSlideDirection = index > this.currentProductImageIndex ? 'next' : 'prev';
                        this.currentProductImageIndex = index;
                    }
                },
                nextProductDetailImage() {
                    if (!this.currentProduct) return;
                    const media = this.allProductMedia;
                    if (media.length === 0) return;
                    if (this.currentProductImageIndex < media.length - 1) {
                        this.productSlideDirection = 'next';
                        this.currentProductImageIndex++;
                    }
                },
                previousProductImage() {
                    if (!this.currentProduct) return;
                    const media = this.allProductMedia;
                    if (media.length === 0) return;
                    if (this.currentProductImageIndex > 0) {
                        this.productSlideDirection = 'prev';
                        this.currentProductImageIndex--;
                    }
                },
                setupProductSwipeHandlers() {
                    if (!('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
                        return;
                    }

                    this.$nextTick(() => {
                        const mainImageContainer = document.querySelector('.product-detail .main-image');

                        if (mainImageContainer && !mainImageContainer._swipeHandlers) {
                            const handlers = {
                                start: (e) => this.handleProductDetailTouchStart(e),
                                move: (e) => this.handleProductDetailTouchMove(e),
                                end: (e) => this.handleProductDetailTouchEnd(e)
                            };

                            mainImageContainer._swipeHandlers = handlers;
                            mainImageContainer.addEventListener('touchstart', handlers.start, { passive: true });
                            mainImageContainer.addEventListener('touchmove', handlers.move, { passive: true });
                            mainImageContainer.addEventListener('touchend', handlers.end, { passive: true });
                        }

                        const contentViewContainer = document.querySelector('.content-view.content');

                        if (contentViewContainer && !contentViewContainer._swipeHandlers) {
                            const handlers = {
                                start: (e) => this.handleProductDetailTouchStart(e),
                                move: (e) => this.handleProductDetailTouchMove(e),
                                end: (e) => this.handleProductDetailTouchEnd(e)
                            };
                            contentViewContainer._swipeHandlers = handlers;
                            contentViewContainer.addEventListener('touchstart', handlers.start, { passive: true });
                            contentViewContainer.addEventListener('touchmove', handlers.move, { passive: true });
                            contentViewContainer.addEventListener('touchend', handlers.end, { passive: true });
                        }
                    });
                },
                handleProductDetailTouchStart(e) {
                    const touch = e.touches[0];

                    this.touchStartX = touch.clientX;
                    this.touchStartY = touch.clientY;
                },
                handleProductDetailTouchMove(e) {
                    const touch = e.touches[0];
                    const deltaY = Math.abs(touch.clientY - this.touchStartY);
                    const deltaX = Math.abs(touch.clientX - this.touchStartX);

                    if (deltaY > deltaX) {
                        return;
                    }
                },
                handleProductDetailTouchEnd(e) {
                    const touch = e.changedTouches[0];
                    this.touchEndX = touch.clientX;
                    this.touchEndY = touch.clientY;
                    this.handleProductDetailSwipe();
                },
                handleProductDetailSwipe() {
                    const deltaX = this.touchEndX - this.touchStartX;
                    const deltaY = this.touchEndY - this.touchStartY;
                    if (Math.abs(deltaX) < Math.abs(deltaY)) {
                        return;
                    }
                    if (Math.abs(deltaX) < this.productMinSwipeDistance) {
                        return;
                    }
                    if (deltaX < 0) {
                        this.nextProductDetailImage();
                    } else if (deltaX > 0) {
                        this.previousProductImage();
                    }
                },
                addProductToCartInternal(options = []) {
                    if (!this.currentProduct) return;

                    const optionKey = this.buildOptionKey(options);

                    const existingItem = this.cartItems.find(item =>
                        item.id === this.currentProduct.id &&
                        (item.optionKey || this.buildOptionKey(item.options || [])) === optionKey
                    );

                    if (existingItem) {
                        existingItem.quantity += this.productQuantity;
                    } else {
                        this.cartItems.push({
                            ...this.currentProduct,
                            price: this.currentProduct.price_sale || this.currentProduct.price,
                            options,
                            optionKey,
                            quantity: this.productQuantity
                        });
                    }

                    this.saveCart();
                },
                toggleCurrentProductWishlist() {
                    if (!this.currentProduct) return;
                    if (this.isCurrentProductInWishlist) {
                        this.wishlist = this.wishlist.filter(id => id !== this.currentProduct.id);
                    } else {
                        this.wishlist.push(this.currentProduct.id);
                    }
                    this.saveWishlist();
                },
                chooseProductOptionValue(value) {
                    /*const option = this.currentOptionType;

                    if (!option) {
                        return;
                    }

                    this.selectedProductOptions.push({
                        name: option.name || `Опция ${this.optionSelectionIndex + 1}`,
                        value
                    });

                    this.optionSelectionIndex += 1;

                    if (this.optionSelectionIndex >= this.productOptions.length) {
                        this.showOptionSelector = false;
                        this.$nextTick(() => {
                            this.finishProductOptionSelection();
                        });
                    }*/
                },
                cancelProductAddToCart() {
                    this.showOptionSelector = false;
                    this.selectingHandAction = null;
                    this.selectingHandProductId = null;
                    this.selectedProductOptions = [];
                    this.optionSelectionIndex = 0;
                    this.buyNowPressed = false;
                    this.addToCartPressed = false;
                    this.selectingFromFavorites = false;
                },
                closeAllModals() {
                    this.userMenuOpen = false;
                    this.cartOpen = false;
                    this.favoritesOpen = false;
                    this.orderModalOpen = false;
                    this.showLogin = false;
                    this.showRegister = false;
                    this.showOptionSelector = false;
                    this.selectingHandAction = null;
                    this.selectingHandProductId = null;
                    this.selectedProductOptions = [];
                    this.optionSelectionIndex = 0;
                },
                isVideoItem(item) {
                    if (typeof item === 'string') {
                        return this.isVideo(item);
                    }
                    return item.type === 'video';
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
                }
            }
        }).mount('#app');
    }, 200)
})