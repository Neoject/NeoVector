<script>
import NavBar from "./components/NavBar.vue";
import Hero from "./components/Hero.vue";
import {checkUserAuth, getAuth} from "./components/auth";
import {computed} from "vue";

export default {
  name: "App",
  components: {NavBar},
  async mounted() {
    const el = document.getElementById('data');

    if (el) {
      try {
        this.values = JSON.parse(el.textContent);
      } catch (e) {
        console.error('Failed to parse credits-data:', e);
      }

      el.remove();
    }

    await this.refreshAuth();
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
      blockComponents
    }
  },
  computed: {
    filteredBlocks() {
      const blocks = this.values?.sortedPageBlocks ?? this.values?.pageBlocks ?? [];

      if (!Array.isArray(blocks)) {
        return [];
      }

      return blocks.filter(Boolean);
    },
    pageSections() {
      return this.filteredBlocks.filter(block => !["info_buttons", "footer"].includes(block.type));
    }
  },
  provide() {
    return {
      values: computed(() => this.values)
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
  <component
      v-for="(block, blockIndex) in pageSections"
      :key="block?.id ?? 'block-' + blockIndex"
      :is="blockComponents[block.type]"
      v-bind="getBlockProps(block)"
  ></component>

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