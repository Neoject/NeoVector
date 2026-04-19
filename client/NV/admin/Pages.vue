<script>
import { formatDate, isMobileDevice } from './service'
import Modal from "../components/Modal.vue";
import {api} from "../../../server/api";

export default {
  name: 'Pages',
  components: {Modal},
  emits: ['update:page'],
  data() {
    return {
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
      listItems: [],
      listIsOrdered: false,
      availableElements: [
        { type: 'heading', label: 'Заголовок', icon: 'fas fa-heading', defaultContent: 'Новый заголовок' },
        { type: 'paragraph', label: 'Абзац', icon: 'fas fa-paragraph', defaultContent: 'Новый абзац текста' },
        { type: 'image', label: 'Изображение', icon: 'fas fa-photo-film', defaultContent: '' },
        { type: 'list', label: 'Список', icon: 'fas fa-list', defaultContent: '<ul><li>Элемент 1</li></ul>' },
        { type: 'button', label: 'Кнопка', icon: 'fas fa-hand-pointer', defaultContent: 'Кнопка' },
        { type: 'divider', label: 'Разделитель', icon: 'fas fa-minus', defaultContent: '<hr>' },
      ],
    }
  },
  watch: {
    selectedElement(el) {
      if (el?.type === 'list') this.parseListItems(el.content);
    },
  },
  mounted() {
    this.loadPages()
  },
  methods: {
    isMobileDevice,
    formatDate,
    escapeHtml(t) {
      const d = document.createElement('div')
      d.textContent = t
      return d.innerHTML
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
      } catch(e) {
        console.error(e);
      }
    },
    openAddPageModal() {
      this.pageForm = { slug: '', title: '', content: '', meta_title: '', meta_description: '', is_published: true, is_main_page: false, navigation_buttons: [] }
      this.pageElements = []
      this.selectedElement = null
      this.viewMode = 'visual'
      this.pageError = ''
      this.pageSuccess = ''
      if (!this.isMobileDevice()) this.showAddPageModal = true
      else this.$emit('update:page', 'page')
    },
    editPage(page) {
      this.editingPage = page
      const navBtns = Array.isArray(page.navigation_buttons) ? page.navigation_buttons : (typeof page.navigation_buttons === 'string' ? JSON.parse(page.navigation_buttons || '[]') : [])
      this.pageForm = {
        slug: page.slug || '', title: page.title || '', content: page.content || '', meta_title: page.meta_title || '',
        meta_description: page.meta_description || '', is_published: !!page.is_published, is_main_page: !!page.is_main_page, navigation_buttons: navBtns,
      }
      this.pageElements = this.parseHTMLToElements(page.content || '')
      this.selectedElement = null
      this.viewMode = 'visual'
      this.pageError = ''
      this.pageSuccess = ''
      if (!this.isMobileDevice()) this.showAddPageModal = true
      else this.$emit('update:page', 'page')
    },
    closePageModal() {
      if (!this.isMobileDevice()) this.showAddPageModal = false
      else this.$emit('update:page', '')
      this.editingPage = null
      this.pageForm = { slug: '', title: '', content: '', meta_title: '', meta_description: '', is_published: true, is_main_page: false, navigation_buttons: [] }
      this.pageElements = []
      this.selectedElement = null
      this.pageError = ''
      this.pageSuccess = ''
    },
    async savePage() {
      if (this.viewMode === 'visual') this.pageForm.content = this.elementsToHTML();
      this.pageLoading = true;
      this.pageError = '';
      this.pageSuccess = '';
      try {
        const body = {
          slug: (this.pageForm.slug || '').trim(),
          title: (this.pageForm.title || '').trim(),
          content: (this.pageForm.content || '').trim(),
          meta_title: (this.pageForm.meta_title || '').trim(),
          meta_description: (this.pageForm.meta_description || '').trim(),
          is_published: this.pageForm.is_published ? 1 : 0,
          is_main_page: this.pageForm.is_main_page ? 1 : 0,
          navigation_buttons: this.pageForm.navigation_buttons || [],
        };
        const r = this.editingPage
            ? await api.updatePage(this.editingPage.id, body)
            : await api.addPage(body);
        const res = await r.json();
        if (!r.ok || res.error) throw new Error(res.error || 'Ошибка');
        this.pageSuccess = 'Сохранено';
        await this.loadPages();
        setTimeout(() => this.closePageModal(), 1500);
      } catch (e) { this.pageError = e.message; }
      this.pageLoading = false;
    },
    async deletePage(id) {
      if (!confirm('Удалить страницу?')) return;
      const r = await api.deletePage(id);
      if (r.ok) await this.loadPages();
    },
    toggleViewMode() {
      if (this.viewMode === 'visual') {
        this.pageForm.content = this.elementsToHTML()
        this.viewMode = 'html'
      } else {
        this.pageElements = this.parseHTMLToElements(this.pageForm.content || '')
        this.selectedElement = null
        this.viewMode = 'visual'
      }
    },
    addElementToPage(tpl) {
      const nb = { id: Date.now() + Math.random(), type: tpl.type, content: tpl.defaultContent || '', level: tpl.type === 'heading' ? 2 : null, link: tpl.type === 'button' ? '' : null, style: tpl.type === 'button' ? 'primary' : null }
      this.pageElements.push(nb)
      this.selectedElement = nb
    },
    insertElementAt(idx, tpl) {
      const nb = { id: Date.now() + Math.random(), type: tpl.type, content: tpl.defaultContent || '', level: tpl.type === 'heading' ? 2 : null, link: tpl.type === 'button' ? '' : null, style: tpl.type === 'button' ? 'primary' : null }
      this.pageElements.splice(idx, 0, nb)
      this.selectedElement = nb
    },
    selectElement(el) { this.selectedElement = el },
    removeElement(idx) {
      if (confirm('Удалить?')) {
        if (this.selectedElement?.id === this.pageElements[idx].id) this.selectedElement = null
        this.pageElements.splice(idx, 1)
      }
    },
    moveElementUp(idx) {
      if (idx > 0) {
        const [el] = this.pageElements.splice(idx, 1)
        this.pageElements.splice(idx - 1, 0, el)
      }
    },
    moveElementDown(idx) {
      if (idx < this.pageElements.length - 1) {
        const [el] = this.pageElements.splice(idx, 1)
        this.pageElements.splice(idx + 1, 0, el)
      }
    },
    updateElementContent() {
      if (this.selectedElement) {
        const i = this.pageElements.findIndex(e => e.id === this.selectedElement.id)
        if (i !== -1) {
          this.pageElements[i] = { ...this.selectedElement }
          this.selectedElement = this.pageElements[i]
        }
      }
    },
    duplicateElement(idx) {
      const el = { ...this.pageElements[idx], id: Date.now() + Math.random() };
      this.pageElements.splice(idx + 1, 0, el);
      this.selectedElement = this.pageElements[idx + 1];
    },
    addNavButton() {
      if (!Array.isArray(this.pageForm.navigation_buttons)) this.pageForm.navigation_buttons = [];
      this.pageForm.navigation_buttons.push({ label: '', target: '' });
    },
    removeNavButton(idx) {
      this.pageForm.navigation_buttons.splice(idx, 1);
    },
    parseListItems(content) {
      const div = document.createElement('div');
      div.innerHTML = content || '<ul><li></li></ul>';
      this.listIsOrdered = !!div.querySelector('ol');
      this.listItems = Array.from(div.querySelectorAll('li')).map(li => li.textContent || '');
      if (!this.listItems.length) this.listItems = [''];
    },
    rebuildListHtml() {
      const tag = this.listIsOrdered ? 'ol' : 'ul';
      const html = `<${tag}>${this.listItems.map(i => `<li>${i}</li>`).join('')}</${tag}>`;
      if (this.selectedElement) {
        this.selectedElement.content = html;
        this.updateElementContent();
      }
    },
    addListItem() {
      this.listItems.push('');
      this.rebuildListHtml();
    },
    removeListItem(idx) {
      this.listItems.splice(idx, 1);
      if (!this.listItems.length) this.listItems = [''];
      this.rebuildListHtml();
    },
    async handleImageUpload(e) {
      const file = e.target.files?.[0];
      if (!file || !this.selectedElement) return;
      const fd = new FormData();
      fd.append('image', file);
      const r = await api.uploadBackground(fd);

      if (r.ok) {
        const res = await r.json();
        this.selectedElement.content = res.url;
        this.updateElementContent();
      }
    },
    startDragElement(el, e) { this.draggingElement = { ...el, isNew: true }; e.dataTransfer.effectAllowed = 'copy' },
    startDragPageElement(el, e) { this.draggingElement = { ...el, isNew: false, index: this.pageElements.findIndex(pe => pe.id === el.id) }; e.dataTransfer.effectAllowed = 'move' },
    onPreviewDragOver(e) { e.preventDefault() },
    onPreviewDrop(e) {
      e.preventDefault()
      if (this.draggingElement?.isNew) this.addElementToPage(this.draggingElement)
      this.draggingElement = null
    },
    onPreviewDragLeave(e) { if (!e.currentTarget.contains(e.relatedTarget)) this.draggingElement = null },
    onElementDragOver(idx, e) {
      e.preventDefault()
      e.stopPropagation()
      document.querySelectorAll('.page-element').forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom'))
      const rect = e.currentTarget.getBoundingClientRect()
      e.currentTarget.classList.add(e.clientY < rect.top + rect.height / 2 ? 'drag-over-top' : 'drag-over-bottom')
    },
    onElementDrop(idx, e) {
      e.preventDefault()
      e.stopPropagation()
      document.querySelectorAll('.page-element').forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom'))
      if (!this.draggingElement) return
      const rect = e.currentTarget.getBoundingClientRect()
      const after = e.clientY >= rect.top + rect.height / 2
      const targetIdx = after ? idx + 1 : idx
      if (this.draggingElement.isNew) this.insertElementAt(targetIdx, this.draggingElement)
      else {
        const oi = this.draggingElement.index
        const ni = oi < targetIdx ? targetIdx - 1 : targetIdx
        if (oi !== ni) {
          const [el] = this.pageElements.splice(oi, 1)
          this.pageElements.splice(ni, 0, el)
        }
      }
      this.draggingElement = null
    },
    renderElement(el) {
      if (el.type === 'heading') return `<h${el.level || 2}>${el.content || 'Заголовок'}</h${el.level || 2}>`
      if (el.type === 'paragraph') return `<p>${el.content || 'Абзац'}</p>`
      if (el.type === 'image') return el.content ? `<img src="${el.content}" style="max-width:100%">` : '<div style="padding:40px;text-align:center;opacity:.5"><i class="fas fa-image" style="font-size:48px"></i></div>'
      if (el.type === 'list') return el.content || '<ul><li>Элемент</li></ul>'
      if (el.type === 'button') return `<a href="${el.link || '#'}" class="btn btn-${el.style || 'primary'}">${el.content || 'Кнопка'}</a>`
      if (el.type === 'divider') return '<hr>'
      return el.content || ''
    },
    getElementTypeLabel(type) {
      return this.availableElements.find(e => e.type === type)?.label || type
    },
    elementsToHTML() {
      return this.pageElements.map(el => {
        if (el.type === 'heading') return `<h${el.level || 2}>${this.escapeHtml(el.content || '')}</h${el.level || 2}>`
        if (el.type === 'paragraph') return `<p>${this.escapeHtml(el.content || '')}</p>`
        if (el.type === 'image') return el.content ? `<img src="${this.escapeHtml(el.content)}" style="max-width:100%">` : ''
        if (el.type === 'list') return el.content || ''
        if (el.type === 'button') return `<a href="${this.escapeHtml(el.link || '#')}" class="btn btn-${el.style || 'primary'}">${this.escapeHtml(el.content || '')}</a>`
        if (el.type === 'divider') return '<hr>'
        return this.escapeHtml(el.content || '')
      }).join('\n')
    },
    parseHTMLToElements(html) {
      if (!html?.trim()) return []
      const els = []
      const div = document.createElement('div')
      div.innerHTML = html.trim()
      let eid = Date.now()
      const process = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const t = node.textContent.trim()
          if (t) els.push({ id: eid++, type: 'paragraph', content: t })
          return
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return
        const tag = node.tagName.toLowerCase()
        if (/^h[1-6]$/.test(tag)) {
          els.push({ id: eid++, type: 'heading', content: node.textContent.trim(), level: +tag[1] })
          return
        }
        if (tag === 'p') {
          const t = node.textContent.trim()
          if (t) els.push({ id: eid++, type: 'paragraph', content: t })
          return
        }
        if (tag === 'img') {
          els.push({ id: eid++, type: 'image', content: node.getAttribute('src') || '' })
          return
        }
        if (tag === 'ul' || tag === 'ol') {
          els.push({ id: eid++, type: 'list', content: node.outerHTML })
          return
        }
        if (tag === 'a' && node.classList.contains('btn')) {
          const style = node.classList.contains('btn-secondary') ? 'secondary' : node.classList.contains('btn-outline') ? 'outline' : 'primary'
          els.push({ id: eid++, type: 'button', content: node.textContent.trim(), link: node.getAttribute('href') || '#', style })
          return
        }
        if (tag === 'hr') {
          els.push({ id: eid++, type: 'divider', content: '<hr>' })
          return
        }
        Array.from(node.childNodes).forEach(child => {
          if (child.nodeType === Node.ELEMENT_NODE) process(child)
        })
      }
      Array.from(div.childNodes).forEach(process)
      return els
    },
  },
}
</script>

<template>
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
              <a :href="'/' + page.slug" target="_blank" class="btn btn-sm btn-secondary"><i class="fas fa-eye"></i></a>
              <button @click="editPage(page)" class="btn btn-sm btn-edit"><i class="fas fa-edit"></i></button>
              <button @click="deletePage(page.id)" class="btn btn-sm btn-delete"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </section>

  <Modal
      v-model="showAddPageModal"
      modal-id="pageModal"
      :title="editingPage ? 'Редактировать страницу' : 'Добавить страницу'"
      default-width="860px"
      default-height="720px"
      class="page-modal"
      @close="closePageModal"
  >
    <template #icon>
      <span class="modal-title-icon"><i class="fas fa-file"></i></span>
    </template>
    <form @submit.prevent="savePage">
      <div class="form-group"><label>URL (slug) *</label><input type="text" v-model="pageForm.slug" placeholder="about-us" required pattern="[a-z0-9\-_]+"></div>
      <div class="form-group"><label>Название *</label><input type="text" v-model="pageForm.title" required></div>
      <div class="form-group">
        <label>Содержимое</label>
        <div class="editor-controls" style="margin-bottom:10px">
          <button type="button" @click.prevent="toggleViewMode" class="btn btn-secondary">
            <i :class="viewMode==='visual'?'fas fa-code':'fas fa-eye'"></i>
            {{ viewMode==='visual' ? 'HTML-режим' : 'Визуальный режим' }}
          </button>
        </div>
        <div v-if="viewMode==='visual'" class="visual-editor-wrapper">
          <div class="elements-sidebar">
            <h4>Элементы</h4>
            <div v-for="el in availableElements" :key="el.type" class="element-item" draggable="true" @dragstart="startDragElement(el,$event)">
              <i :class="el.icon"></i>
              <span style="flex:1">{{ el.label }}</span>
              <button type="button" @click.stop="addElementToPage(el)" class="btn-icon" style="flex-shrink:0" title="Добавить"><i class="fas fa-plus"></i></button>
            </div>
          </div>
          <div class="page-preview-area" @dragover.prevent="onPreviewDragOver" @drop.prevent="onPreviewDrop" @dragleave.prevent="onPreviewDragLeave">
            <div class="preview-header"><span>Предпросмотр</span><small v-if="!pageElements.length" style="color:#888"> — перетащите элементы</small></div>
            <div class="page-elements-container">
              <div v-for="(el,i) in pageElements" :key="el.id" class="page-element"
                   :class="{ selected: selectedElement?.id===el.id }"
                   @click="selectElement(el)" draggable="true"
                   @dragstart="startDragPageElement(el,$event)"
                   @dragover.prevent="onElementDragOver(i,$event)"
                   @drop.prevent="onElementDrop(i,$event)">
                <div class="element-controls">
                  <button @click.stop="moveElementUp(i)" class="btn-icon" :disabled="i===0"><i class="fas fa-arrow-up"></i></button>
                  <button @click.stop="moveElementDown(i)" class="btn-icon" :disabled="i===pageElements.length-1"><i class="fas fa-arrow-down"></i></button>
                  <button @click.stop="duplicateElement(i)" class="btn-icon" title="Дублировать"><i class="fas fa-copy"></i></button>
                  <button @click.stop="removeElement(i)" class="btn-icon btn-delete"><i class="fas fa-trash"></i></button>
                </div>
                <div class="element-content" v-html="renderElement(el)"></div>
              </div>
              <div v-if="!pageElements.length" class="empty-preview">
                <i class="fas fa-mouse-pointer" style="font-size:48px;opacity:.5;margin-bottom:15px"></i>
                <p>Перетащите элементы</p>
              </div>
            </div>
          </div>
          <div v-if="selectedElement" class="element-editor-panel">
            <div class="panel-header">
              <h4>{{ getElementTypeLabel(selectedElement.type) }}</h4>
              <button @click="selectedElement=null" class="btn-icon">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="panel-content">
              <div v-if="selectedElement.type==='heading'" class="form-group">
                <label>Уровень</label>
                <select v-model="selectedElement.level" @change="updateElementContent">
                  <option :value="1">H1</option>
                  <option :value="2">H2</option>
                  <option :value="3">H3</option>
                  <option :value="4">H4</option>
                </select>
              </div>
              <div class="form-group">
                <label>Содержимое</label>
                <textarea v-if="selectedElement.type!=='image' && selectedElement.type!=='list'" v-model="selectedElement.content" @input="updateElementContent" rows="5"></textarea>
                <div v-else-if="selectedElement.type==='list'">
                  <div style="margin-bottom:8px">
                    <select v-model="listIsOrdered" @change="rebuildListHtml" style="width:100%">
                      <option :value="false">Маркированный список (ul)</option>
                      <option :value="true">Нумерованный список (ol)</option>
                    </select>
                  </div>
                  <div v-for="(item, idx) in listItems" :key="idx" style="display:flex;gap:6px;margin-bottom:6px;align-items:center">
                    <input type="text" :value="item" @input="listItems[idx]=$event.target.value; rebuildListHtml()" placeholder="Элемент списка" style="flex:1">
                    <button type="button" @click="removeListItem(idx)" class="btn-icon btn-delete" :disabled="listItems.length<=1">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                  <button type="button" @click="addListItem" class="btn btn-secondary" style="width:100%;margin-top:4px">
                    <i class="fas fa-plus"></i>
                    Добавить элемент
                  </button>
                </div>
                <div v-else>
                  <input type="text" v-model="selectedElement.content" @input="updateElementContent" placeholder="URL">
                  <input type="file" @change="handleImageUpload" accept="image/*" ref="elemImgInput" style="display:none">
                  <button type="button" @click="$refs.elemImgInput.click()" class="btn btn-secondary" style="margin-top:6px">
                    <i class="fas fa-upload"></i>
                    Загрузить
                  </button>
                </div>
              </div>
              <div v-if="selectedElement.type==='button'" class="form-group">
                <label>Ссылка</label>
                <input type="text" v-model="selectedElement.link" @input="updateElementContent" placeholder="/product?id=1 или #section">
              </div>
              <div v-if="selectedElement.type==='button'" class="form-group">
                <label>Стиль</label>
                <select v-model="selectedElement.style" @change="updateElementContent">
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="outline">Outline</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <textarea v-else v-model="pageForm.content" class="rich-editor-textarea" rows="15" placeholder="HTML-содержимое"></textarea>
      </div>
      <div class="form-group">
        <label>Meta Title</label>
        <input type="text" v-model="pageForm.meta_title">
      </div>
      <div class="form-group">
        <label>Meta Description</label>
        <textarea v-model="pageForm.meta_description" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label>
          Кнопки навигации
          <small style="color:var(--text-additional)">(отображаются в шапке на главной странице)</small>
        </label>
        <div v-for="(btn, i) in pageForm.navigation_buttons" :key="i" style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
          <input type="text" v-model="btn.label" placeholder="Текст кнопки" style="flex:1">
          <input type="text" v-model="btn.target" placeholder="Якорь (#section)" style="flex:1">
          <button type="button" @click="removeNavButton(i)" class="btn-icon btn-delete">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <button type="button" @click="addNavButton" class="btn btn-secondary">
          <i class="fas fa-plus"></i>
          Добавить кнопку
        </button>
      </div>
      <div class="form-group" style="display:flex;gap:20px;flex-wrap:wrap">
        <label><input type="checkbox" v-model="pageForm.is_published"> Опубликовано</label>
        <label><input type="checkbox" v-model="pageForm.is_main_page"> Главная страница</label>
      </div>
      <div v-if="pageError" class="error-message">{{ pageError }}</div>
      <div v-if="pageSuccess" class="success-message">{{ pageSuccess }}</div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="pageLoading">{{ editingPage ? 'Сохранить' : 'Создать' }}</button>
        <button type="button" @click="closePageModal" class="btn btn-secondary">Отмена</button>
      </div>
    </form>
  </Modal>
</template>

<style scoped>
.pages-table {
  overflow-x: auto;
  overflow-y: hidden;
}
table.pages-table {
  backdrop-filter: blur(10px);
  border: 2px solid var(--border-secondary);
  border-radius: 15px;
  padding: 4px;
  position: relative;
  min-width: 300px;
}
table.pages-table.pages-table-th {
  padding: unset;
  width: auto;
  background: var(--background);
}
table.pages-table td {
  padding: 0 0.8vw;
  background: var(--background);
  border: 1px solid var(--border-medium);
}
table.pages-table th:last-child,
table.pages-table td:last-child {
  position: sticky;
  right: 0;
  background: var(--background-table-last);
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
.rich-editor-textarea {
  width: 100%;
  padding: 12px 16px;
  background: var(--background-secondary);
  border: none;
  border-radius: 0;
  color: var(--text-primary);
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
  overflow: auto;
  min-height: 300px;
  max-height: 600px;
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
.visual-editor-wrapper {
  display: flex;
  height: 600px;
  position: relative;
}
.elements-sidebar {
  width: 220px;
  background: var(--background-secondary);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  overflow-y: auto;
  padding: 16px;
  flex-shrink: 0;
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
.page-preview-area {
  flex: 1;
  background: var(--background-secondary);
  overflow-y: auto;
  padding: 20px;
  position: relative;
  transition: all 0.3s ease;
}
.page-preview-area.drag-over {
  background: var(--background-secondary);
  border: 2px dashed var(--border-secondary);
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
.page-elements-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100px;
  margin-bottom: 8vh;
}
.page-element {
  position: relative;
  background: var(--background-secondary);
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
  cursor: pointer;
}
.page-element:hover {
  background: var(--background-secondary);
  border-color: var(--border-medium);
}
.page-element.selected {
  border-color: var(--primary);
  background: var(--hover-secondary);
  box-shadow: 0 0 0 2px var(--border-medium);
}
.page-element.drag-over-top {
  border-top-color: var(--primary);
  border-top-width: 3px;
}
.page-element.drag-over-bottom {
  border-bottom-color: var(--primary);
  border-bottom-width: 3px;
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
.element-editor-panel {
  width: 300px;
  background: var(--background-secondary);
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  overflow-y: auto;
  padding: 16px;
  flex-shrink: 0;
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
@media (max-width: 1024px) {
  .visual-editor-wrapper {
    flex-direction: column;
    height: auto;
    min-height: 600px;
  }
  .elements-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border-medium);
    max-height: 200px;
  }
  .element-editor-panel {
    width: 100%;
    border-left: none;
    border-top: 1px solid var(--border-medium);
    max-height: 300px;
  }
}
@media (max-width: 768px) {
  table.pages-table {
    overflow-x: auto;
    font-size: 14px;
  }
  table.pages-table th,
  table.pages-table td {
    padding: 10px 8px;
  }
  table.pages-table th:last-child,
  table.pages-table td:last-child {
    position: sticky;
    right: 0;
    background: var(--background-table-last);
    backdrop-filter: blur(10px);
    z-index: 10;
    min-width: 120px;
    width: 120px;
    border-left: 1px solid var(--border-light);
    vertical-align: middle;
    text-align: center;
  }
  table.pages-table th:last-child {
    background: var(--background-table-last);
    backdrop-filter: blur(10px);
  }
  table.pages-table tbody tr td:last-child {
    position: sticky;
    right: 0;
    background: var(--background-table-last);
    backdrop-filter: blur(10px);
    z-index: 5;
    border-left: 1px solid var(--border-light);
    min-width: 120px;
    width: 120px;
    vertical-align: middle;
    text-align: center;
  }
  table.pages-table td:last-child .actions-container {
    display: flex;
    gap: 8px;
    height: 100%;
    align-items: center;
    justify-content: center;
    min-height: 50px;
    flex-direction: column;
  }
  .visual-editor-wrapper {
    height: auto;
  }
  .element-item {
    flex: 1 1 calc(50% - 4px);
    min-width: 140px;
  }
  .page-preview-area {
    min-height: 400px;
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