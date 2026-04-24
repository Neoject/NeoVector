<script>
import NavBar from "./components/NavBar.vue";
import OrderModal from "./components/Order.vue";
import OptionSelector from "./components/Options.vue";
import { api } from "../../server/api";
import { checkUserAuth, getAuth } from "./components/auth";

export default {
  name: "Product",
  components: { NavBar, OrderModal, OptionSelector },
  inject: ['params'],
  data() {
    return {
      product: null,
      loading: true,
      notFound: false,
      auth: getAuth(),
      allMedia: [],
      currentMediaIndex: 0,
      mediaViewOpen: false,
      isImageLoading: false,
      cartItems: [],
      wishlist: [],
      products: [],
      productOptions: [],
      optionSelectorOpen: false,
      optionSelectorAction: 'cart',
      productQuantity: 1,
      cartOpen: false,
      favoritesOpen: false,
      orderModalOpen: false,
      currentOrderProduct: null,
      mobileGalleryTouchStart: null,
      mobileGalleryMouseStart: null,
      mobileGalleryNavigating: false,
      imageTouchStart: null,
      wasSwipe: false,
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
    cartTotal() {
      return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },
    favoriteProducts() {
      return this.products.filter(p => this.wishlist.includes(p.id));
    },
  },
  async mounted() {
    await this.refreshAuth();
    const id = this.$route.query.id;
    if (!id) { this.notFound = true; this.loading = false; return; }
    await this.loadProduct(id);
    this.loadCart();
    this.loadWishlist();
    await this.loadProducts();
    document.addEventListener('keydown', this.onKeydown);
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onKeydown);
  },
  methods: {
    async refreshAuth() {
      const me = await checkUserAuth();
      this.auth = me?.authenticated ? me : { authenticated: false, role: null, username: null };
    },
    async loadProduct(id) {
      this.loading = true;

      try {
        const r = await api.getProduct(id);
        if (!r.ok) { this.notFound = true; return; }
        const p = await r.json();
        if (!p || p.error) { this.notFound = true; return; }
        this.product = p;
        document.title = p.name || '';
        this.buildAllMedia(p);
        await this.loadProductOptions(p.product_type_id);
      } catch (e) {
        console.error(e);
        this.notFound = true;
      } finally {
        this.loading = false;
      }
    },
    buildAllMedia(p) {
      const media = [];
      if (p.image) media.push({ type: 'image', url: p.image });
      (p.additional_images || []).forEach(url => media.push({ type: 'image', url }));
      (p.additional_videos || []).forEach(url => media.push({ type: 'video', url }));
      this.allMedia = media;
      this.currentMediaIndex = 0;
    },
    async loadProducts() {
      try {
        const r = await api.getProducts();
        if (r.ok) this.products = await r.json();
      } catch (e) {
        console.error(e);
      }
    },
    async loadProductOptions(typeId) {
      try {
        const r = await api.getProductOptions(typeId);

        if (r.ok) {
          const data = await r.json();
          const raw = Array.isArray(data.options) ? data.options : [];

          this.productOptions = raw
              .map((t, i) => {
                const name = (t.name || '').trim() || `Опция ${i + 1}`;
                const slug = t.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const values = (t.values || []).map(v => String(v).trim()).filter(Boolean);
                return { name, slug, values };
              })
              .filter(t => t.values.length);
        }
      } catch (e) {
        console.error(e);
      }
    },
    loadCart() {
      try {
        this.cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
      }
      catch {
        this.cartItems = [];
      }
    },
    saveCart() {
      localStorage.setItem('cart', JSON.stringify(this.cartItems));
      },
    loadWishlist() {
      try {
        this.wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      }
      catch {
        this.wishlist = [];
      }
    },
    saveWishlist() {
      localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
      },
    toggleWishlist() {
      if (!this.product) return;

      this.wishlist = this.isInWishlist
          ? this.wishlist.filter(id => id !== this.product.id)
          : [...this.wishlist, this.product.id];

      this.saveWishlist();
    },
    toggleWishlistById(id) {
      this.wishlist = this.wishlist.includes(id)
          ? this.wishlist.filter(x => x !== id)
          : [...this.wishlist, id];

      this.saveWishlist();
    },
    fromWishlistToCart(productId) {
      const p = this.products.find(x => x.id === productId);
      if (!p) return;

      const existing = this.cartItems.find(i => i.id === p.id && !i.optionKey);
      if (existing) {
        existing.quantity += 1;
      }
      else {
        this.cartItems.push({
          ...p,
          price: p.price_sale || p.price,
          options: [],
          optionKey: '',
          quantity: 1
        });
      }

      this.saveCart();
    },
    buildOptionKey(opts) {
      if (!opts?.length) return '';
      return opts.map(o => `${o.slug || o.name}:${o.value}`).join('|');
    },
    addProductToCart(options = []) {
      if (!this.product) return;

      const key = this.buildOptionKey(options);
      const existing = this.cartItems.find(i => i.id === this.product.id && (i.optionKey || '') === key);

      if (existing) {
        existing.quantity += this.productQuantity;
      } else {
        this.cartItems.push({
          ...this.product,
          price: this.product.price_sale || this.product.price,
          options,
          optionKey: key,
          quantity: this.productQuantity,
        });
      }

      this.saveCart();
    },
    increaseQuantity(item) {
      item.quantity++;
      this.saveCart();
      },
    decreaseQuantity(item) {
      if (item.quantity > 1) {
        item.quantity--;
        this.saveCart();
      }
    },
    removeFromCart(item) {
      const idx = this.cartItems.findIndex(i => i.id === item.id && (i.optionKey || '') === (item.optionKey || ''));

      if (idx > -1) {
        this.cartItems.splice(idx, 1);
        this.saveCart();
      }

      if (!this.cartItems.length && this.orderModalOpen) this.closeOrderModal();
    },
    selectOption(point, event) {
      if (event) event.stopPropagation();
      const action = point === 'buyNow' ? 'buy' : 'cart';
      if (this.productOptions.length) {
        this.optionSelectorAction = action;
        this.optionSelectorOpen = true;
      } else {
        this.onOptionDone({ options: [], optionKey: '', action });
      }
    },
    onOptionDone({ options, optionKey, action }) {
      if (action === 'buy') {
        this.currentOrderProduct = {
          ...this.product,
          price: this.product.price_sale || this.product.price,
          options,
          optionKey,
          quantity: this.productQuantity,
        };
        this.openOrderModal();
      } else {
        this.addProductToCart(options);
      }
    },
    openOrderModal() {
      if (this.currentOrderProduct || this.cartItems.length) {
        this.orderModalOpen = true;
        this.cartOpen = false;
      }
    },
    closeOrderModal() {
      this.orderModalOpen = false;
      this.currentOrderProduct = null;
    },
    onOrderSuccess() {
      this.cartItems = [];
      this.saveCart();
      this.currentOrderProduct = null;
    },
    prevMedia() {
      if (this.mobileGalleryNavigating || this.allMedia.length <= 1) return;
      this.mobileGalleryNavigating = true;
      this.currentMediaIndex = this.currentMediaIndex > 0 ? this.currentMediaIndex - 1 : this.allMedia.length - 1;
      setTimeout(() => {
        this.mobileGalleryNavigating = false;
      }, 300);
    },
    nextMedia() {
      if (this.mobileGalleryNavigating || this.allMedia.length <= 1) return;
      this.mobileGalleryNavigating = true;
      this.currentMediaIndex = this.currentMediaIndex < this.allMedia.length - 1 ? this.currentMediaIndex + 1 : 0;
      setTimeout(() => {
        this.mobileGalleryNavigating = false;
      }, 300);
    },
    setMediaIndex(i) {
      if (i >= 0 && i < this.allMedia.length) this.currentMediaIndex = i;
      },
    openMediaViewModal() {
      this.mediaViewOpen = true;
    },
    openMediaViewModalFromIndex(i) {
      this.setMediaIndex(i);
      this.openMediaViewModal();
    },
    closeMediaViewModal() {
      this.mediaViewOpen = false;
    },
    prevMediaInModal() {
      if (this.currentMediaIndex > 0) this.currentMediaIndex--;
    },
    nextMediaInModal() {
      if (this.currentMediaIndex < this.allMedia.length - 1) {
        this.currentMediaIndex++;
      }
    },
    onImageLoadStart() {
      this.isImageLoading = true;
    },
    onImageLoad() {
      this.isImageLoading = false;
    },
    onImageError() {
      this.isImageLoading = false;
    },
    onVideoLoadStart() {
      this.isImageLoading = true;
    },
    onVideoLoadedData() {
      this.isImageLoading = false;
    },
    onVideoError() {
      this.isImageLoading = false;
    },
    onKeydown(e) {
      if (!this.mediaViewOpen) return;
      if (e.key === 'Escape') this.closeMediaViewModal();
      if (e.key === 'ArrowLeft') this.prevMediaInModal();
      if (e.key === 'ArrowRight') this.nextMediaInModal();
    },
    closeAllModals() {
      this.cartOpen = false;
      this.favoritesOpen = false;
      this.orderModalOpen = false;
      this.mediaViewOpen = false;
      this.optionSelectorOpen = false;
    },
    handleMobileGalleryTouchStart(e) {
      if (this.allMedia.length <= 1) return;
      if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') return;

      this.mobileGalleryTouchStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
        moved: false
      };
    },
    handleMobileGalleryTouchMove(e) {
      if (!this.mobileGalleryTouchStart) return;
      const dx = Math.abs(e.touches[0].clientX - this.mobileGalleryTouchStart.x);
      const dy = Math.abs(e.touches[0].clientY - this.mobileGalleryTouchStart.y);
      if (dx > 5 || dy > 5) this.mobileGalleryTouchStart.moved = true;
      if (dx > dy && dx > 10) e.preventDefault();
    },
    handleMobileGalleryTouchEnd(e) {
      if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') return;
      const ts = this.mobileGalleryTouchStart;
      if (!ts?.moved) { this.mobileGalleryTouchStart = null; return; }
      const dx = ts.x - e.changedTouches[0].clientX;
      const dy = Math.abs(ts.y - e.changedTouches[0].clientY);

      if (Math.abs(dx) > 50 && Math.abs(dx) > dy && Date.now() - ts.time < 500) {
        dx > 0 ? this.nextMedia() : this.prevMedia();
      }

      this.mobileGalleryTouchStart = null;
    },
    handleMobileGalleryMouseDown(e) {
      if (this.allMedia.length <= 1 || e.button !== 0) return;
      e.preventDefault();

      this.mobileGalleryMouseStart = {
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
        moved: false
      };
    },
    handleMobileGalleryMouseMove(e) {
      if (!this.mobileGalleryMouseStart) return;
      const dx = Math.abs(e.clientX - this.mobileGalleryMouseStart.x);
      const dy = Math.abs(e.clientY - this.mobileGalleryMouseStart.y);
      if (dx > 5 || dy > 5) this.mobileGalleryMouseStart.moved = true;
    },
    handleMobileGalleryMouseUp(e) {
      const ms = this.mobileGalleryMouseStart;
      if (!ms?.moved) { this.mobileGalleryMouseStart = null; return; }
      const dx = ms.x - e.clientX;
      const dy = Math.abs(ms.y - e.clientY);

      if (Math.abs(dx) > 50 && Math.abs(dx) > dy && Date.now() - ms.time < 500) {
        dx > 0 ? this.nextMedia() : this.prevMedia();
      }

      this.mobileGalleryMouseStart = null;
    },
    handleMobileGalleryMouseLeave() {
      this.mobileGalleryMouseStart = null;
    },
    handleImageTouchStart(e) {
      this.imageTouchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
    },
    handleImageTouchEnd(e) {
      if (!this.imageTouchStart) {
        this.openMediaViewModalFromIndex(this.currentMediaIndex);
        return;
      }

      const dx = this.imageTouchStart.x - e.changedTouches[0].clientX;
      const dy = Math.abs(this.imageTouchStart.y - e.changedTouches[0].clientY);
      const absDx = Math.abs(dx);
      const dt = Date.now() - this.imageTouchStart.time;

      if (this.allMedia.length > 1 && absDx > 50 && absDx > dy && dt < 500) {
        dx > 0 ? this.nextMedia() : this.prevMedia();
        this.imageTouchStart = null; return;
      }

      if ((absDx > 30 || dy > 30) && dt < 500) {
        this.imageTouchStart = null;
        return;
      }

      this.imageTouchStart = null;
      this.openMediaViewModalFromIndex(this.currentMediaIndex);
    },
  },
};
</script>

<template>
  <NavBar
      :auth="auth"
      :products="products"
      :wishlist="wishlist"
      :is-main-page="false"
      @auth-changed="refreshAuth"
      @update:cartItems="v => { cartItems = v; saveCart(); }"
      @update:wishlist="v => { wishlist = v; saveWishlist(); }"
  />
  <main>
    <div v-if="loading" class="product-loading">
      <i class="fas fa-spinner fa-spin"></i>
    </div>
    <section v-else-if="notFound" class="error-state">
      <div class="container">
        <div class="error-content">
          <h2>Товар не найден</h2>
          <p>Возможно, товар был удалён или вы перешли по неверной ссылке.</p>
          <a href="/" class="btn btn-primary">На главную</a>
        </div>
      </div>
    </section>
    <section v-else-if="product" class="product-detail-container">
      <div class="container">
        <div class="product-detail">
          <div class="product-images desktop-only">
            <div class="main-image">
              <div v-if="allMedia && allMedia.length > 0">
                <video v-if="allMedia[currentMediaIndex]?.type === 'video'"
                       class="product-main-video" :src="'/' + allMedia[currentMediaIndex].url"
                       controls muted loop playsinline @click.prevent="openMediaViewModal"></video>
                <img v-else-if="allMedia[currentMediaIndex]" class="product-main-img"
                     :src="'/' + allMedia[currentMediaIndex].url" :alt="product.name"
                     @click="openMediaViewModal">
                <div v-if="allMedia.length > 1">
                  <button class="gallery-nav-btn prev-btn" @click.stop="prevMedia" :disabled="currentMediaIndex <= 0">
                    <i class="fas fa-chevron-left"></i>
                  </button>
                  <button class="gallery-nav-btn next-btn" @click.stop="nextMedia" :disabled="currentMediaIndex >= allMedia.length - 1">
                    <i class="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
            <div class="image-gallery" v-if="allMedia.length > 1">
              <div class="gallery-thumbnails">
                <div v-for="(item, index) in allMedia" :key="index" class="thumbnail-item"
                     :class="{ active: currentMediaIndex === index }" @click="setMediaIndex(index)">
                  <div v-if="item.type === 'video'" class="thumbnail-video-wrapper">
                    <video :src="item.url" class="thumbnail-img thumbnail-video" preload="metadata" muted playsinline></video>
                    <i class="fas fa-play thumbnail-play-icon"></i>
                  </div>
                  <img v-else :src="item.url" :alt="product.name" class="thumbnail-img">
                </div>
              </div>
              <div class="gallery-navigation">
                <span class="gallery-counter">{{ currentMediaIndex + 1 }} / {{ allMedia.length }}</span>
              </div>
            </div>
          </div>
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
                <img v-if="allMedia[currentMediaIndex]?.type !== 'video'"
                     :src="'/' + allMedia[currentMediaIndex]?.url || ''" :alt="product.name"
                     class="product-img" :class="{ loading: isImageLoading }"
                     loading="lazy" decoding="async"
                     @loadstart="onImageLoadStart" @load="onImageLoad" @error="onImageError"
                     @click="openMediaViewModalFromIndex(currentMediaIndex)"
                     @touchstart.stop="handleImageTouchStart" @touchend.stop="handleImageTouchEnd"
                     style="cursor:pointer;pointer-events:auto;">
                <video v-else-if="allMedia[currentMediaIndex]?.type === 'video'"
                       :src="'/' + allMedia[currentMediaIndex]?.url || ''"
                       class="product-img" :class="{ loading: isImageLoading }"
                       muted loop playsinline autoplay
                       @loadstart="onVideoLoadStart" @loadeddata="onVideoLoadedData" @error="onVideoError"
                       @click="openMediaViewModalFromIndex(currentMediaIndex)"
                       @touchstart.stop="handleImageTouchStart" @touchend.stop="handleImageTouchEnd"
                       style="cursor:pointer;pointer-events:auto;"></video>
              </div>
              <div v-if="allMedia.length > 1" class="product-image-nav">
                <button class="product-image-nav-btn product-image-nav-prev" @click.stop.prevent="prevMedia">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <button class="product-image-nav-btn product-image-nav-next" @click.stop.prevent="nextMedia">
                  <i class="fas fa-chevron-right"></i>
                </button>
                <div class="product-image-dots">
                  <span v-for="(index) in allMedia" :key="index"
                        class="product-image-dot" :class="{ active: currentMediaIndex === index }"
                        @click.stop.prevent="setMediaIndex(index)"></span>
                </div>
              </div>
            </div>
          </div>
          <div class="product-info">
            <div class="product-header">
              <h1 class="product-page title">{{ product.name }}</h1>
              <div class="product-price">
                <template v-if="product.price_sale">
                  <span class="price-old">{{ product.price }} руб.</span>
                  <span class="price-sale">{{ product.price_sale }} руб.</span>
                </template>
                <span v-else class="price-current">{{ product.price }} руб.</span>
              </div>
            </div>
            <div v-if="product.material" class="product-meta">
              <div class="product-material">
                <i class="fas fa-gem"></i>
                <span>{{ product.material }}</span>
              </div>
            </div>
            <div v-if="product.description" class="product-description">
              <h3>Описание</h3>
              <p style="white-space:pre-line">{{ product.description }}</p>
            </div>
            <div v-if="product.peculiarities && product.peculiarities.length" class="product-features">
              <h3>Особенности</h3>
              <ul>
                <li v-for="(pec, i) in product.peculiarities" :key="i">
                  <i class="fas fa-check"></i> {{ pec }}
                </li>
              </ul>
            </div>
            <div class="product-actions" style="margin-top:2rem">
              <div class="product-order-favorite desktop-only">
                <div class="action-row">
                  <button @click="selectOption('buyNow', $event)" class="btn btn-primary add-to-cart-btn">
                    <i class="fas fa-shopping-bag"></i> Купить сейчас
                  </button>
                  <template v-if="!isProductInCart">
                    <button @click="selectOption('addToCart', $event)" class="btn btn-outline add-to-cart-btn">
                      <i class="fas fa-shopping-cart"></i> Добавить в корзину
                    </button>
                    <button @click="toggleWishlist" class="btn btn-outline wishlist-btn" :class="{ active: isInWishlist }">
                      <i class="fas fa-heart"></i>
                    </button>
                  </template>
                  <template v-else>
                    <div class="split-button-container">
                      <div class="split-button-wrapper">
                        <button @click="cartOpen = true" class="split-btn split-btn-left">
                          <i class="fas fa-shopping-cart"></i> В корзине
                        </button>
                        <button @click="selectOption('addToCart', $event)" class="split-btn split-btn-right">
                          <span class="plus-circle">+</span>
                          <span class="add-text"><i class="fas fa-plus"></i> Добавить ещё</span>
                        </button>
                      </div>
                    </div>
                    <button @click="toggleWishlist" class="btn btn-outline wishlist-btn" :class="{ active: isInWishlist }">
                      <i class="fas fa-heart"></i>
                    </button>
                  </template>
                </div>
              </div>
              <div class="product-order-favorite-mobile mobile-only">
                <button @click="selectOption('buyNow', $event)" class="add-to-cart mobile-action-btn">
                  <i class="fas fa-shopping-bag"></i> Купить сейчас
                </button>
                <div class="mobile-actions-row">
                  <template v-if="!isProductInCart">
                    <button @click="selectOption('addToCart', $event)" class="add-to-cart mobile-action-btn">
                      <i class="fas fa-shopping-cart"></i> В корзину
                    </button>
                  </template>
                  <template v-else>
                    <button @click="cartOpen = true" class="add-to-cart mobile-action-btn">
                      <i class="fas fa-shopping-cart"></i> В корзине
                    </button>
                    <button @click="selectOption('addToCart', $event)" class="add-to-cart mobile-action-btn mobile-add-more">
                      <i class="fas fa-plus"></i>
                    </button>
                  </template>
                  <button @click="toggleWishlist" class="wishlist mobile-action-btn" :class="{ active: isInWishlist }">
                    <i class="fas fa-heart"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <OptionSelector
        v-model="optionSelectorOpen"
        :options="productOptions"
        :action="optionSelectorAction"
        @done="onOptionDone"
    />
    <OrderModal
        v-model="orderModalOpen"
        :current-order-product="currentOrderProduct"
        :cart-items="cartItems"
        :cart-total="cartTotal"
        @order-success="onOrderSuccess"
    />
    <div class="cart-modal" :class="{ active: cartOpen }">
      <div class="cart-header">
        <h3>Ваша корзина</h3>
        <button class="close-icon" @click="cartOpen = false"><i class="fas fa-times"></i></button>
      </div>
      <div v-if="cartItems.length > 0">
        <div class="cart-item" v-for="(item, idx) in cartItems" :key="`${item.id}-${item.optionKey || idx}`">
          <img :src="item.image" :alt="item.name" class="cart-item-img" loading="lazy">
          <div class="cart-item-details">
            <h4 class="cart-item-title">{{ item.name }}</h4>
            <p v-for="opt in item.options" :key="opt.name" class="cart-item-attr">{{ opt.name }}: {{ opt.value }}</p>
            <p class="cart-item-price">{{ item.price }} руб.</p>
            <div class="cart-item-actions">
              <button class="quantity-btn" @click="decreaseQuantity(item)">-</button>
              <span class="quantity">{{ item.quantity }}</span>
              <button class="quantity-btn" @click="increaseQuantity(item)">+</button>
              <button class="remove-item" @click="removeFromCart(item)"><i class="fas fa-trash"></i></button>
            </div>
          </div>
        </div>
        <div class="cart-total"><span>Итого:</span><span>{{ cartTotal }} руб.</span></div>
        <button class="checkout-btn" @click="openOrderModal">Оформить заказ</button>
      </div>
      <div v-else class="empty-cart">
        <i class="fas fa-shopping-cart" style="font-size:50px;margin-bottom:20px"></i>
        <p>Ваша корзина пуста</p>
        <a href="/" class="btn btn-primary">Перейти к товарам</a>
      </div>
    </div>
    <div class="favorites-modal" :class="{ active: favoritesOpen }">
      <div class="favorites-header">
        <h3>Избранные товары</h3>
        <button class="close-icon" @click="favoritesOpen = false"><i class="fas fa-times"></i></button>
      </div>
      <div class="favorites-content">
        <div v-if="favoriteProducts.length">
          <div class="favorites-item" v-for="fp in favoriteProducts" :key="fp.id">
            <img :src="fp.image" :alt="fp.name" class="favorites-item-img" loading="lazy">
            <div class="favorites-item-details">
              <h4 class="favorites-item-title">{{ fp.name }}</h4>
              <p class="favorites-item-material">{{ fp.material }}</p>
              <p class="favorites-item-price">{{ fp.price_sale || fp.price }} руб.</p>
              <div class="favorites-item-actions">
                <button class="add-to-cart-btn" @click="fromWishlistToCart(fp.id)">
                  <i class="fas fa-shopping-cart"></i> В корзину
                </button>
                <button class="remove-from-favorites" @click="toggleWishlistById(fp.id)">
                  <i class="fas fa-heart-broken"></i> Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-favorites">
          <p>У вас нет избранных товаров</p>
          <a href="/" class="btn btn-primary">Перейти к товарам</a>
        </div>
      </div>
    </div>
    <div v-if="mediaViewOpen && allMedia.length" class="content-view view-modal" @click="closeMediaViewModal">
      <div class="content-view content" @click.stop>
        <button class="gallery-nav-btn btn-close-view" @click="closeMediaViewModal">
          <i class="fas fa-times"></i>
        </button>
        <video v-if="allMedia[currentMediaIndex]?.type === 'video'"
               :key="'v-' + currentMediaIndex" class="content-view video"
               :src="'/' + allMedia[currentMediaIndex].url" controls muted loop autoplay playsinline></video>
        <img v-else-if="allMedia[currentMediaIndex]"
             :key="'i-' + currentMediaIndex" class="content-view image"
             :src="'/' + allMedia[currentMediaIndex].url" :alt="product?.name">
        <button v-if="allMedia.length > 1" @click.stop="prevMediaInModal" class="content-view gallery-nav-btn prev-btn" :disabled="currentMediaIndex === 0">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button v-if="allMedia.length > 1" @click.stop="nextMediaInModal" class="content-view gallery-nav-btn next-btn" :disabled="currentMediaIndex >= allMedia.length - 1">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
    <div class="overlay" :class="{ active: cartOpen || favoritesOpen || orderModalOpen || optionSelectorOpen }" @click="closeAllModals"></div>
  </main>
</template>

<style scoped>
main {
  padding-top: 90px;
}
.product-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  font-size: 40px;
  color: var(--primary);
}
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}
.error-content {
  text-align: center;
}
.error-content h2 {
  margin-bottom: 12px;
  color: var(--primary);
}
.error-content p {
  color: var(--text-additional);
  margin-bottom: 20px;
}
.product-detail-container {
  padding: 40px 0 60px;
}
.product-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: start;
}
.desktop-only {
  display: block;
}
.mobile-only {
  display: none;
}
/* Gallery */
.main-image {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: var(--background-secondary);
}
.product-main-img {
  width: 100%;
  max-height: 500px;
  object-fit: contain;
  cursor: zoom-in;
  display: block;
}
.product-main-video {
  width: 100%;
  max-height: 500px;
  object-fit: contain;
  display: block;
}
.gallery-thumbnails {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}
.thumbnail-item {
  width: 70px;
  height: 70px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}
.thumbnail-item.active {
  border-color: var(--primary);
}
.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.thumbnail-video-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}
.thumbnail-play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
  color: #fff;
  font-size: 18px;
  pointer-events: none;
}
.gallery-navigation {
  margin-top: 8px;
  text-align: center;
  color: var(--text-additional);
  font-size: 13px;
}
.gallery-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0,0,0,.5);
  border: none;
  border-radius: 50%;
  color: #fff;
  width: 36px;
  height: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition: background 0.2s;
}
.gallery-nav-btn:hover {
  background: rgba(0,0,0,.75);
}
.gallery-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.prev-btn {
  left: 10px;
}
.next-btn {
  right: 10px;
}
/* Mobile gallery */
.product-img-container {
  position: relative;
  background: var(--background-secondary);
  border-radius: 12px;
  overflow: hidden;
  user-select: none;
}
.product-img {
  width: 100%;
  max-height: 380px;
  object-fit: contain;
  display: block;
}
.product-img.loading {
  opacity: 0.5;
}
.image-loading-indicator {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border-light);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.product-image-nav {
  position: absolute;
  bottom: 12px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.product-image-nav-btn {
  background: rgba(0,0,0,.45);
  border: none;
  border-radius: 50%;
  color: #fff;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.product-image-dots {
  display: flex;
  gap: 6px;
}
.product-image-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,.5);
  cursor: pointer;
  transition: background 0.2s;
}
.product-image-dot.active {
  background: #fff;
}
/* Product Info */
.product-header {
  margin-bottom: 16px;
}
.product-page.title {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 12px;
}
.product-price {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 22px;
  font-weight: 600;
}
.price-current {
  color: var(--primary);
}
.price-old {
  text-decoration: line-through;
  color: var(--text-additional);
  font-size: 16px;
}
.price-sale {
  color: var(--warning);
}
.product-meta {
  margin-bottom: 16px;
  color: var(--text-secondary);
}
.product-material {
  display: flex;
  align-items: center;
  gap: 8px;
}
.product-material i {
  color: var(--primary);
}
.product-description {
  margin-bottom: 20px;
}
.product-description h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--primary);
}
.product-description p {
  color: var(--text-secondary);
  line-height: 1.6;
}
.product-features h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--primary);
}
.product-features ul {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.product-features li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--text-secondary);
}
.product-features li i {
  color: var(--primary);
  margin-top: 3px;
}
/* Action buttons */
.action-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.add-to-cart-btn {
  margin: 0;
}
.wishlist-btn {
  margin: 0;
}
.wishlist-btn.active i {
  color: var(--warning);
}
.split-button-container {
  display: inline-flex;
}
.split-button-wrapper {
  display: flex;
  border: 2px solid var(--primary);
  border-radius: 8px;
  overflow: hidden;
}
.split-btn {
  background: none;
  border: none;
  padding: 8px 14px;
  cursor: pointer;
  color: var(--text-btn);
  font-weight: 600;
  font-size: 14px;
  transition: background 0.2s;
}
.split-btn-left {
  border-right: 1px solid var(--border-light);
}
.split-btn:hover {
  background: var(--background-secondary);
}
.mobile-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--btn-bg);
  border: 2px solid var(--primary);
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  color: var(--text-btn);
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
  margin-bottom: 8px;
}
.mobile-action-btn:hover {
  background: var(--secondary);
}
.mobile-action-btn.active i {
  color: var(--warning);
}
.mobile-add-more {
  width: auto;
  flex: 0 0 auto;
}
.mobile-actions-row {
  display: flex;
  gap: 8px;
}
/* Cart / Favorites (mirrors main page) */
.cart-modal {
  position: fixed;
  top: 0;
  right: 0;
  width: 380px;
  max-width: 100vw;
  height: 100vh;
  background: var(--background);
  box-shadow: -4px 0 20px rgba(0,0,0,.2);
  z-index: 1500;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  overflow-y: auto;
  padding: 20px;
}
.cart-modal.active {
  transform: translateX(0);
}
.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.cart-header h3 {
  font-size: 20px;
  color: var(--primary);
  margin: 0;
}
.cart-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
}
.cart-item-img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}
.cart-item-details {
  flex: 1;
}
.cart-item-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--primary);
}
.cart-item-attr {
  font-size: 12px;
  color: var(--text-additional);
  margin-bottom: 2px;
}
.cart-item-price {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 6px;
}
.cart-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.quantity-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-light);
  border-radius: 4px;
  background: var(--background-secondary);
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.quantity {
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}
.remove-item {
  background: none;
  border: none;
  color: var(--warning);
  cursor: pointer;
  padding: 4px;
}
.cart-total {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  font-size: 16px;
  padding: 16px 0;
  border-top: 1px solid var(--border-light);
  margin-top: 8px;
}
.checkout-btn {
  width: 100%;
  padding: 12px;
  background: var(--primary);
  color: var(--background);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.checkout-btn:hover {
  opacity: 0.85;
}
.empty-cart {
  text-align: center;
  padding: 40px 0;
  color: var(--text-additional);
}
.favorites-modal {
  position: fixed;
  top: 0;
  right: 0;
  width: 380px;
  max-width: 100vw;
  height: 100vh;
  background: var(--background);
  box-shadow: -4px 0 20px rgba(0,0,0,.2);
  z-index: 1500;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  overflow-y: auto;
  padding: 20px;
}
.favorites-modal.active {
  transform: translateX(0);
}
.favorites-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.favorites-header h3 {
  font-size: 20px;
  color: var(--primary);
  margin: 0;
}
.favorites-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
}
.favorites-item-img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}
.favorites-item-details {
  flex: 1;
}
.favorites-item-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--primary);
}
.favorites-item-material {
  font-size: 12px;
  color: var(--text-additional);
  margin-bottom: 4px;
}
.favorites-item-price {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 8px;
}
.favorites-item-actions {
  display: flex;
  gap: 8px;
}
.favorites-item-actions button {
  padding: 6px 12px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  background: var(--background-secondary);
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}
.empty-favorites {
  text-align: center;
  padding: 40px 0;
  color: var(--text-additional);
}
/* Media view */
.content-view.view-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.92);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.content-view.content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.content-view.image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
}
.content-view.video {
  max-width: 90vw;
  max-height: 90vh;
}
.btn-close-view {
  position: absolute;
  top: -48px;
  right: 0;
  z-index: 10;
}
@media (max-width: 768px) {
  .product-detail {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .desktop-only {
    display: none !important;
  }
  .mobile-only {
    display: block !important;
  }
}
</style>
