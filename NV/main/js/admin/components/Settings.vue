<script>
import { uploadImage } from "./service";

export default {
  name: "Settings",
  props: {
    uploadImage: Function
  },
  data() {
    return {
      data: {
        email: '',
        title: '',
        description: '',
        imageMetaTags: '',
        pickupAddress: '',
        workHours: '',
        storePhone: '',
        deliveryBel: '',
        deliveryRus: '',
      }
    }
  },
  mounted() {
    this.loadParams().then(() => null);
  }, methods: {
    async loadParams() {
      try {
        const response = await fetch('../api.php?action=get_params', { credentials: 'same-origin' });

        if (response.ok) {
          const data = await response.json();

          if (data && typeof data === 'object') {
            this.data.email = data.email;
            this.data.title = data.title;
            this.data.description = data.description;
            this.data.imageMetaTags = data.image_meta_tags;
            this.data.pickupAddress = data.pickup_address;
            this.data.workHours = data.work_hours;
            this.data.storePhone = data.store_phone;
            this.data.deliveryBel = data.delivery_bel;
            this.data.deliveryRus = data.delivery_rus;
          }
        }
      } catch (error) {
        console.error('Error loading params:', error);
      }
    },
    async saveParams() {
      try {
        const formData = new FormData();

        formData.append('action', 'save_params');
        formData.append('email', this.data.email || '');
        formData.append('title', this.data.title || '');
        formData.append('description', this.data.description || '');
        formData.append('image_meta_tags', this.data.imageMetaTags || '');
        formData.append('pickup_address', this.data.pickupAddress || '');
        formData.append('work_hours', this.data.workHours || '');
        formData.append('store_phone', this.data.storePhone || '');
        formData.append('delivery_bel', this.data.deliveryBel || 0);
        formData.append('delivery_rus', this.data.deliveryRus || 0);

        const response = await fetch('../api.php', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
          alert('Параметры успешно сохранены');
        } else {
          alert('Ошибка при сохранении параметров: ' + (data.error || 'Неизвестная ошибка'));
        }
      } catch (error) {
        alert('Произошла ошибка при сохранении параметров: ' + error);
      }
    },
    async uploadLogo(e) {
      const result = await uploadImage(this.data.logo ?? e, 'logo', { maxSizeMb: 5, fieldName: 'logo' });

      if (result?.url) {
        alert('Логотип успешно загружен');

        this.data.logo = result.url;
        this.data.logo = null;
      }
    },
  }
}
</script>

<template>
  <main class="admin-main">
    <div class="container">
      <section class="params">
        <form class="main-params" @submit.prevent>
          <div class="form-group">
            <h3>Логотип сайта</h3>
            <img v-if="data.logoUrl" :src="data.logoUrl" alt="Логотип" style="max-height: 60px;" />
            <input type="file" name="logo" accept="image/*" @change="data.logo = $event.target.files[0]" />
            <button type="button" class="btn" @click.prevent="uploadLogo" :disabled="!data.logo">Загрузить</button>
          </div>
          <div class="form-group">
            <label>Электронная почта</label>
            <input type="text" v-model="data.email" placeholder="mail@example.com">
          </div>
          <div class="form-group">
            <label>Заголовок сайта</label>
            <input type="text" v-model="data.title" placeholder="Заголовок">
          </div>
          <div class="form-group">
            <label>Описание сайта</label>
            <textarea v-model="data.description"></textarea>
          </div>
          <div class="form-group">
            <label>Мета-теги изображений товаров</label>
            <textarea v-model="data.imageMetaTags"></textarea>
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
            <label>Белоруссия</label>
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
    </div>
  </main>
</template>

<style scoped>

</style>