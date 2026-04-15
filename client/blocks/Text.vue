<script>
export default {
  name: "Text",
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
  <section v-if="block && block.type === 'text'" class="text-block">
    <div class="container">
      <h2 v-if="block.settings.sectionTitle" class="section-title scroll-animate"
          :class="{ 'animated': isInView('text-title-' + block.id), 'hidden': !isInView('text-title-' + block.id) }"
          :id="'text-title-' + block.id">{{ block.settings.sectionTitle }}</h2>
      <div class="text-content scroll-animate"
           :class="{ 'animated': isInView('text-content-' + block.id), 'hidden': !isInView('text-content-' + block.id) }"
           :id="'text-content-' + block.id" v-html="block.content"></div>
    </div>
  </section>
</template>

<style scoped>
.text-block {
  padding: 12vh 0;
}
.text-content {
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.8;
  font-size: 16px;
  color: var(--text-additional-light);
}
.text-content h1,
.text-content h2,
.text-content h3,
.text-content h4,
.text-content h5,
.text-content h6 {
  color: var(--primary);
  margin-bottom: 20px;
}
.text-content p {
  margin-bottom: 20px;
}
.text-content ul,
.text-content ol {
  margin-bottom: 20px;
  padding-left: 30px;
}
.text-content li {
  margin-bottom: 10px;
}
.text-content a {
  color: var(--primary);
  text-decoration: underline;
}
.text-content a:hover {
  color: var(--text-primary);
}
.text-content blockquote {
  border-left: 4px solid var(--primary);
  padding-left: 20px;
  margin: 20px 0;
  font-style: italic;
  color: #bbb;
}
</style>