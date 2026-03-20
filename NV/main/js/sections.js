const Props = {
    data() {
        return {
            headerNavigation: {
                main: [],
                other: []
            },
        }
    },
    methods: {
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
                        document.title = 'Страница не найдена';
                    }
                }).catch(() => {
                    this.virtualPageError = 'Ошибка загрузки страницы';
                    document.title = 'Ошибка загрузки';
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
            // Delegate to root Vue instance so virtual page content updates in the main template.
            const root = this.$parent && typeof this.$parent.openVirtualPage === 'function' ? this.$parent : null;
            if (root && root !== this) {
                return root.openVirtualPage(slug, options);
            }

            const { updateHistory = true, scrollToTop = true } = options;
            const nSlug = (slug || '').replace(/^\//, '').replace(/\/$/, '');
            const normalizedSlug = nSlug.replace(/^nv\//, '').replace(/^nv$/, '');

            if (!normalizedSlug) {
                if (this.goHome) {
                    this.goHome({ updateHistory, scrollToTop });
                }
                return null;
            }

            const targetVm = (this.$parent && this.$parent.currentVirtualPage !== undefined) ? this.$parent : this;

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

                document.title = page.meta_title || page.title;

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
        async checkVirtualPage() {
            const root = this.$parent && typeof this.$parent.checkVirtualPage === 'function' ? this.$parent : null;
            if (root && root !== this) {
                return root.checkVirtualPage();
            }

            // Fallback for standalone use
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
                document.title = page.meta_title || page.title;
                this.$nextTick(() => this.$forceUpdate());
                return;
            }

            this.currentVirtualPage = null;
            this.currentProduct = null;
            this.virtualPageError = 'Страница не найдена';
            document.title = 'Страница не найдена';
            this.$nextTick(() => this.$forceUpdate());
        },
        async loadVirtualPage(slug) {
            const root = this.$parent && typeof this.$parent.loadVirtualPage === 'function' ? this.$parent : null;
            if (root && root !== this) {
                return root.loadVirtualPage(slug);
            }

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
                    console.error('Error loading page:', errorData.error || 'Unknown error');
                    return null;
                }
            } catch (error) {
                console.error('Error loading page:', error);
                return null;
            }
        },
    }
}

const Hero = {
    template: `
      <section v-if="block" id="home" class="hero" :style="getStyle(block)">
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
            <a href="#" @click="navClick($event, 'products')" class="btn">Смотреть коллекцию</a>
            <a href="#" @click="navClick($event, 'features')" class="btn btn-outline">Узнать больше</a>
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
    methods: {
        getStyle(block) {
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
    }
}

const Products = {
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
                              <!--                                                    <td>&nbsp;</td>-->
                              <!--                                                    <td>&nbsp;</td>-->
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
        </div>
      </section>
    `,
    data() {
        return {
            activeFilter: 'all',
            categories: [],
            imageInfo: {},
            imageLoadingStates: {},
            productImageIndices: {},
            productImageNavigating: {},
            productImageTouchStart: {},
            productImageMouseStart: {},
            cartItems: [],
            wishlist: [],
            mobileMenuOpen: false,
            cartOpen: false,
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
        isImageLoading: Function,
        isVideo: Function,
        getCurrentProductImage: Function,
        getBasePath: Function
    },
    computed: {
        imageMetaTags() {
            return this.$parent?.imageMetaTags || '';
        },
        isMobile() {
            return !!this.$parent?.isMobile;
        },
        filteredProducts() {
            if (this.activeFilter === 'all') {
                return this.products;
            }

            return this.products.filter(product => product.category === this.activeFilter);
        },
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
    },
    mounted() {
        if (this.$parent) {
            this.imageInfo = this.$parent.imageInfo || this.imageInfo;
            this.imageLoadingStates = this.$parent.imageLoadingStates || this.imageLoadingStates;
            this.productImageIndices = this.$parent.productImageIndices || this.productImageIndices;
            this.productImageNavigating = this.$parent.productImageNavigating || this.productImageNavigating;
            this.productImageTouchStart = this.$parent.productImageTouchStart || this.productImageTouchStart;
            this.productImageMouseStart = this.$parent.productImageMouseStart || this.productImageMouseStart;
        }

        this.$nextTick(() => {
            this.checkLoadedImages();
        });
    },
    methods: {
        getImage(product) {
            try {
                const ctx = this.$parent && this.$parent.getAllProductImages ? this.$parent : null;
                if (!ctx || !this.getCurrentProductImage) return '';
                return this.getCurrentProductImage.call(ctx, product) ?? '';
            } catch (e) {
                return '';
            }
        },
        normalizeMediaUrl(path) {
            return this.$parent?.normalizeMediaUrl?.(path) ?? path ?? '';
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
        isProductInCart(id) {
            const items = Array.isArray(this.cartItems) ? this.cartItems : [];
            const item = items.find(el => el && el.id === id);
            return !!item;
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
        isInWishlist(productId) {
            const list = Array.isArray(this.wishlist) ? this.wishlist : [];
            return list.includes(productId);
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
                'background': 'url' +currentImage
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
      <section v-if="block && block.type === 'buttons' && block.settings.buttons && block.settings.buttons.length > 0"
               class="buttons-block">
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
        openVirtualPage: Function,
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

const History = {
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

const Text = {
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

const InfoButtons = {
    mixins: [Props],
    template: `
      {{block}}
      <section
          v-if="block && block.type === 'info_buttons' && block.is_active && block.settings.buttons && block.settings.buttons.length > 0"
          class="info-buttons-block">
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

const Actual = {
    mixins: [Props],
    template: `
      <section v-if="block && block.settings.promotions && block.settings.promotions.length > 0"
               class="actual-block" id="actual">
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