<script>
import Products from './Products.vue'
import Blocks from './Blocks.vue'
import Pages from './Pages.vue'

export default {
  name: 'Main',
  components: { Products, Blocks, Pages },
  props: {
    page: { type: String, default: '' },
    logo: String,
  },
  emits: ['update:page'],
}
</script>

<template>
  <div class="admin-dashboard">
    <main class="admin-main">
      <div class="container">
        <Products @update:page="$emit('update:page', $event)" />
        <Blocks @update:page="$emit('update:page', $event)" />
        <Pages @update:page="$emit('update:page', $event)" />
      </div>
    </main>
  </div>
</template>
