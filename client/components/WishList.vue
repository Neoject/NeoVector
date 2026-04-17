<script>
export default {
  name: "WishList",
  props: {
    favoritesOpen: { type: Boolean, default: false },
    wishlist: { type: Array, default: () => [] },
    products: { type: Array, default: () => [] },
    cartItems: { type: Array, default: () => [] }
  },
  emits: ['close', 'update:wishlist', 'add-to-cart', 'nav-click'],
  data() {
    return {
      imageLoadingStates: {},
      touchStartX: 0,
      touchStartY: 0,
      touchEndX: 0,
      touchEndY: 0
    }
  },
  computed: {
    wishlistSet() {
      const set = new Set();
      (Array.isArray(this.wishlist) ? this.wishlist : []).forEach((id) => {
        set.add(String(id));
      });
      return set;
    },
    favoriteProducts() {
      return this.products.filter(p => this.wishlistSet.has(String(p.id)));
    },
    wishlistCount() {
      return this.wishlistSet.size;
    }
  },
  methods: {
    /* ── навигация ── */
    closeFavorites() {
      this.$emit('close');
    },
    navClick(event, target) {
      this.$emit('nav-click', event, target);
    },
    /* ── wishlist ── */
    toggle(productId) {
      const targetId = String(productId);
      const current = Array.isArray(this.wishlist) ? [...this.wishlist] : [];
      const updated = current.some(id => String(id) === targetId)
          ? current.filter(id => String(id) !== targetId)
          : [...current, productId];
      localStorage.setItem('wishlist', JSON.stringify(updated));
      this.$emit('update:wishlist', updated);
    },
    addFromFavoritesToCart(product, event) {
      this.$emit('add-to-cart', product, event);
    },
    /* ── свайп ── */
    handleFavoritesTouchStart(e) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    },
    handleFavoritesTouchMove(e) {
      if (!e.target.closest('.favorites-content')) e.preventDefault();
    },
    handleFavoritesTouchEnd(e) {
      this.touchEndX = e.changedTouches[0].clientX;
      this.touchEndY = e.changedTouches[0].clientY;
      const diffX = this.touchEndX - this.touchStartX;
      const diffY = Math.abs(this.touchEndY - this.touchStartY);
      if (diffX > 50 && diffY < 100) this.closeFavorites();
    },
    /* ── медиа-утилиты ── */
    isVideo(url) {
      return typeof url === 'string' && /\.(mp4|webm|ogg|m4v|mov|avi|flv)(\?|#|$)/i.test(url);
    },
    getCurrentProductImage(product) {
      return product.image || '';
    },
    isImageLoading(product) {
      return this.imageLoadingStates[product?.id] === true;
    },
    onVideoLoadStart(event, product) {
      if (product?.id && event.target.readyState < 2) {
        this.imageLoadingStates[product.id] = true;
      }
    },
    onVideoLoadedData(event, product) {
      if (product?.id) this.imageLoadingStates[product.id] = false;
    },
    onVideoError(event, product) {
      if (product?.id) this.imageLoadingStates[product.id] = false;
    }
  }
}
</script>

<template>
  <div
      class="favorites-modal"
      :class="{ 'active': favoritesOpen }"
      @touchstart="handleFavoritesTouchStart"
      @touchmove="handleFavoritesTouchMove"
      @touchend="handleFavoritesTouchEnd"
  >
    <div class="favorites-content-wrapper" @click.stop>
      <div class="favorites-header">
        <div class="favorites-header-left">
          <h3>Избранные товары</h3>
        </div>
        <button class="close-icon" @click="closeFavorites">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="favorites-content">
        <div v-if="wishlist.length > 0">
          <div
              class="favorites-item"
              v-for="product in favoriteProducts"
              :key="product.id"
          >
            <img
                v-if="!isVideo(getCurrentProductImage(product))"
                :src="product.image"
                :alt="product.name"
                class="favorites-item-img"
                loading="lazy"
                decoding="async"
            >
            <video
                v-else
                :src="getCurrentProductImage(product)"
                class="cart-item-img"
                :class="{ 'loading': isImageLoading(product) }"
                muted loop playsinline autoplay
                @loadstart="onVideoLoadStart($event, product)"
                @loadeddata="onVideoLoadedData($event, product)"
                @error="onVideoError($event, product)"
            ></video>
            <div class="favorites-item-details">
              <h4 class="favorites-item-title">{{ product.name }}</h4>
              <p class="favorites-item-material">{{ product.material }}</p>
              <p class="favorites-item-price">{{ product.price }} руб.</p>
              <div class="favorites-item-actions">
                <button
                    class="add-to-cart-btn fav-cart-btn"
                    @click="addFromFavoritesToCart(product, $event)"
                >
                  <i class="fas fa-shopping-cart"></i> В корзину
                </button>
                <button class="remove-from-favorites" @click="toggle(product.id)">
                  <i class="fas fa-heart-broken"></i> Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-favorites">
          <i class="fas fa-heart" style="font-size:50px;margin-bottom:20px;color:#ccc;"></i>
          <p>У вас пока нет избранных товаров</p>
          <a href="#" class="btn btn-primary" @click="navClick($event, 'products')">
            Перейти к товарам
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.favorites-modal {
  position: fixed;
  top: 0;
  right: -400px;
  width: 380px;
  height: 100vh;
  background: linear-gradient(135deg, var(--background-secondary) 0%, var(--background-additional) 100%);
  backdrop-filter: blur(10px);
  box-shadow: -5px 0 20px var(--shadow-primary);
  transition: right 0.4s ease;
  z-index: 2000;
  overflow-y: auto;
  padding: 30px;
  display: flex;
  flex-direction: column;
}
.favorites-modal.active {
  right: 0;
}
.favorites-content-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.favorites-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border-light);
}
.favorites-header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}
.favorites-header h3 {
  color: var(--primary);
  font-size: 24px;
  font-weight: 600;
}
.favorites-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
}
.favorites-content::-webkit-scrollbar {
  width: 6px;
}
.favorites-content::-webkit-scrollbar-track {
  background: var(--background-secondary);
  border-radius: 3px;
}
.favorites-content::-webkit-scrollbar-thumb {
  background: var(--background-additional);
  border-radius: 3px;
}
.favorites-content::-webkit-scrollbar-thumb:hover {
  background: var(--background-secondary);
}
.add-to-cart-btn {
  flex: 1;
  min-height: 3rem;
  min-width: 14vw;
  max-width: 24vw;
  padding: 6px 18px;
  font-size: 0.9rem;
  font-weight: 400;
  background: linear-gradient(135deg, var(--text-simple) 0%, var(--warning-dark) 100%);
  color: var(--text-dark);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.add-to-cart-btn:hover {
  -webkit-transform: translateY(-2px);
  -moz-transform: translateY(-2px);
  -ms-transform: translateY(-2px);
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(255, 215, 0, 0.3);
}
.add-to-cart-btn-option {
  background: linear-gradient(135deg, var(--text-simple) 0%, var(--warning-dark) 100%);
  color: var(--text-dark);
  padding: 6px 18px;
  border: none;
  border-radius: 50px;
  margin: 0;
}
.add-to-cart-btn-option:hover {}
.add-to-cart-btn.fav-cart-btn {
  min-width: 2vw;
}
.empty-favorites {
  text-align: center;
  padding: 40px 0;
  color: var(--text-secondary);
}
.favorites-item {
  display: flex;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-light);
}
.favorites-item-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 15px;
  image-rendering: high-quality;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  transform: translateZ(0);
}
.favorites-item-details {
  flex: 1;
}
.favorites-item-title {
  font-size: 16px;
  margin-bottom: 5px;
  color: var(--primary);
}
.favorites-item-material {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 5px;
}
.favorites-item-price {
  font-weight: 600;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.favorites-item-price .price-sale {
  background: var(--primary);
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-alt) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 18px;
}
.favorites-item-price .price-old {
  font-size: 14px;
  color: var(--text-additional);
  text-decoration: line-through;
}
.favorites-item-price:not(:has(.price-sale)) {
  background: var(--primary);
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-alt) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
}
.favorites-item-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}
.add-to-cart-btn {
  background: var(--primary);
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-alt) 100%);
  color: var(--text-dark);
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
  min-height: 44px;
}
.add-to-cart-btn:hover {
  -webkit-transform: translateY(-2px);
  -moz-transform: translateY(-2px);
  -ms-transform: translateY(-2px);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow-primary);
}
.add-to-cart-btn-option {
  background: var(--primary);
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-alt) 100%);
  color: var(--text-dark);
  border: none;
  padding: 4px 8px;
  border-radius: 6px;
}
.add-to-cart-btn-option:hover {}
.remove-from-favorites {
  background: none;
  border: 1px solid var(--border-medium);
  color: var(--primary);
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
  min-height: 44px;
}
.remove-from-favorites:hover {
  background: var(--background-additional);
  border-color: var(--border-strong);
}
</style>