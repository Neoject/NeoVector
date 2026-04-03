<script>
export default {
  name: 'Main',
  props: {
    logo: String,
  },
  data() {
    return {
      /* ── products ── */
      products: [],
      draggingProductId: null,
      productDragScrollInterval: null,
      selectedProducts: [],
      productTableColumns: {
        id: true, image: true, name: true, description: true,
        peculiarities: true, material: true, price: true,
        price_sale: true, category: true, user: true,
        created: true, updated_by: true, updated_at: true,
      },
      showColumnSelector: false,
      showProductsActionsSidebar: false,
      contextMenuVisible: false,
      contextMenuPosition: { x: 0, y: 0 },
      contextMenuProduct: null,
      contextMenuHideHandler: null,
      contextMenuEscapeHandler: null,

      /* ── product form ── */
      showAddProduct: false,
      editingProduct: null,
      productForm: {
        name: '', description: '', peculiarities: [], material: '',
        price: '', price_sale: '', category: '', product_type_id: null,
        image: '', image_description: '', additionalImages: [], additionalVideos: [],
      },
      newPeculiarity: '',
      selectOpen: false,
      selectedFile: null,
      isUploading: false,
      uploadProgress: 0,
      uploadSuccess: false,
      uploadError: false,
      uploadErrorMessage: '',
      uploadXhr: null,
      aiGeneratingDescription: false,
      aiGenerationError: '',
      productTypes: [],

      /* ── categories ── */
      categories: [],
      categoryForm: { id: null, name: '', slug: '', sort_order: 0 },
      editingCategory: null,
      categoryLoading: false,
      categoryError: '',
      categorySuccess: '',
      draggingCategoryId: null,
      categoryEdit: false,

      /* ── page blocks ── */
      showAddBlockModal: false,
      editingBlock: null,
      pageBlocks: [],
      blockForm: {
        type: '', title: '', content: '', settings: {}, sort_order: 0, is_active: true,
      },
      blockLoading: false,
      blockError: '',
      blockSuccess: '',
      draggingBlockId: null,
      hasUnsavedChanges: false,
      originalBlocksOrder: [],

      /* ── pages ── */
      pages: [],
      showAddPageModal: false,
      editingPage: null,
      pageForm: {
        slug: '', title: '', content: '', meta_title: '',
        meta_description: '', is_published: true, is_main_page: false,
        navigation_buttons: [],
      },
      pageLoading: false,
      pageError: '',
      pageSuccess: '',
      viewMode: 'visual',
      pageElements: [],
      selectedElement: null,
      draggingElement: null,
      availableElements: [
        { type: 'heading',   label: 'Заголовок',    icon: 'fas fa-heading',       defaultContent: 'Новый заголовок' },
        { type: 'paragraph', label: 'Абзац',        icon: 'fas fa-paragraph',     defaultContent: 'Новый абзац текста' },
        { type: 'image',     label: 'Изображение',  icon: 'fas fa-photo-film',    defaultContent: '' },
        { type: 'list',      label: 'Список',       icon: 'fas fa-list',          defaultContent: '<ul><li>Элемент 1</li></ul>' },
        { type: 'button',    label: 'Кнопка',       icon: 'fas fa-hand-pointer',  defaultContent: 'Кнопка' },
        { type: 'divider',   label: 'Разделитель',  icon: 'fas fa-minus',         defaultContent: '<hr>' },
      ],

      /* ── icon picker ── */
      showIconPicker: false,
      iconSearchQuery: '',
      selectedIconCategory: 'all',
      selectedIconClass: '',
      currentIconTarget: null,
      filteredIcons: [],
      iconCategories: [
        { name: 'all',          label: 'Все',         icon: 'fas fa-th' },
        { name: 'business',     label: 'Бизнес',      icon: 'fas fa-briefcase' },
        { name: 'technology',   label: 'Технологии',  icon: 'fas fa-laptop' },
        { name: 'shopping',     label: 'Покупки',     icon: 'fas fa-shopping-cart' },
        { name: 'communication',label: 'Общение',     icon: 'fas fa-comments' },
        { name: 'media',        label: 'Медиа',       icon: 'fas fa-play' },
        { name: 'travel',       label: 'Путешествия', icon: 'fas fa-plane' },
        { name: 'health',       label: 'Здоровье',    icon: 'fas fa-heart' },
        { name: 'education',    label: 'Образование', icon: 'fas fa-graduation-cap' },
        { name: 'food',         label: 'Еда',         icon: 'fas fa-utensils' },
        { name: 'sports',       label: 'Спорт',       icon: 'fas fa-football-ball' },
        { name: 'weather',      label: 'Погода',      icon: 'fas fa-sun' },
      ],
      availableIcons: [
        { class: 'fas fa-gem',        name: 'Камень',      category: 'all' },
        { class: 'fas fa-tools',      name: 'Инструменты', category: 'all' },
        { class: 'fas fa-award',      name: 'Награда',     category: 'all' },
        { class: 'fas fa-heart',      name: 'Сердце',      category: 'health' },
        { class: 'fas fa-star',       name: 'Звезда',      category: 'all' },
        { class: 'fas fa-shield-alt', name: 'Щит',         category: 'all' },
        { class: 'fas fa-lock',       name: 'Замок',       category: 'all' },
        { class: 'fas fa-home',       name: 'Дом',         category: 'all' },
        { class: 'fas fa-user',       name: 'Пользователь',category: 'all' },
        { class: 'fas fa-cog',        name: 'Настройки',   category: 'all' },
        { class: 'fas fa-briefcase',  name: 'Портфель',    category: 'business' },
        { class: 'fas fa-chart-line', name: 'График',      category: 'business' },
        { class: 'fas fa-trophy',     name: 'Трофей',      category: 'business' },
        { class: 'fas fa-laptop',     name: 'Ноутбук',     category: 'technology' },
        { class: 'fas fa-mobile-alt', name: 'Телефон',     category: 'technology' },
        { class: 'fas fa-wifi',       name: 'WiFi',        category: 'technology' },
        { class: 'fas fa-rocket',     name: 'Ракета',      category: 'technology' },
        { class: 'fas fa-shopping-cart', name: 'Корзина',  category: 'shopping' },
        { class: 'fas fa-gift',       name: 'Подарок',     category: 'shopping' },
        { class: 'fas fa-tags',       name: 'Теги',        category: 'shopping' },
        { class: 'fas fa-envelope',   name: 'Письмо',      category: 'communication' },
        { class: 'fas fa-phone',      name: 'Звонок',      category: 'communication' },
        { class: 'fas fa-comments',   name: 'Комментарии', category: 'communication' },
        { class: 'fas fa-plane',      name: 'Самолет',     category: 'travel' },
        { class: 'fas fa-car',        name: 'Авто',        category: 'travel' },
        { class: 'fas fa-map-marker-alt', name: 'Метка',   category: 'travel' },
        { class: 'fas fa-globe',      name: 'Глобус',      category: 'travel' },
        { class: 'fas fa-heartbeat',  name: 'Пульс',       category: 'health' },
        { class: 'fas fa-stethoscope',name: 'Стетоскоп',   category: 'health' },
        { class: 'fas fa-graduation-cap', name: 'Диплом',  category: 'education' },
        { class: 'fas fa-book',       name: 'Книга',       category: 'education' },
        { class: 'fas fa-utensils',   name: 'Приборы',     category: 'food' },
        { class: 'fas fa-coffee',     name: 'Кофе',        category: 'food' },
        { class: 'fas fa-football-ball', name: 'Мяч',      category: 'sports' },
        { class: 'fas fa-dumbbell',   name: 'Гантель',     category: 'sports' },
        { class: 'fas fa-sun',        name: 'Солнце',      category: 'weather' },
        { class: 'fas fa-cloud-rain', name: 'Дождь',       category: 'weather' },
        { class: 'fas fa-snowflake',  name: 'Снег',        category: 'weather' },
      ],

      /* ── content modal ── */
      showContentModal: false,
      featuresContent: [],
      historyContent: [],
      contentLoading: false,
      contentError: '',
      contentSuccess: '',

      /* ── modal resize/drag ── */
      modalSizes: {},
      resizingModal: null,
      resizeDirection: null,
      resizeStartX: 0, resizeStartY: 0,
      resizeStartWidth: 0, resizeStartHeight: 0,
      resizeStartLeft: 0, resizeStartTop: 0,
      boundHandleResize: null, boundStopResize: null,
      draggingModal: null,
      dragStartX: 0, dragStartY: 0, dragStartLeft: 0, dragStartTop: 0,
      boundHandleDrag: null, boundStopDrag: null,
      lastResizeClick: { modalId: null, direction: null, time: 0 },
      resizeRestoreData: {},
      minimizedModals: {},
      maximizedModals: {},
      modalTitles: {
        productModal:  'Управление товаром',
        blockModal:    'Управление блоком',
        pageModal:     'Управление страницей',
        contentModal:  'Редактирование контента',
        iconPickerModal: 'Выбор иконки',
      },

      /* ── register (add-user modal) ── */
      showAddUser: false,
      registerData: { username: '', password: '', role: 'user' },
      registerLoading: false,
      registerError: '',
      registerSuccess: '',

      /* ── users ── */
      users: [],
      usersLoading: false,
      usersError: '',
    }
  },

  computed: {
    truncatedProducts() {
      return this.products.map(p => ({
        ...p,
        truncatedDescription: this.truncateText(p.description, 80),
      }))
    },
  },

  watch: {
    selectedIconCategory() { this.updateFilteredIcons() },
    iconSearchQuery()       { this.updateFilteredIcons() },
  },

  mounted() {
    this.loadAllData()
    this.loadColumnSettings()
    this.loadModalSizes()
    window.addEventListener('resize', this.checkAllModalsBounds)
    document.addEventListener('click', this.onDocClick)
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.checkAllModalsBounds)
    document.removeEventListener('click', this.onDocClick)
  },

  methods: {
    /* ════════════════════════════════
       BOOTSTRAP
    ════════════════════════════════ */
    async loadAllData() {
      await Promise.all([
        this.getAllProducts(),
        this.loadCategories(),
        this.loadProductTypes(),
        this.loadPageBlocks(),
        this.loadPages(),
      ])
    },

    onDocClick(e) {
      if (this.showColumnSelector && !e.target.closest('.column-selector-dropdown')) {
        this.showColumnSelector = false
      }
    },

    /* ════════════════════════════════
       HELPERS
    ════════════════════════════════ */
    isMobileDevice() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    },
    formatDate(d) {
      if (!d) return ''
      return new Date(d).toLocaleDateString('ru-RU', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    },
    truncateText(text, charsPerLine = 30, maxLines = 4) {
      if (!text?.trim()) return ''
      const clean = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()
      const lines = []
      let i = 0
      while (i < clean.length && lines.length < maxLines) {
        const rem = clean.substring(i)
        if (rem.length <= charsPerLine) { lines.push(rem); break }
        let b = charsPerLine
        for (let j = charsPerLine; j >= 0; j--) { if (rem[j] === ' ') { b = j; break } }
        lines.push(rem.substring(0, b).trim())
        i += b + 1
        if (lines.length === maxLines && i < clean.length) {
          lines[maxLines - 1] = lines[maxLines - 1].substring(0, charsPerLine - 3) + '...'
        }
      }
      return lines.join('\n')
    },
    isVideo(url) {
      return typeof url === 'string' && /\.(mp4|webm|ogg|mov)/i.test(url)
    },
    isVideoPreview(url) { return this.isVideo(url) },
    getObject(e) { return JSON.parse(JSON.stringify(e)) },
    getProductsObject() {
      const obj = {}
      this.products.forEach(p => { obj[p.id] = this.getObject(p) })
      return obj
    },
    getCategoryName(id) {
      return this.categories.find(c => c.id === id)?.name || 'Неизвестно'
    },
    getUserName(id) {
      if (!id) return '-'
      return this.users.find(u => u.id === id)?.username || `ID: ${id}`
    },
    escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML },

    /* ════════════════════════════════
       PRODUCTS — LOAD / CRUD
    ════════════════════════════════ */
    async getAllProducts() {
      try {
        const r = await fetch('../api.php?action=products', { credentials: 'same-origin' })
        if (r.ok) {
          this.products = await r.json()
          this.$nextTick(() => this.initColumnResize())
        }
      } catch (e) { console.error(e) }
    },
    async deleteProduct(productId, multiple = false) {
      const doDelete = async (id) => {
        const fd = new FormData()
        fd.append('action', 'delete_product'); fd.append('id', id)
        const r = await fetch('../api.php', { method: 'POST', body: fd, credentials: 'same-origin' })
        if (r.ok) this.products = this.products.filter(p => p.id !== id)
        else alert('Ошибка при удалении товара')
      }
      if (multiple) { await doDelete(productId) }
      else if (confirm('Вы уверены?')) { await doDelete(productId) }
    },
    async deleteSelectedProducts() {
      if (!this.selectedProducts.length) return
      if (!confirm(`Удалить ${this.selectedProducts.length} товар(ов)?`)) return
      for (const id of [...this.selectedProducts]) await this.deleteProduct(id, true)
      this.selectedProducts = []
    },
    async hideProduct(id) {
      const product = this.products.find(p => p.id === id)
      if (!product) return
      const nv = product.visibility === 0 ? 1 : 0
      const fd = new FormData()
      fd.append('action', 'visibility'); fd.append('id', id); fd.append('visibility', nv)
      const r = await fetch('../api.php', { method: 'POST', body: fd })
      if (r.ok) { const d = await r.json(); if (d.success) product.visibility = nv }
    },
    openProductPage(id) {
      window.location.href = window.location.origin + '/product/?id=' + id
    },

    /* ── drag-drop reorder ── */
    startDragProduct(product, event) {
      this.draggingProductId = product.id
      event.dataTransfer.effectAllowed = 'move'
      this._pdDragOver = (e) => this._onProductDragOver(e)
      this._pdDragEnd  = () => this._cleanupProductDrag()
      document.addEventListener('dragover', this._pdDragOver)
      document.addEventListener('dragend',  this._pdDragEnd)
    },
    endDragProduct() { this._cleanupProductDrag() },
    _cleanupProductDrag() {
      this.draggingProductId = null
      document.removeEventListener('dragover', this._pdDragOver)
      document.removeEventListener('dragend',  this._pdDragEnd)
      if (this.productDragScrollInterval) {
        clearInterval(this.productDragScrollInterval); this.productDragScrollInterval = null
      }
    },
    _onProductDragOver(e) {
      if (!this.draggingProductId) return
      const th = 100, sp = 10, wh = window.innerHeight, sy = window.scrollY, my = e.clientY
      if (my < th && sy > 0) this._startProdScroll('up', sp)
      else if (my > wh - th && sy < document.documentElement.scrollHeight - wh) this._startProdScroll('down', sp)
      else this._stopProdScroll()
    },
    _startProdScroll(dir, speed) {
      if (this.productDragScrollInterval) this._stopProdScroll()
      this.productDragScrollInterval = setInterval(() => window.scrollBy(0, dir === 'up' ? -speed : speed), 16)
    },
    _stopProdScroll() {
      if (this.productDragScrollInterval) { clearInterval(this.productDragScrollInterval); this.productDragScrollInterval = null }
    },
    dropProduct(target, e) {
      e.preventDefault()
      if (this.draggingProductId === target.id) { this._cleanupProductDrag(); return }
      const di = this.products.findIndex(p => p.id === this.draggingProductId)
      const ti = this.products.findIndex(p => p.id === target.id)
      if (di === -1 || ti === -1) { this._cleanupProductDrag(); return }
      const [dragged] = this.products.splice(di, 1)
      this.products.splice(ti, 0, dragged)
      this.saveProductsOrder()
    },
    async saveProductsOrder() {
      const fd = new FormData()
      fd.append('action', 'save_products_order')
      fd.append('products_order', JSON.stringify(this.products.map(p => p.id)))
      await fetch('../api.php', { method: 'POST', body: fd, credentials: 'same-origin' })
    },

    /* ── context menu ── */
    showContextMenu(e, product) {
      if (!product) return
      e.preventDefault(); e.stopPropagation()
      this.contextMenuProduct = product
      let x = e.clientX, y = e.clientY
      if (x + 200 > window.innerWidth)  x = window.innerWidth - 210
      if (y + 200 > window.innerHeight) y = window.innerHeight - 210
      this.contextMenuPosition = { x, y }
      this.contextMenuVisible = true
      const hide = (ev) => { if (!ev.target.closest('.context-menu')) this.hideContextMenu() }
      const esc  = (ev) => { if (ev.key === 'Escape') this.hideContextMenu() }
      setTimeout(() => {
        document.addEventListener('click',   hide)
        document.addEventListener('keydown', esc)
        this.contextMenuHideHandler    = hide
        this.contextMenuEscapeHandler  = esc
      }, 0)
    },
    hideContextMenu() {
      this.contextMenuVisible = false
      this.contextMenuProduct = null
      document.removeEventListener('click',   this.contextMenuHideHandler)
      document.removeEventListener('keydown', this.contextMenuEscapeHandler)
    },
    handleContextMenuAction(action) {
      const p = this.contextMenuProduct
      if (!p) return
      if (action === 'edit')      this.editProduct(p)
      if (action === 'delete')    this.deleteProduct(p.id)
      if (action === 'open')      this.openProductPage(p.id)
      if (action === 'duplicate') this.duplicateProduct(p)
      if (action === 'select')    this.toggleProductSelection(p.id)
      this.hideContextMenu()
    },
    duplicateProduct(p) { this.editProduct({ ...p, id: null, name: p.name + ' (копия)' }) },

    /* ── selection ── */
    toggleProductSelection(id) {
      const i = this.selectedProducts.indexOf(id)
      i > -1 ? this.selectedProducts.splice(i, 1) : this.selectedProducts.push(id)
    },
    isProductSelected(id) { return this.selectedProducts.includes(id) },
    toggleSelectAll(e) {
      this.selectedProducts = e.target.checked ? this.products.map(p => p.id) : []
    },
    clearSelection() { this.selectedProducts = [] },

    /* ── column visibility ── */
    isColumnVisible(col) { return this.productTableColumns[col] !== false },
    toggleColumn(col) { this.productTableColumns[col] = !this.productTableColumns[col]; this.saveColumnSettings() },
    getVisibleColumnsCount() { return Object.values(this.productTableColumns).filter(v => v).length + 2 },
    getColumnLabel(col) {
      return { id:'ID', image:'Изображение', name:'Название', description:'Описание',
        peculiarities:'Особенности', material:'Материал', price:'Цена', price_sale:'Цена со скидкой',
        category:'Категория', user:'Создал', created:'Дата', updated_by:'Обновил', updated_at:'Обновлено' }[col] || col
    },
    saveColumnSettings() { localStorage.setItem('productTableColumns', JSON.stringify(this.productTableColumns)) },
    loadColumnSettings() {
      try { const s = localStorage.getItem('productTableColumns'); if (s) Object.assign(this.productTableColumns, JSON.parse(s)) }
      catch {}
    },
    toggleColumnSelector() { this.showColumnSelector = !this.showColumnSelector },
    toggleProductsActionsSidebar() { this.showProductsActionsSidebar = !this.showProductsActionsSidebar },
    closeProductsActionsSidebar() { this.showProductsActionsSidebar = false },

    /* ── column resize ── */
    initColumnResize() {
      this.$nextTick(() => {
        const table = document.querySelector('.products-table table')
        if (!table) return
        this.loadColumnWidths()
        table.querySelectorAll('.column-resize-handle').forEach(h => {
          const nh = h.cloneNode(true); h.parentNode.replaceChild(nh, h)
          this.setupColumnResize(nh)
        })
      })
    },
    setupColumnResize(handle) {
      let isR = false, sx = 0, sw = 0, col = null
      handle.addEventListener('mousedown', (e) => {
        if (window.innerWidth <= 768 || e.detail > 1) return
        e.preventDefault(); e.stopPropagation()
        isR = true; sx = e.clientX; col = handle.parentElement; sw = col.offsetWidth
        const move = (e) => {
          if (!isR) return
          const nw = Math.max(50, sw + (e.clientX - sx))
          col.style.width = col.style.minWidth = nw + 'px'
          const tbl = col.closest('table'), hr = tbl?.querySelector('thead tr')
          if (hr) {
            const ci = Array.from(hr.children).indexOf(col)
            tbl.querySelectorAll('tbody tr').forEach(row => {
              const c = row.querySelectorAll('td')[ci]
              if (c) c.style.width = c.style.minWidth = nw + 'px'
            })
          }
          this.saveColumnWidth(col.dataset.column, nw)
        }
        const up = () => { isR = false; document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
        document.addEventListener('mousemove', move); document.addEventListener('mouseup', up)
      })
    },
    saveColumnWidth(name, w) {
      const s = JSON.parse(localStorage.getItem('admin_column_widths') || '{}')
      s[name] = w; localStorage.setItem('admin_column_widths', JSON.stringify(s))
    },
    loadColumnWidths() {
      const s = JSON.parse(localStorage.getItem('admin_column_widths') || '{}')
      const table = document.querySelector('.products-table table')
      if (!table) return
      Object.keys(s).forEach(name => {
        const col = table.querySelector(`th[data-column="${name}"]`)
        if (!col) return
        const w = s[name] + 'px'; col.style.width = col.style.minWidth = w
        const hr = table.querySelector('thead tr')
        if (!hr) return
        const ci = Array.from(hr.children).indexOf(col)
        table.querySelectorAll('tbody tr').forEach(row => {
          const c = row.querySelectorAll('td')[ci]; if (c) c.style.width = c.style.minWidth = w
        })
      })
    },

    /* ════════════════════════════════
       PRODUCT FORM
    ════════════════════════════════ */
    openAddProductModal() {
      if (!this.isMobileDevice()) {
        if (this.minimizedModals['productModal']) this.restoreModal('productModal')
        this.showAddProduct = true
        this.$nextTick(() => this.applyModalSize('productModal'))
      } else {
        this.$emit('change-page', 'product')
      }
    },
    editProduct(product) {
      this.editingProduct = product
      this.productForm = {
        name: product.name || '', description: product.description || '',
        peculiarities: product.peculiarities ? [...product.peculiarities] : [],
        material: product.material || '', price: product.price || '',
        price_sale: product.price_sale || '', category: product.category || '',
        product_type_id: product.product_type_id || null, image: product.image || '',
        image_description: product.image_description || '',
        additionalImages: product.additional_images ? [...product.additional_images] : [],
        additionalVideos: product.additional_videos ? [...product.additional_videos] : [],
      }
      if (!this.isMobileDevice()) {
        if (this.minimizedModals['productModal']) this.restoreModal('productModal')
        this.showAddProduct = true
        this.$nextTick(() => this.applyModalSize('productModal'))
      } else {
        this.$emit('change-page', 'product'); window.scrollTo(0, 0)
      }
    },
    closeModal(event) {
      if (this.minimizedModals['productModal']) delete this.minimizedModals['productModal']
      if (this.maximizedModals['productModal']) delete this.maximizedModals['productModal']
      if (!this.isMobileDevice()) {
        const ae = document.activeElement
        if (ae && ['INPUT','TEXTAREA','SELECT'].includes(ae.tagName)) return
        if (event && event.target !== event.currentTarget) return
        this.showAddProduct = false
      } else {
        this.$emit('change-page', 'admin'); window.scrollTo(0, 0)
      }
      this.editingProduct = null; this.selectedFile = null
      this.productForm = { name:'', description:'', peculiarities:[], material:'', price:'', price_sale:'',
        category:'', product_type_id:null, image:'', image_description:'', additionalImages:[], additionalVideos:[] }
      this.aiGeneratingDescription = false; this.aiGenerationError = ''; this.newPeculiarity = ''
    },
    async saveProduct() {
      try {
        const fd = new FormData()
        if (this.editingProduct) {
          fd.append('action', 'update_product'); fd.append('id', this.editingProduct.id)
        } else {
          fd.append('action', 'add_product')
        }
        ;['name','description','material','price','category','image','image_description'].forEach(k => fd.append(k, this.productForm[k] || ''))
        fd.append('price_sale',       this.productForm.price_sale || '')
        fd.append('product_type_id',  this.productForm.product_type_id || '')
        fd.append('peculiarities',    JSON.stringify(this.productForm.peculiarities))
        if (this.selectedFile) fd.append('product_image', this.selectedFile)

        const r = await fetch('../api.php', { method: 'POST', body: fd, credentials: 'same-origin' })
        if (!r.ok) { alert('Ошибка при сохранении товара'); return }
        const result = await r.json()

        if (this.editingProduct) {
          const idx = this.products.findIndex(p => p.id === this.editingProduct.id)
          if (idx !== -1) Object.assign(this.products[idx], {
            ...this.productForm, price: +this.productForm.price,
            price_sale: +this.productForm.price_sale,
            image: result?.image || this.products[idx].image,
          })
        } else {
          this.products.push({ id: result.id, ...this.productForm,
            price: +this.productForm.price, price_sale: +this.productForm.price_sale,
            image: result?.image || '' })
        }
        this.closeModal()
      } catch (e) { console.error(e); alert('Ошибка при сохранении') }
    },
    addPeculiarity() { if (this.newPeculiarity.trim()) { this.productForm.peculiarities.push(this.newPeculiarity.trim()); this.newPeculiarity = '' } },
    removePeculiarity(i) { this.productForm.peculiarities.splice(i, 1) },
    onSelectFocus() { this.selectOpen = true },
    onSelectBlur()  { setTimeout(() => { this.selectOpen = false }, 200) },
    onSelectChange(){ this.selectOpen = false },
    onSelectClick() { this.selectOpen = !this.selectOpen },
    onSelectMouseDown() { this.selectOpen = true },

    /* ── image upload ── */
    triggerFileUpload() { this.$refs.fileInput?.click() },
    triggerAdditionalImagesUpload() { this.$refs.additionalImagesInput?.click() },
    async handleFileSelect(e) {
      const file = e.target.files[0]; if (!file) return
      const isVid = file.type.startsWith('video/')
      if (file.size > (isVid ? 256 : 64) * 1024 * 1024) { alert('Файл слишком большой'); e.target.value = ''; return }
      this.selectedFile = file
      const obj = URL.createObjectURL(file)
      this.productForm.image = obj; this.isUploading = true; this.uploadProgress = 0
      this.uploadSuccess = false; this.uploadError = false; this.uploadErrorMessage = ''
      try {
        await this.uploadMainFile(file); URL.revokeObjectURL(obj)
        this.uploadSuccess = true; this.isUploading = false
        setTimeout(() => { this.uploadSuccess = false }, 2000)
      } catch (err) {
        URL.revokeObjectURL(obj); this.uploadError = true
        this.uploadErrorMessage = err.message; this.isUploading = false
      }
    },
    uploadMainFile(file) {
      return new Promise((resolve, reject) => {
        const fd = new FormData(); fd.append('action', 'upload_product_media'); fd.append('file', file)
        const xhr = new XMLHttpRequest(); this.uploadXhr = xhr
        xhr.open('POST', '../api.php', true); xhr.withCredentials = true
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) this.uploadProgress = Math.round(e.loaded / e.total * 100) }
        xhr.onload = () => {
          this.uploadXhr = null
          if (xhr.status >= 200 && xhr.status < 300) {
            try { const res = JSON.parse(xhr.responseText); if (res.success) { if (res.url) this.productForm.image = res.url; this.selectedFile = null; resolve(res) } else reject(new Error(res.error)) }
            catch { reject(new Error('Parse error')) }
          } else reject(new Error(`HTTP ${xhr.status}`))
        }
        xhr.onerror = () => { this.uploadXhr = null; reject(new Error('Network error')) }
        xhr.timeout = 300000; xhr.send(fd)
      })
    },
    cancelUpload() { this.uploadXhr?.abort(); this.isUploading = false; this.uploadProgress = 0 },
    resetUploadStatus() { this.uploadSuccess = false; this.uploadError = false; this.uploadErrorMessage = '' },
    getImageUrl() { return this.selectedFile ? this.productForm.image : (this.productForm.image ? '../' + this.productForm.image : '') },
    removeImage() { this.selectedFile = null; this.productForm.image = '' },
    async handleAdditionalImagesSelect(e) {
      const files = Array.from(e.target.files); if (!files.length) return
      for (const f of files) {
        const isVid = f.type.startsWith('video/')
        if (f.size > (isVid ? 256 : 64) * 1024 * 1024) { alert(`Файл "${f.name}" слишком большой`); e.target.value = ''; return }
      }
      const fd = new FormData(); fd.append('action', 'add_product_images'); fd.append('product_id', this.editingProduct.id)
      files.forEach(f => fd.append('additional_images[]', f))
      const r = await fetch('../api.php', { method: 'POST', body: fd, credentials: 'same-origin' })
      if (r.ok) {
        const res = await r.json()
        if (res.success) {
          if (res.uploaded_images) this.productForm.additionalImages.push(...res.uploaded_images)
          if (res.uploaded_videos) this.productForm.additionalVideos.push(...(res.uploaded_videos))
        }
      }
      if (this.$refs.additionalImagesInput) this.$refs.additionalImagesInput.value = ''
    },
    async removeAdditionalImage(idx) {
      if (!confirm('Удалить изображение?')) return
      const path = this.productForm.additionalImages[idx]
      const r1 = await fetch(`../api.php?action=get_image_id&product_id=${this.editingProduct.id}&image_path=${encodeURIComponent(path)}`, { credentials: 'same-origin' })
      if (r1.ok) {
        const d1 = await r1.json()
        if (d1.image_id) {
          const fd = new FormData(); fd.append('action', 'delete_product_image'); fd.append('image_id', d1.image_id)
          const r2 = await fetch('../api.php', { method: 'POST', body: fd, credentials: 'same-origin' })
          if (r2.ok) this.productForm.additionalImages.splice(idx, 1)
        }
      }
    },
    async removeAdditionalVideo(idx) {
      if (!confirm('Удалить видео?')) return
      const path = this.productForm.additionalVideos[idx]
      const r1 = await fetch(`../api.php?action=get_image_id&product_id=${this.editingProduct.id}&image_path=${encodeURIComponent(path)}`, { credentials: 'same-origin' })
      if (r1.ok) {
        const d1 = await r1.json()
        if (d1.image_id) {
          const fd = new FormData(); fd.append('action', 'delete_product_image'); fd.append('image_id', d1.image_id)
          const r2 = await fetch('../api.php', { method: 'POST', body: fd, credentials: 'same-origin' })
          if (r2.ok) this.productForm.additionalVideos.splice(idx, 1)
        }
      }
    },
    async generateDescriptionWithAI() {
      if (this.aiGeneratingDescription || !this.productForm.name?.trim()) return
      this.aiGenerationError = ''; this.aiGeneratingDescription = true
      try {
        const fd = new FormData(); fd.append('action', 'generate_product_description'); fd.append('name', this.productForm.name.trim())
        const r = await fetch('../api.php', { method: 'POST', body: fd, credentials: 'same-origin' })
        const d = await r.json()
        if (!r.ok || !d.description) throw new Error(d.error || 'Ошибка генерации')
        this.productForm.description = d.description.trim()
      } catch (e) { this.aiGenerationError = e.message }
      finally { this.aiGeneratingDescription = false }
    },

    /* ════════════════════════════════
       PRODUCT TYPES
    ════════════════════════════════ */
    async loadProductTypes() {
      try {
        const r = await fetch('../api.php?action=product_types', { credentials: 'same-origin' })
        if (r.ok) {
          const d = await r.json()
          this.productTypes = Array.isArray(d.types) ? d.types.map(t => ({ id: t.id, name: t.name })) : []
        }
      } catch {}
    },

    /* ════════════════════════════════
       CATEGORIES
    ════════════════════════════════ */
    async loadCategories() {
      try {
        const r = await fetch('../api.php?action=categories', { credentials: 'same-origin' })
        if (r.ok) {
          const d = await r.json()
          this.categories = d.map(c => ({ id: c.slug, name: c.name, _id: c.id, sort_order: c.sort_order || 0, slug: c.slug }))
        }
      } catch {}
    },
    startAddCategory() { this.editingCategory = null; this.categoryForm = { id: null, name: '', slug: '', sort_order: 0 } },
    startEditCategory(cat) { this.editingCategory = cat; this.categoryForm = { id: cat._id, name: cat.name, slug: cat.slug || cat.id, sort_order: cat.sort_order || 0 } },
    async saveCategory() {
      this.categoryLoading = true; this.categoryError = ''; this.categorySuccess = ''
      try {
        const fd = new FormData()
        fd.append('action', this.categoryForm.id ? 'update_category' : 'add_category')
        if (this.categoryForm.id) fd.append('id', this.categoryForm.id)
        fd.append('name', this.categoryForm.name); fd.append('slug', this.categoryForm.slug || ''); fd.append('sort_order', this.categoryForm.sort_order || 0)
        const r = await fetch('../api.php', { method: 'POST', body: fd, credentials: 'same-origin' })
        const res = await r.json()
        if (!r.ok || res.error) throw new Error(res.error || 'Ошибка')
        this.categorySuccess = 'Сохранено'; await this.loadCategories(); this.startAddCategory()
      } catch (e) { this.categoryError = e.message }
      this.categoryLoading = false
    },
    async deleteCategory(cat) {
      if (!confirm('Удалить категорию?')) return
      const fd = new FormData(); fd.append('action', 'delete_category'); fd.append('id', cat._id)
      await fetch('../api.php', { method: 'POST', body: fd, credentials: 'same-origin' })
      await this.loadCategories()
    },
    startDragCategory(cat, e) { this.draggingCategoryId = cat._id; e.dataTransfer.effectAllowed = 'move' },
    endDragCategory() { this.draggingCategoryId = null },
    dropCategory(target, e) {
      e.preventDefault(); if (this.draggingCategoryId === target._id) return
      const di = this.categories.findIndex(c => c._id === this.draggingCategoryId)
      const ti = this.categories.findIndex(c => c._id === target._id)
      if (di === -1 || ti === -1) return
      const [d] = this.categories.splice(di, 1); this.categories.splice(ti, 0, d)
      this.saveCategoriesOrder()
    },
    async saveCategoriesOrder() {
      const fd = new FormData(); fd.append('action', 'save_categories_order'); fd.append('categories_order', JSON.stringify(this.categories.map(c => c._id)))
      await fetch('../api.php', { method: 'POST', body: fd, credentials: 'same-origin' })
    },
    moveCategory(cat, dir) {
      const i = this.categories.findIndex(c => c._id === cat._id); if (i === -1) return
      const ni = dir === 'up' ? i - 1 : i + 1; if (ni < 0 || ni >= this.categories.length) return
      const [item] = this.categories.splice(i, 1); this.categories.splice(ni, 0, item)
    },
    manageCategoryEdit() { this.categoryEdit = !this.categoryEdit },

    /* ════════════════════════════════
       PAGE BLOCKS
    ════════════════════════════════ */
    async loadPageBlocks() {
      try {
        const r = await fetch('../api.php?action=page_blocks', { credentials: 'same-origin' })
        if (!r.ok) { this.pageBlocks = []; return }
        const blocks = await r.json()
        const regular = blocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons').sort((a,b) => (a.sort_order||0)-(b.sort_order||0))
        const infoBtn = blocks.filter(b => b.type === 'info_buttons')
        const footer  = blocks.filter(b => b.type === 'footer')
        this.pageBlocks = [
          ...regular,
          ...(infoBtn.length ? [{ ...infoBtn[0], sort_order: regular.length }] : []),
          ...(footer.length  ? [{ ...footer[0],  sort_order: regular.length + (infoBtn.length ? 1 : 0) }] : []),
        ]
        await this.ensureInfoButtonsBlock(); await this.ensureFooterBlock()
        this.originalBlocksOrder = this.pageBlocks.filter(b => !this.isFooterBlock(b) && !this.isInfoButtonsBlock(b)).map(b => b.id)
        this.hasUnsavedChanges = false
      } catch { this.pageBlocks = [] }
    },
    async ensureFooterBlock() {
      if (this.pageBlocks.find(b => b.type === 'footer')) return
      const fd = new FormData()
      ;['action','type','title','content','settings','sort_order','is_active'].forEach((k, i) => {
        fd.append(k, ['add_page_block','footer','Футер','',JSON.stringify({}), this.pageBlocks.length,'1'][i])
      })
      const r = await fetch('../api.php', { method: 'POST', body: fd, credentials: 'same-origin' })
      if (r.ok) { const res = await r.json(); this.pageBlocks.push({ id: res.id, type: 'footer', title: 'Футер', content: '', settings: {}, sort_order: this.pageBlocks.length, is_active: true }) }
    },
    async ensureInfoButtonsBlock() {
      if (this.pageBlocks.find(b => b.type === 'info_buttons')) return
      const def = JSON.stringify({ sectionTitle:'', buttons:[{ text:'', linkType:'page', link:'', style:'primary' }] })
      const fd = new FormData()
      ;['action','type','title','content','settings','sort_order','is_active'].forEach((k, i) => {
        fd.append(k, ['add_page_block','info_buttons','Информационные кнопки','',def, this.pageBlocks.length,'1'][i])
      })
      const r = await fetch('../api.php', { method: 'POST', body: fd, credentials: 'same-origin' })
      if (r.ok) {
        const res = await r.json()
        const footerIdx = this.pageBlocks.findIndex(b => b.type === 'footer')
        const nb = { id: res.id, type: 'info_buttons', title: 'Информационные кнопки', content: '', settings: JSON.parse(def), sort_order: this.pageBlocks.length, is_active: true }
        footerIdx !== -1 ? this.pageBlocks.splice(footerIdx, 0, nb) : this.pageBlocks.push(nb)
      }
    },
    isFooterBlock(b) { return b.type === 'footer' },
    isInfoButtonsBlock(b) { return b.type === 'info_buttons' },

    openAddBlockModal() {
      const regular = this.pageBlocks.filter(b => !this.isFooterBlock(b) && !this.isInfoButtonsBlock(b))
      this.blockForm = { type:'', title:'', content:'', settings:{}, sort_order: regular.length, is_active: true }
      if (!this.pages.length) this.loadPages()
      if (!this.isMobileDevice()) {
        if (this.minimizedModals['blockModal']) this.restoreModal('blockModal')
        this.showAddBlockModal = true
        this.$nextTick(() => this.applyModalSize('blockModal'))
      } else { this.$emit('change-page', 'block') }
    },
    editBlock(block) {
      if (this.minimizedModals['blockModal']) this.restoreModal('blockModal')
      this.editingBlock = block
      this.blockForm = { type: block.type, title: block.title, content: block.content, settings: { ...block.settings }, sort_order: block.sort_order, is_active: block.is_active }
      if ((block.type === 'buttons' || block.type === 'info_buttons') && !Array.isArray(this.blockForm.settings.buttons))
        this.blockForm.settings.buttons = [{ text:'', linkType:'page', link:'', style:'primary' }]
      if (block.type === 'actual') {
        if (!Array.isArray(this.blockForm.settings.promotions)) this.blockForm.settings.promotions = []
        this.blockForm.settings.promotions.forEach(p => { if (!Array.isArray(p.links)) p.links = p.links ? Object.values(p.links) : [] })
      }
      if (block.type === 'contact' && !this.blockForm.settings.socialLinks)
        this.blockForm.settings.socialLinks = { telegram:'', instagram:'', tiktok:'' }
      if (!this.isMobileDevice()) {
        this.showAddBlockModal = true
        this.$nextTick(() => this.applyModalSize('blockModal'))
      } else { this.$emit('change-page', 'block') }
    },
    closeBlockModal(event) {
      if (this.minimizedModals['blockModal']) delete this.minimizedModals['blockModal']
      if (this.maximizedModals['blockModal']) delete this.maximizedModals['blockModal']
      if (!this.isMobileDevice()) {
        if (event && event.target !== event.currentTarget) return
        this.showAddBlockModal = false
      } else { this.$emit('change-page', 'admin') }
      this.editingBlock = null; this.blockError = ''; this.blockSuccess = ''
      this.blockForm = { type:'', title:'', content:'', settings:{}, sort_order:0, is_active:true }
    },
    onBlockTypeChange() {
      const defaults = {
        hero:     { sectionTitle:'', mainTitle:'', subtitle:'', description:'', backgroundImage:'', backgroundPosition:'center', backgroundSize:'cover', buttonA:'', buttonB:'' },
        features: { sectionTitle:'', features:[{ icon:'fas fa-gem', title:'', description:'' }] },
        history:  { sectionTitle:'', events:[{ year:'', title:'', description:'' }] },
        stats:    { sectionTitle:'', stats:[{ number:'', label:'' }] },
        products: { sectionTitle:'Наша коллекция' },
        buttons:  { sectionTitle:'', buttons:[{ text:'', linkType:'page', link:'', style:'primary' }] },
        actual:   { sectionTitle:'Акции', promotions:[{ title:'', description:'', image:'', links:[], linkType:'url', link:'', linkText:'' }] },
        contact:  { sectionTitle:'Контакты', email:'', phone:'', address:'', socialLinks:{ telegram:'', instagram:'', tiktok:'' } },
        info_buttons: { sectionTitle:'', buttons:[{ text:'', linkType:'page', link:'', style:'primary' }] },
        footer:   {},
        text:     { sectionTitle:'' },
      }
      this.blockForm.settings = defaults[this.blockForm.type] || { sectionTitle:'' }
    },
    addFeature()        { this.blockForm.settings.features.push({ icon:'fas fa-check', title:'', description:'' }) },
    removeFeature(i)    { this.blockForm.settings.features.splice(i, 1) },
    addHistoryEvent()   { this.blockForm.settings.events.push({ year:'', title:'', description:'' }) },
    removeHistoryEvent(i){ this.blockForm.settings.events.splice(i, 1) },
    addStat()           { this.blockForm.settings.stats.push({ number:'', label:'' }) },
    removeStat(i)       { this.blockForm.settings.stats.splice(i, 1) },
    addButton()         { if (!this.blockForm.settings.buttons) this.blockForm.settings.buttons = []; this.blockForm.settings.buttons.push({ text:'', linkType:'page', link:'', style:'primary' }) },
    removeButton(i)     { this.blockForm.settings.buttons.splice(i, 1) },
    addPromotion()      { if (!this.blockForm.settings.promotions) this.blockForm.settings.promotions = []; this.blockForm.settings.promotions.push({ title:'', description:'', image:'', links:[], linkType:'url', link:'', linkText:'' }) },
    removePromotion(i)  { this.blockForm.settings.promotions.splice(i, 1) },
    addLink(pi)         { const p = this.blockForm.settings.promotions?.[pi]; if (!p) return; if (!Array.isArray(p.links)) p.links = []; p.links.push({ name:'', link:'', title:'', description:'' }) },
    removeLink(pi, li)  { this.blockForm.settings.promotions?.[pi]?.links?.splice(li, 1) },
    getPromoLinkProductId(link) {
      if (!link) return ''; if (link.data?.id) return link.data.id
      const m = String(link.link||'').match(/[?&]id=(\d+)/); return m ? m[1] : ''
    },
    onPromoLinkProductChange(e, pi, li) {
      const id = e.target.value; const products = this.getProductsObject(); const p = products[id]
      const link = this.blockForm.settings.promotions[pi].links[li]
      const keepTitle = link?.title || ''; const keepDesc = link?.description || ''
      this.blockForm.settings.promotions[pi].links[li] = p
          ? { name: p.name, link: window.location.origin + '/product/?id=' + p.id, title: keepTitle, description: keepDesc, data: p }
          : { name:'', link:'', title: keepTitle, description: keepDesc }
    },
    async handleBackgroundImageUpload(e) {
      const file = e.target.files[0]; if (!file) return
      const fd = new FormData(); fd.append('image', file); fd.append('action', 'upload_background_image')
      const r = await fetch('../api.php', { method:'POST', body: fd, credentials:'same-origin' })
      if (r.ok) { const res = await r.json(); this.blockForm.settings.backgroundImage = res.url }
    },
    removeBackgroundImage() { this.blockForm.settings.backgroundImage = '' },
    async handlePromotionImageUpload(e, idx) {
      const file = e.target.files[0]; if (!file || idx == null) return
      const fd = new FormData(); fd.append('image', file); fd.append('action', 'upload_background_image')
      const r = await fetch('../api.php', { method:'POST', body: fd, credentials:'same-origin' })
      if (r.ok) { const res = await r.json(); if (this.blockForm.settings.promotions?.[idx]) this.blockForm.settings.promotions[idx].image = res.url }
      e.target.value = ''
    },
    removePromotionImage(idx) { if (this.blockForm.settings.promotions?.[idx]) this.blockForm.settings.promotions[idx].image = '' },
    async saveBlock() {
      this.blockLoading = true; this.blockError = ''; this.blockSuccess = ''
      try {
        const regular = this.pageBlocks.filter(b => !this.isFooterBlock(b) && !this.isInfoButtonsBlock(b))
        if (!this.editingBlock) this.blockForm.sort_order = regular.length

        const settings = JSON.parse(JSON.stringify(this.blockForm.settings || {}))
        if (this.blockForm.type === 'actual' && Array.isArray(settings.promotions)) {
          settings.promotions.forEach(p => {
            p.links = (Array.isArray(p.links) ? p.links : Object.values(p.links||{})).map(l => ({
              name: l.name||'', link: l.link||'', title: l.title||'', description: l.description||'', data: l.data||{}
            }))
          })
        }

        const fd = new FormData()
        fd.append('action', this.editingBlock ? 'update_page_block' : 'add_page_block')
        if (this.editingBlock) fd.append('id', this.editingBlock.id)
        ;['type','title','content'].forEach(k => fd.append(k, this.blockForm[k]))
        fd.append('settings',   JSON.stringify(settings))
        fd.append('sort_order', this.blockForm.sort_order)
        fd.append('is_active',  this.blockForm.is_active ? '1' : '0')

        const r = await fetch('../api.php', { method:'POST', body: fd, credentials:'same-origin' })
        if (!r.ok) throw new Error('HTTP error')

        if (this.editingBlock) {
          const idx = this.pageBlocks.findIndex(b => b.id === this.editingBlock.id)
          if (idx !== -1) this.pageBlocks[idx] = { ...this.pageBlocks[idx], ...this.blockForm, settings }
        } else {
          const res = await r.json()
          const nb = { id: res.id, ...this.blockForm, settings }
          const fi = this.pageBlocks.findIndex(b => this.isFooterBlock(b))
          const ii = this.pageBlocks.findIndex(b => this.isInfoButtonsBlock(b))
          const insertAt = ii !== -1 ? ii : (fi !== -1 ? fi : this.pageBlocks.length)
          this.pageBlocks.splice(insertAt, 0, nb)
        }

        await this.ensureInfoButtonsBlock(); await this.ensureFooterBlock()
        this.blockSuccess = 'Блок сохранён'
        setTimeout(() => this.closeBlockModal(), 1500)
      } catch (e) { this.blockError = e.message || 'Ошибка' }
      this.blockLoading = false
    },
    async deleteBlock(id) {
      const b = this.pageBlocks.find(b => b.id === id)
      if (b && (this.isFooterBlock(b) || this.isInfoButtonsBlock(b))) { alert('Этот блок нельзя удалить'); return }
      if (!confirm('Удалить блок?')) return
      const fd = new FormData(); fd.append('action', 'delete_page_block'); fd.append('id', id)
      const r = await fetch('../api.php', { method:'POST', body: fd, credentials:'same-origin' })
      if (r.ok) { this.pageBlocks = this.pageBlocks.filter(b => b.id !== id); await this.ensureInfoButtonsBlock(); await this.ensureFooterBlock() }
    },
    async toggleBlockActive(block) {
      const fd = new FormData()
      ;['action','id','type','title','content'].forEach((k,i) => fd.append(k, ['update_page_block', block.id, block.type, block.title, block.content][i]))
      fd.append('settings',   JSON.stringify(block.settings))
      fd.append('sort_order', block.sort_order)
      fd.append('is_active',  block.is_active ? '0' : '1')
      const r = await fetch('../api.php', { method:'POST', body: fd, credentials:'same-origin' })
      if (r.ok) block.is_active = !block.is_active
    },
    startDrag(block, e) { this.draggingBlockId = block.id; e.dataTransfer.effectAllowed = 'move' },
    endDrag() { this.draggingBlockId = null },
    dropBlock(target, e) {
      e.preventDefault()
      const dragged = this.pageBlocks.find(b => b.id === this.draggingBlockId)
      if (!dragged || this.isFooterBlock(dragged) || this.isInfoButtonsBlock(dragged)) return
      if (this.isFooterBlock(target) || this.isInfoButtonsBlock(target)) return
      const di = this.pageBlocks.findIndex(b => b.id === this.draggingBlockId)
      const ti = this.pageBlocks.findIndex(b => b.id === target.id)
      if (di === -1 || ti === -1) return
      const [d] = this.pageBlocks.splice(di, 1); this.pageBlocks.splice(ti, 0, d)
      this.checkForChanges()
    },
    checkForChanges() {
      const cur = this.pageBlocks.filter(b => !this.isFooterBlock(b) && !this.isInfoButtonsBlock(b)).map(b => b.id)
      this.hasUnsavedChanges = JSON.stringify(cur) !== JSON.stringify(this.originalBlocksOrder)
    },
    async saveBlocksOrder() {
      if (!this.hasUnsavedChanges) return
      const regular = this.pageBlocks.filter(b => !this.isFooterBlock(b) && !this.isInfoButtonsBlock(b))
      const infoBtn = this.pageBlocks.find(b => this.isInfoButtonsBlock(b))
      const footer  = this.pageBlocks.find(b => this.isFooterBlock(b))
      const order = [
        ...regular.map((b, i) => ({ id: b.id, sort_order: i })),
        ...(infoBtn ? [{ id: infoBtn.id, sort_order: regular.length }] : []),
        ...(footer  ? [{ id: footer.id,  sort_order: regular.length + (infoBtn ? 1 : 0) }] : []),
      ]
      const fd = new FormData(); fd.append('action', 'save_blocks_order'); fd.append('blocks_order', JSON.stringify(order))
      const r = await fetch('../api.php', { method:'POST', body: fd, credentials:'same-origin' })
      if (r.ok) { this.originalBlocksOrder = this.pageBlocks.map(b => b.id); this.hasUnsavedChanges = false; this.blockSuccess = 'Порядок сохранён'; setTimeout(() => { this.blockSuccess = '' }, 3000) }
    },
    getBlockTypeName(type) {
      return { hero:'Hero секция', features:'Преимущества', products:'Товары', history:'История', stats:'Статистика',
        contact:'Контакты', text:'Текстовый блок', buttons:'Кнопки', actual:'Акции',
        info_buttons:'Информационные кнопки', footer:'Футер' }[type] || type
    },
    getBlockPreview(block) {
      const s = block.settings || {}
      const map = {
        hero:      `<div><h3>${s.mainTitle||'Заголовок'}</h3><p>${s.subtitle||''}</p></div>`,
        features:  `<div><h4>${s.sectionTitle||'Преимущества'}</h4><p>${(s.features||[]).length} элементов</p></div>`,
        history:   `<div><h4>${s.sectionTitle||'История'}</h4><p>${(s.events||[]).length} событий</p></div>`,
        stats:     `<div><h4>${s.sectionTitle||'Статистика'}</h4><p>${(s.stats||[]).length} показателей</p></div>`,
        products:  `<div><h4>Товары</h4><p>${s.sectionTitle||'Наша коллекция'}</p></div>`,
        contact:   `<div><h4>Контакты</h4><p>${s.email||'—'}</p></div>`,
        buttons:   `<div><h4>Кнопки</h4><p>${(s.buttons||[]).length} кнопок</p></div>`,
        actual:    `<div><h4>${s.sectionTitle||'Акции'}</h4><p>${(s.promotions||[]).length} акций</p></div>`,
        footer:    `<div><h4>Футер</h4><p>${(block.content||'').substring(0,50)}</p></div>`,
        info_buttons: `<div><h4>Инфо-кнопки</h4><p>${(s.buttons||[]).length} кнопок</p></div>`,
        text:      `<div><h4>Текст</h4><p>${(block.content||'').substring(0,80)}</p></div>`,
      }
      return map[block.type] || `<div><h4>${this.getBlockTypeName(block.type)}</h4><p>${block.title||'—'}</p></div>`
    },

    /* ════════════════════════════════
       PAGES
    ════════════════════════════════ */
    async loadPages() {
      try {
        const r = await fetch('../api.php?action=pages', { credentials: 'same-origin' })
        if (r.ok) {
          const pages = await r.json()
          this.pages = pages.map(p => ({ ...p, navigation_buttons: typeof p.navigation_buttons === 'string' ? JSON.parse(p.navigation_buttons||'[]') : (p.navigation_buttons||[]) }))
        }
      } catch {}
    },
    openAddPageModal() {
      this.pageForm = { slug:'', title:'', content:'', meta_title:'', meta_description:'', is_published:true, is_main_page:false, navigation_buttons:[] }
      this.pageElements = []; this.selectedElement = null; this.viewMode = 'visual'; this.pageError = ''; this.pageSuccess = ''
      if (!this.isMobileDevice()) {
        if (this.minimizedModals['pageModal']) this.restoreModal('pageModal')
        this.showAddPageModal = true
        this.$nextTick(() => this.applyModalSize('pageModal', { width:'60vw', height:'80vh' }))
      } else { this.$emit('change-page', 'page') }
    },
    editPage(page) {
      this.editingPage = page
      const navBtns = Array.isArray(page.navigation_buttons) ? page.navigation_buttons : (typeof page.navigation_buttons === 'string' ? JSON.parse(page.navigation_buttons||'[]') : [])
      this.pageForm = { slug: page.slug||'', title: page.title||'', content: page.content||'', meta_title: page.meta_title||'', meta_description: page.meta_description||'', is_published: !!page.is_published, is_main_page: !!page.is_main_page, navigation_buttons: navBtns }
      this.pageElements = this.parseHTMLToElements(page.content||''); this.selectedElement = null; this.viewMode = 'visual'; this.pageError = ''; this.pageSuccess = ''
      if (!this.isMobileDevice()) {
        if (this.minimizedModals['pageModal']) this.restoreModal('pageModal')
        this.showAddPageModal = true
        this.$nextTick(() => this.applyModalSize('pageModal', { width:'60vw', height:'80vh' }))
      } else { this.$emit('change-page', 'page') }
    },
    closePageModal(event) {
      if (this.minimizedModals['pageModal']) delete this.minimizedModals['pageModal']
      if (this.maximizedModals['pageModal']) delete this.maximizedModals['pageModal']
      if (!this.isMobileDevice()) {
        if (event && event.target !== event.currentTarget) return
        this.showAddPageModal = false
      } else { this.$emit('change-page', 'admin') }
      this.editingPage = null; this.pageForm = { slug:'', title:'', content:'', meta_title:'', meta_description:'', is_published:true, is_main_page:false, navigation_buttons:[] }
      this.pageElements = []; this.selectedElement = null; this.pageError = ''; this.pageSuccess = ''
    },
    async savePage() {
      if (this.viewMode === 'visual') this.pageForm.content = this.elementsToHTML()
      this.pageLoading = true; this.pageError = ''; this.pageSuccess = ''
      try {
        const fd = new FormData()
        fd.append('action', this.editingPage ? 'update_page' : 'add_page')
        if (this.editingPage) fd.append('id', this.editingPage.id)
        ;['slug','title','content','meta_title','meta_description'].forEach(k => fd.append(k, this.pageForm[k]?.trim()||''))
        fd.append('is_published',        this.pageForm.is_published ? '1' : '0')
        fd.append('is_main_page',        this.pageForm.is_main_page ? '1' : '0')
        fd.append('navigation_buttons',  JSON.stringify(this.pageForm.navigation_buttons||[]))
        const r = await fetch('../api.php', { method:'POST', body: fd, credentials:'same-origin' })
        const res = await r.json()
        if (!r.ok || res.error) throw new Error(res.error||'Ошибка')
        this.pageSuccess = 'Сохранено'; await this.loadPages(); setTimeout(() => this.closePageModal(), 1500)
      } catch (e) { this.pageError = e.message }
      this.pageLoading = false
    },
    async deletePage(id) {
      if (!confirm('Удалить страницу?')) return
      const fd = new FormData(); fd.append('action', 'delete_page'); fd.append('id', id)
      const r = await fetch('../api.php', { method:'POST', body: fd, credentials:'same-origin' })
      if (r.ok) await this.loadPages()
    },

    /* ── page elements (visual editor) ── */
    toggleViewMode() {
      if (this.viewMode === 'visual') { this.pageForm.content = this.elementsToHTML(); this.viewMode = 'html' }
      else { this.pageElements = this.parseHTMLToElements(this.pageForm.content||''); this.selectedElement = null; this.viewMode = 'visual' }
    },
    addElementToPage(tpl) {
      const nb = { id: Date.now() + Math.random(), type: tpl.type, content: tpl.defaultContent||'', level: tpl.type==='heading'?2:null, link: tpl.type==='button'?'':null, style: tpl.type==='button'?'primary':null }
      this.pageElements.push(nb); this.selectedElement = nb
    },
    insertElementAt(idx, tpl) {
      const nb = { id: Date.now() + Math.random(), type: tpl.type, content: tpl.defaultContent||'', level: tpl.type==='heading'?2:null, link: tpl.type==='button'?'':null, style: tpl.type==='button'?'primary':null }
      this.pageElements.splice(idx, 0, nb); this.selectedElement = nb
    },
    selectElement(el) { this.selectedElement = el },
    removeElement(idx) { if (confirm('Удалить?')) { if (this.selectedElement?.id === this.pageElements[idx].id) this.selectedElement = null; this.pageElements.splice(idx, 1) } },
    moveElementUp(idx)   { if (idx > 0) { const [el] = this.pageElements.splice(idx, 1); this.pageElements.splice(idx-1, 0, el) } },
    moveElementDown(idx) { if (idx < this.pageElements.length-1) { const [el] = this.pageElements.splice(idx, 1); this.pageElements.splice(idx+1, 0, el) } },
    updateElementContent() { if (this.selectedElement) { const i = this.pageElements.findIndex(e => e.id===this.selectedElement.id); if (i!==-1) { this.pageElements[i]={...this.selectedElement}; this.selectedElement=this.pageElements[i] } } },
    startDragElement(el, e) { this.draggingElement = {...el, isNew:true}; e.dataTransfer.effectAllowed='copy' },
    startDragPageElement(el, e) { this.draggingElement = {...el, isNew:false, index: this.pageElements.findIndex(pe=>pe.id===el.id)}; e.dataTransfer.effectAllowed='move' },
    onPreviewDragOver(e) { e.preventDefault() },
    onPreviewDrop(e) { e.preventDefault(); if (this.draggingElement?.isNew) this.addElementToPage(this.draggingElement); this.draggingElement=null },
    onPreviewDragLeave(e) { if (!e.currentTarget.contains(e.relatedTarget)) this.draggingElement=null },
    onElementDragOver(idx, e) {
      e.preventDefault(); e.stopPropagation()
      document.querySelectorAll('.page-element').forEach(el => el.classList.remove('drag-over-top','drag-over-bottom'))
      const rect = e.currentTarget.getBoundingClientRect()
      e.currentTarget.classList.add(e.clientY < rect.top+rect.height/2 ? 'drag-over-top' : 'drag-over-bottom')
    },
    onElementDrop(idx, e) {
      e.preventDefault(); e.stopPropagation()
      document.querySelectorAll('.page-element').forEach(el => el.classList.remove('drag-over-top','drag-over-bottom'))
      if (!this.draggingElement) return
      const rect = e.currentTarget.getBoundingClientRect()
      const after = e.clientY >= rect.top + rect.height / 2
      const targetIdx = after ? idx + 1 : idx
      if (this.draggingElement.isNew) { this.insertElementAt(targetIdx, this.draggingElement) }
      else {
        const oi = this.draggingElement.index
        const ni = oi < targetIdx ? targetIdx - 1 : targetIdx
        if (oi !== ni) { const [el] = this.pageElements.splice(oi, 1); this.pageElements.splice(ni, 0, el) }
      }
      this.draggingElement = null
    },
    renderElement(el) {
      if (el.type === 'heading')   return `<h${el.level||2}>${el.content||'Заголовок'}</h${el.level||2}>`
      if (el.type === 'paragraph') return `<p>${el.content||'Абзац'}</p>`
      if (el.type === 'image')     return el.content ? `<img src="${el.content}" style="max-width:100%">` : '<div style="padding:40px;text-align:center;opacity:.5"><i class="fas fa-image" style="font-size:48px"></i></div>'
      if (el.type === 'list')      return el.content || '<ul><li>Элемент</li></ul>'
      if (el.type === 'button')    return `<a href="${el.link||'#'}" class="btn btn-${el.style||'primary'}">${el.content||'Кнопка'}</a>`
      if (el.type === 'divider')   return '<hr>'
      return el.content || ''
    },
    getElementTypeLabel(type) { return this.availableElements.find(e=>e.type===type)?.label || type },
    elementsToHTML() {
      return this.pageElements.map(el => {
        if (el.type === 'heading')   return `<h${el.level||2}>${this.escapeHtml(el.content||'')}</h${el.level||2}>`
        if (el.type === 'paragraph') return `<p>${this.escapeHtml(el.content||'')}</p>`
        if (el.type === 'image')     return el.content ? `<img src="${this.escapeHtml(el.content)}" style="max-width:100%">` : ''
        if (el.type === 'list')      return el.content || ''
        if (el.type === 'button')    return `<a href="${this.escapeHtml(el.link||'#')}" class="btn btn-${el.style||'primary'}">${this.escapeHtml(el.content||'')}</a>`
        if (el.type === 'divider')   return '<hr>'
        return this.escapeHtml(el.content||'')
      }).join('\n')
    },
    parseHTMLToElements(html) {
      if (!html?.trim()) return []
      const els = []; const div = document.createElement('div'); div.innerHTML = html.trim()
      let eid = Date.now()
      const process = (node) => {
        if (node.nodeType === Node.TEXT_NODE) { const t = node.textContent.trim(); if (t) els.push({ id: eid++, type:'paragraph', content:t }); return }
        if (node.nodeType !== Node.ELEMENT_NODE) return
        const tag = node.tagName.toLowerCase()
        if (/^h[1-6]$/.test(tag)) { els.push({ id:eid++, type:'heading', content:node.textContent.trim(), level:+tag[1] }); return }
        if (tag === 'p') { const t=node.textContent.trim(); if(t) els.push({ id:eid++, type:'paragraph', content:t }); return }
        if (tag === 'img') { els.push({ id:eid++, type:'image', content:node.getAttribute('src')||'' }); return }
        if (tag === 'ul' || tag === 'ol') { els.push({ id:eid++, type:'list', content:node.outerHTML }); return }
        if (tag === 'a' && node.classList.contains('btn')) {
          const style = node.classList.contains('btn-secondary') ? 'secondary' : node.classList.contains('btn-outline') ? 'outline' : 'primary'
          els.push({ id:eid++, type:'button', content:node.textContent.trim(), link:node.getAttribute('href')||'#', style }); return
        }
        if (tag === 'hr') { els.push({ id:eid++, type:'divider', content:'<hr>' }); return }
        Array.from(node.childNodes).forEach(child => { if (child.nodeType === Node.ELEMENT_NODE) process(child) })
      }
      Array.from(div.childNodes).forEach(process); return els
    },

    /* ════════════════════════════════
       ICON PICKER
    ════════════════════════════════ */
    openIconPicker(target, prop) {
      this.currentIconTarget = { target, property: prop }
      this.selectedIconClass = target[prop] || ''
      this.iconSearchQuery = ''; this.selectedIconCategory = 'all'
      this.showIconPicker = true; this.updateFilteredIcons()
      this.$nextTick(() => this.applyModalSize('iconPickerModal'))
    },
    closeIconPicker() { this.showIconPicker = false; this.currentIconTarget = null; this.selectedIconClass = '' },
    selectIcon(icon) { this.selectedIconClass = icon.class },
    confirmIconSelection() {
      if (this.currentIconTarget && this.selectedIconClass) this.currentIconTarget.target[this.currentIconTarget.property] = this.selectedIconClass
      this.closeIconPicker()
    },
    updateFilteredIcons() {
      let list = this.availableIcons
      if (this.selectedIconCategory !== 'all') list = list.filter(i => i.category === this.selectedIconCategory)
      if (this.iconSearchQuery) { const q = this.iconSearchQuery.toLowerCase(); list = list.filter(i => i.name.toLowerCase().includes(q) || i.class.toLowerCase().includes(q)) }
      this.filteredIcons = list
    },

    /* ════════════════════════════════
       CONTENT MODAL
    ════════════════════════════════ */
    addContentItem(section) {
      if (section==='features') this.featuresContent.push({ title:'', content:'', sort_order: this.featuresContent.length })
      else this.historyContent.push({ year:'', title:'', content:'', sort_order: this.historyContent.length })
    },
    removeContentItem(section, idx) {
      if (section==='features') this.featuresContent.splice(idx,1)
      else this.historyContent.splice(idx,1)
    },
    async saveContent() {
      this.contentLoading = true; this.contentError = ''; this.contentSuccess = ''
      try {
        const data = [
          ...this.featuresContent.map((it,i) => ({ section:'features', title:it.title, content:it.content, sort_order:i })),
          ...this.historyContent.map((it,i) => ({ section:'history', title:it.year, content:`${it.title}\n${it.content}`, sort_order:i })),
        ]
        const fd = new FormData(); fd.append('action','save_home_content'); fd.append('content', JSON.stringify(data))
        const r = await fetch('../api.php', { method:'POST', body: fd, credentials:'same-origin' })
        if (r.ok) { this.contentSuccess = 'Сохранено'; setTimeout(() => this.closeContentModal(), 1500) }
        else throw new Error('Ошибка сохранения')
      } catch (e) { this.contentError = e.message }
      this.contentLoading = false
    },
    closeContentModal(event) {
      if (event && event.target !== event.currentTarget) return
      this.showContentModal = false; this.contentError = ''; this.contentSuccess = ''
    },

    /* ════════════════════════════════
       USERS (add-user modal)
    ════════════════════════════════ */
    openAddUserModal() {
      this.registerData = { username:'', password:'', role:'user' }
      this.registerError = ''; this.registerSuccess = ''
      this.showAddUser = true
      this.$nextTick(() => this.applyModalSize('addUserModal'))
    },
    closeUserModal(event) {
      if (event && event.target !== event.currentTarget) return
      this.showAddUser = false; this.registerData = { username:'', password:'', role:'user' }; this.registerError = ''; this.registerSuccess = ''
    },
    async register() {
      const u = this.registerData.username.trim(), p = this.registerData.password.trim()
      if (!u||!p) { this.registerError='Введите логин и пароль'; return }
      this.registerLoading = true; this.registerError = ''
      try {
        const fd = new FormData(); fd.append('action','register'); fd.append('username',u); fd.append('password',p); fd.append('role', this.registerData.role||'user')
        const r = await fetch('../api.php', { method:'POST', body: fd, credentials:'same-origin' })
        const d = await r.json()
        if (!r.ok||!d.success) throw new Error(d.error||'Ошибка')
        this.registerSuccess = 'Создан'; setTimeout(() => { this.showAddUser=false; this.registerSuccess='' }, 1000)
        this.users = [] // reload
        await this.loadUsers()
      } catch (e) { this.registerError = e.message }
      this.registerLoading = false
    },
    async loadUsers() {
      this.usersLoading = true; this.usersError = ''
      try {
        const r = await fetch('../api.php?action=users', { credentials:'same-origin' })
        if (r.ok) this.users = await r.json(); else this.usersError = 'Ошибка загрузки'
      } catch { this.usersError = 'Ошибка загрузки' }
      this.usersLoading = false
    },
    getRoleLabel(role) { return { admin:'Администратор', user:'Пользователь' }[role] || role },
    getRoleClass(role) { return role === 'admin' ? 'role-admin' : 'role-user' },

    /* ════════════════════════════════
       MODAL — resize / drag / min/max
    ════════════════════════════════ */
    loadModalSizes() { try { const s = localStorage.getItem('admin_modal_sizes'); if (s) this.modalSizes = JSON.parse(s) } catch {} },
    saveModalSizes() { try { localStorage.setItem('admin_modal_sizes', JSON.stringify(this.modalSizes)) } catch {} },
    applyModalSize(id, params={}) {
      this.$nextTick(() => {
        const m = document.querySelector(`[data-modal-id="${id}"]`); if (!m) return
        const sz = this.modalSizes[id]
        if (sz?.width && sz?.height) {
          m.style.width = sz.width; m.style.height = sz.height; m.style.maxWidth = m.style.maxHeight = 'none'
          if (sz.left!=null) { m.style.position='fixed'; m.style.left=sz.left+'px'; m.style.right='auto' }
          if (sz.top!=null)  { m.style.position='fixed'; m.style.top=sz.top+'px'; m.style.bottom='auto' }
          else this._centerModal(m)
        } else { this._setDefaultModalSize(m, params) }
        this._constrainModal(m)
      })
    },
    _setDefaultModalSize(m, params={}) {
      m.style.width = params.width||'50vw'; m.style.height = params.height||'60vh'; m.style.position='fixed'
      requestAnimationFrame(() => {
        const r=m.getBoundingClientRect(); const l=(window.innerWidth-r.width)/2; const t=(window.innerHeight-r.height)/2
        m.style.left=Math.max(20,l)+'px'; m.style.top=Math.max(20,t)+'px'; m.style.right=m.style.bottom='auto'
      })
    },
    _centerModal(m) {
      m.style.position='fixed'
      requestAnimationFrame(() => {
        const r=m.getBoundingClientRect(); const w=r.width||600; const h=r.height||400
        m.style.left=Math.max(20,(window.innerWidth-w)/2)+'px'; m.style.top=Math.max(20,(window.innerHeight-h)/2)+'px'; m.style.right=m.style.bottom='auto'
      })
    },
    _constrainModal(m) {
      const r=m.getBoundingClientRect(); const vw=window.innerWidth; const vh=window.innerHeight; const pad=20
      if (r.right>vw-pad) m.style.width=Math.max(400,vw-pad-r.left)+'px'
      if (r.bottom>vh-pad) m.style.height=Math.max(200,vh-pad-r.top)+'px'
      if (r.left<pad) m.style.left=pad+'px'
      if (r.top<pad) m.style.top=pad+'px'
    },
    checkAllModalsBounds() { document.querySelectorAll('.modal[data-modal-id]').forEach(m => { if (window.getComputedStyle(m).display!=='none') this._constrainModal(m) }) },
    startResize(e, id, dir) {
      e.preventDefault(); e.stopPropagation()
      this.resizingModal=id; this.resizeDirection=dir
      const m=document.querySelector(`[data-modal-id="${id}"]`); if (!m) return
      const r=m.getBoundingClientRect()
      this.resizeStartX=e.clientX; this.resizeStartY=e.clientY; this.resizeStartWidth=r.width; this.resizeStartHeight=r.height; this.resizeStartLeft=r.left; this.resizeStartTop=r.top
      this.boundHandleResize = this._onResize.bind(this); this.boundStopResize = this._stopResize.bind(this)
      document.addEventListener('mousemove', this.boundHandleResize); document.addEventListener('mouseup', this.boundStopResize)
    },
    _onResize(e) {
      if (!this.resizingModal) return
      const m=document.querySelector(`[data-modal-id="${this.resizingModal}"]`); if (!m) return
      const dx=e.clientX-this.resizeStartX; const dy=e.clientY-this.resizeStartY
      const pad=20; const minW=400; const minH=200; const vw=window.innerWidth; const vh=window.innerHeight
      let nw=this.resizeStartWidth, nh=this.resizeStartHeight, nl=this.resizeStartLeft, nt=this.resizeStartTop
      const dir=this.resizeDirection
      if (dir.includes('e')) nw=Math.max(minW,Math.min(vw-2*pad, this.resizeStartWidth+dx))
      if (dir.includes('w')) { nw=Math.max(minW,this.resizeStartWidth-dx); nl=this.resizeStartLeft+(this.resizeStartWidth-nw); if(nl<pad){nl=pad;nw=this.resizeStartWidth+this.resizeStartLeft-pad} }
      if (dir.includes('s')) nh=Math.max(minH,Math.min(vh-2*pad, this.resizeStartHeight+dy))
      if (dir.includes('n')) { nh=Math.max(minH,this.resizeStartHeight-dy); nt=this.resizeStartTop+(this.resizeStartHeight-nh); if(nt<pad){nt=pad;nh=this.resizeStartHeight+this.resizeStartTop-pad} }
      m.style.width=Math.max(minW,Math.min(nw,vw-2*pad))+'px'; m.style.height=Math.max(minH,Math.min(nh,vh-2*pad))+'px'; m.style.maxWidth=m.style.maxHeight='none'; m.style.position='fixed'
      if (dir.includes('w')) { m.style.left=Math.max(pad,nl)+'px'; m.style.right='auto' }
      if (dir.includes('n')) { m.style.top=Math.max(pad,nt)+'px'; m.style.bottom='auto' }
    },
    _stopResize() {
      if (!this.resizingModal) return
      const m=document.querySelector(`[data-modal-id="${this.resizingModal}"]`)
      if (m) { const r=m.getBoundingClientRect(); this.modalSizes[this.resizingModal]={ width:r.width+'px', height:r.height+'px', left:r.left, top:r.top }; this.saveModalSizes() }
      this.resizingModal=null; this.resizeDirection=null
      document.removeEventListener('mousemove', this.boundHandleResize); document.removeEventListener('mouseup', this.boundStopResize)
    },
    handleResizeDoubleClick(id, dir, e) {
      e.preventDefault(); e.stopPropagation()
      const now=Date.now()
      if (this.lastResizeClick.modalId===id && this.lastResizeClick.direction===dir && now-this.lastResizeClick.time<300) {
        this.toggleMaximize(id); this.lastResizeClick={modalId:null,direction:null,time:0}
      } else { this.lastResizeClick={modalId:id,direction:dir,time:now} }
    },
    startDragModal(id, e) {
      if (this.maximizedModals[id] || this.resizingModal===id) return
      const t=e.target; if (t.tagName==='BUTTON'||t.closest('button')||t.closest('.control-btns')||t.closest('.modal-resize-handle')) return
      const m=document.querySelector(`[data-modal-id="${id}"]`); if (!m) return
      e.preventDefault(); e.stopPropagation()
      this.draggingModal=id; const r=m.getBoundingClientRect()
      this.dragStartX=e.clientX; this.dragStartY=e.clientY; this.dragStartLeft=r.left; this.dragStartTop=r.top
      this.boundHandleDrag=this._onDragModal.bind(this); this.boundStopDrag=this._stopDragModal.bind(this)
      document.addEventListener('mousemove',this.boundHandleDrag); document.addEventListener('mouseup',this.boundStopDrag)
      m.classList.add('dragging')
    },
    _onDragModal(e) {
      if (!this.draggingModal) return
      const m=document.querySelector(`[data-modal-id="${this.draggingModal}"]`); if (!m) return
      const pad=20; const vw=window.innerWidth; const vh=window.innerHeight; const mw=m.offsetWidth; const mh=m.offsetHeight
      const nl=Math.max(pad,Math.min(this.dragStartLeft+(e.clientX-this.dragStartX),vw-mw-pad))
      const nt=Math.max(pad,Math.min(this.dragStartTop+(e.clientY-this.dragStartY),vh-mh-pad))
      m.style.position='fixed'; m.style.left=nl+'px'; m.style.top=nt+'px'; m.style.right=m.style.bottom='auto'
    },
    _stopDragModal() {
      if (!this.draggingModal) return
      const m=document.querySelector(`[data-modal-id="${this.draggingModal}"]`)
      if (m) { m.classList.remove('dragging'); const r=m.getBoundingClientRect(); if (!this.modalSizes[this.draggingModal]) this.modalSizes[this.draggingModal]={}; this.modalSizes[this.draggingModal].left=r.left; this.modalSizes[this.draggingModal].top=r.top; this.saveModalSizes() }
      this.draggingModal=null; document.removeEventListener('mousemove',this.boundHandleDrag); document.removeEventListener('mouseup',this.boundStopDrag)
    },
    minimizeModal(id) {
      const m=document.querySelector(`[data-modal-id="${id}"]`); if (!m) return
      const cs=window.getComputedStyle(m)
      this.minimizedModals[id]={ title: this.getModalTitle(id), restoreData:{ width:cs.width, height:cs.height, left:cs.left, top:cs.top, position:cs.position } }
      m.style.display='none'; if (this.maximizedModals[id]) delete this.maximizedModals[id]; this.$forceUpdate()
    },
    restoreModal(id) {
      const m=document.querySelector(`[data-modal-id="${id}"]`); if (!m||!this.minimizedModals[id]) return
      const rd=this.minimizedModals[id].restoreData
      m.style.display=''; m.style.width=rd.width||'50vw'; m.style.height=rd.height||'50vh'; m.style.position=rd.position||'fixed'
      if (rd.left&&rd.left!=='auto') { m.style.left=rd.left; m.style.right='auto' }
      if (rd.top&&rd.top!=='auto')   { m.style.top=rd.top; m.style.bottom='auto' }
      delete this.minimizedModals[id]; this.applyModalSize(id); this.$forceUpdate()
    },
    maximizeModal(id) {
      const m=document.querySelector(`[data-modal-id="${id}"]`); if (!m) return
      const cs=window.getComputedStyle(m); this.maximizedModals[id]={ width:cs.width, height:cs.height, left:cs.left, top:cs.top, position:cs.position }
      Object.assign(m.style, { position:'fixed', left:'0', top:'0', right:'0', bottom:'0', width:'100vw', height:'100vh', maxWidth:'none', maxHeight:'none' }); this.$forceUpdate()
    },
    restoreFromMaximize(id) {
      const m=document.querySelector(`[data-modal-id="${id}"]`); if (!m||!this.maximizedModals[id]) return
      const rd=this.maximizedModals[id]
      if (rd.width&&rd.width!=='auto') m.style.width=rd.width; if (rd.height&&rd.height!=='auto') m.style.height=rd.height
      m.style.position=rd.position||'fixed'
      if (rd.left&&rd.left!=='auto') { m.style.left=rd.left; m.style.right='auto' } else { m.style.left=m.style.right='' }
      if (rd.top&&rd.top!=='auto')   { m.style.top=rd.top; m.style.bottom='auto' } else { m.style.top=m.style.bottom='' }
      delete this.maximizedModals[id]; this.$nextTick(()=>this.applyModalSize(id)); this.$forceUpdate()
    },
    toggleMinimize(id) { this.minimizedModals[id] ? this.restoreModal(id) : this.minimizeModal(id) },
    toggleMaximize(id) { this.maximizedModals[id] ? this.restoreFromMaximize(id) : this.maximizeModal(id) },
    isModalMinimized(id) { return !!this.minimizedModals[id] },
    isModalMaximized(id) { return !!this.maximizedModals[id] },
    bringModalToFront(id) {
      document.querySelectorAll('.modal[data-modal-id]').forEach(m => m.style.zIndex='999')
      const m=document.querySelector(`.modal[data-modal-id="${id}"]`); if (m) m.style.zIndex='1000'
    },
    getModalTitle(id) {
      if (id==='productModal') return this.editingProduct ? 'Редактировать товар' : 'Добавить товар'
      if (id==='blockModal')   return this.editingBlock   ? 'Редактировать блок'  : 'Добавить блок'
      if (id==='pageModal')    return this.editingPage    ? 'Редактировать страницу' : 'Добавить страницу'
      return this.modalTitles[id] || 'Окно'
    },
    closeMinimizedModal(id) {
      if (this.minimizedModals[id]) delete this.minimizedModals[id]
      if (this.maximizedModals[id]) delete this.maximizedModals[id]
      if (id==='productModal') { this.showAddProduct=false; this.editingProduct=null }
      if (id==='blockModal')   { this.showAddBlockModal=false; this.editingBlock=null }
      if (id==='pageModal')    { this.showAddPageModal=false; this.editingPage=null }
      if (id==='addUserModal') { this.showAddUser=false }
      if (id==='contentModal') { this.showContentModal=false }
      if (id==='iconPickerModal') { this.showIconPicker=false }
      this.$forceUpdate()
    },
  },
}
</script>

<template>
  <div class="admin-dashboard">
    <main class="admin-main">
      <div class="container">

        <!-- ═══════════════════ PRODUCTS ═══════════════════ -->
        <section class="products-management">
          <div class="products-management-content">
            <h2>Управление товарами</h2>
            <button class="products-actions-menu-btn" @click="toggleProductsActionsSidebar">
              <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <div class="products-actions-toolbar">
              <button class="btn btn-primary" @click="openAddProductModal()" title="Добавить товар">
                <i class="fa-solid fa-plus"></i>
              </button>
              <button class="btn btn-primary" @click="manageCategoryEdit" title="Категории">
                <i class="fa-solid fa-sliders"></i>
              </button>
              <button class="btn btn-secondary" @click="getAllProducts" title="Обновить">
                <i class="fas fa-sync"></i>
              </button>
              <button class="btn btn-secondary" @click.stop="toggleColumnSelector" title="Столбцы">
                <i class="fa-solid fa-list"></i>
              </button>
              <div v-if="showColumnSelector" class="column-selector-dropdown" @click.stop>
                <div class="column-selector-header"><strong>Выберите столбцы</strong></div>
                <div class="column-selector-list">
                  <label v-for="(visible, column) in productTableColumns" :key="column" class="column-selector-item">
                    <input type="checkbox" :checked="visible" @change="toggleColumn(column)">
                    <span>{{ getColumnLabel(column) }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- sidebar overlay -->
          <div class="products-actions-sidebar-overlay" :class="{ active: showProductsActionsSidebar }" @click="closeProductsActionsSidebar"></div>
          <teleport to="body">
            <aside class="products-actions-sidebar" :class="{ open: showProductsActionsSidebar }">
              <div class="products-actions-sidebar-header">
                <h3>Действия</h3>
                <button class="products-actions-sidebar-close" @click="closeProductsActionsSidebar"><i class="fa-solid fa-xmark"></i></button>
              </div>
              <div class="products-actions-sidebar-body">
                <button class="btn btn-primary btn-block" @click="openAddProductModal(); closeProductsActionsSidebar()"><i class="fa-solid fa-plus"></i> Добавить товар</button>
                <button class="btn btn-primary btn-block" @click="manageCategoryEdit(); closeProductsActionsSidebar()"><i class="fa-solid fa-sliders"></i> Категории</button>
                <button class="btn btn-secondary btn-block" @click="getAllProducts(); closeProductsActionsSidebar()"><i class="fas fa-sync"></i> Обновить</button>
                <div class="products-actions-sidebar-section">
                  <strong>Столбцы таблицы</strong>
                  <div class="column-selector-list column-selector-list-sidebar">
                    <label v-for="(visible, column) in productTableColumns" :key="column" class="column-selector-item">
                      <input type="checkbox" :checked="visible" @change="toggleColumn(column)">
                      <span>{{ getColumnLabel(column) }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </aside>
          </teleport>

          <!-- categories inline -->
          <template v-if="categoryEdit">
            <div class="categories-management" style="margin-top:20px;">
              <h3>Категории</h3>
              <div class="categories-layout">
                <div class="categories-list" style="flex:2 1 420px">
                  <div v-for="cat in categories" :key="cat._id" class="drag-item" draggable="true"
                       @dragstart="startDragCategory(cat,$event)" @dragend="endDragCategory"
                       @dragover.prevent @drop="dropCategory(cat,$event)"
                       style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;cursor:move;margin-bottom:8px">
                    <div style="display:flex;align-items:center;gap:10px">
                      <i class="fas fa-grip-vertical" style="opacity:.6"></i>
                      <strong>{{ cat.name }}</strong>
                    </div>
                    <div style="display:flex;gap:8px">
                      <button class="btn btn-sm btn-move" @click="moveCategory(cat,'up')"><i class="fas fa-arrow-up"></i></button>
                      <button class="btn btn-sm btn-move" @click="moveCategory(cat,'down')"><i class="fas fa-arrow-down"></i></button>
                      <button class="btn btn-sm btn-edit" @click="startEditCategory(cat)"><i class="fas fa-edit"></i></button>
                      <button class="btn btn-sm btn-delete" @click="deleteCategory(cat)"><i class="fas fa-trash"></i></button>
                    </div>
                  </div>
                  <div v-if="!categories.length" style="color:#888;padding:15px">Категорий нет</div>
                </div>
                <div class="category-form" style="flex:1 1 320px">
                  <h4>{{ categoryForm.id ? 'Редактировать' : 'Добавить категорию' }}</h4>
                  <div class="form-group"><label>Название</label><input type="text" v-model="categoryForm.name" placeholder="Напр. Кожа"></div>
                  <div v-if="categoryError" class="error-message">{{ categoryError }}</div>
                  <div v-if="categorySuccess" class="success-message">{{ categorySuccess }}</div>
                  <div class="form-actions">
                    <button class="btn btn-primary" :disabled="categoryLoading || !categoryForm.name?.trim()" @click="saveCategory">{{ categoryLoading ? 'Сохранение...' : (categoryForm.id ? 'Сохранить' : 'Добавить') }}</button>
                    <button class="btn btn-secondary" style="margin-left:8px" @click="startAddCategory">✕</button>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- selected bar -->
          <div v-if="selectedProducts.length > 0" class="selected-products-bar">
            <div class="selected-products-info"><i class="fas fa-check-circle"></i> Выбрано: <strong>{{ selectedProducts.length }}</strong></div>
            <div class="selected-products-actions">
              <button @click="clearSelection" class="btn btn-sm btn-secondary"><i class="fas fa-times"></i> Снять</button>
              <button @click="deleteSelectedProducts" class="btn btn-sm btn-danger"><i class="fas fa-trash"></i> Удалить</button>
            </div>
          </div>

          <!-- products table -->
          <div class="products-table">
            <table>
              <thead>
              <tr>
                <th style="width:40px"><input type="checkbox" @change="toggleSelectAll" :checked="selectedProducts.length === products.length && products.length > 0"></th>
                <th v-show="isColumnVisible('id')" data-column="id">ID<div class="column-resize-handle"></div></th>
                <th v-show="isColumnVisible('image')" data-column="image">Изображение<div class="column-resize-handle"></div></th>
                <th v-show="isColumnVisible('name')" data-column="name">Название<div class="column-resize-handle"></div></th>
                <th v-show="isColumnVisible('description')" data-column="description">Описание<div class="column-resize-handle"></div></th>
                <th v-show="isColumnVisible('peculiarities')" data-column="peculiarities">Особенности<div class="column-resize-handle"></div></th>
                <th v-show="isColumnVisible('material')" data-column="material">Материал<div class="column-resize-handle"></div></th>
                <th v-show="isColumnVisible('price')" data-column="price">Цена<div class="column-resize-handle"></div></th>
                <th v-show="isColumnVisible('price_sale')" data-column="price_sale">Скидка<div class="column-resize-handle"></div></th>
                <th v-show="isColumnVisible('category')" data-column="category">Категория<div class="column-resize-handle"></div></th>
                <th v-show="isColumnVisible('user')" data-column="user">Создал<div class="column-resize-handle"></div></th>
                <th v-show="isColumnVisible('created')" data-column="created">Дата<div class="column-resize-handle"></div></th>
                <th v-show="isColumnVisible('updated_by')" data-column="updated_by">Обновил<div class="column-resize-handle"></div></th>
                <th v-show="isColumnVisible('updated_at')" data-column="updated_at">Обновлено<div class="column-resize-handle"></div></th>
                <th data-column="actions">Действия</th>
              </tr>
              </thead>
              <tbody>
              <tr v-if="!products.length">
                <td :colspan="getVisibleColumnsCount()" style="text-align:center;padding:40px;color:#888">
                  <i class="fas fa-box-open" style="font-size:48px;display:block;margin-bottom:15px"></i>
                  <p>Товары пока не добавлены</p>
                </td>
              </tr>
              <tr v-for="product in truncatedProducts" :key="product.id"
                  draggable="true" @dragstart="startDragProduct(product,$event)" @dragend="endDragProduct"
                  @dragover.prevent @drop="dropProduct(product,$event)"
                  @contextmenu.prevent="showContextMenu($event,product)"
                  :class="{ dragging: draggingProductId===product.id, selected: isProductSelected(product.id) }"
                  style="cursor:move">
                <td style="text-align:center"><input type="checkbox" :checked="isProductSelected(product.id)" @change="toggleProductSelection(product.id)" @click.stop></td>
                <td v-show="isColumnVisible('id')">{{ product.id }}</td>
                <td v-show="isColumnVisible('image')">
                  <template v-if="product.image">
                    <img v-if="!isVideo(product.image)" :src="'../' + product.image" :alt="product.name" class="product-thumb">
                    <video v-else :src="'../' + product.image" class="product-thumb" muted loop playsinline autoplay></video>
                  </template>
                  <i v-else class="fas fa-image" style="display:flex;width:60px;place-content:center"></i>
                </td>
                <td v-show="isColumnVisible('name')">{{ product.name }}</td>
                <td v-show="isColumnVisible('description')" class="table-product-description">
                  <div class="product-description">{{ product.truncatedDescription }}</div>
                </td>
                <td v-show="isColumnVisible('peculiarities')" class="table-peculiarities">
                  <div v-if="product.peculiarities && product.peculiarities.length" class="peculiarities-list">
                    <span v-for="(p,i) in product.peculiarities" :key="i" class="peculiarity-tag">{{ p }}</span>
                  </div>
                  <span v-else class="no-peculiarities">—</span>
                </td>
                <td v-show="isColumnVisible('material')">{{ product.material }}</td>
                <td v-show="isColumnVisible('price')">{{ product.price }} руб.</td>
                <td v-show="isColumnVisible('price_sale')">{{ product.price_sale ? product.price_sale + ' руб.' : '' }}</td>
                <td v-show="isColumnVisible('category')">{{ getCategoryName(product.category) }}</td>
                <td v-show="isColumnVisible('user')">{{ getUserName(product.created_by) }}</td>
                <td v-show="isColumnVisible('created')">{{ formatDate(product.created_at) }}</td>
                <td v-show="isColumnVisible('updated_by')">{{ getUserName(product.updated_by) }}</td>
                <td v-show="isColumnVisible('updated_at')">{{ formatDate(product.updated_at) }}</td>
                <td class="actions">
                  <div class="actions-container">
                    <button @click.stop="hideProduct(product.id)" class="btn btn-sm btn-link" :title="product.visibility===0?'Показать':'Скрыть'">
                      <i class="fa-solid" :class="product.visibility===0?'fa-eye-slash':'fa-eye'"></i>
                    </button>
                    <button @click.stop="openProductPage(product.id)" class="btn btn-sm btn-link"><i class="fa-solid fa-up-right-from-square"></i></button>
                    <button @click.stop="editProduct(product)" class="btn btn-sm btn-edit"><i class="fas fa-edit"></i></button>
                    <button @click.stop="deleteProduct(product.id)" class="btn btn-sm btn-delete"><i class="fas fa-trash"></i></button>
                  </div>
                </td>
              </tr>
              </tbody>
            </table>
            <div class="products-table-loader"><div class="products-loader"></div></div>
          </div>
        </section>

        <!-- context menu -->
        <teleport to="body">
          <div v-if="contextMenuVisible" class="context-menu" :style="{ left: contextMenuPosition.x+'px', top: contextMenuPosition.y+'px' }">
            <div class="context-menu-item" @click="handleContextMenuAction('edit')"><i class="fas fa-edit"></i> Редактировать</div>
            <div class="context-menu-item" @click="handleContextMenuAction('duplicate')"><i class="fas fa-copy"></i> Дублировать</div>
            <div class="context-menu-item" @click="handleContextMenuAction('open')"><i class="fas fa-external-link-alt"></i> Открыть</div>
            <div class="context-menu-item" @click="handleContextMenuAction('select')"><i class="fas fa-check-square"></i> Выбрать</div>
            <div class="context-menu-item context-menu-danger" @click="handleContextMenuAction('delete')"><i class="fas fa-trash"></i> Удалить</div>
          </div>
        </teleport>

        <!-- ═══════════════════ BLOCKS ═══════════════════ -->
        <section class="page-builder" style="margin-top:40px">
          <div class="page-builder-content">
            <div style="flex:1"><h2>Конструктор главной страницы</h2></div>
            <button class="btn btn-primary" @click="openAddBlockModal"><i class="fas fa-plus"></i><span> Добавить блок</span></button>
          </div>
          <div v-if="blockSuccess" class="alert alert-success" style="margin-top:15px"><i class="fas fa-check-circle"></i> {{ blockSuccess }}</div>
          <div v-if="blockError"   class="alert alert-error"   style="margin-top:15px"><i class="fas fa-exclamation-circle"></i> {{ blockError }}</div>
          <div class="page-blocks-container">
            <div class="blocks-list">
              <div v-for="block in pageBlocks" :key="block.id" class="block-item"
                   :class="{ inactive:!block.is_active, dragging:block.id===draggingBlockId, 'footer-block': isFooterBlock(block)||isInfoButtonsBlock(block) }"
                   :draggable="!isFooterBlock(block) && !isInfoButtonsBlock(block)"
                   @dragstart="startDrag(block,$event)" @dragend="endDrag"
                   @dragover.prevent @drop="dropBlock(block,$event)">
                <div class="block-header">
                  <div class="block-info">
                    <span class="block-type">{{ getBlockTypeName(block.type) }}</span>
                    <span class="block-title">{{ block.title || 'Без названия' }}</span>
                    <span class="block-order">#{{ block.sort_order }}</span>
                  </div>
                  <div class="block-actions">
                    <button @click="toggleBlockActive(block)" class="btn btn-sm" :class="block.is_active?'':'btn-block-hidden'">
                      <i :class="block.is_active?'fas fa-eye-slash':'fas fa-eye'"></i>
                    </button>
                    <button @click="editBlock(block)" class="btn btn-sm btn-edit"><i class="fas fa-edit"></i></button>
                    <button v-if="!isFooterBlock(block) && !isInfoButtonsBlock(block)" @click="deleteBlock(block.id)" class="btn btn-sm btn-delete"><i class="fas fa-trash"></i></button>
                    <div v-if="!isFooterBlock(block) && !isInfoButtonsBlock(block)" class="drag-handle"><i class="fas fa-grip-vertical"></i></div>
                  </div>
                </div>
                <div class="block-preview"><div class="preview-content" v-html="getBlockPreview(block)"></div></div>
              </div>
              <div v-if="!pageBlocks.length" class="empty-blocks">
                <i class="fas fa-puzzle-piece" style="font-size:48px;color:#666;margin-bottom:20px"></i>
                <p>Нет блоков</p>
              </div>
            </div>
          </div>
          <div style="margin-top:15px">
            <button class="btn btn-success" @click="saveBlocksOrder" :disabled="!hasUnsavedChanges">
              <i class="fas fa-save"></i> Сохранить порядок
            </button>
          </div>
        </section>

        <!-- ═══════════════════ PAGES ═══════════════════ -->
        <section v-if="!isMobileDevice()" class="pages-management" style="margin-top:40px">
          <div style="display:flex;align-items:center;gap:15px">
            <h2>Управление страницами</h2>
            <button class="btn btn-primary" @click="openAddPageModal"><i class="fas fa-plus"></i><span> Добавить страницу</span></button>
          </div>
          <div v-if="pageSuccess" class="alert alert-success" style="margin-top:15px">{{ pageSuccess }}</div>
          <div v-if="pageError"   class="alert alert-error"   style="margin-top:15px">{{ pageError }}</div>
          <div class="pages-table" style="margin-top:20px">
            <table>
              <thead>
              <tr>
                <th>ID</th><th>URL</th><th>Название</th><th>Статус</th><th>Создано</th><th>Обновлено</th><th>Действия</th>
              </tr>
              </thead>
              <tbody>
              <tr v-if="!pages.length">
                <td colspan="7" style="text-align:center;padding:40px;color:#888">
                  <i class="fas fa-file" style="font-size:48px;display:block;margin-bottom:15px"></i>Страниц нет
                </td>
              </tr>
              <tr v-for="page in pages" :key="page.id" :style="{ backgroundColor: page.is_main_page ? 'rgba(46,204,113,.1)' : '' }">
                <td>{{ page.id }}</td>
                <td><code style="background:rgba(255,255,255,.1);padding:4px 8px;border-radius:4px">{{ page.slug }}</code></td>
                <td>{{ page.title }}</td>
                <td><span :class="['status-badge', page.is_published?'published':'unpublished']">{{ page.is_published ? 'Опубликовано' : 'Черновик' }}</span></td>
                <td>{{ formatDate(page.created_at) }}</td>
                <td>{{ formatDate(page.updated_at) }}</td>
                <td>
                  <div class="actions-container">
                    <a :href="'../' + page.slug" target="_blank" class="btn btn-sm btn-secondary"><i class="fas fa-eye"></i></a>
                    <button @click="editPage(page)" class="btn btn-sm btn-edit"><i class="fas fa-edit"></i></button>
                    <button @click="deletePage(page.id)" class="btn btn-sm btn-delete"><i class="fas fa-trash"></i></button>
                  </div>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div><!-- /container -->
    </main>

    <!-- ═══════════════════ MODALS (teleported) ═══════════════════ -->

    <!-- Product modal -->
    <teleport to="body">
      <template v-if="showAddProduct || editingProduct">
        <div class="modal" data-modal-id="productModal" @click.stop="bringModalToFront('productModal')">
          <div class="modal-toolbar" @mousedown="startDragModal('productModal',$event)" style="cursor:move">
            <div class="control-btns">
              <button @click.stop="toggleMinimize('productModal')" class="action-btn"><i :class="isModalMinimized('productModal')?'fas fa-window-restore':'fas fa-minus'"></i></button>
              <button @click.stop="toggleMaximize('productModal')" class="action-btn"><i :class="isModalMaximized('productModal')?'fas fa-window-restore':'fas fa-window-maximize'"></i></button>
              <button @click="closeModal" class="action-btn"><i class="fas fa-times"></i></button>
            </div>
          </div>
          <div class="modal-header"><h3>{{ editingProduct ? 'Редактировать товар' : 'Добавить товар' }}</h3></div>
          <div class="modal-body">
            <form @submit.prevent="saveProduct">
              <div class="form-group"><label>Название *</label><input type="text" v-model="productForm.name" required></div>
              <div class="form-group">
                <label>Тип товара</label>
                <select v-model="productForm.product_type_id">
                  <option value="">— без типа —</option>
                  <option v-for="t in productTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Описание</label>
                <textarea v-model="productForm.description" rows="4"></textarea>
                <div class="ai-helper">
                  <button type="button" class="btn btn-secondary ai-generate-btn" @click="generateDescriptionWithAI" :disabled="aiGeneratingDescription || !productForm.name?.trim()">
                    <i :class="aiGeneratingDescription?'fas fa-circle-notch fa-spin':'fas fa-wand-magic-sparkles'"></i>
                    {{ aiGeneratingDescription ? 'Генерируем...' : 'ИИ-описание' }}
                  </button>
                  <small v-if="aiGenerationError" class="ai-helper-error">{{ aiGenerationError }}</small>
                </div>
              </div>
              <div class="form-group">
                <label>Особенности</label>
                <div class="peculiarities-editor">
                  <div class="peculiarities-list">
                    <div v-for="(p,i) in productForm.peculiarities" :key="i" class="peculiarity-item">
                      <input type="text" v-model="productForm.peculiarities[i]" class="peculiarity-input">
                      <button type="button" @click="removePeculiarity(i)" class="btn btn-sm btn-delete"><i class="fas fa-times"></i></button>
                    </div>
                  </div>
                  <div class="add-peculiarity">
                    <input type="text" v-model="newPeculiarity" @keyup.enter="addPeculiarity" placeholder="Добавить" class="peculiarity-input">
                    <button type="button" @click="addPeculiarity" class="btn btn-sm btn-primary"><i class="fas fa-plus"></i></button>
                  </div>
                </div>
              </div>
              <div class="form-group"><label>Материал *</label><input type="text" v-model="productForm.material" required></div>
              <div class="form-group"><label>Цена *</label><input type="text" v-model="productForm.price" required></div>
              <div class="form-group"><label>Цена со скидкой</label><input type="text" v-model="productForm.price_sale"></div>
              <div class="form-group select-group" :class="{ open: selectOpen }">
                <label>Категория *</label>
                <select v-model="productForm.category" @focus="onSelectFocus" @blur="onSelectBlur" @change="onSelectChange" @click="onSelectClick" @mousedown="onSelectMouseDown" required>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
              </div>
              <div class="form-group image-upload-group">
                <label>Основное изображение / видео</label>
                <div class="image-upload-container">
                  <div class="file-upload-area" :class="{ 'has-file':selectedFile, uploading:isUploading, 'upload-success':uploadSuccess, 'upload-error':uploadError }" @click="!isUploading && triggerFileUpload()">
                    <input ref="fileInput" type="file" @change="handleFileSelect" accept="image/*,video/*" style="display:none" :disabled="isUploading">
                    <div v-if="isUploading" class="upload-progress">
                      <div class="progress-bar"><div class="progress-fill" :style="{ width: uploadProgress+'%' }"></div></div>
                      <p>Загрузка... {{ uploadProgress }}%</p>
                      <button type="button" @click.stop="cancelUpload" class="cancel-upload-btn"><i class="fas fa-times"></i> Отмена</button>
                    </div>
                    <div v-else-if="uploadSuccess" class="upload-status success">
                      <i class="fas fa-check-circle"></i><p>Загружено!</p>
                      <button type="button" @click.stop="resetUploadStatus" class="status-close-btn"><i class="fas fa-times"></i></button>
                    </div>
                    <div v-else-if="uploadError" class="upload-status error">
                      <i class="fas fa-exclamation-circle"></i><p>{{ uploadErrorMessage }}</p>
                      <button type="button" @click.stop="resetUploadStatus" class="status-close-btn"><i class="fas fa-times"></i></button>
                    </div>
                    <div v-else-if="!selectedFile && !productForm.image" class="upload-placeholder">
                      <i class="fas fa-cloud-upload-alt"></i><p>Нажмите или перетащите</p>
                    </div>
                    <div v-else class="image-preview-container">
                      <img v-if="!isVideoPreview(getImageUrl())" :src="getImageUrl()" class="current-image">
                      <video v-else :src="getImageUrl()" controls class="current-image"></video>
                      <button type="button" @click.stop="removeImage" class="remove-image-btn"><i class="fas fa-times"></i></button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="form-group"><label>Описание изображения</label><input type="text" v-model="productForm.image_description"></div>
              <div class="form-group additional-images-group">
                <label>Дополнительные фото / видео</label>
                <div class="additional-images-container">
                  <div class="additional-images-list">
                    <div v-for="(img,i) in productForm.additionalImages" :key="i" class="additional-image-item">
                      <img :src="'../'+img" class="additional-image-preview">
                      <button type="button" @click="removeAdditionalImage(i)" class="remove-additional-image-btn"><i class="fas fa-times"></i></button>
                    </div>
                  </div>
                  <div v-if="productForm.additionalVideos?.length" class="additional-videos-list" style="margin-top:15px">
                    <div v-for="(vid,i) in productForm.additionalVideos" :key="'v'+i" class="additional-video-item">
                      <video :src="'../'+vid" controls class="additional-video-preview"></video>
                      <button type="button" @click="removeAdditionalVideo(i)" class="remove-additional-image-btn"><i class="fas fa-times"></i></button>
                    </div>
                  </div>
                  <div v-if="editingProduct" class="add-additional-images">
                    <input ref="additionalImagesInput" type="file" @change="handleAdditionalImagesSelect" accept="image/*,video/*" multiple style="display:none">
                    <button type="button" @click="triggerAdditionalImagesUpload" class="btn btn-secondary"><i class="fas fa-plus"></i> Добавить файлы</button>
                  </div>
                  <div v-else class="help-text" style="padding:15px;background:rgba(255,255,255,.05);border-radius:8px">
                    <i class="fas fa-info-circle"></i><p style="margin-top:5px">Сохраните товар, чтобы добавлять доп. медиа</p>
                  </div>
                </div>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary">{{ editingProduct ? 'Сохранить' : 'Добавить' }}</button>
                <button type="button" @click="closeModal" class="btn btn-secondary">Отмена</button>
              </div>
            </form>
          </div>
          <div class="modal-resize-handle nw" @mousedown="startResize($event,'productModal','nw')"></div>
          <div class="modal-resize-handle ne" @mousedown="startResize($event,'productModal','ne')"></div>
          <div class="modal-resize-handle sw" @mousedown="startResize($event,'productModal','sw')"></div>
          <div class="modal-resize-handle se" @mousedown="startResize($event,'productModal','se')"></div>
          <div class="modal-resize-handle n"  @mousedown="startResize($event,'productModal','n')"  @dblclick="handleResizeDoubleClick('productModal','n',$event)"></div>
          <div class="modal-resize-handle s"  @mousedown="startResize($event,'productModal','s')"  @dblclick="handleResizeDoubleClick('productModal','s',$event)"></div>
          <div class="modal-resize-handle e"  @mousedown="startResize($event,'productModal','e')"  @dblclick="handleResizeDoubleClick('productModal','e',$event)"></div>
          <div class="modal-resize-handle w"  @mousedown="startResize($event,'productModal','w')"  @dblclick="handleResizeDoubleClick('productModal','w',$event)"></div>
        </div>
      </template>
    </teleport>

    <!-- Block modal -->
    <teleport to="body">
      <template v-if="showAddBlockModal || editingBlock">
        <div class="modal block-modal" data-modal-id="blockModal" @click.stop="bringModalToFront('blockModal')">
          <div class="modal-toolbar" @mousedown="startDragModal('blockModal',$event)" style="cursor:move">
            <div class="control-btns">
              <button @click.stop="toggleMinimize('blockModal')" class="action-btn"><i :class="isModalMinimized('blockModal')?'fas fa-window-restore':'fas fa-minus'"></i></button>
              <button @click.stop="toggleMaximize('blockModal')" class="action-btn"><i :class="isModalMaximized('blockModal')?'fas fa-window-restore':'fas fa-window-maximize'"></i></button>
              <button @click="closeBlockModal" class="action-btn"><i class="fas fa-times"></i></button>
            </div>
          </div>
          <div class="modal-header"><h3>{{ editingBlock ? 'Редактировать блок' : 'Добавить блок' }}</h3></div>
          <div class="modal-body">
            <form @submit.prevent="saveBlock">
              <div class="form-group">
                <label>Тип блока</label>
                <select v-model="blockForm.type" @change="onBlockTypeChange" required>
                  <option value="">Выберите тип</option>
                  <option value="hero">Hero секция</option>
                  <option value="features">Преимущества</option>
                  <option value="products">Товары</option>
                  <option value="history">История</option>
                  <option value="stats">Статистика</option>
                  <option value="contact">Контакты</option>
                  <option value="text">Текстовый блок</option>
                  <option value="buttons">Кнопки</option>
                  <option value="actual">Акции</option>
                  <option value="info_buttons" disabled>Инфо-кнопки (авто)</option>
                  <option value="footer" disabled>Футер (авто)</option>
                </select>
              </div>
              <div class="form-group"><label>Название блока</label><input type="text" v-model="blockForm.title" placeholder="Для идентификации в админке"></div>
              <div v-if="blockForm.settings && 'sectionTitle' in blockForm.settings" class="form-group"><label>Заголовок секции</label><input type="text" v-model="blockForm.settings.sectionTitle"></div>

              <!-- hero -->
              <template v-if="blockForm.type==='hero'">
                <div class="form-group"><label>Основной заголовок</label><input type="text" v-model="blockForm.settings.mainTitle"></div>
                <div class="form-group"><label>Подзаголовок</label><textarea v-model="blockForm.settings.subtitle" rows="2"></textarea></div>
                <div class="form-group"><label>Описание</label><textarea v-model="blockForm.settings.description" rows="3"></textarea></div>
                <div class="form-group"><label>Текст кнопки 1</label><input type="text" v-model="blockForm.settings.buttonA"></div>
                <div class="form-group"><label>Текст кнопки 2</label><input type="text" v-model="blockForm.settings.buttonB"></div>
                <div class="form-group">
                  <label>Фоновое изображение</label>
                  <div class="image-upload-field">
                    <div v-if="blockForm.settings.backgroundImage" class="image-preview">
                      <img :src="blockForm.settings.backgroundImage" alt="bg">
                      <button type="button" @click="removeBackgroundImage" class="btn btn-sm btn-delete"><i class="fas fa-times"></i></button>
                    </div>
                    <input type="file" @change="handleBackgroundImageUpload" accept="image/*" ref="bgInput" style="display:none">
                    <button type="button" @click="$refs.bgInput.click()" class="btn btn-secondary"><i class="fas fa-upload"></i> {{ blockForm.settings.backgroundImage ? 'Изменить' : 'Загрузить' }}</button>
                  </div>
                </div>
                <div class="form-group"><label>Позиция фона</label><select v-model="blockForm.settings.backgroundPosition"><option value="center">По центру</option><option value="top">Сверху</option><option value="bottom">Снизу</option></select></div>
              </template>

              <!-- features -->
              <template v-if="blockForm.type==='features'">
                <div class="form-group">
                  <label>Преимущества</label>
                  <div v-for="(f,i) in blockForm.settings.features" :key="i" class="feature-item" style="background:rgba(255,255,255,.05);padding:12px;border-radius:8px;margin-bottom:10px">
                    <div style="display:flex;justify-content:space-between"><span>{{ i+1 }}</span><button type="button" @click="removeFeature(i)" class="btn btn-sm btn-delete"><i class="fas fa-times"></i></button></div>
                    <div class="form-group">
                      <label>Иконка</label>
                      <div style="display:flex;gap:8px;align-items:center">
                        <i :class="f.icon||'fas fa-question'" style="font-size:20px"></i>
                        <input type="text" v-model="f.icon" placeholder="fas fa-gem" style="flex:1">
                        <button type="button" @click="openIconPicker(f,'icon')" class="btn btn-sm btn-secondary"><i class="fas fa-search"></i></button>
                      </div>
                    </div>
                    <div class="form-group"><label>Заголовок</label><input type="text" v-model="f.title"></div>
                    <div class="form-group"><label>Описание</label><textarea v-model="f.description" rows="2"></textarea></div>
                  </div>
                  <button type="button" @click="addFeature" class="btn btn-secondary"><i class="fas fa-plus"></i> Добавить</button>
                </div>
              </template>

              <!-- history -->
              <template v-if="blockForm.type==='history'">
                <div class="form-group">
                  <label>События</label>
                  <div v-for="(ev,i) in blockForm.settings.events" :key="i" style="background:rgba(255,255,255,.05);padding:12px;border-radius:8px;margin-bottom:10px">
                    <div style="display:flex;justify-content:space-between"><span>{{ i+1 }}</span><button type="button" @click="removeHistoryEvent(i)" class="btn btn-sm btn-delete"><i class="fas fa-times"></i></button></div>
                    <div class="form-group"><label>Год</label><input type="text" v-model="ev.year"></div>
                    <div class="form-group"><label>Заголовок</label><input type="text" v-model="ev.title"></div>
                    <div class="form-group"><label>Описание</label><textarea v-model="ev.description" rows="2"></textarea></div>
                  </div>
                  <button type="button" @click="addHistoryEvent" class="btn btn-secondary"><i class="fas fa-plus"></i> Добавить</button>
                </div>
              </template>

              <!-- stats -->
              <template v-if="blockForm.type==='stats'">
                <div class="form-group">
                  <label>Статистика</label>
                  <div v-for="(s,i) in blockForm.settings.stats" :key="i" style="background:rgba(255,255,255,.05);padding:12px;border-radius:8px;margin-bottom:10px">
                    <div style="display:flex;justify-content:space-between"><span>{{ i+1 }}</span><button type="button" @click="removeStat(i)" class="btn btn-sm btn-delete"><i class="fas fa-times"></i></button></div>
                    <div class="form-group"><label>Число</label><input type="text" v-model="s.number"></div>
                    <div class="form-group"><label>Подпись</label><input type="text" v-model="s.label"></div>
                  </div>
                  <button type="button" @click="addStat" class="btn btn-secondary"><i class="fas fa-plus"></i> Добавить</button>
                </div>
              </template>

              <!-- text / footer -->
              <template v-if="blockForm.type==='text' || blockForm.type==='footer'">
                <div class="form-group"><label>Содержимое</label><textarea v-model="blockForm.content" rows="6"></textarea></div>
              </template>

              <!-- products -->
              <template v-if="blockForm.type==='products'">
                <div class="form-group"><label>Описание</label><textarea v-model="blockForm.content" rows="3"></textarea></div>
              </template>

              <!-- buttons / info_buttons -->
              <template v-if="blockForm.type==='buttons' || blockForm.type==='info_buttons'">
                <div class="form-group">
                  <label>Кнопки</label>
                  <div v-for="(btn,i) in blockForm.settings.buttons" :key="i" style="background:rgba(255,255,255,.05);padding:12px;border-radius:8px;margin-bottom:10px">
                    <div style="display:flex;justify-content:space-between"><span>{{ i+1 }}</span><button type="button" @click="removeButton(i)" class="btn btn-sm btn-delete"><i class="fas fa-times"></i></button></div>
                    <div class="form-group"><label>Текст</label><input type="text" v-model="btn.text"></div>
                    <div class="form-group"><label>Тип</label><select v-model="btn.linkType" @change="btn.link=''"><option value="page">Страница</option><option value="section">Секция</option><option value="url">URL</option></select></div>
                    <div v-if="btn.linkType==='page'" class="form-group"><label>Страница</label><select v-model="btn.link"><option value="">Выберите</option><option v-for="pg in pages" :key="pg.id" :value="pg.slug">{{ pg.title }}</option></select></div>
                    <div v-if="btn.linkType==='section'" class="form-group"><label>ID секции</label><input type="text" v-model="btn.link" placeholder="products, features..."></div>
                    <div v-if="btn.linkType==='url'" class="form-group"><label>URL</label><input type="url" v-model="btn.link"></div>
                    <div v-if="blockForm.type==='buttons'" class="form-group"><label>Стиль</label><select v-model="btn.style"><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="outline">Outline</option></select></div>
                  </div>
                  <button type="button" @click="addButton" class="btn btn-secondary"><i class="fas fa-plus"></i> Добавить кнопку</button>
                </div>
              </template>

              <!-- contact -->
              <template v-if="blockForm.type==='contact'">
                <div class="form-group"><label>Email</label><input type="email" v-model="blockForm.settings.email"></div>
                <div class="form-group"><label>Телефон</label><input type="tel" v-model="blockForm.settings.phone"></div>
                <div class="form-group"><label>Адрес</label><textarea v-model="blockForm.settings.address" rows="2"></textarea></div>
                <div v-if="blockForm.settings.socialLinks" class="form-group">
                  <label>Соцсети</label>
                  <div class="form-group"><label>Instagram</label><input type="url" v-model="blockForm.settings.socialLinks.instagram"></div>
                  <div class="form-group"><label>TikTok</label><input type="url" v-model="blockForm.settings.socialLinks.tiktok"></div>
                  <div class="form-group"><label>Telegram</label><input type="url" v-model="blockForm.settings.socialLinks.telegram"></div>
                </div>
              </template>

              <!-- actual -->
              <template v-if="blockForm.type==='actual'">
                <div class="form-group">
                  <label>Акции</label>
                  <div v-for="(promo,pi) in blockForm.settings.promotions" :key="pi" style="background:rgba(255,255,255,.05);padding:12px;border-radius:8px;margin-bottom:10px">
                    <div style="display:flex;justify-content:space-between"><span>{{ pi+1 }}</span><button type="button" @click="removePromotion(pi)" class="btn btn-sm btn-delete"><i class="fas fa-times"></i></button></div>
                    <div class="form-group">
                      <label>Изображение</label>
                      <div v-if="promo.image"><img :src="promo.image" style="max-height:80px;border-radius:4px"><button type="button" @click="removePromotionImage(pi)" class="btn btn-sm btn-delete" style="margin-left:8px"><i class="fas fa-times"></i></button></div>
                      <input type="file" :id="'promo-img-'+pi" @change="handlePromotionImageUpload($event,pi)" accept="image/*" style="display:none">
                      <label :for="'promo-img-'+pi" class="btn btn-secondary" style="cursor:pointer"><i class="fas fa-upload"></i> {{ promo.image?'Изменить':'Загрузить' }}</label>
                    </div>
                    <div class="form-group"><label>Заголовок</label><input type="text" v-model="promo.title"></div>
                    <div class="form-group"><label>Описание</label><textarea v-model="promo.description" rows="2"></textarea></div>
                    <div class="form-group">
                      <label>Товары</label>
                      <div v-for="(link,li) in (promo.links||[])" :key="li" style="background:rgba(255,255,255,.05);padding:8px;border-radius:6px;margin-bottom:8px">
                        <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span>Товар {{ li+1 }}</span><button type="button" @click="removeLink(pi,li)" class="btn btn-sm btn-delete"><i class="fas fa-times"></i></button></div>
                        <select :value="getPromoLinkProductId(link)" @change="onPromoLinkProductChange($event,pi,li)" style="width:100%;margin-bottom:6px">
                          <option value="">Выберите товар</option>
                          <option v-for="p in Object.values(getProductsObject())" :key="p.id" :value="p.id">{{ p.name }}</option>
                        </select>
                        <input type="text" v-model="promo.links[li].title" placeholder="Заголовок ссылки" style="width:100%;margin-bottom:4px">
                        <input type="text" v-model="promo.links[li].description" placeholder="Описание" style="width:100%">
                      </div>
                      <button type="button" @click="addLink(pi)" class="btn btn-secondary btn-sm"><i class="fas fa-plus"></i> Добавить товар</button>
                    </div>
                  </div>
                  <button type="button" @click="addPromotion" class="btn btn-secondary"><i class="fas fa-plus"></i> Добавить акцию</button>
                </div>
              </template>

<style scoped>

</style>