<script>
import Props from "./Props.vue";

export default {
  name: "Buttons",
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
    getClass(style) {
      const classes = {
        'primary': 'btn-primary',
        'secondary': 'btn-secondary',
        'outline': 'btn-outline'
      };
      return classes[style] || 'btn-primary';
    }
  }
}
</script>

<template>
  <section v-if="block && block.type === 'buttons' && block.settings.buttons && block.settings.buttons.length > 0" id="buttons-block">
    <div class="container">
      <h2 v-if="block.settings.sectionTitle" class="section-title scroll-animate"
          :class="{ 'animated': isInView('buttons-title-' + block.id), 'hidden': !isInView('buttons-title-' + block.id) }"
          :id="'buttons-title-' + block.id">{{ block.settings.sectionTitle }}</h2>
      <div class="buttons-container scroll-animate"
           :class="{ 'animated': isInView('buttons-container-' + block.id), 'hidden': !isInView('buttons-container-' + block.id) }"
           :id="'buttons-container-' + block.id">
        <a v-for="(button, index) in block.settings.buttons" :key="index" :href="getLink(button)"
           @click="click($event, button)" class="btn"
           :class="getClass(button.style)">
          {{ button.text }}
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>

</style>