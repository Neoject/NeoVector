<script>

import {api} from "../../../server/api";

export default {
  name: "Options",
  data() {
    return {
      productOptions: [],
      showOptionSelector: false,
      optionSelectionIndex: 0,
      selectedProductOptions: [],
    }
  },
  mounted() {
    this.loadProductOptions().then(() => null);
  },
  methods: {
    async startOptionSelection(product, action, point, event) {
      if (event) {
        event.stopPropagation();
      }

      this.resetOptionSelectionState();
      // this.showOverlay();

      if (point === 'buyNow') {
        this.buyNowPressed = true;
      } else if (point === 'addToCart') {
        this.addToCartPressed = true;
      }

      this.selectingHandProductId = product.id;
      this.selectingHandAction = action; // 'buy' | 'cart'
      await this.loadProductOptions();
      this.finishOptionSelection(product);
    },
    resetOptionSelectionState() {
      this.selectedProductOptions = [];
      this.optionSelectionIndex = 0;
      this.showOptionSelector = false;
    },
    cancelOptionSelection() {
      this.resetOptionSelectionState();
      this.selectingHandProductId = null;
      this.selectingHandAction = null;
      this.buyNowPressed = false;
      this.addToCartPressed = false;
      // this.hideOverlay();
    },
    normalizeOptionTypes(types) {
      return types
          .map((type, index) => {
            const name = (type.name || '').trim() || 'Опция' + index + 1;
            const slug = type.slug || this.slugifyOptionName(name) || 'option-' + index;
            const values = Array.isArray(type.values)
                ? type.values
                    .map(value => (value !== null && value !== undefined ? String(value).trim() : ''))
                    .filter(Boolean)
                : [];

            return {
              id: type.id || null,
              name,
              slug,
              values
            };
          })
          .filter(type => type.values.length);
    },
    slugifyOptionName(name) {
      if (!name) {
        return '';
      }
      return name
          .toString()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .toLowerCase();
    },
    async loadProductOptions() {
      try {
        const selectedProduct = this.selectingHandProduct();
        const typeId = selectedProduct ? selectedProduct.product_type_id : null;
        const response = await api.getProductOptions(typeId);

        if (response && response.ok) {
          const contentType = response.headers.get('content-type') || '';

          if (!contentType.includes('application/json')) {
            const raw = await response.text();
            throw new Error('Unexpected response type for product options: ' + raw.slice(0, 120));
          }

          const data = await response.json();
          const options = Array.isArray(data.options) ? data.options : [];
          this.productOptions = this.normalizeOptionTypes(options);
        } else {
          console.warn('Failed to load product options, using defaults');
        }
      } catch (error) {
        console.error('Error loading product options:', error);
      }
    },
    currentOptionType() {
      if (!this.productOptions || !this.productOptions.length) {
        return null;
      }

      return this.productOptions[this.optionSelectionIndex] || null;
    },
    selectingHandProduct() {
      if (!this.selectingHandProductId) return null;
      return this.products.find(p => p.id === this.selectingHandProductId) || null;
    },
    chooseOptionValue(product, value) {
      const optionType = this.currentOptionType();

      if (!optionType) {
        return;
      }

      this.selectedProductOptions.push({
        name: optionType.name || 'Опция ' + this.optionSelectionIndex + 1,
        value
      });
      this.optionSelectionIndex += 1;

      if (this.optionSelectionIndex >= this.productOptions.length) {
        this.showOptionSelector = false;
        this.finishOptionSelection(product);
      }
    },
    finishOptionSelection(product) {
      const optionsSnapshot = this.selectedProductOptions.map(option => ({ ...option }));
      const optionKey = this.buildOptionKey(optionsSnapshot);

      if (this.selectingHandAction === 'buy') {
        this.$emit('open-order', {
          ...product,
          price: product.price_sale || product.price,
          options: optionsSnapshot,
          optionKey,
          quantity: 1
        });
      } else if (this.selectingHandAction === 'cart') {
        this.addToCartInternal(product, optionsSnapshot);

        if (this.selectingFromFavorites) {
          this.localWishlist = this.localWishlist.filter(id => id !== product.id);
          this.saveWishlist();
          this.closeFavorites();
          this.toCart();
          this.selectingFromFavorites = false;
        }
      }

      this.selectingHandProductId = null;
      this.selectingHandAction = null;
      this.buyNowPressed = false;
      this.addToCartPressed = false;
      this.resetOptionSelectionState();
      // this.hideOverlay();
    },
    finishProductOptionSelection() {
      if (!this.product) return;

      const optionsSnapshot = this.selectedProductOptions.map(option => ({ ...option }));
      const optionKey = this.buildOptionKey(optionsSnapshot);

      if (this.selectingHandAction === 'buy') {
        this.currentOrderProduct = {
          ...this.product,
          price: this.product.price_sale || this.product.price,
          options: optionsSnapshot,
          optionKey,
          quantity: this.productQuantity
        };

        this.openOrderModal();
      } else if (this.selectingHandAction === 'cart') {
        this.addProductToCartInternal(optionsSnapshot);
      }
      this.showOptionSelector = false;
      this.selectingHandAction = null;
      this.selectedProductOptions = [];
      this.optionSelectionIndex = 0;
    },
    chooseProductOptionValue(value) {
      const option = this.currentOptionType;

      if (!option) {
        return;
      }

      this.selectedProductOptions.push({
        name: option.name || 'Опция ' + this.optionSelectionIndex + 1,
        value
      });

      this.optionSelectionIndex += 1;

      if (this.optionSelectionIndex >= this.productOptions.length) {
        this.showOptionSelector = false;
        this.$nextTick(() => {
          this.finishProductOptionSelection();
        });
      }
    },
  }
}
</script>