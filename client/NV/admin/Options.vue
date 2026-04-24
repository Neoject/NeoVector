<script>
import {isMobileDevice} from "./service";
import {api} from "../../../server/api";
import {setPageTitle} from "../../../server/src/utils";

export default {
  name: "Options",
  inject: ['params'],
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
    setPageTitle(this.params.title, 'типы и опции товаров');
    this.loadProductTypes().then(() => null);
  },
  methods: {
    isMobileDevice,
    async loadProductOptions() {
      try {
        const response = await api.getProductOptions(this.selectedProductTypeId);

        if (response.ok) {
          const data = await response.json();

          this.productOptions = data.options.map(type => ({
            id: type.id || null,
            name: type.name || '',
            values: Array.isArray(type.values) && type.values.length ? [...type.values] : [''],
          }));
        }
        this.optionsError = '';
        this.newOptionName = '';
      } catch (error) {
        this.optionsError = 'Ошибка загрузки опций';
      }
    },
    async loadProductTypes() {
      try {
        const response = await api.getProductTypes();

        if (response.ok) {
          const data = await response.json();

          this.productTypes = Array.isArray(data.types)
              ? data.types.map(type => ({ id: type.id || null, name: type.name || '' }))
              : [];

          const stillExists = this.selectedProductTypeId
              && this.productTypes.some(t => t.id === this.selectedProductTypeId);

          if (!stillExists && this.productTypes.length) {
            this.selectedProductTypeId = this.productTypes[0].id || null;
          } else if (!this.productTypes.length) {
            this.selectedProductTypeId = null;
            this.productOptions = [];
          }
        }
        this.newProductTypeName = '';
      } catch (error) {
        this.typesError = 'Ошибка загрузки типов товаров';
      }
    },
    async saveProductOptions() {
      this.optionsLoading = true;
      const currentTypeId = parseInt(this.selectedProductTypeId, 10);

      if (!currentTypeId) {
        this.optionsError = 'Сначала выберите тип товара';
        this.optionsLoading = false;
        return;
      }
      try {
        const preparedOptions = this.productOptions
            .map(t => ({ name: (t.name || '').trim(), values: t.values.map(v => v?.trim()).filter(Boolean) }))
            .filter(t => t.name && t.values.length);

        const response = await api.saveProductOptions({ option_types: preparedOptions, type_id: currentTypeId });
        const result = await response.json();

        if (response.ok && result.success) {
          this.optionsSuccess = 'Опции успешно сохранены';
          setTimeout(() => { this.optionsSuccess = ''; }, 3000);
        } else {
          this.optionsError = result.error || 'Ошибка сохранения';
        }
      } catch {
        this.optionsError = 'Ошибка сохранения опций';
      }

      this.optionsLoading = false;
    },
    async saveProductTypes() {
      this.typesLoading = true;
      this.typesError = '';

      try {
        const preparedTypes = this.productTypes.map(t => ({ name: (t.name || '').trim() })).filter(t => t.name);

        if (!preparedTypes.length) {
          this.typesError = 'Добавьте хотя бы один тип';
          this.typesLoading = false;
          return;
        }

        const response = await api.saveProductTypes({
          types: preparedTypes
        });

        const result = await response.json();

        if (response.ok && result.success) {
          this.typesSuccess = 'Типы товаров успешно сохранены';
          setTimeout(() => { this.typesSuccess = ''; }, 3000);

          const selectedWasNew = this.selectedProductTypeId === null;
          const prevName = selectedWasNew
              ? null
              : this.productTypes.find(t => t.id === this.selectedProductTypeId)?.name;

          const r2 = await api.getProductTypes();
          if (r2.ok) {
            const d2 = await r2.json();
            this.productTypes = Array.isArray(d2.types)
                ? d2.types.map(t => ({ id: t.id, name: t.name }))
                : [];

            const match = prevName ? this.productTypes.find(t => t.name === prevName) : null;
            const newId = selectedWasNew
                ? (this.productTypes[this.productTypes.length - 1]?.id ?? null)
                : (match?.id ?? this.productTypes[0]?.id ?? null);

            this.selectedProductTypeId = newId;
            await this.loadProductOptions();
          }
        } else {
          this.typesError = result.error || 'Ошибка сохранения';
        }
      } catch {
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
    moveOptionTypeDown(typeIndex) {
      if (typeIndex < 0 || typeIndex >= this.productOptions.length - 1) {
        return;
      }

      const temp = this.productOptions[typeIndex];
      this.productOptions[typeIndex] = this.productOptions[typeIndex + 1];
      this.productOptions[typeIndex + 1] = temp;
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
            <div class="option-item-title type-select-box">
              <label>Тип товара</label>
              <select v-model="selectedProductTypeId" class="option-input option-type-input option-title type-select">
                <option v-for="type in productTypes" :key="type.id" :value="type.id">
                  {{ type.name }}
                </option>
              </select>
            </div>
            <div class="options-group" v-for="(optionType, typeIndex) in productOptions"
                 :key="optionType.id ? 'type-' + optionType.id : 'type-' + typeIndex">
              <div class="option-item-title">
                <label>Название группы опций</label>
                <input type="text" v-model="optionType.name"
                       class="option-input option-type-input option-title"
                       placeholder="Название типа"
                       style="flex: 1; width: 100%"
                >
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
                <button @click="addOptionValue(typeIndex)" class="btn btn-primary" style="margin-top: 10px;">
                  <i class="fas fa-plus"></i> Добавить значение
                </button>
              </div>
            </div>
            <div class="options-group new-option-type">
              <h3>Новый тип опций</h3>
              <div class="options-list">
                <div class="option-item">
                  <input type="text" v-model="newOptionName" class="option-input" placeholder="Например: Цвета">
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
            <button @click="saveProductOptions" class="btn btn-primary" :disabled="optionsLoading">
              <i class="fas fa-save"></i> {{ optionsLoading ? 'Сохранение...' : 'Сохранить опции' }}
            </button>
            <button @click="loadProductOptions" class="btn btn-secondary" :disabled="optionsLoading">
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
              <div class="options-group-header" style="display: flex; align-items: center; gap: 10px;">
                <div class="options-group-controls" style="width: 100%;">
                  <label>Тип товара</label>
                  <select v-model="selectedProductTypeId" class="option-input option-type-input option-title">
                    <option v-for="type in productTypes" :key="type.id" :value="type.id">
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
              <div class="options-group-header" style="display: flex; align-items: center; gap: 10px;">
                <div class="options-group-controls">
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
.options-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  margin-top: 20px;
}
.options-group {
  background: var(--background-secondary);
  padding: 20px;
  border-radius: 10px;
  border: 1px solid var(--border-light);
}
.options-group h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: var(--primary);
}
.options-group-header {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 12px;
}
.option-type-input {
  font-weight: 600;
}
.type-select-box {
  display: flex;
  flex-direction: column;
  grid-column: span 6;
}
.type-select {
  width: 12vw;
}
.option-title {
  padding: 12px !important;
  font-weight: 1100;
  border: 1px solid var(--primary) !important;
}
.option-item-title {
  width: 100%;
  margin-bottom: 12px;
}
.new-option-type {
  background: var(--background-secondary);
  border: 1px dashed var(--border-strong);
}
.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.option-item {
  display: flex;
  gap: 10px;
  align-items: center;
}
.option-input {
  flex: 1;
  padding: 10px;
  background: var(--background-secondary);
  border: 1px solid var(--border-medium);
  border-radius: 5px;
  color: var(--primary);
  font-size: 14px;
}
.option-input:focus {
  outline: none;
  border-color: var(--border-strong);
  background: var(--hover-secondary);
}
.options-actions {
  display: flex;
  gap: 15px;
}
</style>