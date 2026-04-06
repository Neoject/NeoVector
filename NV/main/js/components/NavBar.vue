<script>
import Cart from "./Cart.vue";
import WishList from "./WishList.vue";
import Auth from "./AuthModals.vue";
import {logout} from "./auth";

export default {
  name: "NavBar",
  components: { Auth, Cart, WishList },
  inject: ['values'],
  props: {
    cartItems: { type: Array, default: () => [] },
    wishlist: { type: Array, default: () => [] },
    auth: { type: Object, default: () => ({ authenticated: false, role: null, username: null }) },
    isMainPage: { type: Boolean, default: true },
    navigationButtons: { type: Array, default: () => [] },
    currentVirtualPage: { type: Object, default: null }
  },
  emits: [
    'toggle-cart', 'toggle-favorites', 'nav-click', 'go-home',
    'logout', 'auth-changed',
    'update:cartItems', 'update:wishlist',
    'open-order', 'add-to-cart', 'overlay'
  ],
  data() {
    return {
      mobileMenuOpen: false,
      userMenuOpen: false,
      cartOpen: false,
      favoritesOpen: false
    }
  },
  computed: {
    cartItemsCount() {
      return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    },
    wishlistCount() {
      return this.wishlist.length;
    }
  },
  mounted() {
    window.addEventListener('scroll', this.onScroll);
    window.addEventListener('resize', this.onResize);
    document.addEventListener('click', this.onDocumentClick);
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('click', this.onDocumentClick);
  },
  methods: {
    logout,
    closePanels() {
      this.cartOpen = false;
      this.favoritesOpen = false;
      this.$emit('overlay', false);
    },
    /* ── мобильное меню ── */
    toggleMobileMenu() { this.mobileMenuOpen = !this.mobileMenuOpen; },
    closeMobileMenu() { this.mobileMenuOpen = false; },

    /* ── корзина / избранное ── */
    overlay() {
      this.$emit('overlay', this.cartOpen || this.favoritesOpen);
    },
    onToggleCart() {
      if (this.mobileMenuOpen) {
        this.mobileMenuOpen = false;
        setTimeout(() => {
          this.cartOpen = !this.cartOpen;
          if (this.cartOpen) {
            this.favoritesOpen = false;
          }
          this.overlay();
          this.$emit('toggle-cart');
        }, 300);
      } else {
        this.cartOpen = !this.cartOpen;
        if (this.cartOpen) {
          this.favoritesOpen = false;
        }
        this.overlay();
        this.$emit('toggle-cart');
      }
    },
    onToggleFavorites() {
      if (this.mobileMenuOpen) {
        this.mobileMenuOpen = false;
        setTimeout(() => {
          this.favoritesOpen = !this.favoritesOpen;
          if (this.favoritesOpen) {
            this.cartOpen = false;
          }
          this.overlay();
          this.$emit('toggle-favorites');
        }, 300);
      } else {
        this.favoritesOpen = !this.favoritesOpen;
        if (this.favoritesOpen) {
          this.cartOpen = false;
        }
        this.overlay();
        this.$emit('toggle-favorites');
      }
    },

    /* ── навигация ── */
    navClick(event, target) {
      event.preventDefault();
      this.closeMobileMenu();
      this.userMenuOpen = false;
      this.$emit('nav-click', event, target);
    },
    goHome() {
      this.closeMobileMenu();
      this.userMenuOpen = false;
      this.$emit('go-home', { updateHistory: true, scrollToTop: true });
    },

    /* ── меню пользователя ── */
    toggleUserMenu() {
      this.userMenuOpen = !this.userMenuOpen;

      if (this.userMenuOpen) {
        this.$nextTick(() => {
          this.$nextTick(() => this.positionUserMenu());
        });
      }
    },
    navBarRoot() {
      return this.$refs.navBarHeader || this.$el;
    },
    positionUserMenu() {
      const root = this.navBarRoot();
      if (!root || !root.querySelector) return;
      const trigger = root.querySelector('.user-menu');
      const popup = root.querySelector('.user-menu-popup');
      if (!trigger || !popup) return;

      const rect = trigger.getBoundingClientRect();
      const gap = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const pad = 8;

      popup.style.transform = 'none';
      const pw = popup.offsetWidth || 250;
      const ph = popup.offsetHeight || 200;

      let top = rect.bottom + gap;
      if (top + ph > vh - pad && rect.top > ph + gap) {
        top = rect.top - ph - gap;
      }

      top = Math.max(pad, Math.min(top, vh - ph - pad));

      let left;
      if (vw <= 768) {
        left = rect.left + rect.width / 2 - pw / 2;
      } else {
        left = rect.right - pw;
      }

      left = Math.max(pad, Math.min(left, vw - pw - pad));

      Object.assign(popup.style, {
        top: `${Math.round(top)}px`,
        left: `${Math.round(left)}px`,
        right: 'auto',
        transform: 'none'
      });
    },
    onScroll() { if (this.userMenuOpen) this.positionUserMenu(); },
    onResize() { if (this.userMenuOpen) this.positionUserMenu(); },
    onDocumentClick(e) {
      const root = this.navBarRoot();
      const userMenu = root?.querySelector?.('.user-menu');

      if (this.userMenuOpen && userMenu && !userMenu.contains(e.target)) {
        this.userMenuOpen = false;
      }
    },
    openLogin() {
      this.userMenuOpen = false;
      this.closeMobileMenu();
      this.$refs.authModal?.openLogin();
    },
    openRegister() {
      this.userMenuOpen = false;
      this.closeMobileMenu();
      this.$refs.authModal?.openRegister();
    }
  }
}
</script>

<template>
  <header ref="navBarHeader" class="scrolled">
    <div class="container nav-container">
      <!-- Левая часть -->
      <div class="nav-left">
        <button class="mobile-menu-btn" @click="toggleMobileMenu">
          <i class="fas fa-bars"></i>
        </button>
        <a class="logo" href="../">
          <img :src="values.logo" alt="" style="max-height:64px;max-width:100%" />
        </a>
        <div class="mobile-cart-icon" @click="onToggleCart">
          <i class="fas fa-shopping-cart"></i>
          <span class="cart-count" v-if="cartItems.length > 0">{{ cartItemsCount }}</span>
        </div>
        <div class="mobile-favorites-icon" @click="onToggleFavorites">
          <i class="fas fa-heart"></i>
          <span class="cart-count" v-if="wishlist.length > 0">{{ wishlistCount }}</span>
        </div>
      </div>

      <!-- Навигация -->
      <nav class="nav-links" :key="'nav-' + (currentVirtualPage ? currentVirtualPage.slug : 'main')">
        <template v-if="isMainPage">
          <a
              v-for="(button, index) in navigationButtons"
              :key="'nav-' + index"
              href="#"
              @click="navClick($event, button.target)"
          >{{ button.label }}</a>
        </template>
        <template v-else>
          <a href="#" class="btn btn-outline" style="width:auto;" @click.prevent="goHome">
            На главную
          </a>
        </template>
        <!-- Корзина (десктоп) -->
        <div v-if="values['show_cart']" class="cart-icon" @click="onToggleCart">
          <i class="fas fa-shopping-cart"></i>
          <span class="cart-count" v-if="cartItems.length > 0">{{ cartItemsCount }}</span>
        </div>
        <!-- Избранное (десктоп) -->
        <div v-if="values['show_wish_list']" class="favorites-icon" @click="onToggleFavorites">
          <i class="fas fa-heart"></i>
          <span class="cart-count" v-if="wishlist.length > 0">{{ wishlistCount }}</span>
        </div>
        <!-- Меню пользователя -->
        <div v-if="!values['admin_only']" class="user-menu" @click="toggleUserMenu">
          <div class="user-avatar"><i class="fas fa-user"></i></div>
          <span class="user-name">{{ auth.username || 'Профиль' }}</span>
          <i class="fas fa-chevron-down" :class="{ rotated: userMenuOpen }"></i>
          <div v-if="userMenuOpen" class="user-menu-popup" @click.stop>
            <template v-if="auth.authenticated">
              <div class="user-menu-header">
                <div class="user-info">
                  <div class="user-avatar-large"><i class="fas fa-user"></i></div>
                  <div class="user-details">
                    <div class="user-name-large">{{ auth.username }}</div>
                    <div class="user-role">
                      {{ auth.role === 'admin' ? 'Администратор' : 'Клиент' }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="user-menu-items">
                <a v-if="auth.role === 'admin'"
                   href="admin/?page=admin"
                   class="user-menu-item admin-item"
                >
                <i class="fas fa-cog"></i><span>Администрирование</span>
                </a>
                <a href="#" @click.prevent="logout" class="user-menu-item logout-item">
                  <i class="fas fa-sign-out-alt"></i><span>Выйти</span>
                </a>
              </div>
            </template>
            <template v-else>
              <!-- ↓ теперь оба метода определены и делегируют в $refs.authModal -->
              <a href="#" @click.prevent="openLogin" class="user-menu-item">
                <i class="fas fa-sign-in-alt"></i><span>Войти</span>
              </a>
              <a href="#" @click.prevent="openRegister" class="user-menu-item">
                <i class="fas fa-user-plus"></i><span>Регистрация</span>
              </a>
            </template>
          </div>
        </div>
      </nav>
    </div>
    <div class="header-bottom"></div>
  </header>
  <Cart
      :cart-open="cartOpen"
      :cart-items="cartItems"
      @close="cartOpen = false; $emit('overlay', false)"
      @update:cart-items="$emit('update:cartItems', $event)"
      @open-order="$emit('open-order')"
      @nav-click="$emit('nav-click', $event)"
  />
  <WishList
      :favorites-open="favoritesOpen"
      :wishlist="wishlist"
      :products="[]"
      :cart-items="cartItems"
      @close="favoritesOpen = false; $emit('overlay', false)"
      @update:wishlist="$emit('update:wishlist', $event)"
      @add-to-cart="$emit('add-to-cart', $event)"
      @nav-click="$emit('nav-click', $event)"
  />
  <Auth ref="authModal" />
</template>

<style scoped>

</style>