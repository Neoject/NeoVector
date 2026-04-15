<script>
export default {
  name: "Hero",
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
    navClick: Function,
  },
  methods: {
    getHeroBackgroundStyle(block) {
      if (!block || !block.settings || !block.settings.backgroundImage) {
        return {};
      }

      const backgroundPosition = block.settings.backgroundPosition || 'center';
      const backgroundSize = block.settings.backgroundSize || 'cover';

      return {
        '--hero-bg-image': 'url(' + block.settings.backgroundImage + ')',
        '--hero-bg-position': backgroundPosition,
        '--hero-bg-size': backgroundSize,
        backgroundImage: 'url(' + block.settings.backgroundImage + ')',
        backgroundPosition: backgroundPosition,
        backgroundSize: backgroundSize,
        backgroundRepeat: 'no-repeat'
      };
    },
  }
}
</script>

<template>
  <section v-if="block" id="hero" class="hero" :style="getHeroBackgroundStyle(block)">
    <div class="hero-content">
      <h1 :id="'hero-title-' + block.id">{{ block.settings.mainTitle }}
      </h1>
      <p class="tagline"
         :id="'hero-tagline-' + block.id" style="transition-delay: 0.2s">{{ block.settings.subtitle || '' }}</p>
      <p class="description" :id="'hero-description-' + block.id" style="transition-delay: 0.4s">
        {{ block.settings.description }}
      </p>
      <div class="hero-buttons" :id="'hero-buttons-' + block.id">
        <span @click="navClick($event, 'products')" class="btn">{{ block.settings.buttonA }}</span>
        <span @click="navClick($event, 'features')" class="btn btn-outline">{{ block.settings.buttonB }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  display: flex;
  align-items: center;
  padding-top: 80px;
  background-size: cover;
  position: relative;
}
.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--bg-black-80) 0%, var(--bg-black-80) 100%);
}
.hero-content {
  position: relative;
  z-index: 1;
  width: 100%;
  text-align: center;
  margin: 12vh 4vw 0;
}
</style>