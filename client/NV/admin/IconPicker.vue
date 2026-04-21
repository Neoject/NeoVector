<script>
import Modal from "../components/Modal.vue";

const CATEGORIES = [
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
];

const ICONS = [
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
];

export default {
  name: 'IconPicker',
  components: { Modal },
  props: {
    modelValue: { type: Boolean, default: false },
    initialIcon: { type: String, default: '' },
  },
  emits: ['update:modelValue', 'select'],
  data() {
    return {
      selectedIconClass: '',
      iconSearchQuery: '',
      selectedIconCategory: 'all',
      filteredIcons: [...ICONS],
      iconCategories: CATEGORIES,
    };
  },
  watch: {
    modelValue(open) {
      if (open) {
        this.selectedIconClass = this.initialIcon || '';
        this.iconSearchQuery = '';
        this.selectedIconCategory = 'all';
        this.updateFilteredIcons();
      }
    },
    selectedIconCategory() { this.updateFilteredIcons(); },
    iconSearchQuery()       { this.updateFilteredIcons(); },
  },
  methods: {
    updateFilteredIcons() {
      let list = ICONS;
      if (this.selectedIconCategory !== 'all') list = list.filter(i => i.category === this.selectedIconCategory);
      if (this.iconSearchQuery) {
        const q = this.iconSearchQuery.toLowerCase();
        list = list.filter(i => i.name.toLowerCase().includes(q) || i.class.toLowerCase().includes(q));
      }
      this.filteredIcons = list;
    },
    selectIcon(icon) { this.selectedIconClass = icon.class; },
    confirm() {
      if (this.selectedIconClass) this.$emit('select', this.selectedIconClass);
      this.close();
    },
    close() { this.$emit('update:modelValue', false); },
  },
};
</script>

<template>
  <Modal
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      modal-id="iconPickerModal"
      title="Выбор иконки"
      default-width="640px"
      default-height="560px"
      class="icon-picker-modal"
      @close="close"
  >
    <template #icon>
      <span class="modal-title-icon"><i class="fas fa-icons"></i></span>
    </template>

    <input type="text" v-model="iconSearchQuery" placeholder="Поиск..." class="icon-search-input">

    <div class="icon-categories">
      <button
          v-for="cat in iconCategories"
          :key="cat.name"
          @click="selectedIconCategory = cat.name"
          class="category-btn"
          :class="{ active: selectedIconCategory === cat.name }"
      >
        <i :class="cat.icon"></i> {{ cat.label }}
      </button>
    </div>

    <div class="icons-grid">
      <div
          v-for="icon in filteredIcons"
          :key="icon.class"
          @click="selectIcon(icon)"
          class="icon-item"
          :class="{ selected: selectedIconClass === icon.class }"
      >
        <i :class="icon.class"></i>
        <span class="icon-name">{{ icon.name }}</span>
      </div>
      <div v-if="!filteredIcons.length" class="icons-empty">Иконки не найдены</div>
    </div>

    <div class="icon-picker-actions">
      <button type="button" @click="confirm" class="btn btn-primary" :disabled="!selectedIconClass">Выбрать</button>
      <button type="button" @click="close" class="btn btn-secondary">Отмена</button>
    </div>
  </Modal>
</template>

<style scoped>
.icon-search-input {
  width: 100%;
  margin-bottom: 12px;
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
  border-color: var(--border-medium);
}
.category-btn.active {
  background: var(--primary);
  color: var(--text-dark);
  border-color: var(--primary);
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
.icon-item.selected i { transform: scale(1.1); }
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
.icons-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #888;
}
.icon-picker-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
.icon-picker-modal {
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
}
@media (max-width: 768px) {
  .icons-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; }
  .icon-item { padding: 12px 8px; }
  .icon-item i { font-size: 20px; }
  .icon-name { font-size: 11px; }
  .icon-categories { flex-direction: column; }
  .category-btn { justify-content: center; }
}
</style>
