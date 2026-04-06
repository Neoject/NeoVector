<script>

import Modal from "../../components/Modal.vue";

export default {
  name: "Product",
  components: {Modal},
  data() {
    return {
      id: 0,
      productForm: {
        name: '',
        description: '',
        peculiarities: [],
        material: '',
        price: '',
        price_sale: '',
        category: '',
        product_type_id: null,
        image: '',
        image_description: '',
        additionalImages: [],
        additionalVideos: []
      },
      editingProduct: null,
      newPeculiarity: '',
      selectOpen: false,
      selectedFile: null,
      isUploading: false,
      productTypes: []
    }
  }
}
</script>

<template>
  <Modal
      :modal-id="'product-' + id"
      :title="editingProduct ? 'Редактировать товар' : 'Добавить товар'"
  />
  <form @submit.prevent="saveProduct">
    <div class="form-group">
      <label>Название товара</label>
      <input type="text" v-model="productForm.name" required>
    </div>
    <div class="form-group">
      <label>Тип товара</label>
      <select v-model="productForm.product_type_id" required>
        <option v-for="type in productTypes" :key="type.id" :value="type.id">
          {{ type.name }}
        </option>
      </select>
    </div>
    <div class="form-group">
      <label>Описание товара</label>
      <textarea v-model="productForm.description"></textarea>
    </div>
    <div class="form-group">
      <label>Особенности товара</label>
      <div class="peculiarities-editor">
        <div class="peculiarities-list">
          <div v-for="(peculiarity, index) in productForm.peculiarities" :key="index"
               class="peculiarity-item">
            <input type="text" v-model="productForm.peculiarities[index]"
                   class="peculiarity-input">
            <button type="button" @click="removePeculiarity(index)"
                    class="btn btn-sm btn-delete">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="add-peculiarity">
          <input type="text" v-model="newPeculiarity" @keyup.enter="addPeculiarity"
                 placeholder="Добавить особенность" class="peculiarity-input">
          <button type="button" @click="addPeculiarity" class="btn btn-sm btn-primary">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      </div>
    </div>
    <div class="form-group">
      <label>Материал</label>
      <input type="text" v-model="productForm.material" required>
    </div>
    <div class="form-group">
      <label>Цена (руб.)</label>
      <input type="text" v-model="productForm.price" required min="0">
    </div>
    <div class="form-group">
      <label>Цена по скидке (руб.)</label>
      <input type="text" v-model="productForm.price_sale" min="0">
    </div>
    <div class="form-group select-group" :class="{ 'open': selectOpen }">
      <label>Категория</label>
      <select v-model="productForm.category" @focus="onSelectFocus" @blur="onSelectBlur"
              @change="onSelectChange" @click="onSelectClick" @mousedown="onSelectMouseDown"
              required>
        <option v-for="category in categories" :key="category.id" :value="category.id">
          {{ category.name }}
        </option>
      </select>
    </div>
    <div class="form-group image-upload-group">
      <label>Основное изображение/видео товара</label>
      <div class="image-upload-container">
        <div class="file-upload-area"
             :class="{ 'has-file': selectedFile, 'uploading': isUploading, 'upload-success': uploadSuccess, 'upload-error': uploadError }"
             @click="!isUploading && triggerFileUpload()">
          <input ref="fileInput" type="file" @change="handleFileSelect"
                 accept="image/*,video/*" style="display: none;" :disabled="isUploading">
          <div v-if="isUploading" class="upload-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: uploadProgress + '%' }">
              </div>
            </div>
            <p>Загрузка... {{ uploadProgress }}%</p>
            <button type="button" @click.stop="cancelUpload" class="cancel-upload-btn">
              <i class="fas fa-times"></i> Отмена
            </button>
          </div>
          <div v-else-if="uploadSuccess" class="upload-status success">
            <i class="fas fa-check-circle"></i>
            <p>Файл успешно загружен!</p>
            <button type="button" @click.stop="resetUploadStatus"
                    class="status-close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div v-else-if="uploadError" class="upload-status error">
            <i class="fas fa-exclamation-circle"></i>
            <p>Ошибка загрузки: {{ uploadErrorMessage }}</p>
            <button type="button" @click.stop="resetUploadStatus"
                    class="status-close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div v-else-if="!selectedFile && !productForm.image" class="upload-placeholder">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Нажмите для выбора изображения или видео</p>
            <span>или перетащите файл сюда</span>
          </div>
          <div v-else class="image-preview-container">
            <img v-if="!isVideoPreview(getImageUrl())" :src="getImageUrl()"
                 :alt="productForm.name" class="current-image">
            <video v-else :src="getImageUrl()" controls class="current-image"></video>
            <button type="button" @click.stop="removeImage" class="remove-image-btn"
                    :disabled="isUploading">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="image-info">
          <small v-if="selectedFile && !isUploading">Выбран файл: {{ selectedFile.name
            }}</small>
          <small v-else-if="productForm.image && !isUploading">Текущее изображение/видео:
            {{ productForm.image }}</small>
          <small v-else-if="isUploading">Загрузка файла...</small>
        </div>
      </div>
    </div>
    <div class="form-group">
      <label>Описание изображения</label>
      <input type="text" v-model="productForm.image_description">
    </div>
    <div class="form-group additional-images-group">
      <label>Дополнительные изображения и видео</label>
      <div class="additional-images-container">
        <div class="additional-images-list">
          <div v-for="(image, index) in productForm.additionalImages" :key="index"
               class="additional-image-item">
            <img :src="'../' + image" :alt="productForm.name"
                 class="additional-image-preview">
            <button type="button" @click="removeAdditionalImage(index)"
                    class="remove-additional-image-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="additional-videos-list" style="margin-top: 15px;"
             v-if="productForm.additionalVideos && productForm.additionalVideos.length > 0">
          <div v-for="(video, index) in productForm.additionalVideos"
               :key="'video-' + index" class="additional-video-item">
            <video :src="'../' + video" controls
                   class="additional-video-preview"></video>
            <button type="button" @click="removeAdditionalVideo(index)"
                    class="remove-additional-image-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="add-additional-images" v-if="editingProduct">
          <input ref="additionalImagesInput" type="file"
                 @change="handleAdditionalImagesSelect" accept="image/*,video/*" multiple
                 style="display: none;">
          <button type="button" @click="triggerAdditionalImagesUpload"
                  class="btn btn-secondary">
            <i class="fas fa-plus"></i>
            Добавить изображения и видео
          </button>
        </div>
        <div v-else class="help-text"
             style="padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
          <i class="fas fa-info-circle"></i>
          <p style="margin-top: 5px;">Сохраните товар, чтобы добавлять дополнительные
            изображения и видео</p>
        </div>
      </div>
    </div>
    <div class="form-actions mobile">
      <button type="submit" class="btn btn-primary">
        {{ editingProduct ? 'Сохранить изменения' : 'Добавить товар' }}
      </button>
      <button type="button" @click="closeModal" class="btn btn-secondary">Отмена</button>
    </div>
  </form>

</template>

<style scoped>

</style>