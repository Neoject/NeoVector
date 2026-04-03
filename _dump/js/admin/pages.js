NV.ready(() => {
    const Values = {
        data() {
            return {
                mobileMenuOpen: false,
                _messages: [],
                _selectedMessage: null,
                uploadSuccess: false,
                uploadError: false,
                uploadErrorMessage: '',
                uploadXhr: null,
            }
        },
        computed: {
            messages: {
                get() {
                    return this.$root?._messages ?? [];
                },
                set(val) {
                    this.$root._messages = val;
                }
            },
            selectedMessage: {
                get() {
                    return this.$root?._selectedMessage ?? null;
                },
                set(val) {
                    this.$root._selectedMessage = val;
                }
            }
        },
        methods: {
            isMobileDevice() {
                return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            },
            formatDate(dateString) {
                if (!dateString) return '';
                const date = new Date(dateString);
                return date.toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            },
            async getMessages() {
                try {
                    const response = await fetch('../api.php?action=messages', { credentials: 'same-origin' });

                    if (!response.ok) return;

                    const res = await response.json();

                    if (res && res.success && res.data) {
                        this.messages = res.data;
                    } else if (Array.isArray(res)) {
                        this.messages = res;
                    } else {
                        this.messages = [];
                    }
                } catch (e) {
                    console.error('Error loading messages', e);
                }
            },
            changePage(page) {
                this.$root.page = page;
                this.$root.closeMobileMenu();

                const loader = document.getElementById('block_loader');
                if (loader) loader.style.display = 'flex';

                if (page === 'analytics') {
                    this.$nextTick(() => {
                        const analyticsComponent = this.$refs.analyticsView;

                        if (analyticsComponent && typeof analyticsComponent.loadAnalytics === 'function') {
                            analyticsComponent.loadAnalytics().then(() => null);
                        }
                    });
                }

                if (page === 'orders') {
                    this.$nextTick(() => {
                        const ordersComponent = this.$refs.ordersList;

                        if (ordersComponent && typeof ordersComponent.loadOrders === 'function') {
                            ordersComponent.loadOrders().then(() => null);
                        }
                    });
                }

                if (page === 'users') {
                    this.$nextTick(() => {
                        const usersComponent = this.$refs['users-list'];

                        if (usersComponent && typeof usersComponent.loadUsers === 'function') {
                            usersComponent.loadUsers().then(() => null);
                        } else {
                            this.$root.loadUsers
                        }
                    });
                }

                if (page === 'messages') {
                    this.selectedMessage = null;

                    const url = new URL(window.location.href);
                    url.searchParams.delete('id');
                    history.pushState({}, '', url.toString());

                    this.getMessages().then(r => null);
                }

                if (page === 'message') {
                    const urlParams = new URLSearchParams(window.location.search);
                    const messageId = urlParams.get('id');

                    if (messageId) {
                        if (this.messages && this.messages.length > 0) {
                            const message = this.messages.find(m => m.id == messageId);

                            if (message) {
                                this.selectedMessage = message;
                            }
                        } else {
                            this.getMessages().then(() => {
                                const message = this.messages.find(m => m.id == messageId);

                                if (message) {
                                    this.selectedMessage = message;
                                }
                            });
                        }

                        const url = new URL(window.location.href);

                        url.searchParams.set('page', 'message');
                        url.searchParams.set('id', messageId);
                        history.pushState({}, '', url.toString());
                    } else if (this.selectedMessage) {
                        const url = new URL(window.location.href);

                        url.searchParams.set('page', 'message');
                        url.searchParams.set('id', this.selectedMessage.id);
                        history.pushState({}, '', url.toString());
                    }
                }

                if (page === 'message-reply') {
                    const urlParams = new URLSearchParams(window.location.search);
                    const messageId = urlParams.get('id');

                    if (messageId) {
                        if (this.messages && this.messages.length > 0) {
                            const message = this.messages.find(m => m.id == messageId);

                            if (message) {
                                this.selectedMessage = message;
                            }
                        } else {
                            this.getMessages().then(() => {
                                const message = this.messages.find(m => m.id == messageId);

                                if (message) {
                                    this.selectedMessage = message;
                                }
                            });
                        }
                        const url = new URL(window.location.href);

                        url.searchParams.set('page', 'message-reply');
                        url.searchParams.set('id', messageId);
                        history.pushState({}, '', url.toString());
                    } else if (this.selectedMessage) {
                        const url = new URL(window.location.href);

                        url.searchParams.set('page', 'message-reply');
                        url.searchParams.set('id', this.selectedMessage.id);
                        history.pushState({}, '', url.toString());
                    }
                }

                const url = new URL(window.location.href);
                url.searchParams.set('page', page);

                if (page !== 'message' || !url.searchParams.get('id')) {
                    url.searchParams.delete('id');
                }
                history.pushState({}, '', url.toString());

                window.scrollTo(0, 0);
                document.body.style.overflow = 'hidden'

                setTimeout(() => {
                    const loader = document.getElementById('block_loader');

                    if (loader) {
                        document.body.style.overflow = 'auto'
                        loader.style.display = 'none';
                    }
                }, 800);
            },
            toggleMobileMenu() {
                this.$root.mobileMenuOpen = !this.$root.mobileMenuOpen;
            },
            closeMobileMenu() {
                this.$root.mobileMenuOpen = false;
            },
        }
    }

    const Modal = {
        template: '',
        data() {
            return {
                modalSizes: {},
                resizingModal: null,
                resizeDirection: null,
                resizeStartX: 0,
                resizeStartY: 0,
                resizeStartWidth: 0,
                resizeStartHeight: 0,
                resizeStartLeft: 0,
                resizeStartTop: 0,
                boundHandleResize: null,
                boundStopResize: null,
                draggingModal: null,
                dragStartX: 0,
                dragStartY: 0,
                dragStartLeft: 0,
                dragStartTop: 0,
                boundHandleDrag: null,
                boundStopDrag: null,
                lastResizeClick: { modalId: null, direction: null, time: 0 },
                resizeRestoreData: {},
                minimizedModals: {},
                maximizedModals: {},
                modalTitles: {
                    'addUserModal': 'Создать пользователя',
                    'contentModal': 'Редактирование контента',
                    'pageModal': 'Управление страницей',
                    'blockModal': 'Управление блоком',
                    'iconPickerModal': 'Выбор иконки',
                    'productModal': 'Управление товаром',
                    'navigationModal': 'Управление навигацией',
                    'profileModal': 'Управление профилем'
                }
            }
        },
        methods: {
            closeModal(event) {
                this._closeModalGeneric('productModal', event, {
                    showProperty: 'showAddProduct',
                    mobilePage: 'admin',
                    beforeClose: () => {
                        if (this.editingProduct !== undefined) {
                            this.editingProduct = null;
                        }
                        if (this.selectedFile !== undefined) {
                            this.selectedFile = null;
                        }
                        if (this.productForm) {
                            this.productForm = {
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
                            };
                        }
                        if (this.aiGeneratingDescription !== undefined) {
                            this.aiGeneratingDescription = false;
                        }
                        if (this.aiGenerationError !== undefined) {
                            this.aiGenerationError = '';
                        }
                        if (this.newPeculiarity !== undefined) {
                            this.newPeculiarity = '';
                        }
                        if (this.$refs && this.$refs.fileInput) {
                            this.$refs.fileInput.value = '';
                        }
                        if (this.$refs && this.$refs.additionalImagesInput) {
                            this.$refs.additionalImagesInput.value = '';
                        }
                    }
                });
            },
            openAddProductModal() {
                this.openModal('productModal', {
                    showProperty: 'showAddProduct',
                    mobilePage: 'product',
                    beforeOpen: () => {
                        if (typeof this.turnTextareaResize === 'function') {
                            this.turnTextareaResize();
                        }
                    }
                });
            },
            loadModalSizes() {
                try {
                    const saved = localStorage.getItem('admin_modal_sizes');

                    if (saved) {
                        this.modalSizes = JSON.parse(saved);
                    }
                } catch (e) {
                    console.error('Error loading modal sizes', e);
                }
            },
            saveModalSizes() {
                try {
                    localStorage.setItem('admin_modal_sizes', JSON.stringify(this.modalSizes));
                } catch (e) {
                    console.error('Error saving modal sizes', e);
                }
            },
            checkAllModalsBounds() {
                const modalIds = ['addUserModal', 'contentModal', 'pageModal', 'blockModal', 'iconPickerModal', 'productModal'];

                modalIds.forEach(modalId => {
                    const modal = document.querySelector('[data-modal-id=' + modalId + ']');

                    if (modal && window.getComputedStyle(modal).display !== 'none') {
                        this.constrainModalToViewport(modal);
                    }
                });
            },
            constrainModalToViewport(modal) {
                const rect = modal.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                const padding = 20;
                const minWidth = 400;
                const minHeight = 200;

                let newLeft = rect.left;
                let newTop = rect.top;
                let newWidth = rect.width;
                let newHeight = rect.height;

                if (rect.right > viewportWidth - padding) {
                    if (rect.left + minWidth + padding <= viewportWidth) {
                        newWidth = viewportWidth - padding - rect.left;
                    } else {
                        newLeft = viewportWidth - padding - minWidth;
                        newWidth = minWidth;
                    }
                }

                if (rect.bottom > viewportHeight - padding) {
                    if (rect.top + minHeight + padding <= viewportHeight) {
                        newHeight = viewportHeight - padding - rect.top;
                    } else {
                        newTop = viewportHeight - padding - minHeight;
                        newHeight = minHeight;
                    }
                }

                if (rect.left < padding) {
                    newLeft = padding;

                    if (newLeft + newWidth > viewportWidth - padding) {
                        newWidth = viewportWidth - padding - newLeft;
                    }
                }

                if (rect.top < padding) {
                    newTop = padding;

                    if (newTop + newHeight > viewportHeight - padding) {
                        newHeight = viewportHeight - padding - newTop;
                    }
                }

                if (modal.style.position === 'fixed' || modal.style.left || modal.style.top) {
                    modal.style.position = 'fixed';
                    modal.style.left = Math.max(padding, Math.min(newLeft, viewportWidth - padding - newWidth)) + 'px';
                    modal.style.top = Math.max(padding, Math.min(newTop, viewportHeight - padding - newHeight)) + 'px';
                    modal.style.right = 'auto';
                    modal.style.bottom = 'auto';
                }

                modal.style.width = Math.max(minWidth, Math.min(newWidth, viewportWidth - 2 * padding)) + 'px';
                modal.style.height = Math.max(minHeight, Math.min(newHeight, viewportHeight - 2 * padding)) + 'px';
                modal.style.maxWidth = 'none';
                modal.style.maxHeight = 'none';
            },
            applyModalSize(modalId, params = {}) {
                this.$nextTick(() => {
                    const modal = document.querySelector('[data-modal-id="' + modalId + '"]');
                    if (!modal) return;

                    const size = this.modalSizes[modalId];

                    if (size && size.width && size.height) {
                        modal.style.width = size.width;
                        modal.style.height = size.height;
                        modal.style.maxWidth = 'none';
                        modal.style.maxHeight = 'none';

                        if (size.left !== undefined || size.top !== undefined) {
                            modal.style.position = 'fixed';

                            if (size.left !== undefined) {
                                modal.style.left = size.left + 'px';
                                modal.style.right = 'auto';
                            }

                            if (size.top !== undefined) {
                                modal.style.top = size.top + 'px';
                                modal.style.bottom = 'auto';
                            }
                        } else {
                            this.centerModal(modal);
                        }
                    } else {
                        this.setDefaultModalSize(modal, params);
                    }

                    this.constrainModalToViewport(modal);
                });
            },
            setDefaultModalSize(modal, params = {}) {
                if (!modal) return;

                if (params.width) {
                    modal.style.width = params.width;
                } else {
                    modal.style.width = '25vw';
                }

                if (params.height) {
                    modal.style.height = params.height;
                } else {
                    modal.style.height = '60vh';
                }

                modal.style.position = 'fixed';

                requestAnimationFrame(() => {
                    const rect = modal.getBoundingClientRect();
                    const modalWidth = rect.width;
                    const modalHeight = rect.height;

                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;

                    const left = (viewportWidth - modalWidth) / 2;
                    const top = (viewportHeight - modalHeight) / 2;

                    modal.style.left = Math.max(20, left) + 'px';
                    modal.style.top = Math.max(20, top) + 'px';
                    modal.style.right = 'auto';
                    modal.style.bottom = 'auto';
                });
            },
            centerModal(modal) {
                if (!modal) return;

                modal.style.position = 'fixed';

                requestAnimationFrame(() => {
                    const rect = modal.getBoundingClientRect();
                    let modalWidth = rect.width;
                    let modalHeight = rect.height;

                    if (!modalWidth || modalWidth <= 0) {
                        const computedStyle = window.getComputedStyle(modal);
                        modalWidth = parseFloat(computedStyle.width) || 600;
                    }
                    if (!modalHeight || modalHeight <= 0) {
                        const computedStyle = window.getComputedStyle(modal);
                        modalHeight = parseFloat(computedStyle.height) || 400;
                    }

                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;

                    const left = (viewportWidth - modalWidth) / 2;
                    const top = (viewportHeight - modalHeight) / 2;

                    modal.style.left = Math.max(20, left) + 'px';
                    modal.style.top = Math.max(20, top) + 'px';
                    modal.style.right = 'auto';
                    modal.style.bottom = 'auto';
                });
            },
            startResize(event, modalId, direction) {
                if (this.draggingModal === modalId) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                this.resizingModal = modalId;
                this.resizeDirection = direction;

                const modal = document.querySelector('[data-modal-id="' + modalId + '"]');

                if (!modal) return;

                const rect = modal.getBoundingClientRect();

                this.resizeStartX = event.clientX;
                this.resizeStartY = event.clientY;
                this.resizeStartWidth = rect.width;
                this.resizeStartHeight = rect.height;
                this.resizeStartLeft = rect.left;
                this.resizeStartTop = rect.top;

                this.boundHandleResize = this.handleResize.bind(this);
                this.boundStopResize = this.stopResize.bind(this);

                document.addEventListener('mousemove', this.boundHandleResize);
                document.addEventListener('mouseup', this.boundStopResize);
            },
            handleResize(event) {
                if (!this.resizingModal || !this.resizeDirection) return;

                const modal = document.querySelector('[data-modal-id="' + this.resizingModal + '"]');
                if (!modal) return;

                const deltaX = event.clientX - this.resizeStartX;
                const deltaY = event.clientY - this.resizeStartY;

                const padding = 20;
                const minWidth = 400;
                const maxWidth = window.innerWidth - 2 * padding;
                const minHeight = 200;
                const maxHeight = window.innerHeight - 2 * padding;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                let newWidth = this.resizeStartWidth;
                let newHeight = this.resizeStartHeight;
                let newLeft = this.resizeStartLeft;
                let newTop = this.resizeStartTop;

                const direction = this.resizeDirection;

                if (direction.includes('e')) {
                    newWidth = this.resizeStartWidth + deltaX;
                    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

                    if (newLeft + newWidth > viewportWidth - padding) {
                        newWidth = viewportWidth - padding - newLeft;
                    }
                }

                if (direction.includes('w')) {
                    const widthChange = -deltaX;
                    newWidth = this.resizeStartWidth + widthChange;
                    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
                    newLeft = this.resizeStartLeft + (this.resizeStartWidth - newWidth);

                    if (newLeft < padding) {
                        newLeft = padding;
                        newWidth = this.resizeStartWidth + this.resizeStartLeft - padding;
                        newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
                    }
                }

                if (direction.includes('s')) {
                    newHeight = this.resizeStartHeight + deltaY;
                    newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

                    if (newTop + newHeight > viewportHeight - padding) {
                        newHeight = viewportHeight - padding - newTop;
                    }
                }

                if (direction.includes('n')) {
                    const heightChange = -deltaY;
                    newHeight = this.resizeStartHeight + heightChange;
                    newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
                    newTop = this.resizeStartTop + (this.resizeStartHeight - newHeight);

                    if (newTop < padding) {
                        newTop = padding;
                        newHeight = this.resizeStartHeight + this.resizeStartTop - padding;
                        newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
                    }
                }

                modal.style.width = Math.max(minWidth, Math.min(newWidth, viewportWidth - 2 * padding)) + 'px';
                modal.style.height = Math.max(minHeight, Math.min(newHeight, viewportHeight - 2 * padding)) + 'px';

                if (direction.includes('w') || direction.includes('n') || direction.includes('e') || direction.includes('s')) {
                    modal.style.position = 'fixed';
                }

                if (direction.includes('w')) {
                    modal.style.left = Math.max(padding, Math.min(newLeft, viewportWidth - padding - parseFloat(modal.style.width))) + 'px';
                    modal.style.right = 'auto';
                }

                if (direction.includes('n')) {
                    modal.style.top = Math.max(padding, Math.min(newTop, viewportHeight - padding - parseFloat(modal.style.height))) + 'px';
                    modal.style.bottom = 'auto';
                }

                if (direction.includes('e') && !direction.includes('w')) {
                    const currentLeft = modal.style.left ? parseFloat(modal.style.left) : this.resizeStartLeft;

                    if (currentLeft + parseFloat(modal.style.width) > viewportWidth - padding) {
                        modal.style.left = (viewportWidth - padding - parseFloat(modal.style.width)) + 'px';
                        modal.style.position = 'fixed';
                        modal.style.right = 'auto';
                    }
                }

                if (direction.includes('s') && !direction.includes('n')) {
                    const currentTop = modal.style.top ? parseFloat(modal.style.top) : this.resizeStartTop;

                    if (currentTop + parseFloat(modal.style.height) > viewportHeight - padding) {
                        modal.style.top = (viewportHeight - padding - parseFloat(modal.style.height)) + 'px';
                        modal.style.position = 'fixed';
                        modal.style.bottom = 'auto';
                    }
                }

                modal.style.maxWidth = 'none';
                modal.style.maxHeight = 'none';
            },
            stopResize() {
                if (!this.resizingModal) return;

                const modal = document.querySelector('[data-modal-id="' + this.resizingModal + '"]');

                if (modal) {
                    const rect = modal.getBoundingClientRect();
                    const computedStyle = window.getComputedStyle(modal);
                    const size = {
                        width: rect.width + 'px',
                        height: rect.height + 'px'
                    };

                    if (computedStyle.left !== 'auto' && computedStyle.left !== '') size.left = rect.left
                    if (computedStyle.top !== 'auto' && computedStyle.top !== '') size.top = rect.top;

                    this.modalSizes[this.resizingModal] = size;
                    this.saveModalSizes();
                }

                this.resizingModal = null;
                this.resizeDirection = null;

                if (this.boundHandleResize) {
                    document.removeEventListener('mousemove', this.boundHandleResize);
                    this.boundHandleResize = null;
                }

                if (this.boundStopResize) {
                    document.removeEventListener('mouseup', this.boundStopResize);
                    this.boundStopResize = null;
                }
            },
            handleResizeDoubleClick(modalId, direction, event) {
                event.preventDefault();
                event.stopPropagation();

                const now = Date.now();
                const clickTimeout = 300;

                if (this.lastResizeClick.modalId === modalId &&
                    this.lastResizeClick.direction === direction &&
                    (now - this.lastResizeClick.time) < clickTimeout) {

                    this.toggleResizeMaximize(modalId, direction);
                    this.lastResizeClick = { modalId: null, direction: null, time: 0 };
                } else {
                    this.lastResizeClick = { modalId, direction, time: now };
                }
            },
            toggleResizeMaximize(modalId, direction) {
                const modal = document.querySelector('[data-modal-id="' + modalId + '"]');
                if (!modal) return;

                if (this.maximizedModals[modalId]) {
                    return;
                }

                const computedStyle = window.getComputedStyle(modal);
                const padding = 20;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                const isHorizontal = direction.includes('e') || direction.includes('w');
                const isVertical = direction.includes('n') || direction.includes('s');

                const currentWidth = parseFloat(computedStyle.width);
                const currentHeight = parseFloat(computedStyle.height);
                const maxWidth = viewportWidth - 2 * padding;
                const maxHeight = viewportHeight - 2 * padding;

                const isWidthMaximized = isHorizontal && currentWidth >= maxWidth * 0.95;
                const isHeightMaximized = isVertical && currentHeight >= maxHeight * 0.95;

                if (isWidthMaximized || isHeightMaximized) {

                    this.restoreResizeSize(modalId, isHorizontal, isVertical);
                } else {

                    this.maximizeResize(modalId, direction);
                }
            },
            maximizeResize(modalId, direction) {
                const modal = document.querySelector('[data-modal-id="' + modalId + '"]');
                if (!modal) return;

                const computedStyle = window.getComputedStyle(modal);
                const padding = 20;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                if (!this.resizeRestoreData[modalId]) {
                    this.resizeRestoreData[modalId] = {
                        width: computedStyle.width,
                        height: computedStyle.height,
                        left: computedStyle.left,
                        top: computedStyle.top
                    };
                }

                const isHorizontal = direction.includes('e') || direction.includes('w');
                const isVertical = direction.includes('n') || direction.includes('s');

                const restoreData = this.resizeRestoreData[modalId];

                if (isHorizontal) {

                    if (!restoreData.width || restoreData.width === computedStyle.width) {
                        restoreData.width = computedStyle.width;
                    }

                    if (!restoreData.left || restoreData.left === computedStyle.left) {
                        restoreData.left = computedStyle.left;
                    }

                    modal.style.position = 'fixed';
                    modal.style.width = (viewportWidth - 2 * padding) + 'px';
                    modal.style.left = padding + 'px';
                    modal.style.right = 'auto';
                    modal.style.maxWidth = 'none';
                }

                if (isVertical) {

                    if (!restoreData.height || restoreData.height === computedStyle.height) {
                        restoreData.height = computedStyle.height;
                    }

                    if (!restoreData.top || restoreData.top === computedStyle.top) {
                        restoreData.top = computedStyle.top;
                    }

                    modal.style.position = 'fixed';
                    modal.style.height = (viewportHeight - 2 * padding) + 'px';
                    modal.style.top = padding + 'px';
                    modal.style.bottom = 'auto';
                    modal.style.maxHeight = 'none';
                }

                this.constrainModalToViewport(modal);

                const newRect = modal.getBoundingClientRect();

                if (!this.modalSizes[modalId]) {
                    this.modalSizes[modalId] = {};
                }

                this.modalSizes[modalId].width = newRect.width + 'px';
                this.modalSizes[modalId].height = newRect.height + 'px';
                this.modalSizes[modalId].left = newRect.left;
                this.modalSizes[modalId].top = newRect.top;
                this.saveModalSizes();
            },
            restoreResizeSize(modalId, isHorizontal = null, isVertical = null) {
                if (!this.resizeRestoreData[modalId]) return;

                const modal = document.querySelector('[data-modal-id="' + modalId + '"]');
                if (!modal) return;

                const restoreData = this.resizeRestoreData[modalId];
                const computedStyle = window.getComputedStyle(modal);
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                const currentWidth = parseFloat(computedStyle.width);
                const currentHeight = parseFloat(computedStyle.height);
                const maxWidth = viewportWidth - 40;
                const maxHeight = viewportHeight - 40;

                if (isHorizontal !== null) {
                    if (isHorizontal && restoreData.width) {
                        modal.style.width = restoreData.width;

                        if (restoreData.left !== 'auto' && restoreData.left !== '') {
                            modal.style.left = restoreData.left;
                        }

                        modal.style.maxWidth = '';
                        delete restoreData.width;
                        delete restoreData.left;
                    }
                } else if (isVertical !== null) {
                    if (isVertical && restoreData.height) {
                        modal.style.height = restoreData.height;

                        if (restoreData.top !== 'auto' && restoreData.top !== '') {
                            modal.style.top = restoreData.top;
                        }

                        modal.style.maxHeight = '';
                        delete restoreData.height;
                        delete restoreData.top;
                    }
                } else {

                    if (restoreData.width && currentWidth >= maxWidth * 0.95) {
                        modal.style.width = restoreData.width;

                        if (restoreData.left !== 'auto' && restoreData.left !== '') {
                            modal.style.left = restoreData.left;
                        }

                        modal.style.maxWidth = '';
                    }

                    if (restoreData.height && currentHeight >= maxHeight * 0.95) {
                        modal.style.height = restoreData.height;

                        if (restoreData.top !== 'auto' && restoreData.top !== '') {
                            modal.style.top = restoreData.top;

                        }
                        modal.style.maxHeight = '';
                    }
                }

                if (Object.keys(restoreData).length === 0) {
                    delete this.resizeRestoreData[modalId];
                }

                const newRect = modal.getBoundingClientRect();

                if (!this.modalSizes[modalId]) {
                    this.modalSizes[modalId] = {};
                }

                this.modalSizes[modalId].width = newRect.width + 'px';
                this.modalSizes[modalId].height = newRect.height + 'px';
                this.modalSizes[modalId].left = newRect.left;
                this.modalSizes[modalId].top = newRect.top;
                this.saveModalSizes();
            },
            minimizeModal(modalId) {
                const modal = document.querySelector('[data-modal-id="' + modalId + '"]');
                if (!modal) return;

                const rect = modal.getBoundingClientRect();
                const computedStyle = window.getComputedStyle(modal);

                const restoreData = {
                    width: computedStyle.width,
                    height: computedStyle.height,
                    left: computedStyle.left,
                    top: computedStyle.top,
                    position: computedStyle.position,
                    right: computedStyle.right,
                    bottom: computedStyle.bottom,
                    maxWidth: computedStyle.maxWidth,
                    maxHeight: computedStyle.maxHeight
                };

                if (this.maximizedModals[modalId]) {
                    restoreData.wasMaximized = true;
                    restoreData.maximizedRestoreData = this.maximizedModals[modalId];
                }

                this.minimizedModals[modalId] = {
                    title: this.getModalTitle(modalId),
                    restoreData: restoreData
                };

                modal.style.display = 'none';

                if (this.maximizedModals[modalId]) {
                    delete this.maximizedModals[modalId];
                }

                this.$forceUpdate();
            },
            restoreModal(modalId) {
                const modal = document.querySelector('[data-modal-id="' + modalId + '"]');
                if (!modal || !this.minimizedModals[modalId]) return;

                const minimizedData = this.minimizedModals[modalId];
                const restoreData = minimizedData.restoreData;

                modal.style.display = '';

                if (restoreData.width && restoreData.width !== 'auto') {
                    modal.style.width = restoreData.width;
                } else {
                    modal.style.width = '50vw';
                }

                if (restoreData.height && restoreData.height !== 'auto') {
                    modal.style.height = restoreData.height;
                } else {
                    modal.style.height = '50vh';
                }

                if (restoreData.position) {
                    modal.style.position = restoreData.position;
                }

                if (restoreData.left && restoreData.left !== 'auto') {
                    modal.style.left = restoreData.left;
                    modal.style.right = restoreData.right || 'auto';
                }

                if (restoreData.top && restoreData.top !== 'auto') {
                    modal.style.top = restoreData.top;
                    modal.style.bottom = restoreData.bottom || 'auto';
                }

                if (restoreData.maxWidth) {
                    modal.style.maxWidth = restoreData.maxWidth;
                }

                if (restoreData.maxHeight) {
                    modal.style.maxHeight = restoreData.maxHeight;
                }

                if (restoreData.wasMaximized && restoreData.maximizedRestoreData) {
                    this.$nextTick(() => {
                        this.maximizedModals[modalId] = restoreData.maximizedRestoreData;
                        this.maximizeModal(modalId);
                    });
                }

                delete this.minimizedModals[modalId];

                this.applyModalSize(modalId);

                this.$forceUpdate();
            },
            maximizeModal(modalId) {
                const modal = document.querySelector('[data-modal-id="' + modalId + '"]');
                if (!modal) return;

                const computedStyle = window.getComputedStyle(modal);

                const restoreData = {
                    width: computedStyle.width,
                    height: computedStyle.height,
                    left: computedStyle.left,
                    top: computedStyle.top,
                    position: computedStyle.position,
                    right: computedStyle.right,
                    bottom: computedStyle.bottom,
                    maxWidth: computedStyle.maxWidth,
                    maxHeight: computedStyle.maxHeight
                };

                this.maximizedModals[modalId] = restoreData;

                modal.style.position = 'fixed';
                modal.style.left = '0';
                modal.style.top = '0';
                modal.style.right = '0';
                modal.style.bottom = '0';
                modal.style.width = '100vw';
                modal.style.height = '100vh';
                modal.style.maxWidth = 'none';
                modal.style.maxHeight = 'none';

                this.$forceUpdate();
            },
            restoreFromMaximize(modalId) {
                const modal = document.querySelector('[data-modal-id="' + modalId + '"]');
                if (!modal || !this.maximizedModals[modalId]) return;

                const restoreData = this.maximizedModals[modalId];

                if (restoreData.width && restoreData.width !== 'auto') {
                    modal.style.width = restoreData.width;
                }

                if (restoreData.height && restoreData.height !== 'auto') {
                    modal.style.height = restoreData.height;
                }

                if (restoreData.position) {
                    modal.style.position = restoreData.position;
                }

                if (restoreData.left && restoreData.left !== 'auto') {
                    modal.style.left = restoreData.left;
                    modal.style.right = restoreData.right || 'auto';
                } else {
                    modal.style.left = '';
                    modal.style.right = '';
                }

                if (restoreData.top && restoreData.top !== 'auto') {
                    modal.style.top = restoreData.top;
                    modal.style.bottom = restoreData.bottom || 'auto';
                } else {
                    modal.style.top = '';
                    modal.style.bottom = '';
                }

                if (restoreData.maxWidth) {
                    modal.style.maxWidth = restoreData.maxWidth;
                }

                if (restoreData.maxHeight) {
                    modal.style.maxHeight = restoreData.maxHeight;
                }

                delete this.maximizedModals[modalId];

                this.$nextTick(() => {
                    this.applyModalSize(modalId);
                });

                this.$forceUpdate();
            },
            toggleMinimize(modalId) {
                if (this.minimizedModals[modalId]) {
                    this.restoreModal(modalId);
                } else {
                    this.minimizeModal(modalId);
                }
            },
            toggleMaximize(modalId) {
                if (this.maximizedModals[modalId]) {
                    this.restoreFromMaximize(modalId);
                } else {
                    this.maximizeModal(modalId);
                }
            },
            isModalMinimized(modalId) {
                return !!this.minimizedModals[modalId];
            },
            isModalMaximized(modalId) {
                return !!this.maximizedModals[modalId];
            },
            startDragModal(modalId, event) {
                if (this.maximizedModals[modalId]) {
                    return;
                }

                if (this.resizingModal === modalId) {
                    return;
                }

                const target = event.target;

                if (target.tagName === 'BUTTON' ||
                    target.closest('button') ||
                    target.closest('.control-btns') ||
                    target.closest('.action-btn')) {
                    return;
                }

                if (target.closest('.modal-resize-handle')) {
                    return;
                }

                const modal = document.querySelector('[data-modal-id="' + modalId + '"]');
                if (!modal) return;

                event.preventDefault();
                event.stopPropagation();

                this.draggingModal = modalId;
                const rect = modal.getBoundingClientRect();

                this.dragStartX = event.clientX;
                this.dragStartY = event.clientY;
                this.dragStartLeft = rect.left;
                this.dragStartTop = rect.top;

                this.boundHandleDrag = this.handleDragModal.bind(this);
                this.boundStopDrag = this.stopDragModal.bind(this);

                document.addEventListener('mousemove', this.boundHandleDrag);
                document.addEventListener('mouseup', this.boundStopDrag);

                modal.classList.add('dragging');
            },
            handleDragModal(event) {
                if (!this.draggingModal) return;

                const modal = document.querySelector('[data-modal-id="' + this.draggingModal + '"]');
                if (!modal) return;

                const deltaX = event.clientX - this.dragStartX;
                const deltaY = event.clientY - this.dragStartY;

                let newLeft = this.dragStartLeft + deltaX;
                let newTop = this.dragStartTop + deltaY;

                const padding = 20;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                const modalWidth = modal.offsetWidth;
                const modalHeight = modal.offsetHeight;

                newLeft = Math.max(padding, Math.min(newLeft, viewportWidth - modalWidth - padding));
                newTop = Math.max(padding, Math.min(newTop, viewportHeight - modalHeight - padding));

                modal.style.position = 'fixed';
                modal.style.left = newLeft + 'px';
                modal.style.top = newTop + 'px';
                modal.style.right = 'auto';
                modal.style.bottom = 'auto';
            },
            stopDragModal() {
                if (!this.draggingModal) return;

                const modal = document.querySelector('[data-modal-id="' + this.draggingModal + '"]');

                if (modal) {
                    modal.classList.remove('dragging');

                    const rect = modal.getBoundingClientRect();

                    if (!this.modalSizes[this.draggingModal]) {
                        this.modalSizes[this.draggingModal] = {};
                    }

                    this.modalSizes[this.draggingModal].left = rect.left;
                    this.modalSizes[this.draggingModal].top = rect.top;
                    this.saveModalSizes();
                }

                this.draggingModal = null;

                if (this.boundHandleDrag) {
                    document.removeEventListener('mousemove', this.boundHandleDrag);
                    this.boundHandleDrag = null;
                }
                if (this.boundStopDrag) {
                    document.removeEventListener('mouseup', this.boundStopDrag);
                    this.boundStopDrag = null;
                }
            },
            getModalTitle(modalId) {
                if (modalId === 'pageModal') {
                    return this.editingPage ? 'Редактировать страницу' : 'Добавить страницу';
                }

                if (modalId === 'blockModal') {
                    return this.editingBlock ? 'Редактировать блок' : 'Добавить блок';
                }

                if (modalId === 'productModal') {
                    return this.editingProduct ? 'Редактировать товар' : 'Добавить товар';
                }

                return this.modalTitles[modalId] || 'Окно';
            },
            bringModalToFront(modalId) {
                const allModals = document.querySelectorAll('.modal[data-modal-id]');

                allModals.forEach(modal => {
                    modal.style.zIndex = '999';
                });

                const activeModal = document.querySelector('.modal[data-modal-id="' + modalId + '"]');
                if (activeModal) {
                    activeModal.style.zIndex = '1000';
                }
            },
            openModal(modalId, options = {}, params = {}) {
                const {
                    showProperty,
                    mobilePage,
                    onOpen,
                    beforeOpen
                } = options;

                if (beforeOpen) {
                    beforeOpen();
                }

                if (!this.isMobileDevice()) {
                    if (this.minimizedModals[modalId]) {
                        this.restoreModal(modalId);
                    }
                    if (showProperty) {
                        this[showProperty] = true;
                    }
                    if (this.closeMobileMenu) {
                        this.closeMobileMenu();
                    }
                    this.$nextTick(() => {
                        this.applyModalSize(modalId, params);

                        if (onOpen) {
                            onOpen();
                        }
                    });
                } else {
                    if (mobilePage && this.changePage) {
                        this.changePage(mobilePage);
                    }
                }
            },
            _closeModalGeneric(modalId, event, options = {}) {
                const {
                    showProperty,
                    mobilePage,
                    onClose,
                    beforeClose
                } = options;

                if (beforeClose) {
                    beforeClose();
                }

                if (this.minimizedModals[modalId]) {
                    delete this.minimizedModals[modalId];
                }
                if (this.maximizedModals[modalId]) {
                    delete this.maximizedModals[modalId];
                }

                if (!this.isMobileDevice()) {
                    const activeElement = document.activeElement;
                    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT' || activeElement.contentEditable === 'true')) {
                        return;
                    }
                    if (event && event.target !== event.currentTarget) {
                        return;
                    }
                    if (showProperty) {
                        this[showProperty] = false;
                    }
                } else {
                    if (mobilePage && this.changePage) {
                        this.changePage(mobilePage);
                        window.scrollTo(0, 0);
                    }
                }

                if (onClose) {
                    onClose();
                }
            },
            openAddUserModal() {
                this.openModal('addUserModal', {
                    showProperty: 'showAddUser',
                    mobilePage: 'user'
                });
            },
            closeUserModal(event) {
                this._closeModalGeneric('addUserModal', event, {
                    showProperty: 'showAddUser',
                    mobilePage: 'admin',
                    beforeClose: () => {
                        if (this.registerData) {
                            this.registerData = { username: '', password: '', role: 'user' };
                        }
                        if (this.registerLoading !== undefined) {
                            this.registerLoading = false;
                        }
                        if (this.registerError !== undefined) {
                            this.registerError = '';
                        }
                        if (this.registerSuccess !== undefined) {
                            this.registerSuccess = '';
                        }
                    }
                });
            },
            openAddBlockModal() {
                const regularBlocks = this.pageBlocks ? this.pageBlocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons') : [];
                const sortOrder = regularBlocks.length;

                if (this.blockForm) {
                    this.blockForm = {
                        type: '',
                        title: '',
                        content: '',
                        settings: {},
                        sort_order: sortOrder,
                        is_active: true
                    };
                }

                if (this.pages && this.pages.length === 0 && this.loadPages) {
                    this.loadPages().then(() => null);
                }

                this.openModal('blockModal', {
                    showProperty: 'showAddBlockModal',
                    mobilePage: 'block'
                });
            },
            closeBlockModal(event) {
                this._closeModalGeneric('blockModal', event, {
                    showProperty: 'showAddBlockModal',
                    mobilePage: 'admin',
                    beforeClose: () => {
                        if (this.editingBlock !== undefined) {
                            this.editingBlock = null;
                        }
                        if (this.blockError !== undefined) {
                            this.blockError = '';
                        }
                        if (this.blockSuccess !== undefined) {
                            this.blockSuccess = '';
                        }
                        if (this.blockForm) {
                            this.blockForm = {
                                type: '',
                                title: '',
                                content: '',
                                settings: {},
                                sort_order: 0,
                                is_active: true
                            };
                        }
                    }
                });
            },
            openIconPicker(target, property) {
                if (this.currentIconTarget !== undefined) {
                    this.currentIconTarget = { target, property };
                }
                if (this.selectedIconClass !== undefined) {
                    this.selectedIconClass = target[property] || '';
                }

                this.openModal('iconPickerModal', {
                    showProperty: 'showIconPicker',
                    onOpen: () => {
                        if (this.iconSearchQuery !== undefined) {
                            this.iconSearchQuery = '';
                        }
                        if (this.selectedIconCategory !== undefined) {
                            this.selectedIconCategory = 'all';
                        }
                        if (this.updateFilteredIcons) {
                            this.updateFilteredIcons();
                        }
                    }
                });
            },
            closeIconPicker(event) {
                this._closeModalGeneric('iconPickerModal', event, {
                    showProperty: 'showIconPicker',
                    beforeClose: () => {
                        if (this.currentIconTarget !== undefined) {
                            this.currentIconTarget = null;
                        }
                        if (this.selectedIconClass !== undefined) {
                            this.selectedIconClass = '';
                        }
                        if (this.iconSearchQuery !== undefined) {
                            this.iconSearchQuery = '';
                        }
                        if (this.selectedIconCategory !== undefined) {
                            this.selectedIconCategory = 'all';
                        }
                    }
                });
            },
            openAddPageModal() {
                if (this.pageForm) {
                    this.pageForm = {
                        slug: '',
                        title: '',
                        content: '',
                        meta_title: '',
                        meta_description: '',
                        is_published: true,
                        is_main_page: false,
                        navigation_buttons: []
                    };
                }
                if (this.pageElements !== undefined) {
                    this.pageElements = [];
                }
                if (this.selectedElement !== undefined) {
                    this.selectedElement = null;
                }
                if (this.draggingElement !== undefined) {
                    this.draggingElement = null;
                }
                if (this.pageError !== undefined) {
                    this.pageError = '';
                }
                if (this.pageSuccess !== undefined) {
                    this.pageSuccess = '';
                }
                if (this.viewMode !== undefined) {
                    this.viewMode = 'visual';
                }

                this.openModal('pageModal', {
                    showProperty: 'showAddPageModal',
                    mobilePage: 'page'
                }, {
                    width: '60vw',
                    height: '80vh'
                });
            },
            closePageModal(event) {
                this._closeModalGeneric('pageModal', event, {
                    showProperty: 'showAddPageModal',
                    mobilePage: 'admin',
                    beforeClose: () => {
                        if (this.editingPage !== undefined) {
                            this.editingPage = null;
                        }
                        if (this.pageForm) {
                            this.pageForm = {
                                slug: '',
                                title: '',
                                content: '',
                                meta_title: '',
                                meta_description: '',
                                is_published: true,
                                is_main_page: false,
                                navigation_buttons: []
                            };
                        }
                        if (this.pageElements !== undefined) {
                            this.pageElements = [];
                        }
                        if (this.selectedElement !== undefined) {
                            this.selectedElement = null;
                        }
                        if (this.draggingElement !== undefined) {
                            this.draggingElement = null;
                        }
                        if (this.pageError !== undefined) {
                            this.pageError = '';
                        }
                        if (this.pageSuccess !== undefined) {
                            this.pageSuccess = '';
                        }
                    }
                });
            },
            closeContentModal(event) {
                this._closeModalGeneric('contentModal', event, {
                    showProperty: 'showContentModal',
                    beforeClose: () => {
                        if (this.contentError !== undefined) {
                            this.contentError = '';
                        }
                        if (this.contentSuccess !== undefined) {
                            this.contentSuccess = '';
                        }
                    }
                });
            }
        }
    }

    const Auth = {
        mixins: [Values],
        data() {
            return {
                loginData: {
                    username: '',
                    password: '',
                    remember: false
                },
                registerData: {
                    username: '',
                    password: '',
                    role: 'user'
                },
                registerLoading: false,
                registerError: '',
                registerSuccess: '',
                loginError: '',
                loginLoading: false,
                showLogin: false,
                showProfileModal: false,
                profileForm: {
                    username: '',
                    role: '',
                    created_at: ''
                },
                profileLoading: false,
                profileError: '',
                profileSuccess: '',
                passwordForm: {
                    current_password: '',
                    new_password: '',
                    confirm_password: ''
                },
                passwordLoading: false,
                passwordError: '',
                passwordSuccess: ''
            }
        },
        computed: {
            isAuthenticated() {
                const adminAuth = window.__ADMIN_AUTH__;
                return !!(adminAuth && adminAuth.authenticated === true && adminAuth.role === 'admin');
            }
        },
        methods: {
            openLogin() {
                //todo
            },
            closeLogin() {
                //todo
            },
            doLogin() {
                //todo
            },
            async register() {
                this.loginError = '';
                this.registerError = '';
                this.registerSuccess = '';
                try {
                    const u = (this.registerData.username || '').trim();
                    const p = (this.registerData.password || '').trim();
                    if (u === '' || p === '') {
                        throw new Error('Введите логин и пароль');
                    }
                    if (u.length > 50) {
                        throw new Error('Слишком длинное имя пользователя');
                    }
                    this.registerLoading = true;
                    const formData = new FormData();

                    formData.append('action', 'register');
                    formData.append('username', u);
                    formData.append('password', p);
                    formData.append('role', this.registerData.role || 'user');

                    const response = await fetch('../api.php', { method: 'POST', body: formData, credentials: 'same-origin' });
                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        throw new Error(data.error || 'Ошибка регистрации');
                    }

                    this.registerData = { username: '', password: '', role: 'user' };
                    this.registerSuccess = 'Пользователь создан успешно';

                    setTimeout(() => {
                        this.showAddUser = false;
                        this.registerSuccess = '';
                    }, 800);
                } catch (error) {
                    this.registerError = error.message || 'Ошибка регистрации';
                }
                this.registerLoading = false;
            },
            openProfileModal() {
                this.showProfileModal = true;
                this.profileError = '';
                this.profileSuccess = '';
                this.passwordError = '';
                this.passwordSuccess = '';
                this.loadProfile().then(r => null);
            },
            closeProfileModal() {
                this.showProfileModal = false;
                this.profileForm = { username: '', role: '', created_at: '' };
                this.passwordForm = { current_password: '', new_password: '', confirm_password: '' };
                this.profileError = '';
                this.profileSuccess = '';
                this.passwordError = '';
                this.passwordSuccess = '';
            },
            async loadProfile() {
                try {
                    const response = await fetch('../api.php?action=get_profile', { credentials: 'same-origin' });
                    const data = await response.json();
                    if (response.ok && data.success) {
                        this.profileForm = {
                            username: data.user.username || '',
                            role: data.user.role || '',
                            created_at: data.user.created_at || ''
                        };
                    } else {
                        this.profileError = data.error || 'Ошибка загрузки профиля';
                    }
                } catch (error) {
                    this.profileError = 'Ошибка загрузки профиля: ' + error.message;
                }
            },
            async updateProfile() {
                this.profileError = '';
                this.profileSuccess = '';

                try {
                    const username = (this.profileForm.username || '').trim();

                    if (username === '') {
                        throw new Error('Имя пользователя не может быть пустым');
                    }

                    if (username.length > 50) {
                        throw new Error('Имя пользователя слишком длинное');
                    }

                    this.profileLoading = true;

                    const formData = new FormData();
                    formData.append('action', 'update_profile');
                    formData.append('username', username);

                    const response = await fetch('../api.php', { method: 'POST', body: formData, credentials: 'same-origin' });
                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        throw new Error(data.error || 'Ошибка обновления профиля');
                    }

                    this.profileSuccess = 'Профиль успешно обновлен';

                    if (typeof NV !== 'undefined' && NV.getAuth && NV.setAuth) {
                        const auth = NV.getAuth();
                        auth.username = username;
                        NV.setAuth(auth);
                    }

                    setTimeout(() => {
                        this.profileSuccess = '';
                    }, 3000);
                } catch (error) {
                    this.profileError = error.message || 'Ошибка обновления профиля';
                } finally {
                    this.profileLoading = false;
                }
            },
            async changePassword() {
                this.passwordError = '';
                this.passwordSuccess = '';

                try {
                    const currentPassword = (this.passwordForm.current_password || '').trim();
                    const newPassword = (this.passwordForm.new_password || '').trim();
                    const confirmPassword = (this.passwordForm.confirm_password || '').trim();

                    if (currentPassword === '' || newPassword === '' || confirmPassword === '') {
                        throw new Error('Все поля обязательны для заполнения');
                    }

                    if (newPassword.length < 6) {
                        throw new Error('Новый пароль должен содержать минимум 6 символов');
                    }

                    if (newPassword !== confirmPassword) {
                        throw new Error('Новый пароль и подтверждение не совпадают');
                    }

                    this.passwordLoading = true;

                    const formData = new FormData();
                    formData.append('action', 'change_password');
                    formData.append('current_password', currentPassword);
                    formData.append('new_password', newPassword);
                    formData.append('confirm_password', confirmPassword);

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });
                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        throw new Error(data.error || 'Ошибка смены пароля');
                    }

                    this.passwordSuccess = 'Пароль успешно изменен';
                    this.passwordForm = {
                        current_password: '',
                        new_password: '',
                        confirm_password: ''
                    };

                    setTimeout(() => {
                        this.passwordSuccess = '';
                    }, 3000);
                } catch (error) {
                    this.passwordError = error.message || 'Ошибка смены пароля';
                } finally {
                    this.passwordLoading = false;
                }
            }
        }
    }

    const Category = {
        data() {
            return {
                categories: [],
                categoryForm: { id: null, name: '', slug: '', sort_order: 0 },
                editingCategory: null,
                categoryLoading: false,
                categoryError: '',
                categorySuccess: '',
                draggingCategoryId: null,
                categoryEdit: false
            }
        },
        methods: {
            async loadCategories() {
                try {
                    const response = await fetch('../api.php?action=categories', { credentials: 'same-origin' });
                    if (response.ok) {
                        const data = await response.json();
                        this.categories = data.map(c => ({ id: c.slug, name: c.name, _id: c.id, sort_order: c.sort_order, slug: c.slug }));
                    }
                } catch (e) {
                    console.error('Error loading categories', e);
                }
            },
            startAddCategory() {
                this.editingCategory = null;
                this.categoryForm = { id: null, name: '', slug: '', sort_order: 0 };

                setTimeout(() => {
                    this.categorySuccess = '';
                }, 2400);
            },
            startEditCategory(cat) {
                this.editingCategory = cat;
                this.categoryForm = { id: cat._id, name: cat.name, slug: cat.slug || cat.id, sort_order: cat.sort_order || 0 };
            },
            async saveCategory() {
                this.categoryLoading = true;
                this.categoryError = '';
                this.categorySuccess = '';
                try {
                    const formData = new FormData();
                    if (this.categoryForm.id) {
                        formData.append('action', 'update_category');
                        formData.append('id', this.categoryForm.id);
                    } else {
                        formData.append('action', 'add_category');
                    }
                    formData.append('name', this.categoryForm.name);
                    formData.append('slug', this.categoryForm.slug || '');
                    formData.append('sort_order', String(this.categoryForm.sort_order || 0));

                    const response = await fetch('../api.php', { method: 'POST', body: formData, credentials: 'same-origin' });
                    const result = await response.json();

                    if (!response.ok || result.error) {
                        throw new Error(result.error || 'Ошибка сохранения категории');
                    }

                    this.categorySuccess = 'Категория сохранена';
                    await this.loadCategories();
                    this.startAddCategory();
                } catch (e) {
                    this.categoryError = e.message || 'Ошибка сохранения категории';
                }

                this.categoryLoading = false;
            },
            async saveCategoriesOrder() {
                try {
                    const order = this.categories.map(c => c._id);
                    const formData = new FormData();
                    formData.append('action', 'save_categories_order');
                    formData.append('categories_order', JSON.stringify(order));
                    const response = await fetch('../api.php', { method: 'POST', body: formData, credentials: 'same-origin' });
                    const result = await response.json();
                    if (!response.ok || result.error) {
                        throw new Error(result.error || 'Ошибка сохранения порядка');
                    }
                    setTimeout(() => { this.categorySuccess = ''; }, 2000);
                } catch (e) {
                    this.categoryError = e.message || 'Ошибка сохранения порядка';
                }
            },
            startDragCategory(cat, event) {
                this.draggingCategoryId = cat._id;
                event.dataTransfer.effectAllowed = 'move';
            },
            endDragCategory() {
                this.draggingCategoryId = null;
            },
            dropCategory(targetCat, event) {
                event.preventDefault();
                if (this.draggingCategoryId === targetCat._id) return;
                const draggedIndex = this.categories.findIndex(c => c._id === this.draggingCategoryId);
                const targetIndex = this.categories.findIndex(c => c._id === targetCat._id);
                if (draggedIndex === -1 || targetIndex === -1) return;
                const [dragged] = this.categories.splice(draggedIndex, 1);
                this.categories.splice(targetIndex, 0, dragged);
                this.saveCategoriesOrder().then(r => null);
            },
            moveCategory(cat, direction) {
                const index = this.categories.findIndex(c => c._id === cat._id);
                if (index === -1) return;
                const newIndex = direction === 'up' ? index - 1 : index + 1;
                if (newIndex < 0 || newIndex >= this.categories.length) return;
                const [item] = this.categories.splice(index, 1);
                this.categories.splice(newIndex, 0, item);
            },
            async deleteCategory(cat) {
                if (!confirm('Удалить категорию?')) return;
                try {
                    const formData = new FormData();

                    formData.append('action', 'delete_category');
                    formData.append('id', String(cat._id));

                    const response = await fetch('../api.php', { method: 'POST', body: formData, credentials: 'same-origin' });
                    if (!response.ok) alert('Ошибка удаления');
                    this.categorySuccess = '';
                    await this.loadCategories();
                } catch (e) {
                    alert(e.message || 'Ошибка удаления категории');
                }
            },
            getCategoryName(categoryId) {
                const category = this.categories.find(cat => cat.id === categoryId);
                return category ? category.name : 'Неизвестно';
            },
            manageCategoryEdit() {
                this.categoryEdit = !this.categoryEdit;
            }
        }
    };

    const Options = {
        mixins: [Values],
        template: `
          <div class="admin-dashboard">
            <main class="admin-main">
              <div class="container">
                <section v-if="!isMobileDevice()">
                  <h2>Типы товаров</h2>
                  <p style="margin-bottom: 20px; color: #ccc;">
                    Создавайте собственные типы товаров и управляйте ими
                  </p>
                  <div class="options-section">
                    <div class="options-group" v-for="(type, index) in productTypes"
                         :key="type.id ? 'product-type-' + type.id : 'product-type-' + index">
                      <div class="options-group-header">
                        <button v-if="productTypes.length > 1"
                                @click="removeProductType(index)" class="btn btn-danger">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                      <div class="option-item-title">
                        <label>Название типа товара</label>
                        <input type="text"
                               v-model="type.name"
                               class="option-input option-type-input option-title"
                               placeholder="Ремешки"
                               style="flex: 1; width: 100%">
                      </div>
                    </div>

                    <div class="options-group new-option-type">
                      <h3>Новый тип товара</h3>
                      <div class="options-list">
                        <div class="option-item">
                          <input type="text"
                                 v-model="newProductTypeName"
                                 class="option-input"
                                 placeholder="Ремешки">
                          <button @click="addProductType"
                                  class="btn btn-primary"
                                  style="padding: 10px 16px;"
                                  :disabled="!newProductTypeName || !newProductTypeName.trim()">
                            <i class="fas fa-plus"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="options-actions" style="margin-top: 30px;">
                    <button @click="saveProductTypes" class="btn btn-primary"
                            :disabled="typesLoading">
                      <i class="fas fa-save"></i> {{ typesLoading ? 'Сохранение...' : 'Сохранить типы' }}
                    </button>
                    <button @click="loadProductTypes" class="btn btn-secondary"
                            :disabled="typesLoading">
                      <i class="fas fa-sync"></i> Обновить
                    </button>
                  </div>
                  <div v-if="typesError" class="alert alert-error" style="margin-top: 15px;">
                    {{ typesError }}
                  </div>
                  <div v-if="typesSuccess" class="alert alert-success" style="margin-top: 15px;">
                    {{ typesSuccess }}
                  </div>
                </section>
                <section v-if="!isMobileDevice()">
                  <h2>Опции товаров</h2>
                  <p style="margin-bottom: 20px; color: #ccc;">Создавайте типы опций и управляйте ими</p>
                  <div class="options-section">
                    <div class="option-item-title" style="grid-column: span 3">
                      <label>Тип товара</label>
                      <select v-model="selectedProductTypeId"
                              class="option-input option-type-input option-title"
                              style="flex: 1; width: 100%">
                        <option v-for="type in productTypes"
                                :key="type.id"
                                :value="type.id">
                          {{ type.name }}
                        </option>
                      </select>
                    </div>
                    <div class="options-group" v-for="(optionType, typeIndex) in productOptions"
                         :key="optionType.id ? 'type-' + optionType.id : 'type-' + typeIndex">
                      <div class="options-group-header">
                        <button @click="moveOptionTypeUp(typeIndex)" class="btn btn-secondary"
                                style="margin-left: auto" :disabled="typeIndex === 0"
                                title="Переместить вверх">
                          <i class="fas fa-arrow-left"></i>
                        </button>
                        <button v-if="productOptions.length > 1"
                                @click="removeOptionType(typeIndex)" class="btn btn-danger">
                          <i class="fas fa-trash"></i>
                        </button>
                        <button @click="moveOptionTypeDown(typeIndex)"
                                class="btn btn-secondary"
                                style="margin-right: auto"
                                :disabled="typeIndex === productOptions.length - 1"
                                title="Переместить вниз">
                          <i class="fas fa-arrow-right"></i>
                        </button>
                      </div>
                      <div class="option-item-title">
                        <label>Название группы опций</label>
                        <input type="text" v-model="optionType.name"
                               class="option-input option-type-input option-title"
                               placeholder="Название типа (например, Размеры)"
                               style="flex: 1; width: 100%">
                      </div>

                      <div class="options-list">
                        <div v-for="(value, valueIndex) in optionType.values"
                             :key="'type-' + typeIndex + '-value-' + valueIndex" class="option-item">
                          <input type="text" v-model="optionType.values[valueIndex]"
                                 class="option-input"
                                 :placeholder="'Значение для ' + optionType.name || 'опции'">
                          <button @click="removeOptionValue(typeIndex, valueIndex)"
                                  class="btn btn-danger" style="padding: 6px 12px;"
                                  :disabled="optionType.values.length <= 1">
                            <i class="fas fa-trash"></i>
                          </button>
                        </div>
                        <button @click="addOptionValue(typeIndex)" class="btn btn-primary"
                                style="margin-top: 10px;">
                          <i class="fas fa-plus"></i> Добавить значение
                        </button>
                      </div>
                    </div>
                    <div class="options-group new-option-type">
                      <h3>Новый тип опций</h3>
                      <div class="options-list">
                        <div class="option-item">
                          <input type="text" v-model="newOptionName" class="option-input"
                                 placeholder="Например: Цвета">
                          <button @click="addOptionType" class="btn btn-primary"
                                  style="padding: 10px 16px;"
                                  :disabled="!newOptionName || !newOptionName.trim()">
                            <i class="fas fa-plus"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="options-actions" style="margin-top: 30px;">
                    <button @click="saveProductOptions" class="btn btn-primary"
                            :disabled="optionsLoading">
                      <i class="fas fa-save"></i> {{ optionsLoading ? 'Сохранение...' : 'Сохранить опции' }}
                    </button>
                    <button @click="loadProductOptions" class="btn btn-secondary"
                            :disabled="optionsLoading">
                      <i class="fas fa-sync"></i> Обновить
                    </button>
                  </div>
                  <div v-if="optionsError" class="alert alert-error" style="margin-top: 15px;">
                    {{ optionsError }}
                  </div>
                  <div v-if="optionsSuccess" class="alert alert-success" style="margin-top: 15px;">
                    {{ optionsSuccess }}
                  </div>
                </section>
                <div class="product-options-container opt-mobile" v-else>
                  <h2>Опции товаров</h2>
                  <div class="options-section">
                    <div class="options-group">
                      <div class="options-group-header"
                           style="display: flex; align-items: center; gap: 10px;">
                        <div class="options-group-controls" style="width: 100%;">
                          <label>Тип товара</label>
                          <select v-model="selectedProductTypeId"
                                  class="option-input option-type-input option-title"
                                  style="width: 100%;">
                            <option v-for="type in productTypes"
                                    :key="type.id"
                                    :value="type.id">
                              {{ type.name }}
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="options-section">
                    <div class="options-group" v-for="(optionType, typeIndex) in productOptions"
                         :key="optionType.id ? 'type-' + optionType.id : 'type-' + typeIndex">
                      <div class="options-group-header"
                           style="display: flex; align-items: center; gap: 10px;">
                        <div class="options-group-controls">
                          <button @click="moveOptionTypeUp(typeIndex)"
                                  class="btn btn-secondary" style="margin: 0"
                                  :disabled="typeIndex === 0" title="Переместить вверх">
                            <i class="fas fa-arrow-left"></i>
                          </button>
                          <button @click="moveOptionTypeDown(typeIndex)"
                                  class="btn btn-secondary" style="margin: 0"
                                  :disabled="typeIndex === productOptions.length - 1"
                                  title="Переместить вниз">
                            <i class="fas fa-arrow-right"></i>
                          </button>
                          <button v-if="productOptions.length > 1"
                                  @click="removeOptionType(typeIndex)" class="btn btn-danger"
                                  style="margin: 0">
                            <i class="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                      <input type="text" v-model="optionType.name"
                             class="option-input option-type-input option-title"
                             placeholder="Название типа (например, Размеры)"
                             style="flex: 1; width: 100%">
                      <div class="options-list">
                        <div v-for="(value, valueIndex) in optionType.values"
                             :key="'type-' + typeIndex + '-value-' + valueIndex" class="option-item">
                          <input type="text" v-model="optionType.values[valueIndex]"
                                 class="option-input"
                                 :placeholder="'Значение для ' + optionType.name || 'опции'">
                          <button @click="removeOptionValue(typeIndex, valueIndex)"
                                  class="btn btn-danger" style="padding: 6px 12px;"
                                  :disabled="optionType.values.length <= 1">
                            <i class="fas fa-trash"></i>
                          </button>
                        </div>
                        <button @click="addOptionValue(typeIndex)" class="btn btn-primary"
                                style="margin-top: 10px;">
                          <i class="fas fa-plus"></i> Добавить значение
                        </button>
                      </div>
                    </div>
                    <div class="options-group new-option-type">
                      <h3>Новый тип опций</h3>
                      <div class="options-list">
                        <div class="option-item">
                          <input type="text" v-model="newOptionName" class="option-input"
                                 placeholder="Например: Цвета"
                                 style="height: -webkit-fill-available">
                          <button @click="addOptionType" class="btn btn-primary"
                                  style="margin: 0"
                                  :disabled="!newOptionName || !newOptionName.trim()">
                            <i class="fas fa-plus"></i> Добавить тип
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="options-actions" style="margin-top: 30px;">
                    <button @click="saveProductOptions" class="btn btn-primary"
                            :disabled="optionsLoading">
                      <i class="fas fa-save"></i> {{ optionsLoading ? 'Сохранение...' : 'Сохранить опции' }}
                    </button>
                    <button @click="loadProductOptions" class="btn btn-secondary"
                            :disabled="optionsLoading">
                      <i class="fas fa-sync"></i> Обновить
                    </button>
                  </div>
                  <div v-if="optionsError" class="alert alert-error" style="margin-top: 15px;">
                    {{ optionsError }}
                  </div>
                  <div v-if="optionsSuccess" class="alert alert-success" style="margin-top: 15px;">
                    {{ optionsSuccess }}
                  </div>
                </div>
              </div>
            </main>
          </div>
        `,
        data() {
            return {
                productOptions: [],
                newOptionName: '',
                optionsLoading: false,
                optionsError: '',
                optionsSuccess: '',
                productTypes: [],
                newProductTypeName: '',
                selectedProductTypeId: null,
                typesLoading: false,
                typesError: '',
                typesSuccess: '',
            }
        },
        watch: {
            selectedProductTypeId(newVal) {
                if (newVal) {
                    this.loadProductOptions().then(() => null);
                } else {
                    this.productOptions = [];
                }
            }
        },
        mounted() {
            this.loadProductTypes().then(r => null);
            this.loadProductOptions().then(r => null);
        },
        methods: {
            async loadProductOptions() {
                try {
                    const params = new URLSearchParams();
                    params.set('action', 'product_options');

                    if (this.selectedProductTypeId) {
                        params.set('type_id', this.selectedProductTypeId);
                    }

                    const response = await fetch('../api.php?' + params.toString(), { credentials: 'same-origin' });

                    if (response.ok) {
                        const data = await response.json();

                        this.productOptions = data.options.map((type) => ({
                            id: type.id || null,
                            name: type.name || '',
                            values: Array.isArray(type.values) && type.values.length ? [...type.values] : ['']
                        }));
                    } else {
                        console.error('Failed to load options', response.error);
                    }

                    this.optionsError = '';
                    this.newOptionName = '';
                } catch (error) {
                    alert('Error loading product options:' + error);
                    this.newOptionName = '';
                }
            },
            async loadProductTypes() {
                try {
                    const response = await fetch('../api.php?action=product_types', { credentials: 'same-origin' });

                    if (response.ok) {
                        const data = await response.json();

                        this.productTypes = Array.isArray(data.types)
                            ? data.types.map((type) => ({
                                id: type.id || null,
                                name: type.name || '',
                            }))
                            : [];

                        if (!this.selectedProductTypeId && this.productTypes.length) {
                            this.selectedProductTypeId = this.productTypes[0].id || null;
                        }
                    } else {
                        console.error('Failed to load product types', response.error);
                    }

                    this.newProductTypeName = '';
                } catch (error) {
                    alert('Error loading product types: ' + error);
                    this.newProductTypeName = '';
                }
            },
            async saveProductOptions() {
                this.optionsLoading = true;
                this.optionsError = '';
                this.optionsSuccess = '';

                try {
                    const currentTypeId = this.selectedProductTypeId ? parseInt(this.selectedProductTypeId, 10) : 0;

                    if (!currentTypeId) {
                        this.optionsError = 'Сначала выберите тип товара';
                        this.optionsLoading = false;
                        return;
                    }

                    const preparedOptions = this.productOptions.map(type => {
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

                    const formData = new FormData();
                    formData.append('action', 'save_product_options');
                    formData.append('option_types', JSON.stringify(preparedOptions));
                    formData.append('type_id', String(currentTypeId));

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
            async saveProductTypes() {
                this.typesLoading = true;
                this.typesError = '';
                this.typesSuccess = '';

                try {
                    const preparedTypes = this.productTypes
                        .map(type => {
                            const name = type.name ? type.name.trim() : '';
                            return { name };
                        })
                        .filter(type => type.name);

                    if (!preparedTypes.length) {
                        this.typesError = 'Добавьте хотя бы один тип товара';
                        this.typesLoading = false;
                        return;
                    }

                    const formData = new FormData();
                    formData.append('action', 'save_product_types');
                    formData.append('types', JSON.stringify(preparedTypes));

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (result.success) {
                            this.typesSuccess = 'Типы товаров успешно сохранены';
                            setTimeout(() => {
                                this.typesSuccess = '';
                            }, 3000);
                        } else {
                            this.typesError = result.error || 'Ошибка сохранения';
                        }
                    } else {
                        const errorData = await response.json();
                        this.typesError = errorData.error || 'Ошибка сохранения';
                    }
                } catch (error) {
                    console.error('Error saving product types:', error);
                    this.typesError = 'Ошибка сохранения типов товаров';
                }

                this.typesLoading = false;
            },
            addOptionType() {
                const name = (this.newOptionName || '').trim();
                if (!name) {
                    this.optionsError = 'Введите название типа опций';
                    return;
                }
                this.productOptions.push({
                    id: null,
                    name,
                    values: ['']
                });
                this.newOptionName = '';
                this.optionsError = '';
            },
            addProductType() {
                const name = (this.newProductTypeName || '').trim();
                if (!name) {
                    this.typesError = 'Введите название типа товара';
                    return;
                }

                this.productTypes.push({
                    id: null,
                    name,
                });

                this.newProductTypeName = '';
                this.typesError = '';
            },
            removeOptionType(index) {
                if (confirm('Вы действительно хотите удалить этот список опций?')) {
                    this.productOptions.splice(index, 1);
                }
            },
            removeProductType(index) {
                if (!this.productTypes[index]) {
                    return;
                }

                if (confirm('Вы действительно хотите удалить этот тип товара?')) {
                    this.productTypes.splice(index, 1);
                }
            },
            moveOptionTypeUp(typeIndex) {
                if (typeIndex <= 0 || typeIndex >= this.productOptions.length) {
                    return;
                }
                const temp = this.productOptions[typeIndex];
                this.productOptions[typeIndex] = this.productOptions[typeIndex - 1];
                this.productOptions[typeIndex - 1] = temp;
            },
            moveProductTypeUp(index) {
                if (index <= 0 || index >= this.productTypes.length) {
                    return;
                }

                const temp = this.productTypes[index];
                this.productTypes[index] = this.productTypes[index - 1];
                this.productTypes[index - 1] = temp;
            },
            moveOptionTypeDown(typeIndex) {
                if (typeIndex < 0 || typeIndex >= this.productOptions.length - 1) {
                    return;
                }
                const temp = this.productOptions[typeIndex];
                this.productOptions[typeIndex] = this.productOptions[typeIndex + 1];
                this.productOptions[typeIndex + 1] = temp;
            },
            moveProductTypeDown(index) {
                if (index < 0 || index >= this.productTypes.length - 1) {
                    return;
                }

                const temp = this.productTypes[index];
                this.productTypes[index] = this.productTypes[index + 1];
                this.productTypes[index + 1] = temp;
            },
            addOptionValue(typeIndex) {
                if (!this.productOptions[typeIndex]) {
                    return;
                }
                this.productOptions[typeIndex].values.push('');
            },
            removeOptionValue(typeIndex, valueIndex) {
                const optionType = this.productOptions[typeIndex];
                optionType.values.splice(valueIndex, 1);
            },
        }
    }

    const ProductFormMixin = {
        data() {
            return {
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
            };
        },
        methods: {
            async saveProduct() {
                const products = this.$root.products;
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
                        formData.append('product_type_id', this.productForm.product_type_id || '');
                        formData.append('image', this.productForm.image);
                        formData.append('image_description', this.productForm.image_description);

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
                            const index = products.findIndex(p => p.id === this.editingProduct.id);

                            if (index !== -1) {
                                products[index] = {
                                    ...products[index],
                                    name: this.productForm.name,
                                    description: this.productForm.description,
                                    peculiarities: this.productForm.peculiarities,
                                    material: this.productForm.material,
                                    price: parseInt(this.productForm.price),
                                    price_sale: parseInt(this.productForm.price_sale),
                                    category: this.productForm.category,
                                    product_type_id: this.productForm.product_type_id ? parseInt(this.productForm.product_type_id) : null,
                                    image: (payload && payload.image) ? payload.image : products[index].image
                                };
                            }

                            if (typeof this.update === 'function') {
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
                        formData.append('product_type_id', this.productForm.product_type_id || '');
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

                            products.push({
                                id: result.id,
                                name: this.productForm.name,
                                description: this.productForm.description,
                                peculiarities: this.productForm.peculiarities,
                                material: this.productForm.material,
                                price: parseInt(this.productForm.price),
                                price_sale: parseInt(this.productForm.price_sale),
                                category: this.productForm.category,
                                product_type_id: this.productForm.product_type_id ? parseInt(this.productForm.product_type_id) : null,
                                image: result && result.image ? result.image : ''
                            });
                        } else {
                            const errorData = await response.json();

                            console.error('Failed to add product:', errorData.error || 'Unknown error');
                            alert('Ошибка при добавлении товара');

                            return;
                        }
                    }

                    if (this.selectedFile && this.$refs.fileInput) {
                        this.selectedFile = null;
                        this.$refs.fileInput.value = '';
                    }

                    this.changePage('admin');
                    this.closeModal();
                } catch (error) {
                    console.error('Error saving product:', error);
                    alert('Ошибка при сохранении товара');
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
            onSelectFocus() {
                this.selectOpen = true;
            },
            onSelectBlur() {
                setTimeout(() => {
                    this.selectOpen = false;
                }, 200);
            },
            onSelectChange() {
                this.selectOpen = false;
            },
            onSelectClick() {
                this.selectOpen = !this.selectOpen;
            },
            onSelectMouseDown() {
                this.selectOpen = true;
            },
            triggerFileUpload() {
                if (this.$refs.fileInput) {
                    this.$refs.fileInput.click();
                }
            },
            triggerAdditionalImagesUpload() {
                if (this.$refs.additionalImagesInput) {
                    this.$refs.additionalImagesInput.click();
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
            removeImage() {
                this.selectedFile = null;
                this.productForm.image = '';
            },
            async removeAdditionalImage(index) {
                if (confirm('Вы уверены, что хотите удалить это изображение?')) {
                    const imagePath = this.productForm.additionalImages[index];
                    const products = this.$root.products;

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

                                    const productIndex = products.findIndex(p => p.id === this.editingProduct.id);
                                    if (productIndex !== -1) {
                                        products[productIndex].additional_images = [...this.productForm.additionalImages];
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
                    const products = this.$root.products;

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

                                    const productIndex = products.findIndex(p => p.id === this.editingProduct.id);
                                    if (productIndex !== -1) {
                                        products[productIndex].additional_videos = [...this.productForm.additionalVideos];
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
            async handleAdditionalImagesSelect(event) {
                const files = Array.from(event.target.files);
                if (files.length === 0) return;
                const products = this.$root.products;

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

                    files.forEach((file) => {
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

                            const productIndex = products.findIndex(p => p.id === this.editingProduct.id);
                            if (productIndex !== -1) {
                                if (result.uploaded_images) {
                                    products[productIndex].additional_images = products[productIndex].additional_images ? [...products[productIndex].additional_images, ...result.uploaded_images] : result.uploaded_images;
                                }
                                if (result.uploaded_videos) {
                                    products[productIndex].additional_videos = products[productIndex].additional_videos ? [...products[productIndex].additional_videos, ...result.uploaded_videos] : result.uploaded_videos;
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

                if (this.$refs.additionalImagesInput) {
                    this.$refs.additionalImagesInput.value = '';
                }
            }
        }
    };

    const Product = {
        mixins: [Values, Modal, Category, Options, ProductFormMixin],
        template: `
          <div class="modal-header">
            <span class="fas fa-backward-step" style="font-size: 24px" @click="closeModal"></span>
            <h3>{{ editingProduct ? 'Редактировать товар' : 'Добавить товар' }}</h3>
          </div>
          <div class="modal-body">
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
          </div>
        `,
        methods: {
            openAddProductModal() {
                if (this.$root && typeof this.$root.openAddProductModal === 'function') {
                    this.$root.openAddProductModal();
                }
            },
            closeModal(event) {
                if (this.$root && typeof this.$root.closeModal === 'function') {
                    this.$root.closeModal(event);
                }
            }
        }
    }

    const Users = {
        mixins: [Values, Modal, Auth],
        template: `
          <div class="admin-content users-content">
            <div class="container users-container">
              <section>
                <div class="content-header">
                  <h2>Управление пользователями</h2>
                  <div class="header-actions">
                    <button @click="openAddUserModal" class="btn btn-primary">
                      <i class="fas fa-plus"></i>
                      <span class="btn-text">Создать пользователя</span>
                    </button>
                    <button @click="loadUsers" class="btn btn-secondary" :disabled="usersLoading">
                      <i class="fas fa-sync-alt" :class="{ 'fa-spin': usersLoading }"></i>
                      <span class="btn-text">Обновить</span>
                    </button>
                  </div>
                </div>
                <div v-if="usersError" class="error-message">
                  {{ usersError }}
                </div>
                <div v-if="usersLoading" class="loading-state">
                  <i class="fas fa-spinner fa-spin"></i>
                  <p>Загрузка пользователей...</p>
                </div>
                <div v-else-if="users.length === 0" class="empty-state">
                  <i class="fas fa-users"></i>
                  <h3>Пользователей пока нет</h3>
                  <p>Зарегистрированные пользователи появятся здесь.</p>
                </div>
                <div v-else class="users-list">
                  <div class="users-table">
                    <table>
                      <thead>
                      <tr>
                        <th>ID</th>
                        <th>Имя пользователя</th>
                        <th>Роль</th>
                        <th>Дата регистрации</th>
                      </tr>
                      </thead>
                      <tbody>
                      <tr v-for="user in users" :key="user.id" class="user-row">
                        <td>{{ user.id }}</td>
                        <td>
                          <strong>{{ user.username }}</strong>
                        </td>
                        <td>
                          <span :class="['role-badge', getRoleClass(user.role)]">
                            {{ getRoleLabel(user.role) }}
                          </span>
                        </td>
                        <td>{{ formatDate(user.created_at) }}</td>
                      </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </div>
          </div>
        `,
        data() {
            return {
                users: [],
                usersLoading: false,
                usersError: '',
                registerData: {
                    username: '',
                    password: '',
                    role: 'user'
                },
            }
        },
        mounted() {
            this.loadUsers().then(r => null);
            this._stopWatchRegisterSuccess = this.$watch(
                () => this.$root.registerSuccess,
                (newVal) => {
                    if (newVal && String(newVal).includes('успешно')) {
                        setTimeout(() => {
                            this.loadUsers().then(r => null);
                        }, 1000);
                    }
                }
            );
        },
        beforeUnmount() {
            if (typeof this._stopWatchRegisterSuccess === 'function') {
                this._stopWatchRegisterSuccess();
            }
        },
        methods: {
            openAddUserModal() {
                // Модалка и showAddUser живут на root (#app), не на экземпляре Users
                if (this.$root && typeof this.$root.openAddUserModal === 'function') {
                    this.$root.openAddUserModal();
                }
            },
            async loadUsers() {
                this.usersLoading = true;
                this.usersError = '';

                try {
                    const response = await fetch('../api.php?action=users', { credentials: 'same-origin' });
                    if (response.ok) {
                        this.users = await response.json();
                    } else {
                        this.usersError = 'Ошибка загрузки пользователей';
                    }
                } catch (error) {
                    console.error('Error loading users:', error);
                    this.usersError = 'Ошибка загрузки пользователей';
                }

                this.usersLoading = false;
            },
            getRoleLabel(role) {
                const roles = {
                    'admin': 'Администратор',
                    'user': 'Пользователь'
                };
                return roles[role] || role;
            },
            getRoleClass(role) {
                return role === 'admin' ? 'role-admin' : 'role-user';
            }
        }
    }

    const Messages = {
        mixins: [Values],
        template: `
          <main class="admin-main">
            <div class="container">
              <section class="messages-section">
                <h1>Сообщения с формы обратной связи</h1>
                <div v-if="!messages || messages.length === 0" class="empty-state">
                  Сообщений пока нет.
                </div>
                <table v-else class="table user-messages-table">
                  <thead>
                  <tr>
                    <th>Отправитель</th>
                    <th>Почта отправителя</th>
                    <th>Дата</th>
                    <th></th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr class="user-message" v-for="message in messages" :key="message.id"
                      @click="openMessage(message)"
                      style="cursor: pointer;">
                    <td>{{ message.name }}</td>
                    <td>
                      <a :href="'?page=message&id=' + message.id" @click.prevent="openMessage(message)" style="color: inherit; text-decoration: none;">
                        {{ message.email }}
                      </a>
                    </td>
                    <td>{{ formatDate(message.created_at) }}</td>
                    <td>
                      <button type="button" class="btn btn-sm btn-primary" @click.stop="openReply(message)" title="Ответить">
                        <i class="fas fa-reply"></i>
                      </button>
                      <button type="button" class="btn btn-sm btn-delete" @click.stop="deleteMessage(message)" title="Удалить">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </section>
            </div>
          </main>
        `,
        data() {
            return {
                showMessageModal: false
            }
        },
        mounted() {
            this.getMessages().then(r => null);
        },
        methods: {
            async getMessages () {
                try {
                    const response = await fetch('../api.php?action=messages', { credentials: 'same-origin' });
                    if (response.ok) {
                        const res = await response.json();

                        if (res.success && res.data) {
                            this.messages = res.data;
                        } else if (Array.isArray(res)) {
                            this.messages = res;
                        }
                    }
                } catch (e) {
                    console.error('Error loading messages', e);
                }
            },
            openMessageModal(message) {
                this.selectedMessage = message;
                this.showMessageModal = true;
            },
            closeMessageModal() {
                this.showMessageModal = false;
                this.selectedMessage = null;
            },
            openMessage(message) {
                this.selectedMessage = message;
                const url = new URL(window.location.href);

                url.searchParams.set('page', 'message');
                url.searchParams.set('id', message.id);

                history.pushState({}, '', url.toString());
                this.changePage('message');
            },
            openReply(message) {
                this.selectedMessage = message;
                const url = new URL(window.location.href);

                url.searchParams.set('page', 'message-reply');
                url.searchParams.set('id', message.id);

                history.pushState({}, '', url.toString());
                this.changePage('message-reply');
            },
            async deleteMessage(message) {
                if (!message || !message.id) return;
                if (!confirm('Удалить это сообщение? Действие необратимо.')) return;

                try {
                    const formData = new FormData();

                    formData.append('action', 'delete_message');
                    formData.append('id', message.id);

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                            this.messages = this.messages.filter(m => m.id !== message.id);
                            if (this.selectedMessage && this.selectedMessage.id === message.id) {
                                this.selectedMessage = null;
                                this.changePage('messages');
                            }
                        }
                    } else {
                        const err = await response.json().catch(() => ({}));
                        alert(err.error || 'Ошибка при удалении сообщения');
                    }
                } catch (e) {
                    console.error('Error deleting message', e);
                    alert('Ошибка при удалении сообщения');
                }
            }
        }
    }

    const Message = {
        mixins: [Messages],
        template: `
          <main class="admin-main">
            <div class="container">
              <section class="messages-section">
                <div class="message-header">
                  <button class="btn btn-secondary" @click="changePage('messages')">
                    ← Назад к сообщениям
                  </button>
                  <div class="message-field date">
                    <label>Дата отправки:</label>
                    <div class="message-value">{{ formatDate(selectedMessage.created_at) }}</div>
                  </div>
                </div>
                <div class="message-details">
                  <h1>Сообщение от <a :href="'mailto:' + selectedMessage.email">{{ selectedMessage.email }}</a></h1>

                  <div class="message-field">
                    <label>Сообщение:</label>
                    <div class="message-value message-text">
                      {{ selectedMessage.message }}
                    </div>
                  </div>
                </div>

                <div class="message-replies" v-if="replies && replies.length > 0">
                  <h2>Ответы на сообщение ({{ replies.length }})</h2>
                  <div class="replies-list">
                    <div class="reply-item" v-for="reply in replies" :key="reply.id">
                      <div class="reply-header">
                        <div class="reply-subject">
                          <strong>{{ reply.subject }}</strong>
                        </div>
                        <div class="reply-date">{{ formatDate(reply.created_at) }}</div>
                      </div>
                      <div class="reply-message">{{ reply.message }}</div>
                      <div class="reply-to">
                        <strong>Ответил:</strong> {{ reply.username }}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="message-footer">
                  <button class="btn btn-primary btn-reply" @click="changePage('message-reply')">Ответить</button>
                </div>
              </section>
            </div>
          </main>
        `,
        data() {
            return {
                replies: [],
                repliesLoading: false
            }
        },
        watch: {
            selectedMessage: {
                handler(newMessage) {
                    if (newMessage && newMessage.id) {
                        this.loadReplies().then(r => null);
                    }
                },
                immediate: true
            }
        },
        methods: {
            async loadReplies() {
                if (!this.selectedMessage || !this.selectedMessage.id) {
                    this.replies = [];
                    return;
                }

                this.repliesLoading = true;
                try {
                    const response = await fetch('../api.php?action=message-replies&message_id=' + this.selectedMessage.id, {
                        credentials: 'same-origin'
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (result.success && result.data) {
                            this.replies = result.data;
                        } else {
                            this.replies = [];
                        }
                    } else {
                        this.replies = [];
                    }
                } catch (error) {
                    console.error('Error loading replies:', error);
                    this.replies = [];
                } finally {
                    this.repliesLoading = false;
                }
            },
        }
    }

    const Reply = {
        mixins: [Messages, Message],
        template: `
          <main class="admin-main">
            <div class="container">
              <section class="messages-section">
                <div class="message-header">
                  <button class="btn btn-secondary" @click="handleBack">
                    ← Назад
                  </button>
                  <div class="message-field date">
                    <label>Дата отправки:</label>
                    <div class="message-value">{{ formatDate(selectedMessage.created_at) }}</div>
                  </div>
                </div>
                <div class="message-details">
                  <h1>Ответить на сообщение от <a :href="'mailto:' + selectedMessage.email">{{ selectedMessage.email }}</a></h1>

                  <div class="message-field">
                    <label>Исходное сообщение:</label>
                    <div class="message-value message-text">
                      {{ selectedMessage.message }}
                    </div>
                  </div>
                </div>
                <div class="message-reply-form">
                  <form @submit.prevent="sendReply">
                    <div class="form-group">
                      <label for="reply-subject">Тема письма <span style="color: red;">*</span></label>
                      <input
                          type="text"
                          id="reply-subject"
                          v-model="replySubject"
                          :disabled="replyLoading"
                          placeholder="Введите тему письма"
                          required
                      >
                    </div>
                    <div class="form-group">
                      <label for="reply-message">Текст ответа <span style="color: red;">*</span></label>
                      <textarea
                          id="reply-message"
                          v-model="replyMessage"
                          :disabled="replyLoading"
                          placeholder="Введите текст ответа"
                          rows="10"
                          required
                      ></textarea>
                    </div>
                    <div v-if="replyError" class="error-message">{{ replyError }}</div>
                    <div v-if="replySuccess" class="success-message">{{ replySuccess }}</div>
                    <div class="message-footer">
                      <button type="submit" class="btn btn-primary" :disabled="replyLoading || !replySubject.trim() || !replyMessage.trim()">
                        <span v-if="replyLoading">Отправка...</span>
                        <span v-else>Отправить ответ</span>
                      </button>
                      <button type="button" class="btn btn-secondary" @click="changePage('message')" :disabled="replyLoading">
                        Отмена
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            </div>
          </main>
        `,
        data() {
            return {
                replySubject: '',
                replyMessage: '',
                replyLoading: false,
                replyError: '',
                replySuccess: ''
            }
        },
        mounted() {
            if (this.selectedMessage) {
                const url = new URL(window.location.href);
                const currentId = url.searchParams.get('id');

                if (currentId !== String(this.selectedMessage.id)) {
                    url.searchParams.set('page', 'message-reply');
                    url.searchParams.set('id', this.selectedMessage.id);
                    history.pushState({}, '', url.toString());
                }
            }
        },
        methods: {
            handleBack() {
                if (this.replyLoading) {
                    return;
                }

                const hasUnsavedData = this.replySubject.trim() || this.replyMessage.trim();

                if (hasUnsavedData) {
                    if (confirm('Данные ответа не будут сохранены')) {
                        this.changePage('message');
                    }
                } else {
                    this.changePage('message');
                }
            },
            async sendReply() {
                if (!this.selectedMessage) {
                    this.replyError = 'Сообщение не выбрано';
                    return;
                }

                if (!this.replySubject.trim()) {
                    this.replyError = 'Тема письма обязательна';
                    return;
                }

                if (!this.replyMessage.trim()) {
                    this.replyError = 'Текст ответа обязателен';
                    return;
                }

                this.replyLoading = true;
                this.replyError = '';
                this.replySuccess = '';

                try {
                    const response = await fetch('../api.php?action=send-reply', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'same-origin',
                        body: JSON.stringify({
                            messageId: this.selectedMessage.id,
                            to: this.selectedMessage.email,
                            subject: this.replySubject.trim(),
                            message: this.replyMessage.trim()
                        })
                    });

                    const result = await response.json();

                    if (result.success) {
                        this.replySuccess = 'Ответ успешно отправлен!';
                        this.replySubject = '';
                        this.replyMessage = '';
                        setTimeout(() => {
                            this.changePage('message');
                        }, 2000);
                    } else {
                        this.replyError = result.error || 'Ошибка при отправке ответа';
                    }
                } catch (error) {
                    console.error('Error sending reply:', error);
                    this.replyError = 'Ошибка при отправке ответа. Попробуйте позже.';
                } finally {
                    this.replyLoading = false;
                }
            }
        }
    }

    const Orders = {
        mixins: [Values],
        template: `
          <div class="admin-content orders-content">
            <div class="container orders-container">
              <section>
                <div class="content-header">
                  <h2>Управление заказами</h2>
                  <div class="header-actions">
                    <button @click="loadOrders" class="btn btn-secondary" :disabled="ordersLoading">
                      <i class="fas fa-sync-alt" :class="{ 'fa-spin': ordersLoading }"></i>
                      <span class="btn-text">Обновить</span>
                    </button>
                  </div>
                </div>
                <div v-if="ordersError" class="error-message">
                  {{ ordersError }}
                </div>
                <div v-if="ordersLoading" class="loading-state">
                  <i class="fas fa-spinner fa-spin"></i>
                  <p>Загрузка заказов...</p>
                </div>
                <div v-else-if="orders.length === 0" class="empty-state">
                  <i class="fas fa-shopping-cart"></i>
                  <h3>Заказов пока нет</h3>
                  <p>Когда клиенты будут оформлять заказы, они появятся здесь.</p>
                </div>
                <div v-else class="orders-list">
                  <div v-for="order in orders" :key="order.id" class="order-card">
                    <div class="order-header">
                      <div class="order-info">
                        <h3>Заказ #{{ order.id }}</h3>
                        <div class="order-meta">
                          <span class="order-date">
                            <i class="fas fa-calendar"></i>
                            {{ formatDate(order.created_at) }}
                          </span>
                          <span class="order-total">
                            {{ formatPrice(order.total_amount) }}
                          </span>
                        </div>
                      </div>
                      <div class="order-payment">
                        <div class="payment-info">
                          <div class="payment-type">
                            <i :class="order.payment_type === 'online' ? 'fas fa-credit-card' : 'fas fa-money-bill-wave'"></i>
                            <span>{{ order.payment_type === 'online' ? 'Онлайн оплата' : 'Наличные' }}</span>
                          </div>
                          <div class="payment-status" :class="order.payment_status === 1 ? 'paid' : 'unpaid'">
                            <i :class="order.payment_status === 1 ? 'fas fa-check-circle' : 'fas fa-clock'"></i>
                            <span>{{ order.payment_status === 1 ? 'Оплачено' : 'Не оплачено' }}</span>
                          </div>
                        </div>
                        <button v-if="order.payment_status !== 1"
                                @click="updatePaymentStatus(order.id, 1)"
                                class="btn btn-sm btn-primary payment-status-btn"
                                title="Отметить как оплачено">
                          <i class="fas fa-check"></i> Оплачено
                        </button>
                      </div>
                      <div class="order-status">
                            <span
                                v-if="Object.keys(orderStatuses)[(Object.keys(orderStatuses).indexOf(order.status)) + 1]"
                                class="next-order-status"
                            >Статус заказа:
                                <select :value="order.status"
                                        @change="updateOrderStatus(order.id, $event.target.value)"
                                        class="new-order-status"
                                        :class="['status-select', getStatusClass(order.status)]"
                                >
                                    <option value="pending">Ожидает</option>
                                    <option value="confirmed">Подтвержден</option>
                                    <option value="processing">В обработке</option>
                                    <option value="shipped">Отправлен</option>
                                    <option value="delivered">Доставлен</option>
                                    <option value="cancelled">Отменен</option>
                                </select>
                            </span>
                      </div>
                      <div class="order-delete" @click="deleteOrder(order.id)">
                        <i class="fas fa-trash"></i>
                        <p>Удалить</p>
                      </div>
                    </div>
                    <div class="order-content">
                      <div class="order-customer">
                        <h4>Клиент</h4>
                        <div class="customer-info">
                          <p><strong>{{ order.customer_name }}</strong></p>
                          <p><i class="fas fa-phone"></i> {{ order.customer_phone }}</p>
                          <p v-if="order.customer_email"><i class="fas fa-envelope"></i> {{
                              order.customer_email }}
                          </p>
                        </div>
                      </div>
                      <div class="order-delivery">
                        <h4>Доставка</h4>
                        <div class="delivery-info">
                          <p><strong>{{ getDeliveryTypeLabel(order.delivery_type) }}</strong>
                          </p>
                          <div v-if="order.delivery_type === 'delivery'">
                            <p><i class="fas fa-map-marker-alt"></i> 
                              {{ order.delivery_address }}
                            </p>
                            <p v-if="order.delivery_date"><i class="fas fa-calendar"></i>
                              Дата: {{ order.delivery_date }}
                            </p>
                            <p v-if="order.delivery_time"><i class="fas fa-clock"></i>
                              Время: {{ order.delivery_time }}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div class="order-items">
                        <h4>Товары</h4>
                        <div class="items-list">
                          <div v-for="item in order.order_items" :key="item.id"
                               class="order-item">
                            <img :src="'../' + item.image" :alt="item.name"
                                 class="item-image">
                            <div class="item-details">
                              <h5>{{ item.name }}</h5>
                              <template v-if="item.options && item.options.length">
                                <p v-for="option in item.options"
                                   :key="'order-item-option-' + item.id + '-' + option.slug">
                                  {{ option.name }}: {{ option.value }}
                                </p>
                              </template>
                              <p>{{ item.material }}</p>
                              <div class="item-quantity">
                                <span>Количество: {{ item.quantity }}</span>
                                <span class="item-price">{{ formatPrice(item.price * item.quantity) }}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div v-if="order.notes" class="order-notes">
                        <h4>Комментарий</h4>
                        <p>{{ order.notes }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        `,
        data() {
            return {
                orders: [],
                ordersLoading: false,
                ordersError: '',
                orderStatuses: {
                    pending: 'Ожидает',
                    confirmed: 'Подтвержден',
                    processing: 'В обработке',
                    shipped: 'Отправлен',
                    delivered: 'Доставлен',
                    cancelled: 'Отменен'
                },
            }
        },
        mounted() {
            this.loadOrders().then(() => null);
        },
        methods: {
            async loadOrders() {
                this.ordersLoading = true;
                this.ordersError = '';

                try {
                    const response = await fetch('../api.php?action=orders', { credentials: 'same-origin' });

                    if (response.ok) {
                        this.orders = await response.json();
                    } else {
                        this.ordersError = 'Ошибка загрузки заказов';
                    }
                } catch (error) {
                    console.error('Error loading orders:', error);
                    this.ordersError = 'Ошибка загрузки заказов';
                }

                this.ordersLoading = false;
            },
            async updateOrderStatus(orderId, newStatus) {
                try {
                    const formData = new FormData();
                    formData.append('action', 'update_order_status');
                    formData.append('order_id', orderId);
                    formData.append('status', newStatus);

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });

                    if (response.ok) {
                        const result = await response.json();

                        if (result.success) {
                            const order = this.orders.find(o => o.id === orderId);

                            if (order) {
                                order.status = newStatus;
                            }
                        } else {
                            alert('Ошибка обновления статуса: ' + (result.error || 'Неизвестная ошибка'));
                        }
                    } else {
                        alert('Ошибка обновления статуса');
                    }
                } catch (error) {
                    console.error('Error updating order status:', error);
                    alert('Ошибка обновления статуса');
                }
            },
            async updatePaymentStatus(orderId, paymentStatus) {
                try {
                    const formData = new FormData();
                    formData.append('action', 'update_payment_status');
                    formData.append('order_id', orderId);
                    formData.append('payment_status', paymentStatus);

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });

                    if (response.ok) {
                        const result = await response.json();

                        if (result.success) {
                            const order = this.orders.find(o => o.id === orderId);

                            if (order) {
                                order.payment_status = paymentStatus;
                            }
                        } else {
                            alert('Ошибка обновления статуса оплаты: ' + (result.error || 'Неизвестная ошибка'));
                        }
                    } else {
                        alert('Ошибка обновления статуса оплаты');
                    }
                } catch (error) {
                    console.error('Error updating payment status:', error);
                    alert('Ошибка обновления статуса оплаты');
                }
            },
            getStatusClass(status) {
                const statusClasses = {
                    'pending': 'status-pending',
                    'confirmed': 'status-confirmed',
                    'processing': 'status-processing',
                    'shipped': 'status-shipped',
                    'delivered': 'status-delivered',
                    'cancelled': 'status-cancelled'
                };

                return statusClasses[status] || '';
            },
            getDeliveryTypeLabel(type) {
                return type === 'pickup' ? 'Самовывоз' : 'Доставка';
            },
            formatPrice(price) {
                return new Intl.NumberFormat('ru-RU').format(price) + ' руб.';
            },
            async deleteOrder(orderId) {
                if (!orderId) {
                    alert('ID заказа не указан');
                    return false;
                }

                if (!confirm('Вы действительно хотите удалить этот заказ? Это действие необратимо')) {
                    return false;
                }

                try {
                    const formData = new FormData();
                    formData.append('action', 'delete_order');
                    formData.append('order_id', orderId);

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        const data = await response.json();

                        if (data.error) {
                            throw new Error(data.error);
                        }

                        alert('Заказ успешно удален');
                        await this.loadOrders();
                        return true;
                    } else {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'HTTP error! status: ' + response.status);
                    }
                } catch (error) {
                    console.error('Error deleting order:', error);
                    alert('Произошла ошибка: ' + error.message || 'Неизвестная ошибка');
                    return false;
                }
            },
        }
    }

    const Analytics = {
        mixins: [Values],
        template: `
          <div class="admin-content">
            <div class="content-header">
              <h2>Аналитика посещений</h2>
              <div class="header-actions">
                <select 
                    v-model="analyticsPeriod" 
                    @change="loadAnalytics" 
                    class="btn btn-secondary" 
                    style="padding: 8px 12px;"
                >
                  <option value="7">Последние 7 дней</option>
                  <option value="30">Последние 30 дней</option>
                  <option value="90">Последние 90 дней</option>
                  <option value="365">Последний год</option>
                </select>
                <button @click="loadAnalytics" class="btn btn-secondary" :disabled="analyticsLoading">
                  <i class="fas fa-sync-alt" :class="{ 'fa-spin': analyticsLoading }"></i>
                  <span class="btn-text">Обновить</span>
                </button>
              </div>
            </div>
            <div class="analytics-filters"
                 style="margin: 20px 0; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 8px;"
            >
              <h3 style="margin-bottom: 15px; font-size: 16px;">
                <i class="fas fa-filter"></i> Фильтры и поиск
              </h3>
              <div
                  style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                <div class="form-group" style="margin: 0;">
                  <label
                      style="font-size: 12px; color: #888; margin-bottom: 5px; display: block;">Поиск
                    по IP адресу</label>
                  <input type="text" v-model="analyticsFilters.ip" placeholder="192.168.1.1"
                         style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;">
                </div>
                <div class="form-group" style="margin: 0;">
                  <label
                      style="font-size: 12px; color: #888; margin-bottom: 5px; display: block;">Поиск
                    по странице</label>
                  <input type="text" v-model="analyticsFilters.url" placeholder="/page или название"
                         style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;">
                </div>
                <div class="form-group" style="margin: 0;">
                  <label
                      style="font-size: 12px; color: #888; margin-bottom: 5px; display: block;">Поиск
                    по источнику</label>
                  <input type="text" v-model="analyticsFilters.referer"
                         placeholder="google.com, yandex.ru..."
                         style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;">
                </div>
                <div class="form-group" style="margin: 0;">
                  <label
                      style="font-size: 12px; color: #888; margin-bottom: 5px; display: block;">Фильтр по дате</label>
                  <input type="date" v-model="analyticsFilters.date"
                         style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;">
                </div>
              </div>
              <div style="margin-top: 15px; display: flex; gap: 10px; align-items: center;">
                <button @click="clearAnalyticsFilters" class="btn btn-secondary"
                        style="padding: 8px 16px;">
                  <i class="fas fa-times"></i> Сбросить фильтры
                </button>
                <span style="color: #888; font-size: 12px;">
                Найдено: {{ filteredRecentVisits.length }} из {{ analyticsData.recent_visits?.length || 0 }} посещений
                </span>
              </div>
            </div>
            <div v-if="analyticsError" class="error-message">
              {{ analyticsError }}
            </div>
            <div v-if="analyticsLoading" class="loading-state">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Загрузка аналитики...</p>
            </div>
            <div v-else-if="analyticsData" class="analytics-dashboard">
              <div class="analytics-stats">
                <div class="stat-card">
                  <div class="stat-icon" style="background: #3498db;">
                    <i class="fas fa-eye"></i>
                  </div>
                  <div class="stat-content">
                    <h3>{{ analyticsData.total_visits }}</h3>
                    <p>Всего посещений</p>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon" style="background: #2ecc71;">
                    <i class="fas fa-users"></i>
                  </div>
                  <div class="stat-content">
                    <h3>{{ analyticsData.unique_visitors }}</h3>
                    <p>Уникальных посетителей</p>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon" style="background: #e74c3c;">
                    <i class="fas fa-chart-line"></i>
                  </div>
                  <div class="stat-content">
                    <h3>{{ analyticsData.period_days }}</h3>
                    <p>Дней в периоде</p>
                  </div>
                </div>
              </div>
              <div class="analytics-charts">
                <div class="chart-card">
                  <h3>Посещения по дням</h3>
                  <div class="chart-container">
                    <canvas ref="dailyChart" style="max-height: 300px;"></canvas>
                  </div>
                </div>
                <div class="chart-card">
                  <h3>Посещения по часам</h3>
                  <div class="chart-container">
                    <canvas ref="hourlyChart" style="max-height: 300px;"></canvas>
                  </div>
                </div>
              </div>
              <div class="analytics-tables">
                <div class="table-card">
                  <div
                      style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0;">Топ страниц (все)</h3>
                    <div style="flex: 1; max-width: 300px; margin-left: 15px;">
                      <input type="text" v-model="analyticsFilters.topPagesSearch"
                             placeholder="Поиск по странице..."
                             style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff;"
                      >
                    </div>
                  </div>
                  <div class="table-responsive">
                    <table class="analytics-table" ref="topPagesTable">
                      <thead>
                      <tr>
                        <th data-column="analytics_top_page_url">Страница<div
                            class="column-resize-handle"></div>
                        </th>
                        <th data-column="analytics_top_page_count">Посещений<div
                            class="column-resize-handle"></div>
                        </th>
                      </tr>
                      </thead>
                      <tbody>
                      <tr v-for="page in filteredTopPages" :key="page.url">
                        <td>
                          <span v-if="page.is_virtual"
                                style="color: #2ecc71; margin-right: 5px;"
                                title="Виртуальная страница">
                            <i class="fas fa-file-alt"></i>
                          </span>
                          {{ getProductName(page.url) }}
                        </td>
                        <td><strong>{{ page.count }}</strong></td>
                      </tr>
                      <tr v-if="filteredTopPages.length === 0">
                        <td colspan="2" style="text-align: center; color: #888;">
                          {{ analyticsFilters.topPagesSearch ? 'Ничего не найдено' : 'Нет данных' }}
                        </td>
                      </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div class="table-card">
                  <h3 style="margin: 0 0 15px 0;">
                    <i class="fa-solid fa-bag-shopping"
                       style="color: #3498db; margin-right: 8px;"
                    ></i>
                    Страницы сайта
                  </h3>
                  <div class="table-responsive">
                    <table class="analytics-table" ref="topPhpPagesTable">
                      <thead>
                      <tr>
                        <th data-column="analytics_php_page_url">Страница<div
                            class="column-resize-handle"></div>
                        </th>
                        <th data-column="analytics_php_page_count">Посещений<div
                            class="column-resize-handle"></div>
                        </th>
                      </tr>
                      </thead>
                      <tbody>
                      <tr v-for="page in filteredTopPhpPages" :key="page.url">
                        <td>{{ getProductName(page.url) }}</td>
                        <td><strong>{{ page.count }}</strong></td>
                      </tr>
                      <tr v-if="filteredTopPhpPages.length === 0">
                        <td colspan="2" style="text-align: center; color: #888;">Нет данных
                        </td>
                      </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div class="table-card">
                  <h3>Последние посещения</h3>
                  <div class="table-responsive">
                    <table class="analytics-table" ref="recentVisitsTable">
                      <thead>
                      <tr>
                        <th data-column="analytics_visit_date">
                          Дата
                          <div class="column-resize-handle"></div>
                        </th>
                        <th data-column="analytics_visit_time">
                          Время
                          <div class="column-resize-handle"></div>
                        </th>
                        <th data-column="analytics_visit_ip">
                          IP адрес
                          <div class="column-resize-handle"></div>
                        </th>
                        <th data-column="analytics_visit_url">
                          Страница
                          <div class="column-resize-handle"></div>
                        </th>
                        <th data-column="analytics_visit_referer">
                          Источник
                          <div class="column-resize-handle"></div>
                        </th>
                      </tr>
                      </thead>
                      <tbody>
                      <tr v-for="visit in filteredRecentVisits"
                          :key="visit.date + visit.time + visit.ip"
                      >
                        <td>{{ visit.date }}</td>
                        <td>{{ visit.time }}</td>
                        <td>{{ visit.ip }}</td>
                        <td>{{ visit.url === '/' ? 'Домашняя' : visit.url }}</td>
                        <td>{{ visit.referer || '-' }}</td>
                      </tr>
                      <tr v-if="filteredRecentVisits.length === 0">
                        <td colspan="5" style="text-align: center; color: #888;">
                          {{ (analyticsFilters.ip || analyticsFilters.url ||
                            analyticsFilters.referer || analyticsFilters.date) ? 'Ничего не найдено' : 'Нет данных' }}
                        </td>
                      </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `,
        data() {
            return {
                analyticsData: {
                    recent_visits: null,
                    total_visits: null,
                    unique_visitors: null,
                    period_days: null
                },
                analyticsLoading: false,
                analyticsError: '',
                analyticsPeriod: '7',
                analyticsFilters: {
                    ip: '',
                    url: '',
                    referer: '',
                    date: '',
                    topPagesSearch: ''
                },
            }
        },
        mounted() {
            this.loadAnalytics().then(r => null);
        },
        computed: {
            filteredRecentVisits() {
                if (!this.analyticsData || !this.analyticsData.recent_visits) {
                    return [];
                }

                let filtered = this.analyticsData.recent_visits.filter(visit => {
                    return !visit.url || !visit.url.startsWith('/?');
                });

                if (Array.isArray(this.badIps) && this.badIps.length > 0) {
                    filtered = filtered.filter(visit => {
                        const ip = visit.ip ? String(visit.ip).trim().toLowerCase() : '';
                        if (!ip) {
                            return true;
                        }

                        return !this.badIps.some(blockedIp =>
                            blockedIp &&
                            String(blockedIp).trim().toLowerCase() === ip
                        );
                    });
                }

                if (this.analyticsFilters.ip) {
                    const ipFilter = this.analyticsFilters.ip.toLowerCase().trim();

                    filtered = filtered.filter(visit => {
                        if (!visit.ip) {
                            return false;
                        }
                        return visit.ip.toLowerCase().includes(ipFilter);
                    });
                }

                const currentHost = (this.win && this.win.location && this.win.location.host) || '';
                filtered = filtered.filter(visit => {
                    if (!visit.referer) {
                        return false;
                    }

                    try {
                        const url = new URL(visit.referer, this.win ? this.win.location.origin : undefined);
                        return !currentHost || url.host !== currentHost;
                    } catch (e) {
                        return false;
                    }
                });

                if (this.analyticsFilters.url) {
                    const urlFilter = this.analyticsFilters.url.toLowerCase().trim();

                    filtered = filtered.filter(visit => {
                        const url = visit.url === '/' ? 'домашняя' : visit.url.toLowerCase();
                        return url.includes(urlFilter);
                    });
                }

                if (this.analyticsFilters.referer) {
                    const refererFilter = this.analyticsFilters.referer.toLowerCase().trim();

                    filtered = filtered.filter(visit =>
                        visit.referer && visit.referer.toLowerCase().includes(refererFilter)
                    );
                }

                if (this.analyticsFilters.date) {
                    filtered = filtered.filter(visit => visit.date === this.analyticsFilters.date);
                }

                return filtered;
            },
            filteredTopPages() {
                if (!this.analyticsData || !this.analyticsData.top_pages) {
                    return [];
                }

                let filtered = this.analyticsData.top_pages.filter(page => {
                    return !page.url || !page.url.startsWith('/?');
                });

                if (!this.analyticsFilters.topPagesSearch) {
                    return filtered;
                }

                const searchFilter = this.analyticsFilters.topPagesSearch.toLowerCase().trim();

                return filtered.filter(page => {
                    const url = page.url === '/' ? 'домашняя' : page.url.toLowerCase();
                    return url.includes(searchFilter);
                });
            },
            filteredTopPhpPages() {
                if (!this.analyticsData || !this.analyticsData.top_php_pages) {
                    return [];
                }

                return this.analyticsData.top_php_pages.filter(page => {
                    return !page.url || !page.url.startsWith('/?');
                });
            }
        },
        methods: {
            async loadAnalytics() {
                this.analyticsLoading = true;
                this.analyticsError = '';

                try {
                    const response = await fetch('../api.php?action=analytics&period=' + this.analyticsPeriod, { credentials: 'same-origin' });
                    if (response.ok) {
                        this.analyticsData = await response.json();
                        this.$nextTick(() => {
                            this.renderCharts();
                            this.initAnalyticsColumnResize();
                        });
                    } else {
                        this.analyticsError = 'Ошибка загрузки аналитики';
                    }
                } catch (error) {
                    console.error('Error loading analytics:', error);
                    this.analyticsError = 'Ошибка загрузки аналитики';
                }

                this.analyticsLoading = false;
            },
            clearAnalyticsFilters() {
                this.analyticsFilters = {
                    ip: '',
                    url: '',
                    referer: '',
                    date: '',
                    topPagesSearch: ''
                };
            },
            initAnalyticsColumnResize() {
                this.$nextTick(() => {
                    setTimeout(() => {
                        const topPagesTable = this.$refs.topPagesTable;

                        if (topPagesTable) {
                            const handles = topPagesTable.querySelectorAll('.column-resize-handle');

                            handles.forEach(handle => {
                                const newHandle = handle.cloneNode(true);
                                handle.parentNode.replaceChild(newHandle, handle);
                                this.setupAnalyticsColumnResize(newHandle, 'analytics_top');
                            });

                            this.loadAnalyticsColumnWidths('analytics_top', topPagesTable);
                        }

                        const topPhpPagesTable = this.$refs.topPhpPagesTable;

                        if (topPhpPagesTable) {
                            const handles = topPhpPagesTable.querySelectorAll('.column-resize-handle');

                            handles.forEach(handle => {
                                const newHandle = handle.cloneNode(true);
                                handle.parentNode.replaceChild(newHandle, handle);
                                this.setupAnalyticsColumnResize(newHandle, 'analytics_php');

                            });
                            this.loadAnalyticsColumnWidths('analytics_php', topPhpPagesTable);
                        }

                        const recentVisitsTable = this.$refs.recentVisitsTable;

                        if (recentVisitsTable) {
                            const handles = recentVisitsTable.querySelectorAll('.column-resize-handle');

                            handles.forEach(handle => {
                                const newHandle = handle.cloneNode(true);
                                handle.parentNode.replaceChild(newHandle, handle);
                                this.setupAnalyticsColumnResize(newHandle, 'analytics_visit');
                            });

                            this.loadAnalyticsColumnWidths('analytics_visit', recentVisitsTable);
                        }
                    }, 100);
                });
            },
            setupAnalyticsColumnResize(handle, prefix) {
                let isResizing = false;
                let startX = 0;
                let startWidth = 0;
                let column = null;
                let indicator = null;

                const startResize = (e) => {
                    if (window.innerWidth <= 768) return;

                    e.preventDefault();
                    e.stopPropagation();

                    isResizing = true;
                    startX = e.clientX;
                    column = handle.parentElement;
                    startWidth = column.offsetWidth;

                    indicator = document.createElement('div');
                    indicator.className = 'resize-indicator';
                    document.body.appendChild(indicator);

                    const updateIndicator = (e) => {
                        const rect = column.getBoundingClientRect();
                        indicator.style.left = (rect.right + (e.clientX - startX)) + 'px';
                        indicator.classList.add('active');
                    };

                    const handleMouseMove = (e) => {
                        if (!isResizing) return;
                        e.preventDefault();
                        updateIndicator(e);
                    };

                    const stopResize = (e) => {
                        if (!isResizing) return;

                        const newWidth = Math.max(50, startWidth + (e.clientX - startX));

                        column.style.width = newWidth + 'px';
                        column.style.minWidth = newWidth + 'px';

                        const table = column.closest('table');
                        const headerRow = table.querySelector('thead tr');
                        const columnIndex = Array.from(headerRow.children).indexOf(column);

                        const rows = table.querySelectorAll('tbody tr');
                        rows.forEach(row => {
                            const cells = row.querySelectorAll('td');
                            if (cells[columnIndex]) {
                                cells[columnIndex].style.width = newWidth + 'px';
                                cells[columnIndex].style.minWidth = newWidth + 'px';
                            }
                        });

                        const columnName = column.dataset.column;
                        this.saveAnalyticsColumnWidth(columnName, newWidth);

                        isResizing = false;
                        handle.classList.remove('active');

                        if (indicator) {
                            indicator.classList.remove('active');
                            setTimeout(() => {
                                if (indicator && indicator.parentNode) {
                                    indicator.parentNode.removeChild(indicator);
                                }
                            }, 200);
                        }

                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', stopResize);
                    };

                    handle.classList.add('active');

                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', stopResize);
                };

                handle.addEventListener('mousedown', startResize);
            },
            saveAnalyticsColumnWidth(columnName, width) {
                const savedWidths = JSON.parse(localStorage.getItem('admin_analytics_column_widths') || '{}');
                savedWidths[columnName] = width;
                localStorage.setItem('admin_analytics_column_widths', JSON.stringify(savedWidths));
            },
            loadAnalyticsColumnWidths(prefix, table) {
                const savedWidths = JSON.parse(localStorage.getItem('admin_analytics_column_widths') || '{}');
                if (!table) return;

                Object.keys(savedWidths).forEach(columnName => {
                    if (columnName.startsWith(prefix)) {
                        const column = table.querySelector('th[data-column="' + columnName + ']');

                        if (column) {
                            const width = savedWidths[columnName] + 'px';
                            column.style.width = width;
                            column.style.minWidth = width;

                            const headerRow = table.querySelector('thead tr');
                            const columnIndex = Array.from(headerRow.children).indexOf(column);

                            const rows = table.querySelectorAll('tbody tr');
                            rows.forEach(row => {
                                const cells = row.querySelectorAll('td');

                                if (cells[columnIndex]) {
                                    cells[columnIndex].style.width = width;
                                    cells[columnIndex].style.minWidth = width;
                                }
                            });
                        }
                    }
                });
            },
            renderCharts() {
                if (!this.analyticsData) return;

                if (this.dailyChart) {
                    this.dailyChart.destroy();
                }

                if (this.hourlyChart) {
                    this.hourlyChart.destroy();
                }

                const dailyCtx = this.$refs.dailyChart;

                if (dailyCtx) {
                    const dailyLabels = this.analyticsData.daily_visits.map(v => {
                        const date = new Date(v.date);
                        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
                    });

                    const dailyData = this.analyticsData.daily_visits.map(v => v.count);

                    this.dailyChart = new Chart(dailyCtx, {
                        type: 'line',
                        data: {
                            labels: dailyLabels,
                            datasets: [{
                                label: 'Посещений',
                                data: dailyData,
                                borderColor: '#3498db',
                                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                                tension: 0.4,
                                fill: true
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        stepSize: 1
                                    }
                                }
                            }
                        }
                    });
                }

                const hourlyCtx = this.$refs.hourlyChart;

                if (hourlyCtx) {
                    const hourlyLabels = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');
                    const hourlyData = Array.from({ length: 24 }, (_, i) => {
                        const hourData = this.analyticsData.hourly_visits.find(h => h.hour === i);
                        return hourData ? hourData.count : 0;
                    });

                    this.hourlyChart = new Chart(hourlyCtx, {
                        type: 'bar',
                        data: {
                            labels: hourlyLabels,
                            datasets: [{
                                label: 'Посещений',
                                data: hourlyData,
                                backgroundColor: '#2ecc71',
                                borderColor: '#27ae60',
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        stepSize: 1
                                    }
                                }
                            }
                        }
                    });
                }
            },
            getProductName(url) {
                const raw = (url ?? '').toString();
                if (raw === '') return '';

                try {
                    const noHash = raw.split('#')[0];
                    const noQuery = noHash.split('?')[0];
                    const trimmed = noQuery.replace(/\/+$/, '');
                    const decoded = decodeURIComponent(trimmed);
                    return decoded === '' ? raw : decoded;
                } catch (e) {
                    return raw;
                }
            }
        }
    }

    const Profile = {
        mixins: [Values, Auth],
        template: `
          <div class="admin-content">
            <main class="profile">
              <div class="container">
                <section class="profile">
                  <h2>Смена пароля</h2>
                  <form class="password-change-form" @submit.prevent="changePassword">
                    <div class="form-group">
                      <label>Текущий пароль</label>
                      <input type="password" v-model="passwordForm.current_password"
                             placeholder="Введите текущий пароль"
                             required
                             autocomplete="current-password">
                    </div>
                    <div class="form-group">
                      <label>Новый пароль</label>
                      <input type="password" v-model="passwordForm.new_password"
                             placeholder="Введите новый пароль (минимум 6 символов)"
                             required
                             autocomplete="new-password"
                             minlength="6">
                    </div>
                    <div class="form-group">
                      <label>Подтвердите новый пароль</label>
                      <input type="password" v-model="passwordForm.confirm_password"
                             placeholder="Повторите новый пароль"
                             required
                             autocomplete="new-password"
                             minlength="6">
                    </div>
                    <div v-if="passwordError" class="error-message">{{ passwordError }}</div>
                    <div v-if="passwordSuccess" class="success-message">{{ passwordSuccess }}</div>
                    <div class="form-actions">
                      <button type="submit" class="btn btn-primary" :disabled="passwordLoading">
                        <span v-if="passwordLoading">Сохранение...</span>
                        <span v-else>Изменить пароль</span>
                      </button>
                    </div>
                  </form>
                </section>
              </div>
            </main>
          </div>
        `,
        data() {
            return {
                passwordForm: {
                    current_password: '',
                    new_password: '',
                    confirm_password: ''
                },
                passwordLoading: false,
                passwordError: '',
                passwordSuccess: ''
            }
        }
    }

    const Settings = {
        mixins: [Service],
        components: {
            Service
        },
        template: `
      <main class="admin-main">
        <div class="container">
          <section class="params">
            <form class="main-params" @submit.prevent>
              <div class="form-group">
                <h3>Логотип сайта</h3>
                <img v-if="data.logoUrl" :src="data.logoUrl" alt="Логотип" style="max-height: 60px;" />
                <input type="file" name="logo" accept="image/*" @change="data.logo = $event.target.files[0]" />
                <button type="button" class="btn" @click.prevent="uploadLogo" :disabled="!data.logo">Загрузить</button>
              </div>
              <div class="form-group">
                <label>Заголовок сайта</label>
                <input type="text" v-model="data.title" placeholder="Заголовок">
              </div>
              <div class="form-group">
                <label>Описание сайта</label>
                <textarea v-model="data.description"></textarea>
              </div>
              <div class="form-group">
                <label>Мета-теги изображений товаров</label>
                <textarea v-model="data.imageMetaTags"></textarea>
              </div>
              <h2>Информация о самовывозе</h2>
              <div class="form-group">
                <label>Адрес магазина</label>
                <input type="text" v-model="data.pickupAddress" placeholder="ул. Пушкина, д.228">
              </div>
              <div class="form-group">
                <label>Время работы</label>
                <input type="text" v-model="data.workHours" placeholder="Пн-Сб 9:00-21:00">
              </div>
              <div class="form-group">
                <label>Телефон</label>
                <input type="text" v-model="data.storePhone" placeholder="+375123456789">
              </div>
              <h2>Стоимость доставки</h2>
              <div class="form-group">
                <label>Белоруссия</label>
                <input type="text" v-model="data.deliveryBel">
              </div>
              <div class="form-group">
                <label>Россия</label>
                <input type="text" v-model="data.deliveryRus">
              </div>
              <div style="display: flex; justify-content: flex-end">
                <span class="btn btn-primary" @click="saveParams">Сохранить</span>
              </div>
            </form>
          </section>
        </div>
      </main>
    `,
        data() {
            return {
                data: {
                    logoUrl: '',
                    title: '',
                    description: '',
                    imageMetaTags: '',
                    pickupAddress: '',
                    workHours: '',
                    storePhone: '',
                    deliveryBel: '',
                    deliveryRus: '',
                }
            }
        },
        mounted() {
            this.loadParams().then(() => null);
        },
        methods: {
            async loadParams() {
                try {
                    const response = await fetch('../api.php?action=get_params', { credentials: 'same-origin' });

                    if (response.ok) {
                        const data = await response.json();

                        if (data && typeof data === 'object') {
                            this.data.title = data.title;
                            this.data.description = data.description;
                            this.data.imageMetaTags = data.image_meta_tags;
                            this.data.pickupAddress = data.pickup_address;
                            this.data.workHours = data.work_hours;
                            this.data.storePhone = data.store_phone;
                            this.data.deliveryBel = data.delivery_bel;
                            this.data.deliveryRus = data.delivery_rus;
                        }
                    }
                } catch (error) {
                    console.error('Error loading params:', error);
                }
            },
            async saveParams() {
                try {
                    const formData = new FormData();

                    formData.append('action', 'save_params');
                    formData.append('title', this.data.title || '');
                    formData.append('description', this.data.description || '');
                    formData.append('image_meta_tags', this.data.imageMetaTags || '');
                    formData.append('pickup_address', this.data.pickupAddress || '');
                    formData.append('work_hours', this.data.workHours || '');
                    formData.append('store_phone', this.data.storePhone || '');
                    formData.append('delivery_bel', this.data.deliveryBel || 0);
                    formData.append('delivery_rus', this.data.deliveryRus || 0);

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        alert('Параметры успешно сохранены');
                    } else {
                        alert('Ошибка при сохранении параметров: ' + (data.error || 'Неизвестная ошибка'));
                    }
                } catch (error) {
                    alert('Произошла ошибка при сохранении параметров: ' + error);
                }
            },
            async uploadLogo(e) {
                const result = await this.uploadImage(this.data.logo ?? e, 'logo', { maxSizeMb: 5, fieldName: 'logo' });

                if (result?.url) {
                    alert('Логотип успешно загружен');

                    this.data.logo = result.url;
                    this.data.logo = null;
                }
            },
        }
    }

/*    window.Values = Values;
    window.Modal = Modal;
    window.Auth = Auth;
    window.Category = Category;
    window.Options = Options;
    window.ProductFormMixin = ProductFormMixin;
    window.Product = Product;
    window.Users = Users;
    window.Messages = Messages;
    window.Message = Message;
    window.Reply = Reply;
    window.Orders = Orders;
    window.Analytics = Analytics;
    window.Profile = Profile;
    window.Settings = Settings;*/
});