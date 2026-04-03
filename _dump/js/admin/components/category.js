export const Category = {
  data() {
    return {
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
  methods: {
    async loadCategories() {
      try {
        const response = await fetch('../api.php?action=categories', { credentials: 'same-origin' })
        if (response.ok) {
          const data = await response.json()
          this.categories = data.map(c => ({ id: c.slug, name: c.name, _id: c.id, sort_order: c.sort_order, slug: c.slug }))
        }
      } catch (e) {
        console.error('Error loading categories', e)
      }
    },
    startAddCategory() {
      this.editingCategory = null
      this.categoryForm = { id: null, name: '', slug: '', sort_order: 0 }
      setTimeout(() => { this.categorySuccess = '' }, 2400)
    },
    startEditCategory(cat) {
      this.editingCategory = cat
      this.categoryForm = { id: cat._id, name: cat.name, slug: cat.slug || cat.id, sort_order: cat.sort_order || 0 }
    },
    async saveCategory() {
      this.categoryLoading = true
      this.categoryError = ''
      this.categorySuccess = ''
      try {
        const formData = new FormData()
        if (this.categoryForm.id) {
          formData.append('action', 'update_category')
          formData.append('id', this.categoryForm.id)
        } else {
          formData.append('action', 'add_category')
        }
        formData.append('name', this.categoryForm.name)
        formData.append('slug', this.categoryForm.slug || '')
        formData.append('sort_order', String(this.categoryForm.sort_order || 0))
        const response = await fetch('../api.php', { method: 'POST', body: formData, credentials: 'same-origin' })
        const result = await response.json()
        if (!response.ok || result.error) throw new Error(result.error || 'Ошибка сохранения категории')
        this.categorySuccess = 'Категория сохранена'
        await this.loadCategories()
        this.startAddCategory()
      } catch (e) {
        this.categoryError = e.message || 'Ошибка сохранения категории'
      }
      this.categoryLoading = false
    },
    async saveCategoriesOrder() {
      try {
        const order = this.categories.map(c => c._id)
        const formData = new FormData()
        formData.append('action', 'save_categories_order')
        formData.append('categories_order', JSON.stringify(order))
        const response = await fetch('../api.php', { method: 'POST', body: formData, credentials: 'same-origin' })
        const result = await response.json()
        if (!response.ok || result.error) throw new Error(result.error || 'Ошибка сохранения порядка')
        setTimeout(() => { this.categorySuccess = '' }, 2000)
      } catch (e) {
        this.categoryError = e.message || 'Ошибка сохранения порядка'
      }
    },
    startDragCategory(cat, event) { this.draggingCategoryId = cat._id; event.dataTransfer.effectAllowed = 'move' },
    endDragCategory() { this.draggingCategoryId = null },
    dropCategory(targetCat, event) {
      event.preventDefault()
      if (this.draggingCategoryId === targetCat._id) return
      const di = this.categories.findIndex(c => c._id === this.draggingCategoryId)
      const ti = this.categories.findIndex(c => c._id === targetCat._id)
      if (di === -1 || ti === -1) return
      const [dragged] = this.categories.splice(di, 1)
      this.categories.splice(ti, 0, dragged)
      this.saveCategoriesOrder()
    },
    moveCategory(cat, direction) {
      const i = this.categories.findIndex(c => c._id === cat._id)
      if (i === -1) return
      const ni = direction === 'up' ? i - 1 : i + 1
      if (ni < 0 || ni >= this.categories.length) return
      const [item] = this.categories.splice(i, 1)
      this.categories.splice(ni, 0, item)
    },
    async deleteCategory(cat) {
      if (!confirm('Удалить категорию?')) return
      try {
        const formData = new FormData()
        formData.append('action', 'delete_category')
        formData.append('id', String(cat._id))
        const response = await fetch('../api.php', { method: 'POST', body: formData, credentials: 'same-origin' })
        if (!response.ok) alert('Ошибка удаления')
        this.categorySuccess = ''
        await this.loadCategories()
      } catch (e) {
        alert(e.message || 'Ошибка удаления категории')
      }
    },
    getCategoryName(categoryId) {
      const cat = this.categories.find(c => c.id === categoryId)
      return cat ? cat.name : 'Неизвестно'
    },
    manageCategoryEdit() { this.categoryEdit = !this.categoryEdit },
  },
}
