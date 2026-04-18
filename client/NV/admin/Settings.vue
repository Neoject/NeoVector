<script>
import ColorPicker from "./ColorPicker.vue";
import {api} from "../../../server/api";
import {setPageTitle} from "../../../server/src/utils";

const COLOR_GROUPS = [
  {
    label: 'Фон',
    vars: [
      { key: '--background', label: 'Основной фон' },
      { key: '--background-secondary', label: 'Вторичный фон'},
      { key: '--background-additional', label: 'Дополнительный фон'},
      { key: '--background-empty', label: 'Пустой фон' },
      { key: '--surface-color', label: 'Surface' },
      { key: '--surface-muted', label: 'Surface Muted' },
    ]
  },
  {
    label: 'Основные цвета',
    vars: [
      { key: '--primary', label: 'Основной' },
      { key: '--primary-alt', label: 'Основной (альт.)' },
      { key: '--secondary', label: 'Вторичный' },
    ]
  },
  {
    label: 'Шапка сайта',
    vars: [
      { key: '--background-header', label: 'Фон шапки' },
      { key: '--header-main', label: 'Основной текст шапки' },
      { key: '--header-secondary', label: 'Вторичный текст шапки' },
      { key: '--header-additional', label: 'Дополнительный текст шапки' },
    ]
  },
  {
    label: 'Текст',
    vars: [
      { key: '--text-primary', label: 'Текст (осн.)' },
      { key: '--text-secondary', label: 'Текст (втор.)' },
      { key: '--text-additional', label: 'Текст (доп.)' },
      { key: '--text-dark', label: 'Текст (темн.)' },
      { key: '--text-simple', label: 'Текст (упр.)' },
      { key: '--text-additional-light', label: 'Доп. текст (светлый)' },
      { key: '--text-additional-dark', label: 'Доп. текст (тёмный)' },
      { key: '--text-btn', label: 'Текст кнопок' },
      { key: '--text-hover', label: 'Текст при наведении' },
    ]
  },
  {
    label: 'Успех / OK',
    vars: [
      { key: '--success-bg', label: 'Фон успеха' },
      { key: '--success-alt', label: 'Фон успеха (альт.)' },
      { key: '--success-border', label: 'Рамка успеха' },
      { key: '--success-text', label: 'Текст успеха' },
    ]
  },
  {
    label: 'Ошибка / Предупреждение',
    vars: [
      { key: '--error-bg', label: 'Фон ошибки' },
      { key: '--error-bg-alt', label: 'Фон ошибки (альт.)' },
      { key: '--error-border', label: 'Рамка ошибки' },
      { key: '--error-text', label: 'Текст ошибки' },
      { key: '--warning', label: 'Предупреждение' },
      { key: '--warning-dark', label: 'Предупреждение (тёмное)' },
    ]
  },
  {
    label: 'Информация / Статусы',
    vars: [
      { key: '--info-primary', label: 'Info Primary' },
      { key: '--info-secondary', label: 'Info Secondary' },
      { key: '--info-alt', label: 'Info Alt' },
      { key: '--status-primary', label: 'Status Primary' },
    ]
  },
  {
    label: 'Рамки',
    vars: [
      { key: '--border-primary', label: 'Рамка' },
      { key: '--border-secondary', label: 'Рамка (доп.)' },
      { key: '--border-alternative', label: 'Рамка (альт.)' },
      { key: '--border-light', label: 'Рамка (легк.))' },
      { key: '--border-medium', label: 'Рамка (сред.)' },
      { key: '--border-strong', label: 'Рамка (сильн.)' },
    ]
  },
  {
    label: 'Кнопки',
    vars: [
      { key: '--btn-bg', label: 'Фон кнопок' },
      { key: '--btn-bg-secondary', label: 'Фон кнопок (доп.)' },
      { key: '--btn-bg-alt', label: 'Фон кнопок (альт.)' },
      { key: '--btn-bg-disabled', label: 'Фон кнопок (откл.)' },
    ]
  },
  {
    label: 'Hover / Интерактив',
    vars: [
      { key: '--hover-primary', label: 'Hover Primary' },
      { key: '--hover-secondary', label: 'Hover Secondary' },
      { key: '--hover-button', label: 'Hover Button' },
      { key: '--hover-table', label: 'Hover Table' },
    ]
  },
  {
    label: 'Таблицы',
    vars: [
      { key: '--table-element', label: 'Элемент таблицы' },
      { key: '--table-element-hover', label: 'Hover элемент таблицы' },
    ]
  },
  {
    label: 'Тени',
    vars: [
      { key: '--shadow-primary', label: 'Тень (осн.)'},
      { key: '--shadow-additional', label: 'Тень (доп.)'},
      { key: '--shadow-header', label: 'Тень (шапка.)'},
    ]
  }
];

function cssVarToHex(val) {
  if (!val) return '#000000';
  val = val.trim();
  if (val.startsWith('#') && (val.length === 7 || val.length === 4)) return val;
  const rgbaMatch = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);

  if (rgbaMatch) {
    return '#' + [rgbaMatch[1], rgbaMatch[2], rgbaMatch[3]]
        .map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
  }

  return '#000000';
}

function isSimpleColor(val) {
  if (!val) return false;
  val = val.trim();
  return val.startsWith('#') || val.startsWith('rgb');
}

function isGradient(val) {
  return typeof val === 'string' && val.trim().includes('gradient');
}

/** API хранит флаги как 'true' | 'false'; в форме — boolean. */
function parseBoolParam(raw) {
  if (raw === true || raw === 1) return true;
  if (raw === false || raw === 0) return false;
  const s = String(raw == null ? '' : raw).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'on';
}

export default {
  name: "Settings",
  components: {ColorPicker},
  inject: ['params'],
  props: {
    uploadImage: Function,
    logo: String
  },
  data() {
    return {
      colorGroups: COLOR_GROUPS,
      colors: {},
      colorsLoaded: false,
      colorsSaving: false,
      activeColorGroup: 0,
      data: {
        email: '',
        title: '',
        mainTitle: '',
        description: '',
        imageMetaTags: '',
        pickupAddress: '',
        workHours: '',
        storePhone: '',
        showCart: true,
        showWishList: true,
        adminOnly: false,
        deliveryBel: '',
        deliveryRus: '',
      },
      isDragOver: false,
      previewUrl: null,
    };
  },
  mounted() {
    setPageTitle(this.params.title, 'настройки');
    this.previewUrl = this.logo;
    this.loadParams().then(() => null);
    this.loadColors();
  },
  methods: {
    // ── Params ──────────────────────────────────────────────────
    async loadParams() {
      try {
        const response = await api.getParams();

        if (response.ok) {
          const data = await response.json();

          if (data) {
            this.data.title = data.title ?? '';
            this.data.mainTitle = data.main_title ?? '';
            this.data.email = data.email ?? '';
            this.data.imageMetaTags = data.image_meta_tags ?? '';
            this.data.description = data.description ?? '';
            this.data.workHours = data.work_hours ?? '';
            this.data.pickupAddress = data.pickup_address ?? '';
            this.data.showCart = parseBoolParam(data.show_cart);
            this.data.showWishList = parseBoolParam(data.show_wish_list);
            this.data.storePhone = data.store_phone ?? '';
            this.data.adminOnly = parseBoolParam(data.admin_only);
            this.data.deliveryBel =
              data.delivery_bel != null && data.delivery_bel !== '' ? String(data.delivery_bel) : '';
            this.data.deliveryRus =
              data.delivery_rus != null && data.delivery_rus !== '' ? String(data.delivery_rus) : '';
          }
        }
      } catch (error) { console.error('Error loading params:', error); }
    },
    async saveParams() {
      try {
        const body = {
          title: this.data.title || '',
          main_title: this.data.mainTitle || '',
          email: this.data.email || '',
          description: this.data.description || '',
          image_meta_tags: this.data.imageMetaTags || '',
          pickup_address: this.data.pickupAddress || '',
          work_hours: this.data.workHours || '',
          store_phone: this.data.storePhone || '',
          show_cart: this.data.showCart ? 'true' : 'false',
          show_wish_list: this.data.showWishList ? 'true' : 'false',
          admin_only: this.data.adminOnly ? 'true' : 'false',
          delivery_bel: this.data.deliveryBel === '' || this.data.deliveryBel == null
            ? '0'
            : String(this.data.deliveryBel),
          delivery_rus: this.data.deliveryRus === '' || this.data.deliveryRus == null
            ? '0'
            : String(this.data.deliveryRus),
        };

        const response = await api.saveParams(body);
        const data = await response.json();
        if (response.ok && data.success) {
          Object.assign(this.params, {
            title: body.title,
            main_title: body.main_title,
            email: body.email,
            description: body.description,
            image_meta_tags: body.image_meta_tags,
            pickup_address: body.pickup_address,
            work_hours: body.work_hours,
            store_phone: body.store_phone,
            show_cart: body.show_cart,
            show_wish_list: body.show_wish_list,
            admin_only: body.admin_only,
            delivery_bel: body.delivery_bel,
            delivery_rus: body.delivery_rus,
          });
          alert('Параметры успешно сохранены');
        } else {
          alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
        }
      } catch (error) { alert('Произошла ошибка: ' + error); }
    },
    async uploadLogo(e) {
      const file = this.data.logo ?? e?.target?.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append('logo', file);
      const r = await api.uploadLogo(fd);

      if (r.ok) {
        const res = await r.json();

        if (res.url) {
          alert('Логотип успешно загружен');
          this.params.logo = res.url;
        }
      }
    },
    // ── Colors ──────────────────────────────────────────────────
    collectCurrentColors() {
      const rootStyle = getComputedStyle(document.documentElement);
      const result = {};

      COLOR_GROUPS.forEach(group => {
        group.vars.forEach(({ key }) => {
          const computed = rootStyle.getPropertyValue(key).trim();
          result[key] = isGradient(computed)
              ? computed
              : isSimpleColor(computed)
                  ? cssVarToHex(computed)
                  : '#000000';
        });
      });

      return result;
    },
    loadColors() {
      const fallback = this.collectCurrentColors();

      api.getThemeColors()
          .then(r => r.ok ? r.json() : null)
          .then(saved => {
            this.colors = { ...fallback, ...(saved || {}) };
            this.applyColors();
            this.colorsLoaded = true;
          })
          .catch(() => {
            this.colors = { ...fallback };
            this.applyColors();
            this.colorsLoaded = true;
          });
    },
    onColorChange(varName, value) {
      this.colors[varName] = value;
      document.documentElement.style.setProperty(varName, value);
    },
    applyColors() {
      Object.entries(this.colors).forEach(([key, val]) => {
        document.documentElement.style.setProperty(key, val);
      });
    },
    async saveColors() {
      this.colorsSaving = true;

      try {
        const response = await api.saveColors(this.colors);
        const data = await response.json();

        if (response.ok && data.success) {
          alert('Цвета успешно сохранены');
        }

        else alert('Ошибка: ' + (data.error || ''));
      } catch (error) {
        alert('Ошибка: ' + error);
      } finally {
        this.colorsSaving = false;
      }
    },
    resetColors() {
      if (!confirm('Сбросить цвета к значениям по умолчанию?')) return;

      api.resetColors()
          .then(r => r.ok ? r.json() : null)
          .then(() => {
            COLOR_GROUPS.forEach(group => {
              group.vars.forEach(({ key }) => document.documentElement.style.removeProperty(key));
            });
            this.loadColors();
          })
          .catch(() => {
            COLOR_GROUPS.forEach(group => {
              group.vars.forEach(({ key }) => document.documentElement.style.removeProperty(key));
            });
            this.loadColors();
          });
    },
    onFileChange(e) {
      const f = e.target.files[0];
      if (f) { this.data.logo = f; this.previewUrl = URL.createObjectURL(f); }
    },
    onDrop(e) {
      this.isDragOver = false;
      const f = e.dataTransfer.files[0];
      if (f) { this.data.logo = f; this.previewUrl = URL.createObjectURL(f); }
    },
    clearFile() {
      if (confirm('Вы действительно хотите удалить лого?')) {
        this.previewUrl = null;
        this.params.logo = '';
        api.deleteLogo();
      }
    },
    formatSize(b) {
      if (b < 1024) return b + ' Б';
      if (b < 1048576) return (b / 1024).toFixed(1) + ' КБ';
      return (b / 1048576).toFixed(2) + ' МБ';
    },
  },
};
</script>

<template>
  <main class="admin-main">
    <div class="container">
      <!-- ── General params ─────────────────────────── -->
      <section class="params">
        <form class="main-params" @submit.prevent>
          <h2>Настройки сайта</h2>
          <!-- Логотип сайта -->
          <div class="form-group">
            <h3>Логотип сайта</h3>
            <div
                class="file-drop-zone"
                :class="{ 'dragover': isDragOver }"
                @dragover.prevent="isDragOver = true"
                @dragleave="isDragOver = false"
                @drop.prevent="onDrop"
                @click="$refs.fileInput.click()"
            >
              <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  style="display:none"
                  @change="onFileChange"
              />
              <div class="file-upload-area">
                <template v-if="previewUrl">
                  <div style="position:relative; border: 1px dashed var(--border-strong); border-radius: 4px;">
                    <img v-if="previewUrl"
                         :src="previewUrl"
                         class="file-preview__thumb"
                         alt=""
                    />
                    <button type="button" class="file-preview__remove" title="Закрыть" @click.stop="clearFile">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </template>
                <template v-else>
                  выберите файл<span class="file-drop-zone__hint">PNG, JPG, SVG, WEBP</span> · максимум 5 МБ
                </template>
              </div>
            </div>
            <button
                type="button"
                class="btn btn-primary"
                style="width:100%; margin-top: 12px"
                :disabled="!data.logo"
                @click.prevent="uploadLogo"
            >
              Загрузить логотип
            </button>
          </div>
          <div class="form-group">
            <label>Электронная почта</label>
            <input type="text" v-model="data.email" placeholder="mail@example.com">
          </div>
          <div class="form-group">
            <label>Название сайта</label>
            <input type="text" v-model="data.title" placeholder="Заголовок">
          </div>
          <div class="form-group">
            <label>Название главной страницы</label>
            <input type="text" v-model="data.mainTitle" placeholder="Заголовок">
          </div>
          <div class="form-group">
            <label>Описание сайта</label>
            <textarea v-model="data.description"></textarea>
          </div>
          <div class="form-group">
            <label>Мета-теги изображений товаров</label>
            <textarea v-model="data.imageMetaTags"></textarea>
          </div>
          <h2>Параметры шапки сайта</h2>
          <div class="form-group">
            <label>
              <input type="checkbox" v-model="data.showCart">
              Отображать корзину
            </label>
            <label>
              <input type="checkbox" v-model="data.showWishList">
              Отображать избранное
            </label>
            <label>
              <input type="checkbox" v-model="data.adminOnly">
              Вход только для администраторов
            </label>
          </div>
          <h2>Информация о самовывозе</h2>
          <div class="form-group">
            <label>Адрес магазина</label>
            <input type="text" v-model="data.pickupAddress" placeholder="ул.Пушкина, д.Колотушкина">
          </div>
          <div class="form-group">
            <label>Время работы</label>
            <input type="text" v-model="data.workHours" placeholder="Пн-Сб 9:00-21:00">
          </div>
          <div class="form-group">
            <label>Телефон</label>
            <input type="text" v-model="data.storePhone" placeholder="+375123456789">
          </div>
          <h2>Стоимость доставки</h2>
          <div class="form-group">
            <label>Беларусь</label>
            <input type="text" v-model="data.deliveryBel">
          </div>
          <div class="form-group">
            <label>Россия</label>
            <input type="text" v-model="data.deliveryRus">
          </div>
          <div style="display: flex; justify-content: flex-end">
            <span class="btn btn-primary" @click="saveParams">Сохранить</span>
          </div>
        </form>
      </section>
      <!-- ── Color settings ─────────────────────────── -->
      <section class="params color-settings" v-if="colorsLoaded">
        <div class="color-settings__header">
          <h2>Настройки цветов</h2>
          <div class="color-settings__actions">
            <button class="btn btn-danger-outline" @click="resetColors">Сбросить</button>
            <button class="btn btn-primary" @click="saveColors" :disabled="colorsSaving">
              {{ colorsSaving ? 'Сохранение…' : 'Сохранить цвета' }}
            </button>
          </div>
        </div>
        <!-- Group tabs -->
        <div class="color-tabs">
          <button
              v-for="(group, idx) in colorGroups"
              :key="idx"
              class="color-tab"
              :class="{ active: activeColorGroup === idx }"
              @click="activeColorGroup = idx"
          >{{ group.label }}</button>
        </div>
        <!-- Color rows -->
        <div class="color-grid">
          <div
              class="color-row"
              v-for="variable in colorGroups[activeColorGroup].vars"
              :key="variable.key"
          >
            <!-- Big preview swatch (read-only) -->
            <ColorPicker
                :model-value="colors[variable.key]"
                @update:model-value="onColorChange(variable.key, $event)"
            />
            <div class="color-row__info">
              <span class="color-row__label">{{ variable.label }}</span>
              <span class="color-row__var">{{ variable.key }}</span>
            </div>
            <div class="color-row__controls">
              <input type="text" class="color-row__raw" v-model="colors[variable.key]">
            </div>
          </div>
        </div>
      </section>
      <section class="params" v-else>
        <p style="color: var(--text-additional); padding: 1rem 0;">Загрузка настроек цветов…</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.file-upload-area {
  padding: 4px;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-primary);
  text-align: center;
  cursor: pointer;
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
  position: relative;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.file-drop-zone__hint {
  margin: 0 4px;
  color: var(--text-dark);
}
.file-preview__remove {
  position: absolute;
  background: none;
  border: none;
  border-radius: 50%;
  color: var(--text-primary);
  font-size: 24px;
  cursor: pointer;
  min-height: 32px;
  min-width: 32px;
  top: -16px;
  right: -16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease-in-out;
}
.file-preview__remove:hover {
  color: var(--header-secondary);
  background: var(--hover-primary);
  box-shadow: var(--shadow-primary);
  transform: rotate(90deg);
}
.file-preview__remove:active {
  color: var(--header-secondary);
  background: var(--hover-primary);
  box-shadow: var(--shadow-primary), inset var(--shadow-additional);
  transform: rotate(180deg);
}
.color-settings {
  margin-top: 2rem;
}
.color-settings__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: .75rem;
  margin-bottom: 1.25rem;
}
.color-settings__header h2 { margin: 0; }
.color-settings__actions { display: flex; gap: .5rem; flex-wrap: wrap; }
/* ── Tabs ──────────────────────────────────────────────── */
.color-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: .4rem;
  margin-bottom: 1.25rem;
  border-bottom: 2px solid var(--border-color, rgba(0,0,0,.1));
  padding-bottom: .75rem;
}
.color-tab {
  background: none;
  border: 1px solid var(--border-color, rgba(0,0,0,.12));
  border-radius: 6px;
  padding: .3rem .75rem;
  font-size: .8rem;
  cursor: pointer;
  color: var(--text-secondary, #475569);
  transition: background .15s, color .15s, border-color .15s;
  white-space: nowrap;
}
.color-tab:hover {
  background: var(--surface-hover, rgba(99,102,241,.08));
  border-color: var(--primary, #6d7bba);
  color: var(--primary, #6d7bba);
}
.color-tab.active {
  background: var(--primary, #6d7bba);
  border-color: var(--primary, #6d7bba);
  color: #fff;
  font-weight: 600;
}
/* ── Color grid ────────────────────────────────────────── */
.color-grid {
  display: flex; flex-direction: column; gap: .45rem;
}
.color-row {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .5rem .75rem;
  border-radius: 8px;
  background: var(--surface-color, #fff);
  border: 1px solid var(--border-color, rgba(0,0,0,.1));
  transition: box-shadow .15s;
}
.color-row:hover {
  box-shadow: 0 2px 8px var(--shadow-color, rgba(15,23,42,.08));
}
.color-row__preview {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid rgba(0,0,0,.1);
  flex-shrink: 0;
}
.color-row__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: .1rem;
}
.color-row__label {
  font-size: .875rem;
  font-weight: 500;
  color: var(--text-primary, #0f172a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.color-row__var {
  font-size: .7rem;
  font-family: monospace;
  color: var(--text-secondary, #475569);
  opacity: .7;
}
.color-row__controls {
  display: flex;
  align-items: center;
  gap: .5rem;
  flex-shrink: 0;
}
.color-row__raw {
  color: var(--text-secondary, #475569);
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 4px;
  border-radius: 4px;
  opacity: .75;
  max-width: 140px;
  font-family: monospace;
  font-size: .7rem;
  overflow: hidden;
}
.form-group > label {
  display: flex;
  cursor: pointer;
}
label input[type=checkbox] {
  margin-right: 12px;
}
/* ── Extra button variants ─────────────────────────────── */
.btn-outline {
  background: transparent;
  border: 1px solid var(--primary, #6d7bba);
  color: var(--primary, #6d7bba);
}
.btn-outline:hover {
  background: var(--primary, #6d7bba); color: #fff;
}
.btn-danger-outline {
  background: transparent;
  border: 1px solid var(--error-bg, #dc3545);
  color: var(--error-bg, #dc3545);
}
.btn-danger-outline:hover {
  background: var(--error-bg, #dc3545); color: #fff;
}
</style>