const Modal = {
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
                const modal = document.querySelector(`[data-modal-id="${modalId}"]`);

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
                const modal = document.querySelector(`[data-modal-id="${modalId}"]`);
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

            const modal = document.querySelector(`[data-modal-id="${modalId}"]`);

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

            const modal = document.querySelector(`[data-modal-id="${this.resizingModal}"]`);
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

            const modal = document.querySelector(`[data-modal-id="${this.resizingModal}"]`);

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
            const modal = document.querySelector(`[data-modal-id="${modalId}"]`);
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
            const modal = document.querySelector(`[data-modal-id="${modalId}"]`);
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

            const modal = document.querySelector(`[data-modal-id="${modalId}"]`);
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
            const modal = document.querySelector(`[data-modal-id="${modalId}"]`);
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
            const modal = document.querySelector(`[data-modal-id="${modalId}"]`);
            if (!modal || !this.minimizedModals[modalId]) return;

            const minimizedData = this.minimizedModals[modalId];
            const restoreData = minimizedData.restoreData;

            modal.style.display = '';

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
            const modal = document.querySelector(`[data-modal-id="${modalId}"]`);
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
            const modal = document.querySelector(`[data-modal-id="${modalId}"]`);
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

            const modal = document.querySelector(`[data-modal-id="${modalId}"]`);
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

            const modal = document.querySelector(`[data-modal-id="${this.draggingModal}"]`);
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

            const modal = document.querySelector(`[data-modal-id="${this.draggingModal}"]`);

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

            const activeModal = document.querySelector(`.modal[data-modal-id="${modalId}"]`);
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
        openAddProductModal() {
            this.openModal('productModal', {
                showProperty: 'showAddProduct',
                mobilePage: 'product',
                beforeOpen: () => {
                    if (this.turnTextareaResize) {
                        this.turnTextareaResize();
                    }
                }
            });
        },
        closeProductModal(event) {
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
                            image: '',
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
};

if (typeof window !== 'undefined') {
    NV.Modal = Modal;
}