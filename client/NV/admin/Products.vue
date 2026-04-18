<script>
import { formatDate, isMobileDevice } from './service'
import Modal from "../components/Modal.vue";
import {api} from "../../../server/api";

export default {
  name: 'Products',
  components: {Modal},
  emits: ['update:page'],
  data() {
    return {
      users: [],
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
    }
  },
  computed: {
    truncatedProducts() {
      return this.products.map(p => ({
        ...p,
        truncatedDescription: this.truncateText(p.description, 80),
      }));
    },
  },
  mounted() {
    this.loadData();
    this.loadColumnSettings();
    document.addEventListener('click', this.onDocClick);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.onDocClick);
  },
  methods: {
    async loadData() {
      await Promise.all([
        this.getProducts(),
        this.getCategories(),
        this.getTypes(),
        this.getUsers(),
      ]);
    },
    async getUsers() {
      try {
        const r = await api.getUsers();
        if (r.ok) this.users = await r.json();
      } catch {
        this.users = [];
      }
    },
    onDocClick(e) {
      if (this.showColumnSelector && !e.target.closest('.column-selector-dropdown')) {
        this.showColumnSelector = false;
      }
    },
    isMobileDevice,
    formatDate,
    truncateText(text, charsPerLine = 30, maxLines = 4) {
      if (!text?.trim()) return '';

      const clean = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
      const lines = [];
      let i = 0;

      while (i < clean.length && lines.length < maxLines) {
        const rem = clean.substring(i);

        if (rem.length <= charsPerLine) {
          lines.push(rem);
          break;
        }

        let b = charsPerLine;

        for (let j = charsPerLine; j >= 0; j--) {
          if (rem[j] === ' ') {
            b = j;
            break;
          }
        }

        lines.push(rem.substring(0, b).trim());
        i += b + 1;

        if (lines.length === maxLines && i < clean.length) {
          lines[maxLines - 1] = lines[maxLines - 1].substring(0, charsPerLine - 3) + '...';
        }
      }

      return lines.join('\n');
    },
    isVideo(url) {
      return typeof url === 'string' && /\.(mp4|webm|ogg|mov)/i.test(url);
    },
    isVideoPreview(url) {
      return this.isVideo(url);
    },
    getCategoryName(id) {
      return this.categories.find(c => c.id === id)?.name || 'Неизвестно';
    },
    getUserName(id) {
      if (!id) return '-';
      return this.users.find(u => u.id === id)?.username || `ID: ${id}`;
    },
    async getProducts() {
      try {
        const r = await api.getProducts();

        if (r.ok) {
          this.products = await r.json();
          await this.$nextTick(() => this.initColumnResize());
        }

      } catch (e) {
        console.error(e);
      }
    },
    async deleteProduct(productId, multiple = false) {
      const doDelete = async (id) => {
        const r = await api.deleteProduct(id);
        if (r.ok) this.products = this.products.filter(p => p.id !== id);
        else alert('Ошибка при удалении товара');
      };
      if (multiple) await doDelete(productId);
      else if (confirm('Вы уверены?')) await doDelete(productId);
    },
    async deleteSelectedProducts() {
      if (!this.selectedProducts.length) return
      if (!confirm(`Удалить ${this.selectedProducts.length} товар(ов)?`)) return
      for (const id of [...this.selectedProducts]) await this.deleteProduct(id, true)
      this.selectedProducts = []
    },
    async hideProduct(id) {
      const product = this.products.find(p => p.id === id);
      if (!product) return;
      const nv = product.visibility === 0 ? 1 : 0;
      const r = await api.changeVisibility(id, nv);
      if (r.ok) {
        const d = await r.json();
        if (d.success) product.visibility = nv;
      }
    },
    openProductPage(id) {
      window.location.href = window.location.origin + '/product/?id=' + id
    },
    startDragProduct(product, event) {
      this.draggingProductId = product.id
      event.dataTransfer.effectAllowed = 'move'
      this._pdDragOver = (e) => this._onProductDragOver(e)
      this._pdDragEnd = () => this._cleanupProductDrag()
      document.addEventListener('dragover', this._pdDragOver)
      document.addEventListener('dragend', this._pdDragEnd)
    },
    endDragProduct() {
      this._cleanupProductDrag()
    },
    _cleanupProductDrag() {
      this.draggingProductId = null
      document.removeEventListener('dragover', this._pdDragOver)
      document.removeEventListener('dragend', this._pdDragEnd)
      if (this.productDragScrollInterval) {
        clearInterval(this.productDragScrollInterval)
        this.productDragScrollInterval = null
      }
    },
    _onProductDragOver(e) {
      if (!this.draggingProductId) return
      const th = 100; const sp = 10; const wh = window.innerHeight; const sy = window.scrollY; const my = e.clientY
      if (my < th && sy > 0) this._startProdScroll('up', sp)
      else if (my > wh - th && sy < document.documentElement.scrollHeight - wh) this._startProdScroll('down', sp)
      else this._stopProdScroll()
    },
    _startProdScroll(dir, speed) {
      if (this.productDragScrollInterval) this._stopProdScroll();
      this.productDragScrollInterval = setInterval(() => window.scrollBy(0, dir === 'up' ? -speed : speed), 16);
    },
    _stopProdScroll() {
      if (this.productDragScrollInterval) {
        clearInterval(this.productDragScrollInterval);
        this.productDragScrollInterval = null;
      }
    },
    dropProduct(target, e) {
      e.preventDefault();

      if (this.draggingProductId === target.id) {
        this._cleanupProductDrag();
        return;
      }
      const di = this.products.findIndex(p => p.id === this.draggingProductId);
      const ti = this.products.findIndex(p => p.id === target.id);

      if (di === -1 || ti === -1) {
        this._cleanupProductDrag();
        return;
      }

      const [dragged] = this.products.splice(di, 1);
      this.products.splice(ti, 0, dragged);
      this.saveProductsOrder();
    },
    async saveProductsOrder() {
      await api.saveProductsOrder(this.products.map(p => p.id));
    },
    async getTypes() {
      try {
        const r = await api.getProductTypes();

        if (r.ok) {
          const d = await r.json();
          this.productTypes = Array.isArray(d.types) ? d.types.map(t => ({ id: t.id, name: t.name })) : [];
        }
      } catch(e) {
        console.error(e);
      }
    },
    async getCategories() {
      try {
        const r = await api.getCategories();

        if (r.ok) {
          const d = await r.json();
          this.categories = d.map(c => ({ id: c.slug, name: c.name, _id: c.id, sort_order: c.sort_order || 0, slug: c.slug }));
        }
      } catch(e) {
        console.error(e);
      }
    },
    startAddCategory() {
      this.editingCategory = null;
      this.categoryForm = { id: null, name: '', slug: '', sort_order: 0 };
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
        const body = { name: this.categoryForm.name, slug: this.categoryForm.slug || '', sort_order: this.categoryForm.sort_order || 0 };
        const r = this.categoryForm.id
            ? await api.updateCategory(this.categoryForm.id, body)
            : await api.addCategory(body);
        const res = await r.json();

        if (!r.ok || res.error) {
          console.error(res.error || 'Ошибка');
        }

        this.categorySuccess = 'Сохранено';
        await this.getCategories();
        this.startAddCategory();
      } catch (e) {
        this.categoryError = e.message;
      }

      this.categoryLoading = false;
    },
    async deleteCategory(cat) {
      if (!confirm('Удалить категорию?')) return;
      await api.deleteCategory(cat._id);
      await this.getCategories();
    },
    startDragCategory(cat, e) {
      this.draggingCategoryId = cat._id;
      e.dataTransfer.effectAllowed = 'move';
    },
    endDragCategory() {
      this.draggingCategoryId = null;
    },
    dropCategory(target, e) {
      e.preventDefault();
      if (this.draggingCategoryId === target._id) return;
      const di = this.categories.findIndex(c => c._id === this.draggingCategoryId);
      const ti = this.categories.findIndex(c => c._id === target._id);
      if (di === -1 || ti === -1) return;
      const [d] = this.categories.splice(di, 1);
      this.categories.splice(ti, 0, d);
      this.saveCategoriesOrder();
    },
    async saveCategoriesOrder() {
      await api.saveCategoriesOrder(this.categories.map(c => c._id));
    },
    moveCategory(cat, dir) {
      const i = this.categories.findIndex(c => c._id === cat._id);
      if (i === -1) return;
      const ni = dir === 'up' ? i - 1 : i + 1;
      if (ni < 0 || ni >= this.categories.length) return;
      const [item] = this.categories.splice(i, 1);
      this.categories.splice(ni, 0, item);
    },
    manageCategoryEdit() {
      this.categoryEdit = !this.categoryEdit;
    },
    openAddProductModal() {
      if (!this.isMobileDevice()) {
        this.showAddProduct = true;
      } else {
        this.$emit('update:page', 'product');
      }
    },
    editProduct(product) {
      this.editingProduct = product;
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
        this.showAddProduct = true;
      } else {
        this.$emit('update:page', 'product');
        window.scrollTo(0, 0);
      }
    },
    closeModal() {
      if (!this.isMobileDevice()) {
        this.showAddProduct = false;
      } else {
        this.$emit('update:page', '');
        window.scrollTo(0, 0);
      }

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
        product_type_id: null,
        image: '',
        image_description: '',
        additionalImages: [],
        additionalVideos: []
      }

      this.aiGeneratingDescription = false;
      this.aiGenerationError = '';
      this.newPeculiarity = '';
    },
    async saveProduct() {
      try {
        const body = {
          name: this.productForm.name || '',
          description: this.productForm.description || '',
          material: this.productForm.material || '',
          price: this.productForm.price || '',
          price_sale: this.productForm.price_sale || '',
          category: this.productForm.category || '',
          image: this.productForm.image || '',
          image_description: this.productForm.image_description || '',
          product_type_id: this.productForm.product_type_id || '',
          peculiarities: this.productForm.peculiarities,
        };

        const r = this.editingProduct
            ? await api.updateProduct(this.editingProduct.id, body)
            : await api.addProduct(body);

        if (!r.ok) { alert('Ошибка при сохранении товара'); return; }
        const result = await r.json();

        if (this.editingProduct) {
          const idx = this.products.findIndex(p => p.id === this.editingProduct.id)
          if (idx !== -1) Object.assign(this.products[idx], {
            ...this.productForm, price: +this.productForm.price,
            price_sale: +this.productForm.price_sale,
            image: result?.image || this.products[idx].image,
          })
        } else {
          this.products.push({
            id: result.id, ...this.productForm,
            price: +this.productForm.price, price_sale: +this.productForm.price_sale,
            image: result?.image || ''
          })
        }
        this.closeModal()
      } catch (e) {
        console.error(e);
        alert('Ошибка при сохранении');
      }
    },
    addPeculiarity() {
      if (this.newPeculiarity.trim()) {
        this.productForm.peculiarities.push(this.newPeculiarity.trim());
        this.newPeculiarity = '';
      }
    },
    removePeculiarity(i) {
      this.productForm.peculiarities.splice(i, 1);
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
    toggleProductSelection(id) {
      const i = this.selectedProducts.indexOf(id);
      i > -1 ? this.selectedProducts.splice(i, 1) : this.selectedProducts.push(id);
    },
    isProductSelected(id) {
      return this.selectedProducts.includes(id);
    },
    toggleSelectAll(e) {
      this.selectedProducts = e.target.checked ? this.products.map(p => p.id) : [];
    },
    clearSelection() {
      this.selectedProducts = [];
    },
    isColumnVisible(col) {
      return this.productTableColumns[col] !== false;
    },
    toggleColumn(col) {
      this.productTableColumns[col] = !this.productTableColumns[col];
      this.saveColumnSettings();
    },
    getVisibleColumnsCount() {
      return Object.values(this.productTableColumns).filter(v => v).length + 2;
    },
    getColumnLabel(col) {
      return {
        id: 'ID', image: 'Изображение', name: 'Название', description: 'Описание',
        peculiarities: 'Особенности', material: 'Материал', price: 'Цена', price_sale: 'Цена со скидкой',
        category: 'Категория', user: 'Создал', created: 'Дата', updated_by: 'Обновил', updated_at: 'Обновлено'
      }[col] || col;
    },
    saveColumnSettings() {
      localStorage.setItem('productTableColumns', JSON.stringify(this.productTableColumns));
    },
    loadColumnSettings() {
      try {
        const s = localStorage.getItem('productTableColumns');
        if (s) Object.assign(this.productTableColumns, JSON.parse(s));
      } catch (e) {
        console.error(e);
      }
    },
    toggleColumnSelector() {
      this.showColumnSelector = !this.showColumnSelector;
    },
    toggleProductsActionsSidebar() {
      this.showProductsActionsSidebar = !this.showProductsActionsSidebar;
    },
    closeProductsActionsSidebar() {
      this.showProductsActionsSidebar = false;
    },
    initColumnResize() {
      this.$nextTick(() => {
        const table = document.querySelector('.products-table table');
        if (!table) return;
        this.loadColumnWidths();

        table.querySelectorAll('.column-resize-handle').forEach(h => {
          const nh = h.cloneNode(true);
          h.parentNode.replaceChild(nh, h);
          this.setupColumnResize(nh);
        });
      });
    },
    setupColumnResize(handle) {
      let isR = false, sx = 0, sw = 0, col = null
      handle.addEventListener('mousedown', (e) => {
        if (window.innerWidth <= 768 || e.detail > 1) return
        e.preventDefault();
        e.stopPropagation()
        isR = true;
        sx = e.clientX;
        col = handle.parentElement;
        sw = col.offsetWidth;

        const move = (e) => {
          if (!isR) return;
          const nw = Math.max(50, sw + (e.clientX - sx));
          col.style.width = col.style.minWidth = nw + 'px';
          const tbl = col.closest('table'), hr = tbl?.querySelector('thead tr');

          if (hr) {
            const ci = Array.from(hr.children).indexOf(col);

            tbl.querySelectorAll('tbody tr').forEach(row => {
              const c = row.querySelectorAll('td')[ci];
              if (c) c.style.width = c.style.minWidth = nw + 'px';
            });
          }

          this.saveColumnWidth(col.dataset.column, nw);
        }
        const up = () => {
          isR = false;
          document.removeEventListener('mousemove', move);
          document.removeEventListener('mouseup', up);
        }
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
      })
    },
    saveColumnWidth(name, w) {
      const s = JSON.parse(localStorage.getItem('admin_column_widths') || '{}');
      s[name] = w;
      localStorage.setItem('admin_column_widths', JSON.stringify(s));
    },
    loadColumnWidths() {
      const s = JSON.parse(localStorage.getItem('admin_column_widths') || '{}');
      const table = document.querySelector('.products-table table');
      if (!table) return;

      Object.keys(s).forEach(name => {
        const col = table.querySelector('th[values-column=[' + name + ']');
        if (!col) return;
        const w = s[name] + 'px';
        col.style.width = col.style.minWidth = w;
        const hr = table.querySelector('thead tr');
        if (!hr) return;
        const ci = Array.from(hr.children).indexOf(col);

        table.querySelectorAll('tbody tr').forEach(row => {
          const c = row.querySelectorAll('td')[ci];
          if (c) c.style.width = c.style.minWidth = w;
        });
      });
    },
    showContextMenu(e, product) {
      if (!product) return;
      e.preventDefault();
      e.stopPropagation();
      this.contextMenuProduct = product;
      let x = e.clientX, y = e.clientY;
      if (x + 200 > window.innerWidth) x = window.innerWidth - 210;
      if (y + 200 > window.innerHeight) y = window.innerHeight - 210;
      this.contextMenuPosition = {x, y};
      this.contextMenuVisible = true;
      const hide = (ev) => {
        if (!ev.target.closest('.context-menu')) this.hideContextMenu();
      }

      const esc = (ev) => {
        if (ev.key === 'Escape') this.hideContextMenu();
      }

      setTimeout(() => {
        document.addEventListener('click', hide);
        document.addEventListener('keydown', esc);
        this.contextMenuHideHandler = hide;
        this.contextMenuEscapeHandler = esc;
      }, 0)
    },
    hideContextMenu() {
      this.contextMenuVisible = false;
      this.contextMenuProduct = null;
      document.removeEventListener('click', this.contextMenuHideHandler);
      document.removeEventListener('keydown', this.contextMenuEscapeHandler);
    },
    handleContextMenuAction(action) {
      const p = this.contextMenuProduct;
      if (!p) return;
      if (action === 'edit') this.editProduct(p);
      if (action === 'delete') this.deleteProduct(p.id);
      if (action === 'open') this.openProductPage(p.id);
      if (action === 'duplicate') this.duplicateProduct(p);
      if (action === 'select') this.toggleProductSelection(p.id);
      this.hideContextMenu();
    },
    duplicateProduct(p) {
      this.editProduct({ ...p, id: null, name: p.name + ' (копия)' });
    },
    triggerFileUpload() {
      this.$refs.fileInput?.click();
    },
    triggerAdditionalImagesUpload() {
      this.$refs.additionalImagesInput?.click();
    },
    async handleFileSelect(e) {
      const file = e.target.files[0];
      if (!file) return;
      const isVid = file.type.startsWith('video/');

      if (file.size > (isVid ? 256 : 64) * 1024 * 1024) {
        alert('Файл слишком большой');
        e.target.value = '';
        return;
      }

      this.selectedFile = file;
      const obj = URL.createObjectURL(file);
      this.productForm.image = obj;
      this.isUploading = true;
      this.uploadProgress = 0;
      this.uploadSuccess = false;
      this.uploadError = false;
      this.uploadErrorMessage = '';

      try {
        await this.uploadMainFile(file);
        URL.revokeObjectURL(obj);
        this.uploadSuccess = true;
        this.isUploading = false;
        setTimeout(() => { this.uploadSuccess = false }, 2000);
      } catch (err) {
        URL.revokeObjectURL(obj);
        this.uploadError = true;
        this.uploadErrorMessage = err.message;
        this.isUploading = false;
      }
    },
    uploadMainFile(file) {
      return new Promise((resolve, reject) => {
        const fd = new FormData();
        fd.append('file', file);
        const xhr = new XMLHttpRequest();
        this.uploadXhr = xhr;
        xhr.open('POST', '/api/upload-media', true);
        xhr.withCredentials = true;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) this.uploadProgress = Math.round((e.loaded / e.total) * 100)
        }

        xhr.onload = () => {
          this.uploadXhr = null;

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);

              if (res.success) {
                if (res.url) this.productForm.image = res.url;
                this.selectedFile = null;
                resolve(res);
              } else {
                reject(new Error(res.error));
              }
            } catch {
              reject(new Error('Parse error'));
            }
          } else reject(new Error(`HTTP ${xhr.status}`));
        }

        xhr.onerror = () => {
          this.uploadXhr = null;
          reject(new Error('Network error'));
        }

        xhr.timeout = 300000;
        xhr.send(fd);
      })
    },
    cancelUpload() {
      this.uploadXhr?.abort();
      this.isUploading = false;
      this.uploadProgress = 0;
    },
    resetUploadStatus() {
      this.uploadSuccess = false;
      this.uploadError = false;
      this.uploadErrorMessage = '';
    },
    getImageUrl() {
      return this.selectedFile ? this.productForm.image : (this.productForm.image ? '../' + this.productForm.image : '');
    },
    removeImage() {
      this.selectedFile = null;
      this.productForm.image = '';
    },
    async handleAdditionalImagesSelect(e) {
      const files = Array.from(e.target.files);
      if (!files.length) return;

      for (const f of files) {
        const isVid = f.type.startsWith('video/');

        if (f.size > (isVid ? 256 : 64) * 1024 * 1024) {
          alert(`Файл "${f.name}" слишком большой`);
          e.target.value = '';
          return;
        }
      }

      const fd = new FormData();
      fd.append('product_id', this.editingProduct.id);
      files.forEach(f => fd.append('additional_images[]', f));
      const r = await api.addProductImages(fd);
      if (r.ok) {
        const res = await r.json();
        if (res.success) {
          if (res.uploaded_images) this.productForm.additionalImages.push(...res.uploaded_images);
          if (res.uploaded_videos) this.productForm.additionalVideos.push(...res.uploaded_videos);
        }
      }
      if (this.$refs.additionalImagesInput) this.$refs.additionalImagesInput.value = '';
    },
    async removeAdditionalImage(idx) {
      if (!confirm('Удалить изображение?')) return;
      const path = this.productForm.additionalImages[idx];
      const r = await api.deleteProductImage({ product_id: this.editingProduct.id, image_path: path });
      if (r.ok) this.productForm.additionalImages.splice(idx, 1);
    },
    async removeAdditionalVideo(idx) {
      if (!confirm('Удалить видео?')) return;

      /*const path = this.productForm.additionalVideos[idx]
      const r1 = await fetch(`../api.php?action=get_image_id&product_id=${this.editingProduct.id}&image_path=${encodeURIComponent(path)}`, { credentials: 'same-origin' })

      if (r1.ok) {
        const d1 = await r1.json()
        if (d1.image_id) {
          const fd = new FormData()
          fd.append('action', 'delete_product_image')
          fd.append('image_id', d1.image_id)
          const r2 = await fetch('../api.php', { method: 'POST', body: fd, credentials: 'same-origin' })
          if (r2.ok) this.productForm.additionalVideos.splice(idx, 1)
        }
      }*/
    },
    async generateDescription() {
      if (this.aiGeneratingDescription || !this.productForm.name?.trim()) return;
      this.aiGeneratingDescription = true;

      try {
        const r = await api.generateDescription(this.productForm.name.trim());
        const d = await r.json();

        if (!r.ok || !d.description) {
          console.error(d.error || 'Ошибка генерации');
        }
        this.productForm.description = d.description.trim();
      } catch (e) {
        this.aiGenerationError = e.message;
      } finally {
        this.aiGeneratingDescription = false;
      }
    }
  },
}
</script>

<template>
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
        <button class="btn btn-secondary" @click="getProducts" title="Обновить">
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
          <button class="btn btn-secondary btn-block" @click="getProducts(); closeProductsActionsSidebar()"><i class="fas fa-sync"></i> Обновить</button>
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
  <Modal
      v-model="showAddProduct"
      modal-id="productModal"
      :title="editingProduct ? 'Редактировать товар' : 'Добавить товар'"
      default-width="720px"
      default-height="680px"
      class="product-modal"
      @close="closeModal"
  >
    <span class="modal-title-icon"><i class="fas fa-box"></i></span>
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
          <button type="button" class="btn btn-secondary ai-generate-btn" @click="generateDescription" :disabled="aiGeneratingDescription || !productForm.name?.trim()">
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
            <div v-for="(i) in productForm.peculiarities" :key="i" class="peculiarity-item">
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
              <img v-if="!isVideoPreview(getImageUrl())" :src="getImageUrl()" class="current-image" alt="">
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
              <img :src="'../'+img" class="additional-image-preview" alt="">
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
  </Modal>
  <teleport to="body">
    <div v-if="contextMenuVisible" class="context-menu" :style="{ left: contextMenuPosition.x+'px', top: contextMenuPosition.y+'px' }">
      <div class="context-menu-item" @click="handleContextMenuAction('edit')"><i class="fas fa-edit"></i> Редактировать</div>
      <div class="context-menu-item" @click="handleContextMenuAction('duplicate')"><i class="fas fa-copy"></i> Дублировать</div>
      <div class="context-menu-item" @click="handleContextMenuAction('open')"><i class="fas fa-external-link-alt"></i> Открыть</div>
      <div class="context-menu-item" @click="handleContextMenuAction('select')"><i class="fas fa-check-square"></i> Выбрать</div>
      <div class="context-menu-item context-menu-danger" @click="handleContextMenuAction('delete')"><i class="fas fa-trash"></i> Удалить</div>
    </div>
  </teleport>
</template>

<style scoped>
.products-management h2 {
  color: var(--primary);
  font-size: 22px;
}
.products-management-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 15px;
  margin-bottom: 1vw;
  position: relative;
}
.products-management-controls {
  display: flex;
  background: var(--background);
  border: 1px solid var(--border-light);
  border-radius: 15px;
  padding: 8px;
  margin-bottom: 4px;
}
.products-actions-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: auto;
  position: relative;
}
.products-actions-menu-btn {
  display: none;
}
.products-table {
  background: var(--background-secondary);
  backdrop-filter: blur(10px);
  -webkit-border-radius: 15px;
  border-radius: 15px;
  border: 1px solid var(--border-light);
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
}
.products-table table {
  width: 100%;
  min-width: 800px;
  border-collapse: collapse;
  table-layout: auto;
}
.products-table th,
.products-table td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid var(--border-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.products-table th {
  color: var(--primary);
  font-weight: 600;
}
.products-table td {
  color: var(--text-primary);
}
.products-table th:last-child,
.products-table td:last-child {
  display: table-cell;
  position: sticky;
  right: 0;
  background: var(--background-additional);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 10;
  border-left: 2px solid var(--border-strong);
  min-width: 120px;
  width: 120px;
  vertical-align: middle;
  text-align: center;
  box-shadow: -2px 0 5px var(--shadow-primary);
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}
.products-table th {
  position: relative;
  user-select: none;
}
.products-table th:not(:last-child) {
  border-right: 2px solid transparent;
  transition: border-color 0.3s ease;
}
.products-table th:not(:last-child):hover {
  border-right-color: var(--border-strong);
}
.column-resize-handle {
  position: absolute;
  top: 0;
  right: -2px;
  width: 4px;
  height: 100%;
  background: transparent;
  cursor: col-resize;
  z-index: 20;
  transition: background-color 0.3s ease;
}
.column-resize-handle:hover {
  background: var(--background-secondary);
}
.column-resize-handle.active {
  background: var(--primary);
  box-shadow: 0 0 10px var(--shadow-primary);
}
.column-resize-handle::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 20px;
  background: var(--background-secondary);
  border-radius: 1px;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.column-resize-handle:hover::before {
  opacity: 1;
}
.column-resize-handle.active::before {
  background: var(--background-additional);
  opacity: 1;
}
.actions-container {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-width: 100%;
  min-height: 120px;
  height: 100%;
  padding: 10px;
}
.product-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
  cursor: pointer;
}
.product-thumb:hover {
  transform: scale(1.1);
  border-color: var(--border-strong);
  box-shadow: 0 4px 12px var(--shadow-primary);
}
.product-thumb[is="video"] {
  pointer-events: auto;
}
.current-image-preview {
  margin-top: 15px;
  padding: 15px;
  background: var(--background-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-light);
}
.current-image-preview label {
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
  color: var(--text-primary);
}
.current-image {
  max-width: 100%;
  max-height: 150px;
  object-fit: contain;
  border-radius: 8px;
  border: 2px solid var(--border-medium);
  box-shadow: 0 4px 12px var(--shadow-primary);
}
.image-upload-group {
  margin-bottom: 20px;
}
.image-upload-container {
  width: 100%;
}
.file-upload-area {
  border: 2px dashed var(--border-strong);
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
  background: var(--background-secondary);
  position: relative;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.file-upload-area:hover {
  border-color: var(--border-light);
  background: var(--background-secondary);
}
.file-upload-area.has-file {
  border-color: var(--border-medium);
  background: var(--background-additional);
}
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: var(--text-additional);
}
.upload-placeholder i {
  font-size: 48px;
  color: var(--text-additional-light);
}
.upload-placeholder p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}
.upload-placeholder span {
  font-size: 14px;
  color: var(--text-additional-light);
}
.remove-image-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  background: var(--error-bg);
  color: var(--text-primary);
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
  z-index: 10;
}
.remove-image-btn:hover {
  background: var(--error-bg);
  transform: scale(1.1);
}
.image-info {
  margin-top: 10px;
  text-align: center;
}
.image-info small {
  color: var(--text-additional);
  font-size: 12px;
}
.products-table tbody tr.selected {
  background-color: var(--table-element);
}
.products-table tbody tr.selected:hover {
  background-color: var(--table-element-hover);
}
.products-table tbody tr td:first-child input[type="checkbox"],
.products-table thead tr th:first-child input[type="checkbox"] {
  cursor: pointer;
}
.selected-products-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid var(--primary);
  border-radius: 6px;
  margin-bottom: 16px;
}
.selected-products-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--primary);
  font-size: 14px;
}
.selected-products-info i {
  font-size: 18px;
}
.selected-products-actions {
  display: flex;
  gap: 8px;
}
.products-table tbody tr[draggable="true"] {
  transition: all 0.2s ease;
}
.products-table tbody tr[draggable="true"]:hover {
  background: rgba(255, 237, 179, 0.05);
}
.products-table tbody tr.dragging {
  opacity: 0.5;
  background: var(--hover-secondary);
}
.products-table tbody tr[draggable="true"]:active {
  cursor: grabbing;
}
/* Column selector dropdown */
.products-actions-toolbar {
  position: relative;
}
.column-selector-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--background);
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  width: 240px;
  max-width: calc(100vw - 40px);
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  flex-shrink: 0;
}
.column-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-medium);
  background: var(--header-main);
}
.column-selector-header strong {
  font-size: 14px;
  font-weight: 600;
}
.column-selector-header {
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}
.column-selector-header .close-btn:hover {
  background: var(--hover-primary);
}
.column-selector-list {
  padding: 8px 0;
}
.column-selector-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.2s;
  user-select: none;
}
.column-selector-item:hover {
  background: var(--hover-primary);
}
.column-selector-item input[type="checkbox"] {
  margin-right: 10px;
  cursor: pointer;
}
.column-selector-item span {
  font-size: 14px;
  color: var(--text-primary);
}
/* HTML: <div class="loader"></div> */
.categories-loader {
  display: none;
  position: absolute;
  top: 0;
  place-content: center;
  width: stretch;
  height: stretch;
  background: var(--background);
  border-radius: 12px;
}
.products-table-loader {
  display: none;
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  place-content: center;
  background: var(--background);
  z-index: 100;
}
.products-table-loader .products-loader,
.categories-loader .products-loader {
  width: 50px;
  padding: 8px;
  margin: auto;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #25b09b;
  --_m:
      conic-gradient(#0000 10%,#000),
      linear-gradient(#000 0 0) content-box;
  -webkit-mask: var(--_m);
  mask: var(--_m);
  -webkit-mask-composite: source-out;
  mask-composite: subtract;
  animation: products-table-l3 1s infinite linear;
}
@keyframes products-table-l3 {
  to{
    transform: rotate(1turn)
  }
}
/* Mobile products actions sidebar */
.products-actions-sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 999;
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}
.products-actions-sidebar-overlay.active {
  opacity: 1;
  pointer-events: auto;
}
.products-actions-sidebar {
  display: none;
  position: fixed;
  top: 0;
  right: 0;
  width: 280px;
  max-width: 85vw;
  height: 100vh;
  background: var(--background);
  border-left: 1px solid var(--border-medium);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  transform: translateX(100%);
  transition: transform 0.25s ease;
  overflow-y: auto;
}
.products-actions-sidebar.open {
  transform: translateX(0);
}
.products-actions-sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-medium);
  background: var(--header-main);
}
.products-actions-sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--primary);
}
.products-actions-sidebar-close {
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 20px;
  transition: background 0.2s;
}
.products-actions-sidebar-close:hover {
  background: var(--hover-primary);
}
.products-actions-sidebar-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.products-actions-sidebar-body .btn-block {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 8px;
}
.products-actions-sidebar-section {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--border-medium);
}
.products-actions-sidebar-section strong {
  display: block;
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--text-primary);
}
.column-selector-list-sidebar .column-selector-item {
  padding: 10px 0;
}
@media (max-width: 768px) {
  .products-actions-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    margin-left: auto;
    background: var(--background-secondary);
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    color: var(--primary);
    cursor: pointer;
    font-size: 18px;
    transition: background 0.2s, border-color 0.2s;
  }
  .products-actions-menu-btn:hover {
    background: var(--background-secondary);
    border-color: var(--border-strong);
  }
  .products-actions-toolbar {
    display: none;
  }
  .products-actions-sidebar-overlay,
  .products-actions-sidebar {
    display: block;
  }
  .products-table {
    overflow-x: auto;
    font-size: 14px;
  }
  .products-table th,
  .products-table td {
    padding: 10px 8px;
  }
  .column-resize-handle {
    display: none;
  }
  .products-table th:not(:last-child) {
    border-right: none;
  }
  .products-table th:not(:last-child):hover {
    border-right-color: transparent;
  }
  .products-table th:last-child,
  .products-table td:last-child {
    position: sticky;
    right: 0;
    background: #00000095;
    backdrop-filter: blur(10px);
    z-index: 10;
    min-width: 120px;
    width: 120px;
    border-left: 1px solid var(--border-light);
    vertical-align: middle;
    text-align: center;
  }
  .products-table th:last-child {
    background: #00000095;
    backdrop-filter: blur(10px);
  }
  .products-table tbody tr td:last-child {
    position: sticky;
    right: 0;
    background: #00000095;
    backdrop-filter: blur(10px);
    z-index: 5;
    border-left: 1px solid var(--border-light);
    min-width: 120px;
    width: 120px;
    vertical-align: middle;
    text-align: center;
  }
  .products-table td:last-child {
    display: flex;
    gap: 8px;
    height: 100%;
    align-items: center;
    justify-content: center;
    min-height: 50px;
  }
  .product-thumb {
    width: 40px;
    height: 40px;
  }
}
.categories-layout {
  position: relative;
  border: 1px solid var(--primary);
  border-radius: 1vw;
  margin: 2vw 0;
  padding: 1vw;
  display: flex;
  gap: 20px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.context-menu {
  position: fixed;
  background: var(--text-primary);
  border: 1px solid var(--border-medium);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 850;
  min-width: 200px;
  padding: 4px 0;
  font-size: 14px;
}
.context-menu-item {
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--background);
  transition: background-color 0.2s;
}
.context-menu-item:hover {
  background-color: var(--hover-table);
}
.context-menu-item i {
  width: 16px;
  text-align: center;
  color: var(--text-additional-dark);
}
.context-menu-item-danger {
  color: var(--warning);
}
.context-menu-item-danger:hover {
  background-color: var(--warning-dark);
}
.context-menu-item-danger i {
  color: var(--warning-dark);
}
.context-menu-divider {
  height: 1px;
  background-color: var(--background-additional);
  margin: 4px 0;
}
</style>