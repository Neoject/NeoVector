<script>
export default {
  name: "MediaView",
  data() {
    return {
      mediaViewOpen: false
    }
  },
  methods: {
    closeMediaView() {
      this.mediaViewOpen = false;
    }
  }
}
</script>

<template>
  <div v-if="mediaViewOpen && allMedia && allMedia.length > 0" class="content-view container"
       @click="closeMediaView">
    <div class="content-view content" @click.stop>
      <button class="gallery-nav-btn btn-close-view" @click="closeMediaView">
        <i class="fas fa-times"></i>
      </button>
      <video v-if="allMedia[currentMediaIndex] && allMedia[currentMediaIndex].type === 'video'"
             :key="'video-view-' + currentMediaIndex" class="content-view video"
             :src="allMedia[currentMediaIndex].url" @click.prevent controls muted loop autoplay
             playsinline></video>
      <img v-else-if="allMedia[currentMediaIndex]" :key="'img-view-' + currentMediaIndex"
           class="content-view image" :src="allMedia[currentMediaIndex].url"
           :alt="product ? product.name : ''">
      <button v-if="allMedia.length > 1" @click.stop="prevMediaInModal"
              class="content-view gallery-nav-btn prev-btn" :disabled="currentMediaIndex === 0">
        <i class="fas fa-chevron-left"></i>
      </button>
      <button v-if="allMedia.length > 1" @click.stop="nextMediaInModal"
              class="content-view gallery-nav-btn next-btn"
              :disabled="currentMediaIndex >= allMedia.length - 1">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<style scoped>

</style>