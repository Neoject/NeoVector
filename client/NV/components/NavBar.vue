<script>
import WishList from "./WishList.vue";
import Auth from "./AuthModals.vue";
import {logout} from "./auth";

export default {
  name: "NavBar",
  components: { Auth, WishList },
  inject: ['params'],
  props: {
    auth: { type: Object, default: () => ({ authenticated: false, role: null, username: null }) },
    products: { type: Array, default: [] },
    wishlist: { type: Array, default: () => [] },
    cartItems: { type: Array, default: () => [] },
    isMainPage: { type: Boolean, default: true },
    navigationButtons: { type: Array, default: () => [] },
    currentVirtualPage: { type: Object, default: null }
  },
  emits: [
    'toggle-cart', 'close-cart', 'toggle-favorites', 'nav-click', 'go-home',
    'logout', 'auth-changed',
    'update:cartItems', 'update:wishlist',
    'add-to-cart', 'overlay'
  ],
  data() {
    return {
      mobileMenuOpen: false,
      userMenuOpen: false,
      favoritesOpen: false
    }
  },
  computed: {
    cartItemsCount() {
      return (Array.isArray(this.cartItems) ? this.cartItems : []).reduce((sum, item) => sum + (item.quantity || 0), 0);
    },
    wishlistCount() {
      return this.wishlist.length;
    },
    logo() {
      return this.params.logo;
    },
    showCartParam() {
      return this.paramTruthy(this.params?.show_cart);
    },
    showWishListParam() {
      return this.paramTruthy(this.params?.show_wish_list);
    },
    showUserMenuParam() {
      return !this.paramTruthy(this.params?.admin_only) || this.auth?.role === 'admin';
    },
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
    paramTruthy(val) {
      if (val === true || val === 1) return true;
      if (val === false || val === 0) return false;
      const s = String(val == null ? '' : val).trim().toLowerCase();
      return s === 'true' || s === '1' || s === 'yes' || s === 'on';
    },
    logout,
    closePanels() {
      this.favoritesOpen = false;
      this.$emit('close-cart');
      this.$emit('overlay', false);
    },
    normalizeMediaUrl(url) {
      if (!url) return '';

      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
        return url;
      }

      const basePath = this.getBasePath ? this.getBasePath() : '/';
      return basePath + url;
    },
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen;
      },
    closeMobileMenu() {
      this.mobileMenuOpen = false;
      },
    overlay() {
      this.$emit('overlay', this.favoritesOpen);
    },
    onToggleCart() {
      const toggle = () => {
        this.favoritesOpen = false;
        this.overlay();
        this.$emit('toggle-cart');
      };

      if (this.mobileMenuOpen) {
        this.mobileMenuOpen = false;
        setTimeout(toggle, 300);
      } else toggle();
    },
    onToggleFavorites() {
      const toggle = () => {
        this.favoritesOpen = !this.favoritesOpen;
        if (this.favoritesOpen) this.$emit('close-cart');
        this.overlay();
        this.$emit('toggle-favorites');
      };

      if (this.mobileMenuOpen) {
        this.mobileMenuOpen = false;
        setTimeout(toggle, 300);
      } else toggle();
    },
    onWishlistUpdated(items) {
      this.$emit('update:wishlist', Array.isArray(items) ? [...items] : []);
    },
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
    onScroll() {
      if (this.userMenuOpen) this.positionUserMenu();
      },
    onResize() {
      if (this.userMenuOpen) this.positionUserMenu();
      },
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
  <header ref="navBarHeader">
    <div class="container nav-container">
      <div class="nav-left">
        <button class="mobile-menu-btn" @click="toggleMobileMenu">
          <i class="fas fa-bars"></i>
        </button>
        <a class="logo" href="/">
          <img :src="logo" alt="" style="max-height:64px;max-width:100%" />
        </a>
        <div v-if="showCartParam" class="mobile-cart-icon" @click="onToggleCart">
          <i class="fas fa-shopping-cart"></i>
          <span class="cart-count" v-if="cartItems.length > 0">{{ cartItemsCount }}</span>
        </div>
        <div v-if="showWishListParam" class="mobile-favorites-icon" @click="onToggleFavorites">
          <i class="fas fa-heart"></i>
          <span class="cart-count" v-if="wishlist.length > 0">{{ wishlistCount }}</span>
        </div>
      </div>
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
          <a href="/" class="btn btn-outline" style="width:auto;">
            На главную
          </a>
        </template>
        <div v-if="showCartParam" class="cart-icon" @click="onToggleCart">
          <i class="fas fa-shopping-cart"></i>
          <span class="cart-count" v-if="cartItems.length > 0">{{ cartItemsCount }}</span>
        </div>
        <div v-if="showWishListParam" class="favorites-icon" @click="onToggleFavorites">
          <i class="fas fa-heart"></i>
          <span class="cart-count" v-if="wishlist.length > 0">{{ wishlistCount }}</span>
        </div>
        <div v-if="showUserMenuParam" class="user-menu" @click="toggleUserMenu">
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
                   href="/admin"
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
  </header>
  <WishList
      :favorites-open="favoritesOpen"
      :wishlist="wishlist"
      :products="products"
      :cart-items="cartItems"
      @close="favoritesOpen = false; $emit('overlay', false)"
      @update:wishlist="onWishlistUpdated"
      @add-to-cart="$emit('add-to-cart', $event)"
      @nav-click="$emit('nav-click', $event)"
  />
  <Auth ref="authModal" />
</template>

<style scoped>
header {
  box-shadow: 0 0 8px 1px var(--shadow-header);
}
header .nav-container {
  flex-direction: row;
  gap: 20vw;
}
.user-menu {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 20px;
  background: var(--background-secondary);
  border: 1px solid var(--border-light);
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
  z-index: 2001;
}
.user-menu:hover {
  background: var(--background-secondary);
  border-color: var(--border-medium);
}
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--background-additional);
  border: var(--border-medium);
  color: var(--header-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
.user-name {
  color: var(--header-secondary);
  font-weight: 500;
  font-size: 14px;
}
.user-menu i.fa-chevron-down {
  font-size: 12px;
  transition: transform 0.3s ease;
}
.user-menu i.fa-chevron-down.rotated {
  transform: rotate(180deg);
}
.user-menu-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: auto;
  background: var(--background-secondary);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 12px;
  border: 1px solid var(--border-light);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  min-width: 250px;
  z-index: 2000;
  overflow: hidden;
  white-space: nowrap;
  pointer-events: auto;
  filter: none !important;
  -webkit-filter: none !important;
  isolation: isolate;
  transform: none;
  color: var(--header-secondary);
}
.user-menu-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-light);
}
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-avatar-large {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--background-additional);
  border: var(--border-light);
  color: var(--header-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.user-details {
  flex: 1;
}
.user-name-large {
  color: var(--header-secondary);
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
}
.user-role {
  color: var(--text-additional);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.user-menu-items {
  padding: 8px 0;
}
.user-menu-item {
  display: flex;
  align-items: center;
  place-content: unset !important;
  gap: 12px;
  padding: 12px 20px;
  color: var(--header-secondary);
  text-decoration: none;
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
}
.user-menu-item:hover {
  background: var(--background-secondary);
  color: var(--header-secondary);
}
.user-menu-item i {
  width: 16px;
  text-align: center;
  font-size: 14px;
}
.user-menu-item.admin-item {
  color: var(--header-secondary);
}
.user-menu-item.admin-item:hover {
  background: var(--background-secondary);
  color: var(--header-secondary);
}
.user-menu-item.logout-item {
  color: var(--header-secondary);
}
.user-menu-item.logout-item:hover {
  background: var(--background-secondary);
  color: var(--header-secondary);
}
.user-menu-mobile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 15px 0;
  color: var(--header-secondary);
  cursor: pointer;
  border-bottom: 1px solid var(--border-light);
}
.user-menu-mobile:hover {
  color: var(--header-secondary);
}
</style>