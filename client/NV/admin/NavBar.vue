<script>
import {api} from "../../../server/api";
import {setPageTitle} from "../../../server/src/utils";

export default {
  name: "NavBar",
  inject: ['params'],
  emits: ['hide-loader'],
  props: {
    logo: {
      type: String,
      default: ''
    },
  },
  data() {
    return {
      mobileMenuOpen: false,
    }
  },
  methods: {
    setPageTitle,
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen;
    },
    closeMobileMenu() {
      this.mobileMenuOpen = false;
    },
    async logout() {
      if (!confirm('Выйти?')) return;

      try {
        await api.logout();
      } catch (e) {
        console.error('Logout error:', e);
      }

      localStorage.removeItem('global_auth');
      this.closeMobileMenu();
      window.location.reload();
    },
  }
}
</script>

<template>
  <header>
    <div class="admin-header nav-container">
      <div class="admin-header-content">
        <div class="admin-header-left">
          <button class="mobile-menu-btn" @click="toggleMobileMenu">
            <i class="fas fa-bars"></i>
          </button>
          <a class="logo logo-admin" href="/">
            <img v-if="logo" :src="logo" alt="Логотип" style="max-height: 64px;" />
          </a>
        </div>
        <div class="admin-actions">
          <router-link to="/admin" class="btn btn-secondary" title="Управление" @click="setPageTitle(params.title, 'управление товарами')">
            <i class="fa-solid fa-house"></i>
          </router-link>
          <router-link to="/admin/options" class="btn btn-secondary" title="Опции товаров" @click="setPageTitle(params.title, 'типы и опции товаров')">
            <i class="fa-solid fa-sliders"></i>
          </router-link>
          <router-link to="/admin/orders" class="btn btn-secondary" title="Заказы" @click="setPageTitle(params.title, 'заказы')">
            <i class="fa-solid fa-indent"></i>
          </router-link>
          <router-link to="/admin/analytics" class="btn btn-secondary" title="Аналитика" @click="setPageTitle(params.title, 'аналитика')">
            <i class="fas fa-chart-line"></i>
          </router-link>
          <router-link to="/admin/messages" class="btn btn-secondary" title="Сообщения" @click="setPageTitle(params.title, 'сообщения')">
            <i class="fa-solid fa-envelope-open"></i>
          </router-link>
          <router-link to="/admin/profile" class="btn btn-secondary" title="Профиль" @click="setPageTitle(params.title, 'профиль')">
            <i class="fas fa-user"></i>
          </router-link>
          <router-link to="/admin/users" class="btn btn-secondary" title="Пользователи" @click="setPageTitle(params.title, 'пользователи')">
            <i class="fa-solid fa-users"></i>
          </router-link>
          <router-link to="/admin/settings" class="btn btn-secondary" title="Настройки" @click="setPageTitle(params.title, 'настройки')">
            <i class="fa-solid fa-cog"></i>
          </router-link>
          <button type="button" @click="logout" class="btn btn-secondary" title="Выйти">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </div>
    <div class="header-bottom"></div>
    <div ref="loader" class="block_loader" id="block_loader">
      <div class="loader"></div>
    </div>
  </header>
  <Teleport to="body">
    <div v-if="mobileMenuOpen" class="mobile-menu-backdrop" @click="closeMobileMenu"></div>
    <div :class="['mobile-admin-menu', { active: mobileMenuOpen }]">
      <button class="mobile-menu-close" @click="closeMobileMenu">
        <i class="fas fa-times"></i>
      </button>
      <nav class="mobile-admin-nav">
        <router-link to="/admin" class="mobile-admin-link" active-class="" exact-active-class="mobile-admin-link--active" @click="closeMobileMenu">
          <i class="fa-solid fa-house"></i> Главная
        </router-link>
        <router-link to="/admin/orders" class="mobile-admin-link" active-class="mobile-admin-link--active" @click="closeMobileMenu">
          <i class="fa-solid fa-indent"></i> Заказы
        </router-link>
        <router-link to="/admin/analytics" class="mobile-admin-link" active-class="mobile-admin-link--active" @click="closeMobileMenu">
          <i class="fas fa-chart-line"></i> Аналитика
        </router-link>
        <router-link to="/admin/messages" class="mobile-admin-link" active-class="mobile-admin-link--active" @click="closeMobileMenu">
          <i class="fa-solid fa-envelope-open"></i> Сообщения
        </router-link>
        <router-link to="/admin/options" class="mobile-admin-link" active-class="mobile-admin-link--active" @click="closeMobileMenu">
          <i class="fa-solid fa-sliders"></i> Опции товаров
        </router-link>
        <router-link to="/admin/users" class="mobile-admin-link" active-class="mobile-admin-link--active" @click="closeMobileMenu">
          <i class="fa-solid fa-users"></i> Пользователи
        </router-link>
        <router-link to="/admin/settings" class="mobile-admin-link" active-class="mobile-admin-link--active" @click="closeMobileMenu">
          <i class="fa-solid fa-cog"></i> Настройки
        </router-link>
        <router-link to="/admin/profile" class="mobile-admin-link" active-class="mobile-admin-link--active" @click="closeMobileMenu">
          <i class="fas fa-user"></i> Профиль
        </router-link>
        <button type="button" class="mobile-admin-link mobile-admin-logout" @click="logout">
          <i class="fas fa-sign-out-alt"></i> Выйти
        </button>
      </nav>
    </div>
  </Teleport>
</template>

<style scoped>
.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  margin-right: 8px;
}
@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
