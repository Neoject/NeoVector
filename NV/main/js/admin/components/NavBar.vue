<script>
export default {
  name: "NavBar",
  props: {
    logo: String,
    loadAnalytics: Function,
    loadOrders: Function,
    loadUsers: Function,
    getMessages: Function,
    messages: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      page: '',
      mobileMenuOpen: false,
      selectedMessage: null,
    }
  },
  methods: {
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen;
    },
    closeMobileMenu() {
      this.mobileMenuOpen = false;
    },
    async logout() {
      if (!confirm('Выйти?')) return;

      try {
        const form = new FormData();
        form.append('action', 'logout');
        await fetch("../api.php", { method: 'POST', body: form, credentials: 'same-origin' });
      } catch (e) {
        console.log('Logout error:', e);
      }

      localStorage.removeItem('global_auth');

      this.closeMobileMenu();

      window.location.reload();
    },
    async changePage(page) {
      this.page = page;
      this.closeMobileMenu();

      this.showLoader();

      const handlers = {
        analytics: this.loadAnalytics,
        orders: this.loadOrders,
        users: this.loadUsers,
        messages: this.loadMessages,
        message: this.loadSingleMessage,
        'message-reply': this.loadSingleMessage
      };

      if (handlers[page]) {
        await handlers[page]();
      }

      this.updateUrl(page);
      this.hideLoader();
    },
    async loadMessages() {
      this.selectedMessage = null;
      await this.getMessages();
    },
    async loadSingleMessage() {
      const id = new URLSearchParams(location.search).get('id');
      if (!id) return;

      if (!this.messages.length) {
        await this.getMessages();
      }

      this.selectedMessage = this.messages.find(m => m.id === Number(id)) || null;
    },
    updateUrl(page) {
      const url = new URL(location.href);
      const id = this.selectedMessage?.id;

      url.searchParams.set('page', page);

      if (id && page.includes('message')) {
        url.searchParams.set('id', id);
      } else {
        url.searchParams.delete('id');
      }

      history.pushState({}, '', url);
      window.scrollTo(0, 0);
    },
    showLoader() {
      const loader = document.getElementById('block_loader');
      if (loader) loader.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    },
    hideLoader() {
      setTimeout(() => {
        const loader = document.getElementById('block_loader');
        if (loader) loader.style.display = 'none';
        document.body.style.overflow = 'auto';
      }, 500);
    }
  }
}
</script>

<template>
  <header class="header scrolled">
    <div class="admin-header container">
      <div class="admin-header-content">
        <div class="admin-header-left">
          <button class="mobile-menu-btn" @click="toggleMobileMenu">
            <i class="fas fa-bars"></i>
          </button>
          <a class="logo logo-admin" href="/">
            <img :src="logo" alt="Логотип" style="max-height: 64px; background: src('/assets/logo/logo_69bbe34818bc2.png')" />
          </a>
        </div>
        <div class="admin-actions">
          <button @click="changePage('admin')" class="btn btn-secondary" title="Управление">
            <i class="fa-solid fa-house"></i>
          </button>
          <button @click="changePage('users')" class="btn btn-secondary"
                  title="Управление пользователями">
            <i class="fa-solid fa-users"></i>
          </button>
          <button @click="changePage('orders')" class="btn btn-secondary" title="Заказы">
            <i class="fa-solid fa-indent"></i>
          </button>
          <button @click="changePage('analytics')" class="btn btn-secondary" title="Аналитика">
            <i class="fas fa-chart-line"></i>
          </button>
          <button @click="changePage('options')" class="btn btn-secondary" title="Опции товаров">
            <i class="fa-solid fa-sliders"></i>
          </button>
          <button @click="changePage('messages')" class="btn btn-secondary" title="Сообщения">
            <i class="fa-solid fa-envelope-open"></i>
          </button>
          <button @click="changePage('profile')" class="btn btn-secondary" title="Профиль">
            <i class="fas fa-user"></i>
          </button>
          <button @click="changePage('settings')" class="btn btn-secondary"
                  title="Дополнительные параметры">
            <i class="fa-solid fa-cog"></i>
          </button>
          <button type="button" @click="logout" class="btn btn-secondary" title="Выйти">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </div>
    <div class="header-bottom"></div>
  </header>
</template>

<style scoped>

</style>