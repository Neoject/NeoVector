<script>
import Props from "./Props.vue";

export default{
  name: "InfoButtons",
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
  }
}
</script>

<template>
  <section v-if="block && block.type === 'info_buttons' && block.is_active && block.settings.buttons && block.settings.buttons.length > 0" id="info-buttons">
    <div class="info-buttons-container">
      <h2 v-if="block.settings.sectionTitle" class="section-title" :id="'info-buttons-title-' + block.id">
        {{ block.settings.sectionTitle }}
      </h2>
      <div class="buttons-container" :id="'info-buttons-container-' + block.id">
        <a v-for="(button, index) in block.settings.buttons" :key="index" :href="getLink(button)"
           @click="click($event, button)" class="btn btn-secondary">
          {{ button.text }}
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.info-buttons-block {
  padding: 40px 0 0;
  flex: 0 0 calc(33.333% - 10px);
}
.info-buttons-block .info-buttons-content {
  text-align: center;
}
.info-buttons-block a {
  width: 20vw;
  font-size: 14px;
  flex-wrap: unset;
  text-align: center;
  color: var(--primary);
  margin: 0.5vw !important;
}
.info-buttons-container {
  width: auto;
}
.buttons-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  align-items: center;
  margin-top: 30px;
}
.buttons-container .btn {
  min-width: 150px;
  margin: 0;
}
@media (max-width: 768px) {
  .buttons-container {
    flex-direction: column;
    gap: 15px;
    padding-bottom: 2vh;
  }
  .buttons-container .btn {
    width: 100%;
    max-width: 300px;
  }
}
</style>