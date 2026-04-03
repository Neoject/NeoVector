export const ProductForm = {
  data() {
    return {
      productForm: {
        name: '', description: '', peculiarities: [], material: '',
        price: '', price_sale: '', category: '', product_type_id: null,
        image: '', image_description: '', additionalImages: [], additionalVideos: [],
      },
      editingProduct: null,
      newPeculiarity: '',
      selectOpen: false,
      selectedFile: null,
      isUploading: false,
      productTypes: [],
      uploadProgress: 0,
      uploadSuccess: false,
      uploadError: false,
      uploadErrorMessage: '',
      uploadXhr: null,
    }
  },
  methods: {
    async saveProduct() {
      const products = this.$root.products
      try {
        const formData = new FormData()
        if (this.editingProduct) {
          formData.append('action', 'update_product')
          formData.append('id', this.editingProduct.id)
          formData.append('name', this.productForm.name)
          formData.append('description', this.productForm.description)
          formData.append('peculiarities', JSON.stringify(this.productForm.peculiarities))
          formData.append('material', this.productForm.material)
          formData.append('price', this.productForm.price)
          formData.append('price_sale', this.productForm.price_sale || '')
          formData.append('category', this.productForm.category)
          formData.append('product_type_id', this.productForm.product_type_id || '')
          formData.append('image', this.productForm.image)
          formData.append('image_description', this.productForm.image_description)
          if (this.selectedFile) formData.append('product_image', this.selectedFile)
          const response = await fetch('../api.php', { method: 'POST', body: formData, credentials: 'same-origin' })
          if (response.ok) {
            const payload = await response.json()
            const index = products.findIndex(p => p.id === this.editingProduct.id)
            if (index !== -1) {
              products[index] = {
                ...products[index],
                name: this.productForm.name, description: this.productForm.description,
                peculiarities: this.productForm.peculiarities, material: this.productForm.material,
                price: parseInt(this.productForm.price), price_sale: parseInt(this.productForm.price_sale),
                category: this.productForm.category,
                product_type_id: this.productForm.product_type_id ? parseInt(this.productForm.product_type_id) : null,
                image: payload?.image ? payload.image : products[index].image,
              }
            }
            if (typeof this.update === 'function') this.update()
          } else {
            const errorData = await response.json()
            console.error('Failed to update product:', errorData.error || 'Unknown error')
            alert('Ошибка при обновлении товара')
            return
          }
        } else {
          formData.append('action', 'add_product')
          formData.append('name', this.productForm.name)
          formData.append('description', this.productForm.description)
          formData.append('peculiarities', JSON.stringify(this.productForm.peculiarities))
          formData.append('material', this.productForm.material)
          formData.append('price', this.productForm.price)
          formData.append('price_sale', this.productForm.price_sale || '')
          formData.append('category', this.productForm.category)
          formData.append('product_type_id', this.productForm.product_type_id || '')
          formData.append('image', this.productForm.image || '')
          formData.append('image_description', this.productForm.image_description || '')
          if (this.selectedFile) formData.append('product_image', this.selectedFile)
          const response = await fetch('../api.php', { method: 'POST', body: formData, credentials: 'same-origin' })
          if (response.ok) {
            const result = await response.json()
            products.push({
              id: result.id, name: this.productForm.name, description: this.productForm.description,
              peculiarities: this.productForm.peculiarities, material: this.productForm.material,
              price: parseInt(this.productForm.price), price_sale: parseInt(this.productForm.price_sale),
              category: this.productForm.category,
              product_type_id: this.productForm.product_type_id ? parseInt(this.productForm.product_type_id) : null,
              image: result?.image ? result.image : '',
            })
          } else {
            const errorData = await response.json()
            console.error('Failed to add product:', errorData.error || 'Unknown error')
            alert('Ошибка при добавлении товара')
            return
          }
        }
        if (this.selectedFile && this.$refs.fileInput) { this.selectedFile = null; this.$refs.fileInput.value = '' }
        this.changePage('admin')
        this.closeModal()
      } catch (error) {
        console.error('Error saving product:', error)
        alert('Ошибка при сохранении товара')
      }
    },
    addPeculiarity() {
      if (this.newPeculiarity.trim()) { this.productForm.peculiarities.push(this.newPeculiarity.trim()); this.newPeculiarity = '' }
    },
    removePeculiarity(index) { this.productForm.peculiarities.splice(index, 1) },
    onSelectFocus() { this.selectOpen = true },
    onSelectBlur() { setTimeout(() => { this.selectOpen = false }, 200) },
    onSelectChange() { this.selectOpen = false },
    onSelectClick() { this.selectOpen = !this.selectOpen },
    onSelectMouseDown() { this.selectOpen = true },
    triggerFileUpload() { this.$refs.fileInput?.click() },
    triggerAdditionalImagesUpload() { this.$refs.additionalImagesInput?.click() },
    async handleFileSelect(event) {
      const file = event.target.files[0]
      if (!file) return
      const isVideo = file.type.startsWith('video/')
      const maxSize = isVideo ? 256 * 1024 * 1024 : 64 * 1024 * 1024
      if (file.size > maxSize) { alert(`Размер файла не должен превышать ${isVideo ? '256MB' : '64MB'}`); event.target.value = ''; return }
      this.selectedFile = file
      const objectURL = URL.createObjectURL(file)
      this.productForm.image = objectURL
      this.isUploading = true; this.uploadProgress = 0; this.uploadSuccess = false; this.uploadError = false; this.uploadErrorMessage = ''
      try {
        await this.uploadMainFile(file)
        URL.revokeObjectURL(objectURL)
        this.uploadSuccess = true; this.isUploading = false
        setTimeout(() => { this.uploadSuccess = false }, 2000)
      } catch (e) {
        console.error('Upload error:', e)
        URL.revokeObjectURL(objectURL)
        this.uploadError = true; this.uploadErrorMessage = e.message || 'Ошибка загрузки'; this.isUploading = false
        alert('Ошибка загрузки файла: ' + this.uploadErrorMessage)
      }
    },
    cancelUpload() {
      if (this.uploadXhr) this.uploadXhr.abort()
      this.isUploading = false; this.uploadProgress = 0; this.uploadError = false; this.uploadSuccess = false
    },
    resetUploadStatus() { this.uploadSuccess = false; this.uploadError = false; this.uploadErrorMessage = '' },
    getImageUrl() {
      if (this.selectedFile) return this.productForm.image
      if (this.productForm.image) return '../' + this.productForm.image
      return ''
    },
    isVideoPreview(url) {
      if (!url || typeof url !== 'string') return false
      return url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || url.includes('video')
    },
    removeImage() { this.selectedFile = null; this.productForm.image = '' },
    async removeAdditionalImage(index) {
      if (!confirm('Вы уверены, что хотите удалить это изображение?')) return
      const imagePath = this.productForm.additionalImages[index]
      const products = this.$root.products
      try {
        const response = await fetch(`../api.php?action=get_image_id&product_id=${this.editingProduct.id}&image_path=${encodeURIComponent(imagePath)}`, { credentials: 'same-origin' })
        if (response.ok) {
          const result = await response.json()
          if (result.image_id) {
            const formData = new FormData()
            formData.append('action', 'delete_product_image'); formData.append('image_id', result.image_id)
            const dr = await fetch('../api.php', { method: 'POST', body: formData, credentials: 'same-origin' })
            if (dr.ok) {
              this.productForm.additionalImages.splice(index, 1)
              const pi = products.findIndex(p => p.id === this.editingProduct.id)
              if (pi !== -1) products[pi].additional_images = [...this.productForm.additionalImages]
            } else { alert('Ошибка удаления изображения') }
          }
        }
      } catch (error) { console.error('Error deleting additional image:', error); alert('Ошибка при удалении изображения') }
    },
    async removeAdditionalVideo(index) {
      if (!confirm('Вы уверены, что хотите удалить это видео?')) return
      const videoPath = this.productForm.additionalVideos[index]
      const products = this.$root.products
      try {
        const response = await fetch(`../api.php?action=get_image_id&product_id=${this.editingProduct.id}&image_path=${encodeURIComponent(videoPath)}`, { credentials: 'same-origin' })
        if (response.ok) {
          const result = await response.json()
          if (result.image_id) {
            const formData = new FormData()
            formData.append('action', 'delete_product_image'); formData.append('image_id', result.image_id)
            const dr = await fetch('../api.php', { method: 'POST', body: formData, credentials: 'same-origin' })
            if (dr.ok) {
              this.productForm.additionalVideos.splice(index, 1)
              const pi = products.findIndex(p => p.id === this.editingProduct.id)
              if (pi !== -1) products[pi].additional_videos = [...this.productForm.additionalVideos]
            } else { alert('Ошибка удаления видео') }
          }
        }
      } catch (error) { console.error('Error deleting additional video:', error); alert('Ошибка при удалении видео') }
    },
    async handleAdditionalImagesSelect(event) {
      const files = Array.from(event.target.files)
      if (!files.length) return
      const products = this.$root.products
      for (const file of files) {
        const isVideo = file.type.startsWith('video/')
        const maxSize = isVideo ? 256 * 1024 * 1024 : 64 * 1024 * 1024
        if (file.size > maxSize) { alert(`Файл "${file.name}" слишком большой. Максимальный размер: ${isVideo ? '256MB' : '64MB'}`); event.target.value = ''; return }
      }
      try {
        const formData = new FormData()
        formData.append('action', 'add_product_images'); formData.append('product_id', this.editingProduct.id)
        files.forEach(f => formData.append('additional_images[]', f))
        const response = await fetch('../api.php', { method: 'POST', body: formData, credentials: 'same-origin' })
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            if (result.uploaded_images) this.productForm.additionalImages.push(...result.uploaded_images)
            if (result.uploaded_videos) {
              if (!this.productForm.additionalVideos) this.productForm.additionalVideos = []
              this.productForm.additionalVideos.push(...result.uploaded_videos)
            }
            const pi = products.findIndex(p => p.id === this.editingProduct.id)
            if (pi !== -1) {
              if (result.uploaded_images) products[pi].additional_images = [...(products[pi].additional_images || []), ...result.uploaded_images]
              if (result.uploaded_videos) products[pi].additional_videos = [...(products[pi].additional_videos || []), ...result.uploaded_videos]
            }
          } else { alert('Ошибка загрузки: ' + (result.error || 'Неизвестная ошибка')) }
        } else { const e = await response.json(); alert('Ошибка загрузки: ' + (e.error || 'Неизвестная ошибка')) }
      } catch (error) { console.error('Error uploading additional images:', error); alert('Ошибка при загрузке изображений') }
      if (this.$refs.additionalImagesInput) this.$refs.additionalImagesInput.value = ''
    },
  },
}
