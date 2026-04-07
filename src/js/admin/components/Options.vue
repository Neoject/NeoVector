<script>
import {isMobileDevice} from "./service";

export default {
  name: "Options",
  data() {
    return {
      productOptions: [],
      newOptionName: '',
      optionsLoading: false,
      optionsError: '',
      optionsSuccess: '',
      productTypes: [],
      newProductTypeName: '',
      selectedProductTypeId: null,
      typesLoading: false,
      typesError: '',
      typesSuccess: '',
    }
  },
  watch: {
    selectedProductTypeId(newVal) {
      if (newVal) {
        this.loadProductOptions().then(() => null);
      } else {
        this.productOptions = [];
      }
    }
  },
  mounted() {
    this.loadProductTypes().then(r => null);
    this.loadProductOptions().then(r => null);
  },
  methods: {
    isMobileDevice,
    async loadProductOptions() {
      try {
        const params = new URLSearchParams();
        params.set('action', 'product_options');

        if (this.selectedProductTypeId) {
          params.set('type_id', this.selectedProductTypeId);
        }

        const response = await fetch('../api.php?' + params.toString(), { credentials: 'same-origin' });

        if (response.ok) {
          const data = await response.json();

          this.productOptions = data.options.map((type) => ({
            id: type.id || null,
            name: type.name || '',
            values: Array.isArray(type.values) && type.values.length ? [...type.values] : ['']
          }));
        } else {
          console.error('Failed to load options', response.error);
        }

        this.optionsError = '';
        this.newOptionName = '';
      } catch (error) {
        alert('Error loading product options:' + error);
        this.newOptionName = '';
      }
    },
    async loadProductTypes() {
      try {
        const response = await fetch('../api.php?action=product_types', { credentials: 'same-origin' });

        if (response.ok) {
          const data = await response.json();

          this.productTypes = Array.isArray(data.types)
              ? data.types.map((type) => ({
                id: type.id || null,
                name: type.name || '',
              }))
              : [];

          if (!this.selectedProductTypeId && this.productTypes.length) {
            this.selectedProductTypeId = this.productTypes[0].id || null;
          }
        } else {
          console.error('Failed to load product types', response.error);
        }

        this.newProductTypeName = '';
      } catch (error) {
        alert('Error loading product types: ' + error);
        this.newProductTypeName = '';
      }
    },
    async saveProductOptions() {
      this.optionsLoading = true;
      this.optionsError = '';
      this.optionsSuccess = '';

      try {
        const currentTypeId = this.selectedProductTypeId ? parseInt(this.selectedProductTypeId, 10) : 0;

        if (!currentTypeId) {
          this.optionsError = 'Сначала выберите тип товара';
          this.optionsLoading = false;
          return;
        }

        const preparedOptions = this.productOptions.map(type => {
          const name = type.name ? type.name.trim() : '';
          const values = Array.isArray(type.values)
              ? type.values
                  .map(value => value && value.trim())
                  .filter(Boolean)
              : [];
          return {
            name,
            values
          };
        }).filter(type => type.name && type.values.length);

        const formData = new FormData();
        formData.append('action', 'save_product_options');
        formData.append('option_types', JSON.stringify(preparedOptions));
        formData.append('type_id', String(currentTypeId));

        const response = await fetch('../api.php', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.optionsSuccess = 'Опции успешно сохранены';
            setTimeout(() => {
              this.optionsSuccess = '';
            }, 3000);
          } else {
            this.optionsError = result.error || 'Ошибка сохранения';
          }
        } else {
          const errorData = await response.json();
          this.optionsError = errorData.error || 'Ошибка сохранения';
        }
      } catch (error) {
        console.error('Error saving product options:', error);
        this.optionsError = 'Ошибка сохранения опций';
      }

      this.optionsLoading = false;
    },
    async saveProductTypes() {
      this.typesLoading = true;
      this.typesError = '';
      this.typesSuccess = '';

      try {
        const preparedTypes = this.productTypes
            .map(type => {
              const name = type.name ? type.name.trim() : '';
              return { name };
            })
            .filter(type => type.name);

        if (!preparedTypes.length) {
          this.typesError = 'Добавьте хотя бы один тип товара';
          this.typesLoading = false;
          return;
        }

        const formData = new FormData();
        formData.append('action', 'save_product_types');
        formData.append('types', JSON.stringify(preparedTypes));

        const response = await fetch('../api.php', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.typesSuccess = 'Типы товаров успешно сохранены';
            setTimeout(() => {
              this.typesSuccess = '';
            }, 3000);
          } else {
            this.typesError = result.error || 'Ошибка сохранения';
          }
        } else {
          const errorData = await response.json();
          this.typesError = errorData.error || 'Ошибка сохранения';
        }
      } catch (error) {
        console.error('Error saving product types:', error);
        this.typesError = 'Ошибка сохранения типов товаров';
      }

      this.typesLoading = false;
    },
    addOptionType() {
      const name = (this.newOptionName || '').trim();
      if (!name) {
        this.optionsError = 'Введите название типа опций';
        return;
      }
      this.productOptions.push({
        id: null,
        name,
        values: ['']
      });
      this.newOptionName = '';
      this.optionsError = '';
    },
    addProductType() {
      const name = (this.newProductTypeName || '').trim();
      if (!name) {
        this.typesError = 'Введите название типа товара';
        return;
      }

      this.productTypes.push({
        id: null,
        name,
      });

      this.newProductTypeName = '';
      this.typesError = '';
    },
    removeOptionType(index) {
      if (confirm('Вы действительно хотите удалить этот список опций?')) {
        this.productOptions.splice(index, 1);
      }
    },
    removeProductType(index) {
      if (!this.productTypes[index]) {
        return;
      }

      if (confirm('Вы действительно хотите удалить этот тип товара?')) {
        this.productTypes.splice(index, 1);
      }
    },
    moveOptionTypeUp(typeIndex) {
      if (typeIndex <= 0 || typeIndex >= this.productOptions.length) {
        return;
      }
      const temp = this.productOptions[typeIndex];
      this.productOptions[typeIndex] = this.productOptions[typeIndex - 1];
      this.productOptions[typeIndex - 1] = temp;
    },
    moveProductTypeUp(index) {
      if (index <= 0 || index >= this.productTypes.length) {
        return;
      }

      const temp = this.productTypes[index];
      this.productTypes[index] = this.productTypes[index - 1];
      this.productTypes[index - 1] = temp;
    },
    moveOptionTypeDown(typeIndex) {
      if (typeIndex < 0 || typeIndex >= this.productOptions.length - 1) {
        return;
      }
      const temp = this.productOptions[typeIndex];
      this.productOptions[typeIndex] = this.productOptions[typeIndex + 1];
      this.productOptions[typeIndex + 1] = temp;
    },
    moveProductTypeDown(index) {
      if (index < 0 || index >= this.productTypes.length - 1) {
        return;
      }

      const temp = this.productTypes[index];
      this.productTypes[index] = this.productTypes[index + 1];
      this.productTypes[index + 1] = temp;
    },
    addOptionValue(typeIndex) {
      if (!this.productOptions[typeIndex]) {
        return;
      }
      this.productOptions[typeIndex].values.push('');
    },
    removeOptionValue(typeIndex, valueIndex) {
      const optionType = this.productOptions[typeIndex];
      optionType.values.splice(valueIndex, 1);
    },
  }
}
</script>

<template>
  <div class="admin-dashboard">
    <main class="admin-main">
      <div class="container">
        <section v-if="!isMobileDevice()">
          <h2>Типы товаров</h2>
          <p style="margin-bottom: 20px; color: #ccc;">
            Создавайте собственные типы товаров и управляйте ими
          </p>
          <div class="options-section">
            <div class="options-group" v-for="(type, index) in productTypes"
                 :key="type.id ? 'product-type-' + type.id : 'product-type-' + index">
              <div class="options-group-header">
                <button v-if="productTypes.length > 1"
                        @click="removeProductType(index)" class="btn btn-danger">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
              <div class="option-item-title">
                <label>Название типа товара</label>
                <input type="text"
                       v-model="type.name"
                       class="option-input option-type-input option-title"
                       placeholder="Ремешки"
                       style="flex: 1; width: 100%">
              </div>
            </div>

            <div class="options-group new-option-type">
              <h3>Новый тип товара</h3>
              <div class="options-list">
                <div class="option-item">
                  <input type="text"
                         v-model="newProductTypeName"
                         class="option-input"
                         placeholder="Ремешки">
                  <button @click="addProductType"
                          class="btn btn-primary"
                          style="padding: 10px 16px;"
                          :disabled="!newProductTypeName || !newProductTypeName.trim()">
                    <i class="fas fa-plus"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="options-actions" style="margin-top: 30px;">
            <button @click="saveProductTypes" class="btn btn-primary"
                    :disabled="typesLoading">
              <i class="fas fa-save"></i> {{ typesLoading ? 'Сохранение...' : 'Сохранить типы' }}
            </button>
            <button @click="loadProductTypes" class="btn btn-secondary"
                    :disabled="typesLoading">
              <i class="fas fa-sync"></i> Обновить
            </button>
          </div>
          <div v-if="typesError" class="alert alert-error" style="margin-top: 15px;">
            {{ typesError }}
          </div>
          <div v-if="typesSuccess" class="alert alert-success" style="margin-top: 15px;">
            {{ typesSuccess }}
          </div>
        </section>
        <section v-if="!isMobileDevice()">
          <h2>Опции товаров</h2>
          <p style="margin-bottom: 20px; color: #ccc;">Создавайте типы опций и управляйте ими</p>
          <div class="options-section">
            <div class="option-item-title" style="grid-column: span 3">
              <label>Тип товара</label>
              <select v-model="selectedProductTypeId"
                      class="option-input option-type-input option-title"
                      style="flex: 1; width: 100%">
                <option v-for="type in productTypes"
                        :key="type.id"
                        :value="type.id">
                  {{ type.name }}
                </option>
              </select>
            </div>
            <div class="options-group" v-for="(optionType, typeIndex) in productOptions"
                 :key="optionType.id ? 'type-' + optionType.id : 'type-' + typeIndex">
              <div class="options-group-header">
                <button @click="moveOptionTypeUp(typeIndex)" class="btn btn-secondary"
                        style="margin-left: auto" :disabled="typeIndex === 0"
                        title="Переместить вверх">
                  <i class="fas fa-arrow-left"></i>
                </button>
                <button v-if="productOptions.length > 1"
                        @click="removeOptionType(typeIndex)" class="btn btn-danger">
                  <i class="fas fa-trash"></i>
                </button>
                <button @click="moveOptionTypeDown(typeIndex)"
                        class="btn btn-secondary"
                        style="margin-right: auto"
                        :disabled="typeIndex === productOptions.length - 1"
                        title="Переместить вниз">
                  <i class="fas fa-arrow-right"></i>
                </button>
              </div>
              <div class="option-item-title">
                <label>Название группы опций</label>
                <input type="text" v-model="optionType.name"
                       class="option-input option-type-input option-title"
                       placeholder="Название типа (например, Размеры)"
                       style="flex: 1; width: 100%">
              </div>

              <div class="options-list">
                <div v-for="(value, valueIndex) in optionType.values"
                     :key="'type-' + typeIndex + '-value-' + valueIndex" class="option-item">
                  <input type="text" v-model="optionType.values[valueIndex]"
                         class="option-input"
                         :placeholder="'Значение для ' + optionType.name || 'опции'">
                  <button @click="removeOptionValue(typeIndex, valueIndex)"
                          class="btn btn-danger" style="padding: 6px 12px;"
                          :disabled="optionType.values.length <= 1">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
                <button @click="addOptionValue(typeIndex)" class="btn btn-primary"
                        style="margin-top: 10px;">
                  <i class="fas fa-plus"></i> Добавить значение
                </button>
              </div>
            </div>
            <div class="options-group new-option-type">
              <h3>Новый тип опций</h3>
              <div class="options-list">
                <div class="option-item">
                  <input type="text" v-model="newOptionName" class="option-input"
                         placeholder="Например: Цвета">
                  <button @click="addOptionType" class="btn btn-primary"
                          style="padding: 10px 16px;"
                          :disabled="!newOptionName || !newOptionName.trim()">
                    <i class="fas fa-plus"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="options-actions" style="margin-top: 30px;">
            <button @click="saveProductOptions" class="btn btn-primary"
                    :disabled="optionsLoading">
              <i class="fas fa-save"></i> {{ optionsLoading ? 'Сохранение...' : 'Сохранить опции' }}
            </button>
            <button @click="loadProductOptions" class="btn btn-secondary"
                    :disabled="optionsLoading">
              <i class="fas fa-sync"></i> Обновить
            </button>
          </div>
          <div v-if="optionsError" class="alert alert-error" style="margin-top: 15px;">
            {{ optionsError }}
          </div>
          <div v-if="optionsSuccess" class="alert alert-success" style="margin-top: 15px;">
            {{ optionsSuccess }}
          </div>
        </section>
        <div class="product-options-container opt-mobile" v-else>
          <h2>Опции товаров</h2>
          <div class="options-section">
            <div class="options-group">
              <div class="options-group-header"
                   style="display: flex; align-items: center; gap: 10px;">
                <div class="options-group-controls" style="width: 100%;">
                  <label>Тип товара</label>
                  <select v-model="selectedProductTypeId"
                          class="option-input option-type-input option-title"
                          style="width: 100%;">
                    <option v-for="type in productTypes"
                            :key="type.id"
                            :value="type.id">
                      {{ type.name }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div class="options-section">
            <div class="options-group" v-for="(optionType, typeIndex) in productOptions"
                 :key="optionType.id ? 'type-' + optionType.id : 'type-' + typeIndex">
              <div class="options-group-header"
                   style="display: flex; align-items: center; gap: 10px;">
                <div class="options-group-controls">
                  <button @click="moveOptionTypeUp(typeIndex)"
                          class="btn btn-secondary" style="margin: 0"
                          :disabled="typeIndex === 0" title="Переместить вверх">
                    <i class="fas fa-arrow-left"></i>
                  </button>
                  <button @click="moveOptionTypeDown(typeIndex)"
                          class="btn btn-secondary" style="margin: 0"
                          :disabled="typeIndex === productOptions.length - 1"
                          title="Переместить вниз">
                    <i class="fas fa-arrow-right"></i>
                  </button>
                  <button v-if="productOptions.length > 1"
                          @click="removeOptionType(typeIndex)" class="btn btn-danger"
                          style="margin: 0">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <input type="text" v-model="optionType.name"
                     class="option-input option-type-input option-title"
                     placeholder="Название типа (например, Размеры)"
                     style="flex: 1; width: 100%">
              <div class="options-list">
                <div v-for="(value, valueIndex) in optionType.values"
                     :key="'type-' + typeIndex + '-value-' + valueIndex" class="option-item">
                  <input type="text" v-model="optionType.values[valueIndex]"
                         class="option-input"
                         :placeholder="'Значение для ' + optionType.name || 'опции'">
                  <button @click="removeOptionValue(typeIndex, valueIndex)"
                          class="btn btn-danger" style="padding: 6px 12px;"
                          :disabled="optionType.values.length <= 1">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
                <button @click="addOptionValue(typeIndex)" class="btn btn-primary"
                        style="margin-top: 10px;">
                  <i class="fas fa-plus"></i> Добавить значение
                </button>
              </div>
            </div>
            <div class="options-group new-option-type">
              <h3>Новый тип опций</h3>
              <div class="options-list">
                <div class="option-item">
                  <input type="text" v-model="newOptionName" class="option-input"
                         placeholder="Например: Цвета"
                         style="height: -webkit-fill-available">
                  <button @click="addOptionType" class="btn btn-primary"
                          style="margin: 0"
                          :disabled="!newOptionName || !newOptionName.trim()">
                    <i class="fas fa-plus"></i> Добавить тип
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="options-actions" style="margin-top: 30px;">
            <button @click="saveProductOptions" class="btn btn-primary"
                    :disabled="optionsLoading">
              <i class="fas fa-save"></i> {{ optionsLoading ? 'Сохранение...' : 'Сохранить опции' }}
            </button>
            <button @click="loadProductOptions" class="btn btn-secondary"
                    :disabled="optionsLoading">
              <i class="fas fa-sync"></i> Обновить
            </button>
          </div>
          <div v-if="optionsError" class="alert alert-error" style="margin-top: 15px;">
            {{ optionsError }}
          </div>
          <div v-if="optionsSuccess" class="alert alert-success" style="margin-top: 15px;">
            {{ optionsSuccess }}
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>

</style>