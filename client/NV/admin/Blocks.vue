<script>
import { isMobileDevice } from './service'
import Modal from "../components/Modal.vue";
import {api} from "../../../server/api";

export default {
  name: 'Blocks',
  components: {Modal},
  emits: ['update:page'],
  data() {
    return {
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
      pages: [],
      productsCatalog: [],
      showIconPicker: false,
      iconSearchQuery: '',
      selectedIconCategory: 'all',
      selectedIconClass: '',
      currentIconTarget: null,
      filteredIcons: [],
      iconCategories: [
        { name: 'all', label: 'Все', icon: 'fas fa-th' },
        { name: 'business', label: 'Бизнес', icon: 'fas fa-briefcase' },
        { name: 'technology', label: 'Технологии', icon: 'fas fa-laptop' },
        { name: 'shopping', label: 'Покупки', icon: 'fas fa-shopping-cart' },
        { name: 'communication', label: 'Общение', icon: 'fas fa-comments' },
        { name: 'media', label: 'Медиа', icon: 'fas fa-play' },
        { name: 'travel', label: 'Путешествия', icon: 'fas fa-plane' },
        { name: 'health', label: 'Здоровье', icon: 'fas fa-heart' },
        { name: 'education', label: 'Образование', icon: 'fas fa-graduation-cap' },
        { name: 'food', label: 'Еда', icon: 'fas fa-utensils' },
        { name: 'sports', label: 'Спорт', icon: 'fas fa-football-ball' },
        { name: 'weather', label: 'Погода', icon: 'fas fa-sun' },
      ],
      availableIcons: [
        { class: 'fas fa-gem', name: 'Камень', category: 'all' },
        { class: 'fas fa-tools', name: 'Инструменты', category: 'all' },
        { class: 'fas fa-award', name: 'Награда', category: 'all' },
        { class: 'fas fa-heart', name: 'Сердце', category: 'health' },
        { class: 'fas fa-star', name: 'Звезда', category: 'all' },
        { class: 'fas fa-shield-alt', name: 'Щит', category: 'all' },
        { class: 'fas fa-lock', name: 'Замок', category: 'all' },
        { class: 'fas fa-home', name: 'Дом', category: 'all' },
        { class: 'fas fa-user', name: 'Пользователь', category: 'all' },
        { class: 'fas fa-cog', name: 'Настройки', category: 'all' },
        { class: 'fas fa-briefcase', name: 'Портфель', category: 'business' },
        { class: 'fas fa-chart-line', name: 'График', category: 'business' },
        { class: 'fas fa-trophy', name: 'Трофей', category: 'business' },
        { class: 'fas fa-laptop', name: 'Ноутбук', category: 'technology' },
        { class: 'fas fa-mobile-alt', name: 'Телефон', category: 'technology' },
        { class: 'fas fa-wifi', name: 'WiFi', category: 'technology' },
        { class: 'fas fa-rocket', name: 'Ракета', category: 'technology' },
        { class: 'fas fa-shopping-cart', name: 'Корзина', category: 'shopping' },
        { class: 'fas fa-gift', name: 'Подарок', category: 'shopping' },
        { class: 'fas fa-tags', name: 'Теги', category: 'shopping' },
        { class: 'fas fa-envelope', name: 'Письмо', category: 'communication' },
        { class: 'fas fa-phone', name: 'Звонок', category: 'communication' },
        { class: 'fas fa-comments', name: 'Комментарии', category: 'communication' },
        { class: 'fas fa-plane', name: 'Самолет', category: 'travel' },
        { class: 'fas fa-car', name: 'Авто', category: 'travel' },
        { class: 'fas fa-map-marker-alt', name: 'Метка', category: 'travel' },
        { class: 'fas fa-globe', name: 'Глобус', category: 'travel' },
        { class: 'fas fa-heartbeat', name: 'Пульс', category: 'health' },
        { class: 'fas fa-stethoscope', name: 'Стетоскоп', category: 'health' },
        { class: 'fas fa-graduation-cap', name: 'Диплом', category: 'education' },
        { class: 'fas fa-book', name: 'Книга', category: 'education' },
        { class: 'fas fa-utensils', name: 'Приборы', category: 'food' },
        { class: 'fas fa-coffee', name: 'Кофе', category: 'food' },
        { class: 'fas fa-football-ball', name: 'Мяч', category: 'sports' },
        { class: 'fas fa-dumbbell', name: 'Гантель', category: 'sports' },
        { class: 'fas fa-sun', name: 'Солнце', category: 'weather' },
        { class: 'fas fa-cloud-rain', name: 'Дождь', category: 'weather' },
        { class: 'fas fa-snowflake', name: 'Снег', category: 'weather' },
      ],
    }
  },
  watch: {
    selectedIconCategory() { this.updateFilteredIcons() },
    iconSearchQuery() { this.updateFilteredIcons() },
  },
  mounted() {
    this.loadPageBlocks()
    this.loadPages()
    this.loadProductsCatalog()
  },
  methods: {
    isMobileDevice,
    getProductsObject() {
      const obj = {}
      ;(this.productsCatalog || []).forEach(p => { obj[p.id] = { ...p } })
      return obj
    },
    async loadProductsCatalog() {
      try {
        const r = await api.getProducts();
        if (r.ok) this.productsCatalog = await r.json();
      } catch { this.productsCatalog = []; }
    },
    async loadPages() {
      try {
        const r = await api.getPages();
        if (r.ok) {
          const pages = await r.json();
          this.pages = pages.map(p => ({
            ...p,
            navigation_buttons: typeof p.navigation_buttons === 'string'
                ? JSON.parse(p.navigation_buttons || '[]')
                : (p.navigation_buttons || []),
          }));
        }
      } catch (e) {
        console.error(e);
      }
    },
    async loadPageBlocks() {
      try {
        const r = await api.getPageBlocks();

        if (!r.ok) { this.pageBlocks = []; return }

        const blocks = await r.json()
        const regular = blocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        const infoBtn = blocks.filter(b => b.type === 'info_buttons')
        const footer = blocks.filter(b => b.type === 'footer')

        this.pageBlocks = [
          ...regular,
          ...(infoBtn.length ? [{ ...infoBtn[0], sort_order: regular.length }] : []),
          ...(footer.length ? [{ ...footer[0], sort_order: regular.length + (infoBtn.length ? 1 : 0) }] : []),
        ]

        await this.ensureInfoButtonsBlock()
        await this.ensureFooterBlock()

        this.originalBlocksOrder = this.pageBlocks.filter(b => !this.isFooterBlock(b) && !this.isInfoButtonsBlock(b)).map(b => b.id)
        this.hasUnsavedChanges = false
      } catch { this.pageBlocks = [] }
    },
    async ensureFooterBlock() {
      if (this.pageBlocks.find(b => b.type === 'footer')) return;
      const r = await api.addPageBlock({
        type: 'footer', title: 'Футер', content: '',
        settings: {}, sort_order: this.pageBlocks.length, is_active: true,
      });
      if (r.ok) {
        const res = await r.json();
        this.pageBlocks.push({ id: res.id, type: 'footer', title: 'Футер', content: '', settings: {}, sort_order: this.pageBlocks.length, is_active: true });
      }
    },
    async ensureInfoButtonsBlock() {
      if (this.pageBlocks.find(b => b.type === 'info_buttons')) return;
      const def = { sectionTitle: '', buttons: [{ text: '', linkType: 'page', link: '', style: 'primary' }] };
      const r = await api.addPageBlock({
        type: 'info_buttons', title: 'Информационные кнопки', content: '',
        settings: def, sort_order: this.pageBlocks.length, is_active: true,
      });
      if (r.ok) {
        const res = await r.json();
        const footerIdx = this.pageBlocks.findIndex(b => b.type === 'footer');
        const nb = { id: res.id, type: 'info_buttons', title: 'Информационные кнопки', content: '', settings: def, sort_order: this.pageBlocks.length, is_active: true };
        footerIdx !== -1 ? this.pageBlocks.splice(footerIdx, 0, nb) : this.pageBlocks.push(nb);
      }
    },
    isFooterBlock(b) { return b.type === 'footer' },
    isInfoButtonsBlock(b) { return b.type === 'info_buttons' },
    openAddBlockModal() {
      const regular = this.pageBlocks.filter(b => !this.isFooterBlock(b) && !this.isInfoButtonsBlock(b))
      this.blockForm = { type: '', title: '', content: '', settings: {}, sort_order: regular.length, is_active: true }
      if (!this.pages.length) this.loadPages()
      if (!this.isMobileDevice()) this.showAddBlockModal = true
      else this.$emit('update:page', 'block')
    },
    editBlock(block) {
      this.editingBlock = block
      this.blockForm = { type: block.type, title: block.title, content: block.content, settings: { ...block.settings }, sort_order: block.sort_order, is_active: block.is_active }
      if ((block.type === 'buttons' || block.type === 'info_buttons') && !Array.isArray(this.blockForm.settings.buttons)) {
        this.blockForm.settings.buttons = [{ text: '', linkType: 'page', link: '', style: 'primary' }]
      }
      if (block.type === 'actual') {
        if (!Array.isArray(this.blockForm.settings.promotions)) this.blockForm.settings.promotions = []
        this.blockForm.settings.promotions.forEach(p => {
          if (!Array.isArray(p.links)) p.links = p.links ? Object.values(p.links) : []
        })
      }
      if (block.type === 'contact' && !this.blockForm.settings.socialLinks) {
        this.blockForm.settings.socialLinks = { telegram: '', instagram: '', tiktok: '' }
      }
      if (!this.isMobileDevice()) this.showAddBlockModal = true
      else this.$emit('update:page', 'block')
    },
    closeBlockModal() {
      if (!this.isMobileDevice()) this.showAddBlockModal = false
      else this.$emit('update:page', '')
      this.editingBlock = null
      this.blockError = ''
      this.blockSuccess = ''
      this.blockForm = { type: '', title: '', content: '', settings: {}, sort_order: 0, is_active: true }
    },
    onBlockTypeChange() {
      const defaults = {
        hero: {
          sectionTitle: '',
          mainTitle: '',
          subtitle: '',
          description: '',
          backgroundImage: '',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          buttonA: '',
          buttonB: ''
        },
        features: {
          sectionTitle: '',
          features: [{ icon: 'fas fa-gem', title: '', description: '' }]
        },
        history: {
          sectionTitle: '',
          events: [{ year: '', title: '', description: '' }]
        },
        stats: {
          sectionTitle: '',
          stats: [{ number: '', label: '' }]
        },
        products: {
          sectionTitle: 'Товары'
        },
        buttons: {
          sectionTitle: '',
          buttons: [{ text: '', linkType: 'page', link: '', style: 'primary' }]
        },
        actual: {
          sectionTitle: 'Акции',
          promotions: [{
            title: '',
            description: '',
            image: '',
            links: [],
            linkType: 'url',
            link: '',
            linkText: ''
          }]
        },
        contact: {
          sectionTitle: 'Контакты',
          email: '',
          phone: '',
          address: '',
          socialLinks: { telegram: '', instagram: '', tiktok: '' }
        },
        custom: {
          anchorId: ''
        },
        info_buttons: {
          sectionTitle: '',
          buttons: [{ text: '', linkType: 'page', link: '', style: 'primary' }]
        },
        footer: { },
        text: {
          sectionTitle: ''
        },
      }
      this.blockForm.settings = defaults[this.blockForm.type] || { sectionTitle: '' }
    },
    addFeature() { this.blockForm.settings.features.push({ icon: 'fas fa-check', title: '', description: '' }) },
    removeFeature(i) { this.blockForm.settings.features.splice(i, 1) },
    addHistoryEvent() { this.blockForm.settings.events.push({ year: '', title: '', description: '' }) },
    removeHistoryEvent(i) { this.blockForm.settings.events.splice(i, 1) },
    addStat() { this.blockForm.settings.stats.push({ number: '', label: '' }) },
    removeStat(i) { this.blockForm.settings.stats.splice(i, 1) },
    addButton() {
      if (!this.blockForm.settings.buttons) this.blockForm.settings.buttons = []
      this.blockForm.settings.buttons.push({ text: '', linkType: 'page', link: '', style: 'primary' })
    },
    removeButton(i) { this.blockForm.settings.buttons.splice(i, 1) },
    addPromotion() {
      if (!this.blockForm.settings.promotions) this.blockForm.settings.promotions = []
      this.blockForm.settings.promotions.push({ title: '', description: '', image: '', links: [], linkType: 'url', link: '', linkText: '' })
    },
    removePromotion(i) { this.blockForm.settings.promotions.splice(i, 1) },
    addLink(pi) {
      const p = this.blockForm.settings.promotions?.[pi]
      if (!p) return
      if (!Array.isArray(p.links)) p.links = []
      p.links.push({ name: '', link: '', title: '', description: '' })
    },
    removeLink(pi, li) { this.blockForm.settings.promotions?.[pi]?.links?.splice(li, 1) },
    getPromoLinkProductId(link) {
      if (!link) return ''
      if (link.data?.id) return link.data.id
      const m = String(link.link || '').match(/[?&]id=(\d+)/)
      return m ? m[1] : ''
    },
    onPromoLinkProductChange(e, pi, li) {
      const id = e.target.value
      const products = this.getProductsObject()
      const p = products[id]
      const link = this.blockForm.settings.promotions[pi].links[li]
      const keepTitle = link?.title || ''
      const keepDesc = link?.description || ''
      this.blockForm.settings.promotions[pi].links[li] = p
        ? { name: p.name, link: window.location.origin + '/product/?id=' + p.id, title: keepTitle, description: keepDesc, data: p }
        : { name: '', link: '', title: keepTitle, description: keepDesc }
    },
    async handleBackgroundImageUpload(e) {
      const file = e.target.files[0];
      if (!file) return;
      const fd = new FormData();
      fd.append('image', file);
      const r = await api.uploadBackground(fd);

      if (r.ok) {
        const res = await r.json();
        this.blockForm.settings.backgroundImage = res.url;
      }
    },
    removeBackgroundImage() { this.blockForm.settings.backgroundImage = '' },
    async handlePromotionImageUpload(e, idx) {
      const file = e.target.files[0];
      if (!file || idx == null) return;
      const fd = new FormData();
      fd.append('image', file);
      const r = await api.uploadBackground(fd);

      if (r.ok) {
        const res = await r.json();
        if (this.blockForm.settings.promotions?.[idx]) this.blockForm.settings.promotions[idx].image = res.url;
      }
      e.target.value = '';
    },
    removePromotionImage(idx) { if (this.blockForm.settings.promotions?.[idx]) this.blockForm.settings.promotions[idx].image = '' },
    async saveBlock() {
      this.blockLoading = true
      this.blockError = ''
      this.blockSuccess = ''
      try {
        const regular = this.pageBlocks.filter(b => !this.isFooterBlock(b) && !this.isInfoButtonsBlock(b))
        if (!this.editingBlock) this.blockForm.sort_order = regular.length
        const settings = JSON.parse(JSON.stringify(this.blockForm.settings || {}));

        if (this.blockForm.type === 'actual' && Array.isArray(settings.promotions)) {
          settings.promotions.forEach(p2 => {
            p2.links = (Array.isArray(p2.links) ? p2.links : Object.values(p2.links || {})).map(l => ({
              name: l.name || '', link: l.link || '', title: l.title || '', description: l.description || '', data: l.data || {},
            }))
          })
        }

        const body = {
          type: this.blockForm.type,
          title: this.blockForm.title,
          content: this.blockForm.content,
          settings,
          sort_order: this.blockForm.sort_order,
          is_active: this.blockForm.is_active,
        };

        const r = this.editingBlock
            ? await api.updatePageBlock(this.editingBlock.id, body)
            : await api.addPageBlock(body);

        if (!r.ok) throw new Error('HTTP error');

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

        await this.ensureInfoButtonsBlock()
        await this.ensureFooterBlock()
        this.blockSuccess = 'Блок сохранён'
        setTimeout(() => this.closeBlockModal(), 1500)
      } catch (e) { this.blockError = e.message || 'Ошибка' }
      this.blockLoading = false
    },
    async deleteBlock(id) {
      const b = this.pageBlocks.find(b2 => b2.id === id);
      if (b && (this.isFooterBlock(b) || this.isInfoButtonsBlock(b))) { alert('Этот блок нельзя удалить'); return; }
      if (!confirm('Удалить блок?')) return;
      const r = await api.deletePageBlock(id);

      if (r.ok) {
        this.pageBlocks = this.pageBlocks.filter(b2 => b2.id !== id);
        await this.ensureInfoButtonsBlock();
        await this.ensureFooterBlock();
      }
    },
    async toggleBlockActive(block) {
      const r = await api.updatePageBlock(block.id, {
        type: block.type, title: block.title, content: block.content,
        settings: block.settings, sort_order: block.sort_order,
        is_active: !block.is_active,
      });

      if (r.ok) block.is_active = !block.is_active;
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
      const [d] = this.pageBlocks.splice(di, 1)
      this.pageBlocks.splice(ti, 0, d)
      this.checkForChanges()
    },
    checkForChanges() {
      const cur = this.pageBlocks.filter(b => !this.isFooterBlock(b) && !this.isInfoButtonsBlock(b)).map(b => b.id)
      this.hasUnsavedChanges = JSON.stringify(cur) !== JSON.stringify(this.originalBlocksOrder)
    },
    async saveBlocksOrder() {
      if (!this.hasUnsavedChanges) return;
      const regular = this.pageBlocks.filter(b => !this.isFooterBlock(b) && !this.isInfoButtonsBlock(b));
      const infoBtn = this.pageBlocks.find(b => this.isInfoButtonsBlock(b));
      const footer  = this.pageBlocks.find(b => this.isFooterBlock(b));
      const order = [
        ...regular.map((b, i) => ({ id: b.id, sort_order: i })),
        ...(infoBtn ? [{ id: infoBtn.id, sort_order: regular.length }] : []),
        ...(footer  ? [{ id: footer.id,  sort_order: regular.length + (infoBtn ? 1 : 0) }] : []),
      ];
      const r = await api.saveBlocksOrder(order);
      if (r.ok) {
        this.originalBlocksOrder = this.pageBlocks.map(b => b.id);
        this.hasUnsavedChanges = false;
        this.blockSuccess = 'Порядок сохранён';
        setTimeout(() => { this.blockSuccess = ''; }, 3000);
      }
    },
    getBlockTypeName(type) {
      return {
        hero: 'Hero секция', features: 'Преимущества', products: 'Товары', history: 'История', stats: 'Статистика',
        contact: 'Контакты', text: 'Текстовый блок', buttons: 'Кнопки', actual: 'Акции',
        custom: 'Пользовательский HTML',
        info_buttons: 'Информационные кнопки', footer: 'Футер',
      }[type] || type
    },
    getBlockPreview(block) {
      const s = block.settings || {}
      const map = {
        hero: `<div><h3>${s.mainTitle || 'Заголовок'}</h3><p>${s.subtitle || ''}</p></div>`,
        features: `<div><h4>${s.sectionTitle || 'Преимущества'}</h4><p>${(s.features || []).length} элементов</p></div>`,
        history: `<div><h4>${s.sectionTitle || 'История'}</h4><p>${(s.events || []).length} событий</p></div>`,
        stats: `<div><h4>${s.sectionTitle || 'Статистика'}</h4><p>${(s.stats || []).length} показателей</p></div>`,
        products: `<div><h4>Товары</h4><p>${s.sectionTitle || 'Наша коллекция'}</p></div>`,
        contact: `<div><h4>Контакты</h4><p>${s.email || '—'}</p></div>`,
        buttons: `<div><h4>Кнопки</h4><p>${(s.buttons || []).length} кнопок</p></div>`,
        actual: `<div><h4>${s.sectionTitle || 'Акции'}</h4><p>${(s.promotions || []).length} акций</p></div>`,
        footer: `<div><h4>Футер</h4><p>${(block.content || '').substring(0, 50)}</p></div>`,
        info_buttons: `<div><h4>Инфо-кнопки</h4><p>${(s.buttons || []).length} кнопок</p></div>`,
        text: `<div><h4>Текст</h4><p>${(block.content || '').substring(0, 80)}</p></div>`,
        custom: `<div><h4>HTML</h4><p>${(block.content || '').replace(/<[^>]+>/g, '').substring(0, 80) || '—'}</p></div>`,
      }
      return map[block.type] || `<div><h4>${this.getBlockTypeName(block.type)}</h4><p>${block.title || '—'}</p></div>`
    },
    openIconPicker(target, prop) {
      this.currentIconTarget = { target, property: prop }
      this.selectedIconClass = target[prop] || ''
      this.iconSearchQuery = ''
      this.selectedIconCategory = 'all'
      this.showIconPicker = true
      this.updateFilteredIcons()
    },
    closeIconPicker() {
      this.showIconPicker = false
      this.currentIconTarget = null
      this.selectedIconClass = ''
    },
    selectIcon(icon) { this.selectedIconClass = icon.class },
    confirmIconSelection() {
      if (this.currentIconTarget && this.selectedIconClass) {
        this.currentIconTarget.target[this.currentIconTarget.property] = this.selectedIconClass
      }
      this.closeIconPicker()
    },
    updateFilteredIcons() {
      let list = this.availableIcons
      if (this.selectedIconCategory !== 'all') list = list.filter(i => i.category === this.selectedIconCategory)
      if (this.iconSearchQuery) {
        const q = this.iconSearchQuery.toLowerCase()
        list = list.filter(i => i.name.toLowerCase().includes(q) || i.class.toLowerCase().includes(q))
      }
      this.filteredIcons = list
    },
  },
}
</script>

<template>
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
      <button class="btn btn-primary" @click="saveBlocksOrder" :disabled="!hasUnsavedChanges">
        <i class="fas fa-save"></i> Сохранить порядок
      </button>
    </div>
  </section>
  <Modal
      v-model="showAddBlockModal"
      modal-id="blockModal"
      :title="editingBlock ? 'Редактировать блок' : 'Добавить блок'"
      default-width="700px"
      default-height="640px"
      class="block-modal"
      @close="closeBlockModal"
  >
    <template #icon>
      <span class="modal-title-icon"><i class="fas fa-layer-group"></i></span>
    </template>
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
          <option value="custom">Пользовательский HTML</option>
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
      <!-- custom -->
      <template v-if="blockForm.type==='custom'">
        <div class="form-group">
          <label>Anchor ID <span style="color:#888;font-size:12px">(необязательно, для навигации)</span></label>
          <input type="text" v-model="blockForm.settings.anchorId" placeholder="my-section">
        </div>
        <div class="form-group">
          <label>HTML код</label>
          <textarea
            v-model="blockForm.content"
            rows="12"
            placeholder="<div class=&quot;my-block&quot;>...</div>"
            style="font-family: monospace; font-size: 13px;"
          ></textarea>
          <small style="color:#888;display:block;margin-top:4px">HTML отображается напрямую на странице. Используйте с осторожностью.</small>
        </div>
      </template>
      <!-- footer -->
      <div v-if="blockForm.type !== 'footer' && blockForm.type !== 'info_buttons'" class="form-group">
        <label>
          <input type="checkbox" v-model="blockForm.is_active">
          Активен
        </label>
      </div>
      <div v-if="blockError"   class="error-message">{{ blockError }}</div>
      <div v-if="blockSuccess" class="success-message">{{ blockSuccess }}</div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="blockLoading">{{ editingBlock ? 'Сохранить' : 'Добавить' }}</button>
        <button type="button" @click="closeBlockModal" class="btn btn-secondary">Отмена</button>
      </div>
    </form>
  </Modal>
  <Modal
      v-model="showIconPicker"
      modal-id="iconPickerModal"
      title="Выбор иконки"
      default-width="640px"
      default-height="560px"
      class="icon-picker-modal"
      @close="closeIconPicker"
  >
    <template #icon>
      <span class="modal-title-icon"><i class="fas fa-icons"></i></span>
    </template>
    <input type="text" v-model="iconSearchQuery" placeholder="Поиск..." class="icon-search-input" style="width:100%;margin-bottom:12px">
    <div class="icon-categories" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
      <button v-for="cat in iconCategories" :key="cat.name" @click="selectedIconCategory=cat.name" class="category-btn" :class="{ active: selectedIconCategory===cat.name }">
        <i :class="cat.icon"></i> {{ cat.label }}
      </button>
    </div>
    <div class="icons-grid">
      <div v-for="icon in filteredIcons" :key="icon.class" @click="selectIcon(icon)" class="icon-item" :class="{ selected: selectedIconClass===icon.class }">
        <i :class="icon.class"></i><span class="icon-name">{{ icon.name }}</span>
      </div>
      <div v-if="!filteredIcons.length" style="grid-column:1/-1;text-align:center;padding:40px;color:#888">Иконки не найдены</div>
    </div>
    <div class="icon-picker-actions" style="display:flex;gap:10px;margin-top:16px">
      <button type="button" @click="confirmIconSelection" class="btn btn-primary" :disabled="!selectedIconClass">Выбрать</button>
      <button type="button" @click="closeIconPicker" class="btn btn-secondary">Отмена</button>
    </div>
  </Modal>
</template>

<style scoped>
.blocks-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.block-item {
  background: var(--background-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-light);
  overflow: hidden;
  transition: all 0.3s ease;
}
.block-item:hover {
  border-color: var(--border-medium);
  transform: translateY(-2px);
}
.block-item.inactive {
  opacity: 0.6;
  border-color: var(--border-medium);
}
.block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: var(--background-secondary);
  border-bottom: 1px solid var(--border-light);
}
.block-info {
  display: flex;
  align-items: center;
  gap: 15px;
  user-select: none;
}
.block-type {
  background: var(--btn-bg);
  color: var(--text-secondary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}
.block-title {
  color: var(--primary);
  font-weight: 500;
}
.block-order {
  color: var(--text-additional);
  font-size: 12px;
}
.block-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.drag-handle {
  color: var(--text-additional-dark);
  cursor: grab;
  padding: 5px;
}
.drag-handle:hover {
  color: var(--primary);
}
.block-preview {
  padding: 15px 20px;
  background: var(--background-secondary);
  user-select: none;
}
.preview-content {
  color: var(--text-additional-light);
  font-size: 14px;
}
.preview-content h3,
.preview-content h4 {
  color: var(--primary);
  margin-bottom: 8px;
}
.preview-content p {
  margin: 0;
  line-height: 1.4;
}
.empty-blocks {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-additional-dark);
}
.empty-blocks i {
  display: block;
  margin-bottom: 20px;
}
.block-modal {
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}
.block-type-fields .feature-item,
.block-type-fields .history-item,
.block-type-fields .stat-item,
.block-type-fields .promotion-item {
  background: var(--background-secondary);
  border-radius: 6px;
  padding: 15px;
  border: 1px solid var(--border-light);
}
.feature-header, .history-header, .stat-header, .promotion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.link-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}
.icon-picker-field {
  display: flex;
  align-items: center;
  gap: 10px;
}
.icon-preview {
  width: 40px;
  height: 40px;
  background: var(--background-secondary);
  border: 1px solid var(--border-medium);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}
.icon-preview:hover {
  background: var(--background-additional);
  border-color: var(--primary);
}
.icon-preview i {
  font-size: 18px;
  color: var(--primary);
}
.icon-picker-field input {
  flex: 1;
  background: var(--background-secondary);
  border: 1px solid var(--border-medium);
  color: var(--text-additional-light);
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
}
.icon-picker-field input:focus {
  outline: none;
  border-color: var(--primary);
  background: var(--background-secondary);
}
.icon-picker-overlay {
  z-index: 1200;
}
.icon-picker-modal {
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  z-index: 1201;
  position: relative;
}
.icon-search {
  margin-bottom: 20px;
}
.icon-search-input {
  width: 100%;
  background: var(--background-secondary);
  border: 1px solid var(--border-medium);
  color: var(--text-additional-light);
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 16px;
}
.icon-search-input:focus {
  outline: none;
  border-color: var(--primary);
  background: var(--background-secondary);
}
.icon-search-input::placeholder {
  color: var(--text-additional);
}
.icon-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-light);
}
.category-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--background-secondary);
  border: 1px solid var(--border-light);
  border-radius: 6px;
  color: var(--text-additional-light);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.category-btn:hover {
  background: var(--background-secondary);
  border-color: var(--border-medium);
}
.category-btn.active {
  background: var(--primary);
  color: var(--text-dark);
  border-color: var(--primary);
}
.category-btn i {
  font-size: 14px;
}
.icons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
  background: var(--background-additional);
  border-radius: 8px;
}
.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 15px 10px;
  background: var(--background-secondary);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}
.icon-item:hover {
  background: var(--hover-primary);
  border-color: var(--border-medium);
  transform: translateY(-2px);
}
.icon-item.selected {
  background: var(--background-additional);
  border-color: var(--border-strong);
  transform: translateY(-2px);
}
.icon-item i {
  font-size: 24px;
  color: var(--primary);
}
.icon-item.selected i {
  color: var(--primary);
  transform: scale(1.1);
}
.icon-name {
  font-size: 12px;
  color: var(--text-additional-light);
  line-height: 1.2;
  word-break: break-word;
}
.icon-item.selected .icon-name {
  color: var(--primary);
  font-weight: 500;
}
.icon-picker-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid var(--border-light);
}
.image-upload-field {
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
}
.image-upload-field:hover {
  border-color: var(--primary);
  background: rgba(255, 237, 179, 0.05);
}
.image-preview {
  position: relative;
  display: inline-block;
  margin-bottom: 15px;
}
.image-preview img {
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--shadow-primary);
}
.image-preview button {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.image-upload-placeholder {
  padding: 40px 20px;
  color: var(--text-additional);
}
.image-upload-placeholder i {
  font-size: 48px;
  margin-bottom: 15px;
  display: block;
}
.image-upload-placeholder p {
  margin: 0;
  font-size: 14px;
}
@media (max-width: 768px) {
  .icon-picker-modal {
    max-width: 95vw;
    margin: 10px;
  }
  .icons-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
  }
  .icon-item {
    padding: 12px 8px;
  }
  .icon-item i {
    font-size: 20px;
  }
  .icon-name {
    font-size: 11px;
  }
  .icon-categories {
    flex-direction: column;
  }
  .category-btn {
    justify-content: center;
  }
  .btn-success {
    margin: 2rem 4rem 0 4rem;
    width: fit-content;
  }
  .block-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  .block-info {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  .block-actions {
    width: 100%;
    justify-content: flex-end;
  }
  .block-modal {
    max-width: 95vw;
    margin: 10px;
  }
}
</style>