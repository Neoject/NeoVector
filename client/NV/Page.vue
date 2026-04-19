<script>
import NavBar from "./components/NavBar.vue";
import { api } from "../../server/api";
import { setPageTitle } from "../../server/src/utils";
import { checkUserAuth, getAuth } from "./components/auth";

export default {
  name: "Page",
  components: { NavBar },
  inject: ['params'],
  data() {
    return {
      page: null,
      loading: true,
      notFound: false,
      auth: getAuth(),
    };
  },
  watch: {
    '$route.params.slug': {
      immediate: false,
      handler() {
        this.loadPage();
      }
    }
  },
  async mounted() {
    await this.refreshAuth();
    await this.loadPage();
  },
  methods: {
    async refreshAuth() {
      const me = await checkUserAuth();
      this.auth = (me && me.authenticated === true)
          ? me
          : { authenticated: false, role: null, username: null };
    },
    async loadPage() {
      this.loading = true;
      this.notFound = false;
      this.page = null;

      const slug = this.$route.params.slug;

      try {
        const r = await api.getPageBySlug(slug);
        if (r.status === 404) {
          this.notFound = true;
          return;
        }
        if (!r.ok) {
          this.notFound = true;
          return;
        }
        const page = await r.json();
        if (!page || page.error) {
          this.notFound = true;
          return;
        }
        this.page = {
          ...page,
          navigation_buttons: Array.isArray(page.navigation_buttons)
              ? page.navigation_buttons
              : (typeof page.navigation_buttons === 'string'
                  ? JSON.parse(page.navigation_buttons || '[]')
                  : []),
        };
        setPageTitle(page.meta_title || page.title, this.params?.main_title);
      } catch (e) {
        console.error(e);
        this.notFound = true;
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<template>
  <NavBar
      :auth="auth"
      :is-main-page="false"
      :navigation-buttons="page?.navigation_buttons || []"
      :current-virtual-page="page"
  />
  <main class="virtual-page-main">
    <div v-if="loading" class="page-loading">
      <i class="fas fa-spinner fa-spin"></i>
    </div>
    <div v-else-if="notFound" class="page-not-found">
      <h1>404</h1>
      <p>Страница не найдена</p>
      <a href="/" class="btn btn-primary">На главную</a>
    </div>
    <article v-else-if="page" class="page-content container">
      <h1 v-if="page.title" class="page-title">{{ page.title }}</h1>
      <div class="page-body" v-html="page.content"></div>
    </article>
  </main>
</template>

<style scoped>
.virtual-page-main {
  min-height: 100vh;
  padding-top: 100px;
}

.page-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  font-size: 32px;
  color: var(--primary);
}

.page-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  gap: 16px;
}

.page-not-found h1 {
  font-size: 96px;
  color: var(--primary);
  line-height: 1;
}

.page-not-found p {
  font-size: 20px;
  color: var(--text-additional);
}

.page-content {
  padding-top: 40px;
  padding-bottom: 60px;
}

.page-title {
  font-size: 40px;
  margin-bottom: 32px;
  color: var(--primary);
}

.page-body {
  line-height: 1.7;
  font-size: 16px;
  color: var(--text-primary);
}

.page-body h1, .page-body h2, .page-body h3,
.page-body h4, .page-body h5, .page-body h6 {
  color: var(--primary);
  margin: 24px 0 12px;
}

.page-body p { margin: 12px 0; }
.page-body img { max-width: 100%; border-radius: 8px; margin: 12px 0; }
.page-body ul, .page-body ol { padding-left: 24px; margin: 12px 0; }
.page-body li { margin: 6px 0; }
.page-body hr { border: none; border-top: 1px solid var(--border-light); margin: 24px 0; }
.page-body a { color: var(--primary); text-decoration: underline; }
</style>
