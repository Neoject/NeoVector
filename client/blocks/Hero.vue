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
  <section v-if="block" id="home" class="hero" :style="getHeroBackgroundStyle(block)">
    <div class="hero-content">
      <h1 data-aos="fade-up" :id="'hero-title-' + block.id">{{ block.settings.mainTitle }}
      </h1>
      <p class="tagline"
         data-aos="fade-right" :id="'hero-tagline-' + block.id" style="transition-delay: 0.2s">{{ block.settings.subtitle || '' }}</p>
      <p class="description" data-aos="fade-right" :id="'hero-description-' + block.id" style="transition-delay: 0.4s">
        {{ block.settings.description }}
      </p>
      <div class="hero-buttons" data-aos="fade-left" :id="'hero-buttons-' + block.id">
        <span @click="navClick($event, 'products')" class="btn">{{ block.settings.buttonA }}</span>
        <span @click="navClick($event, 'features')" class="btn btn-outline">{{ block.settings.buttonB }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>

</style>