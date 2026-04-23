<script>
import { markRaw } from 'vue';
import Props from "./blocks/Props.vue";
import NavBar from "./components/NavBar.vue";
import Cart from "./components/Cart.vue";
import {checkUserAuth, getAuth} from "./components/auth";
import {setPageTitle} from "../../server/src/utils";
import {api} from "../../server/api";
import AOS from "aos";
import 'aos/dist/aos.css';

const blockModules = import.meta.glob('./blocks/*.vue', { eager: true });
const blockComponents = {};
const componentRegistry = {};

Object.entries(blockModules).forEach(([path, module]) => {
  const fileName = path.split('/').pop().replace('.vue', '');
  const componentKey = fileName.toLowerCase();
  const component = module.default || module;
  blockComponents[componentKey] = markRaw(component);
  componentRegistry[fileName] = component;
});

const customModules = import.meta.glob('../*.vue', { eager: true });
const customComponents = {};
const customRegistry = {};

Object.entries(customModules).forEach(([path, module]) => {
  const fileName = path.split('/').pop().replace('.vue', '');
  const componentKey = fileName.toLowerCase();
  const component = module.default || module;
  customComponents[componentKey] = markRaw(component);
  customRegistry[fileName] = component;
});

const components = {
  NavBar,
  Cart,
  ...componentRegistry,
  ...customRegistry
};

const readStorageArray = (key) => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
};

export default {
  name: "App",
  mixins: [Props],
  components,
  inject: ['params', 'theme'],
  emits: ['toggle-theme'],
  data() {
    const loadedBlocks = markRaw(Object.fromEntries(
        Object.entries(blockComponents).filter(([, component]) => !!component)
    ));

    const loadedComponents = markRaw(Object.fromEntries(
        Object.entries(customComponents).filter(([, component]) => !!component)
    ));

    return {
      active: false,
      values: { },
      auth: getAuth(),
      blocks: loadedBlocks,
      components: loadedComponents,
      products: [],
      categories: [],
      cartItems: [],
      wishlist: readStorageArray('wishlist'),
      imageMetaTags: '',
      imageLoadingStates: {},
      isMobile: false,
      cartOpen: false,
      favoritesOpen: false,
      currentOrderProduct: null,
      pageBlocks: [],
      pageBlocksSorted: [],
      managedCustomComponents: new Set(),
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
    this.cartItems = readStorageArray('cart');

    this.loadBlocks().then(() => {
      this.updateBlocks();
    });

    await this.loadContent();
    setPageTitle(this.params.title, this.params.main_title);

    await this.$nextTick(() => {
      this.loadProducts();
    });

    AOS.init();
  },
  methods: {
    handleCartUpdated(items) {
      this.cartItems = Array.isArray(items) ? [...items] : readStorageArray('cart');
    },
    handleWishlistUpdated(items) {
      this.wishlist = Array.isArray(items) ? [...items] : [];
      localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
    },
    close() {
      this.$refs.navBar?.closePanels?.();
      this.cartOpen = false;
      this.active = false;
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
    resolveBlockComponent(block) {
      if (block.type === 'custom_component') {
        return this.components[block.title.toLowerCase()] || null;
      }
      return this.blocks[block.type] || null;
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
            'onUpdateCart': e => this.handleCartUpdated(e),
            'onUpdate:wishlist': e => this.handleWishlistUpdated(e),

            onOpenCart: () => {
              this.$refs.navBar?.closePanels?.();
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

      this.pageBlocks = this.pageBlocks.filter(b => !b.page_id);

      const active = this.pageBlocks.filter(b => b.is_active);
      const byOrder = (a, b) => (a.sort_order || 0) - (b.sort_order || 0);
      const footerBlock = active.filter(b => ['info_buttons', 'footer'].includes(b.type)).sort(byOrder);
      const rest = active.filter(b => !['info_buttons', 'footer'].includes(b.type)).sort(byOrder);

      this.pageBlocksSorted = [...rest, ...footerBlock];

      this.managedCustomComponents = new Set(
          this.pageBlocks
              .filter(b => b.type === 'custom_component')
              .map(b => b.title.toLowerCase())
      );
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
    navClick(event, targetId) {
      event.preventDefault();
      this.close();
      this.scrollTo(targetId);
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
    }
  }
}
</script>

<template>
  <NavBar
      ref="navBar"
      :auth="auth"
      :products="products"
      :wishlist="wishlist"
      :cart-items="cartItems"
      @auth-changed="refreshAuth"
      @logout="onLogout"
      @toggle-cart="cartOpen = !cartOpen"
      @close-cart="cartOpen = false"
      @add-to-cart="handleCartUpdated"
      @toggle-theme="$emit('toggle-theme')"
      @update:wishlist="handleWishlistUpdated"
      @overlay="show"
  />
  <Cart
      :cart-open="cartOpen"
      :cart-items="cartItems"
      @close="cartOpen = false"
      @update:cart-items="handleCartUpdated"
      @nav-click="navClick"
  />
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
  <teleport to="body">
    <div class="neoject">
      Сайт разработан
      <a class="btn btn-outline" style="border:none" href="https://neoject.by" target="_blank">neoject.by</a>
    </div>
  </teleport>
  <div class="overlay" :class="{ active: active || cartOpen }" @click="close"></div>
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