<script>
export default {
  name: "Custom",
  props: {
    block: {
      type: Object,
      default: () => ({ content: '' })
    }
  }
}
</script>

<template>
  <section v-if="block && block.content" :id="block.settings && block.settings.anchorId ? block.settings.anchorId : undefined">
    <div class="container" v-html="block.content">

    </div>
  </section>
</template>

<style scoped>
section {
  padding: 60px 0;
}
</style>
