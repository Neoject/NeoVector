<script>

</script>

<template>
  <main style="padding-top: 90px;">
    <section class="error-state">
      <div class="container">
        <div class="error-content">
          <h2>Товар не найден</h2>
          <p>Возможно, товар был удалён или вы перешли по неверной ссылке.</p>
          <a href="/" class="btn btn-primary">На главную</a>
        </div>
      </div>
    </section>
    <section class="product-detail-container">
      <div class="container">
        <div class="product-detail">
          <!-- Desktop Gallery -->
          <div class="product-images desktop-only">
            <div class="main-image">
              <div v-if="allMedia && allMedia.length > 0">
                <video
                    v-if="allMedia[currentMediaIndex] && allMedia[currentMediaIndex].type === 'video'"
                    class="product-main-video" :src="allMedia[currentMediaIndex].url" controls muted
                    loop playsinline @click.prevent="openMediaViewModal"></video>
                <img v-else-if="allMedia[currentMediaIndex]" class="product-main-img"
                     :src="allMedia[currentMediaIndex].url" :alt="product ? product.name : ''"
                     @click="openMediaViewModal">
                <div v-if="allMedia.length > 1">
                  <button class="gallery-nav-btn prev-btn" @click.stop="prevMedia"
                          :disabled="currentMediaIndex <= 0">
                    <i class="fas fa-chevron-left"></i>
                  </button>
                  <button class="gallery-nav-btn next-btn" @click.stop="nextMedia"
                          :disabled="currentMediaIndex >= allMedia.length - 1">
                    <i class="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>

            <div class="image-gallery" v-if="allMedia.length > 1">
              <div class="gallery-thumbnails">
                <div v-for="(item, index) in allMedia" :key="index" class="thumbnail-item"
                     :class="{ 'active': currentMediaIndex === index }"
                     @click="setMediaIndex(index)">
                  <div v-if="item.type === 'video'" class="thumbnail-video-wrapper">
                    <video :src="item.url" class="thumbnail-img thumbnail-video"
                           preload="metadata" muted playsinline></video>
                    <i class="fas fa-play thumbnail-play-icon"></i>
                  </div>
                  <img v-else :src="item.url" :alt="product.name" class="thumbnail-img">
                </div>
              </div>
              <div class="gallery-navigation">
                                        <span class="gallery-counter">{{ currentMediaIndex + 1 }} / {{ allMedia.length
                                          }}</span>
              </div>
            </div>
          </div>

          <!-- Mobile Gallery -->
          <div class="mobile-product-gallery mobile-only">
            <div class="product-img-container"
                 @touchstart="handleMobileGalleryTouchStart($event)"
                 @touchmove="handleMobileGalleryTouchMove($event)"
                 @touchend="handleMobileGalleryTouchEnd($event)"
                 @mousedown="handleMobileGalleryMouseDown($event)"
                 @mousemove="handleMobileGalleryMouseMove($event)"
                 @mouseup="handleMobileGalleryMouseUp($event)"
                 @mouseleave="handleMobileGalleryMouseLeave($event)">
              <div>
                <div v-if="isImageLoading" class="image-loading-indicator">
                  <div class="loading-spinner"></div>
                </div>
                <img v-if="allMedia[currentMediaIndex] && allMedia[currentMediaIndex].type !== 'video'"
                     :src="allMedia[currentMediaIndex] ? allMedia[currentMediaIndex].url : ''"
                     :alt="product.name"
                     class="product-img"
                     :class="{ 'loading': isImageLoading }"
                     loading="lazy"
                     decoding="async"
                     @loadstart="onImageLoadStart"
                     @load="onImageLoad"
                     @error="onImageError"
                     @click="openMediaViewModalFromIndex(currentMediaIndex)"
                     @touchstart.stop="handleImageTouchStart"
                     @touchend.stop="handleImageTouchEnd"
                     style="cursor: pointer; pointer-events: auto; -webkit-tap-highlight-color: transparent;">
                <video v-else-if="allMedia[currentMediaIndex] && allMedia[currentMediaIndex].type === 'video'"
                       :src="allMedia[currentMediaIndex] ? allMedia[currentMediaIndex].url : ''"
                       class="product-img"
                       :class="{ 'loading': isImageLoading }"
                       muted
                       loop
                       playsinline
                       autoplay
                       @loadstart="onVideoLoadStart"
                       @loadeddata="onVideoLoadedData"
                       @error="onVideoError"
                       @click="openMediaViewModalFromIndex(currentMediaIndex)"
                       @touchstart.stop="handleImageTouchStart"
                       @touchend.stop="handleImageTouchEnd"
                       style="cursor: pointer; pointer-events: auto; -webkit-tap-highlight-color: transparent;">
                </video>
              </div>
              <div v-if="allMedia.length > 1" class="product-image-nav">
                <button class="product-image-nav-btn product-image-nav-prev"
                        @click.stop.prevent="prevMedia"
                        aria-label="Предыдущее изображение">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <button class="product-image-nav-btn product-image-nav-next"
                        @click.stop.prevent="nextMedia"
                        aria-label="Следующее изображение">
                  <i class="fas fa-chevron-right"></i>
                </button>
                <div class="product-image-dots">
                                            <span v-for="(item, index) in allMedia"
                                                  :key="index"
                                                  class="product-image-dot"
                                                  :class="{ 'active': currentMediaIndex === index }"
                                                  @click.stop.prevent="setMediaIndex(index)"
                                                  :aria-label="`Изображение ${index + 1}`">
                                            </span>
                </div>
              </div>
            </div>
          </div>

          <div class="product-info">
            <div class="product-header">
              <h1 class="product-page title">product['name']</h1>
              <div class="product-price">
                product['price_sale']:
                <span class="price-old">
                  product['price'] руб.
                </span>
                <span class="price-sale">
                  product['price_sale'] руб.
                </span>
                <span class="price-current">
                  product['price'] руб.
                </span>
              </div>
            </div>

            <div class="product-meta">
              <div class="product-material">
                <i class="fas fa-gem"></i>
                <span>product['material']</span>
              </div>
            </div>
            <div class="product-description">
              <h3>Описание</h3>
              <p>product['description']</p>
            </div>
            product['peculiarities']
            <div class="product-features">
              <h3>Особенности</h3>
              <ul>
                foreach ($product['peculiarities'] as $pec):
                                                $pecStr = trim((string) $pec);
                <li><i class="fas fa-check"></i> pecStr</li>
              </ul>
            </div>

            <div class="product-actions" style="margin-top: 2rem;" v-if="product">
              <!-- Desktop Version -->
              <div class="product-order-favorite desktop-only">
                <table>
                  <tr>
                    <td>
                      <button @click="startProductHandSelection('buyNow', $event)"
                              class="btn btn-primary add-to-cart-btn">
                        <i class="fas fa-shopping-bag"></i>
                        Купить сейчас
                      </button>
                    </td>
                    <template v-if="!isProductInCart">
                      <td>
                        <button @click="startProductHandSelection('addToCart', $event)"
                                class="btn btn-outline add-to-cart-btn">
                          <i class="fas fa-shopping-cart"></i>
                          Добавить в корзину
                        </button>
                      </td>
                      <td>
                        <button @click="toggleWishlist" class="btn btn-outline wishlist-btn"
                                :class="{ 'active': isInWishlist }">
                          <i class="fas fa-heart"></i>
                        </button>
                      </td>
                    </template>
                    <template v-if="isProductInCart">
                      <td colspan="2">
                        <div class="split-button-container">
                          <div class="split-button-wrapper">
                            <button @click="toggleCart"
                                    class="split-btn split-btn-left">
                              <i class="fas fa-shopping-cart"></i>
                              В корзине
                            </button>
                            <button
                                @click="startProductHandSelection('addToCart', $event)"
                                class="split-btn split-btn-right">
                              <span class="plus-circle">+</span>
                              <span class="add-text">
                                                                        <i class="fas fa-plus"></i>
                                                                        Добавить в корзину
                                                                    </span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </template>
                    <td v-if="isProductInCart">
                      <button @click="toggleWishlist" class="btn btn-outline wishlist-btn"
                              :class="{ 'active': isInWishlist }">
                        <i class="fas fa-heart"></i>
                      </button>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Mobile Version -->
              <div class="product-order-favorite-mobile mobile-only">
                <button @click="startProductHandSelection('buyNow', $event)"
                        class="add-to-cart mobile-action-btn">
                  <i class="fas fa-shopping-bag"></i>
                  Купить сейчас
                </button>
                <div class="mobile-actions-row">
                  <template v-if="!isProductInCart">
                    <button @click="startProductHandSelection('addToCart', $event)"
                            class="add-to-cart mobile-action-btn">
                      <i class="fas fa-shopping-cart"></i>
                      В корзину
                    </button>
                  </template>
                  <template v-else>
                    <button @click="toggleCart" class="add-to-cart mobile-action-btn">
                      <i class="fas fa-shopping-cart"></i>
                      В корзине
                    </button>
                    <button @click="startProductHandSelection('addToCart', $event)"
                            class="add-to-cart mobile-action-btn mobile-add-more">
                      <i class="fas fa-plus"></i>
                    </button>
                  </template>
                  <button @click="toggleWishlist" class="wishlist mobile-action-btn"
                          :class="{ 'active': isInWishlist }">
                    <i class="fas fa-heart"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <!-- Option Selector Modal -->
    <div v-if="showOptionSelector" class="option-selector-modal" @click.self="cancelProductAddToCart">
      <div class="option-selector-content">
        <div class="option-selector-header">
          <h3>Выберите {{ currentOptionType ? currentOptionType.name : 'опцию' }}</h3>
          <button @click="cancelProductAddToCart" class="close-icon">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="option-selector-body">
          <div v-if="currentOptionType" class="option-values">
            <button v-for="value in currentOptionType.values" :key="value"
                    @click="chooseProductOptionValue(value)" class="option-value-btn">
              {{ value }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>

</style>