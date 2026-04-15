<script>
import Props from "./Props.vue";

export default {
  name: "Actual",
  mixins: [Props],
  props: {
    block: {
      type: Object,
      default: {
        id: 0,
        type: '',
        settings: ''
      }
    },
    isInView: Function,
  },
  methods: {
    getActualLink(promo) {
      if (!promo || !promo.link) return '#';
      return this.getLink({ linkType: promo.linkType || 'url', link: promo.link, target: promo.link });
    },
    actualLinkClick(event, promo) {
      if (!promo || !promo.link) return;
      this.click(event, { linkType: promo.linkType || 'url', link: promo.link, target: promo.link });
    },
  }
}
</script>

<template>
  <section v-if="block && block.settings.promotions && block.settings.promotions.length > 0" id="actual">
    <div class="container">
      <h2 v-if="block.settings.sectionTitle" class="section-title scroll-animate"
          :class="{ 'animated': isInView('actual-title-' + block.id), 'hidden': !isInView('actual-title-' + block.id) }"
          :id="'actual-title-' + block.id">{{ block.settings.sectionTitle }}</h2>
      <div class="actual-grid">
        <article v-for="(promo, promoIndex) in block.settings.promotions" :key="promoIndex"
                 class="actual-card scroll-animate"
                 :class="{ 'animated': isInView('actual-' + block.id + '-' + promoIndex), 'hidden': !isInView('actual-' + block.id + '-' + promoIndex) }"
                 :id="'actual-' + block.id + '-' + promoIndex">
          <div v-if="promo.image" class="actual-card-image">
            <img :src="promo.image" :alt="promo.title">
          </div>
          <div class="actual-card-inner">
            <div class="actual-badge">
              <i class="fas fa-tags"></i>
              <span>Акция</span>
            </div>
            <h3 class="actual-card-title">{{ promo.title }}</h3>
            <p v-if="promo.description" class="actual-card-description">{{ promo.description }}</p>
            <div class="product-promo-list">
              <a v-for="(link, idx) in (Array.isArray(promo.links) ? promo.links : Object.values(promo.links || {}))"
                 :key="idx" :href="link.link" class="product-promo-item">
                <div class="product-promo-image">
                  <img v-if="link.data?.image" :src="'/' + link.data.image" :alt="link.title || link.name">
                  <div v-else class="product-promo-placeholder">
                    <i class="fas fa-image"></i>
                  </div>
                </div>
                <div class="product-promo-content">
                  <h4 class="product-promo-title">{{ link.title || link.name }}</h4>
                  <p v-if="link.description" class="product-promo-description">{{ link.description }}</p>
                  <div class="product-price-promo">
                    <p class="product-promo price" :class="link.data.price_sale ? 'price-old' : ''">{{ link.data.price }} руб.</p>
                    <h4 class="product-promo price-sale" v-if="link.data.price_sale">{{ link.data.price_sale }} руб.</h4>
                  </div>
                </div>
                <i class="product-promo-arrow fas fa-arrow-right"></i>
              </a>
            </div>
            <a v-if="promo.link" :href="getActualLink(promo)" class="actual-card-link"
               @click="actualLinkClick($event, promo)">
              {{ promo.linkText || 'Подробнее' }}
              <i class="fas fa-arrow-right"></i>
            </a>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.actual-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}
.actual-card {
  background: var(--background-secondary);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border-light);
  transition: all 0.3s ease;
}
.actual-card:hover {
  background: var(--background-secondary);
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
}
.actual-card-image {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--background-secondary);
}
.actual-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.actual-card-inner {
  padding: 1.75rem;
  position: relative;
}
.actual-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--primary);
  margin-bottom: 1rem;
}
.actual-badge i {
  font-size: 0.9rem;
}
.actual-card-title {
  font-size: 1.35rem;
  margin: 0 0 0.75rem;
  color: var(--text-primary);
  line-height: 1.3;
}
.actual-card-description {
  font-size: 0.95rem;
  color: var(--text-additional-light);
  line-height: 1.5;
  margin: 0 0 1rem;
}
.actual-card-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--primary);
  text-decoration: none;
  transition: color 0.2s ease, gap 0.2s ease;
}
.actual-card-link:hover {
  color: var(--primary-alt);
  gap: 0.65rem;
}
.actual-card-link i {
  font-size: 0.8rem;
}
.product-promo-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1rem 0;
}
.product-promo-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--background-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-light);
  text-decoration: none;
  color: inherit;
  transition: all 0.25s ease;
}
.product-promo-item:hover {
  background: var(--background-secondary);
  border-color: var(--primary);
  transform: translateX(4px);
}
.product-promo-image {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--background-secondary);
}
.product-promo-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.product-promo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-additional-light);
  font-size: 1.5rem;
}
.product-promo-content {
  flex: 1;
  min-width: 0;
}
.product-promo-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
  color: var(--text-primary);
  line-height: 1.3;
}
.product-promo-description {
  font-size: 0.85rem;
  color: var(--text-additional-light);
  line-height: 1.4;
  margin: 0;
}
.product-promo-arrow {
  flex-shrink: 0;
  font-size: 0.85rem;
  color: var(--primary);
  opacity: 0;
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.product-promo-item:hover .product-promo-arrow {
  opacity: 1;
  transform: translateX(2px);
}
</style>