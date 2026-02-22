const Product = {
    data() {
        return {
            showAddProduct: false,
            editingProduct: null,
            productForm: {
                name: '',
                description: '',
                peculiarities: [],
                material: '',
                price: '',
                price_sale: '',
                category: '',
                image: '',
                image_description: '',
                additionalImages: [],
                additionalVideos: []
            },
            aiGeneratingDescription: false,
            aiGenerationError: '',
            newPeculiarity: '',
            selectedFile: null,
            draggingProductId: null,
            productDragScrollInterval: null,
            products: [],
            contextMenuProduct: null,
            productOptionTypes: [],
            newOptionTypeName: '',
            optionsLoading: false,
            optionsError: '',
            optionsSuccess: '',
            isUploading: false,
            uploadProgress: 0,
            uploadSuccess: false,
            uploadError: false,
            uploadErrorMessage: '',
            uploadXhr: null,
            selectedProducts: []
        }
    },
    computed: {
        truncatedProducts() {
            return this.products.map(product => ({
                ...product,
                truncatedName: this.truncateText(product.name, 30),
                truncatedDescription: this.truncateText(product.description, 80)
            }));
        }
    },
    methods: {
        startDragProduct(product, event) {
            this.draggingProductId = product.id;
            event.dataTransfer.effectAllowed = 'move';
            this.handleProductDragOverBound = (e) => this.handleProductDragOver(e);
            this.handleProductDragEndBound = () => this.handleProductDragEnd();
            document.addEventListener('dragover', this.handleProductDragOverBound);
            document.addEventListener('dragend', this.handleProductDragEndBound);
        },
        endDragProduct() {
            this.cleanupProductDrag();
        },
        handleProductDragEnd() {
            this.cleanupProductDrag();
        },
        cleanupProductDrag() {
            this.draggingProductId = null;

            if (this.handleProductDragOverBound) {
                document.removeEventListener('dragover', this.handleProductDragOverBound);
                this.handleProductDragOverBound = null;
            }

            if (this.handleProductDragEndBound) {
                document.removeEventListener('dragend', this.handleProductDragEndBound);
                this.handleProductDragEndBound = null;
            }

            this.stopProductDragScroll();
        },
        handleProductDragOver(event) {
            if (!this.draggingProductId) return;
            
            const scrollThreshold = 100;
            const scrollSpeed = 10;
            const windowHeight = window.innerHeight;
            const scrollY = window.scrollY || window.pageYOffset;
            const mouseY = event.clientY;

            if (mouseY < scrollThreshold && scrollY > 0) {
                this.startProductDragScroll('up', scrollSpeed);
            }
            else if (mouseY > windowHeight - scrollThreshold) {
                const maxScroll = document.documentElement.scrollHeight - windowHeight;

                if (scrollY < maxScroll) {
                    this.startProductDragScroll('down', scrollSpeed);
                } else {
                    this.stopProductDragScroll();
                }
            } else {
                this.stopProductDragScroll();
            }
        },
        startProductDragScroll(direction, speed) {
            if (this.productDragScrollInterval) {
                this.stopProductDragScroll();
            }
            
            this.productDragScrollInterval = setInterval(() => {
                if (direction === 'up') {
                    window.scrollBy(0, -speed);
                } else {
                    window.scrollBy(0, speed);
                }
            }, 16);
        },
        stopProductDragScroll() {
            if (this.productDragScrollInterval) {
                clearInterval(this.productDragScrollInterval);
                this.productDragScrollInterval = null;
            }
        },
        dropProduct(targetProduct, event) {
            event.preventDefault();
            if (this.draggingProductId === targetProduct.id) {
                this.cleanupProductDrag();
                return;
            }

            const draggedIndex = this.products.findIndex(p => p.id === this.draggingProductId);
            const targetIndex = this.products.findIndex(p => p.id === targetProduct.id);

            if (draggedIndex === -1 || targetIndex === -1) {
                this.cleanupProductDrag();
                return;
            }

            const [dragged] = this.products.splice(draggedIndex, 1);
            this.products.splice(targetIndex, 0, dragged);
            this.saveProductsOrder().then(r => null);
        },
        async saveProductsOrder() {
            try {
                const order = this.products.map(p => p.id);
                const formData = new FormData();
                formData.append('action', 'save_products_order');
                formData.append('products_order', JSON.stringify(order));
                const response = await fetch('../api.php', { method: 'POST', body: formData, credentials: 'same-origin' });
                const result = await response.json();
                if (!response.ok || result.error) {
                    throw new Error(result.error || 'Ошибка сохранения порядка');
                }
            } catch (e) {
                console.error('Ошибка сохранения порядка товаров:', e);
            }
        },
        openAddProductModal() {
            if (this.isMobileDevice && !this.isMobileDevice()) {
                if (this.minimizedModals && this.minimizedModals['productModal']) {
                    this.restoreModal('productModal');
                }
                this.showAddProduct = true;
                if (this.closeMobileMenu) {
                    this.closeMobileMenu();
                }
                if (this.turnTextareaResize) {
                    this.turnTextareaResize();
                }
                this.$nextTick(() => {
                    if (this.applyModalSize) {
                        this.applyModalSize('productModal');
                    }
                });
            } else {
                if (this.changePage) {
                    this.changePage('product');
                }
            }
        },
        editProduct(product) {
            this.editingProduct = product;
            this.productForm = {
                name: product.name,
                description: product.description || '',
                peculiarities: product.peculiarities ? [...product.peculiarities] : [],
                material: product.material,
                price: product.price,
                price_sale: product.price_sale || '',
                category: product.category,
                image: product.image,
                additionalImages: product.additional_images ? [...product.additional_images] : [],
                additionalVideos: product.additional_videos ? [...product.additional_videos] : []
            };

            if (this.isMobileDevice && !this.isMobileDevice()) {
                if (this.minimizedModals && this.minimizedModals['productModal']) {
                    this.restoreModal('productModal');
                }
                if (this.turnTextareaResize) {
                    this.turnTextareaResize();
                }
                this.$nextTick(() => {
                    if (this.applyModalSize) {
                        this.applyModalSize('productModal');
                    }
                });
            } else {
                if (this.changePage) {
                    this.changePage('product');
                    window.scrollTo(0, 0);
                }
            }
        },
        async saveProduct() {
            try {
                const formData = new FormData();

                if (this.editingProduct) {
                    formData.append('action', 'update_product');
                    formData.append('id', this.editingProduct.id);
                    formData.append('name', this.productForm.name);
                    formData.append('description', this.productForm.description);
                    formData.append('peculiarities', JSON.stringify(this.productForm.peculiarities));
                    formData.append('material', this.productForm.material);
                    formData.append('price', this.productForm.price);
                    formData.append('price_sale', this.productForm.price_sale || '');
                    formData.append('category', this.productForm.category);
                    formData.append('image', this.productForm.image);
                    formData.append('image_description', this.productForm.image_description || '');

                    if (this.selectedFile) {
                        formData.append('product_image', this.selectedFile);
                    }

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });

                    if (response.ok) {
                        const payload = await response.json();
                        const index = this.products.findIndex(p => p.id === this.editingProduct.id);

                        if (index !== -1) {
                            this.products[index] = {
                                ...this.products[index],
                                name: this.productForm.name,
                                description: this.productForm.description,
                                peculiarities: this.productForm.peculiarities,
                                material: this.productForm.material,
                                price: parseInt(this.productForm.price),
                                price_sale: parseInt(this.productForm.price_sale),
                                category: this.productForm.category,
                                image: (payload && payload.image) ? payload.image : this.products[index].image
                            };
                        }

                        if (this.update) {
                            this.update();
                        }
                    } else {
                        const errorData = await response.json();
                        console.error('Failed to update product:', errorData.error || 'Unknown error');
                        alert('Ошибка при обновлении товара');
                        return;
                    }
                } else {
                    formData.append('action', 'add_product');
                    formData.append('name', this.productForm.name);
                    formData.append('description', this.productForm.description);
                    formData.append('peculiarities', JSON.stringify(this.productForm.peculiarities));
                    formData.append('material', this.productForm.material);
                    formData.append('price', this.productForm.price);
                    formData.append('price_sale', this.productForm.price_sale || '');
                    formData.append('category', this.productForm.category);
                    formData.append('image', this.productForm.image || '');
                    formData.append('image_description', this.productForm.image_description || '');

                    if (this.selectedFile) {
                        formData.append('product_image', this.selectedFile);
                    }

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });

                    if (response.ok) {
                        const result = await response.json();
                        this.products.push({
                            id: result.id,
                            name: this.productForm.name,
                            description: this.productForm.description,
                            peculiarities: this.productForm.peculiarities,
                            material: this.productForm.material,
                            price: parseInt(this.productForm.price),
                            price_sale: parseInt(this.productForm.price_sale),
                            category: this.productForm.category,
                            image: result && result.image ? result.image : ''
                        });
                    } else {
                        const errorData = await response.json();
                        console.error('Failed to add product:', errorData.error || 'Unknown error');
                        alert('Ошибка при добавлении товара');
                        return;
                    }
                }

                if (this.selectedFile) {
                    this.selectedFile = null;
                    if (this.$refs && this.$refs.fileInput) {
                        this.$refs.fileInput.value = '';
                    }
                }

                if (this.changePage) {
                    this.changePage('admin');
                }
                if (this.closeModal) {
                    this.closeModal();
                }
            } catch (error) {
                console.error('Error saving product:', error);
                alert('Ошибка при сохранении товара');
            }
        },
        async generateDescriptionWithAI() {
            if (this.aiGeneratingDescription) {
                return;
            }

            if (!this.productForm.name || !this.productForm.name.trim()) {
                this.aiGenerationError = 'Сначала введите название товара.';
                return;
            }

            this.aiGenerationError = '';
            this.aiGeneratingDescription = true;

            try {
                const formData = new FormData();
                formData.append('action', 'generate_product_description');
                formData.append('name', this.productForm.name.trim());

                const response = await fetch('../api.php', {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok || !data.description) {
                    throw new Error(data.error || 'Не удалось получить описание');
                }

                this.productForm.description = data.description.trim();
            } catch (error) {
                console.error('AI generation error:', error);
                this.aiGenerationError = error.message || 'Ошибка генерации описания';
            } finally {
                this.aiGeneratingDescription = false;
            }
        },
        closeModal(event) {
            this.showAddProduct = false;
            this.editingProduct = null;
            this.selectedFile = null;
            this.productForm = {
                name: '',
                description: '',
                peculiarities: [],
                material: '',
                price: '',
                price_sale: '',
                category: '',
                image: '',
                additionalImages: [],
                additionalVideos: []
            };
            this.aiGeneratingDescription = false;
            this.aiGenerationError = '';
            this.newPeculiarity = '';
            if (this.$refs && this.$refs.fileInput) {
                this.$refs.fileInput.value = '';
            }
            if (this.$refs && this.$refs.additionalImagesInput) {
                this.$refs.additionalImagesInput.value = '';
            }

            if (this.minimizedModals && this.minimizedModals['productModal']) {
                delete this.minimizedModals['productModal'];
            }
            if (this.maximizedModals && this.maximizedModals['productModal']) {
                delete this.maximizedModals['productModal'];
            }

            if (this.isMobileDevice && !this.isMobileDevice()) {
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT' || activeElement.contentEditable === 'true')) {
                    return;
                }
                if (event && event.target !== event.currentTarget) {
                    return;
                }
            } else {
                if (this.changePage) {
                    this.changePage('admin');
                    window.scrollTo(0, 0);
                }
            }
        },
        addPeculiarity() {
            if (this.newPeculiarity.trim()) {
                this.productForm.peculiarities.push(this.newPeculiarity.trim());
                this.newPeculiarity = '';
            }
        },
        removePeculiarity(index) {
            this.productForm.peculiarities.splice(index, 1);
        },
        async getAllProducts() {
            try {
                const response = await fetch('../api.php?action=products', { credentials: 'same-origin' });
                if (response.ok) {
                    const data = await response.json();
                    this.products = data;
                    this.$nextTick(() => {
                        if (this.initColumnResize) {
                            this.initColumnResize();
                        }
                    });
                } else {
                    console.error('Failed to load products:', response.status, response.statusText);
                }
            } catch (error) {
                console.error('Error loading products:', error);
            }
        },
        triggerFileUpload() {
            if (this.$refs && this.$refs.fileInput) {
                this.$refs.fileInput.click();
            }
        },
        async handleFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;

            const isVideo = file.type.startsWith('video/');
            const maxSize = isVideo ? (256 * 1024 * 1024) : (64 * 1024 * 1024);
            const sizeLimit = isVideo ? '256MB' : '64MB';

            if (file.size > maxSize) {
                alert(`Размер файла не должен превышать ${sizeLimit}`);
                event.target.value = '';
                return;
            }

            this.selectedFile = file;
            const objectURL = URL.createObjectURL(file);
            this.productForm.image = objectURL;
            this.isUploading = true;
            this.uploadProgress = 0;
            this.uploadSuccess = false;
            this.uploadError = false;
            this.uploadErrorMessage = '';

            try {
                await this.uploadMainFile(file);
                URL.revokeObjectURL(objectURL);
                this.uploadSuccess = true;
                this.isUploading = false;
                setTimeout(() => { this.uploadSuccess = false; }, 2000);
            } catch (e) {
                console.error('Upload error:', e);
                URL.revokeObjectURL(objectURL);
                this.uploadError = true;
                this.uploadErrorMessage = e.message || 'Ошибка загрузки';
                this.isUploading = false;
                alert('Ошибка загрузки файла: ' + this.uploadErrorMessage);
            }
        },
        uploadMainFile(file) {
            return new Promise((resolve, reject) => {
                try {
                    const fd = new FormData();
                    fd.append('action', 'upload_product_media');
                    fd.append('file', file);

                    const xhr = new XMLHttpRequest();
                    this.uploadXhr = xhr;

                    xhr.open('POST', '../api.php', true);
                    xhr.withCredentials = true;

                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) {
                            this.uploadProgress = Math.round((e.loaded / e.total) * 100);
                        }
                    };

                    xhr.onload = () => {
                        this.uploadXhr = null;

                        try {
                            if (xhr.status >= 200 && xhr.status < 300) {
                                let res;
                                try {
                                    res = JSON.parse(xhr.responseText || '{}');
                                } catch (parseError) {
                                    console.error('JSON parse error:', parseError);
                                    reject(new Error('Ошибка парсинга ответа сервера'));
                                    return;
                                }

                                if (res && res.success) {
                                    if (res.url) {
                                        this.productForm.image = res.url;
                                    }
                                    this.selectedFile = null;
                                    resolve(res);
                                } else {
                                    const errorMsg = res.error || 'Неизвестная ошибка';
                                    reject(new Error(errorMsg));
                                }
                            } else {
                                let errorMsg = 'Ошибка загрузки';
                                try {
                                    const errorRes = JSON.parse(xhr.responseText || '{}');
                                    if (errorRes.error) {
                                        errorMsg = errorRes.error;
                                    }
                                } catch (_) {
                                    errorMsg = `Ошибка сервера (${xhr.status}): ${xhr.statusText}`;
                                }
                                reject(new Error(errorMsg));
                            }
                        } catch (error) {
                            console.error('Error in xhr.onload:', error);
                            reject(new Error('Ошибка обработки ответа: ' + error.message));
                        }
                    };

                    xhr.onerror = () => {
                        this.uploadXhr = null;
                        reject(new Error('Ошибка сети при загрузке файла'));
                    };

                    xhr.onabort = () => {
                        this.uploadXhr = null;
                        reject(new Error('Загрузка отменена'));
                    };

                    xhr.ontimeout = () => {
                        this.uploadXhr = null;
                        reject(new Error('Превышено время ожидания загрузки'));
                    };

                    xhr.timeout = 300000;
                    xhr.send(fd);
                } catch (error) {
                    this.uploadXhr = null;
                    reject(new Error('Ошибка создания запроса: ' + error.message));
                }
            });
        },
        cancelUpload() {
            if (this.uploadXhr) {
                this.uploadXhr.abort();
            }
            this.isUploading = false;
            this.uploadProgress = 0;
            this.uploadError = false;
            this.uploadSuccess = false;
        },
        resetUploadStatus() {
            this.uploadSuccess = false;
            this.uploadError = false;
            this.uploadErrorMessage = '';
        },
        removeImage() {
            this.selectedFile = null;
            this.productForm.image = '';
            if (this.$refs && this.$refs.fileInput) {
                this.$refs.fileInput.value = '';
            }
        },
        getImageUrl() {
            if (this.selectedFile) {
                return this.productForm.image;
            } else if (this.productForm.image) {
                return '../' + this.productForm.image;
            }
            return '';
        },
        isVideoPreview(url) {
            if (!url || typeof url !== 'string') {
                return false;
            }
            return url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || url.includes('video');
        },
        isVideo(url) {
            if (!url || typeof url !== 'string') {
                return false;
            }
            return url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || url.includes('video');
        },
        triggerAdditionalImagesUpload() {
            if (this.$refs && this.$refs.additionalImagesInput) {
                this.$refs.additionalImagesInput.click();
            }
        },
        async handleAdditionalImagesSelect(event) {
            const files = Array.from(event.target.files);
            if (files.length === 0) return;

            for (const file of files) {
                const isVideo = file.type.startsWith('video/');
                const maxSize = isVideo ? (256 * 1024 * 1024) : (64 * 1024 * 1024);
                const sizeLimit = isVideo ? '256MB' : '64MB';

                if (file.size > maxSize) {
                    alert(`Файл "${file.name}" слишком большой. Максимальный размер: ${sizeLimit}`);
                    event.target.value = '';
                    return;
                }
            }

            try {
                const formData = new FormData();
                formData.append('action', 'add_product_images');
                formData.append('product_id', this.editingProduct.id);

                files.forEach((file, index) => {
                    formData.append('additional_images[]', file);
                });

                const response = await fetch('../api.php', {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        if (result.uploaded_images) {
                            this.productForm.additionalImages.push(...result.uploaded_images);
                        }
                        if (result.uploaded_videos) {
                            if (!this.productForm.additionalVideos) {
                                this.productForm.additionalVideos = [];
                            }
                            this.productForm.additionalVideos.push(...result.uploaded_videos);
                        }

                        const productIndex = this.products.findIndex(p => p.id === this.editingProduct.id);
                        if (productIndex !== -1) {
                            if (result.uploaded_images) {
                                this.products[productIndex].additional_images = this.products[productIndex].additional_images ? [...this.products[productIndex].additional_images, ...result.uploaded_images] : result.uploaded_images;
                            }
                            if (result.uploaded_videos) {
                                this.products[productIndex].additional_videos = this.products[productIndex].additional_videos ? [...this.products[productIndex].additional_videos, ...result.uploaded_videos] : result.uploaded_videos;
                            }
                        }

                        console.log('Additional images and videos uploaded successfully');
                    } else {
                        alert('Ошибка загрузки: ' + (result.error || 'Неизвестная ошибка'));
                    }
                } else {
                    const errorData = await response.json();
                    alert('Ошибка загрузки: ' + (errorData.error || 'Неизвестная ошибка'));
                }
            } catch (error) {
                console.error('Error uploading additional images:', error);
                alert('Ошибка при загрузке изображений');
            }

            if (this.$refs && this.$refs.additionalImagesInput) {
                this.$refs.additionalImagesInput.value = '';
            }
        },
        async removeAdditionalImage(index) {
            if (confirm('Вы уверены, что хотите удалить это изображение?')) {
                const imagePath = this.productForm.additionalImages[index];

                try {
                    const response = await fetch(`../api.php?action=get_image_id&product_id=${this.editingProduct.id}&image_path=${encodeURIComponent(imagePath)}`, { credentials: 'same-origin' });
                    if (response.ok) {
                        const result = await response.json();
                        if (result.image_id) {
                            const formData = new FormData();
                            formData.append('action', 'delete_product_image');
                            formData.append('image_id', result.image_id);

                            const deleteResponse = await fetch('../api.php', {
                                method: 'POST',
                                body: formData,
                                credentials: 'same-origin'
                            });

                            if (deleteResponse.ok) {
                                this.productForm.additionalImages.splice(index, 1);

                                const productIndex = this.products.findIndex(p => p.id === this.editingProduct.id);
                                if (productIndex !== -1) {
                                    this.products[productIndex].additional_images = [...this.productForm.additionalImages];
                                }

                                console.log('Additional image deleted successfully');
                            } else {
                                alert('Ошибка удаления изображения');
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error deleting additional image:', error);
                    alert('Ошибка при удалении изображения');
                }
            }
        },
        async removeAdditionalVideo(index) {
            if (confirm('Вы уверены, что хотите удалить это видео?')) {
                const videoPath = this.productForm.additionalVideos[index];

                try {
                    const response = await fetch(`../api.php?action=get_image_id&product_id=${this.editingProduct.id}&image_path=${encodeURIComponent(videoPath)}`, { credentials: 'same-origin' });
                    if (response.ok) {
                        const result = await response.json();
                        if (result.image_id) {
                            const formData = new FormData();
                            formData.append('action', 'delete_product_image');
                            formData.append('image_id', result.image_id);

                            const deleteResponse = await fetch('../api.php', {
                                method: 'POST',
                                body: formData,
                                credentials: 'same-origin'
                            });

                            if (deleteResponse.ok) {
                                this.productForm.additionalVideos.splice(index, 1);

                                const productIndex = this.products.findIndex(p => p.id === this.editingProduct.id);
                                if (productIndex !== -1) {
                                    this.products[productIndex].additional_videos = [...this.productForm.additionalVideos];
                                }

                                console.log('Additional video deleted successfully');
                            } else {
                                alert('Ошибка удаления видео');
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error deleting additional video:', error);
                    alert('Ошибка при удалении видео');
                }
            }
        },
        async loadProductOptions() {
            try {
                const response = await fetch('../api.php?action=product_options', { credentials: 'same-origin' });
                if (response.ok) {
                    const data = await response.json();
                    const incoming = Array.isArray(data.types) ? data.types : [];
                    this.productOptionTypes = incoming.length
                        ? incoming.map(type => ({
                            id: type.id || null,
                            name: type.name || '',
                            slug: type.slug || '',
                            values: Array.isArray(type.values) && type.values.length ? [...type.values] : ['']
                        }))
                        : this.getDefaultOptionTypes();
                } else {
                    this.productOptionTypes = this.getDefaultOptionTypes();
                }
                this.newOptionTypeName = '';
            } catch (error) {
                alert(`Error loading product options: ${error}`);
                this.productOptionTypes = this.getDefaultOptionTypes();
                this.newOptionTypeName = '';
            }
        },
        async saveProductOptions() {
            this.optionsLoading = true;
            this.optionsError = '';
            this.optionsSuccess = '';

            try {
                const preparedTypes = this.productOptionTypes.map(type => {
                    const name = type.name ? type.name.trim() : '';
                    const values = Array.isArray(type.values)
                        ? type.values
                            .map(value => value && value.trim())
                            .filter(Boolean)
                        : [];
                    return {
                        name,
                        values
                    };
                }).filter(type => type.name && type.values.length);

                if (!preparedTypes.length) {
                    this.optionsError = 'Добавьте хотя бы один тип опций и его значения';
                    this.optionsLoading = false;
                    return;
                }

                const formData = new FormData();
                formData.append('action', 'save_product_options');
                formData.append('option_types', JSON.stringify(preparedTypes));

                const response = await fetch('../api.php', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        this.optionsSuccess = 'Опции успешно сохранены';
                        setTimeout(() => {
                            this.optionsSuccess = '';
                        }, 3000);
                    } else {
                        this.optionsError = result.error || 'Ошибка сохранения';
                    }
                } else {
                    const errorData = await response.json();
                    this.optionsError = errorData.error || 'Ошибка сохранения';
                }
            } catch (error) {
                console.error('Error saving product options:', error);
                this.optionsError = 'Ошибка сохранения опций';
            }

            this.optionsLoading = false;
        },
        addOptionType() {
            const name = this.newOptionTypeName.trim();
            if (!name) {
                this.optionsError = 'Введите название типа опций';
                return;
            }
            this.productOptionTypes.push({
                id: null,
                name,
                slug: '',
                values: ['']
            });
            this.newOptionTypeName = '';
            this.optionsError = '';
        },
        removeOptionType(index) {
            this.productOptionTypes.splice(index, 1);
        },
        moveOptionTypeUp(typeIndex) {
            if (typeIndex <= 0 || typeIndex >= this.productOptionTypes.length) {
                return;
            }
            const temp = this.productOptionTypes[typeIndex];
            this.productOptionTypes[typeIndex] = this.productOptionTypes[typeIndex - 1];
            this.productOptionTypes[typeIndex - 1] = temp;
        },
        moveOptionTypeDown(typeIndex) {
            if (typeIndex < 0 || typeIndex >= this.productOptionTypes.length - 1) {
                return;
            }
            const temp = this.productOptionTypes[typeIndex];
            this.productOptionTypes[typeIndex] = this.productOptionTypes[typeIndex + 1];
            this.productOptionTypes[typeIndex + 1] = temp;
        },
        addOptionValue(typeIndex) {
            if (!this.productOptionTypes[typeIndex]) {
                return;
            }
            this.productOptionTypes[typeIndex].values.push('');
        },
        removeOptionValue(typeIndex, valueIndex) {
            const optionType = this.productOptionTypes[typeIndex];
            optionType.values.splice(valueIndex, 1);
        },
        getDefaultOptionTypes() {
            return [
                {
                    id: null,
                    name: 'Размеры',
                    slug: 'sizes',
                    values: ['38', '40', '42', '44']
                },
                {
                    id: null,
                    name: 'Модели',
                    slug: 'models',
                    values: ['Apple', 'Samsung', 'Xiaomi', 'Honor']
                }
            ];
        },
        getProductName(url) {
            if (url === '/') {
                return 'Домашняя'
            } else {
                const id = url.split('id=')[1];
                let products = this.getObject(this.products);
                let name = '';

                for (let product in products) {
                    if (products[product].id === Number(id)) {
                        name = products[product].name;
                    }
                }

                if (name) {
                    return name;
                } else {
                    return url;
                }
            }
        },
        duplicateProduct(product) {
            const duplicatedProduct = {
                ...product,
                id: null,
                name: product.name + ' (копия)'
            };
            this.editProduct(duplicatedProduct);
        },
        selectProductFromMenu() {
            if (!this.contextMenuProduct) return;
            this.toggleProductSelection(this.contextMenuProduct.id);
            if (this.hideContextMenu) {
                this.hideContextMenu();
            }
        },
        toggleProductSelection(productId) {
            const index = this.selectedProducts.indexOf(productId);
            if (index > -1) {
                this.selectedProducts.splice(index, 1);
            } else {
                this.selectedProducts.push(productId);
            }
        },
        isProductSelected(productId) {
            return this.selectedProducts.includes(productId);
        },
        toggleSelectAll(event) {
            if (event.target.checked) {
                this.selectedProducts = this.products.map(p => p.id);
            } else {
                this.selectedProducts = [];
            }
        },
        clearSelection() {
            this.selectedProducts = [];
        },
        generateProductSlug() {
            // TODO
        },
        getObject(e) {
            return JSON.parse(JSON.stringify(e));
        }
    }
};

if (typeof window !== 'undefined') {
    window.Product = Product;
}
