<script>
import { markRaw } from 'vue';
import NavBar from "./components/NavBar.vue";
import { api } from "../../server/api";
import { setPageTitle } from "../../server/src/utils";
import { checkUserAuth, getAuth } from "./components/auth";

const blockModules = import.meta.glob('./blocks/*.vue', { eager: true });
const blockComponents = {};
Object.entries(blockModules).forEach(([path, module]) => {
  const name = path.split('/').pop().replace('.vue', '').toLowerCase();
  blockComponents[name] = markRaw(module.default || module);
});

const allPageModules = import.meta.glob('../*/*.vue', { eager: true });

export default {
  name: "Page",
  components: { NavBar },
  emits: ['toggle-theme'],
  inject: ['params'],
  data() {
    return {
      page: null,
      loading: true,
      notFound: false,
      auth: getAuth(),
      pageBlocks: [],
      pageBlocksSorted: [],
      blockComponents: markRaw(blockComponents),
      pageComponents: markRaw({}),
    };
  },
  computed: {
    hasBlocks() {
      return this.pageBlocksSorted.length > 0;
    },
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
    loadPageComponents(slug) {
      const components = {};
      Object.entries(allPageModules).forEach(([path, module]) => {
        const parts = path.split('/');
        const folder = parts[parts.length - 2];
        if (folder === slug) {
          const name = parts[parts.length - 1].replace('.vue', '').toLowerCase();
          components[name] = markRaw(module.default || module);
        }
      });
      this.pageComponents = markRaw(components);
    },
    async loadBlocks(pageId) {
      try {
        const r = await api.getPageBlocks(pageId);
        if (r.ok) {
          this.pageBlocks = await r.json();
          this.updateBlocks();
        }
      } catch (e) {
        console.error('blocks error', e);
      }
    },
    updateBlocks() {
      if (!Array.isArray(this.pageBlocks)) {
        this.pageBlocksSorted = [];
        return;
      }
      const active = this.pageBlocks.filter(b => b.is_active);
      const byOrder = (a, b) => (a.sort_order || 0) - (b.sort_order || 0);
      const footerBlocks = active.filter(b => ['info_buttons', 'footer'].includes(b.type)).sort(byOrder);
      const rest = active.filter(b => !['info_buttons', 'footer'].includes(b.type)).sort(byOrder);
      this.pageBlocksSorted = [...rest, ...footerBlocks];
    },
    resolveBlockComponent(block) {
      if (block.type === 'custom_component') {
        return this.pageComponents[block.title.toLowerCase()] || null;
      }
      return this.blockComponents[block.type] || null;
    },
    getBlockProps(block) {
      return { block, isInView: () => false };
    },
    async loadPage() {
      this.loading = true;
      this.notFound = false;
      this.page = null;
      this.pageBlocks = [];
      this.pageBlocksSorted = [];

      const slug = this.$route.params.slug;

      try {
        const r = await api.getPageBySlug(slug);
        if (r.status === 404) { this.notFound = true; return; }
        if (!r.ok)            { this.notFound = true; return; }

        const page = await r.json();
        if (!page || page.error) { this.notFound = true; return; }

        this.page = {
          ...page,
          navigation_buttons: Array.isArray(page.navigation_buttons)
              ? page.navigation_buttons
              : (typeof page.navigation_buttons === 'string'
                  ? JSON.parse(page.navigation_buttons || '[]')
                  : []),
        };
        setPageTitle(page.meta_title || page.title, this.params?.main_title);

        // загружаем компоненты и блоки параллельно
        this.loadPageComponents(slug);
        await this.loadBlocks(page.id);
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
      @toggle-theme="$emit('toggle-theme')"
  />
  <main>
    <div v-if="loading" class="page-loading">
      <i class="fas fa-spinner fa-spin"></i>
    </div>
    <div v-else-if="notFound" class="page-not-found">
      <h1>404</h1>
      <p>Страница не найдена</p>
      <a href="/" class="btn btn-primary">На главную</a>
    </div>
    <template v-else-if="page">
      <template
          v-for="(block, blockIndex) in pageBlocksSorted"
          :key="(block && block.id) ? block.id : 'block-' + blockIndex"
      >
        <component
            v-if="resolveBlockComponent(block)"
            :is="resolveBlockComponent(block)"
            v-bind="block.type !== 'custom_component' ? getBlockProps(block) : {}"
        />
      </template>
    </template>
  </main>
</template>

<style scoped>
main {
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
