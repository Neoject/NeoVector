<?php

use NeoVector\Config;

require_once __DIR__ . '/../header.php';

global $HOME_URL, $_DESCRIPTION;

if (isset($product) && $product) {
    if (isset($product['price'])) {
        $product['price'] = ((float) $product['price']) / 100;
    }
    if (!empty($product['price_sale'])) {
        $product['price_sale'] = ((float) $product['price_sale']) / 100;
    }
}
?>

<body>
    <div id="app">
        <header class="scrolled">
            <div class="container nav-container">
                <div class="nav-left">
                    <a class="logo" href="<?php echo e($HOME_URL); ?>">NeoVector</a>
                    <div class="mobile-cart-icon" @click="toggleCart">
                        <i class="fas fa-shopping-cart"></i>
                        <span class="cart-count" v-if="getCartItemsCount() > 0">{{ getCartItemsCount() }}</span>
                    </div>
                    <div class="mobile-favorites-icon" @click="toggleFavorites()">
                        <i class="fas fa-heart"></i>
                        <span class="cart-count" v-if="getWishlistCount() > 0">{{ getWishlistCount() }}</span>
                    </div>
                </div>
                <nav class="nav-links">
                    <a href="<?php echo e($HOME_URL); ?>" class="btn btn-outline" style="width:auto;">На главную</a>
                    <div class="cart-icon" @click="toggleCart">
                        <i class="fas fa-shopping-cart"></i>
                        <span class="cart-count" v-if="getCartItemsCount() > 0">{{ getCartItemsCount() }}</span>
                    </div>
                    <div class="favorites-icon" @click="toggleFavorites()">
                        <i class="fas fa-heart"></i>
                        <span class="cart-count" v-if="getWishlistCount() > 0">{{ getWishlistCount() }}</span>
                    </div>
                </nav>
            </div>
            <div class="header-bottom"></div>
        </header>

        <main style="padding-top: 90px;">
            <?php if (!$product): ?>
                <section class="error-state">
                    <div class="container">
                        <div class="error-content">
                            <h2>Товар не найден</h2>
                            <p>Возможно, товар был удалён или вы перешли по неверной ссылке.</p>
                            <a href="<?php echo e($HOME_URL); ?>" class="btn btn-primary">На главную</a>
                        </div>
                    </div>
                </section>
            <?php else: ?>
                <section class="product-detail-container">
                    <div class="container">
                        <div class="product-detail">

                            <!-- Desktop Gallery -->
                            <div class="product-images desktop-only">
                                <div class="main-image">
                                    <div v-if="allMedia && allMedia.length > 0">
                                        <video
                                            v-if="allMedia[currentMediaIndex] && allMedia[currentMediaIndex].type === 'video'"
                                            class="product-main-video" :src="allMedia[currentMediaIndex].url" controls muted
                                            loop playsinline @click.prevent="openMediaViewModal"></video>
                                        <img v-else-if="allMedia[currentMediaIndex]" class="product-main-img"
                                            :src="allMedia[currentMediaIndex].url" :alt="product ? product.name : ''"
                                            @click="openMediaViewModal">

                                        <div v-if="allMedia.length > 1">
                                            <button class="gallery-nav-btn prev-btn" @click.stop="prevMedia"
                                                :disabled="currentMediaIndex <= 0">
                                                <i class="fas fa-chevron-left"></i>
                                            </button>
                                            <button class="gallery-nav-btn next-btn" @click.stop="nextMedia"
                                                :disabled="currentMediaIndex >= allMedia.length - 1">
                                                <i class="fas fa-chevron-right"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div class="image-gallery" v-if="allMedia.length > 1">
                                    <div class="gallery-thumbnails">
                                        <div v-for="(item, index) in allMedia" :key="index" class="thumbnail-item"
                                            :class="{ 'active': currentMediaIndex === index }"
                                            @click="setMediaIndex(index)">
                                            <div v-if="item.type === 'video'" class="thumbnail-video-wrapper">
                                                <video :src="item.url" class="thumbnail-img thumbnail-video"
                                                    preload="metadata" muted playsinline></video>
                                                <i class="fas fa-play thumbnail-play-icon"></i>
                                            </div>
                                            <img v-else :src="item.url" :alt="product.name" class="thumbnail-img">
                                        </div>
                                    </div>
                                    <div class="gallery-navigation">
                                        <span class="gallery-counter">{{ currentMediaIndex + 1 }} / {{ allMedia.length
                                            }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Mobile Gallery -->
                            <div class="mobile-product-gallery mobile-only">
                                <div class="product-img-container"
                                     @touchstart="handleMobileGalleryTouchStart($event)"
                                     @touchmove="handleMobileGalleryTouchMove($event)"
                                     @touchend="handleMobileGalleryTouchEnd($event)"
                                     @mousedown="handleMobileGalleryMouseDown($event)"
                                     @mousemove="handleMobileGalleryMouseMove($event)"
                                     @mouseup="handleMobileGalleryMouseUp($event)"
                                     @mouseleave="handleMobileGalleryMouseLeave($event)">
                                    <div>
                                        <div v-if="isImageLoading" class="image-loading-indicator">
                                            <div class="loading-spinner"></div>
                                        </div>
                                        <img v-if="allMedia[currentMediaIndex] && allMedia[currentMediaIndex].type !== 'video'"
                                             :src="allMedia[currentMediaIndex] ? allMedia[currentMediaIndex].url : ''"
                                             :alt="product.name"
                                             class="product-img"
                                             :class="{ 'loading': isImageLoading }"
                                             loading="lazy"
                                             decoding="async"
                                             @loadstart="onImageLoadStart"
                                             @load="onImageLoad"
                                             @error="onImageError"
                                             @click="openMediaViewModalFromIndex(currentMediaIndex)"
                                             @touchstart.stop="handleImageTouchStart"
                                             @touchend.stop="handleImageTouchEnd"
                                             style="cursor: pointer; pointer-events: auto; -webkit-tap-highlight-color: transparent;">
                                        <video v-else-if="allMedia[currentMediaIndex] && allMedia[currentMediaIndex].type === 'video'"
                                               :src="allMedia[currentMediaIndex] ? allMedia[currentMediaIndex].url : ''"
                                               class="product-img"
                                               :class="{ 'loading': isImageLoading }"
                                               muted
                                               loop
                                               playsinline
                                               autoplay
                                               @loadstart="onVideoLoadStart"
                                               @loadeddata="onVideoLoadedData"
                                               @error="onVideoError"
                                               @click="openMediaViewModalFromIndex(currentMediaIndex)"
                                               @touchstart.stop="handleImageTouchStart"
                                               @touchend.stop="handleImageTouchEnd"
                                               style="cursor: pointer; pointer-events: auto; -webkit-tap-highlight-color: transparent;">
                                        </video>
                                    </div>
                                    <div v-if="allMedia.length > 1" class="product-image-nav">
                                        <button class="product-image-nav-btn product-image-nav-prev"
                                                @click.stop.prevent="prevMedia"
                                                aria-label="Предыдущее изображение">
                                            <i class="fas fa-chevron-left"></i>
                                        </button>
                                        <button class="product-image-nav-btn product-image-nav-next"
                                                @click.stop.prevent="nextMedia"
                                                aria-label="Следующее изображение">
                                            <i class="fas fa-chevron-right"></i>
                                        </button>
                                        <div class="product-image-dots">
                                            <span v-for="(item, index) in allMedia"
                                                  :key="index"
                                                  class="product-image-dot"
                                                  :class="{ 'active': currentMediaIndex === index }"
                                                  @click.stop.prevent="setMediaIndex(index)"
                                                  :aria-label="`Изображение ${index + 1}`">
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="product-info">
                                <div class="product-header">
                                    <h1 class="product-page title"><?php echo e($product['name']); ?></h1>
                                    <div class="product-price">
                                        <?php if (!empty($product['price_sale'])): ?>
                                            <span class="price-old">
                                                <?php echo number_format((float) $product['price'], 2, '.', ' '); ?> руб.
                                            </span>
                                            <span class="price-sale">
                                                <?php echo number_format((float) $product['price_sale'], 2, '.', ' '); ?> руб.
                                            </span>
                                        <?php else: ?>
                                            <span class="price-current">
                                                <?php echo number_format((float) $product['price'], 2, '.', ' '); ?> руб.
                                            </span>
                                        <?php endif; ?>
                                    </div>
                                </div>

                                <div class="product-meta">
                                    <div class="product-material">
                                        <i class="fas fa-gem"></i>
                                        <span><?php echo e($product['material']); ?></span>
                                    </div>
                                </div>

                                <?php if (!empty($product['description'])): ?>
                                    <div class="product-description">
                                        <h3>Описание</h3>
                                        <p><?= nl2br(e($product['description'])) ?></p>
                                    </div>
                                <?php endif; ?>

                                <?php if (!empty($product['peculiarities']) && is_array($product['peculiarities'])): ?>
                                    <div class="product-features">
                                        <h3>Особенности</h3>
                                        <ul>
                                            <?php foreach ($product['peculiarities'] as $pec):
                                                $pecStr = trim((string) $pec);
                                                if ($pecStr === '')
                                                    continue;
                                                ?>
                                                <li><i class="fas fa-check"></i> <?php echo e($pecStr); ?></li>
                                            <?php endforeach; ?>
                                        </ul>
                                    </div>
                                <?php endif; ?>

                                <div class="product-actions" style="margin-top: 2rem;" v-if="product">
                                    <!-- Desktop Version -->
                                    <div class="product-order-favorite desktop-only">
                                        <table>
                                            <tr>
                                                <td>
                                                    <button @click="startProductHandSelection('buyNow', $event)"
                                                        class="btn btn-primary add-to-cart-btn">
                                                        <i class="fas fa-shopping-bag"></i>
                                                        Купить сейчас
                                                    </button>
                                                </td>
                                                <template v-if="!isProductInCart">
                                                    <td>
                                                        <button @click="startProductHandSelection('addToCart', $event)"
                                                            class="btn btn-outline add-to-cart-btn">
                                                            <i class="fas fa-shopping-cart"></i>
                                                            Добавить в корзину
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <button @click="toggleWishlist" class="btn btn-outline wishlist-btn"
                                                            :class="{ 'active': isInWishlist }">
                                                            <i class="fas fa-heart"></i>
                                                        </button>
                                                    </td>
                                                </template>
                                                <template v-if="isProductInCart">
                                                    <td colspan="2">
                                                        <div class="split-button-container">
                                                            <div class="split-button-wrapper">
                                                                <button @click="toggleCart"
                                                                    class="split-btn split-btn-left">
                                                                    <i class="fas fa-shopping-cart"></i>
                                                                    В корзине
                                                                </button>
                                                                <button
                                                                    @click="startProductHandSelection('addToCart', $event)"
                                                                    class="split-btn split-btn-right">
                                                                    <span class="plus-circle">+</span>
                                                                    <span class="add-text">
                                                                        <i class="fas fa-plus"></i>
                                                                        Добавить в корзину
                                                                    </span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </template>
                                                <td v-if="isProductInCart">
                                                    <button @click="toggleWishlist" class="btn btn-outline wishlist-btn"
                                                        :class="{ 'active': isInWishlist }">
                                                        <i class="fas fa-heart"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>

                                    <!-- Mobile Version -->
                                    <div class="product-order-favorite-mobile mobile-only">
                                        <button @click="startProductHandSelection('buyNow', $event)"
                                            class="add-to-cart mobile-action-btn">
                                            <i class="fas fa-shopping-bag"></i>
                                            Купить сейчас
                                        </button>
                                        <div class="mobile-actions-row">
                                            <template v-if="!isProductInCart">
                                                <button @click="startProductHandSelection('addToCart', $event)"
                                                    class="add-to-cart mobile-action-btn">
                                                    <i class="fas fa-shopping-cart"></i>
                                                    В корзину
                                                </button>
                                            </template>
                                            <template v-else>
                                                <button @click="toggleCart" class="add-to-cart mobile-action-btn">
                                                    <i class="fas fa-shopping-cart"></i>
                                                    В корзине
                                                </button>
                                                <button @click="startProductHandSelection('addToCart', $event)"
                                                    class="add-to-cart mobile-action-btn mobile-add-more">
                                                    <i class="fas fa-plus"></i>
                                                </button>
                                            </template>
                                            <button @click="toggleWishlist" class="wishlist mobile-action-btn"
                                                :class="{ 'active': isInWishlist }">
                                                <i class="fas fa-heart"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Option Selector Modal -->
                <div v-if="showOptionSelector" class="option-selector-modal" @click.self="cancelProductAddToCart">
                    <div class="option-selector-content">
                        <div class="option-selector-header">
                            <h3>Выберите {{ currentOptionType ? currentOptionType.name : 'опцию' }}</h3>
                            <button @click="cancelProductAddToCart" class="close-icon">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="option-selector-body">
                            <div v-if="currentOptionType" class="option-values">
                                <button v-for="value in currentOptionType.values" :key="value"
                                    @click="chooseProductOptionValue(value)" class="option-value-btn">
                                    {{ value }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Order Modal -->
                <?php
                $hasAutocomplete = false;
                $normalizeImageUrl = function($url) {
                    return Config::normalize_media_url($url, $HOME_URL);
                };
                include __DIR__ . '/../order_modal.php';
                ?>

                <!-- Overlay -->
                <div class="overlay"
                    :class="{ 'active': cartOpen || favoritesOpen || orderModalOpen || showOptionSelector }"
                    @click="closeAllModals"></div>

                <!-- Cart Modal -->
                <div class="cart-modal" :class="{ 'active': cartOpen }">
                    <div class="cart-header">
                        <h3>Ваша корзина</h3>
                        <button class="close-icon" @click="closeCart">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div v-if="cartItems.length > 0">
                        <div class="cart-item" v-for="(item, cartIndex) in cartItems"
                            :key="`${item.id}-${item.optionKey || cartIndex}`">
                            <img :src="item.image" :alt="item.name" class="cart-item-img" loading="lazy"
                                decoding="async">
                            <div class="cart-item-details">
                                <h4 class="cart-item-title">{{ item.name }}</h4>
                                <template v-if="item.options && item.options.length">
                                    <p class="cart-item-attr" v-for="option in item.options"
                                        :key="`${item.id}-${option.slug}`">
                                        {{ option.name }}: {{ option.value }}
                                    </p>
                                </template>
                                <p class="cart-item-price">{{ item.price }} руб.</p>
                                <div class="cart-item-actions">
                                    <button class="quantity-btn" @click="decreaseQuantity(item)">-</button>
                                    <span class="quantity">{{ item.quantity }}</span>
                                    <button class="quantity-btn" @click="increaseQuantity(item)">+</button>
                                    <button class="remove-item" @click="removeFromCart(item)">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="cart-total">
                            <span>Итого:</span>
                            <span>{{ cartTotal }} руб.</span>
                        </div>
                        <button class="checkout-btn" @click="openOrderModal">Оформить заказ</button>
                    </div>
                    <div v-else class="empty-cart">
                        <i class="fas fa-shopping-cart" style="font-size: 50px; margin-bottom: 20px;"></i>
                        <p>Ваша корзина пуста</p>
                        <a :href="homeUrl" class="btn btn-primary">Перейти к товарам</a>
                    </div>
                </div>

                <!-- Favorites Modal -->
                <div class="favorites-modal" :class="{ 'active': favoritesOpen }">
                    <div class="favorites-header">
                        <div class="favorites-header-left">
                            <h3>Избранные товары</h3>
                        </div>
                        <button class="close-icon" @click="closeFavorites">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="favorites-content">
                        <div v-if="favoriteProducts.length > 0">
                            <div class="favorites-item" v-for="product in favoriteProducts" :key="product.id">
                                <img :src="normalizeMediaUrl(product.image)" :alt="product.name" class="favorites-item-img"
                                    loading="lazy" decoding="async">
                                <div class="favorites-item-details">
                                    <h4 class="favorites-item-title">{{ product.name }}</h4>
                                    <p class="favorites-item-material">{{ product.material }}</p>
                                    <p class="favorites-item-price">{{ product.price_sale || product.price }} руб.</p>
                                    <div class="favorites-item-actions">
                                        <button class="add-to-cart-btn" @click="fromWishlistToCart(product.id, $event)">
                                            <i class="fas fa-shopping-cart"></i>
                                            В корзину
                                        </button>
                                        <button class="remove-from-favorites" @click="toggleWishlistById(product.id)">
                                            <i class="fas fa-heart-broken"></i>
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="empty-favorites">
                            <p>У вас пока нет избранных товаров</p>
                            <a :href="homeUrl" class="btn btn-primary">Перейти к товарам</a>
                        </div>
                    </div>
                </div>

                <!-- Media View Modal -->
                <div v-if="mediaViewOpen && allMedia && allMedia.length > 0" class="content-view container"
                    @click="closeMediaViewModal">
                    <div class="content-view content" @click.stop>
                        <button class="gallery-nav-btn btn-close-view" @click="closeMediaViewModal">
                            <i class="fas fa-times"></i>
                        </button>
                        <video v-if="allMedia[currentMediaIndex] && allMedia[currentMediaIndex].type === 'video'"
                            :key="'video-view-' + currentMediaIndex" class="content-view video"
                            :src="allMedia[currentMediaIndex].url" @click.prevent controls muted loop autoplay
                            playsinline></video>
                        <img v-else-if="allMedia[currentMediaIndex]" :key="'img-view-' + currentMediaIndex"
                            class="content-view image" :src="allMedia[currentMediaIndex].url"
                            :alt="product ? product.name : ''">
                        <button v-if="allMedia.length > 1" @click.stop="prevMediaInModal"
                            class="content-view gallery-nav-btn prev-btn" :disabled="currentMediaIndex === 0">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button v-if="allMedia.length > 1" @click.stop="nextMediaInModal"
                            class="content-view gallery-nav-btn next-btn"
                            :disabled="currentMediaIndex >= allMedia.length - 1">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
        </div>
    <?php endif; ?>
    </main>
    <script>
        NV.ready(() => {
            const { createApp } = Vue;

            createApp({
                data() {
                    return {
                        product: <?php echo $product ? json_encode($product, JSON_UNESCAPED_UNICODE | JSON_HEX_APOS) : 'null'; ?>,
                        homeUrl: <?php echo json_encode($HOME_URL, JSON_UNESCAPED_UNICODE); ?>,
                        cartItems: [],
                        wishlist: [],
                        products: [],
                        productOptions: [],
                        selectedProductOptions: [],
                        optionSelectionIndex: 0,
                        showOptionSelector: false,
                        selectingHandAction: null,
                        orderModalOpen: false,
                        cartOpen: false,
                        favoritesOpen: false,
                        productQuantity: 1,
                        allMedia: <?php echo json_encode($allMedia ?? [], JSON_UNESCAPED_UNICODE); ?>,
                        currentMediaIndex: 0,
                        mediaViewOpen: false,
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
                            deliveryPrice: 0,
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
                        currentOrderProduct: null,
                        orderLoading: false,
                        orderError: '',
                        orderSuccess: '',
                        policyYes: false,
                        policyNo: false,
                        deliveryAvailable: true,
                        mobileGalleryTouchStart: null,
                        mobileGalleryMouseStart: null,
                        mobileGalleryNavigating: false,
                        isImageLoading: false,
                        wasSwipe: false,
                        imageTouchStart: null,
                        params: NV.loadParams(),
                        deliveryBel: '',
                        deliveryRus: '',
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
                    };
                },
                computed: {
                    isInWishlist() {
                        return this.product && this.wishlist.includes(this.product.id);
                    },
                    isProductInCart() {
                        if (!this.product) return false;
                        return this.cartItems.some(item => item.id === this.product.id);
                    },
                    currentOptionType() {
                        if (!this.productOptions || !this.productOptions.length) {
                            return null;
                        }
                        return this.productOptions[this.optionSelectionIndex] || null;
                    },
                    favoriteProducts() {
                        return this.products.filter(product => this.wishlist.includes(product.id));
                    },
                    cartTotal() {
                        return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
                    },
                    today() {
                        return new Date().toISOString().split('T')[0];
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
                    this.loadCart();
                    this.loadWishlist();
                    this.loadProductOptions();
                    this.loadProducts();

                    document.addEventListener('keydown', (e) => {
                        if (this.mediaViewOpen) {
                            if (e.key === 'Escape') {
                                this.closeMediaViewModal();
                            } else if (e.key === 'ArrowLeft') {
                                this.prevMediaInModal();
                            } else if (e.key === 'ArrowRight') {
                                this.nextMediaInModal();
                            }
                        }
                    });
                },
                methods: {
                    handleMobileGalleryTouchStart(event) {
                        if (!this.allMedia || this.allMedia.length <= 1) return;
                        if (event.target.closest('.mobile-gallery-dot')) return;
                        if (event.target.tagName === 'IMG' || event.target.tagName === 'VIDEO') {
                            return;
                        }

                        this.mobileGalleryTouchStart = {
                            x: event.touches[0].clientX,
                            y: event.touches[0].clientY,
                            time: Date.now(),
                            moved: false
                        };
                    },
                    handleMobileGalleryTouchMove(event) {
                        if (!this.allMedia || this.allMedia.length <= 1) return;
                        const touchStart = this.mobileGalleryTouchStart;
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
                    handleMobileGalleryTouchEnd(event) {
                        if (!this.allMedia || this.allMedia.length <= 1) return;

                        if (event.target.tagName === 'IMG' || event.target.tagName === 'VIDEO') {
                            return;
                        }

                        const touchStart = this.mobileGalleryTouchStart;
                        if (!touchStart) {
                            this.wasSwipe = false;
                            return;
                        }

                        if (!touchStart.moved) {
                            this.mobileGalleryTouchStart = null;
                            this.wasSwipe = false;
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
                            this.wasSwipe = true;

                            if (diffX > 0) {
                                this.nextMedia();
                            } else {
                                this.prevMedia();
                            }

                            setTimeout(() => {
                                this.wasSwipe = false;
                            }, 300);
                        } else {
                            this.wasSwipe = false;
                        }

                        this.mobileGalleryTouchStart = null;
                    },
                    handleMobileGalleryMouseDown(event) {
                        if (!this.allMedia || this.allMedia.length <= 1) return;
                        if (event.button !== 0) return;
                        if (event.target.closest('.mobile-gallery-dot')) return;

                        event.preventDefault();

                        this.mobileGalleryMouseStart = {
                            x: event.clientX,
                            y: event.clientY,
                            time: Date.now(),
                            moved: false
                        };
                    },
                    handleMobileGalleryMouseMove(event) {
                        if (!this.allMedia || this.allMedia.length <= 1) return;
                        const mouseStart = this.mobileGalleryMouseStart;
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
                    handleMobileGalleryMouseUp(event) {
                        if (!this.allMedia || this.allMedia.length <= 1) return;
                        const mouseStart = this.mobileGalleryMouseStart;
                        if (!mouseStart) {
                            this.wasSwipe = false;
                            return;
                        }

                        if (event.button !== 0) {
                            this.mobileGalleryMouseStart = null;
                            this.wasSwipe = false;
                            return;
                        }

                        if (!mouseStart.moved) {
                            this.mobileGalleryMouseStart = null;
                            this.wasSwipe = false;
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
                            this.wasSwipe = true;

                            if (diffX > 0) {
                                this.nextMedia();
                            } else {
                                this.prevMedia();
                            }

                            setTimeout(() => {
                                this.wasSwipe = false;
                            }, 300);
                        } else {
                            this.wasSwipe = false;
                        }

                        this.mobileGalleryMouseStart = null;
                    },
                    handleMobileGalleryMouseLeave(event) {
                        if (this.mobileGalleryMouseStart) {
                            this.mobileGalleryMouseStart = null;
                        }
                    },
                    onImageLoadStart(event) {
                        this.isImageLoading = true;
                    },
                    onImageLoad(event) {
                        this.isImageLoading = false;
                    },
                    onImageError(event) {
                        this.isImageLoading = false;
                    },
                    onVideoLoadStart(event) {
                        this.isImageLoading = true;
                    },
                    onVideoLoadedData(event) {
                        this.isImageLoading = false;
                    },
                    onVideoError(event) {
                        this.isImageLoading = false;
                    },
                    handleImageTouchStart(event) {
                        this.imageTouchStart = {
                            x: event.touches[0].clientX,
                            y: event.touches[0].clientY,
                            time: Date.now()
                        };
                    },
                    handleImageTouchEnd(event) {
                        if (!this.imageTouchStart) {
                            this.openMediaViewModalFromIndex(this.currentMediaIndex);
                            return;
                        }

                        const touchEnd = {
                            x: event.changedTouches[0].clientX,
                            y: event.changedTouches[0].clientY
                        };

                        const diffX = this.imageTouchStart.x - touchEnd.x;
                        const diffY = Math.abs(this.imageTouchStart.y - touchEnd.y);
                        const absDiffX = Math.abs(diffX);
                        const timeDiff = Date.now() - this.imageTouchStart.time;

                        if (this.allMedia && this.allMedia.length > 1 && absDiffX > 50 && absDiffX > diffY && timeDiff < 500) {
                            this.wasSwipe = true;
                            if (diffX > 0) {
                                this.nextMedia();
                            } else {
                                this.prevMedia();
                            }
                            setTimeout(() => { this.wasSwipe = false; }, 300);
                            this.imageTouchStart = null;
                            return;
                        }

                        if ((absDiffX > 30 || diffY > 30) && timeDiff < 500) {
                            this.imageTouchStart = null;
                            return;
                        }

                        this.imageTouchStart = null;
                        this.openMediaViewModalFromIndex(this.currentMediaIndex);
                    },
                    openMediaViewModalFromIndex(index) {
                        this.setMediaIndex(index);
                        this.openMediaViewModal();
                    },
                    loadCart() {
                        const savedCart = localStorage.getItem('cart');
                        if (!savedCart) {
                            this.cartItems = [];
                            return;
                        }
                        try {
                            const parsed = JSON.parse(savedCart);
                            this.cartItems = Array.isArray(parsed) ? parsed : [];
                        } catch (error) {
                            console.error('Failed to parse cart from storage:', error);
                            this.cartItems = [];
                        }
                    },
                    saveCart() {
                        localStorage.setItem('cart', JSON.stringify(this.cartItems));
                    },
                    loadWishlist() {
                        const savedWishlist = localStorage.getItem('wishlist');
                        this.wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
                    },
                    saveWishlist() {
                        localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
                    },
                    toggleWishlist() {
                        if (!this.product) return;
                        if (this.isInWishlist) {
                            this.wishlist = this.wishlist.filter(id => id !== this.product.id);
                        } else {
                            this.wishlist.push(this.product.id);
                        }
                        this.saveWishlist();
                    },
                    async loadProductOptions() {
                        try {
                            const apiUrl = (this.homeUrl.endsWith('/') ? this.homeUrl : this.homeUrl + '/') + 'api.php?action=product_options&type_id=' + encodeURIComponent(this.product && this.product.product_type_id ? this.product.product_type_id : 0);
                            const response = await fetch(apiUrl, { credentials: 'same-origin' });

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
                    startProductHandSelection(action, event) {
                        if (event) {
                            event.stopPropagation();
                        }
                        this.selectedProductOptions = [];
                        this.optionSelectionIndex = 0;
                        this.selectingHandAction = action === 'buyNow' ? 'buy' : 'cart';
                        if (this.productOptions.length > 0) {
                            this.showOptionSelector = true;
                        } else {
                            this.finishProductOptionSelection();
                        }
                    },
                    chooseProductOptionValue(value) {
                        const optionType = this.currentOptionType;
                        if (!optionType) return;
                        const slug = optionType.slug || this.slugifyOptionName(optionType.name) || `option-${this.optionSelectionIndex}`;
                        this.selectedProductOptions.push({
                            slug,
                            name: optionType.name || `Опция ${this.optionSelectionIndex + 1}`,
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
                        this.showOptionSelector = false;
                        this.selectingHandAction = null;
                        this.selectedProductOptions = [];
                        this.optionSelectionIndex = 0;
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
                    addProductToCartInternal(options = []) {
                        if (!this.product) return;
                        const optionKey = this.buildOptionKey(options);
                        const existingItem = this.cartItems.find(item =>
                            item.id === this.product.id &&
                            (item.optionKey || this.buildOptionKey(item.options || [])) === optionKey
                        );
                        if (existingItem) {
                            existingItem.quantity += this.productQuantity;
                        } else {
                            this.cartItems.push({
                                ...this.product,
                                price: this.product.price_sale || this.product.price,
                                options,
                                optionKey,
                                quantity: this.productQuantity
                            });
                        }
                        this.saveCart();
                    },
                    buildOptionKey(options = []) {
                        if (!options || !options.length) {
                            return '';
                        }
                        return options
                            .map(option => `${option.slug || option.name}:${option.value}`)
                            .join('|');
                    },
                    openOrderModal() {
                        if (this.currentOrderProduct || this.cartItems.length > 0) {
                            this.orderModalOpen = true;
                            this.closeCart();
                            this.orderError = '';
                            this.orderSuccess = '';
                        } else {
                            alert('Корзина пуста');
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
                    loadParams() {
                        //todo
                        // const delivery = document.getElementById('delivery_price');

                        // this.deliveryBel = NV.deliveryBel;
                        // this.deliveryRus = NV.deliveryRus;
                    },
                    closeOrderModal() {
                        this.orderModalOpen = false;
                        this.currentOrderProduct = null;
                    },
                    async submitOrder() {
                        this.orderLoading = true;
                        this.orderError = '';
                        this.orderSuccess = '';

                        try {
                            if (!this.orderForm.customer_name.trim()) {
                                throw new Error('Имя обязательно для заполнения');
                            }
                            if (!this.orderForm.customer_phone.trim()) {
                                throw new Error('Телефон обязателен для заполнения');
                            }
                            if (this.orderForm.delivery_type === 'delivery') {
                                if (!this.orderForm.delivery_city.trim()) {
                                    throw new Error('Укажите город');
                                }
                                if (!this.orderForm.delivery_street.trim()) {
                                    throw new Error('Укажите улицу');
                                }
                                if (!this.orderForm.delivery_building.trim()) {
                                    throw new Error('Укажите номер дома или квартиры');
                                }
                            }

                            const deliveryAddress = this.orderForm.delivery_type === 'delivery'
                                ? `${this.orderForm.delivery_city}, ${this.orderForm.delivery_street}, ${this.orderForm.delivery_building}`
                                : '';

                            const orderData = {
                                action: 'create_order',
                                customer_name: this.orderForm.customer_name.trim(),
                                customer_phone: this.orderForm.customer_phone.trim(),
                                customer_email: this.orderForm.customer_email.trim(),
                                delivery_type: this.orderForm.delivery_type,
                                delivery_address: deliveryAddress,
                                delivery_date: this.orderForm.delivery_date,
                                delivery_time: this.orderForm.delivery_time,
                                payment_type: this.orderForm.payment_type,
                                order_items: JSON.stringify(this.currentOrderProduct ? [this.currentOrderProduct] : this.cartItems),
                                total_amount: this.currentOrderProduct ? this.currentOrderProduct.price * this.currentOrderProduct.quantity : this.cartTotal,
                                notes: this.orderForm.notes.trim()
                            };

                            const formData = new FormData();
                            Object.keys(orderData).forEach(key => {
                                formData.append(key, orderData[key]);
                            });

                            const apiUrl = (this.homeUrl.endsWith('/') ? this.homeUrl : this.homeUrl + '/') + 'api.php';
                            const response = await fetch(apiUrl, {
                                method: 'POST',
                                body: formData
                            });

                            if (!response.ok) {
                                throw new Error('Ошибка при отправке заказа');
                            }

                            const result = await response.json();

                            if (result.success) {
                                this.orderSuccess = 'Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.';
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
                                this.currentOrderProduct = null;
                                this.cartItems = [];
                                this.saveCart();
                                this.policy = false;
                                setTimeout(() => {
                                    this.closeOrderModal();
                                }, 3000);
                            } else {
                                throw new Error(result.error || 'Ошибка при отправке заказа');
                            }
                        } catch (error) {
                            this.orderError = error.message || 'Произошла ошибка при оформлении заказа';
                        } finally {
                            this.orderLoading = false;
                        }
                    },
                    async getPaymentToken(payload = {}) {
                        const apiUrl = (this.homeUrl.endsWith('/') ? this.homeUrl : this.homeUrl + '/') + 'api.php?action=payment';
                        const response = await fetch(apiUrl, {
                            method: 'POST',
                            credentials: 'same-origin',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(payload || {})
                        });

                        if (!response.ok) {
                            throw new Error('Ошибка при создании платежа');
                        }

                        return await response.json();
                    },
                    toggleCart() {
                        this.cartOpen = !this.cartOpen;
                        if (this.cartOpen) {
                            this.favoritesOpen = false;
                        }
                    },
                    closeCart() {
                        this.cartOpen = false;
                    },
                    toggleFavorites() {
                        this.favoritesOpen = !this.favoritesOpen;
                        if (this.favoritesOpen) {
                            this.cartOpen = false;
                        }
                    },
                    closeFavorites() {
                        this.favoritesOpen = false;
                    },
                    closeAllModals() {
                        this.cartOpen = false;
                        this.favoritesOpen = false;
                        this.orderModalOpen = false;
                        this.showOptionSelector = false;
                        this.mediaViewOpen = false;
                        this.selectingHandAction = null;
                        this.selectedProductOptions = [];
                        this.optionSelectionIndex = 0;
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
                    async loadProducts() {
                        try {
                            const apiUrl = (this.homeUrl.endsWith('/') ? this.homeUrl : this.homeUrl + '/') + 'api.php?action=products';
                            const response = await fetch(apiUrl, { credentials: 'same-origin' });
                            if (response && response.ok) {
                                const data = await response.json();
                                this.products = Array.isArray(data) ? data : [];
                            }
                        } catch (error) {
                            console.error('Error loading products:', error);
                            this.products = [];
                        }
                    },
                    normalizeMediaUrl(path) {
                        if (!path) return '';

                        if (path.startsWith('http://') || path.startsWith('https://')) {
                            return path;
                        }

                        if (path.startsWith('/')) {
                            const baseWithoutTrailing = this.homeUrl === '/' ? '' : this.homeUrl.replace(/\/+$/, '');
                            return baseWithoutTrailing + path;
                        }

                        return this.homeUrl + path;
                    },
                    getImageUrl(url) {
                        if (!url) return '';

                        return this.normalizeMediaUrl(url);
                    },
                    increaseQuantity(item) {
                        item.quantity += 1;
                        this.saveCart();
                    },
                    decreaseQuantity(item) {
                        if (item.quantity > 1) {
                            item.quantity -= 1;
                            this.saveCart();
                        }
                    },
                    removeFromCart(item) {
                        if (confirm(`Вы действительно хотите удалить ${item.name} из корзины?`)) {
                            const index = this.cartItems.findIndex(cartItem =>
                                cartItem.id === item.id &&
                                (cartItem.optionKey || this.buildOptionKey(cartItem.options || [])) === (item.optionKey || this.buildOptionKey(item.options || []))
                            );

                            if (index > -1) {
                                this.cartItems.splice(index, 1);
                                this.saveCart();
                                if (this.cartItems.length === 0 && this.orderModalOpen) {
                                    this.closeOrderModal();
                                }
                            }
                        }
                    },
                    toggleWishlistById(productId) {
                        if (this.wishlist.includes(productId)) {
                            this.wishlist = this.wishlist.filter(id => id !== productId);
                        } else {
                            this.wishlist.push(productId);
                        }

                        this.saveWishlist();
                    },
                    fromWishlistToCart(productId, event) {
                        if (event) {
                            event.stopPropagation();
                        }

                        const product = this.products.find(p => p.id === productId);

                        if (product) {
                            const optionKey = '';
                            const existingItem = this.cartItems.find(item =>
                                item.id === product.id &&
                                (item.optionKey || this.buildOptionKey(item.options || [])) === optionKey
                            );

                            if (existingItem) {
                                existingItem.quantity += 1;
                            } else {
                                this.cartItems.push({
                                    ...product,
                                    price: product.price_sale || product.price,
                                    options: [],
                                    optionKey,
                                    quantity: 1
                                });
                            }
                            this.saveCart();
                        }
                    },
                    prevMedia() {
                        if (this.mobileGalleryNavigating) return;
                        if (!this.allMedia || this.allMedia.length <= 1) return;

                        this.mobileGalleryNavigating = true;
                        this.isImageLoading = true;

                        if (this.currentMediaIndex > 0) {
                            this.currentMediaIndex -= 1;
                        } else {
                            this.currentMediaIndex = this.allMedia.length - 1;
                        }

                        setTimeout(() => {
                            this.mobileGalleryNavigating = false;
                        }, 300);
                    },
                    nextMedia() {
                        if (this.mobileGalleryNavigating) return;
                        if (!this.allMedia || this.allMedia.length <= 1) return;

                        this.mobileGalleryNavigating = true;
                        this.isImageLoading = true;

                        if (this.currentMediaIndex < this.allMedia.length - 1) {
                            this.currentMediaIndex += 1;
                        } else {
                            this.currentMediaIndex = 0;
                        }

                        setTimeout(() => {
                            this.mobileGalleryNavigating = false;
                        }, 300);
                    },
                    setMediaIndex(index) {
                        if (index >= 0 && index < this.allMedia.length) {
                            this.currentMediaIndex = index;
                        }
                    },
                    openMediaViewModal() {
                        this.mediaViewOpen = true;
                    },
                    closeMediaViewModal() {
                        this.mediaViewOpen = false;
                    },
                    prevMediaInModal() {
                        if (this.currentMediaIndex > 0) {
                            this.currentMediaIndex -= 1;
                        }
                    },
                    nextMediaInModal() {
                        if (this.currentMediaIndex < this.allMedia.length - 1) {
                            this.currentMediaIndex += 1;
                        }
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
            }).mount('#app');
        })
    </script>
</body>
<?php
require_once $HOME_URL . 'footer.php';
?>