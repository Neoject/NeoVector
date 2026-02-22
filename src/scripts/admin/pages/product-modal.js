NV.ready(function registerProductModalComponent() {
    if (!NV.admin) {
        setTimeout(registerProductModalComponent, 10);
        return;
    }
    NV.admin.component('product-modal-view', {
        template: '#product-modal-template',
        computed: {
            productForm: {
                get() {
                    return this.$root.productForm || {};
                },
                set(value) {
                    if (this.$root.productForm !== undefined) {
                        this.$root.productForm = value;
                    }
                }
            },
            editingProduct() {
                return this.$root.editingProduct;
            },
            newPeculiarity: {
                get() {
                    return this.$root.newPeculiarity || '';
                },
                set(value) {
                    if (this.$root.newPeculiarity !== undefined) {
                        this.$root.newPeculiarity = value;
                    }
                }
            },
            categories() {
                return this.$root.categories || [];
            },
            selectOpen() {
                return this.$root.selectOpen;
            },
            selectedFile() {
                return this.$root.selectedFile;
            },
            isUploading() {
                return this.$root.isUploading;
            },
            uploadSuccess() {
                return this.$root.uploadSuccess;
            },
            uploadError() {
                return this.$root.uploadError;
            },
            uploadProgress() {
                return this.$root.uploadProgress;
            },
            uploadErrorMessage() {
                return this.$root.uploadErrorMessage;
            }
        },
        methods: {
            closeModal() {
                if (typeof this.$root.closeModal === 'function') {
                    this.$root.closeModal();
                }
            },
            saveProduct() {
                if (typeof this.$root.saveProduct === 'function') {
                    this.$root.saveProduct();
                }
            },
            removePeculiarity(index) {
                if (typeof this.$root.removePeculiarity === 'function') {
                    this.$root.removePeculiarity(index);
                }
            },
            addPeculiarity() {
                if (typeof this.$root.addPeculiarity === 'function') {
                    this.$root.addPeculiarity();
                }
            },
            onSelectFocus() {
                if (typeof this.$root.onSelectFocus === 'function') {
                    this.$root.onSelectFocus();
                }
            },
            onSelectBlur() {
                if (typeof this.$root.onSelectBlur === 'function') {
                    this.$root.onSelectBlur();
                }
            },
            onSelectChange() {
                if (typeof this.$root.onSelectChange === 'function') {
                    this.$root.onSelectChange();
                }
            },
            onSelectClick() {
                if (typeof this.$root.onSelectClick === 'function') {
                    this.$root.onSelectClick();
                }
            },
            onSelectMouseDown(e) {
                if (typeof this.$root.onSelectMouseDown === 'function') {
                    this.$root.onSelectMouseDown(e);
                }
            },
            triggerFileUpload() {
                if (this.$refs.fileInput) {
                    this.$refs.fileInput.click();
                }
            },
            handleFileSelect(e) {
                if (typeof this.$root.handleFileSelect === 'function') {
                    this.$root.handleFileSelect(e);
                }
            },
            cancelUpload() {
                if (typeof this.$root.cancelUpload === 'function') {
                    this.$root.cancelUpload();
                }
            },
            resetUploadStatus() {
                if (typeof this.$root.resetUploadStatus === 'function') {
                    this.$root.resetUploadStatus();
                }
            },
            getImageUrl() {
                if (typeof this.$root.getImageUrl === 'function') {
                    return this.$root.getImageUrl();
                }
                return '';
            },
            isVideoPreview(url) {
                if (typeof this.$root.isVideoPreview === 'function') {
                    return this.$root.isVideoPreview(url);
                }
                return false;
            },
            removeImage() {
                if (typeof this.$root.removeImage === 'function') {
                    this.$root.removeImage();
                }
            },
            removeAdditionalImage(index) {
                if (typeof this.$root.removeAdditionalImage === 'function') {
                    this.$root.removeAdditionalImage(index);
                }
            },
            removeAdditionalVideo(index) {
                if (typeof this.$root.removeAdditionalVideo === 'function') {
                    this.$root.removeAdditionalVideo(index);
                }
            },
            handleAdditionalImagesSelect(e) {
                if (typeof this.$root.handleAdditionalImagesSelect === 'function') {
                    this.$root.handleAdditionalImagesSelect(e);
                }
            },
            triggerAdditionalImagesUpload() {
                if (this.$refs.additionalImagesInput) {
                    this.$refs.additionalImagesInput.click();
                }
            }
        }
    });
});
