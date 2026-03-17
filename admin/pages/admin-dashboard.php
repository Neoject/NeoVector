<div class="admin-dashboard">
    <main class="admin-main">
        <div class="container">
            <?php 
            $dashboardDir = __DIR__ . '/../dashboard/';
            include $dashboardDir . 'products.html'; 
            include $dashboardDir . 'blocks.html'; 
            include $dashboardDir . 'pages.html'; 
            ?>
            <template v-if="root.showContentModal">
                <teleport to="body">
                    <div class="modal content-modal" data-modal-id="contentModal"
                         @click.stop="root.bringModalToFront('contentModal')">
                        <div class="modal-toolbar"
                             @mousedown="root.startDragModal('contentModal', $event)"
                             style="cursor: move;">
                            <div class="control-btns">
                                <button @click.stop="root.toggleMinimize('contentModal')"
                                        class="action-btn"
                                        :title="root.isModalMinimized('contentModal') ? 'Восстановить' : 'Свернуть'">
                                    <i
                                            :class="root.isModalMinimized('contentModal') ? 'fas fa-window-restore' : 'fas fa-minus'"></i>
                                </button>
                                <button @click.stop="root.toggleMaximize('contentModal')"
                                        class="action-btn"
                                        :title="root.isModalMaximized('contentModal') ? 'Восстановить размер' : 'Развернуть'">
                                    <i
                                            :class="root.isModalMaximized('contentModal') ? 'fas fa-window-restore' : 'fas fa-window-maximize'"></i>
                                </button>
                                <button @click="root.closeContentModal" class="action-btn">
                                    <i @click="root.closeContentModal" class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div class="modal-header">
                            <h3>Редактирование контента главной страницы</h3>
                        </div>
                        <div class="modal-body">
                            <div class="content-sections">
                                <div class="content-section">
                                    <h4>Почему выбирают Aeternum</h4>
                                    <div class="content-items">
                                        <div v-for="(item, index) in root.featuresContent"
                                             :key="'feature-' + index" class="content-item">
                                            <div class="content-item-header">
                                                <span class="item-number">{{ index + 1 }}</span>
                                                <button
                                                        @click="root.removeContentItem('features', index)"
                                                        class="btn btn-sm btn-delete">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                            <div class="form-group">
                                                <label>Заголовок</label>
                                                <input type="text" v-model="item.title"
                                                       placeholder="Заголовок преимущества">
                                            </div>
                                            <div class="form-group">
                                                <label>Описание</label>
                                                <textarea v-model="item.content"
                                                          placeholder="Описание преимущества"
                                                          rows="3"></textarea>
                                            </div>
                                        </div>
                                        <button @click="root.addContentItem('features')"
                                                class="btn btn-secondary add-item-btn">
                                            <i class="fas fa-plus"></i>
                                            Добавить преимущество
                                        </button>
                                    </div>
                                </div>
                                <div class="content-section">
                                    <h4>Наша история</h4>
                                    <div class="content-items">
                                        <div v-for="(item, index) in root.historyContent"
                                             :key="'history-' + index" class="content-item">
                                            <div class="content-item-header">
                                                <span class="item-number">{{ index + 1 }}</span>
                                                <button @click="root.removeContentItem('history', index)"
                                                        class="btn btn-sm btn-delete">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                            <div class="form-group">
                                                <label>Год</label>
                                                <input type="text" v-model="item.year"
                                                       placeholder="Год события">
                                            </div>
                                            <div class="form-group">
                                                <label>Заголовок</label>
                                                <input type="text" v-model="item.title"
                                                       placeholder="Заголовок события">
                                            </div>
                                            <div class="form-group">
                                                <label>Описание</label>
                                                <textarea v-model="item.content"
                                                          placeholder="Описание события"
                                                          rows="3"></textarea>
                                            </div>
                                        </div>
                                        <button @click="root.addContentItem('history')"
                                                class="btn btn-secondary add-item-btn">
                                            <i class="fas fa-plus"></i>
                                            Добавить событие
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div v-if="root.contentError" class="error-message">{{ root.contentError }}</div>
                            <div v-if="root.contentSuccess" class="success-message">{{ root.contentSuccess }}
                            </div>
                            <div class="form-actions">
                                <button @click="root.saveContent" class="btn btn-primary"
                                        :disabled="root.contentLoading">
                                    {{ root.contentLoading ? 'Сохранение...' : 'Сохранить изменения' }}
                                </button>
                                <button @click="root.closeContentModal"
                                        class="btn btn-secondary">Отмена</button>
                            </div>
                        </div>
                        <div class="modal-resize-handle nw"
                             @mousedown="root.startResize($event, 'contentModal', 'nw')"></div>
                        <div class="modal-resize-handle ne"
                             @mousedown="root.startResize($event, 'contentModal', 'ne')"></div>
                        <div class="modal-resize-handle sw"
                             @mousedown="root.startResize($event, 'contentModal', 'sw')"></div>
                        <div class="modal-resize-handle se"
                             @mousedown="root.startResize($event, 'contentModal', 'se')"></div>
                        <div class="modal-resize-handle n"
                             @mousedown="root.startResize($event, 'contentModal', 'n')"
                             @dblclick="root.handleResizeDoubleClick('contentModal', 'n', $event)"></div>
                        <div class="modal-resize-handle s"
                             @mousedown="root.startResize($event, 'contentModal', 's')"
                             @dblclick="root.handleResizeDoubleClick('contentModal', 's', $event)"></div>
                        <div class="modal-resize-handle e"
                             @mousedown="root.startResize($event, 'contentModal', 'e')"
                             @dblclick="root.handleResizeDoubleClick('contentModal', 'e', $event)"></div>
                        <div class="modal-resize-handle w"
                             @mousedown="root.startResize($event, 'contentModal', 'w')"
                             @dblclick="root.handleResizeDoubleClick('contentModal', 'w', $event)"></div>
                    </div>
                </teleport>
            </template>
            <template v-if="root.showAddPageModal || root.editingPage">
                <teleport to="body">
                    <div class="modal page-modal" data-modal-id="pageModal"
                         @click.stop="root.bringModalToFront('pageModal')">
                        <div class="modal-toolbar" @mousedown="root.startDragModal('pageModal', $event)"
                             style="cursor: move;">
                            <div class="control-btns">
                                <button @click.stop="root.toggleMinimize('pageModal')" class="action-btn"
                                        :title="root.isModalMinimized('pageModal') ? 'Восстановить' : 'Свернуть'">
                                    <i
                                            :class="root.isModalMinimized('pageModal') ? 'fas fa-window-restore' : 'fas fa-minus'"></i>
                                </button>
                                <button @click.stop="root.toggleMaximize('pageModal')" class="action-btn"
                                        :title="root.isModalMaximized('pageModal') ? 'Восстановить размер' : 'Развернуть'">
                                    <i
                                            :class="root.isModalMaximized('pageModal') ? 'fas fa-window-restore' : 'fas fa-window-maximize'"></i>
                                </button>
                                <button @click="root.closePageModal" class="action-btn">
                                    <i @click="root.closePageModal" class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div class="modal-header">
                            <h3>{{ root.editingPage ? 'Редактировать страницу' : 'Добавить страницу' }}
                            </h3>
                        </div>
                        <div class="modal-body">
                            <form @submit.prevent="root.savePage">
                                <div class="form-group">
                                    <label>URL (slug) *</label>
                                    <input type="text" v-model="root.pageForm.slug"
                                           placeholder="about-us" required pattern="[a-z0-9\-_]+"
                                           title="Только латинские буквы, цифры, дефисы и подчеркивания">
                                    <small
                                            style="color: #888; margin-top: 5px; display: block;">Только
                                        латинские буквы, цифры, дефисы и подчеркивания. Пример:
                                        about-us, contacts</small>
                                </div>
                                <div class="form-group">
                                    <label>Название страницы *</label>
                                    <input type="text" v-model="root.pageForm.title" placeholder="О нас"
                                           required>
                                </div>
                                <div class="form-group">
                                    <label>Содержимое страницы</label>
                                    <div class="visual-page-editor">
                                        <div class="editor-controls">
                                            <button type="button" @click.prevent="root.toggleViewMode"
                                                    class="btn btn-secondary">
                                                <i
                                                        :class="root.viewMode === 'visual' ? 'fas fa-code' : 'fas fa-eye'"></i>
                                                {{ root.viewMode === 'visual' ? 'Режим HTML' :
                                                    'Визуальный режим' }}
                                            </button>
                                        </div>
                                        <div v-if="root.viewMode === 'visual'"
                                             class="visual-editor-wrapper">
                                            <div class="elements-sidebar">
                                                <h4>Элементы</h4>
                                                <div class="elements-list">
                                                    <div v-for="element in root.availableElements"
                                                         :key="element.type" class="element-item"
                                                         draggable="true"
                                                         @dragstart="root.startDragElement(element, $event)"
                                                         :title="'Перетащите ' + element.label">
                                                        <i :class="element.icon"></i>
                                                        <span>{{ element.label }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="page-preview-area"
                                                 @dragover.prevent="root.onPreviewDragOver"
                                                 @drop.prevent="root.onPreviewDrop"
                                                 @dragleave.prevent="root.onPreviewDragLeave"
                                                 :class="{ 'drag-over': root.draggingElement !== null }">
                                                <div class="preview-header">
                                                    <span>Предпросмотр страницы</span>
                                                    <small v-if="root.pageElements.length === 0"
                                                           style="color: #888;">Перетащите элементы
                                                        сюда</small>
                                                </div>
                                                <div class="page-elements-container">
                                                    <div v-for="(element, index) in root.pageElements"
                                                         :key="element.id" class="page-element"
                                                         :class="{ 'selected': root.selectedElement && root.selectedElement.id === element.id }"
                                                         @click="root.selectElement(element)"
                                                         draggable="true"
                                                         @dragstart="root.startDragPageElement(element, $event)"
                                                         @dragover.prevent="root.onElementDragOver(index, $event)"
                                                         @drop.prevent="root.onElementDrop(index, $event)">
                                                        <div class="element-controls">
                                                            <button
                                                                    @click.stop="root.moveElementUp(index)"
                                                                    class="btn-icon"
                                                                    :disabled="index === 0"
                                                                    title="Вверх">
                                                                <i class="fas fa-arrow-up"></i>
                                                            </button>
                                                            <button
                                                                    @click.stop="root.moveElementDown(index)"
                                                                    class="btn-icon"
                                                                    :disabled="index === root.pageElements.length - 1"
                                                                    title="Вниз">
                                                                <i class="fas fa-arrow-down"></i>
                                                            </button>
                                                            <button
                                                                    @click.stop="root.removeElement(index)"
                                                                    class="btn-icon btn-delete"
                                                                    title="Удалить">
                                                                <i class="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                        <div class="element-content"
                                                             v-html="root.renderElement(element)"></div>
                                                    </div>

                                                    <div v-if="root.pageElements.length === 0"
                                                         class="empty-preview">
                                                        <i class="fas fa-mouse-pointer"
                                                           style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                                                        <p>Перетащите элементы из левой панели</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div v-if="root.selectedElement"
                                                 class="element-editor-panel">
                                                <div class="panel-header">
                                                    <h4>Редактирование элемента</h4>
                                                    <button @click="root.selectedElement = null"
                                                            class="btn-icon">
                                                        <i class="fas fa-times"></i>
                                                    </button>
                                                </div>
                                                <div class="panel-content">
                                                    <div class="form-group">
                                                        <label>Тип: {{
                                                                root.getElementTypeLabel(root.selectedElement.type)
                                                            }}</label>
                                                    </div>
                                                    <div v-if="root.selectedElement.type === 'heading'"
                                                         class="form-group">
                                                        <label>Уровень заголовка</label>
                                                        <select v-model="root.selectedElement.level"
                                                                @change="root.updateElementContent">
                                                            <option value="1">H1</option>
                                                            <option value="2">H2</option>
                                                            <option value="3">H3</option>
                                                            <option value="4">H4</option>
                                                        </select>
                                                    </div>
                                                    <div class="form-group">
                                                        <label>Содержимое</label>
                                                        <textarea
                                                                v-if="root.selectedElement.type !== 'image'"
                                                                v-model="root.selectedElement.content"
                                                                @input="root.updateElementContent"
                                                                rows="5"></textarea>
                                                        <div v-else class="image-upload-editor">
                                                            <input type="text"
                                                                   v-model="root.selectedElement.content"
                                                                   @input="root.updateElementContent"
                                                                   placeholder="URL изображения">
                                                            <input type="file"
                                                                   @change="root.handleImageUpload"
                                                                   accept="image/*"
                                                                   ref="imageUploadInput"
                                                                   style="display: none;">
                                                            <button type="button"
                                                                    @click="$refs.imageUploadInput.click()"
                                                                    class="btn btn-secondary">
                                                                <i class="fas fa-upload"></i>
                                                                Загрузить
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div v-if="root.selectedElement.type === 'button'"
                                                         class="form-group">
                                                        <label>Ссылка</label>
                                                        <input type="url"
                                                               v-model="root.selectedElement.link"
                                                               @input="root.updateElementContent"
                                                               placeholder="https://...">
                                                    </div>
                                                    <div v-if="root.selectedElement.type === 'button'"
                                                         class="form-group">
                                                        <label>Стиль</label>
                                                        <select v-model="root.selectedElement.style"
                                                                @change="root.updateElementContent">
                                                            <option value="primary">Основной
                                                            </option>
                                                            <option value="secondary">Вторичный
                                                            </option>
                                                            <option value="outline">Обведенный
                                                            </option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-else class="html-editor-container">
                                                                <textarea v-model="root.pageForm.content"
                                                                          class="rich-editor-textarea"
                                                                          placeholder="HTML содержимое страницы"
                                                                          rows="15"></textarea>
                                        </div>
                                    </div>
                                    <small style="color: #888; margin-top: 5px; display: block;">
                                        В визуальном режиме перетаскивайте элементы из панели слева
                                        на страницу. В режиме HTML редактируйте HTML код напрямую.
                                    </small>
                                </div>
                                <div class="form-group">
                                    <label>Meta Title (для SEO)</label>
                                    <input type="text" v-model="root.pageForm.meta_title"
                                           placeholder="Заголовок страницы в поисковых системах">
                                </div>
                                <div class="form-group">
                                    <label>Meta Description (для SEO)</label>
                                    <textarea v-model="root.pageForm.meta_description"
                                              placeholder="Описание страницы для поисковых систем"
                                              rows="3"></textarea>
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" v-model="root.pageForm.is_published">
                                        Опубликовано (страница видна посетителям)
                                    </label>
                                </div>
                                <div v-if="!root.pageForm.is_main_page" class="form-group">
                                    <label>Навигация хедера (кнопки в меню)</label>
                                    <small
                                            style="color: #888; margin-bottom: 10px; display: block;">
                                        Настройте кнопки навигации, которые будут отображаться в
                                        шапке сайта для этой страницы. На главной странице кнопки
                                        автоматически соответствуют активным блокам.
                                    </small>
                                    <div class="navigation-buttons-list" style="margin-top: 10px;">
                                        <div v-for="(button, index) in root.pageForm.navigation_buttons"
                                             :key="index"
                                             style="display: flex; gap: 10px; align-items: center; margin-bottom: 15px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                                            <div
                                                    style="flex: 1; display: flex; flex-direction: column; gap: 10px;">
                                                <div class="form-group" style="margin: 0;">
                                                    <label
                                                            style="font-size: 12px; color: #888;">Название
                                                        кнопки</label>
                                                    <input type="text" v-model="button.label"
                                                           placeholder="Товары" style="width: 100%;">
                                                </div>
                                                <div class="form-group" style="margin: 0;">
                                                    <label
                                                            style="font-size: 12px; color: #888;">Цель
                                                        (ID секции или slug страницы)</label>
                                                    <input type="text" v-model="button.target"
                                                           placeholder="products" style="width: 100%;">
                                                </div>
                                                <div class="form-group" style="margin: 0;">
                                                    <label style="font-size: 12px; color: #888;">Тип
                                                        ссылки</label>
                                                    <select v-model="button.linkType"
                                                            style="width: 100%;">
                                                        <option value="section">Секция (якорь #)
                                                        </option>
                                                        <option value="page">Страница</option>
                                                        <option value="url">Внешняя ссылка</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-if="root.pageError" class="error-message">{{ root.pageError }}</div>
                                <div v-if="root.pageSuccess" class="success-message">{{ root.pageSuccess }}
                                </div>

                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary"
                                            :disabled="root.pageLoading">
                                        {{ root.editingPage ? 'Сохранить изменения' : 'Создать страницу'
                                        }}
                                    </button>
                                    <button type="button" @click="root.closePageModal"
                                            class="btn btn-secondary">Отмена</button>
                                </div>
                            </form>
                        </div>
                        <div class="modal-resize-handle nw"
                             @mousedown="root.startResize($event, 'pageModal', 'nw')"></div>
                        <div class="modal-resize-handle ne"
                             @mousedown="root.startResize($event, 'pageModal', 'ne')"></div>
                        <div class="modal-resize-handle sw"
                             @mousedown="root.startResize($event, 'pageModal', 'sw')"></div>
                        <div class="modal-resize-handle se"
                             @mousedown="root.startResize($event, 'pageModal', 'se')"></div>
                        <div class="modal-resize-handle n"
                             @mousedown="root.startResize($event, 'pageModal', 'n')"
                             @dblclick="root.handleResizeDoubleClick('pageModal', 'n', $event)"></div>
                        <div class="modal-resize-handle s"
                             @mousedown="root.startResize($event, 'pageModal', 's')"
                             @dblclick="root.handleResizeDoubleClick('pageModal', 's', $event)"></div>
                        <div class="modal-resize-handle e"
                             @mousedown="root.startResize($event, 'pageModal', 'e')"
                             @dblclick="root.handleResizeDoubleClick('pageModal', 'e', $event)"></div>
                        <div class="modal-resize-handle w"
                             @mousedown="root.startResize($event, 'pageModal', 'w')"
                             @dblclick="root.handleResizeDoubleClick('pageModal', 'w', $event)"></div>
                    </div>
                </teleport>
            </template>
            <template v-if="root.showAddBlockModal || root.editingBlock">
                <?php include 'block-modal.html';  ?>
                </teleport>
            </template>
            <template v-if="root.showIconPicker">
                <div class="modal-overlay icon-picker-overlay" @click.self="root.closeIconPicker">
                    <div class="modal icon-picker-modal" data-modal-id="iconPickerModal"
                         @click.stop="root.bringModalToFront('iconPickerModal')">
                        <div class="modal-toolbar"
                             @mousedown="root.startDragModal('iconPickerModal', $event)"
                             style="cursor: move;">
                            <div class="control-btns">
                                <button @click.stop="root.toggleMinimize('iconPickerModal')"
                                        class="action-btn"
                                        :title="root.isModalMinimized('iconPickerModal') ? 'Восстановить' : 'Свернуть'">
                                    <i
                                            :class="root.isModalMinimized('iconPickerModal') ? 'fas fa-window-restore' : 'fas fa-minus'"></i>
                                </button>
                                <button @click.stop="root.toggleMaximize('iconPickerModal')"
                                        class="action-btn"
                                        :title="root.isModalMaximized('iconPickerModal') ? 'Восстановить размер' : 'Развернуть'">
                                    <i
                                            :class="root.isModalMaximized('iconPickerModal') ? 'fas fa-window-restore' : 'fas fa-window-maximize'"></i>
                                </button>
                                <button @click="root.closeIconPicker" class="action-btn">
                                    <i @click="root.closeIconPicker" class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div class="modal-header">
                            <h3>Выбор иконки</h3>
                        </div>
                        <div class="modal-body">
                            <div class="icon-search">
                                <input type="text" v-model="root.iconSearchQuery"
                                       placeholder="Поиск иконки..." class="icon-search-input">
                            </div>
                            <div class="icon-categories">
                                <button v-for="category in root.iconCategories" :key="category.name"
                                        @click="root.selectedIconCategory = category.name"
                                        class="category-btn"
                                        :class="{ 'active': root.selectedIconCategory === category.name }">
                                    <i :class="category.icon"></i>
                                    {{ category.label }}
                                </button>
                            </div>
                            <div class="icons-grid">
                                <div v-for="icon in root.filteredIcons" :key="icon.class"
                                     @click="root.selectIcon(icon)" class="icon-item"
                                     :class="{ 'selected': root.selectedIconClass === icon.class }">
                                    <i :class="icon.class"></i>
                                    <span class="icon-name">{{ icon.name }}</span>
                                </div>
                                <div v-if="root.filteredIcons.length === 0"
                                     style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #888;">
                                    <i class="fas fa-exclamation-triangle"
                                       style="font-size: 48px; margin-bottom: 20px;"></i>
                                    <p>Иконки не найдены</p>
                                    <p style="font-size: 14px;">Попробуйте изменить категорию или
                                        поисковый запрос</p>
                                </div>
                            </div>
                            <div class="icon-picker-actions">
                                <button @click="root.confirmIconSelection" class="btn btn-primary"
                                        :disabled="!root.selectedIconClass">
                                    Выбрать иконку
                                </button>
                                <button @click="root.closeIconPicker" class="btn btn-secondary">
                                    Отмена
                                </button>
                            </div>
                        </div>
                        <div class="modal-resize-handle nw"
                             @mousedown="root.startResize($event, 'iconPickerModal', 'nw')"></div>
                        <div class="modal-resize-handle ne"
                             @mousedown="root.startResize($event, 'iconPickerModal', 'ne')"></div>
                        <div class="modal-resize-handle sw"
                             @mousedown="root.startResize($event, 'iconPickerModal', 'sw')"></div>
                        <div class="modal-resize-handle se"
                             @mousedown="root.startResize($event, 'iconPickerModal', 'se')"></div>
                        <div class="modal-resize-handle n"
                             @mousedown="root.startResize($event, 'iconPickerModal', 'n')"
                             @dblclick="root.handleResizeDoubleClick('iconPickerModal', 'n', $event)">
                        </div>
                        <div class="modal-resize-handle s"
                             @mousedown="root.startResize($event, 'iconPickerModal', 's')"
                             @dblclick="root.handleResizeDoubleClick('iconPickerModal', 's', $event)">
                        </div>
                        <div class="modal-resize-handle e"
                             @mousedown="root.startResize($event, 'iconPickerModal', 'e')"
                             @dblclick="root.handleResizeDoubleClick('iconPickerModal', 'e', $event)">
                        </div>
                        <div class="modal-resize-handle w"
                             @mousedown="root.startResize($event, 'iconPickerModal', 'w')"
                             @dblclick="root.handleResizeDoubleClick('iconPickerModal', 'w', $event)">
                        </div>
                    </div>
                </div>
            </template>
            <template v-if="root.showAddProduct || root.editingProduct">
                <div class="modal" data-modal-id="productModal"
                     @click.stop="root.bringModalToFront('productModal')">
                    <div class="modal-toolbar" @mousedown="root.startDragModal('productModal', $event)"
                         style="cursor: move;">
                        <div class="control-btns">
                            <button @click.stop="root.toggleMinimize('productModal')" class="action-btn"
                                    :title="root.isModalMinimized('productModal') ? 'Восстановить' : 'Свернуть'">
                                <i
                                        :class="root.isModalMinimized('productModal') ? 'fas fa-window-restore' : 'fas fa-minus'"></i>
                            </button>
                            <button @click.stop="root.toggleMaximize('productModal')" class="action-btn"
                                    :title="root.isModalMaximized('productModal') ? 'Восстановить размер' : 'Развернуть'">
                                <i
                                        :class="root.isModalMaximized('productModal') ? 'fas fa-window-restore' : 'fas fa-window-maximize'"></i>
                            </button>
                            <button @click="root.closeModal" class="action-btn">
                                <i @click="root.closeModal" class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <div class="modal-header">
                        <h3>{{ root.editingProduct ? 'Редактировать товар' : 'Добавить товар' }}</h3>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="root.saveProduct">
                            <div class="form-group">
                                <label>Название товара</label>
                                <input type="text" v-model="root.productForm.name" required>
                            </div>
                            <div class="form-group">
                                <label>Тип товара</label>
                                <select v-model="root.productForm.product_type_id" required>
                                    <option v-for="type in root.productTypes" :key="type.id" :value="type.id">
                                        {{ type.name }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Описание товара</label>
                                <textarea v-model="root.productForm.description"></textarea>
                                <div class="ai-helper">
                                    <button type="button" class="btn btn-secondary ai-generate-btn"
                                            @click="root.generateDescriptionWithAI"
                                            :disabled="root.aiGeneratingDescription || !root.productForm.name || !root.productForm.name.trim()">
                                        <i v-if="!aiGeneratingDescription"
                                           class="fas fa-wand-magic-sparkles"></i>
                                        <i v-else class="fas fa-circle-notch fa-spin"></i>
                                        <span>{{ root.aiGeneratingDescription ? 'Генерируем...' :
                                                'Сгенерировать описание с ИИ' }}</span>
                                    </button>
                                    <small class="ai-helper-hint">
                                        DeepSeek составит лаконичное описание на основе названия
                                        товара.
                                    </small>
                                    <small v-if="root.aiGenerationError" class="ai-helper-error">
                                        {{ root.aiGenerationError }}
                                    </small>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Особенности товара</label>
                                <div class="peculiarities-editor">
                                    <div class="peculiarities-list">
                                        <div v-for="(peculiarity, index) in root.productForm.peculiarities"
                                             :key="index" class="peculiarity-item">
                                            <input type="text"
                                                   v-model="root.productForm.peculiarities[index]"
                                                   class="peculiarity-input">
                                            <button type="button" @click="root.removePeculiarity(index)"
                                                    class="btn btn-sm btn-delete">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="add-peculiarity">
                                        <input type="text" v-model="root.newPeculiarity"
                                               @keyup.enter="root.addPeculiarity"
                                               placeholder="Добавить особенность"
                                               class="peculiarity-input">
                                        <button type="button" @click="root.addPeculiarity"
                                                class="btn btn-sm btn-primary">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Материал</label>
                                <input type="text" v-model="root.productForm.material" required>
                            </div>
                            <div class="form-group">
                                <label>Цена (руб.)</label>
                                <input type="text" v-model="root.productForm.price" required min="0">
                            </div>
                            <div class="form-group">
                                <label>Цена по скидке (руб.)</label>
                                <input type="text" v-model="root.productForm.price_sale" min="0">
                            </div>
                            <div class="form-group select-group" :class="{ 'open': root.selectOpen }">
                                <label>Категория</label>
                                <select v-model="root.productForm.category" @focus="root.onSelectFocus"
                                        @blur="root.onSelectBlur" @change="root.onSelectChange"
                                        @click="root.onSelectClick" @mousedown="root.onSelectMouseDown" required>
                                    <option v-for="category in root.categories" :key="category.id"
                                            :value="category.id">
                                        {{ category.name }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-group image-upload-group">
                                <label>Основное изображение/видео товара</label>
                                <div class="image-upload-container">
                                    <div class="file-upload-area"
                                         :class="{ 'has-file': root.selectedFile, 'uploading': root.isUploading, 'upload-success': root.uploadSuccess, 'upload-error': root.uploadError }"
                                         @click="!root.isUploading && triggerFileUpload()">
                                        <input ref="fileInput" type="file"
                                               @change="root.handleFileSelect" accept="image/*,video/*"
                                               style="display: none;" :disabled="root.isUploading">
                                        <div v-if="root.isUploading" class="upload-progress">
                                            <div class="progress-bar">
                                                <div class="progress-fill"
                                                     :style="{ width: root.uploadProgress + '%' }"></div>
                                            </div>
                                            <p>Загрузка... {{ root.uploadProgress }}%</p>
                                            <button type="button" @click.stop="root.cancelUpload"
                                                    class="cancel-upload-btn">
                                                <i class="fas fa-times"></i> Отмена
                                            </button>
                                        </div>
                                        <div v-else-if="root.uploadSuccess"
                                             class="upload-status success">
                                            <i class="fas fa-check-circle"></i>
                                            <p>Файл успешно загружен!</p>
                                            <button type="button" @click.stop="root.resetUploadStatus"
                                                    class="status-close-btn">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                        <div v-else-if="root.uploadError" class="upload-status error">
                                            <i class="fas fa-exclamation-circle"></i>
                                            <p>Ошибка загрузки: {{ root.uploadErrorMessage }}</p>
                                            <button type="button" @click.stop="root.resetUploadStatus"
                                                    class="status-close-btn">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                        <div v-else-if="!root.selectedFile && !root.productForm.image"
                                             class="upload-placeholder">
                                            <i class="fas fa-cloud-upload-alt"></i>
                                            <p>Нажмите для выбора изображения или видео</p>
                                            <span>или перетащите файл сюда</span>
                                        </div>
                                        <div v-else class="image-preview-container">
                                            <img v-if="!root.isVideoPreview(root.getImageUrl())"
                                                 :src="root.getImageUrl()" :alt="root.productForm.name"
                                                 class="current-image">
                                            <video v-else :src="root.getImageUrl()" controls
                                                   class="current-image"></video>
                                            <button type="button" @click.stop="root.removeImage"
                                                    class="remove-image-btn" :disabled="root.isUploading">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="image-info">
                                        <template v-if="root.selectedFile && !root.isUploading">
                                            <small>Выбран файл: {{ root.selectedFile.name }}</small>
                                            <br>
                                            <small>Размер файла:{{ (root.selectedFile.size / 1024 /
                                                    1024).toFixed(2) }}мб</small>
                                        </template>
                                        <template v-else-if="root.productForm.image && !root.isUploading">
                                            <small>Загружен файл: {{
                                                    root.productForm.image.replace('assets/', '') }}</small>
                                            <br>
                                            <small v-if="root.selectedFile && root.selectedFile.size">Размер
                                                файла:{{ (root.selectedFile.size / 1024 /
                                                        1024).toFixed(2) }}мб</small>
                                        </template>
                                        <small v-else-if="root.isUploading">Загрузка файла...</small>
                                    </div>
                                </div>
                            </div>
                            <div class="form-group additional-images-group">
                                <label>Дополнительные изображения и видео</label>
                                <div class="additional-images-container">
                                    <div class="additional-images-list">
                                        <div v-for="(image, index) in root.productForm.additionalImages"
                                             :key="index" class="additional-image-item">
                                            <img :src="'../' + image" :alt="root.productForm.name"
                                                 class="additional-image-preview">
                                            <button type="button"
                                                    @click="root.removeAdditionalImage(index)"
                                                    class="remove-additional-image-btn">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="additional-videos-list" style="margin-top: 15px;"
                                         v-if="root.productForm.additionalVideos && root.productForm.additionalVideos.length > 0">
                                        <div v-for="(video, index) in root.productForm.additionalVideos"
                                             :key="'video-' + index" class="additional-video-item">
                                            <video :src="'../' + video" controls
                                                   class="additional-video-preview"></video>
                                            <button type="button"
                                                    @click="root.removeAdditionalVideo(index)"
                                                    class="remove-additional-image-btn">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="add-additional-images" v-if="root.editingProduct">
                                        <input ref="additionalImagesInput" type="file"
                                               @change="root.handleAdditionalImagesSelect"
                                               accept="image/*,video/*" multiple
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
                                        <p style="margin-top: 5px;">Сохраните товар, чтобы добавлять
                                            дополнительные изображения и видео</p>
                                    </div>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">
                                    {{ root.editingProduct ? 'Сохранить изменения' : 'Добавить товар' }}
                                </button>
                                <button type="button" @click="root.closeModal"
                                        class="btn btn-secondary">Отмена</button>
                            </div>
                        </form>
                    </div>
                    <div class="modal-resize-handle nw"
                         @mousedown="root.startResize($event, 'productModal', 'nw')"></div>
                    <div class="modal-resize-handle ne"
                         @mousedown="root.startResize($event, 'productModal', 'ne')"></div>
                    <div class="modal-resize-handle sw"
                         @mousedown="root.startResize($event, 'productModal', 'sw')"></div>
                    <div class="modal-resize-handle se"
                         @mousedown="root.startResize($event, 'productModal', 'se')"></div>
                    <div class="modal-resize-handle n"
                         @mousedown="root.startResize($event, 'productModal', 'n')"
                         @dblclick="root.handleResizeDoubleClick('productModal', 'n', $event)"></div>
                    <div class="modal-resize-handle s"
                         @mousedown="root.startResize($event, 'productModal', 's')"
                         @dblclick="root.handleResizeDoubleClick('productModal', 's', $event)"></div>
                    <div class="modal-resize-handle e"
                         @mousedown="root.startResize($event, 'productModal', 'e')"
                         @dblclick="root.handleResizeDoubleClick('productModal', 'e', $event)"></div>
                    <div class="modal-resize-handle w"
                         @mousedown="root.startResize($event, 'productModal', 'w')"
                         @dblclick="root.handleResizeDoubleClick('productModal', 'w', $event)"></div>
                </div>
            </template>
        </div>
    </main>
    <div class="minimized-list" v-if="Object.keys(root.minimizedModals).length > 0">
        <template v-for="(data, modalId) in root.minimizedModals" :key="modalId">
            <div class="minimized-modal-item" @click="root.restoreModal(modalId)"
                 :title="'Восстановить ' + data.title">
                <span>{{ data.title }}</span>
                <button @click.stop="root.closeMinimizedModal(modalId)" class="minimized-modal-close"
                        :title="'Закрыть ' + data.title">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </template>
    </div>
</div>
