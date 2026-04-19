<script>
import Props from "./Props.vue";
import Options from "./Options.vue";
import OrderModal from "../components/Order.vue";
import OptionSelector from "../components/Options.vue";
import {api} from "../../../server/api";

export default {
  name: "Products",
  components: { OrderModal, OptionSelector },
  mixins: [Props, Options],
  emits: [
    'update:cart-items',
    'update-cart',
    'update:wishlist',
    'open-cart',
    'open-favorites',
    'close-favorites',
    'start-option-selection'
  ],
  data() {
    return {
      currentProduct: null,
      activeFilter: 'all',
      orderOpen: false,
      currentOrderProduct: null,
      imageInfo: { },
      imageLoadingStates: { },
      productImageIndices: { },
      productImageNavigating: { },
      productImageTouchStart: { },
      productImageMouseStart: { },
      localCartItems: [],
      hand: null,
      productQuantity: 1,
      buyNowPressed: false,
      addToCartPressed: false,
      optionSelectorOpen: false,
      selectingHandProductId: null,
      selectingHandAction: null,
      selectingFromFavorites: false,
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
      default: () => []
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
      type: Array,
      default: () => []
    },
    wishlist: {
      type: Array,
      default: () => []
    },
    isInView: Function,
    getCurrentProductImage: Function,
  },
  computed: {
    isMobileDevice() {
      return this.isMobile;
    },
    wishlistSet() {
      const set = new Set();
      const source = Array.isArray(this.wishlist) ? this.wishlist : [];
      source.forEach((id) => set.add(this.normalizeWishlistId(id)));
      return set;
    },
    filteredProducts() {
      if (this.activeFilter === 'all') {
        return this.products;
      }

      return this.products.filter(product => product.category === this.activeFilter);
    },
    isCurrentProductInWishlist() {
      if (!this.currentProduct) return false;
      return this.isInWishlist(this.currentProduct.id);
    },
    isCurrentProductInCart() {
      if (!this.currentProduct) return false;
      return this.cartItems.some(item => item.id === this.currentProduct.id);
    },
    cartTotal() {
      return Array.isArray(this.localCartItems)
          ? this.localCartItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)
          : 0;
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
    cartItems: {
      handler(value) {
        if (Array.isArray(value)) {
          this.localCartItems = [...value];
        }
      },
      deep: true
    },
  },
  async mounted() {
    this.localCartItems = Array.isArray(this.cartItems) ? [...this.cartItems] : this.getStoredCart();
    this.initProductLinkHandlers();

    this.$nextTick(() => {
      this.checkLoadedImages();
    });
  },
  methods: {
    async startOptionSelection(product, action, point, event) {
      if (event) event.stopPropagation();

      this.resetOptionSelectionState();
      this.selectingHandProductId = product.id;
      this.selectingHandAction = action;

      if (point === 'buyNow') this.buyNowPressed = true;
      else if (point === 'addToCart') this.addToCartPressed = true;

      await this.loadProductOptions();

      if (this.productOptions.length) {
        this.optionSelectorOpen = true;
      } else {
        this.finishOptionSelection(product);
      }
    },
    onOptionDone({ options, optionKey, action }) {
      const product = this.selectingHandProduct();
      if (!product) return;

      if (action === 'buy') {
        this.currentOrderProduct = {
          ...product,
          price: product.price_sale || product.price,
          options,
          optionKey,
          quantity: 1,
        };

        this.orderOpen = true;
      } else {
        this.addToCartInternal(product, options, optionKey);

        if (this.selectingFromFavorites) {
          this.localWishlist = (this.localWishlist || []).filter(id => id !== product.id);
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
    toggleCurrentProductWishlist() {
      if (!this.currentProduct) return;
      this.toggleWishlist(this.currentProduct.id);
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

      if (product.image) {
        images.push(product.image);
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
    normalizeWishlistId(id) {
      return String(id);
    },
    isInWishlist(productId) {
      return this.wishlistSet.has(this.normalizeWishlistId(productId));
    },
    toggleWishlist(productId, event) {
      if (this.isMobile && event) {
        event.stopPropagation();
      }

      const sourceWishlist = Array.isArray(this.wishlist) ? [...this.wishlist] : [];
      const current = sourceWishlist.length ? sourceWishlist : this.getStoredWishlist();
      const targetId = this.normalizeWishlistId(productId);

      let updated;

      if (current.some((id) => this.normalizeWishlistId(id) === targetId)) {
        updated = current.filter((id) => this.normalizeWishlistId(id) !== targetId);
      } else {
        updated = [...current, productId];
      }

      this.saveWishlist(updated);
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
      if (!Array.isArray(options) || options.length === 0) return '';
      return options
          .map(o => `${o.slug || o.name}:${o.value ?? ''}`)
          .join('|');
    },
    saveCart() {
      const items = Array.isArray(this.localCartItems) ? this.localCartItems : this.getStoredCart();
      localStorage.setItem('cart', JSON.stringify(items));
      this.$emit('update-cart', [...items]);
      this.$emit('update:cart-items', [...items]);
    },
    saveWishlist(list = this.getStoredWishlist()) {
      localStorage.setItem('wishlist', JSON.stringify(list));
      this.$emit('update:wishlist', [...list]);
    },
    addToCartInternal(product, options = [], optionKey = null) {
      const currentCart = Array.isArray(this.localCartItems) ? [...this.localCartItems] : this.getStoredCart();
      const key = optionKey !== null ? optionKey : this.buildOptionKey(options);
      const existingItem = currentCart.find(item =>
          item &&
          item.id === product.id &&
          (item.optionKey ?? this.buildOptionKey(item.options || [])) === key
      );

      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 0) + 1;
      } else {
        currentCart.push({
          ...product,
          price: product.price_sale || product.price,
          options,
          optionKey: key,
          quantity: 1
        });
      }

      this.localCartItems = currentCart;
      this.saveCart();
      // this.hideOverlay();
    },
    toCart() {
      this.$emit('close-favorites');
      this.$emit('open-cart');
      this.hideOverlay();
    },
    finishOptionSelection(product) {
      const optionsSnapshot = this.selectedProductOptions.map(o => ({ ...o }));
      const optionKey = this.buildOptionKey(optionsSnapshot);

      if (this.selectingHandAction === 'buy') {
        this.currentOrderProduct = {
          ...product,
          price: product.price_sale || product.price,
          options: optionsSnapshot,
          optionKey,
          quantity: 1,
        };
        this.orderOpen = true;
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
    },
    onOrderSuccess() {
      this.currentOrderProduct = null;
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
</script>

<template>
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
    </div>
    <OptionSelector
        v-model="optionSelectorOpen"
        :options="productOptions"
        :action="selectingHandAction"
        @done="onOptionDone"
    />
    <OrderModal
        v-model="orderOpen"
        :current-order-product="currentOrderProduct"
        :cart-items="localCartItems"
        :cart-total="cartTotal"
        @order-success="onOrderSuccess"
    />
  </section>
</template>

<style scoped>
.filters {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}
.filter-btn {
  padding: 8px 20px;
  background: var(--background-secondary);
  border: 1px solid var(--border-medium);
  color: var(--text-primary);
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.filter-btn.active,
.filter-btn:hover {
  background: var(--primary);
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-alt) 100%);
  border-color: var(--primary);
  color: var(--text-dark);
}
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 40px 25px;
}
@supports not (display: grid) {
  .products-grid {
    display: flex;
    flex-wrap: wrap;
    margin: -15px;
  }

  .products-grid .product-card {
    flex: 0 0 calc(33.333% - 30px);
    margin: 15px;
    transition: all 0.25s ease;
  }
}
.product-card {
  background: var(--background-secondary);
  border-radius: 15px;
  overflow: hidden;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-light);
  touch-action: manipulation;
  display: flex;
  flex-direction: column;
  height: 100%;
}
@media (hover: hover) and (pointer: fine) {
  .product-card:hover {
    -ms-transform: translateY(-10px);
    transform: translateY(-10px);
    background: var(--background-secondary);
    box-shadow: 0 15px 30px var(--shadow-primary);
  }
}
.product-img {
  width: 100%;
  height: 32vh;
  object-fit: cover;
  object-position: 0 -48px;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  pointer-events: none;
  image-rendering: high-quality;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  transform: translateZ(0);
  will-change: transform;
}
.product-img-container video.product-img {
  pointer-events: auto;
  transition: opacity 0.3s ease;
}
.product-img-container {
  cursor: pointer;
  position: relative;
  padding: 0.5vh 2vw;
  border: 2px solid var(--background);
  border-radius: 12px;
  background: var(--background-secondary);
  height: 32vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-user-drag: none;
}
.image-loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-medium);
  border-top-color: var(--header-secondary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  box-shadow: 0 2px 8px var(--shadow-primary);
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.product-img.loading {
  opacity: 0.4;
  transition: opacity 0.3s ease;
}
.product-img-container video.product-img.loading {
  opacity: 0.4;
}
.product-img-container::before,
.product-img-container::after {
  content: '';
  position: absolute;
  top: 0;
  width: 50%;
  height: 100%;
  background-size: 150% auto;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(25px) brightness(0.9);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
  transform: scale(1.2);
}
.product-img-container::before {
  left: 0;
  background-position: left center;
}
.product-img-container::after {
  right: 0;
  background-position: right center;
}
.product-img-container.narrow-image::before,
.product-img-container.narrow-image::after {
  opacity: 0.6;
}
.product-img {
  width: 100%;
  height: 32vh;
  object-fit: cover;
  /*object-position: 0 -48px;*/
  object-position: center;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  pointer-events: none;
  position: relative;
  z-index: 1;
  transition: opacity 0.3s ease;
  image-rendering: crisp-edges;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  transform: translateZ(0);
  will-change: transform;
}
.product-img-container.narrow-image .product-img {
  object-fit: contain;
  height: 100%;
  width: auto;
  max-width: 100%;
}
.product-image-nav {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
}
.product-image-nav-btn {
  background: var(--background-additional);
  border: none;
  color: var(--text-primary);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto !important;
  transition: all 0.3s ease;
  opacity: 0;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  z-index: 12;
  position: relative;
  -webkit-tap-highlight-color: transparent;
}
.product-img-container:hover .product-image-nav-btn {
  opacity: 1;
}
.product-image-nav-btn:hover {
  background: var(--hover-secondary);
  transform: scale(1.1);
}
.product-image-nav-btn:active {
  transform: scale(0.95);
}
.product-image-nav-btn i {
  font-size: 14px;
}
.product-image-nav-prev {
  margin-right: auto;
}
.product-image-nav-next {
  margin-left: auto;
}
.product-image-dots {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  pointer-events: auto;
  z-index: 11;
}
.product-image-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--background-additional);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-medium);
  pointer-events: auto !important;
  -webkit-tap-highlight-color: transparent;
  position: relative;
  z-index: 12;
}
.product-image-dot:hover {
  background: var(--hover-secondary);
  transform: scale(1.2);
}
.product-image-dot.active {
  background: var(--background-secondary);
  width: 24px;
  border-radius: 4px;
}
.product-info {
  display: flex;
  flex-direction: column;
  height: 57%;
  padding: 0 20px;
  margin-bottom: 0;
}
.product-details {
  user-select: none;
  margin-top: auto;
  margin-bottom: 0;
}
.product-material {
  color: var(--text-secondary);
  margin-bottom: 10px;
  font-size: 14px;
}
.product-price {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 15px;
  display: flex;
  flex-direction: row;
  gap: 5px;
}
.product_price.price-current {
  user-select: text;
}
.product-price .price-sale {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-alt) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 22px;
  user-select: text;
}
.price-old {
  font-size: 16px;
  color: var(--text-additional);
  text-decoration: line-through;
}
.product-price:not(:has(.price-sale)) {
  background: var(--primary);
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-alt) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.product-actions {
  display: flex;
  flex-direction: column;
  /*margin-top: auto;*/
  gap: 10px;
  margin-bottom: 2vh;
}
.product-order-favorite {
  display: flex;
  flex-direction: row;
  justify-content: center;
}
.add-to-cart {
  flex: 1;
  padding: 10px;
  background: var(--primary);
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-alt) 100%);
  color: var(--text-dark);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  min-height: 44px;
}
.add-to-cart:hover {
  background: transparent;
  border: 1px solid var(--primary);
  color: var(--primary);
}
.wishlist {
  width: 40px;
  background: var(--background-secondary);
  border: 1px solid var(--border-medium);
  color: var(--text-primary);
  border-radius: 8px;
  cursor: pointer;
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
  margin-left: 10px;
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.wishlist.active {
  background: var(--primary);
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-alt) 100%);
  border-color: var(--primary);
  color: var(--text-dark);
}
</style>