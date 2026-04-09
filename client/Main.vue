<script>
import NavBar from "./components/NavBar.vue";
import Hero from "./blocks/Hero.vue";
import {checkUserAuth, getAuth} from "./components/auth";
import {api} from "../server/api";
import {setPageTitle} from "../server/src/utils";

export default {
  name: "App",
  components: {NavBar},
  inject: ['params'],
  async mounted() {
    setPageTitle(this.params.title, 'конструктор сайтов');

    await this.refreshAuth();

    this.loadBlocks().then(() => {
      this.updateBlocks();
    });

    await this.loadContent();

    try {
      const response = await api.getParams();
      if (!response.ok) return;
      this.params = await response.json();
    } catch (e) {
      console.error('Failed to load settings params:', e);
    }
  },
  data() {
    const allComponents = {
      hero: Hero,
    };

    const blockComponents = Object.fromEntries(
        Object.entries(allComponents).filter(([, component]) => !!component)
    );

    return {
      active: false,
      values: { },
      auth: getAuth(),
      blockComponents,
      pageBlocks: [],
      pageBlocksSorted: [],
      content: {
        features: [],
        history: []
      },
      features: [],
    }
  },
  computed: {
    /*filteredBlocks() {
      const blocks = this.values?.sortedPageBlocks ?? this.values?.pageBlocks ?? [];

      if (!Array.isArray(blocks)) {
        return [];
      }

      return blocks.filter(Boolean);
    },
    pageSections() {
      return this.filteredBlocks.filter(block => !["info_buttons", "footer"].includes(block.type));
    }*/
  },
  provide() {
    return {
      params: this.params
      // values: computed(() => this.values)
    }
  },
  methods: {
    close() {
      this.$refs.navBar?.closePanels?.();
      this.active = false;
      this.$emit('close');
    },
    show(value = true) {
      this.active = value;
    },
    async refreshAuth() {
      const me = await checkUserAuth();

      this.auth = (me && me.authenticated === true)
          ? me
          : { authenticated: false, role: null, username: null };
    },
    onLogout() {
      this.auth = { authenticated: false, role: null, username: null };
    },
    getBlockProps(block) {
      return {
        block
      };
    },
    async loadBlocks() {
      try {
        const response = await fetch('/api/page-blocks', { credentials: 'include' });

        if (response.ok) {
          this.pageBlocks = await response.json();
          this.updateBlocks();
        } else {
          this.pageBlocks = [];
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
      const footerBlock = active.filter(b => ['info_buttons', 'footer'].includes(b.type)).sort(byOrder);
      const rest = active.filter(b => !['info_buttons', 'footer'].includes(b.type)).sort(byOrder);

      this.pageBlocksSorted = [...rest, ...footerBlock];
    },
    async loadContent() {
      try {
        const response = await fetch('/api/home-content', { credentials: 'include' });

        if (response.ok) {
          const content = await response.json();

          this.content.features = content
              .filter(item => item.section === 'features')
              .map(item => ({
                icon: '',
                title: item.title,
                description: item.content
              }));

          this.content.history = content
              .filter(item => item.section === 'history')
              .map(item => {
                const parts = item.content.split('\n');
                return {
                  year: item.title,
                  title: parts[0] || '',
                  description: parts.slice(1).join('\n') || item.content
                };
              });

          if (this.content.features.length === 0) {
            this.content.features = this.features;
          }

          if (this.content.history.length === 0) {
            this.content.history = [];
          }

          this.features = this.content.features;
        }
      } catch (e) {
        console.error('content error ', e);
      }
    }
  }
}
</script>

<template>
  <NavBar
      ref="navBar"
      :auth="auth"
      @auth-changed="refreshAuth"
      @logout="onLogout"
      @overlay="show"
  />
<!--  <component
      v-for="(block, blockIndex) in pageSections"
      :key="block?.id ?? 'block-' + blockIndex"
      :is="blockComponents[block.type]"
      v-bind="getBlockProps(block)"
  ></component>-->

  <div class="overlay" :class="{ active: active }" @click="close"></div>
</template>

<style scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
}
.overlay.active {
  opacity: 1;
  visibility: visible;
}
</style>