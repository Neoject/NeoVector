export const Modal = {
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
        addUserModal: 'Создать пользователя',
        contentModal: 'Редактирование контента',
        pageModal: 'Управление страницей',
        blockModal: 'Управление блоком',
        iconPickerModal: 'Выбор иконки',
        productModal: 'Управление товаром',
        navigationModal: 'Управление навигацией',
        profileModal: 'Управление профилем',
      },
    }
  },
  methods: {
    closeModal(event) {
      this._closeModalGeneric('productModal', event, {
        showProperty: 'showAddProduct',
        mobilePage: 'admin',
        beforeClose: () => {
          if (this.editingProduct !== undefined) this.editingProduct = null
          if (this.selectedFile !== undefined) this.selectedFile = null
          if (this.productForm) {
            this.productForm = {
              name: '', description: '', peculiarities: [], material: '',
              price: '', price_sale: '', category: '', product_type_id: null,
              image: '', image_description: '', additionalImages: [], additionalVideos: [],
            }
          }
          if (this.aiGeneratingDescription !== undefined) this.aiGeneratingDescription = false
          if (this.aiGenerationError !== undefined) this.aiGenerationError = ''
          if (this.newPeculiarity !== undefined) this.newPeculiarity = ''
          if (this.$refs?.fileInput) this.$refs.fileInput.value = ''
          if (this.$refs?.additionalImagesInput) this.$refs.additionalImagesInput.value = ''
        },
      })
    },
    openAddProductModal() {
      this.openModal('productModal', {
        showProperty: 'showAddProduct',
        mobilePage: 'product',
        beforeOpen: () => {
          if (typeof this.turnTextareaResize === 'function') this.turnTextareaResize()
        },
      })
    },
    loadModalSizes() {
      try {
        const saved = localStorage.getItem('admin_modal_sizes')
        if (saved) this.modalSizes = JSON.parse(saved)
      } catch (e) {
        console.error('Error loading modal sizes', e)
      }
    },
    saveModalSizes() {
      try {
        localStorage.setItem('admin_modal_sizes', JSON.stringify(this.modalSizes))
      } catch (e) {
        console.error('Error saving modal sizes', e)
      }
    },
    checkAllModalsBounds() {
      const ids = ['addUserModal', 'contentModal', 'pageModal', 'blockModal', 'iconPickerModal', 'productModal']
      ids.forEach(id => {
        const modal = document.querySelector(`[data-modal-id=${id}]`)
        if (modal && window.getComputedStyle(modal).display !== 'none') {
          this.constrainModalToViewport(modal)
        }
      })
    },
    constrainModalToViewport(modal) {
      const rect = modal.getBoundingClientRect()
      const vw = window.innerWidth, vh = window.innerHeight, pad = 20, minW = 400, minH = 200
      let { left: nl, top: nt, width: nw, height: nh } = rect

      if (rect.right > vw - pad) {
        if (rect.left + minW + pad <= vw) nw = vw - pad - rect.left
        else { nl = vw - pad - minW; nw = minW }
      }
      if (rect.bottom > vh - pad) {
        if (rect.top + minH + pad <= vh) nh = vh - pad - rect.top
        else { nt = vh - pad - minH; nh = minH }
      }
      if (rect.left < pad) {
        nl = pad
        if (nl + nw > vw - pad) nw = vw - pad - nl
      }
      if (rect.top < pad) {
        nt = pad
        if (nt + nh > vh - pad) nh = vh - pad - nt
      }

      if (modal.style.position === 'fixed' || modal.style.left || modal.style.top) {
        modal.style.position = 'fixed'
        modal.style.left = Math.max(pad, Math.min(nl, vw - pad - nw)) + 'px'
        modal.style.top = Math.max(pad, Math.min(nt, vh - pad - nh)) + 'px'
        modal.style.right = 'auto'
        modal.style.bottom = 'auto'
      }
      modal.style.width = Math.max(minW, Math.min(nw, vw - 2 * pad)) + 'px'
      modal.style.height = Math.max(minH, Math.min(nh, vh - 2 * pad)) + 'px'
      modal.style.maxWidth = 'none'
      modal.style.maxHeight = 'none'
    },
    applyModalSize(modalId, params = {}) {
      this.$nextTick(() => {
        const modal = document.querySelector(`[data-modal-id="${modalId}"]`)
        if (!modal) return
        const size = this.modalSizes[modalId]
        if (size?.width && size?.height) {
          modal.style.width = size.width
          modal.style.height = size.height
          modal.style.maxWidth = 'none'
          modal.style.maxHeight = 'none'
          if (size.left !== undefined || size.top !== undefined) {
            modal.style.position = 'fixed'
            if (size.left !== undefined) { modal.style.left = size.left + 'px'; modal.style.right = 'auto' }
            if (size.top !== undefined) { modal.style.top = size.top + 'px'; modal.style.bottom = 'auto' }
          } else {
            this.centerModal(modal)
          }
        } else {
          this.setDefaultModalSize(modal, params)
        }
        this.constrainModalToViewport(modal)
      })
    },
    setDefaultModalSize(modal, params = {}) {
      if (!modal) return
      modal.style.width = params.width || '25vw'
      modal.style.height = params.height || '60vh'
      modal.style.position = 'fixed'
      requestAnimationFrame(() => {
        const rect = modal.getBoundingClientRect()
        const left = (window.innerWidth - rect.width) / 2
        const top = (window.innerHeight - rect.height) / 2
        modal.style.left = Math.max(20, left) + 'px'
        modal.style.top = Math.max(20, top) + 'px'
        modal.style.right = 'auto'
        modal.style.bottom = 'auto'
      })
    },
    centerModal(modal) {
      if (!modal) return
      modal.style.position = 'fixed'
      requestAnimationFrame(() => {
        const rect = modal.getBoundingClientRect()
        let w = rect.width || parseFloat(window.getComputedStyle(modal).width) || 600
        let h = rect.height || parseFloat(window.getComputedStyle(modal).height) || 400
        const left = (window.innerWidth - w) / 2
        const top = (window.innerHeight - h) / 2
        modal.style.left = Math.max(20, left) + 'px'
        modal.style.top = Math.max(20, top) + 'px'
        modal.style.right = 'auto'
        modal.style.bottom = 'auto'
      })
    },
    startResize(event, modalId, direction) {
      if (this.draggingModal === modalId) return
      event.preventDefault()
      event.stopPropagation()
      this.resizingModal = modalId
      this.resizeDirection = direction
      const modal = document.querySelector(`[data-modal-id="${modalId}"]`)
      if (!modal) return
      const rect = modal.getBoundingClientRect()
      this.resizeStartX = event.clientX
      this.resizeStartY = event.clientY
      this.resizeStartWidth = rect.width
      this.resizeStartHeight = rect.height
      this.resizeStartLeft = rect.left
      this.resizeStartTop = rect.top
      this.boundHandleResize = this.handleResize.bind(this)
      this.boundStopResize = this.stopResize.bind(this)
      document.addEventListener('mousemove', this.boundHandleResize)
      document.addEventListener('mouseup', this.boundStopResize)
    },
    handleResize(event) {
      if (!this.resizingModal || !this.resizeDirection) return
      const modal = document.querySelector(`[data-modal-id="${this.resizingModal}"]`)
      if (!modal) return
      const dx = event.clientX - this.resizeStartX
      const dy = event.clientY - this.resizeStartY
      const pad = 20, minW = 400, maxW = window.innerWidth - 2 * pad, minH = 200, maxH = window.innerHeight - 2 * pad
      const vw = window.innerWidth, vh = window.innerHeight
      const dir = this.resizeDirection
      let nw = this.resizeStartWidth, nh = this.resizeStartHeight, nl = this.resizeStartLeft, nt = this.resizeStartTop

      if (dir.includes('e')) {
        nw = Math.max(minW, Math.min(maxW, this.resizeStartWidth + dx))
        if (nl + nw > vw - pad) nw = vw - pad - nl
      }
      if (dir.includes('w')) {
        nw = Math.max(minW, Math.min(maxW, this.resizeStartWidth - dx))
        nl = this.resizeStartLeft + (this.resizeStartWidth - nw)
        if (nl < pad) { nl = pad; nw = Math.max(minW, Math.min(maxW, this.resizeStartWidth + this.resizeStartLeft - pad)) }
      }
      if (dir.includes('s')) {
        nh = Math.max(minH, Math.min(maxH, this.resizeStartHeight + dy))
        if (nt + nh > vh - pad) nh = vh - pad - nt
      }
      if (dir.includes('n')) {
        nh = Math.max(minH, Math.min(maxH, this.resizeStartHeight - dy))
        nt = this.resizeStartTop + (this.resizeStartHeight - nh)
        if (nt < pad) { nt = pad; nh = Math.max(minH, Math.min(maxH, this.resizeStartHeight + this.resizeStartTop - pad)) }
      }

      modal.style.width = Math.max(minW, Math.min(nw, vw - 2 * pad)) + 'px'
      modal.style.height = Math.max(minH, Math.min(nh, vh - 2 * pad)) + 'px'
      modal.style.position = 'fixed'
      if (dir.includes('w')) { modal.style.left = Math.max(pad, Math.min(nl, vw - pad - parseFloat(modal.style.width))) + 'px'; modal.style.right = 'auto' }
      if (dir.includes('n')) { modal.style.top = Math.max(pad, Math.min(nt, vh - pad - parseFloat(modal.style.height))) + 'px'; modal.style.bottom = 'auto' }
      modal.style.maxWidth = 'none'
      modal.style.maxHeight = 'none'
    },
    stopResize() {
      if (!this.resizingModal) return
      const modal = document.querySelector(`[data-modal-id="${this.resizingModal}"]`)
      if (modal) {
        const rect = modal.getBoundingClientRect()
        const cs = window.getComputedStyle(modal)
        const size = { width: rect.width + 'px', height: rect.height + 'px' }
        if (cs.left !== 'auto' && cs.left !== '') size.left = rect.left
        if (cs.top !== 'auto' && cs.top !== '') size.top = rect.top
        this.modalSizes[this.resizingModal] = size
        this.saveModalSizes()
      }
      this.resizingModal = null
      this.resizeDirection = null
      if (this.boundHandleResize) { document.removeEventListener('mousemove', this.boundHandleResize); this.boundHandleResize = null }
      if (this.boundStopResize) { document.removeEventListener('mouseup', this.boundStopResize); this.boundStopResize = null }
    },
    handleResizeDoubleClick(modalId, direction, event) {
      event.preventDefault()
      event.stopPropagation()
      const now = Date.now()
      if (this.lastResizeClick.modalId === modalId && this.lastResizeClick.direction === direction && (now - this.lastResizeClick.time) < 300) {
        this.toggleResizeMaximize(modalId, direction)
        this.lastResizeClick = { modalId: null, direction: null, time: 0 }
      } else {
        this.lastResizeClick = { modalId, direction, time: now }
      }
    },
    toggleResizeMaximize(modalId, direction) {
      const modal = document.querySelector(`[data-modal-id="${modalId}"]`)
      if (!modal || this.maximizedModals[modalId]) return
      const cs = window.getComputedStyle(modal)
      const pad = 20, vw = window.innerWidth, vh = window.innerHeight
      const cw = parseFloat(cs.width), ch = parseFloat(cs.height)
      const maxW = vw - 2 * pad, maxH = vh - 2 * pad
      const isH = direction.includes('e') || direction.includes('w')
      const isV = direction.includes('n') || direction.includes('s')
      if ((isH && cw >= maxW * 0.95) || (isV && ch >= maxH * 0.95)) {
        this.restoreResizeSize(modalId, isH, isV)
      } else {
        this.maximizeResize(modalId, direction)
      }
    },
    maximizeResize(modalId, direction) {
      const modal = document.querySelector(`[data-modal-id="${modalId}"]`)
      if (!modal) return
      const cs = window.getComputedStyle(modal)
      const pad = 20, vw = window.innerWidth, vh = window.innerHeight
      if (!this.resizeRestoreData[modalId]) {
        this.resizeRestoreData[modalId] = { width: cs.width, height: cs.height, left: cs.left, top: cs.top }
      }
      const isH = direction.includes('e') || direction.includes('w')
      const isV = direction.includes('n') || direction.includes('s')
      modal.style.position = 'fixed'
      if (isH) { modal.style.width = (vw - 2 * pad) + 'px'; modal.style.left = pad + 'px'; modal.style.right = 'auto'; modal.style.maxWidth = 'none' }
      if (isV) { modal.style.height = (vh - 2 * pad) + 'px'; modal.style.top = pad + 'px'; modal.style.bottom = 'auto'; modal.style.maxHeight = 'none' }
      this.constrainModalToViewport(modal)
      const nr = modal.getBoundingClientRect()
      this.modalSizes[modalId] = { width: nr.width + 'px', height: nr.height + 'px', left: nr.left, top: nr.top }
      this.saveModalSizes()
    },
    restoreResizeSize(modalId, isH = null, isV = null) {
      if (!this.resizeRestoreData[modalId]) return
      const modal = document.querySelector(`[data-modal-id="${modalId}"]`)
      if (!modal) return
      const rd = this.resizeRestoreData[modalId]
      if (isH && rd.width) {
        modal.style.width = rd.width
        if (rd.left && rd.left !== 'auto') modal.style.left = rd.left
        modal.style.maxWidth = ''
        delete rd.width; delete rd.left
      }
      if (isV && rd.height) {
        modal.style.height = rd.height
        if (rd.top && rd.top !== 'auto') modal.style.top = rd.top
        modal.style.maxHeight = ''
        delete rd.height; delete rd.top
      }
      if (Object.keys(rd).length === 0) delete this.resizeRestoreData[modalId]
      const nr = modal.getBoundingClientRect()
      this.modalSizes[modalId] = { width: nr.width + 'px', height: nr.height + 'px', left: nr.left, top: nr.top }
      this.saveModalSizes()
    },
    minimizeModal(modalId) {
      const modal = document.querySelector(`[data-modal-id="${modalId}"]`)
      if (!modal) return
      const cs = window.getComputedStyle(modal)
      const rd = { width: cs.width, height: cs.height, left: cs.left, top: cs.top, position: cs.position, right: cs.right, bottom: cs.bottom, maxWidth: cs.maxWidth, maxHeight: cs.maxHeight }
      if (this.maximizedModals[modalId]) { rd.wasMaximized = true; rd.maximizedRestoreData = this.maximizedModals[modalId] }
      this.minimizedModals[modalId] = { title: this.getModalTitle(modalId), restoreData: rd }
      modal.style.display = 'none'
      if (this.maximizedModals[modalId]) delete this.maximizedModals[modalId]
      this.$forceUpdate()
    },
    restoreModal(modalId) {
      const modal = document.querySelector(`[data-modal-id="${modalId}"]`)
      if (!modal || !this.minimizedModals[modalId]) return
      const rd = this.minimizedModals[modalId].restoreData
      modal.style.display = ''
      modal.style.width = (rd.width && rd.width !== 'auto') ? rd.width : '50vw'
      modal.style.height = (rd.height && rd.height !== 'auto') ? rd.height : '50vh'
      if (rd.position) modal.style.position = rd.position
      if (rd.left && rd.left !== 'auto') { modal.style.left = rd.left; modal.style.right = rd.right || 'auto' }
      if (rd.top && rd.top !== 'auto') { modal.style.top = rd.top; modal.style.bottom = rd.bottom || 'auto' }
      if (rd.maxWidth) modal.style.maxWidth = rd.maxWidth
      if (rd.maxHeight) modal.style.maxHeight = rd.maxHeight
      if (rd.wasMaximized && rd.maximizedRestoreData) {
        this.$nextTick(() => { this.maximizedModals[modalId] = rd.maximizedRestoreData; this.maximizeModal(modalId) })
      }
      delete this.minimizedModals[modalId]
      this.applyModalSize(modalId)
      this.$forceUpdate()
    },
    maximizeModal(modalId) {
      const modal = document.querySelector(`[data-modal-id="${modalId}"]`)
      if (!modal) return
      const cs = window.getComputedStyle(modal)
      this.maximizedModals[modalId] = { width: cs.width, height: cs.height, left: cs.left, top: cs.top, position: cs.position, right: cs.right, bottom: cs.bottom, maxWidth: cs.maxWidth, maxHeight: cs.maxHeight }
      Object.assign(modal.style, { position: 'fixed', left: '0', top: '0', right: '0', bottom: '0', width: '100vw', height: '100vh', maxWidth: 'none', maxHeight: 'none' })
      this.$forceUpdate()
    },
    restoreFromMaximize(modalId) {
      const modal = document.querySelector(`[data-modal-id="${modalId}"]`)
      if (!modal || !this.maximizedModals[modalId]) return
      const rd = this.maximizedModals[modalId]
      if (rd.width && rd.width !== 'auto') modal.style.width = rd.width
      if (rd.height && rd.height !== 'auto') modal.style.height = rd.height
      if (rd.position) modal.style.position = rd.position
      if (rd.left && rd.left !== 'auto') { modal.style.left = rd.left; modal.style.right = rd.right || 'auto' } else { modal.style.left = ''; modal.style.right = '' }
      if (rd.top && rd.top !== 'auto') { modal.style.top = rd.top; modal.style.bottom = rd.bottom || 'auto' } else { modal.style.top = ''; modal.style.bottom = '' }
      if (rd.maxWidth) modal.style.maxWidth = rd.maxWidth
      if (rd.maxHeight) modal.style.maxHeight = rd.maxHeight
      delete this.maximizedModals[modalId]
      this.$nextTick(() => this.applyModalSize(modalId))
      this.$forceUpdate()
    },
    toggleMinimize(modalId) { this.minimizedModals[modalId] ? this.restoreModal(modalId) : this.minimizeModal(modalId) },
    toggleMaximize(modalId) { this.maximizedModals[modalId] ? this.restoreFromMaximize(modalId) : this.maximizeModal(modalId) },
    isModalMinimized(modalId) { return !!this.minimizedModals[modalId] },
    isModalMaximized(modalId) { return !!this.maximizedModals[modalId] },
    startDragModal(modalId, event) {
      if (this.maximizedModals[modalId] || this.resizingModal === modalId) return
      const target = event.target
      if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('.control-btns') || target.closest('.action-btn') || target.closest('.modal-resize-handle')) return
      const modal = document.querySelector(`[data-modal-id="${modalId}"]`)
      if (!modal) return
      event.preventDefault()
      event.stopPropagation()
      this.draggingModal = modalId
      const rect = modal.getBoundingClientRect()
      this.dragStartX = event.clientX; this.dragStartY = event.clientY
      this.dragStartLeft = rect.left; this.dragStartTop = rect.top
      this.boundHandleDrag = this.handleDragModal.bind(this)
      this.boundStopDrag = this.stopDragModal.bind(this)
      document.addEventListener('mousemove', this.boundHandleDrag)
      document.addEventListener('mouseup', this.boundStopDrag)
      modal.classList.add('dragging')
    },
    handleDragModal(event) {
      if (!this.draggingModal) return
      const modal = document.querySelector(`[data-modal-id="${this.draggingModal}"]`)
      if (!modal) return
      const dx = event.clientX - this.dragStartX, dy = event.clientY - this.dragStartY
      const pad = 20, vw = window.innerWidth, vh = window.innerHeight
      const mw = modal.offsetWidth, mh = modal.offsetHeight
      const nl = Math.max(pad, Math.min(this.dragStartLeft + dx, vw - mw - pad))
      const nt = Math.max(pad, Math.min(this.dragStartTop + dy, vh - mh - pad))
      Object.assign(modal.style, { position: 'fixed', left: nl + 'px', top: nt + 'px', right: 'auto', bottom: 'auto' })
    },
    stopDragModal() {
      if (!this.draggingModal) return
      const modal = document.querySelector(`[data-modal-id="${this.draggingModal}"]`)
      if (modal) {
        modal.classList.remove('dragging')
        const rect = modal.getBoundingClientRect()
        if (!this.modalSizes[this.draggingModal]) this.modalSizes[this.draggingModal] = {}
        this.modalSizes[this.draggingModal].left = rect.left
        this.modalSizes[this.draggingModal].top = rect.top
        this.saveModalSizes()
      }
      this.draggingModal = null
      if (this.boundHandleDrag) { document.removeEventListener('mousemove', this.boundHandleDrag); this.boundHandleDrag = null }
      if (this.boundStopDrag) { document.removeEventListener('mouseup', this.boundStopDrag); this.boundStopDrag = null }
    },
    getModalTitle(modalId) {
      if (modalId === 'pageModal') return this.editingPage ? 'Редактировать страницу' : 'Добавить страницу'
      if (modalId === 'blockModal') return this.editingBlock ? 'Редактировать блок' : 'Добавить блок'
      if (modalId === 'productModal') return this.editingProduct ? 'Редактировать товар' : 'Добавить товар'
      return this.modalTitles[modalId] || 'Окно'
    },
    bringModalToFront(modalId) {
      document.querySelectorAll('.modal[data-modal-id]').forEach(m => m.style.zIndex = '999')
      const active = document.querySelector(`.modal[data-modal-id="${modalId}"]`)
      if (active) active.style.zIndex = '1000'
    },
    openModal(modalId, options = {}, params = {}) {
      const { showProperty, mobilePage, onOpen, beforeOpen } = options
      if (beforeOpen) beforeOpen()
      if (!this.isMobileDevice()) {
        if (this.minimizedModals[modalId]) this.restoreModal(modalId)
        if (showProperty) this[showProperty] = true
        if (this.closeMobileMenu) this.closeMobileMenu()
        this.$nextTick(() => { this.applyModalSize(modalId, params); if (onOpen) onOpen() })
      } else {
        if (mobilePage && this.changePage) this.changePage(mobilePage)
      }
    },
    _closeModalGeneric(modalId, event, options = {}) {
      const { showProperty, mobilePage, onClose, beforeClose } = options
      if (beforeClose) beforeClose()
      if (this.minimizedModals[modalId]) delete this.minimizedModals[modalId]
      if (this.maximizedModals[modalId]) delete this.maximizedModals[modalId]
      if (!this.isMobileDevice()) {
        const ae = document.activeElement
        if (ae && ['INPUT', 'TEXTAREA', 'SELECT'].includes(ae.tagName) || ae?.contentEditable === 'true') return
        if (event && event.target !== event.currentTarget) return
        if (showProperty) this[showProperty] = false
      } else {
        if (mobilePage && this.changePage) { this.changePage(mobilePage); window.scrollTo(0, 0) }
      }
      if (onClose) onClose()
    },
    openAddUserModal() { this.openModal('addUserModal', { showProperty: 'showAddUser', mobilePage: 'user' }) },
    closeUserModal(event) {
      this._closeModalGeneric('addUserModal', event, {
        showProperty: 'showAddUser',
        mobilePage: 'admin',
        beforeClose: () => {
          if (this.registerData) this.registerData = { username: '', password: '', role: 'user' }
          if (this.registerLoading !== undefined) this.registerLoading = false
          if (this.registerError !== undefined) this.registerError = ''
          if (this.registerSuccess !== undefined) this.registerSuccess = ''
        },
      })
    },
    openAddBlockModal() {
      const regularBlocks = this.pageBlocks ? this.pageBlocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons') : []
      if (this.blockForm) this.blockForm = { type: '', title: '', content: '', settings: {}, sort_order: regularBlocks.length, is_active: true }
      if (this.pages?.length === 0 && this.loadPages) this.loadPages()
      this.openModal('blockModal', { showProperty: 'showAddBlockModal', mobilePage: 'block' })
    },
    closeBlockModal(event) {
      this._closeModalGeneric('blockModal', event, {
        showProperty: 'showAddBlockModal',
        mobilePage: 'admin',
        beforeClose: () => {
          if (this.editingBlock !== undefined) this.editingBlock = null
          if (this.blockError !== undefined) this.blockError = ''
          if (this.blockSuccess !== undefined) this.blockSuccess = ''
          if (this.blockForm) this.blockForm = { type: '', title: '', content: '', settings: {}, sort_order: 0, is_active: true }
        },
      })
    },
    openIconPicker(target, property) {
      if (this.currentIconTarget !== undefined) this.currentIconTarget = { target, property }
      if (this.selectedIconClass !== undefined) this.selectedIconClass = target[property] || ''
      this.openModal('iconPickerModal', {
        showProperty: 'showIconPicker',
        onOpen: () => {
          if (this.iconSearchQuery !== undefined) this.iconSearchQuery = ''
          if (this.selectedIconCategory !== undefined) this.selectedIconCategory = 'all'
          if (this.updateFilteredIcons) this.updateFilteredIcons()
        },
      })
    },
    closeIconPicker(event) {
      this._closeModalGeneric('iconPickerModal', event, {
        showProperty: 'showIconPicker',
        beforeClose: () => {
          if (this.currentIconTarget !== undefined) this.currentIconTarget = null
          if (this.selectedIconClass !== undefined) this.selectedIconClass = ''
          if (this.iconSearchQuery !== undefined) this.iconSearchQuery = ''
          if (this.selectedIconCategory !== undefined) this.selectedIconCategory = 'all'
        },
      })
    },
    openAddPageModal() {
      if (this.pageForm) this.pageForm = { slug: '', title: '', content: '', meta_title: '', meta_description: '', is_published: true, is_main_page: false, navigation_buttons: [] }
      if (this.pageElements !== undefined) this.pageElements = []
      if (this.selectedElement !== undefined) this.selectedElement = null
      if (this.draggingElement !== undefined) this.draggingElement = null
      if (this.pageError !== undefined) this.pageError = ''
      if (this.pageSuccess !== undefined) this.pageSuccess = ''
      if (this.viewMode !== undefined) this.viewMode = 'visual'
      this.openModal('pageModal', { showProperty: 'showAddPageModal', mobilePage: 'page' }, { width: '60vw', height: '80vh' })
    },
    closePageModal(event) {
      this._closeModalGeneric('pageModal', event, {
        showProperty: 'showAddPageModal',
        mobilePage: 'admin',
        beforeClose: () => {
          if (this.editingPage !== undefined) this.editingPage = null
          if (this.pageForm) this.pageForm = { slug: '', title: '', content: '', meta_title: '', meta_description: '', is_published: true, is_main_page: false, navigation_buttons: [] }
          if (this.pageElements !== undefined) this.pageElements = []
          if (this.selectedElement !== undefined) this.selectedElement = null
          if (this.draggingElement !== undefined) this.draggingElement = null
          if (this.pageError !== undefined) this.pageError = ''
          if (this.pageSuccess !== undefined) this.pageSuccess = ''
        },
      })
    },
    closeContentModal(event) {
      this._closeModalGeneric('contentModal', event, {
        showProperty: 'showContentModal',
        beforeClose: () => {
          if (this.contentError !== undefined) this.contentError = ''
          if (this.contentSuccess !== undefined) this.contentSuccess = ''
        },
      })
    },
  },
}
