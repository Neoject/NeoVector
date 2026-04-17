<script>
import { markRaw } from 'vue';
import NavBar from "./components/NavBar.vue";
import Hero from "./blocks/Hero.vue";
import Products from "./blocks/Products.vue";
import Projects from "./blocks/Projects.vue";
import Features from "./blocks/Features.vue";
import Buttons from "./blocks/Buttons.vue";
import History from "./blocks/History.vue";
import Text from "./blocks/Text.vue";
import Stats from "./blocks/Stats.vue";
import Contact from "./blocks/Contact.vue";
import Actual from "./blocks/Actual.vue";
import InfoButtons from "./blocks/InfoButtons.vue";
import Footer from "./blocks/Footer.vue";
import {checkUserAuth, getAuth} from "./components/auth";
import {setPageTitle} from "../server/src/utils";
import {api} from "../server/api";

export default {
  name: "App",
  components: {
    NavBar, Hero, Products, Projects, Features, Buttons, History, Text, Stats, Contact, Actual, InfoButtons, Footer
  },
  inject: ['params'],
  data() {
    const allComponents = {
      hero: markRaw(Hero),
      products: markRaw(Products),
      projects: markRaw(Projects),
      features: markRaw(Features),
      buttons: markRaw(Buttons),
      history: markRaw(History),
      text: markRaw(Text),
      stats: markRaw(Stats),
      contact: markRaw(Contact),
      actual: markRaw(Actual),
      info_buttons: markRaw(InfoButtons),
      footer: markRaw(Footer)
    };

    const blockComponents = markRaw(Object.fromEntries(
        Object.entries(allComponents).filter(([, component]) => !!component)
    ));

    return {
      active: false,
      values: { },
      auth: getAuth(),
      blockComponents,
      products: [],
      categories: [],
      cartItems: [],
      wishlist: [],
      imageMetaTags: '',
      imageLoadingStates: {},
      isMobile: false,
      cartOpen: false,
      favoritesOpen: false,
      currentOrderProduct: null,
      pageBlocks: [],
      pageBlocksSorted: [],
      content: {
        features: [],
        history: []
      },
      features: [],
      elementStates: {},
    }
  },
  async mounted() {
    await this.refreshAuth();

    this.loadBlocks().then(() => {
      this.updateBlocks();
    });

    await this.loadContent();
    setPageTitle(this.params.title, 'конструктор сайтов');

    await this.$nextTick(() => {
      this.loadProducts();
    });
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
  methods: {
    handleCartUpdated(items) {
      let nextItems = items;

      if (!Array.isArray(nextItems)) {
        try {
          const raw = localStorage.getItem('cart');
          nextItems = raw ? JSON.parse(raw) : [];
        } catch (_error) {
          nextItems = [];
        }
      }

      this.cartItems = Array.isArray(nextItems) ? nextItems : [];
      this.$refs.navBar?.loadCart?.();
    },
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
    async loadProducts() {
      try {
        let response;
        response = await api.getProducts();

        if (response.ok) {
          const incoming = await response.json();
          const list = Array.isArray(incoming) ? incoming : [];

          this.products = list
              .filter(Boolean)
              .map((product) => {
                const p = { ...product };

                p.additional_images = Array.isArray(p.additional_images)
                    ? p.additional_images.map((img) => img).filter(Boolean)
                    : [];

                p.additional_videos = Array.isArray(p.additional_videos)
                    ? p.additional_videos.map((vid) => vid).filter(Boolean)
                    : [];

                return p;
              });

          this.products.forEach((product) => {
            if (product && product.id) {
              this.imageLoadingStates[product.id] = true;
            }
          });

          await this.$nextTick(() => {
            this.initProductLinkHandlers();
          });
        } else {
          this.products = [];
        }

      } catch (error) {
        console.error('Error loading products:', error);
        this.products = [];
      }
    },
    initProductLinkHandlers() {
      this.$nextTick(() => {
        const productLinks = document.querySelectorAll('.product-link, .product-title');

        productLinks.forEach(link => {
          const href = link.getAttribute('href');

          if (href && (href.includes('/product/') || href.includes('product/?id='))) {
            link.addEventListener('click', (event) => {
              const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
              sessionStorage.setItem('mainPageScrollPosition', scrollPosition.toString());
            });
          }
        });
      });
    },
    getBlockProps(block) {
      const base = {
        block,
        isInView: this.isInView
      };

      switch (block.type) {
        case 'hero':
          return {
            ...base,
            navClick: this.navClick
          };
        case 'products':
          return {
            ...base,
            products: this.products,
            categories: this.categories,
            elementStates: this.elementStates,
            cartItems: this.cartItems,
            wishlist: this.wishlist,
            imageMetaTags: this.imageMetaTags,
            isMobile: this.isMobile,
            isVideo: this.isVideo,
            getCurrentProductImage: this.getCurrentProductImage,

            'onUpdate:cartItems': e => this.handleCartUpdated(e),
            onUpdateCart: e => this.handleCartUpdated(e),
            'onUpdate:wishlist': e => this.wishlist = e,

            onOpenCart: () => {
              this.closeFavorites();
              this.cartOpen = true;
            },
            onOpenFavorites: () => {
              this.closeCart();
              this.favoritesOpen = true;
            },
            onCloseFavorites: () => {
              this.favoritesOpen = false;
            },
            onOpenOrder: (orderProduct) => {
              if (orderProduct && typeof orderProduct === 'object' && orderProduct.id != null) {
                this.currentOrderProduct = orderProduct;
              }

              this.openOrderModal();
            },
          };
        default:
          return base;
      }
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

          if (this.content.features.length === 0) this.content.features = this.features;
          if (this.content.history.length === 0) this.content.history = [];

          this.features = this.content.features;
        }
      } catch (e) {
        console.error('content error ', e);
      }
    },
    scroll_to(targetId) {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    },
    navClick(event, targetId) {
      event.preventDefault();
      this.close();
      this.scroll_to(targetId);
    },
    closeFavorites() {
      this.favoritesOpen = false;
    },
    closeCart() {
      this.cartOpen = false;
    },
    openOrderModal() {
      
    },
    isVideo() {
      return false;
    },
    getCurrentProductImage(product) {
      if (!product) return '';
      return product.image || '';
    },
    isInView(id) {
      return this.elementStates[id] === 'animated';
    },
  }
}
</script>

<template>
  <NavBar
      ref="navBar"
      :auth="auth"
      :products="products"
      @auth-changed="refreshAuth"
      @logout="onLogout"
      @update:cartItems="handleCartUpdated"
      @overlay="show"
  />
  <component
      v-for="(block, blockIndex) in pageBlocksSorted"
      :key="(block && block.id) ? block.id : 'block-' + blockIndex"
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
section {
  padding: 100px 0;
}
h1 {
  font-size: 48px;
  margin-bottom: 20px;
  line-height: 1.2;
}
h1 span {
  background: var(--primary);
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-alt) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>