<script>
export default {
  name: 'OrderModal',
  inject: ['params'],
  props: {
    modelValue:          { type: Boolean, default: false },
    currentOrderProduct: { type: Object,  default: null },
    cartItems:           { type: Array,   default: () => [] },
    cartTotal:           { type: Number,  default: 0 },
  },
  emits: ['update:modelValue', 'order-success'],
  data() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return {
      orderLoading: false,
      orderError:   '',
      orderSuccess: '',
      localOrderProduct: null,
      localCartItems:    [],
      orderForm: {
        customer_name:     '',
        customer_phone:    '',
        customer_email:    '',
        delivery_type:     'pickup',
        delivery_city:     '',
        delivery_street:   '',
        delivery_building: '',
        delivery_date:     '',
        delivery_time:     '',
        payment_type:      'cash',
        notes:             '',
      },
      fieldErrors: {
        customer_name:     '',
        customer_phone:    '',
        delivery_city:     '',
        delivery_street:   '',
        delivery_building: '',
        policy:            '',
      },
      deliveryCityValid:   false,
      deliveryStreetValid: false,
      deliveryCityError:   '',
      deliveryStreetError: '',
      citySuggestions:     [],
      streetSuggestions:   [],
      citySearchLoading:   false,
      streetSearchLoading: false,
      policyYes: false,
      policyNo:  false,
      today: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      _cityTimer:   null,
      _streetTimer: null,
    };
  },
  computed: {
    deliveryBel() {
      return Number(this.params?.delivery_bel || 0);
    },
    deliveryRus() {
      return Number(this.params?.delivery_rus || 0);
    },
    deliveryAvailable() {
      const v = this.params?.delivery_bel || this.params?.delivery_rus;
      return !!v && Number(v) > 0;
    },
    pickupAddress() { return this.params?.pickup_address || ''; },
    workHours()     { return this.params?.work_hours     || ''; },
    storePhone()    { return this.params?.store_phone    || ''; },
    deliveryAddressPreview() {
      return [
        this.orderForm.delivery_city,
        this.orderForm.delivery_street,
        this.orderForm.delivery_building,
      ].filter(Boolean).join(', ');
    },
    deliveryCost() {
      if (this.orderForm.delivery_type !== 'delivery' || !this.orderForm.delivery_city) return 0;
      return this.orderForm.delivery_city.includes('Беларусь') ? this.deliveryBel : this.deliveryRus;
    },
    baseTotal() {
      if (this.localOrderProduct) {
        return this.localOrderProduct.price * this.localOrderProduct.quantity;
      }
      return this.localCartItems.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);
    },
    grandTotal() {
      return this.baseTotal + this.deliveryCost;
    },
  },
  watch: {
    modelValue(val) {
      if (val) {
        this.orderError   = '';
        this.orderSuccess = '';
        this.fieldErrors  = { customer_name: '', customer_phone: '', delivery_city: '', delivery_street: '', delivery_building: '', policy: '' };
        this.localOrderProduct = this.currentOrderProduct ? { ...this.currentOrderProduct } : null;
        this.localCartItems    = Array.isArray(this.cartItems) ? this.cartItems.map(i => ({ ...i })) : [];
      }
    },
    currentOrderProduct(val) {
      this.localOrderProduct = val ? { ...val } : null;
    },
    cartItems(val) {
      this.localCartItems = Array.isArray(val) ? val.map(i => ({ ...i })) : [];
    },
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false);
    },
    increaseCurrentOrderQuantity() {
      if (this.localOrderProduct) this.localOrderProduct.quantity++;
    },
    decreaseCurrentOrderQuantity() {
      if (this.localOrderProduct && this.localOrderProduct.quantity > 1) this.localOrderProduct.quantity--;
    },
    increaseQuantity(item) { item.quantity++; },
    decreaseQuantity(item) { if (item.quantity > 1) item.quantity--; },
    removeFromCart(item) {
      const idx = this.localCartItems.findIndex(
          i => i.id === item.id && (i.optionKey || '') === (item.optionKey || '')
      );
      if (idx > -1) this.localCartItems.splice(idx, 1);
    },
    policyChange(val) {
      if (val === 'yes') this.policyNo = false;
      else this.policyYes = false;
      this.fieldErrors.policy = '';
    },
    onDeliveryTypeChange() {
      this.orderForm.delivery_city     = '';
      this.orderForm.delivery_street   = '';
      this.orderForm.delivery_building = '';
      this.deliveryCityValid   = false;
      this.deliveryStreetValid = false;
      this.citySuggestions     = [];
      this.streetSuggestions   = [];
    },
    async onCityInput() {
      const q = this.orderForm.delivery_city.trim();
      this.deliveryCityValid = false;
      this.deliveryCityError = '';
      this.citySuggestions   = [];
      clearTimeout(this._cityTimer);
      if (q.length < 2) return;
      this.citySearchLoading = true;
      this._cityTimer = setTimeout(async () => {
        try {
          const r = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`,
              { headers: { 'Accept-Language': 'ru' } }
          );
          const data = await r.json();
          this.citySuggestions = data.map(item => ({
            place_id: item.place_id,
            label:    item.display_name.split(',').slice(0, 2).join(', ').trim(),
            region:   item.address?.state || item.address?.country || '',
          }));
        } catch { this.citySuggestions = []; }
        finally   { this.citySearchLoading = false; }
      }, 400);
    },
    onCityBlur() {
      setTimeout(() => { this.citySuggestions = []; }, 200);
    },
    selectCity(city) {
      this.orderForm.delivery_city = city.label;
      this.deliveryCityValid       = true;
      this.deliveryCityError       = '';
      this.citySuggestions         = [];
      this.orderForm.delivery_street = '';
      this.deliveryStreetValid       = false;
    },
    async onStreetInput() {
      const q    = this.orderForm.delivery_street.trim();
      const city = this.orderForm.delivery_city.trim();
      this.deliveryStreetValid = false;
      this.deliveryStreetError = '';
      this.streetSuggestions   = [];
      clearTimeout(this._streetTimer);
      if (q.length < 2 || !city) return;
      this.streetSearchLoading = true;
      this._streetTimer = setTimeout(async () => {
        try {
          const r = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ', ' + city)}&limit=5&addressdetails=1`,
              { headers: { 'Accept-Language': 'ru' } }
          );
          const data = await r.json();
          this.streetSuggestions = data.map(item => ({
            place_id: item.place_id,
            label:    item.address?.road || item.display_name.split(',')[0].trim(),
          }));
        } catch { this.streetSuggestions = []; }
        finally   { this.streetSearchLoading = false; }
      }, 400);
    },
    onStreetBlur() {
      setTimeout(() => { this.streetSuggestions = []; }, 200);
    },
    selectStreet(street) {
      this.orderForm.delivery_street = street.label;
      this.deliveryStreetValid       = true;
      this.deliveryStreetError       = '';
      this.streetSuggestions         = [];
    },
    clearInput(type) {
      if (type === 'city') {
        this.orderForm.delivery_city   = '';
        this.orderForm.delivery_street = '';
        this.deliveryCityValid         = false;
        this.deliveryStreetValid       = false;
        this.citySuggestions           = [];
        this.streetSuggestions         = [];
      } else if (type === 'street') {
        this.orderForm.delivery_street = '';
        this.deliveryStreetValid       = false;
        this.streetSuggestions         = [];
      }
    },
    validate() {
      this.fieldErrors = { customer_name: '', customer_phone: '', delivery_city: '', delivery_street: '', delivery_building: '', policy: '' };
      let ok = true;
      if (!this.orderForm.customer_name.trim())  { this.fieldErrors.customer_name  = 'Введите ваше имя';       ok = false; }
      if (!this.orderForm.customer_phone.trim()) { this.fieldErrors.customer_phone = 'Введите номер телефона'; ok = false; }
      if (this.orderForm.delivery_type === 'delivery') {
        if (!this.orderForm.delivery_city.trim())     { this.fieldErrors.delivery_city     = 'Укажите город';       ok = false; }
        if (!this.orderForm.delivery_street.trim())   { this.fieldErrors.delivery_street   = 'Укажите улицу';       ok = false; }
        if (!this.orderForm.delivery_building.trim()) { this.fieldErrors.delivery_building = 'Укажите дом/кварт.'; ok = false; }
      }
      if (!this.policyYes && !this.policyNo) { this.fieldErrors.policy = 'Необходимо ответить на согласие с политикой'; ok = false; }
      return ok;
    },
    async submitOrder() {
      if (!this.validate()) return;
      this.orderLoading = true;
      this.orderError   = '';
      this.orderSuccess = '';
      try {
        const items = this.localOrderProduct ? [this.localOrderProduct] : this.localCartItems;
        const body = {
          customer_name:    this.orderForm.customer_name.trim(),
          customer_phone:   this.orderForm.customer_phone.trim(),
          customer_email:   this.orderForm.customer_email.trim(),
          delivery_type:    this.orderForm.delivery_type,
          delivery_address: this.orderForm.delivery_type === 'delivery' ? this.deliveryAddressPreview : '',
          delivery_date:    this.orderForm.delivery_date,
          delivery_time:    this.orderForm.delivery_time,
          payment_type:     this.orderForm.payment_type,
          order_items:      items,
          total_amount:     this.grandTotal,
          notes:            this.orderForm.notes.trim(),
          policy_agreed:    this.policyYes,
        };
        const r    = await fetch('/api/orders', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const json = await r.json();
        if (!json.success) throw new Error(json.error || 'Ошибка');
        this.orderSuccess = 'Заказ оформлен! Мы свяжемся с вами.';
        this.$emit('order-success');
        setTimeout(() => this.close(), 3000);
      } catch (e) {
        this.orderError = e.message;
      } finally {
        this.orderLoading = false;
      }
    },
    async handleOnlinePayment() {
      await this.submitOrder();
    },
  },
};
</script>

<template>
  <div v-if="modelValue" class="order-modal" @click.self="close">
    <div class="order-modal-content">
      <div class="order-header">
        <h3>Оформление заказа</h3>
        <button class="close-icon" @click="close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="order-content">
        <div class="order-summary">
          <h4>Ваш заказ</h4>
          <div class="order-items">
            <div v-if="localOrderProduct" class="order-item">
              <img :src="localOrderProduct.image" :alt="localOrderProduct.name" class="order-item-img" loading="lazy" decoding="async">
              <div class="order-item-details">
                <h5>{{ localOrderProduct.name }}</h5>
                <template v-if="localOrderProduct.options && localOrderProduct.options.length">
                  <p v-for="option in localOrderProduct.options" :key="`order-product-option-${option.slug}`">
                    {{ option.name }}: {{ option.value }}
                  </p>
                </template>
                <p v-if="localOrderProduct.material">{{ localOrderProduct.material }}</p>
                <div class="order-item-quantity">
                  <span>
                    Количество:
                    <button type="button" class="qty-btn" @click="decreaseCurrentOrderQuantity">−</button>
                    <strong>{{ localOrderProduct.quantity }}</strong>
                    <button type="button" class="qty-btn" @click="increaseCurrentOrderQuantity">+</button>
                  </span>
                  <span class="order-item-price">{{ localOrderProduct.price * localOrderProduct.quantity }} руб.</span>
                </div>
              </div>
            </div>
            <div v-else v-for="item in localCartItems" :key="`${item.id}-${item.optionKey || ''}`" class="order-item">
              <img :src="item.image" :alt="item.name" class="order-item-img" loading="lazy" decoding="async">
              <div class="order-item-details">
                <div class="cart-item-title-content">
                  <h5>{{ item.name }}</h5>
                  <span @click="removeFromCart(item)" class="remove-item-btn"><i class="fa-solid fa-xmark"></i></span>
                </div>
                <template v-if="item.options && item.options.length">
                  <p v-for="option in item.options" :key="`order-cart-option-${item.id}-${option.slug}`">
                    {{ option.name }}: {{ option.value }}
                  </p>
                </template>
                <p v-if="item.material">{{ item.material }}</p>
                <div class="order-item-quantity">
                  <span>
                    Количество:
                    <button type="button" class="qty-btn" @click="decreaseQuantity(item)">−</button>
                    <strong>{{ item.quantity }}</strong>
                    <button type="button" class="qty-btn" @click="increaseQuantity(item)">+</button>
                  </span>
                  <span class="order-item-price">{{ item.price * item.quantity }} руб.</span>
                </div>
              </div>
            </div>
          </div>
          <div class="order-total">
            <span>Итого: {{ grandTotal }} руб.</span>
          </div>
        </div>

        <form @submit.prevent="submitOrder" class="order-form">
          <div class="form-section">
            <h4>Контактная информация</h4>
            <div class="form-group">
              <label for="customer_name">Имя *</label>
              <input type="text" id="customer_name" v-model="orderForm.customer_name" @input="fieldErrors.customer_name = ''" required>
              <div v-if="fieldErrors.customer_name" class="field-tooltip">{{ fieldErrors.customer_name }}</div>
            </div>
            <div class="form-group">
              <label for="customer_phone">Телефон *</label>
              <input type="tel" id="customer_phone" v-model="orderForm.customer_phone" @input="fieldErrors.customer_phone = ''" required>
              <div v-if="fieldErrors.customer_phone" class="field-tooltip">{{ fieldErrors.customer_phone }}</div>
            </div>
            <div class="form-group">
              <label for="customer_email">
                Email<span v-if="orderForm.payment_type === 'online'"> *</span>
              </label>
              <input type="email" id="customer_email" v-model="orderForm.customer_email" :required="orderForm.payment_type === 'online'">
            </div>
          </div>

          <div class="form-section">
            <h4>Способ получения</h4>
            <div class="delivery-options">
              <label class="delivery-option">
                <input type="radio" v-model="orderForm.delivery_type" value="pickup" @change="onDeliveryTypeChange">
                <div class="delivery-option-content">
                  <i class="fas fa-store"></i>
                  <div>
                    <span class="delivery-option-title">Самовывоз</span>
                    <span class="delivery-option-description">Забрать в магазине</span>
                  </div>
                </div>
              </label>
              <label class="delivery-option">
                <input type="radio" v-model="orderForm.delivery_type" value="delivery" @change="onDeliveryTypeChange" :disabled="!deliveryAvailable">
                <div class="delivery-option-content">
                  <i class="fas fa-truck"></i>
                  <div>
                    <span class="delivery-option-title">Доставка</span>
                    <span class="delivery-option-description">Доставка по адресу</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div v-if="orderForm.delivery_type === 'delivery'" class="form-section delivery-details">
            <h4>Детали доставки</h4>
            <div class="form-group autocomplete">
              <label for="delivery_city">Город *</label>
              <div class="input-wrapper">
                <input type="text" id="delivery_city" v-model="orderForm.delivery_city" @input="onCityInput" @blur="onCityBlur"
                       autocomplete="off" placeholder="Введите свой город"
                       :class="{ 'invalid': deliveryCityError || fieldErrors.delivery_city }">
                <span class="clear-input fas fa-x" @click="clearInput('city')"></span>
              </div>
              <p class="input-hint">Укажите свой город</p>
              <div v-if="citySearchLoading" class="autocomplete-status">Ищем города...</div>
              <div v-else-if="orderForm.delivery_city && !citySuggestions.length && !deliveryCityValid" class="autocomplete-status warning">Город не найден</div>
              <ul v-if="citySuggestions.length" class="autocomplete-list">
                <li v-for="city in citySuggestions" :key="city.place_id" @mousedown.prevent="selectCity(city)">
                  <span>{{ city.label }}</span>
                  <small v-if="city.region">{{ city.region }}</small>
                </li>
              </ul>
              <p v-if="deliveryCityError" class="input-error">{{ deliveryCityError }}</p>
              <div v-if="fieldErrors.delivery_city" class="field-tooltip">{{ fieldErrors.delivery_city }}</div>
            </div>
            <div class="form-group autocomplete">
              <label for="delivery_street">Улица *</label>
              <div class="input-wrapper">
                <input type="text" id="delivery_street" v-model="orderForm.delivery_street" @input="onStreetInput" @blur="onStreetBlur"
                       :disabled="!deliveryCityValid" autocomplete="off" placeholder="Введите улицу"
                       :class="{ 'invalid': deliveryStreetError || fieldErrors.delivery_street }">
                <span class="clear-input fas fa-x" @click="clearInput('street')"></span>
              </div>
              <p class="input-hint">Сначала выберите город, затем улицу</p>
              <div v-if="streetSearchLoading" class="autocomplete-status">Ищем улицы...</div>
              <div v-else-if="orderForm.delivery_street && !streetSuggestions.length && !deliveryStreetValid" class="autocomplete-status warning">Улица не найдена</div>
              <ul v-if="streetSuggestions.length" class="autocomplete-list">
                <li v-for="street in streetSuggestions" :key="street.place_id" @mousedown.prevent="selectStreet(street)">
                  <span>{{ street.label }}</span>
                </li>
              </ul>
              <p v-if="deliveryStreetError" class="input-error">{{ deliveryStreetError }}</p>
              <div v-if="fieldErrors.delivery_street" class="field-tooltip">{{ fieldErrors.delivery_street }}</div>
            </div>
            <div class="form-group">
              <label for="delivery_building">Дом / квартира *</label>
              <input type="text" id="delivery_building" v-model="orderForm.delivery_building"
                     @input="fieldErrors.delivery_building = ''" placeholder="Например: д. 10, кв. 15" required>
              <div v-if="fieldErrors.delivery_building" class="field-tooltip">{{ fieldErrors.delivery_building }}</div>
            </div>
            <div class="delivery-address-preview" v-if="deliveryAddressPreview">
              <strong>Адрес доставки:</strong>
              <span>{{ deliveryAddressPreview }}</span>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="delivery_date">Дата доставки</label>
                <input type="date" id="delivery_date" v-model="orderForm.delivery_date" :min="today">
              </div>
              <div class="form-group">
                <label for="delivery_time">Время доставки</label>
                <input type="time" id="delivery_time" v-model="orderForm.delivery_time">
              </div>
            </div>
            <span class="delivery-cost-line">
              Стоимость доставки: <strong>{{ deliveryCost }}</strong> руб.
            </span>
          </div>

          <div v-if="orderForm.delivery_type === 'pickup'" class="form-section pickup-details">
            <h4>Информация о самовывозе</h4>
            <div class="pickup-info">
              <p v-if="pickupAddress"><i class="fas fa-map-marker-alt"></i> {{ pickupAddress }}</p>
              <p v-if="workHours"><i class="fas fa-clock"></i> {{ workHours }}</p>
              <p v-if="storePhone"><i class="fas fa-phone"></i> {{ storePhone }}</p>
            </div>
          </div>

          <div class="form-section">
            <h4>Способ оплаты</h4>
            <div class="payment-options">
              <label class="payment-option">
                <input type="radio" v-model="orderForm.payment_type" value="cash">
                <div class="payment-option-content">
                  <i class="fa-solid fa-wallet"></i>
                  <div>
                    <span class="payment-option-title">Наличными</span>
                    <span class="payment-option-description">При получении</span>
                  </div>
                </div>
              </label>
              <label class="payment-option">
                <input type="radio" v-model="orderForm.payment_type" value="online">
                <div class="payment-option-content">
                  <i class="fa-solid fa-credit-card"></i>
                  <div>
                    <span class="payment-option-title">Онлайн</span>
                    <span class="payment-option-description">Оплата картой</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div class="form-section">
            <h4>Дополнительно</h4>
            <div class="form-group">
              <label for="order_notes">Комментарий к заказу</label>
              <textarea id="order_notes" v-model="orderForm.notes" rows="3" placeholder="Дополнительные пожелания..."></textarea>
            </div>
          </div>

          <div class="form-section">
            <div class="form-group checkbox-form">
              <input id="privacy-policy-yes" type="checkbox" v-model="policyYes" @change="policyChange('yes')">
              <label class="checkbox-label" for="privacy-policy-yes">
                Согласен с
                <a href="/policy" target="_blank">политикой обработки персональных данных</a>
              </label>
            </div>
            <div class="form-group checkbox-form">
              <input id="privacy-policy-no" type="checkbox" v-model="policyNo" @change="policyChange('no')">
              <label class="checkbox-label" for="privacy-policy-no">
                Не согласен с политикой обработки персональных данных
              </label>
            </div>
            <div v-if="fieldErrors.policy" class="field-tooltip">{{ fieldErrors.policy }}</div>
          </div>

          <div v-if="orderError"   class="error-message">{{ orderError }}</div>
          <div v-if="orderSuccess" class="success-message">{{ orderSuccess }}</div>

          <div class="order-actions">
            <button type="button" class="btn btn-secondary" @click="close">Отмена</button>
            <button v-if="orderForm.payment_type === 'online'" type="button" class="btn btn-primary"
                    @click="handleOnlinePayment" :disabled="orderLoading || (!policyYes && !policyNo)">
              {{ orderLoading ? 'Оформляем заказ...' : 'Оформить заказ' }}
            </button>
            <button v-else type="submit" class="btn btn-primary" :disabled="orderLoading || (!policyYes && !policyNo)">
              {{ orderLoading ? 'Оформляем заказ...' : 'Оформить заказ' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .55);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow-y: auto;
}
.order-modal-content {
  background: var(--background);
  border-radius: 16px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, .4);
  display: flex;
  flex-direction: column;
}
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
  position: sticky;
  top: 0;
  background: var(--background);
  z-index: 1;
  border-radius: 16px 16px 0 0;
}
.order-header h3 { font-size: 22px; color: var(--primary); margin: 0; }
.order-content {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 0;
  flex: 1;
  overflow: hidden;
}
.order-summary {
  padding: 24px;
  border-right: 1px solid var(--border-light);
  overflow-y: auto;
  background: var(--background-secondary);
}
.order-summary h4 { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--primary); }
.order-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
}
.order-item-img { width: 70px; height: 70px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
.order-item-details { flex: 1; min-width: 0; }
.order-item-details h5 { font-size: 14px; font-weight: 600; margin-bottom: 4px; color: var(--text-primary); }
.order-item-details p  { font-size: 12px; color: var(--text-additional); margin-bottom: 2px; }
.cart-item-title-content { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.remove-item-btn { cursor: pointer; color: var(--text-additional); font-size: 12px; padding: 2px; flex-shrink: 0; }
.remove-item-btn:hover { color: var(--primary); }
.order-item-quantity {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}
.qty-btn {
  background: var(--background-additional);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  width: 22px;
  height: 22px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  color: var(--text-primary);
  margin: 0 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.order-item-price { font-weight: 600; color: var(--primary); font-size: 13px; }
.order-total {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
  font-weight: 600;
  font-size: 16px;
  color: var(--primary);
}

/* Form */
.order-form { padding: 24px; overflow-y: auto; }
.form-section { margin-bottom: 24px; }
.form-section h4 { font-size: 15px; font-weight: 600; color: var(--primary); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border-light); }
.form-group { margin-bottom: 14px; position: relative; }
.form-group label { display: block; font-size: 13px; font-weight: 500; color: var(--text-secondary); margin-bottom: 5px; }
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  background: var(--background-secondary);
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus { outline: none; border-color: var(--primary); }
.form-group input.invalid { border-color: #e74c3c; }
.form-group input:disabled { opacity: 0.5; cursor: not-allowed; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field-tooltip {
  font-size: 12px;
  color: #e74c3c;
  margin-top: 4px;
}
.input-hint { font-size: 11px; color: var(--text-additional); margin-top: 3px; }
.input-error { font-size: 12px; color: #e74c3c; margin-top: 4px; }

/* Autocomplete */
.form-group.autocomplete { position: relative; }
.input-wrapper { position: relative; }
.input-wrapper input { padding-right: 28px; }
.clear-input {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: var(--text-additional);
  font-size: 11px;
}
.clear-input:hover { color: var(--text-primary); }
.autocomplete-status { font-size: 12px; color: var(--text-additional); margin-top: 4px; }
.autocomplete-status.warning { color: #e67e22; }
.autocomplete-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--background);
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  list-style: none;
  padding: 4px 0;
  margin: 0;
  z-index: 100;
  box-shadow: 0 4px 16px rgba(0,0,0,.15);
  max-height: 200px;
  overflow-y: auto;
}
.autocomplete-list li {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}
.autocomplete-list li:hover { background: var(--background-secondary); }
.autocomplete-list li small { color: var(--text-additional); font-size: 11px; }

/* Delivery */
.delivery-options { display: flex; gap: 12px; flex-wrap: wrap; }
.delivery-option { flex: 1; min-width: 120px; }
.delivery-option input[type="radio"] { display: none; }
.delivery-option-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 2px solid var(--border-medium);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.delivery-option input[type="radio"]:checked + .delivery-option-content { border-color: var(--primary); background: var(--background-secondary); }
.delivery-option input[type="radio"]:disabled + .delivery-option-content { opacity: 0.4; cursor: not-allowed; }
.delivery-option-content i { font-size: 20px; color: var(--primary); }
.delivery-option-title { display: block; font-weight: 600; font-size: 13px; }
.delivery-option-description { display: block; font-size: 11px; color: var(--text-additional); }
.delivery-address-preview {
  background: var(--background-secondary);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.delivery-cost-line { font-size: 13px; color: var(--text-secondary); display: block; margin-top: 8px; }

/* Pickup */
.pickup-info p { font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
.pickup-info i  { color: var(--primary); width: 16px; text-align: center; }

/* Payment */
.payment-options { display: flex; gap: 12px; flex-wrap: wrap; }
.payment-option { flex: 1; min-width: 120px; }
.payment-option input[type="radio"] { display: none; }
.payment-option-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 2px solid var(--border-medium);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.payment-option input[type="radio"]:checked + .payment-option-content { border-color: var(--primary); background: var(--background-secondary); }
.payment-option-content i { font-size: 20px; color: var(--primary); }
.payment-option-title { display: block; font-weight: 600; font-size: 13px; }
.payment-option-description { display: block; font-size: 11px; color: var(--text-additional); }

/* Checkbox */
.checkbox-form { display: flex; align-items: flex-start; gap: 10px; }
.checkbox-form input[type="checkbox"] { margin-top: 2px; flex-shrink: 0; accent-color: var(--primary); width: 16px; height: 16px; }
.checkbox-label { font-size: 13px; color: var(--text-secondary); line-height: 1.4; }
.checkbox-label a { color: var(--primary); }

/* Actions */
.order-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }
.error-message   { background: rgba(231,76,60,.1);  color: #e74c3c; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; }
.success-message { background: rgba(46,204,113,.1); color: #2ecc71; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; }

@media (max-width: 680px) {
  .order-content { grid-template-columns: 1fr; }
  .order-summary { border-right: none; border-bottom: 1px solid var(--border-light); }
  .order-modal-content { max-height: 95vh; border-radius: 12px; }
}
</style>
