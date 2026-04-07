<script>
export default {
  name: "NavBar",
  props: {
    logo: {
      type: String,
      default: ''
    },
    page: {
      type: String,
      default: ''
    },
    messages: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:page', 'load-analytics', 'load-orders', 'load-users', 'get-messages'],
  data() {
    return {
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
        await fetch("../api.php", {
          method: 'POST',
          body: form,
          credentials: 'same-origin'
        });
      } catch (e) {
        console.error('Logout error:', e);
      }

      localStorage.removeItem('global_auth');
      this.closeMobileMenu();
      window.location.reload();
    },
    async changePage(page) {
      this.closeMobileMenu();
      // this.showLoader();

      try {
        const handlers = {
          analytics: () => this.$emit('load-analytics'),
          orders:    () => this.$emit('load-orders'),
          users:     () => this.$emit('load-users'),
          messages:  () => this.loadMessages(),
          message:   () => this.loadSingleMessage(),
          'message-reply': () => this.loadSingleMessage(),
        };

        if (handlers[page]) {
          await handlers[page]();
        }
      } catch (e) {
        console.error('changePage error:', e);
      }

      this.$emit('update:page', page);
      this.updateUrl(page);
      // this.hideLoader();
    },
    async loadMessages() {
      this.selectedMessage = null;
      this.$emit('get-messages');
    },
    async loadSingleMessage() {
      const id = new URLSearchParams(location.search).get('id');
      if (!id) return;

      if (!this.messages.length) {
        this.$emit('get-messages');
      }

      this.selectedMessage = this.messages.find(m => m.id === Number(id)) || null;
    },
    updateUrl(page) {
      const url = new URL(location.href);

      if (page) {
        url.searchParams.set('page', page);
      } else {
        url.searchParams.delete('page');
      }

      if (this.selectedMessage?.id && page.includes('message')) {
        url.searchParams.set('id', this.selectedMessage.id);
      } else {
        url.searchParams.delete('id');
      }

      history.pushState({}, '', url);
      window.scrollTo(0, 0);
    },
    showLoader() {
      this.$refs.loader.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    },
    hideLoader() {
      setTimeout(() => {
        this.$refs.loader.style.display = 'none';
        document.body.style.overflow = 'auto';
      }, 500);
    }
  }
}
</script>

<template>
  <header>
    <div class="admin-header container">
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
          <button @click="changePage('')" class="btn btn-secondary" title="Управление">
            <i class="fa-solid fa-house"></i>
          </button>
          <button @click="changePage('options')" class="btn btn-secondary" title="Опции товаров">
            <i class="fa-solid fa-sliders"></i>
          </button>
          <button @click="changePage('orders')" class="btn btn-secondary" title="Заказы">
            <i class="fa-solid fa-indent"></i>
          </button>
          <button @click="changePage('analytics')" class="btn btn-secondary" title="Аналитика">
            <i class="fas fa-chart-line"></i>
          </button>
          <button @click="changePage('messages')" class="btn btn-secondary" title="Сообщения">
            <i class="fa-solid fa-envelope-open"></i>
          </button>
          <button @click="changePage('profile')" class="btn btn-secondary" title="Профиль">
            <i class="fas fa-user"></i>
          </button>
          <button @click="changePage('users')" class="btn btn-secondary" title="Пользователи">
            <i class="fa-solid fa-users"></i>
          </button>
          <button @click="changePage('settings')" class="btn btn-secondary" title="Настройки">
            <i class="fa-solid fa-cog"></i>
          </button>
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
</template>

<style scoped>
</style>