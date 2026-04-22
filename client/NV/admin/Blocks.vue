<script>
import { markRaw } from 'vue';
import { isMobileDevice } from './service'
import Modal from "../components/Modal.vue";
import IconPicker from "./IconPicker.vue";
import {api} from "../../../server/api";
import ColorPicker from "./ColorPicker.vue";

const blockModules = import.meta.glob('../blocks/*.vue', { eager: true });
const blockComponents = {};

Object.entries(blockModules).forEach(([path, mod]) => {
  const name = path.split('/').pop().replace('.vue', '').toLowerCase();
  blockComponents[name] = markRaw(mod.default || mod);
});

const customModules = import.meta.glob('../../*.vue', { eager: true });
const customComponents = [];
Object.entries(customModules).forEach(([path, mod]) => {
  const name = path.split('/').pop().replace('.vue', '');
  customComponents.push({ name, component: markRaw(mod.default || mod) });
});

export default {
  name: 'Blocks',
  components: {ColorPicker, Modal, IconPicker},
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
      selectedPageId: null,
      previewMode: false,
      blockComponents,
      customComponents,
      productsCatalog: [],
      showIconPicker: false,
      currentIconTarget: null,
      showProjectIconPicker: false,
      currentProjectIconIndex: null,
      customViewMode: 'visual',
      customElements: [],
      customSelectedElement: null,
      customDraggingElement: null,
      customListItems: [],
      customListIsOrdered: false,
      availableElements: [
        {
          type: 'heading',
          label: 'Заголовок',
          icon: 'fas fa-heading',
          defaultContent: 'Новый заголовок'
        },
        {
          type: 'paragraph',
          label: 'Абзац',
          icon: 'fas fa-paragraph',
          defaultContent: 'Новый абзац текста'
        },
        { type: 'image',
          label: 'Изображение',
          icon: 'fas fa-photo-film',
          defaultContent: ''
        },
        { type: 'list',
          label: 'Список',
          icon: 'fas fa-list',
          defaultContent: '<ul><li>Элемент 1</li></ul>'
        },
        {
          type: 'button',
          label: 'Кнопка',
          icon: 'fas fa-hand-pointer',
          defaultContent: 'Кнопка'
        },
        { type: 'divider',
          label: 'Разделитель',
          icon: 'fas fa-minus',
          defaultContent: '<hr>'
        },
      ],
    }
  },
  watch: {
    customSelectedElement(el) {
      if (el?.type === 'list') this.parseCustomListItems(el.content);
    },
  },
  computed: {
    selectedPage() {
      return this.pages.find(p => p.id === this.selectedPageId) || null;
    },
    isMainPage() {
      return this.selectedPageId === null;
    },
    previewBlocks() {
      return this.pageBlocks
          .filter(b => b.is_active && this.blockComponents[b.type])
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    },
  },
  mounted() {
    this.loadPageBlocks()
    this.loadPages()
    this.loadProductsCatalog()
  },
  methods: {
    isMobileDevice,
    getProductsObject() {
      const obj = {};
      (this.productsCatalog || []).forEach(p => { obj[p.id] = { ...p } })
      return obj;
    },
    async loadProductsCatalog() {
      try {
        const r = await api.getProducts();
        if (r.ok) this.productsCatalog = await r.json();
      } catch {
        this.productsCatalog = [];
      }
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
        const r = await api.getPageBlocks(this.selectedPageId);

        if (!r.ok) {
          this.pageBlocks = [];
          return;
        }

        const blocks = await r.json();

        if (this.isMainPage) {
          const regular = blocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons')
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          const infoBtn = blocks.filter(b => b.type === 'info_buttons');
          const footer = blocks.filter(b => b.type === 'footer');

          this.pageBlocks = [
            ...regular,
            ...(infoBtn.length ? [{ ...infoBtn[0], sort_order: regular.length }] : []),
            ...(footer.length ? [{ ...footer[0], sort_order: regular.length + (infoBtn.length ? 1 : 0) }] : []),
          ];

          await this.ensureCustomComponentBlocks();
          await this.ensureInfoButtonsBlock();
          await this.ensureFooterBlock();
        } else {
          this.pageBlocks = blocks.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        }

        this.originalBlocksOrder = this.pageBlocks.filter(b => !this.isFooterBlock(b) && !this.isInfoButtonsBlock(b))
            .map(b => b.id);
        this.hasUnsavedChanges = false;
      } catch {
        this.pageBlocks = [];
      }
    },
    async switchPage(pageId) {
      this.selectedPageId = pageId;
      this.pageBlocks = [];
      this.hasUnsavedChanges = false;
      await this.loadPageBlocks();
    },
    async ensureCustomComponentBlocks() {
      if (!this.isMainPage) return;
      for (const cc of this.customComponents) {
        const exists = this.pageBlocks.find(b => this.isCustomComponentBlock(b) && b.title === cc.name);
        if (exists) continue;

        const regular = this.pageBlocks.filter(b => !this.isFooterBlock(b) && !this.isInfoButtonsBlock(b));
        const r = await api.addPageBlock({
          page_id: null, type: 'custom_component', title: cc.name,
          content: '', settings: {}, sort_order: regular.length, is_active: true,
        });

        if (r.ok) {
          const res = await r.json();
          const ii = this.pageBlocks.findIndex(b => this.isInfoButtonsBlock(b));
          const fi = this.pageBlocks.findIndex(b => this.isFooterBlock(b));
          const insertAt = ii !== -1 ? ii : (fi !== -1 ? fi : this.pageBlocks.length);
          this.pageBlocks.splice(insertAt, 0, {
            id: res.id, page_id: null, type: 'custom_component', title: cc.name,
            content: '', settings: {}, sort_order: regular.length, is_active: true,
          });
        }
      }
    },
    async ensureFooterBlock() {
      if (!this.isMainPage || this.pageBlocks.find(b => b.type === 'footer')) return;

      const r = await api.addPageBlock({
        page_id: null, type: 'footer', title: 'Футер', content: '',
        settings: {}, sort_order: this.pageBlocks.length, is_active: true,
      });

      if (r.ok) {
        const res = await r.json();
        this.pageBlocks.push({
          id: res.id, page_id: null, type: 'footer', title: 'Футер', content: '',
          settings: {}, sort_order: this.pageBlocks.length, is_active: true,
        });
      }
    },
    async ensureInfoButtonsBlock() {
      if (!this.isMainPage || this.pageBlocks.find(b => b.type === 'info_buttons')) return;

      const def = { sectionTitle: '', buttons: [{ text: '', linkType: 'page', link: '', style: 'primary' }] };

      const r = await api.addPageBlock({
        page_id: null,
        type: 'info_buttons',
        title: 'Информационные кнопки',
        content: '',
        settings: def,
        sort_order: this.pageBlocks.length,
        is_active: true,
      });

      if (r.ok) {
        const res = await r.json();
        const footerIdx = this.pageBlocks.findIndex(b => b.type === 'footer');

        const nb = {
          id: res.id,
          page_id: null,
          type: 'info_buttons',
          title: 'Информационные кнопки',
          content: '',
          settings: def,
          sort_order: this.pageBlocks.length,
          is_active: true,
        };

        footerIdx !== -1 ? this.pageBlocks.splice(footerIdx, 0, nb) : this.pageBlocks.push(nb);
      }
    },
    isFooterBlock(b) {
      return b.type === 'footer';
    },
    isInfoButtonsBlock(b) {
      return b.type === 'info_buttons';
    },
    isCustomComponentBlock(b) {
      return b.type === 'custom_component';
    },
    openAddBlockModal() {
      const regular = this.pageBlocks.filter(b => !this.isFooterBlock(b) && !this.isInfoButtonsBlock(b));

      this.blockForm = {
        type: '',
        title: '',
        content: '',
        settings: {},
        sort_order: regular.length,
        is_active: true
      };

      this.customElements = [];
      this.customSelectedElement = null;
      this.customViewMode = 'visual';
      if (!this.pages.length) this.loadPages();
      if (!this.isMobileDevice()) {
        this.showAddBlockModal = true;
      } else {
        this.$emit('update:page', 'block');
      }
    },
    editBlock(block) {
      this.editingBlock = block;

      this.blockForm = {
        type: block.type,
        title: block.title,
        content: block.content,
        settings: { ...block.settings },
        sort_order: block.sort_order,
        is_active: block.is_active
      }

      if ((block.type === 'buttons' || block.type === 'info_buttons') &&
          !Array.isArray(this.blockForm.settings.buttons)
      ) {
        this.blockForm.settings.buttons = [{ text: '', linkType: 'page', link: '', style: 'primary' }];
      }

      if (block.type === 'actual') {
        if (!Array.isArray(this.blockForm.settings.promotions)) this.blockForm.settings.promotions = [];

        this.blockForm.settings.promotions.forEach(p => {
          if (!Array.isArray(p.links)) p.links = p.links ? Object.values(p.links) : [];
        });
      }

      if (block.type === 'contact' && !this.blockForm.settings.socialLinks) {
        this.blockForm.settings.socialLinks = { telegram: '', instagram: '', tiktok: '' };
      }

      if (block.type === 'custom') {
        this.customElements = this.parseHTMLToCustomElements(block.content || '');
        this.customSelectedElement = null;
        this.customViewMode = 'visual';
      }

      if (!this.isMobileDevice()) {
        this.showAddBlockModal = true;
      } else {
        this.$emit('update:page', 'block');
      }
    },
    closeBlockModal() {
      if (!this.isMobileDevice()) this.showAddBlockModal = false;
      else this.$emit('update:page', '');
      this.editingBlock = null;
      this.blockError = '';
      this.blockSuccess = '';

      this.blockForm = {
        type: '',
        title: '',
        content: '',
        settings: {},
        sort_order: 0,
        is_active: true
      };

      this.customElements = [];
      this.customSelectedElement = null;
      this.customViewMode = 'visual';
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
        projects: {
          sectionTitle: 'Мои проекты',
          projects: [{
            title: '',
            description: '',
            icon: '🚀',
            iconType: 'text',
            tech: '',
            github: '',
            github2: '',
            github2_title: '',
            demo: '',
            site: '',
            screenshots: []
          }]
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

      this.blockForm.settings = defaults[this.blockForm.type] || { sectionTitle: '' };
    },
    addFeature() {
      this.blockForm.settings.features.push({ icon: 'fas fa-check', title: '', description: '' })
    },
    removeFeature(i) {
      this.blockForm.settings.features.splice(i, 1);
    },
    addHistoryEvent() {
      this.blockForm.settings.events.push({ year: '', title: '', description: '' });
    },
    removeHistoryEvent(i) {
      this.blockForm.settings.events.splice(i, 1);
    },
    addStat() {
      this.blockForm.settings.stats.push({ number: '', label: '' });
    },
    removeStat(i) {
      this.blockForm.settings.stats.splice(i, 1);
    },
    addButton() {
      if (!this.blockForm.settings.buttons) this.blockForm.settings.buttons = [];
      this.blockForm.settings.buttons.push({ text: '', linkType: 'page', link: '', style: 'primary' });
    },
    removeButton(i) {
      this.blockForm.settings.buttons.splice(i, 1);
    },
    addPromotion() {
      if (!this.blockForm.settings.promotions) this.blockForm.settings.promotions = [];

      this.blockForm.settings.promotions.push({
        title: '',
        description: '',
        image: '',
        links: [],
        linkType: 'url',
        link: '',
        linkText: ''
      });
    },
    removePromotion(i) {
      this.blockForm.settings.promotions.splice(i, 1);
    },
    addLink(pi) {
      const p = this.blockForm.settings.promotions?.[pi];
      if (!p) return;
      if (!Array.isArray(p.links)) p.links = [];
      p.links.push({ name: '', link: '', title: '', description: '' });
    },
    removeLink(pi, li) {
      this.blockForm.settings.promotions?.[pi]?.links?.splice(li, 1);
    },
    getPromoLinkProductId(link) {
      if (!link) return '';
      if (link.data?.id) return link.data.id;
      const m = String(link.link || '').match(/[?&]id=(\d+)/);
      return m ? m[1] : '';
    },
    onPromoLinkProductChange(e, pi, li) {
      const id = e.target.value;
      const products = this.getProductsObject();
      const p = products[id];
      const link = this.blockForm.settings.promotions[pi].links[li];
      const keepTitle = link?.title || '';
      const keepDesc = link?.description || '';

      this.blockForm.settings.promotions[pi].links[li] = p
        ? { name: p.name,
            link: window.location.origin + '/product/?id=' + p.id,
            title: keepTitle,
            description: keepDesc,
            data: p
      } : { name: '', link: '', title: keepTitle, description: keepDesc };
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
      } else {
        this.blockError = await this.serverError(r);
      }
    },
    removeBackgroundImage() {
      this.blockForm.settings.backgroundImage = '';
    },
    async handlePromotionImageUpload(e, idx) {
      const file = e.target.files[0];
      if (!file || idx == null) return;
      const fd = new FormData();
      fd.append('image', file);
      const r = await api.uploadBackground(fd);

      if (r.ok) {
        const res = await r.json();
        if (this.blockForm.settings.promotions?.[idx]) this.blockForm.settings.promotions[idx].image = res.url;
      } else {
        this.blockError = await this.serverError(r);
      }

      e.target.value = '';
    },
    removePromotionImage(idx) {
      if (this.blockForm.settings.promotions?.[idx]) this.blockForm.settings.promotions[idx].image = '';
    },
    async saveBlock() {
      this.blockLoading = true;
      this.blockError = '';
      this.blockSuccess = '';

      try {
        if (this.blockForm.type === 'custom' && this.customViewMode === 'visual') {
          this.blockForm.content = this.customElementsToHTML();
        }

        const regular = this.pageBlocks.filter(b => !this.isFooterBlock(b) && !this.isInfoButtonsBlock(b));
        if (!this.editingBlock) this.blockForm.sort_order = regular.length;
        const settings = JSON.parse(JSON.stringify(this.blockForm.settings || {}));;

        if (this.blockForm.type === 'actual' && Array.isArray(settings.promotions)) {
          settings.promotions.forEach(p2 => {
            p2.links = (Array.isArray(p2.links) ? p2.links : Object.values(p2.links || {})).map(l => ({
              name: l.name || '',
              link: l.link || '',
              title: l.title || '',
              description: l.description || '',
              data: l.data || {},
            }));
          });
        }

        const body = {
          page_id: this.selectedPageId,
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

        if (!r.ok) throw new Error(await this.serverError(r));

        if (this.editingBlock) {
          const idx = this.pageBlocks.findIndex(b => b.id === this.editingBlock.id)
          if (idx !== -1) this.pageBlocks[idx] = { ...this.pageBlocks[idx], ...this.blockForm, settings }
        } else {
          const res = await r.json();
          const nb = { id: res.id, ...this.blockForm, settings };
          const fi = this.pageBlocks.findIndex(b => this.isFooterBlock(b));
          const ii = this.pageBlocks.findIndex(b => this.isInfoButtonsBlock(b));
          const insertAt = ii !== -1 ? ii : (fi !== -1 ? fi : this.pageBlocks.length);
          this.pageBlocks.splice(insertAt, 0, nb);
        }

        await this.ensureInfoButtonsBlock();
        await this.ensureFooterBlock();
        this.blockSuccess = 'Блок сохранён';
        setTimeout(() => this.closeBlockModal(), 1500);
      } catch (e) {
        this.blockError = e.message || 'Ошибка'
      }

      this.blockLoading = false;
    },
    async deleteBlock(id) {
      const b = this.pageBlocks.find(b2 => b2.id === id);
      if (b && (this.isFooterBlock(b) || this.isInfoButtonsBlock(b) || this.isCustomComponentBlock(b))) {
        alert('Этот блок нельзя удалить');
        return;
      }

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
    startDrag(block, e) {
      this.draggingBlockId = block.id;
      e.dataTransfer.effectAllowed = 'move';
    },
    endDrag() {
      this.draggingBlockId = null;
    },
    dropBlock(target, e) {
      e.preventDefault();
      const dragged = this.pageBlocks.find(b => b.id === this.draggingBlockId);
      if (!dragged || this.isFooterBlock(dragged) || this.isInfoButtonsBlock(dragged)) return;
      if (this.isFooterBlock(target) || this.isInfoButtonsBlock(target)) return;
      const di = this.pageBlocks.findIndex(b => b.id === this.draggingBlockId);
      const ti = this.pageBlocks.findIndex(b => b.id === target.id);
      if (di === -1 || ti === -1) return;
      const [d] = this.pageBlocks.splice(di, 1);
      this.pageBlocks.splice(ti, 0, d);
      this.checkForChanges();
    },
    checkForChanges() {
      const cur = this.pageBlocks.filter(b => !this.isFooterBlock(b) && !this.isInfoButtonsBlock(b)).map(b => b.id);
      this.hasUnsavedChanges = JSON.stringify(cur) !== JSON.stringify(this.originalBlocksOrder);
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

        setTimeout(() => {
          this.blockSuccess = '';
        }, 3000);
      }
    },
    getBlockTypeName(type) {
      return {
        hero: 'Hero секция',
        actual: 'Акции',
        products: 'Товары',
        projects: 'Проекты',
        features: 'Преимущества',
        history: 'История',
        stats: 'Статистика',
        contact: 'Контакты',
        text: 'Текстовый блок',
        buttons: 'Кнопки',
        custom: 'Пользовательский HTML',
        custom_component: 'Компонент',
      } [type] || type
    },
    getBlockPreview(block) {
      const s = block.settings || {};

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
        projects: `<div><h4>${s.sectionTitle || 'Проекты'}</h4><p>${(s.projects || []).length} проектов</p></div>`,
        custom: `<div><h4>HTML</h4><p>${(block.content || '').replace(/<[^>]+>/g, '').substring(0, 80) || '—'}</p></div>`,
        custom_component: `<div><h4><i class="fas fa-puzzle-piece"></i> ${block.title}</h4><p>Пользовательский Vue-компонент</p></div>`,
      };

      return map[block.type] || `<div><h4>${this.getBlockTypeName(block.type)}</h4><p>${block.title || '—'}</p></div>`;
    },
    async serverError(r) {
      try {
        const body = await r.json();
        return body.message || body.error || `Ошибка ${r.status}`;
      } catch {
        return `Ошибка ${r.status}`;
      }
    },
    openIconPicker(target, prop) {
      this.currentIconTarget = { target, property: prop };
      this.selectedIconClass = target[prop] || '';
      this.iconSearchQuery = '';
      this.selectedIconCategory = 'all';
      this.showIconPicker = true;
      this.updateFilteredIcons();
    },
    confirmIconSelection(iconClass) {
      if (this.currentIconTarget && iconClass) {
        this.currentIconTarget.target[this.currentIconTarget.property] = iconClass;
      }

      this.currentIconTarget = null;
    },
    addProject() {
      if (!Array.isArray(this.blockForm.settings.projects)) this.blockForm.settings.projects = [];
      this.blockForm.settings.projects.push({
        title: '',
        description: '',
        icon: '🚀',
        iconType: 'text',
        tech: '',
        github: '',
        github2: '',
        github2_title: '',
        demo: '',
        site: '',
        screenshots: []
      });
    },
    removeProject(i) {
      this.blockForm.settings.projects.splice(i, 1);
    },
    openProjectIconPicker(pi) {
      this.currentProjectIconIndex = pi;
      this.showProjectIconPicker = true;
    },
    onProjectIconSelected(iconClass) {
      const proj = this.blockForm.settings.projects?.[this.currentProjectIconIndex];
      if (proj) proj.icon = iconClass;
      this.currentProjectIconIndex = null;
    },
    async handleProjectIconUpload(e, pi) {
      const file = e.target.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append('file', file);
      const r = await api.uploadMedia(fd);

      if (r.ok) {
        const res = await r.json();
        const proj = this.blockForm.settings.projects?.[pi];
        if (proj) proj.icon = '/' + res.url;
      } else {
        alert(await this.serverError(r));
      }

      e.target.value = '';
    },
    async handleProjectScreenshotsUpload(e, pi) {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      const proj = this.blockForm.settings.projects?.[pi];
      if (!proj) return;
      if (!Array.isArray(proj.screenshots)) proj.screenshots = [];

      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const r = await api.uploadMedia(fd);
        if (r.ok) {
          const res = await r.json();
          proj.screenshots.push('/' + res.url);
        } else {
          this.blockError = await this.serverError(r);
          break;
        }
      }

      e.target.value = '';
    },
    removeProjectScreenshot(pi, si) {
      const proj = this.blockForm.settings.projects?.[pi];
      if (proj?.screenshots) proj.screenshots.splice(si, 1);
    },
    getProjectIconInitial(pi) {
      const proj = this.blockForm.settings.projects?.[pi];
      return (proj?.iconType === 'fa' ? proj.icon : '') || '';
    },
    escapeHtml(t) {
      const d = document.createElement('div'); d.textContent = t; return d.innerHTML;
    },
    toggleCustomViewMode() {
      if (this.customViewMode === 'visual') {
        this.blockForm.content = this.customElementsToHTML();
        this.customViewMode = 'html';
      } else {
        this.customElements = this.parseHTMLToCustomElements(this.blockForm.content || '');
        this.customSelectedElement = null;
        this.customViewMode = 'visual';
      }
    },
    addCustomElement(tpl) {
      const nb = {
        id: Date.now() + Math.random(),
        type: tpl.type,
        content: tpl.defaultContent || '',
        level: tpl.type === 'heading' ? 2 : null,
        link: tpl.type === 'button' ? '' : null,
        style: tpl.type === 'button' ? 'primary' : null
      };

      this.customElements.push(nb);
      this.customSelectedElement = nb;
    },
    insertCustomElementAt(idx, tpl) {
      const nb = {
        id: Date.now() + Math.random(),
        type: tpl.type,
        content: tpl.defaultContent || '',
        level: tpl.type === 'heading' ? 2 : null,
        link: tpl.type === 'button' ? '' : null,
        style: tpl.type === 'button' ? 'primary' : null
      };

      this.customElements.splice(idx, 0, nb);
      this.customSelectedElement = nb;
    },
    selectCustomElement(el) {
      this.customSelectedElement = el;
    },
    removeCustomElement(idx) {
      if (confirm('Удалить?')) {
        if (this.customSelectedElement?.id === this.customElements[idx].id) this.customSelectedElement = null;
        this.customElements.splice(idx, 1);
      }
    },
    moveCustomElementUp(idx) {
      if (idx > 0) {
        const [el] = this.customElements.splice(idx, 1);
        this.customElements.splice(idx - 1, 0, el);
      }
    },
    moveCustomElementDown(idx) {
      if (idx < this.customElements.length - 1) {
        const [el] = this.customElements.splice(idx, 1);
        this.customElements.splice(idx + 1, 0, el);
      }
    },
    updateCustomElementContent() {
      if (this.customSelectedElement) {
        const i = this.customElements.findIndex(e => e.id === this.customSelectedElement.id);

        if (i !== -1) {
          this.customElements[i] = { ...this.customSelectedElement };
          this.customSelectedElement = this.customElements[i];
        }
      }
    },
    duplicateCustomElement(idx) {
      const el = { ...this.customElements[idx], id: Date.now() + Math.random() };
      this.customElements.splice(idx + 1, 0, el);
      this.customSelectedElement = this.customElements[idx + 1];
    },
    parseCustomListItems(content) {
      const div = document.createElement('div');
      div.innerHTML = content || '<ul><li></li></ul>';
      this.customListIsOrdered = !!div.querySelector('ol');
      this.customListItems = Array.from(div.querySelectorAll('li')).map(li => li.textContent || '');
      if (!this.customListItems.length) this.customListItems = [''];
    },
    rebuildCustomListHtml() {
      const tag = this.customListIsOrdered ? 'ol' : 'ul';
      const html = `<${tag}>${this.customListItems.map(i => `<li>${i}</li>`).join('')}</${tag}>`;

      if (this.customSelectedElement) {
        this.customSelectedElement.content = html;
        this.updateCustomElementContent();
      }
    },
    addCustomListItem() {
      this.customListItems.push('');
      this.rebuildCustomListHtml();
    },
    removeCustomListItem(idx) {
      this.customListItems.splice(idx, 1);
      if (!this.customListItems.length) this.customListItems = [''];
      this.rebuildCustomListHtml();
    },
    async handleCustomImageUpload(e) {
      const file = e.target.files?.[0];
      if (!file || !this.customSelectedElement) return;
      const fd = new FormData(); fd.append('image', file);
      const r = await api.uploadBackground(fd);

      if (r.ok) {
        const res = await r.json();
        this.customSelectedElement.content = res.url;
        this.updateCustomElementContent();
      } else {
        this.blockError = await this.serverError(r);
      }
    },
    startDragCustomAvail(el, e) {
      this.customDraggingElement = { ...el, isNew: true };
      e.dataTransfer.effectAllowed = 'copy';
    },
    startDragCustomEl(el, e) {
      this.customDraggingElement = {
        ...el,
        isNew: false,
        index: this.customElements.findIndex(ce => ce.id === el.id)
      };

      e.dataTransfer.effectAllowed = 'move';
    },
    onCustomPreviewDrop(e) {
      e.preventDefault();
      if (this.customDraggingElement?.isNew) this.addCustomElement(this.customDraggingElement);
      this.customDraggingElement = null;
    },
    onCustomElDragOver(_idx, e) {
      e.preventDefault();
      e.stopPropagation();

      document.querySelectorAll('.custom-page-element')
          .forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom'));

      const rect = e.currentTarget.getBoundingClientRect();
      e.currentTarget.classList.add(e.clientY < rect.top + rect.height / 2 ? 'drag-over-top' : 'drag-over-bottom');
    },
    onCustomElDrop(idx, e) {
      e.preventDefault(); e.stopPropagation();
      document.querySelectorAll('.custom-page-element')
          .forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom'));

      if (!this.customDraggingElement) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const after = e.clientY >= rect.top + rect.height / 2;
      const targetIdx = after ? idx + 1 : idx;

      if (this.customDraggingElement.isNew) {
        this.insertCustomElementAt(targetIdx, this.customDraggingElement);
      } else {
        const oi = this.customDraggingElement.index;
        const ni = oi < targetIdx ? targetIdx - 1 : targetIdx;
        if (oi !== ni) { const [el] = this.customElements.splice(oi, 1); this.customElements.splice(ni, 0, el); }
      }

      this.customDraggingElement = null;
    },
    renderCustomElement(el) {
      switch (el.type) {
        case 'heading':
          return `<h${el.level || 2}>${el.content || 'Заголовок'}</h${el.level || 2}>`;
        case 'paragraph':
          return `<p>${el.content || 'Абзац'}</p>`;
        case 'image':
          return el.content ? `<img src="${el.content}" style="max-width:100%">` :
              '<div style="padding:40px;text-align:center;opacity:.5"><i class="fas fa-image" style="font-size:48px"></i></div>';
        case 'list':
          return el.content || '<ul><li>Элемент</li></ul>';
        case 'button':
          return `<a href="${el.link || '#'}" class="btn btn-${el.style || 'primary'}">${el.content || 'Кнопка'}</a>`;
        case 'divider':
          return '<hr>';
        default:
          return el.content || '';
      }
    },
    getCustomElementLabel(type) {
      return this.availableElements.find(e => e.type === type)?.label || type;
      },
    customElementsToHTML() {
      return this.customElements.map(el => {
        if (el.type === 'heading')
          return `<h${el.level || 2}>${this.escapeHtml(el.content || '')}</h${el.level || 2}>`;
        if (el.type === 'paragraph')
          return `<p>${this.escapeHtml(el.content || '')}</p>`;
        if (el.type === 'image')
          return el.content ? `<img src="${this.escapeHtml(el.content)}" style="max-width:100%">` : '';
        if (el.type === 'list')
          return el.content || '';
        if (el.type === 'button')
          return `<a href="${this.escapeHtml(el.link || '#')}" class="btn btn-${el.style || 'primary'}">${this.escapeHtml(el.content || '')}</a>`;
        if (el.type === 'divider')
          return '<hr>';

        return this.escapeHtml(el.content || '');
      }).join('\n');
    },
    parseHTMLToCustomElements(html) {
      if (!html?.trim()) return [];
      const els = [];
      const div = document.createElement('div');
      div.innerHTML = html.trim();
      let eid = Date.now();

      const process = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const t = node.textContent.trim();

          if (t) els.push({
            id: eid++,
            type: 'paragraph',
            content: t
          });

          return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const tag = node.tagName.toLowerCase();

        if (/^h[1-6]$/.test(tag)) {
          els.push({ id: eid++, type: 'heading', content: node.textContent.trim(), level: +tag[1] });
          return;
        }

        if (tag === 'p') {
          const t = node.textContent.trim();
          if (t) els.push({ id: eid++, type: 'paragraph', content: t });
          return;
        }

        if (tag === 'img') {
          els.push({ id: eid++, type: 'image', content: node.getAttribute('src') || '' });
          return;
        }

        if (tag === 'ul' || tag === 'ol') {
          els.push({ id: eid++, type: 'list', content: node.outerHTML });
          return;
        }

        if (tag === 'a' && node.classList.contains('btn')) {
          const style = node.classList.contains('btn-secondary') ? 'secondary' :
              node.classList.contains('btn-outline') ? 'outline' : 'primary';

          els.push({
            id: eid++,
            type: 'button',
            content: node.textContent.trim(),
            link: node.getAttribute('href') || '#', style
          });

          return;
        }

        if (tag === 'hr') {
          els.push({ id: eid++, type: 'divider', content: '<hr>' });
          return;
        }

        Array.from(node.childNodes).forEach(child => {
          if (child.nodeType === Node.ELEMENT_NODE) process(child);
        });
      };

      Array.from(div.childNodes).forEach(process);
      return els;
    },
  },
}
</script>

<template>
  <section class="page-builder" style="margin-top:40px">
    <div class="page-builder-content">
      <div style="flex:1">
        <h2>Конструктор страниц</h2>
      </div>
      <button class="btn btn-secondary" @click="previewMode = !previewMode">
        <i :class="previewMode ? 'fas fa-list' : 'fas fa-eye'"></i>
        <span> {{ previewMode ? 'Список' : 'Предпросмотр' }}</span>
      </button>
      <button v-if="!previewMode" class="btn btn-primary" @click="openAddBlockModal">
        <i class="fas fa-plus"></i>
        <span> Добавить блок</span>
      </button>
    </div>
    <div class="page-tabs">
      <button :class="['page-tab', { active: selectedPageId === null }]" @click="switchPage(null)">
        <i class="fas fa-home"></i> Главная
      </button>
      <button
          v-for="pg in pages" :key="pg.id"
          :class="['page-tab', { active: selectedPageId === pg.id }]"
          @click="switchPage(pg.id)">
        <i class="fas fa-file"></i> {{ pg.title }}
      </button>
    </div>
    <div v-if="blockSuccess" class="alert alert-success" style="margin-top:15px">
      <i class="fas fa-check-circle"></i>
      {{ blockSuccess }}
    </div>
    <div v-if="blockError" class="alert alert-error" style="margin-top:15px"
    ><i class="fas fa-exclamation-circle"></i>
      {{ blockError }}
    </div>
    <div v-if="previewMode" class="blocks-preview-frame">
      <div class="blocks-preview-toolbar">
        <span><i class="fas fa-eye"></i> Предпросмотр страницы</span>
        <small v-if="!previewBlocks.length" style="color:var(--text-additional)"> — нет активных блоков с компонентами</small>
      </div>
      <div class="blocks-preview-content">
        <component
            v-for="block in previewBlocks"
            :key="block.id"
            :is="blockComponents[block.type]"
            :block="block"
            :is-in-view="() => true"
        />
        <component
            v-if="isMainPage"
            v-for="cc in customComponents"
            :key="cc.name"
            :is="cc.component"
        />
        <div v-if="!previewBlocks.length && !customComponents.length" style="padding:60px;text-align:center;color:var(--text-additional)">
          <i class="fas fa-eye-slash" style="font-size:48px;display:block;margin-bottom:16px;opacity:.4"></i>
          <p>Нет активных блоков для отображения</p>
        </div>
      </div>
    </div>
    <div v-else class="page-blocks-container">
      <div class="blocks-list">
        <div v-for="block in pageBlocks" :key="block.id" class="block-item"
                 :class="{ inactive:!block.is_active,
                 dragging:block.id===draggingBlockId,
                 'footer-block': isFooterBlock(block)||isInfoButtonsBlock(block),
                 'custom-component-item': isCustomComponentBlock(block)
            }"
             :draggable="!isFooterBlock(block) && !isInfoButtonsBlock(block)"
             @dragstart="startDrag(block,$event)" @dragend="endDrag"
             @dragover.prevent @drop="dropBlock(block,$event)">
          <div class="block-header">
            <div class="block-info">
              <span
                  class="block-type"
                  :style="isCustomComponentBlock(block) ? 'background:rgba(99,102,241,.15);color:#8b7cf8' : ''"
              >
                {{ getBlockTypeName(block.type) }}
              </span>
              <span class="block-title">{{ block.title || 'Без названия' }}</span>
              <span class="block-order">#{{ block.sort_order }}</span>
            </div>
            <div class="block-actions">
              <button
                  v-if="!isCustomComponentBlock(block)"
                  @click="toggleBlockActive(block)"
                  class="btn btn-sm"
                  :class="block.is_active?'':'btn-block-hidden'"
              >
                <i :class="block.is_active?'fas fa-eye-slash':'fas fa-eye'"></i>
              </button>
              <button
                  v-if="!isFooterBlock(block) && !isInfoButtonsBlock(block) && !isCustomComponentBlock(block)"
                  @click="editBlock(block)"
                  class="btn btn-sm btn-edit"
              >
                <i class="fas fa-edit"></i>
              </button>
              <button
                  v-if="!isFooterBlock(block) && !isInfoButtonsBlock(block) && !isCustomComponentBlock(block)"
                  @click="deleteBlock(block.id)"
                  class="btn btn-sm btn-delete">
                <i class="fas fa-trash"></i>
              </button>
              <div v-if="!isFooterBlock(block) && !isInfoButtonsBlock(block)" class="drag-handle">
                <i class="fas fa-grip-vertical"></i>
              </div>
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
          <option value="projects">Проекты</option>
          <option value="custom">Пользовательский HTML</option>
          <option v-if="isMainPage" value="info_buttons" disabled>Инфо-кнопки (авто)</option>
          <option v-if="isMainPage" value="footer" disabled>Футер (авто)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Название блока</label>
        <input type="text" v-model="blockForm.title" placeholder="Для идентификации в админке">
      </div>
      <div v-if="blockForm.settings && 'sectionTitle' in blockForm.settings" class="form-group">
        <label>Заголовок секции</label>
        <input type="text" v-model="blockForm.settings.sectionTitle">
      </div>
      <!-- hero -->
      <template v-if="blockForm.type==='hero'">
        <div class="form-group">
          <label>Основной заголовок</label>
          <input type="text" v-model="blockForm.settings.mainTitle">
        </div>
        <div class="form-group">
          <label>Подзаголовок</label>
          <textarea v-model="blockForm.settings.subtitle" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label>Описание</label>
          <textarea v-model="blockForm.settings.description" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>Текст кнопки 1</label><input type="text" v-model="blockForm.settings.buttonA"></div>
        <div class="form-group">
          <label>Текст кнопки 2</label><input type="text" v-model="blockForm.settings.buttonB"></div>
        <div class="form-group">
          <label>Фоновое изображение</label>
          <div class="image-upload-field">
            <div v-if="blockForm.settings.backgroundImage" class="image-preview">
              <img :src="blockForm.settings.backgroundImage" alt="bg">
              <button type="button" @click="removeBackgroundImage" class="btn btn-sm btn-delete">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <input type="file" @change="handleBackgroundImageUpload" accept="image/*" ref="bgInput" style="display:none">
            <button type="button" @click="$refs.bgInput.click()" class="btn btn-secondary">
              <i class="fas fa-upload"></i>
              {{ blockForm.settings.backgroundImage ? 'Изменить' : 'Загрузить' }}
            </button>
          </div>
        </div>
        <div class="form-group">
          <label>Позиция фона</label>
          <select v-model="blockForm.settings.backgroundPosition">
            <option value="center">По центру</option>
            <option value="top">Сверху</option>
            <option value="bottom">Снизу</option>
          </select>
        </div>
      </template>
      <!-- features -->
      <template v-if="blockForm.type==='features'">
        <div class="form-group">
          <label>Преимущества</label>
          <div
              v-for="(f,i) in blockForm.settings.features"
              :key="i"
              class="feature-item"
              style="background:rgba(255,255,255,.05);padding:12px;border-radius:8px;margin-bottom:10px"
          >
            <div style="display: flex; justify-content: space-between">
              <span>{{ i+1 }}</span>
              <button type="button" @click="removeFeature(i)" class="btn btn-sm btn-delete">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="form-group">
              <label>Иконка</label>
              <div style="display:flex;gap:8px;align-items:center">
                <i :class="f.icon||'fas fa-question'" style="font-size: 20px"></i>
                <input type="text" v-model="f.icon" placeholder="fas fa-gem" style="flex: 1">
                <button type="button" @click="openIconPicker(f,'icon')" class="btn btn-sm btn-secondary">
                  <i class="fas fa-search"></i>
                </button>
              </div>
            </div>
            <div class="form-group">
              <label>Заголовок</label>
              <input type="text" v-model="f.title">
            </div>
            <div class="form-group">
              <label>Описание</label>
              <textarea v-model="f.description" rows="2"></textarea>
            </div>
          </div>
          <button type="button" @click="addFeature" class="btn btn-secondary">
            <i class="fas fa-plus"></i>
            Добавить
          </button>
        </div>
      </template>
      <!-- history -->
      <template v-if="blockForm.type==='history'">
        <div class="form-group">
          <label>События</label>
          <div v-for="(ev,i) in blockForm.settings.events"
               :key="i"
               style="background: rgba(255,255,255,.05); padding: 12px; border-radius: 8px; margin-bottom: 10px"
          >
            <div style="display:flex;justify-content:space-between">
              <span>{{ i+1 }}</span>
              <button type="button" @click="removeHistoryEvent(i)" class="btn btn-sm btn-delete">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="form-group">
              <label>Год</label>
              <input type="text" v-model="ev.year">
            </div>
            <div class="form-group">
              <label>Заголовок</label>
              <input type="text" v-model="ev.title">
            </div>
            <div class="form-group">
              <label>Описание</label>
              <textarea v-model="ev.description" rows="2"></textarea>
            </div>
          </div>
          <button type="button" @click="addHistoryEvent" class="btn btn-secondary">
            <i class="fas fa-plus"></i>
            Добавить
          </button>
        </div>
      </template>
      <!-- stats -->
      <template v-if="blockForm.type==='stats'">
        <div class="form-group">
          <label>Статистика</label>
          <div v-for="(s,i) in blockForm.settings.stats" :key="i" style="background:rgba(255,255,255,.05);padding:12px;border-radius:8px;margin-bottom:10px">
            <div style="display:flex;justify-content:space-between">
              <span>{{ i+1 }}</span>
              <button type="button" @click="removeStat(i)" class="btn btn-sm btn-delete">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="form-group">
              <label>Число</label>
              <input type="text" v-model="s.number">
            </div>
            <div class="form-group">
              <label>Подпись</label>
              <input type="text" v-model="s.label">
            </div>
          </div>
          <button type="button" @click="addStat" class="btn btn-secondary">
            <i class="fas fa-plus"></i>
            Добавить
          </button>
        </div>
      </template>
      <!-- text / footer -->
      <template v-if="blockForm.type==='text' || blockForm.type==='footer'">
        <div class="form-group">
          <label>Содержимое</label>
          <textarea v-model="blockForm.content" rows="6"></textarea>
        </div>
      </template>
      <!-- products -->
      <template v-if="blockForm.type==='products'">
        <div class="form-group">
          <label>Описание</label>
          <textarea v-model="blockForm.content" rows="3"></textarea>
        </div>
      </template>
      <!-- projects -->
      <template v-if="blockForm.type==='projects'">
        <div class="form-group">
          <label>Проекты</label>
          <div v-for="(proj, pi) in (blockForm.settings.projects || [])" :key="pi"
               style="background:rgba(255,255,255,.05);padding:14px;border-radius:8px;margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;margin-bottom:10px">
              <strong style="color:var(--primary)">Проект {{ pi + 1 }}</strong>
              <button type="button" @click="removeProject(pi)" class="btn btn-sm btn-delete">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;align-items:start">
              <div class="form-group" style="margin:0">
                <label style="font-size:11px">Иконка</label>
                <div class="proj-icon-toggle">
                  <button type="button"
                          :class="['proj-icon-btn', { active: proj.iconType === 'text' }]"
                          @click="proj.iconType = 'text'"
                  >
                    <i class="fas fa-font"></i> Текст
                  </button>
                  <button type="button"
                          :class="['proj-icon-btn', { active: proj.iconType === 'fa' }]"
                          @click="proj.iconType = 'fa'"
                  >
                    <i class="fas fa-icons"></i> FA
                  </button>
                  <button type="button"
                          :class="['proj-icon-btn', { active: proj.iconType === 'image' }]"
                          @click="proj.iconType = 'image'"
                  >
                    <i class="fas fa-image"></i> Фото
                  </button>
                </div>
                <template v-if="proj.iconType === 'text' || !proj.iconType">
                  <input type="text"
                         v-model="proj.icon"
                         placeholder="🚀"
                         style="text-align: center; font-size: 20px; margin-top: 6px"
                  >
                </template>
                <template v-else-if="proj.iconType === 'fa'">
                  <div style="display: flex; gap: 6px; align-items: center; margin-top: 6px">
                    <span style="font-size: 22px; width: 36px; text-align: center">
                      <i v-if="proj.icon" :class="proj.icon"></i>
                      <span v-else style="color: #888; font-size: 13px">—</span>
                    </span>
                    <button type="button"
                            @click="openProjectIconPicker(pi)"
                            class="btn btn-secondary btn-sm"
                            style="flex: 1">
                      <i class="fas fa-search"></i>
                      Выбрать
                    </button>
                  </div>
                </template>
                <template v-else-if="proj.iconType === 'image'">
                  <div style="margin-top:6px">
                    <img v-if="proj.icon"
                         :src="proj.icon"
                         style="height: 36px; border-radius: 4px; display: block; margin-bottom: 4px"
                    >
                    <input type="file"
                           :id="'proj-icon-'+pi"
                           @change="handleProjectIconUpload($event, pi)"
                           accept="image/*"
                           style="display: none"
                    >
                    <label :for="'proj-icon-'+pi"
                           class="btn btn-secondary btn-sm"
                           style="cursor: pointer; display: inline-flex; gap:6px; align-items: center"
                    >
                      <i class="fas fa-upload"></i>
                      {{ proj.icon ? 'Изменить' : 'Загрузить' }}
                    </label>
                  </div>
                </template>
              </div>
              <div class="form-group" style="margin:0">
                <label style="font-size:11px">Название</label>
                <input type="text" v-model="proj.title" placeholder="Название проекта">
              </div>
            </div>
            <div class="form-group">
              <label style="font-size:11px">Описание</label>
              <textarea v-model="proj.description" rows="2" placeholder="Краткое описание"></textarea>
            </div>
            <div class="form-group" style="display: flex; gap: 2rem">
              <label>Цвет карточки проекта</label>
              <color-picker :model-value="proj.color" @update:model-value="val => proj.color = val"/>
            </div>
            <div class="form-group">
              <label style="font-size:11px">Технологии <span style="color:#888">(через запятую)</span></label>
              <input type="text" v-model="proj.tech">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <div class="form-group" style="margin:0">
                <label style="font-size:11px">GitHub</label>
                <input type="url" v-model="proj.github" placeholder="https://github.com/...">
              </div>
              <div class="form-group" style="margin:0">
                <label style="font-size:11px">Demo</label>
                <input type="url" v-model="proj.demo" placeholder="https://...">
              </div>
              <div class="form-group" style="margin:0">
                <label style="font-size:11px">Сайт</label>
                <input type="url" v-model="proj.site" placeholder="https://...">
              </div>
              <div class="form-group" style="margin:0">
                <label style="font-size:11px">GitHub 2 (доп.)</label>
                <input type="url" v-model="proj.github2" placeholder="https://github.com/...">
              </div>
            </div>
            <div v-if="proj.github2" class="form-group" style="margin-top:8px">
              <label style="font-size:11px">Название GitHub 2</label>
              <input type="text" v-model="proj.github2_title" placeholder="Репозиторий desktop">
            </div>
            <div class="form-group" style="margin-top:8px">
              <label style="font-size:11px">Скриншоты</label>
              <div v-if="proj.screenshots && proj.screenshots.length" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">
                <div v-for="(src, si) in proj.screenshots" :key="si" style="position:relative;width:80px;height:60px">
                  <img :src="src" style="width:80px;height:60px;object-fit:cover;border-radius:4px;border:1px solid rgba(255,255,255,.1)">
                  <button type="button" @click="removeProjectScreenshot(pi, si)" style="position:absolute;top:2px;right:2px;background:rgba(220,50,50,.85);border:none;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0">
                    <i class="fas fa-times" style="font-size:9px;color:#fff"></i>
                  </button>
                </div>
              </div>
              <label class="btn btn-secondary" style="cursor:pointer;font-size:12px;padding:6px 12px">
                <input type="file" accept="image/*" multiple style="display:none" @change="handleProjectScreenshotsUpload($event, pi)">
                <i class="fas fa-images"></i> Добавить скриншоты
              </label>
            </div>
          </div>
          <button type="button" @click="addProject" class="btn btn-secondary">
            <i class="fas fa-plus"></i>
            Добавить проект
          </button>
        </div>
      </template>
      <!-- buttons / info_buttons -->
      <template v-if="blockForm.type==='buttons' || blockForm.type==='info_buttons'">
        <div class="form-group">
          <label>Кнопки</label>
          <div v-for="(btn,i) in blockForm.settings.buttons"
               :key="i"
               style="background: rgba(255,255,255,.05); padding: 12px; border-radius: 8px; margin-bottom: 10px"
          >
            <div style="display: flex; justify-content: space-between">
              <span>{{ i+1 }}</span>
              <button type="button" @click="removeButton(i)" class="btn btn-sm btn-delete">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="form-group">
              <label>Текст</label>
              <input type="text" v-model="btn.text">
            </div>
            <div class="form-group">
              <label>Тип</label>
              <select v-model="btn.linkType" @change="btn.link=''">
                <option value="page">Страница</option>
                <option value="section">Секция</option>
                <option value="url">URL</option>
              </select>
            </div>
            <div v-if="btn.linkType==='page'" class="form-group">
              <label>Страница</label>
              <select v-model="btn.link">
                <option value="">Выберите</option>
                <option v-for="pg in pages" :key="pg.id" :value="pg.slug">{{ pg.title }}</option>
              </select>
            </div>
            <div v-if="btn.linkType==='section'" class="form-group">
              <label>ID секции</label>
              <input type="text" v-model="btn.link" placeholder="products, features...">
            </div>
            <div v-if="btn.linkType==='url'" class="form-group">
              <label>URL</label>
              <input type="url" v-model="btn.link">
            </div>
            <div v-if="blockForm.type==='buttons'" class="form-group">
              <label>Стиль</label>
              <select v-model="btn.style">
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="outline">Outline</option>
              </select>
            </div>
          </div>
          <button type="button" @click="addButton" class="btn btn-secondary">
            <i class="fas fa-plus"></i>
            Добавить кнопку
          </button>
        </div>
      </template>
      <!-- contact -->
      <template v-if="blockForm.type==='contact'">
        <div class="form-group">
          <label>Email</label>
          <input type="email" v-model="blockForm.settings.email">
        </div>
        <div class="form-group">
          <label>Телефон</label>
          <input type="tel" v-model="blockForm.settings.phone">
        </div>
        <div class="form-group">
          <label>Адрес</label>
          <textarea v-model="blockForm.settings.address" rows="2"></textarea>
        </div>
        <div v-if="blockForm.settings.socialLinks" class="form-group">
          <label>Соцсети</label>
          <div class="form-group">
            <label>Instagram</label>
            <input type="url" v-model="blockForm.settings.socialLinks.instagram">
          </div>
          <div class="form-group">
            <label>TikTok</label>
            <input type="url" v-model="blockForm.settings.socialLinks.tiktok">
          </div>
          <div class="form-group">
            <label>Telegram</label>
            <input type="url" v-model="blockForm.settings.socialLinks.telegram">
          </div>
        </div>
      </template>
      <!-- actual -->
      <template v-if="blockForm.type==='actual'">
        <div class="form-group">
          <label>Акции</label>
          <div v-for="(promo,pi) in blockForm.settings.promotions" :key="pi" style="background:rgba(255,255,255,.05);padding:12px;border-radius:8px;margin-bottom:10px">
            <div style="display:flex;justify-content:space-between">
              <span>{{ pi+1 }}</span>
              <button type="button" @click="removePromotion(pi)" class="btn btn-sm btn-delete">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="form-group">
              <label>Изображение</label>
              <div v-if="promo.image">
                <img :src="promo.image" style="max-height: 80px; border-radius: 4px">
                <button type="button"
                        @click="removePromotionImage(pi)"
                        class="btn btn-sm btn-delete"
                        style="margin-left: 8px"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <input type="file"
                     :id="'promo-img-'+pi"
                     @change="handlePromotionImageUpload($event,pi)"
                     accept="image/*"
                     style="display: none"
              >
              <label :for="'promo-img-'+pi" class="btn btn-secondary" style="cursor: pointer">
                <i class="fas fa-upload"></i>
                {{ promo.image?'Изменить':'Загрузить' }}
              </label>
            </div>
            <div class="form-group">
              <label>Заголовок</label>
              <input type="text" v-model="promo.title">
            </div>
            <div class="form-group">
              <label>Описание</label>
              <textarea v-model="promo.description" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label>Товары</label>
              <div v-for="(link,li) in (promo.links||[])" :key="li" style="background:rgba(255,255,255,.05);padding:8px;border-radius:6px;margin-bottom:8px">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                  <span>Товар {{ li+1 }}</span>
                  <button type="button" @click="removeLink(pi,li)" class="btn btn-sm btn-delete">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <select :value="getPromoLinkProductId(link)"
                        @change="onPromoLinkProductChange($event,pi,li)"
                        style="width: 100%; margin-bottom: 6px"
                >
                  <option value="">Выберите товар</option>
                  <option v-for="p in Object.values(getProductsObject())" :key="p.id" :value="p.id">
                    {{ p.name }}
                  </option>
                </select>
                <input type="text"
                       v-model="promo.links[li].title"
                       placeholder="Заголовок ссылки"
                       style="width:100%;margin-bottom:4px"
                >
                <input type="text"
                       v-model="promo.links[li].description"
                       placeholder="Описание"
                       style="width:100%"
                >
              </div>
              <button type="button" @click="addLink(pi)" class="btn btn-secondary btn-sm">
                <i class="fas fa-plus"></i>
                Добавить товар
              </button>
            </div>
          </div>
          <button type="button" @click="addPromotion" class="btn btn-secondary">
            <i class="fas fa-plus"></i>
            Добавить акцию
          </button>
        </div>
      </template>
      <!-- custom -->
      <template v-if="blockForm.type==='custom'">
        <div class="form-group">
          <label>Anchor ID <span style="color:#888;font-size:12px">(необязательно, для навигации)</span></label>
          <input type="text" v-model="blockForm.settings.anchorId" placeholder="my-section">
        </div>
        <div class="form-group">
          <label>Содержимое блока</label>
          <div class="editor-controls" style="margin-bottom:10px">
            <button type="button" @click.prevent="toggleCustomViewMode" class="btn btn-secondary">
              <i :class="customViewMode==='visual'?'fas fa-code':'fas fa-eye'"></i>
              {{ customViewMode==='visual' ? 'HTML-режим' : 'Визуальный режим' }}
            </button>
          </div>
          <div v-if="customViewMode==='visual'" class="custom-visual-editor">
            <div class="custom-elements-sidebar">
              <h4>Элементы</h4>
              <div v-for="el in availableElements"
                   :key="el.type"
                   class="element-item"
                   draggable="true"
                   @dragstart="startDragCustomAvail(el,$event)"
              >
                <i :class="el.icon"></i>
                <span style="flex: 1">{{ el.label }}</span>
                <button type="button" @click.stop="addCustomElement(el)" class="btn-icon" title="Добавить">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            </div>
            <div class="custom-preview-area"
                 @dragover.prevent
                 @drop.prevent="onCustomPreviewDrop"
                 @dragleave.prevent="customDraggingElement=null"
            >
              <div class="preview-header">
                <span>Предпросмотр</span>
                <small v-if="!customElements.length" style="color:#888"> — перетащите элементы</small>
              </div>
              <div class="custom-elements-container">
                <div v-for="(el,i) in customElements" :key="el.id" class="custom-page-element"
                     :class="{ selected: customSelectedElement?.id===el.id }"
                     @click="selectCustomElement(el)" draggable="true"
                     @dragstart="startDragCustomEl(el,$event)"
                     @dragover.prevent="onCustomElDragOver(i,$event)"
                     @drop.prevent="onCustomElDrop(i,$event)">
                  <div class="element-controls">
                    <button @click.stop="moveCustomElementUp(i)"
                            class="btn-icon"
                            :disabled="i===0"
                    >
                      <i class="fas fa-arrow-up"></i>
                    </button>
                    <button @click.stop="moveCustomElementDown(i)"
                            class="btn-icon"
                            :disabled="i===customElements.length-1"
                    >
                      <i class="fas fa-arrow-down"></i>
                    </button>
                    <button @click.stop="duplicateCustomElement(i)"
                            class="btn-icon"
                            title="Дублировать"
                    >
                      <i class="fas fa-copy"></i>
                    </button>
                    <button @click.stop="removeCustomElement(i)"
                            class="btn-icon btn-delete"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                  <div class="element-content" v-html="renderCustomElement(el)"></div>
                </div>
                <div v-if="!customElements.length" class="empty-preview">
                  <i class="fas fa-mouse-pointer" style="font-size: 48px; opacity: 0.5; margin-bottom: 15px"></i>
                  <p>Перетащите элементы</p>
                </div>
              </div>
            </div>
            <div v-if="customSelectedElement" class="custom-element-panel">
              <div class="panel-header">
                <h4>{{ getCustomElementLabel(customSelectedElement.type) }}</h4>
                <button @click="customSelectedElement=null" class="btn-icon">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="panel-content">
                <div v-if="customSelectedElement.type==='heading'" class="form-group">
                  <label>Уровень</label>
                  <select v-model="customSelectedElement.level" @change="updateCustomElementContent">
                    <option :value="1">H1</option>
                    <option :value="2">H2</option>
                    <option :value="3">H3</option>
                    <option :value="4">H4</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Содержимое</label>
                  <textarea v-if="customSelectedElement.type!=='image' && customSelectedElement.type!=='list'"
                            v-model="customSelectedElement.content"
                            @input="updateCustomElementContent"
                            rows="5"
                  ></textarea>
                  <div v-else-if="customSelectedElement.type==='list'">
                    <select v-model="customListIsOrdered" @change="rebuildCustomListHtml" style="width:100%;margin-bottom:8px">
                      <option :value="false">Маркированный (ul)</option>
                      <option :value="true">Нумерованный (ol)</option>
                    </select>
                    <div v-for="(item,idx) in customListItems"
                         :key="idx"
                         style="display: flex; gap: 6px; margin-bottom: 6px; align-items: center"
                    >
                      <input type="text"
                             :value="item"
                             @input="customListItems[idx]=$event.target.value; rebuildCustomListHtml()"
                             placeholder="Элемент"
                             style="flex: 1"
                      >
                      <button type="button"
                              @click="removeCustomListItem(idx)"
                              class="btn-icon btn-delete"
                              :disabled="customListItems.length<=1">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                    <button type="button" @click="addCustomListItem" class="btn btn-secondary" style="width:100%;margin-top:4px">
                      <i class="fas fa-plus"></i>
                      Добавить
                    </button>
                  </div>
                  <div v-else>
                    <input type="text"
                           v-model="customSelectedElement.content"
                           @input="updateCustomElementContent"
                           placeholder="URL"
                    >
                    <input type="file"
                           @change="handleCustomImageUpload"
                           accept="image/*"
                           ref="customImgInput"
                           style="display: none"
                    >
                    <button type="button"
                            @click="$refs.customImgInput.click()"
                            class="btn btn-secondary"
                            style="margin-top: 6px"
                    >
                      <i class="fas fa-upload"></i>
                      Загрузить
                    </button>
                  </div>
                </div>
                <div v-if="customSelectedElement.type==='button'" class="form-group">
                  <label>Ссылка</label>
                  <input type="text"
                         v-model="customSelectedElement.link"
                         @input="updateCustomElementContent"
                         placeholder="/page или #section"
                  >
                </div>
                <div v-if="customSelectedElement.type==='button'" class="form-group">
                  <label>Стиль</label>
                  <select v-model="customSelectedElement.style" @change="updateCustomElementContent">
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="outline">Outline</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <textarea v-else
                    v-model="blockForm.content"
                    rows="12"
                    placeholder="HTML код..."
                    style="font-family:monospace;font-size:13px;width:100%;padding:12px;background:var(--background-secondary);border:none;color:var(--text-primary);min-height:200px;resize:vertical"
          ></textarea>
        </div>
      </template>
      <!-- footer -->
      <div v-if="blockForm.type !== 'footer' && blockForm.type !== 'info_buttons'" class="form-group">
        <label>
          <input type="checkbox" v-model="blockForm.is_active">
          Активен
        </label>
      </div>
      <div v-if="blockError" class="error-message">{{ blockError }}</div>
      <div v-if="blockSuccess" class="success-message">{{ blockSuccess }}</div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="blockLoading">
          {{ editingBlock ? 'Сохранить' : 'Добавить' }}
        </button>
        <button type="button" @click="closeBlockModal" class="btn btn-secondary">
          Отмена
        </button>
      </div>
    </form>
  </Modal>
  <!-- features -->
  <IconPicker
      v-model="showIconPicker"
      :initial-icon="currentIconTarget?.target?.[currentIconTarget?.property] || ''"
      @select="confirmIconSelection"
  />
  <!-- projects -->
  <IconPicker
      v-model="showProjectIconPicker"
      :initial-icon="getProjectIconInitial(currentProjectIconIndex)"
      @select="onProjectIconSelected"
  />
</template>

<style scoped>
.custom-components-section {
  margin-top: 20px;
  border-top: 1px dashed var(--border-medium);
  padding-top: 15px;
}
.custom-components-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-additional);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.custom-component-item {
  border-left: 3px solid rgba(99, 102, 241, 0.4);
}
.blocks-preview-frame {
  margin-top: 16px;
  border: 1px solid var(--border-medium);
  border-radius: 10px;
  overflow: hidden;
  background: var(--background);
}
.blocks-preview-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: var(--background-secondary);
  border-bottom: 1px solid var(--border-light);
  font-size: 13px;
  color: var(--primary);
  font-weight: 600;
}
.blocks-preview-content {
  overflow-y: auto;
  max-height: 80vh;
}
.page-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 16px;
  margin-bottom: 4px;
  border-bottom: 2px solid var(--border-light);
  padding-bottom: 0;
}
.page-tab {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  padding: 8px 16px;
  color: var(--text-additional);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.page-tab:hover {
  color: var(--text-primary);
  background: var(--background-secondary);
}
.page-tab.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
  font-weight: 600;
}
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
.proj-icon-toggle {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}
.proj-icon-btn {
  flex: 1;
  padding: 4px 6px;
  font-size: 11px;
  background: var(--background-secondary);
  border: 1px solid var(--border-medium);
  border-radius: 4px;
  color: var(--text-additional);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.proj-icon-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--text-dark);
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
.custom-visual-editor {
  display: flex;
  height: 500px;
  border: 1px solid var(--border-medium);
  border-radius: 6px;
  overflow: hidden;
}
.custom-elements-sidebar {
  width: 190px;
  background: var(--background-secondary);
  border-right: 1px solid var(--border-light);
  overflow-y: auto;
  padding: 12px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.custom-elements-sidebar h4 {
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.custom-preview-area {
  flex: 1;
  background: var(--background-secondary);
  overflow-y: auto;
  padding: 16px;
}
.custom-elements-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100px;
  margin-bottom: 60px;
}
.custom-page-element {
  position: relative;
  background: var(--background-secondary);
  border: 2px solid transparent;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.custom-page-element:hover {
  border-color: var(--border-medium);
}
.custom-page-element.selected {
  border-color: var(--primary);
  background: var(--hover-secondary);
}
.custom-page-element.drag-over-top {
  border-top-color: var(--primary);
  border-top-width: 3px;
}
.custom-page-element.drag-over-bottom {
  border-bottom-color: var(--primary);
  border-bottom-width: 3px;
}
.custom-element-panel {
  width: 260px;
  background: var(--background-secondary);
  border-left: 1px solid var(--border-light);
  overflow-y: auto;
  padding: 14px;
  flex-shrink: 0;
}
@media (max-width: 768px) {
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
.rich-editor h1 {
  font-size: 2em;
}
.rich-editor h2 {
  font-size: 1.75em;
}
.rich-editor h3 {
  font-size: 1.5em;
}
.rich-editor p {
  margin: 8px 0;
}
.rich-editor ul, .rich-editor ol {
  margin: 8px 0; padding-left: 24px;
}
.rich-editor li {
  margin: 4px 0;
}
.rich-editor a {
  color: var(--primary);
  text-decoration: underline;
}
.rich-editor a:hover {
  color: var(--text-simple);
}
.rich-editor img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 8px 0;
}
.rich-editor strong, .rich-editor b {
  font-weight: 600;
}
.rich-editor em, .rich-editor i {
  font-style: italic;
}
.rich-editor u {
  text-decoration: underline;
}
.rich-editor h1, .rich-editor h2, .rich-editor h3, .rich-editor h4, .rich-editor h5, .rich-editor h6 {
  margin: 16px 0 8px 0;
  color: var(--primary);
  font-weight: 600;
}
.editor-controls {
  padding: 12px 16px;
  background: var(--background-secondary);
  border-bottom: 1px solid var(--border-medium);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.elements-sidebar h4 {
  color: var(--primary);
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.element-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--background-secondary);
  border: 1px solid var(--border-light);
  border-radius: 6px;
  color: var(--text-primary);
  cursor: move;
  transition: all 0.2s ease;
  user-select: none;
}
.element-item:hover {
  background: var(--background-secondary);
  border-color: var(--border-strong);
  transform: translateX(4px);
}
.element-item:active {
  opacity: 0.7;
}
.element-item i {
  color: var(--primary);
  width: 20px;
  text-align: center;
}
.preview-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-light);
}
.preview-header span {
  color: var(--primary);
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.element-controls {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 10;
}
.page-element:hover .element-controls,
.page-element.selected .element-controls {
  opacity: 1;
}
.btn-icon {
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid var(--border-medium);
  border-radius: 4px;
  color: var(--text-primary);
  padding: 6px 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
}
.btn-icon:hover:not(:disabled) {
  background: var(--background-additional);
  border-color: var(--border-alternative);
}
.btn-icon:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-icon.btn-delete:hover:not(:disabled) {
  background: var(--warning);
  border-color: var(--warning-dark);
}
.element-content {
  padding-right: 80px;
  color: var(--text-primary);
}
.element-content h1, .element-content h2, .element-content h3,
.element-content h4, .element-content h5, .element-content h6 {
  color: var(--primary);
  margin: 0 0 8px 0;
}
.element-content p {
  margin: 0;
  line-height: 1.6;
}
.element-content img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}
.element-content .btn {
  display: inline-block;
  margin: 0;
}
.empty-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--text-additional);
  text-align: center;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-medium);
}
.panel-header h4 {
  color: var(--primary);
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.panel-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.panel-content .form-group {
  margin-bottom: 0;
}
.panel-content label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--text-additional-light);
}
.panel-content input, .panel-content textarea, .panel-content select {
  width: 100%;
  padding: 8px 12px;
  background: var(--background-secondary);
  border: 1px solid var(--border-medium);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 14px;
}
.panel-content textarea {
  resize: vertical;
  min-height: 100px;
}
.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
}
@media (max-width: 768px) {
  .element-item {
    flex: 1 1 calc(50% - 4px);
    min-width: 140px;
  }
  .element-content {
    padding-right: 0;
    padding-top: 40px;
  }
  .form-actions {
    flex-direction: column;
    width: fit-content;
  }
  .form-actions .btn {
    width: 100%;
  }
}
</style>