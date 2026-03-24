NV.ready(() => {
    const Props = {
        data() {
            return {
                title: '',
                description: '',
                imageMetaTags: '',
                pickupAddress: '',
                workHours: '',
                storePhone: '',
                deliveryBel: '',
                deliveryRus: '',
                headerNavigation: {
                    main: [],
                    other: []
                },
                isMobile: false,
                isMobileDevice: false,
                defaultVirtualPageTitleSuffix: '',
                virtualPageNotFoundDocumentTitle: 'Страница не найдена',
                virtualPageLoadErrorDocumentTitle: 'Ошибка загрузки',
            }
        },
        mounted() {
            if (this.$root !== this) {
                return;
            }

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

                const targetVm = (this.$root && this.$root.currentVirtualPage !== undefined) ? this.$root : this;

                try {
                    const page = await this.loadVirtualPage(normalizedSlug);

                    if (!page) {
                        targetVm.currentVirtualPage = null;
                        targetVm.virtualPageError = 'Страница не найдена';
                        return null;
                    }

                    targetVm.currentVirtualPage = page;
                    targetVm.virtualPageError = null;
                    targetVm.currentProduct = null;

                    if (page.navigation_buttons && Array.isArray(page.navigation_buttons)) {
                        targetVm.headerNavigation.other = page.navigation_buttons;
                    } else if (targetVm.headerNavigation) {
                        targetVm.headerNavigation.other = [];
                    }

                    document.title = this.formatVirtualPageDocumentTitle(page);

                    if (scrollToTop) {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }

                    const basePath = targetVm.getBasePath ? targetVm.getBasePath() : this.getBasePath();
                    if (updateHistory && window.history && window.history.pushState) {
                        window.history.pushState({ page: normalizedSlug }, '', basePath + normalizedSlug);
                    }

                    if (targetVm.$nextTick) {
                        targetVm.$nextTick(() => targetVm.$forceUpdate && targetVm.$forceUpdate());
                    }
                    return page;
                } catch (error) {
                    console.error('Error opening page:', error);
                    targetVm.currentVirtualPage = null;
                    targetVm.virtualPageError = 'Ошибка загрузки страницы';
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
            }
        }
    }

    const Hero = {
        mixins: [Props],
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
        mixins: [Props],
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
                     @touchmove="touchMMove(product, $event)"
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
                productOptions: [],
                productQuantity: 1,
                selectedProductOptions: [],
                optionSelectionIndex: 0,
                showHandSelector: false,
                showOptionSelector: false,
                selectingHandProductId: null,
                selectingHandAction: null,
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
            this.loadProductOptions().then(r => null);
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

                    container.style.setProperty('--bg-image', `url(${currentImage})`);
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
            startProductHandSelection(product, mode, event) {
                const action = mode === 'buyNow' ? 'buy' : 'cart';
                const point = mode === 'buyNow' ? 'buyNow' : 'addToCart';
                return this.startOptionSelection(product, action, point, event);
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
                        const imgRef = this.$refs[`img-${product.id}`];
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
            touchMMove(product, event) {
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
                    .map(option => `${option.slug || option.name}:${option.value}`)
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
            chooseProductOptionValue(value) {
                const option = this.currentOptionType;

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
                }
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

    const Features = {
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
        mixins: [Props],
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
        mixins: [Props],
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
        mixins: [Props],
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
        mixins: [Props],
        template: `
          <section id="footer">
            <footer>
                <div class="container" style="flex: 1">
                  <div class="paysystems">
                    <ul>
                      <li><img src="src/images/bepaid.png"></li>
                      <li><img src="src/images/erip.svg"></li>
                    </ul>
                    <ul>
                      <li><img src="src/images/visa.png"></li>
                      <li><img src="src/images/mastercard.png"></li>
                      <li><img src="src/images/belkart.png"></li>
                      <li><img src="src/images/apple-pay.webp"></li>
                      <li><img src="src/images/samsung-pay.png"></li>
                      <li><img src="src/images/google-pay.webp"></li>
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
    window.Hero = Hero;
    window.Actual = Actual;
    window.Products = Products;
    window.Features = Features;
    window.Buttons = Buttons;
    window.HistoryBlock = HistoryBlock;
    window.TextBlock = TextBlock;
    window.Stats = Stats;
    window.Contact = Contact;
    window.InfoButtons = InfoButtons;
    window.FooterBlock = FooterBlock;
})