<script>
export default {
  name: "Cart",
  props: {
    cartOpen:  { type: Boolean, default: false },
    cartItems: { type: Array,   default: () => [] }
  },
  emits: ['close', 'update:cartItems', 'update:cart-items', 'open-order', 'nav-click'],
  data() {
    return {
      imageLoadingStates: {},
      localItems: []
    }
  },
  watch: {
    cartItems: {
      immediate: true,
      deep: true,
      handler(value) {
        this.localItems = Array.isArray(value) ? value.map(item => ({ ...item })) : [];
      }
    }
  },
  computed: {
    cartTotal() {
      return this.localItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },
    cartItemsCount() {
      return this.localItems.reduce((sum, item) => sum + item.quantity, 0);
    }
  },
  methods: {
    /* ── навигация ── */
    closeCart() {
      this.$emit('close');
    },
    openOrderModal() {
      this.$emit('open-order');
    },
    navClick(event, target) {
      this.$emit('nav-click', event, target);
    },
    getItemKey(item) {
      if (!item) return '';
      if (item.optionKey) return item.optionKey;

      if (Array.isArray(item.options) && item.options.length) {
        return item.options
            .map(option => (option && (option.slug || option.name || option.value)) || '')
            .filter(Boolean)
            .join('|');
      }
      
      return 'default';
    },
    isSameCartItem(a, b) {
      return a && b && a.id === b.id && this.getItemKey(a) === this.getItemKey(b);
    },
    /* ── управление количеством ── */
    increaseQuantity(item) {
      this._updateItem(item, item.quantity + 1);
    },
    decreaseQuantity(item) {
      if (item.quantity > 1) {
        this._updateItem(item, item.quantity - 1);
      } else {
        this.removeFromCart(item);
      }
    },
    removeFromCart(item) {
      const updated = this.localItems.filter(
          i => !this.isSameCartItem(i, item)
      );
      this._persist(updated);
    },
    _updateItem(item, quantity) {
      const updated = this.localItems.map(i =>
          this.isSameCartItem(i, item)
              ? { ...i, quantity }
              : i
      );
      this._persist(updated);
    },
    _persist(items) {
      this.localItems = Array.isArray(items) ? items.map(item => ({ ...item })) : [];
      localStorage.setItem('cart', JSON.stringify(items));
      this.$emit('update:cartItems', items);
      this.$emit('update:cart-items', items);
    },
    /* ── медиа-утилиты ── */
    isVideo(url) {
      return typeof url === 'string' && /\.(mp4|webm|ogg|m4v|mov|avi|flv)(\?|#|$)/i.test(url);
    },
    getCurrentProductImage(item) {
      return item.image || '';
    },
    isImageLoading(item) {
      return this.imageLoadingStates[item?.id] === true;
    },
    onVideoLoadStart(event, item) {
      if (item?.id && event.target.readyState < 2) {
        this.imageLoadingStates[item.id] = true;
      }
    },
    onVideoLoadedData(event, item) {
      if (item?.id) this.imageLoadingStates[item.id] = false;
    },
    onVideoError(event, item) {
      if (item?.id) this.imageLoadingStates[item.id] = false;
    }
  }
}
</script>

<template>
  <div class="cart-modal" :class="{ 'active': cartOpen }">
    <div class="cart-content" @click.stop>
      <div class="cart-header">
        <h3>Ваша корзина</h3>
        <button class="close-icon" @click="closeCart">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div v-if="localItems.length > 0">
        <div
            class="cart-item"
            v-for="(item, cartIndex) in localItems"
            :key="`${item.id}-${item.optionKey || cartIndex}`"
        >
          <img
              v-if="!isVideo(getCurrentProductImage(item))"
              :src="item.image"
              :alt="item.name"
              class="cart-item-img"
              loading="lazy"
              decoding="async"
          >
          <video
              v-else
              :src="getCurrentProductImage(item)"
              class="cart-item-img"
              :class="{ 'loading': isImageLoading(item) }"
              muted loop playsinline autoplay
              @loadstart="onVideoLoadStart($event, item)"
              @loadeddata="onVideoLoadedData($event, item)"
              @error="onVideoError($event, item)"
          ></video>
          <div class="cart-item-details">
            <h4 class="cart-item-title">{{ item.name }}</h4>
            <template v-if="item.options && item.options.length">
              <p
                  class="cart-item-attr"
                  v-for="option in item.options"
                  :key="`${item.id}-${option.slug}`"
              >
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
        <i class="fas fa-shopping-cart" style="font-size:50px;margin-bottom:20px;"></i>
        <p>Ваша корзина пуста</p>
        <a href="#" class="btn btn-primary" @click="navClick($event, 'products')">
          Перейти к товарам
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cart-modal {
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
  padding: 20px;
  overflow-y: auto;
}
.cart-modal.active {
  right: 0;
}
.cart-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border-light);
}
.cart-item {
  display: flex;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-light);
}
.cart-item-img {
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
.cart-item-details {
  flex: 1;
}
.cart-item-title {
  font-size: 16px;
  margin-bottom: 5px;
}
.cart-item-price {
  background: var(--primary);
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-alt) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
}
.cart-item-actions {
  display: flex;
  align-items: center;
  margin-top: 10px;
}
.cart-item-title-content {
  display: flex;
  flex-direction: row;
}
.cart-item-title-content h5 {
  width: -webkit-fill-available;
}
.cart-item-title-content i {
  margin-left: auto;
}
.cart-item-title-content span {
  cursor: pointer;
}
.checkout-btn {
  width: 100%;
  padding: 15px;
  margin-top: 20px;
  background: var(--primary);
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-alt) 100%);
  color: var(--text-dark);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 44px;
}
.checkout-btn:hover {
  background: transparent;
  border: 1px solid var(--primary);
  color: var(--primary);
}
.empty-cart {
  text-align: center;
  padding: 40px 0;
  color: var(--text-secondary);
}
.quantity-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  width: 30px;
  height: 30px;
  border: 1px solid var(--border-medium);
  border-radius: 50%;
  color: var(--text-primary);
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
  cursor: pointer;
}
.quantity {
  margin: 0 10px;
}
.remove-item {
  margin-left: auto;
  background: none;
  border: none;
  background: var(--primary);
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-alt) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cart-total {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  font-size: 20px;
  font-weight: 600;
}
</style>